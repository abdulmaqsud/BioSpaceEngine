import os
import re
import json
from bs4 import BeautifulSoup
from django.core.management.base import BaseCommand, CommandError
from ingestion.models import Study, Section, EvidenceSentence


class Command(BaseCommand):
    help = 'Smart research content extraction with advanced pattern matching'

    def add_arguments(self, parser):
        parser.add_argument(
            '--limit',
            type=int,
            default=None,
            help='Limit number of studies to process (for testing)'
        )
        parser.add_argument(
            '--pmcid',
            type=str,
            default=None,
            help='Process specific PMCID only'
        )
        parser.add_argument(
            '--clear-existing',
            action='store_true',
            help='Clear existing sections before extraction'
        )

    def handle(self, *args, **options):
        limit = options['limit']
        pmcid = options['pmcid']
        clear_existing = options['clear_existing']
        
        if pmcid:
            studies = Study.objects.filter(pmcid=pmcid)
        else:
            studies = Study.objects.all()
            if limit:
                studies = studies[:limit]
        
        self.stdout.write(f"Processing {studies.count()} studies with smart extraction...")
        
        processed = 0
        success = 0
        failed = 0
        
        for study in studies:
            processed += 1
            self.stdout.write(f"Processing {processed}/{studies.count()}: {study.pmcid}")
            
            try:
                self.smart_extract_research_content(study, clear_existing)
                success += 1
                self.stdout.write(self.style.SUCCESS(f"Success: {study.pmcid}"))
            except Exception as e:
                failed += 1
                self.stdout.write(self.style.ERROR(f"Failed: {study.pmcid} - {e}"))
        
        self.stdout.write(
            self.style.SUCCESS(
                f"Completed: {processed} processed, {success} success, {failed} failed"
            )
        )
    
    def smart_extract_research_content(self, study, clear_existing=False):
        """Smart extraction of research content"""
        html_file = f"data/pmc_articles/{study.pmcid}.html"
        
        if not os.path.exists(html_file):
            raise CommandError(f"HTML file not found: {html_file}")
        
        with open(html_file, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Get the main article content
        article = soup.find('article')
        if not article:
            raise CommandError("No article content found in HTML")
        
        # Clear existing sections if requested
        if clear_existing:
            Section.objects.filter(study=study).delete()
            EvidenceSentence.objects.filter(study=study).delete()
        
        # Extract the main text content
        main_text = self.extract_main_text(article)
        
        # Use smart analysis to structure content
        structured_content = self.smart_analyze_content(main_text, study.title)
        
        # Save the structured content
        for section_data in structured_content:
            Section.objects.update_or_create(
                study=study,
                section_type=section_data['type'],
                order=section_data['order'],
                defaults={
                    'title': section_data['title'],
                    'content': section_data['content']
                }
            )
        
        # Extract evidence sentences
        self.extract_evidence_sentences(study)
    
    def extract_main_text(self, article):
        """Extract the main text content from article"""
        # Remove navigation and header elements
        for elem in article.find_all(['nav', 'header', 'footer', 'aside']):
            elem.decompose()
        
        # Remove elements with navigation-related classes
        for elem in article.find_all(class_=re.compile(r'nav|menu|header|footer|sidebar', re.I)):
            elem.decompose()
        
        # Get the main text content
        text = article.get_text()
        
        # Clean up the text
        text = re.sub(r'\s+', ' ', text.strip())
        
        return text
    
    def smart_analyze_content(self, text, title):
        """Smart content analysis using advanced pattern matching"""
        sections = []
        order = 1
        
        # Define research section patterns with more specific matching
        section_patterns = {
            'abstract': [
                r'\bAbstract\b',
                r'\bABSTRACT\b',
                r'^Abstract\s*:',
                r'^ABSTRACT\s*:',
                r'\bAbstract\s*$',
                r'\bABSTRACT\s*$'
            ],
            'introduction': [
                r'\bIntroduction\b',
                r'\bINTRODUCTION\b',
                r'^Introduction\s*:',
                r'^INTRODUCTION\s*:',
                r'\bBackground\b',
                r'\bBACKGROUND\b',
                r'\bOverview\b',
                r'\bOVERVIEW\b'
            ],
            'methods': [
                r'\bMethods?\b',
                r'\bMETHODS?\b',
                r'^Methods?\s*:',
                r'^METHODS?\s*:',
                r'\bMaterials?\s+and\s+Methods?\b',
                r'\bMATERIALS?\s+AND\s+METHODS?\b',
                r'\bExperimental\s+Design\b',
                r'\bEXPERIMENTAL\s+DESIGN\b',
                r'\bProcedures?\b',
                r'\bPROCEDURES?\b'
            ],
            'results': [
                r'\bResults?\b',
                r'\bRESULTS?\b',
                r'^Results?\s*:',
                r'^RESULTS?\s*:',
                r'\bFindings\b',
                r'\bFINDINGS\b',
                r'\bData\b',
                r'\bDATA\b'
            ],
            'discussion': [
                r'\bDiscussion\b',
                r'\bDISCUSSION\b',
                r'^Discussion\s*:',
                r'^DISCUSSION\s*:',
                r'\bInterpretation\b',
                r'\bINTERPRETATION\b'
            ],
            'conclusions': [
                r'\bConclusions?\b',
                r'\bCONCLUSIONS?\b',
                r'^Conclusions?\s*:',
                r'^CONCLUSIONS?\s*:',
                r'\bSummary\b',
                r'\bSUMMARY\b',
                r'\bFinal\s+Remarks\b',
                r'\bFINAL\s+REMARKS\b'
            ]
        }
        
        # Find section boundaries
        section_boundaries = []
        for section_type, patterns in section_patterns.items():
            for pattern in patterns:
                matches = list(re.finditer(pattern, text, re.IGNORECASE | re.MULTILINE))
                for match in matches:
                    section_boundaries.append((match.start(), section_type, match.group()))
        
        # Sort by position
        section_boundaries.sort(key=lambda x: x[0])
        
        # Extract sections
        for i, (start, section_type, title_text) in enumerate(section_boundaries):
            # Get content until next section or end
            if i + 1 < len(section_boundaries):
                end = section_boundaries[i + 1][0]
            else:
                end = len(text)
            
            content = text[start:end].strip()
            
            # Clean up the content
            content = self.clean_research_content(content)
            
            if len(content) > 200:  # Only keep substantial content
                sections.append({
                    'type': section_type,
                    'title': title_text,
                    'content': content,
                    'order': order
                })
                order += 1
        
        # If no sections found, try to extract abstract specifically
        if not sections:
            abstract = self.extract_abstract_specifically(text)
            if abstract:
                sections.append({
                    'type': 'abstract',
                    'title': 'Abstract',
                    'content': abstract,
                    'order': 1
                })
        
        # If still no sections, create a general content section
        if not sections:
            content = self.clean_research_content(text)
            if len(content) > 500:
                sections.append({
                    'type': 'other',
                    'title': 'Research Content',
                    'content': content,
                    'order': 1
                })
        
        return sections
    
    def extract_abstract_specifically(self, text):
        """Try to extract abstract specifically"""
        # Look for abstract patterns
        abstract_patterns = [
            r'Abstract\s*:?\s*(.*?)(?=\n\n|\n[A-Z]|$)',
            r'ABSTRACT\s*:?\s*(.*?)(?=\n\n|\n[A-Z]|$)',
            r'Abstract\s*(.*?)(?=Introduction|Methods|Results|Discussion|Conclusions|$)',
            r'ABSTRACT\s*(.*?)(?=INTRODUCTION|METHODS|RESULTS|DISCUSSION|CONCLUSIONS|$)'
        ]
        
        for pattern in abstract_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                abstract = match.group(1).strip()
                if len(abstract) > 100:
                    return self.clean_research_content(abstract)
        
        return None
    
    def clean_research_content(self, content):
        """Clean research content"""
        if not content:
            return ""
        
        # Remove common navigation elements
        nav_patterns = [
            r'PERMALINK.*?Copy.*?',
            r'As a library, NLM provides access.*?',
            r'Official websites use \.gov.*?',
            r'Here\'s how you know.*?',
            r'Secure \.gov websites use HTTPS.*?',
            r'A lock \(.*?Locked padlock.*?',
            r'Search in PMC.*?',
            r'Search in PubMed.*?',
            r'View in NLM Catalog.*?',
            r'Add to search.*?',
            r'Copyright.*?',
            r'Published by.*?',
            r'All rights reserved.*?'
        ]
        
        for pattern in nav_patterns:
            content = re.sub(pattern, '', content, flags=re.DOTALL | re.IGNORECASE)
        
        # Remove extra whitespace
        content = re.sub(r'\s+', ' ', content.strip())
        
        # Remove leading/trailing punctuation
        content = re.sub(r'^[^\w\s]+', '', content)
        content = re.sub(r'[^\w\s]+$', '', content)
        
        return content
    
    def extract_evidence_sentences(self, study):
        """Extract evidence sentences from study sections"""
        sections = Section.objects.filter(study=study)
        
        for section in sections:
            # Split content into sentences
            sentences = self.split_into_sentences(section.content)
            
            for i, sentence in enumerate(sentences):
                # Only keep sentences that look like research findings
                if self.is_research_sentence(sentence):
                    EvidenceSentence.objects.update_or_create(
                        study=study,
                        section=section,
                        sentence_index=i,
                        defaults={
                            'sentence_text': sentence,
                            'char_start': 0,
                            'char_end': len(sentence)
                        }
                    )
    
    def split_into_sentences(self, text):
        """Split text into sentences"""
        # Simple sentence splitting
        sentences = re.split(r'[.!?]+', text)
        return [s.strip() for s in sentences if s.strip() and len(s.strip()) > 30]
    
    def is_research_sentence(self, sentence):
        """Check if sentence looks like research content"""
        research_indicators = [
            'found', 'showed', 'demonstrated', 'revealed', 'indicated',
            'suggested', 'concluded', 'observed', 'measured', 'analyzed',
            'result', 'effect', 'change', 'increase', 'decrease',
            'significant', 'p-value', 'statistical', 'correlation',
            'study', 'research', 'experiment', 'data', 'analysis',
            'hypothesis', 'method', 'procedure', 'technique',
            'compared', 'difference', 'similar', 'higher', 'lower',
            'correlation', 'association', 'relationship'
        ]
        
        sentence_lower = sentence.lower()
        return (len(sentence) > 50 and 
                any(indicator in sentence_lower for indicator in research_indicators))

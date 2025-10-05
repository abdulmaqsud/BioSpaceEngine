import os
import re
import json
import requests
import time
from bs4 import BeautifulSoup
from django.core.management.base import BaseCommand, CommandError
from ingestion.models import Study, Section, EvidenceSentence


class Command(BaseCommand):
    help = 'AI-powered research content extraction using Hugging Face API'

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
            '--api-key',
            type=str,
            default=None,
            help='Hugging Face API key (or set HF_API_KEY env var)'
        )
        parser.add_argument(
            '--model',
            type=str,
            default='microsoft/DialoGPT-medium',
            help='Hugging Face model to use for extraction'
        )

    def handle(self, *args, **options):
        limit = options['limit']
        pmcid = options['pmcid']
        api_key = options['api_key'] or os.getenv('HF_API_KEY')
        model = options['model']
        
        if not api_key:
            self.stdout.write(
                self.style.ERROR(
                    'Hugging Face API key required. Set HF_API_KEY env var or use --api-key'
                )
            )
            return
        
        if pmcid:
            studies = Study.objects.filter(pmcid=pmcid)
        else:
            studies = Study.objects.all()
            if limit:
                studies = studies[:limit]
        
        self.stdout.write(f"Processing {studies.count()} studies with AI extraction...")
        
        processed = 0
        success = 0
        failed = 0
        
        for study in studies:
            processed += 1
            self.stdout.write(f"Processing {processed}/{studies.count()}: {study.pmcid}")
            
            try:
                self.ai_extract_research_content(study, api_key, model)
                success += 1
                self.stdout.write(self.style.SUCCESS(f"Success: {study.pmcid}"))
                time.sleep(1)  # Rate limiting
            except Exception as e:
                failed += 1
                self.stdout.write(self.style.ERROR(f"Failed: {study.pmcid} - {e}"))
        
        self.stdout.write(
            self.style.SUCCESS(
                f"Completed: {processed} processed, {success} success, {failed} failed"
            )
        )
    
    def ai_extract_research_content(self, study, api_key, model):
        """Use AI to extract and structure research content"""
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
        
        # Extract the main text content
        main_text = self.extract_main_text(article)
        
        # Use AI to analyze and structure the content
        structured_content = self.analyze_with_ai(main_text, study.title, api_key, model)
        
        # Clear existing sections for this study
        Section.objects.filter(study=study).delete()
        
        # Save the structured content
        for section_data in structured_content:
            Section.objects.create(
                study=study,
                section_type=section_data['type'],
                title=section_data['title'],
                content=section_data['content'],
                order=section_data['order']
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
    
    def analyze_with_ai(self, text, title, api_key, model):
        """Use AI to analyze and structure the content"""
        # Create a prompt for the AI
        prompt = f"""
        Analyze this research paper and extract the following sections:
        1. Abstract
        2. Introduction
        3. Methods
        4. Results
        5. Discussion
        6. Conclusions
        
        Paper Title: {title}
        
        Content: {text[:4000]}...
        
        Please return a JSON structure with each section containing:
        - type: section type (abstract, introduction, methods, results, discussion, conclusions)
        - title: section title
        - content: section content (clean research content only, no navigation)
        
        Return only valid JSON.
        """
        
        try:
            # Use Hugging Face Inference API
            response = requests.post(
                f"https://api-inference.huggingface.co/models/{model}",
                headers={"Authorization": f"Bearer {api_key}"},
                json={"inputs": prompt, "parameters": {"max_length": 2000, "temperature": 0.3}}
            )
            
            if response.status_code == 200:
                result = response.json()
                # Parse the AI response and structure it
                return self.parse_ai_response(result, text)
            else:
                # Fallback to smart extraction
                return self.smart_extract_content(text, title)
                
        except Exception as e:
            self.stdout.write(f"AI API failed: {e}, using fallback")
            return self.smart_extract_content(text, title)
    
    def parse_ai_response(self, ai_result, original_text):
        """Parse AI response and extract structured content"""
        sections = []
        order = 1
        
        # Try to extract JSON from AI response
        try:
            if isinstance(ai_result, list) and len(ai_result) > 0:
                content = ai_result[0].get('generated_text', '')
            else:
                content = str(ai_result)
            
            # Look for JSON in the response
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                data = json.loads(json_str)
                
                for section in data:
                    if 'type' in section and 'content' in section:
                        sections.append({
                            'type': section['type'],
                            'title': section.get('title', section['type'].title()),
                            'content': section['content'],
                            'order': order
                        })
                        order += 1
        except:
            pass
        
        # If AI parsing failed, use smart extraction
        if not sections:
            return self.smart_extract_content(original_text, "")
        
        return sections
    
    def smart_extract_content(self, text, title):
        """Smart content analysis using pattern matching (fallback)"""
        sections = []
        order = 1
        
        # Define research section patterns
        section_patterns = {
            'abstract': [
                r'\bAbstract\b',
                r'\bABSTRACT\b',
                r'^Abstract\s*:',
                r'^ABSTRACT\s*:'
            ],
            'introduction': [
                r'\bIntroduction\b',
                r'\bINTRODUCTION\b',
                r'^Introduction\s*:',
                r'^INTRODUCTION\s*:',
                r'\bBackground\b',
                r'\bBACKGROUND\b'
            ],
            'methods': [
                r'\bMethods?\b',
                r'\bMETHODS?\b',
                r'^Methods?\s*:',
                r'^METHODS?\s*:',
                r'\bMaterials?\s+and\s+Methods?\b',
                r'\bMATERIALS?\s+AND\s+METHODS?\b'
            ],
            'results': [
                r'\bResults?\b',
                r'\bRESULTS?\b',
                r'^Results?\s*:',
                r'^RESULTS?\s*:',
                r'\bFindings\b',
                r'\bFINDINGS\b'
            ],
            'discussion': [
                r'\bDiscussion\b',
                r'\bDISCUSSION\b',
                r'^Discussion\s*:',
                r'^DISCUSSION\s*:'
            ],
            'conclusions': [
                r'\bConclusions?\b',
                r'\bCONCLUSIONS?\b',
                r'^Conclusions?\s*:',
                r'^CONCLUSIONS?\s*:',
                r'\bSummary\b',
                r'\bSUMMARY\b'
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
        
        # If no sections found, create a general content section
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
            r'Add to search.*?'
        ]
        
        for pattern in nav_patterns:
            content = re.sub(pattern, '', content, flags=re.DOTALL | re.IGNORECASE)
        
        # Remove extra whitespace
        content = re.sub(r'\s+', ' ', content.strip())
        
        return content
    
    def extract_evidence_sentences(self, study):
        """Extract evidence sentences from study sections"""
        sections = Section.objects.filter(study=study)
        
        # Clear existing evidence
        EvidenceSentence.objects.filter(study=study).delete()
        
        for section in sections:
            # Split content into sentences
            sentences = self.split_into_sentences(section.content)
            
            for i, sentence in enumerate(sentences):
                # Only keep sentences that look like research findings
                if self.is_research_sentence(sentence):
                    EvidenceSentence.objects.create(
                        study=study,
                        section=section,
                        sentence_index=i,
                        sentence_text=sentence,
                        char_start=0,
                        char_end=len(sentence)
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
            'hypothesis', 'method', 'procedure', 'technique'
        ]
        
        sentence_lower = sentence.lower()
        return (len(sentence) > 50 and 
                any(indicator in sentence_lower for indicator in research_indicators))

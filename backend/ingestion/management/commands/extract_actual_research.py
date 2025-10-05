import os
import re
from bs4 import BeautifulSoup
from django.core.management.base import BaseCommand, CommandError
from ingestion.models import Study, Section, EvidenceSentence


class Command(BaseCommand):
    help = 'Extract actual research content from PMC HTML files'

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

    def handle(self, *args, **options):
        limit = options['limit']
        pmcid = options['pmcid']
        
        if pmcid:
            studies = Study.objects.filter(pmcid=pmcid)
        else:
            studies = Study.objects.all()
            if limit:
                studies = studies[:limit]
        
        self.stdout.write(f"Processing {studies.count()} studies...")
        
        processed = 0
        success = 0
        failed = 0
        
        for study in studies:
            processed += 1
            self.stdout.write(f"Processing {processed}/{studies.count()}: {study.pmcid}")
            
            try:
                self.extract_actual_research(study)
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
    
    def extract_actual_research(self, study):
        """Extract actual research content from PMC HTML"""
        html_file = f"data/pmc_articles/{study.pmcid}.html"
        
        if not os.path.exists(html_file):
            raise CommandError(f"HTML file not found: {html_file}")
        
        with open(html_file, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Find the main article content
        article = soup.find('article')
        if not article:
            raise CommandError("No article content found in HTML")
        
        # Find the main content section (usually the first large section)
        main_sections = article.find_all('div', class_=re.compile(r'sec', re.I))
        
        if not main_sections:
            raise CommandError("No sections found in article")
        
        # The first large section usually contains the full research content
        main_content = None
        for section in main_sections:
            text = section.get_text().strip()
            if len(text) > 50000:  # Large content section
                main_content = section
                break
        
        if not main_content:
            # Fallback to the largest section
            main_content = max(main_sections, key=lambda s: len(s.get_text()))
        
        # Extract the actual research content from the main section
        research_content = self.extract_research_from_main_section(main_content)
        
        # Save the research content as sections
        for i, section_data in enumerate(research_content):
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
    
    def extract_research_from_main_section(self, main_section):
        """Extract research content from the main section"""
        sections = []
        order = 1
        
        # Get the full text content
        full_text = main_section.get_text()
        
        # Split into logical sections based on common patterns
        section_patterns = [
            r'\bAbstract\b',
            r'\bIntroduction\b',
            r'\bMethods?\b',
            r'\bResults?\b',
            r'\bDiscussion\b',
            r'\bConclusions?\b',
            r'\bReferences?\b'
        ]
        
        # Find section boundaries
        section_boundaries = []
        for pattern in section_patterns:
            matches = list(re.finditer(pattern, full_text, re.IGNORECASE))
            for match in matches:
                section_boundaries.append((match.start(), match.group()))
        
        # Sort by position
        section_boundaries.sort(key=lambda x: x[0])
        
        # Extract sections
        for i, (start, title) in enumerate(section_boundaries):
            # Get content until next section or end
            if i + 1 < len(section_boundaries):
                end = section_boundaries[i + 1][0]
            else:
                end = len(full_text)
            
            content = full_text[start:end].strip()
            
            # Clean up the content
            content = self.clean_research_content(content)
            
            if len(content) > 200:  # Only keep substantial content
                section_type = self.classify_section_type(title)
                
                sections.append({
                    'type': section_type,
                    'title': title,
                    'content': content,
                    'order': order
                })
                order += 1
        
        # If no sections found, create a general content section
        if not sections:
            content = self.clean_research_content(full_text)
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
        
        # Remove leading/trailing whitespace
        content = content.strip()
        
        return content
    
    def classify_section_type(self, title):
        """Classify section type based on title"""
        title_lower = title.lower()
        
        if 'abstract' in title_lower:
            return 'abstract'
        elif 'introduction' in title_lower:
            return 'introduction'
        elif 'method' in title_lower:
            return 'methods'
        elif 'result' in title_lower:
            return 'results'
        elif 'discussion' in title_lower:
            return 'discussion'
        elif 'conclusion' in title_lower:
            return 'conclusions'
        elif 'reference' in title_lower:
            return 'references'
        else:
            return 'other'
    
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
        return [s.strip() for s in sentences if s.strip() and len(s.strip()) > 50]
    
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

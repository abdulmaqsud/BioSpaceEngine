import os
import re
from bs4 import BeautifulSoup
from django.core.management.base import BaseCommand, CommandError
from ingestion.models import Study, Section, EvidenceSentence


class Command(BaseCommand):
    help = 'Extract real research content from PMC HTML files'

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
                self.extract_research_content(study)
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
    
    def extract_research_content(self, study):
        """Extract real research content from PMC HTML"""
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
        
        # Remove navigation and header elements from article
        for elem in article.find_all(['nav', 'header', 'footer', 'aside']):
            elem.decompose()
        
        # Remove elements with navigation-related classes
        for elem in article.find_all(class_=re.compile(r'nav|menu|header|footer|sidebar', re.I)):
            elem.decompose()
        
        # Extract abstract first
        abstract = self.extract_abstract_from_article(article)
        if abstract:
            Section.objects.update_or_create(
                study=study,
                section_type='abstract',
                order=0,
                defaults={
                    'title': 'Abstract',
                    'content': abstract
                }
            )
        
        # Extract main research sections
        sections = self.extract_research_sections_from_article(article)
        for i, section_data in enumerate(sections):
            Section.objects.update_or_create(
                study=study,
                section_type=section_data['type'],
                order=section_data['order'],
                defaults={
                    'title': section_data['title'],
                    'content': section_data['content']
                }
            )
        
        # Extract evidence sentences from all sections
        self.extract_evidence_sentences(study)
    
    def extract_abstract_from_article(self, article):
        """Extract abstract from article content"""
        # Look for abstract in various formats
        abstract_selectors = [
            'div.abstract',
            'div[data-title="Abstract"]',
            'div[data-title="ABSTRACT"]',
            'section.abstract',
            'div[class*="abstract"]'
        ]
        
        for selector in abstract_selectors:
            abstract_elem = article.select_one(selector)
            if abstract_elem:
                text = self.clean_text(abstract_elem.get_text())
                if len(text) > 100:  # Reasonable abstract length
                    return text
        
        # Look for text containing "Abstract" in the article
        for elem in article.find_all(['div', 'section', 'p']):
            text = elem.get_text().strip()
            if text.startswith('Abstract') and len(text) > 100:
                return self.clean_text(text)
        
        return None
    
    def extract_research_sections_from_article(self, article):
        """Extract research sections from article content"""
        sections = []
        order = 1
        
        # Look for PMC-specific section patterns
        section_patterns = [
            'div.sec[data-title]',  # PMC sections with titles
            'div.sec',              # General PMC sections
            'section[data-title]',  # Alternative section format
            'div[class*="sec"]'     # Sections with sec class
        ]
        
        for pattern in section_patterns:
            section_elems = article.select(pattern)
            for elem in section_elems:
                title = self.extract_section_title(elem)
                content = self.clean_text(elem.get_text())
                
                # Only keep meaningful research content
                if (content and len(content) > 200 and 
                    not self.is_navigation_content(content) and
                    self.is_research_content(content)):
                    
                    section_type = self.classify_section_type(title, content)
                    
                    sections.append({
                        'type': section_type,
                        'title': title or f"Section {order}",
                        'content': content,
                        'order': order
                    })
                    order += 1
        
        return sections
    
    def extract_section_title(self, element):
        """Extract title from section element"""
        # Try data-title attribute first (PMC format)
        title = element.get('data-title')
        if title:
            return self.clean_text(title)
        
        # Look for heading tags
        for tag in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
            title_elem = element.find(tag)
            if title_elem:
                return self.clean_text(title_elem.get_text())
        
        return None
    
    def classify_section_type(self, title, content):
        """Classify section type based on title and content"""
        if not title:
            # Try to classify based on content
            content_lower = content.lower()
            if any(word in content_lower for word in ['introduction', 'background', 'overview']):
                return 'introduction'
            elif any(word in content_lower for word in ['method', 'material', 'experiment', 'procedure']):
                return 'methods'
            elif any(word in content_lower for word in ['result', 'finding', 'data', 'analysis']):
                return 'results'
            elif any(word in content_lower for word in ['discussion', 'interpretation', 'implication']):
                return 'discussion'
            elif any(word in content_lower for word in ['conclusion', 'summary', 'final']):
                return 'conclusions'
            else:
                return 'other'
        
        title_lower = title.lower()
        
        if any(word in title_lower for word in ['introduction', 'background']):
            return 'introduction'
        elif any(word in title_lower for word in ['method', 'material', 'experiment']):
            return 'methods'
        elif any(word in title_lower for word in ['result', 'finding', 'data']):
            return 'results'
        elif any(word in title_lower for word in ['discussion', 'interpretation']):
            return 'discussion'
        elif any(word in title_lower for word in ['conclusion', 'summary']):
            return 'conclusions'
        else:
            return 'other'
    
    def is_navigation_content(self, content):
        """Check if content looks like navigation"""
        nav_indicators = [
            'search', 'menu', 'navigation', 'header', 'footer',
            'copyright', 'terms of use', 'privacy policy',
            'official website', 'government', 'here\'s how you know',
            'secure .gov websites', 'a lock', 'locked padlock'
        ]
        
        content_lower = content.lower()
        return any(indicator in content_lower for indicator in nav_indicators)
    
    def is_research_content(self, content):
        """Check if content looks like research content"""
        research_indicators = [
            'abstract', 'introduction', 'method', 'result', 'discussion', 'conclusion',
            'p-value', 'statistical', 'significant', 'hypothesis', 'experiment',
            'data', 'analysis', 'study', 'research', 'finding', 'observed',
            'measured', 'calculated', 'determined', 'showed', 'demonstrated'
        ]
        
        content_lower = content.lower()
        return any(indicator in content_lower for indicator in research_indicators)
    
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
                            'char_start': 0,  # Simplified for now
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
            'study', 'research', 'experiment', 'data', 'analysis'
        ]
        
        sentence_lower = sentence.lower()
        return (len(sentence) > 50 and 
                any(indicator in sentence_lower for indicator in research_indicators))
    
    def clean_text(self, text):
        """Clean and normalize text"""
        if not text:
            return ""
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text.strip())
        
        # Remove common artifacts
        text = re.sub(r'^\d+\s*', '', text)  # Remove leading numbers
        text = re.sub(r'^[A-Z]\s*', '', text)  # Remove single letters
        
        return text.strip()

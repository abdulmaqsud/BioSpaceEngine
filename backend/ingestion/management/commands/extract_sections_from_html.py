import os
import re
from bs4 import BeautifulSoup
from django.core.management.base import BaseCommand, CommandError
from ingestion.models import Study, Section


class Command(BaseCommand):
    help = 'Extract sections from local PMC HTML files'

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
                self.extract_sections_from_html(study)
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
    
    def extract_sections_from_html(self, study):
        """Extract sections from local HTML file"""
        html_file = f"data/pmc_articles/{study.pmcid}.html"
        
        if not os.path.exists(html_file):
            raise CommandError(f"HTML file not found: {html_file}")
        
        with open(html_file, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Extract sections
        sections = []
        
        # Extract abstract
        abstract = self.extract_abstract(soup)
        if abstract:
            sections.append({
                'type': 'abstract',
                'title': 'Abstract',
                'content': abstract,
                'order': 0
            })
        
        # Extract main sections
        main_sections = self.extract_main_sections(soup)
        sections.extend(main_sections)
        
        # Save sections to database
        for section_data in sections:
            Section.objects.update_or_create(
                study=study,
                section_type=section_data['type'],
                order=section_data['order'],
                defaults={
                    'title': section_data['title'],
                    'content': section_data['content']
                }
            )
    
    def extract_abstract(self, soup):
        """Extract abstract from HTML"""
        # Try different selectors for abstract
        abstract_selectors = [
            'div.abstract',
            'div[data-abstract]',
            'section.abstract',
            '.abstract-content',
            'div[class*="abstract"]'
        ]
        
        for selector in abstract_selectors:
            abstract_elem = soup.select_one(selector)
            if abstract_elem:
                text = self.clean_text(abstract_elem.get_text())
                if len(text) > 50:  # Reasonable abstract length
                    return text
        
        # Fallback: look for text containing "Abstract"
        for elem in soup.find_all(['div', 'section', 'p']):
            if elem.get_text().strip().startswith('Abstract'):
                text = self.clean_text(elem.get_text())
                if len(text) > 50:
                    return text
        
        return None
    
    def extract_main_sections(self, soup):
        """Extract main sections from HTML"""
        sections = []
        order = 1
        
        # Look for common section patterns
        section_selectors = [
            'div.section',
            'section',
            'div[class*="section"]',
            'div[data-section]'
        ]
        
        for selector in section_selectors:
            section_elems = soup.select(selector)
            for elem in section_elems:
                title = self.extract_section_title(elem)
                content = self.clean_text(elem.get_text())
                
                if content and len(content) > 20:  # Reasonable content length
                    section_type = self.classify_section_type(title)
                    
                    sections.append({
                        'type': section_type,
                        'title': title or f"Section {order}",
                        'content': content,
                        'order': order
                    })
                    order += 1
        
        # If no sections found, try to extract from headings
        if not sections:
            sections = self.extract_from_headings(soup)
        
        return sections
    
    def extract_section_title(self, element):
        """Extract title from section element"""
        # Look for heading tags
        for tag in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
            title_elem = element.find(tag)
            if title_elem:
                return self.clean_text(title_elem.get_text())
        
        # Look for title attribute or class
        title = element.get('title') or element.get('data-title')
        if title:
            return self.clean_text(title)
        
        return None
    
    def extract_from_headings(self, soup):
        """Extract sections from headings when no clear sections found"""
        sections = []
        order = 1
        
        # Find all headings
        headings = soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
        
        for heading in headings:
            title = self.clean_text(heading.get_text())
            if not title:
                continue
            
            # Get content after this heading until next heading
            content_parts = []
            current = heading.next_sibling
            
            while current:
                if current.name in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
                    break
                
                if hasattr(current, 'get_text'):
                    text = self.clean_text(current.get_text())
                    if text:
                        content_parts.append(text)
                
                current = current.next_sibling
            
            content = ' '.join(content_parts)
            
            if content and len(content) > 20:
                section_type = self.classify_section_type(title)
                
                sections.append({
                    'type': section_type,
                    'title': title,
                    'content': content,
                    'order': order
                })
                order += 1
        
        return sections
    
    def classify_section_type(self, title):
        """Classify section type based on title"""
        if not title:
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

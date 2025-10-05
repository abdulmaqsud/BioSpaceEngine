import os
import re
from django.core.management.base import BaseCommand
from bs4 import BeautifulSoup
from ingestion.models import Study, Section, EvidenceSentence
from django.db import transaction

class Command(BaseCommand):
    help = 'Improved extraction of research content from PMC HTML files with better targeting.'

    def add_arguments(self, parser):
        parser.add_argument('--limit', type=int, help='Limit the number of studies to process.')
        parser.add_argument('--pmcid', type=str, help='Process a specific study by PMCID.')
        parser.add_argument('--clear-existing', action='store_true', help='Clear existing sections and evidence for processed studies before re-extraction.')

    def handle(self, *args, **options):
        limit = options.get('limit')
        pmcid_filter = options.get('pmcid')
        clear_existing = options.get('clear_existing')

        self.stdout.write(self.style.SUCCESS('Processing studies with improved extraction...'))

        studies_queryset = Study.objects.all()
        if pmcid_filter:
            studies_queryset = studies_queryset.filter(pmcid=pmcid_filter)
        
        if limit:
            studies_queryset = studies_queryset[:limit]

        total_studies = studies_queryset.count()
        processed_count = 0
        success_count = 0
        failed_count = 0

        for study in studies_queryset:
            processed_count += 1
            self.stdout.write(f'Processing {processed_count}/{total_studies}: {study.pmcid}')
            file_path = os.path.join('data', 'pmc_articles', f'{study.pmcid}.html')

            if not os.path.exists(file_path):
                self.stdout.write(self.style.ERROR(f'Failed: {study.pmcid} - HTML file not found: {file_path}'))
                failed_count += 1
                continue

            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    html_content = f.read()
                
                soup = BeautifulSoup(html_content, 'html.parser')

                if clear_existing:
                    Section.objects.filter(study=study).delete()
                    EvidenceSentence.objects.filter(study=study).delete()
                    self.stdout.write(f'Cleared existing sections and evidence for {study.pmcid}')

                # Find the main article content
                article_content = soup.find('article')
                if not article_content:
                    # Fallback to other main content containers
                    article_content = soup.find('div', class_='article') or soup.find('div', id='main-content')
                
                if not article_content:
                    self.stdout.write(self.style.WARNING(f'Warning: Could not find main article content for {study.pmcid}'))
                    article_content = soup

                # Extract Abstract with improved targeting
                abstract_text = self._extract_abstract_improved(article_content)
                if abstract_text:
                    study.abstract = abstract_text
                    study.save()
                    Section.objects.create(
                        study=study,
                        section_type='abstract',
                        title='Abstract',
                        content=abstract_text,
                        order=0
                    )
                    self.stdout.write(f'  ✓ Extracted Abstract for {study.pmcid}')
                else:
                    self.stdout.write(f'  ⚠ No Abstract found for {study.pmcid}')

                # Extract research sections with improved logic
                sections_extracted = self._extract_research_sections_improved(study, article_content)
                self.stdout.write(f'  ✓ Extracted {sections_extracted} sections for {study.pmcid}')
                
                success_count += 1
                self.stdout.write(self.style.SUCCESS(f'Success: {study.pmcid}'))

            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Failed: {study.pmcid} - {e}'))
                failed_count += 1
        
        self.stdout.write(self.style.SUCCESS(
            f'Completed: {processed_count} processed, {success_count} success, {failed_count} failed'
        ))

    def _extract_abstract_improved(self, soup_or_tag):
        """Improved abstract extraction targeting the right elements."""
        # Try multiple abstract selectors in order of preference
        abstract_selectors = [
            'section.abstract',
            'div.abstract',
            'div.abstract-content',
            'div[class*="abstract"]',
            'p[class*="abstract"]'
        ]
        
        for selector in abstract_selectors:
            abstract_elem = soup_or_tag.select_one(selector)
            if abstract_elem:
                text = self._clean_text(abstract_elem.get_text())
                if len(text) > 100:  # Ensure it's a substantial abstract
                    return text
        
        # Fallback: look for text following "Abstract" heading
        for heading in soup_or_tag.find_all(['h1', 'h2', 'h3', 'h4']):
            if 'abstract' in heading.get_text().lower():
                # Get the next sibling content
                next_elem = heading.find_next_sibling()
                if next_elem:
                    text = self._clean_text(next_elem.get_text())
                    if len(text) > 100:
                        return text
                # Or get all following content until next heading
                content_parts = []
                current = heading.next_sibling
                while current:
                    if current.name and current.name.startswith('h') and int(current.name[1]) <= int(heading.name[1]):
                        break
                    if current.name in ['p', 'div']:
                        content_parts.append(current.get_text())
                    current = current.next_sibling
                
                if content_parts:
                    text = self._clean_text(' '.join(content_parts))
                    if len(text) > 100:
                        return text
        
        return None

    def _extract_research_sections_improved(self, study, article_content):
        """Improved research section extraction."""
        sections_extracted = 0
        section_order = 1
        
        # Define research section patterns with better matching
        section_patterns = {
            'introduction': ['introduction', 'background', 'overview'],
            'methods': ['methods', 'materials and methods', 'experimental procedures', 'methodology'],
            'results': ['results', 'findings', 'data'],
            'discussion': ['discussion', 'analysis'],
            'conclusion': ['conclusion', 'conclusions', 'summary'],
            'acknowledgements': ['acknowledgements', 'acknowledgment'],
            'references': ['references', 'bibliography', 'literature cited']
        }

        # Find all headings that might be research sections
        headings = article_content.find_all(['h1', 'h2', 'h3', 'h4'])
        
        for heading in headings:
            title_text = self._clean_text(heading.get_text())
            if not title_text or len(title_text) < 3:
                continue

            # Determine section type
            section_type = 'other'
            title_lower = title_text.lower()
            
            for s_type, patterns in section_patterns.items():
                if any(pattern in title_lower for pattern in patterns):
                    section_type = s_type
                    break
            
            # Skip navigation and metadata sections
            if any(nav_word in title_lower for nav_word in ['permalink', 'article notes', 'license', 'collection date']):
                continue

            # Extract content following this heading
            content_elements = []
            current_element = heading.next_sibling
            
            while current_element:
                # Stop if we hit another heading of same or higher level
                if current_element.name and current_element.name.startswith('h'):
                    current_level = int(current_element.name[1])
                    heading_level = int(heading.name[1])
                    if current_level <= heading_level:
                        break
                
                # Collect content from paragraphs, divs, lists, etc.
                if current_element.name in ['p', 'div', 'ul', 'ol', 'table', 'figure']:
                    content_elements.append(str(current_element))
                
                current_element = current_element.next_sibling
            
            # Combine and clean content
            if content_elements:
                full_content = self._clean_text(BeautifulSoup("".join(content_elements), 'html.parser').get_text())
                
                # Only save if it's substantial research content
                if self._is_meaningful_research_content(full_content, section_type):
                    Section.objects.create(
                        study=study,
                        section_type=section_type,
                        title=title_text,
                        content=full_content,
                        order=section_order
                    )
                    section_order += 1
                    sections_extracted += 1
                    self.stdout.write(f'    ✓ {section_type}: {title_text[:50]}...')
        
        return sections_extracted

    def _clean_text(self, text):
        """Clean text by removing excessive whitespace and boilerplate."""
        if not text:
            return ""
        
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Remove common PMC boilerplate
        boilerplate_patterns = [
            r'Official websites use \.gov.*?Secure \.gov websites use HTTPS',
            r'As a library, NLM provides access to scientific literature\..*?the content\.',
            r'Search in PMC.*?Search in PubMed',
            r'PERMALINK.*?Copy',
            r'View in NLM Catalog.*?Add to search',
            r'Article notes and License information.*?Collection date',
            r'© The Author\(s\).*?All rights reserved',
        ]
        
        for pattern in boilerplate_patterns:
            text = re.sub(pattern, '', text, flags=re.DOTALL)
        
        return text.strip()

    def _is_meaningful_research_content(self, text, section_type):
        """Determine if content is meaningful research content."""
        if not text or len(text) < 50:
            return False
        
        # Check for research keywords
        research_keywords = [
            'abstract', 'introduction', 'method', 'result', 'discussion', 'conclusion',
            'statistical', 'significant', 'experiment', 'data', 'analysis', 'study',
            'research', 'observed', 'measured', 'calculated', 'determined', 'showed',
            'demonstrated', 'p-value', 'hypothesis', 'figure', 'table', 'sample',
            'treatment', 'control', 'variable', 'correlation', 'regression'
        ]
        
        text_lower = text.lower()
        keyword_count = sum(1 for keyword in research_keywords if keyword in text_lower)
        
        # Must have at least 2 research keywords or be a substantial section
        return keyword_count >= 2 or (len(text) > 200 and section_type != 'other')

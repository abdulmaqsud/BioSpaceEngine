import requests
import xml.etree.ElementTree as ET
import time
import re
from django.core.management.base import BaseCommand, CommandError
from ingestion.models import Study, Section


class Command(BaseCommand):
    help = 'Fetch PMC JATS XML content and parse sections for studies'

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
            '--delay',
            type=float,
            default=1.0,
            help='Delay between requests in seconds (default: 1.0)'
        )

    def handle(self, *args, **options):
        limit = options['limit']
        pmcid = options['pmcid']
        delay = options['delay']
        
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
                self.fetch_and_parse_study(study)
                success += 1
                self.stdout.write(self.style.SUCCESS(f"Success: {study.pmcid}"))
            except Exception as e:
                failed += 1
                self.stdout.write(self.style.ERROR(f"Failed: {study.pmcid} - {e}"))
            
            # Rate limiting
            if delay > 0:
                time.sleep(delay)
        
        self.stdout.write(
            self.style.SUCCESS(
                f"Completed: {processed} processed, {success} success, {failed} failed"
            )
        )
    
    def fetch_and_parse_study(self, study):
        """Fetch PMC JATS XML and parse sections for a study"""
        # Construct PMC XML URL
        pmcid_clean = study.pmcid.replace('PMC', '')
        xml_url = f"https://www.ncbi.nlm.nih.gov/pmc/oai/oai.cgi?verb=GetRecord&identifier=oai:pubmedcentral.nih.gov:{pmcid_clean}&metadataPrefix=pmc"
        
        try:
            response = requests.get(xml_url, timeout=30)
            response.raise_for_status()
        except requests.RequestException as e:
            raise CommandError(f"Failed to fetch XML for {study.pmcid}: {e}")
        
        # Parse XML content
        try:
            root = ET.fromstring(response.content)
        except ET.ParseError as e:
            raise CommandError(f"Failed to parse XML for {study.pmcid}: {e}")
        
        # Extract sections using JATS structure
        sections = self.extract_sections(root, study)
        
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
    
    def extract_sections(self, root, study):
        """Extract sections from JATS XML"""
        sections = []
        
        # Define JATS namespace
        ns = {
            'jats': 'http://jats.nlm.nih.gov',
            'xlink': 'http://www.w3.org/1999/xlink'
        }
        
        # Extract abstract
        abstract_elem = root.find('.//jats:abstract', ns)
        if abstract_elem is not None:
            abstract_text = self.extract_text_content(abstract_elem)
            if abstract_text.strip():
                sections.append({
                    'type': 'abstract',
                    'title': 'Abstract',
                    'content': abstract_text,
                    'order': 0
                })
        
        # Extract main body sections
        body = root.find('.//jats:body', ns)
        if body is not None:
            order = 1
            for sec in body.findall('.//jats:sec', ns):
                sec_title = self.extract_title(sec, ns)
                sec_content = self.extract_text_content(sec)
                
                if sec_content.strip():
                    # Determine section type based on title
                    sec_type = self.classify_section_type(sec_title)
                    
                    sections.append({
                        'type': sec_type,
                        'title': sec_title or f"Section {order}",
                        'content': sec_content,
                        'order': order
                    })
                    order += 1
        
        return sections
    
    def extract_title(self, element, ns):
        """Extract title from section element"""
        title_elem = element.find('.//jats:title', ns)
        if title_elem is not None:
            return self.extract_text_content(title_elem)
        return ""
    
    def extract_text_content(self, element):
        """Extract all text content from element, preserving structure"""
        if element is None:
            return ""
        
        # Get all text content
        text_parts = []
        for elem in element.iter():
            if elem.text:
                text_parts.append(elem.text.strip())
            if elem.tail and elem.tail.strip():
                text_parts.append(elem.tail.strip())
        
        return ' '.join(text_parts)
    
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

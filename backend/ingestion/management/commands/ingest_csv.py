import csv
import requests
import time
from django.core.management.base import BaseCommand, CommandError
from ingestion.models import Study


class Command(BaseCommand):
    help = 'Ingest the 608 Space Biology publications from GitHub CSV'

    def add_arguments(self, parser):
        parser.add_argument(
            '--csv-url',
            type=str,
            default='https://raw.githubusercontent.com/jgalazka/SB_publications/main/SB_publication_PMC.csv',
            help='URL to the CSV file'
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=None,
            help='Limit number of publications to process (for testing)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be processed without saving to database'
        )

    def handle(self, *args, **options):
        csv_url = options['csv_url']
        limit = options['limit']
        dry_run = options['dry_run']
        
        self.stdout.write(f"Fetching CSV from: {csv_url}")
        
        try:
            response = requests.get(csv_url, timeout=30)
            response.raise_for_status()
        except requests.RequestException as e:
            raise CommandError(f"Failed to fetch CSV: {e}")
        
        # Parse CSV content (handle BOM)
        csv_content = response.text
        if csv_content.startswith('\ufeff'):
            csv_content = csv_content[1:]  # Remove BOM
        
        reader = csv.DictReader(csv_content.splitlines())
        
        # Debug: print fieldnames
        self.stdout.write(f"CSV fieldnames: {reader.fieldnames}")
        
        studies_processed = 0
        studies_created = 0
        studies_skipped = 0
        
        for row in reader:
            if limit and studies_processed >= limit:
                break
                
            studies_processed += 1
            
            title = row.get('Title', '').strip()
            pmc_url = row.get('Link', '').strip()
            
            if not title or not pmc_url:
                self.stdout.write(
                    self.style.WARNING(f"Skipping row {studies_processed}: missing title or URL")
                )
                studies_skipped += 1
                continue
            
            # Extract PMCID from URL
            pmcid = self.extract_pmcid(pmc_url)
            if not pmcid:
                self.stdout.write(
                    self.style.WARNING(f"Skipping row {studies_processed}: invalid PMC URL: {pmc_url}")
                )
                studies_skipped += 1
                continue
            
            if dry_run:
                self.stdout.write(f"Would process: {title[:100]}... ({pmcid})")
                studies_created += 1
                continue
            
            # Create or update study
            study, created = Study.objects.get_or_create(
                pmcid=pmcid,
                defaults={
                    'title': title,
                    'pmc_url': pmc_url,
                }
            )
            
            if created:
                studies_created += 1
                self.stdout.write(f"Created: {title[:100]}... ({pmcid})")
            else:
                self.stdout.write(f"Already exists: {title[:100]}... ({pmcid})")
            
            # Rate limiting
            time.sleep(0.1)
        
        self.stdout.write(
            self.style.SUCCESS(
                f"Processed {studies_processed} studies, "
                f"created {studies_created}, "
                f"skipped {studies_skipped}"
            )
        )
    
    def extract_pmcid(self, url):
        """Extract PMCID from PMC URL"""
        try:
            # Handle different PMC URL formats
            if 'pmc/articles/PMC' in url:
                # Format: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC123456/
                parts = url.split('PMC')
                if len(parts) > 1:
                    pmcid = 'PMC' + parts[1].split('/')[0]
                    return pmcid
            elif url.startswith('PMC'):
                # Direct PMCID
                return url.split('/')[0]
        except Exception:
            pass
        return None

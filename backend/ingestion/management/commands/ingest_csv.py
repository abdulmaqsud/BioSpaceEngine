from pathlib import Path
import requests
import time
from django.core.management.base import BaseCommand, CommandError
from ingestion.models import Study
from ingestion.utils.csv_loader import parse_publications_csv


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
            '--csv-path',
            type=str,
            default=None,
            help='Path to a local CSV file (overrides --csv-url if provided)'
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
        csv_path = options['csv_path']
        limit = options['limit']
        dry_run = options['dry_run']
        
        csv_content = self._load_csv(csv_path, csv_url)

        studies_created = 0
        studies_updated = 0
        studies_unchanged = 0
        valid_records = 0
        
        for idx, record in enumerate(parse_publications_csv(csv_content), start=1):
            if limit and idx > limit:
                break
            valid_records += 1
            
            if dry_run:
                self.stdout.write(f"Would process: {record.title[:100]}... ({record.pmcid})")
                continue
            
            study = Study.objects.filter(pmcid=record.pmcid).first()
            if study is None:
                Study.objects.create(pmcid=record.pmcid, **record.as_defaults())
                studies_created += 1
                self.stdout.write(f"Created: {record.title[:100]}... ({record.pmcid})")
            else:
                changed = False
                for field, value in record.as_defaults().items():
                    if getattr(study, field) != value:
                        setattr(study, field, value)
                        changed = True
                if changed:
                    study.save(update_fields=list(record.as_defaults().keys()))
                    studies_updated += 1
                    self.stdout.write(f"Updated: {record.title[:100]}... ({record.pmcid})")
                else:
                    studies_unchanged += 1
                    self.stdout.write(f"Unchanged: {record.title[:100]}... ({record.pmcid})")
            
            # Rate limiting to be gentle with future metadata calls (placeholder)
            if not dry_run:
                time.sleep(0.05)
        
        if dry_run:
            summary = (
                f"Dry run complete: {valid_records} valid records inspected"
            )
        else:
            summary = (
                f"Processed {valid_records} records: "
                f"created {studies_created}, updated {studies_updated}, "
                f"unchanged {studies_unchanged}"
            )
        
        self.stdout.write(self.style.SUCCESS(summary))
    
    def _load_csv(self, csv_path: str | None, csv_url: str) -> str:
        """Return CSV content from a local file or remote URL."""
        if csv_path:
            path_obj = Path(csv_path)
            if not path_obj.exists():
                raise CommandError(f"CSV path does not exist: {csv_path}")
            self.stdout.write(f"Loading CSV from local file: {path_obj}")
            return path_obj.read_text(encoding='utf-8')
        
        self.stdout.write(f"Fetching CSV from: {csv_url}")
        try:
            response = requests.get(csv_url, timeout=30)
            response.raise_for_status()
        except requests.RequestException as exc:
            raise CommandError(f"Failed to fetch CSV: {exc}") from exc
        return response.text

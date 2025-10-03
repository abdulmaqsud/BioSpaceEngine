from __future__ import annotations

from pathlib import Path
from tempfile import NamedTemporaryFile

from django.core.management import call_command
from django.test import TestCase

from ingestion.models import Study


FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"
SAMPLE_CSV = FIXTURES_DIR / "sample_publications.csv"


class IngestCsvCommandTests(TestCase):
    def test_ingest_csv_creates_studies_from_local_file(self) -> None:
        call_command("ingest_csv", f"--csv-path={SAMPLE_CSV}")

        studies = Study.objects.order_by("pmcid")
        self.assertEqual(studies.count(), 2)

        first = studies.first()
        assert first is not None
        self.assertEqual(first.pmcid, "PMC1234567")
        self.assertEqual(first.title, "Mice in Space: A Multi-line Title")
        self.assertEqual(first.pmc_url, "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC1234567/")

        second = studies.last()
        assert second is not None
        self.assertEqual(second.pmcid, "PMC7654321")
        self.assertEqual(second.title, "Single line study")

    def test_dry_run_does_not_persist_changes(self) -> None:
        call_command("ingest_csv", f"--csv-path={SAMPLE_CSV}", "--dry-run")
        self.assertFalse(Study.objects.exists())

    def test_updates_existing_records_when_title_changes(self) -> None:
        call_command("ingest_csv", f"--csv-path={SAMPLE_CSV}")

        updated_csv_content = (
            "Title,Link\n"
            '"Mice in Space: Updated Title",https://www.ncbi.nlm.nih.gov/pmc/articles/PMC1234567/\n'
            '"Single line study",https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7654321/\n'
        )
        with NamedTemporaryFile("w", delete=False, suffix=".csv", encoding="utf-8") as temp_csv:
            temp_csv.write(updated_csv_content)
            temp_path = Path(temp_csv.name)

        try:
            call_command("ingest_csv", f"--csv-path={temp_path}")
        finally:
            temp_path.unlink(missing_ok=True)

        study = Study.objects.get(pmcid="PMC1234567")
        self.assertEqual(study.title, "Mice in Space: Updated Title")

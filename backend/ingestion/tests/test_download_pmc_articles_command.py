from __future__ import annotations

from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import mock

from django.core.management import call_command
from django.test import TestCase


FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"
SAMPLE_CSV = FIXTURES_DIR / "sample_publications.csv"


class DummyResponse:
    def __init__(self, *, content: bytes, headers: dict[str, str], status_code: int = 200) -> None:
        self.content = content
        self.headers = headers
        self.status_code = status_code

    def raise_for_status(self) -> None:
        if self.status_code >= 400:
            raise RuntimeError(f"HTTP {self.status_code}")


class DownloadPmcArticlesCommandTests(TestCase):
    @mock.patch("ingestion.management.commands.download_pmc_articles.requests.Session.get")
    def test_downloads_articles_to_output_directory(self, mock_get: mock.MagicMock) -> None:
        mock_get.side_effect = [
            DummyResponse(content=b"<html>Study 1</html>", headers={"Content-Type": "text/html"}),
            DummyResponse(content=b"%PDF-1.4", headers={"Content-Type": "application/pdf"}),
        ]

        with TemporaryDirectory() as tmp_dir:
            call_command(
                "download_pmc_articles",
                f"--csv-path={SAMPLE_CSV}",
                f"--output-dir={tmp_dir}",
                "--delay=0",
            )

            output_path = Path(tmp_dir)

            html_file = output_path / "PMC1234567.html"
            pdf_file = output_path / "PMC7654321.pdf"

            self.assertTrue(html_file.exists())
            self.assertTrue(pdf_file.exists())

            self.assertEqual(html_file.read_bytes(), b"<html>Study 1</html>")
            self.assertEqual(pdf_file.read_bytes(), b"%PDF-1.4")

        self.assertEqual(mock_get.call_count, 2)

    @mock.patch("ingestion.management.commands.download_pmc_articles.requests.Session.get")
    def test_filters_specific_pmcid(self, mock_get: mock.MagicMock) -> None:
        mock_get.return_value = DummyResponse(
            content=b"%PDF-Filtered",
            headers={"Content-Type": "application/pdf"},
        )

        with TemporaryDirectory() as tmp_dir:
            call_command(
                "download_pmc_articles",
                f"--csv-path={SAMPLE_CSV}",
                f"--output-dir={tmp_dir}",
                "--delay=0",
                "--pmcid=PMC7654321",
            )

            output_path = Path(tmp_dir)
            html_file = output_path / "PMC1234567.html"
            pdf_file = output_path / "PMC7654321.pdf"

            self.assertFalse(html_file.exists())
            self.assertTrue(pdf_file.exists())
            self.assertEqual(pdf_file.read_bytes(), b"%PDF-Filtered")

        self.assertEqual(mock_get.call_count, 1)

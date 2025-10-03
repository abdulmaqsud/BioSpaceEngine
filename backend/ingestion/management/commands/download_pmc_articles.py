from __future__ import annotations

"""Download PMC articles referenced in the publications CSV."""

import mimetypes
import time
from pathlib import Path
from typing import Iterable

import requests
from django.core.management.base import BaseCommand, CommandError

from ingestion.utils.csv_loader import PublicationRecord, parse_publications_csv


DEFAULT_CSV_URL = (
    "https://raw.githubusercontent.com/jgalazka/SB_publications/main/"
    "SB_publication_PMC.csv"
)


class Command(BaseCommand):
    help = "Download Space Biology PMC articles to a local folder for downstream analysis"

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            "--csv-url",
            type=str,
            default=DEFAULT_CSV_URL,
            help="URL to the publications CSV (default: NASA Space Biology list)",
        )
        parser.add_argument(
            "--csv-path",
            type=str,
            default=None,
            help="Path to a local CSV file (overrides --csv-url if provided)",
        )
        parser.add_argument(
            "--output-dir",
            type=str,
            default="data/pmc_articles",
            help="Directory where downloaded articles will be stored",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=None,
            help="Limit number of articles to download (useful for testing)",
        )
        parser.add_argument(
            "--skip-existing",
            action="store_true",
            help="Skip downloads if output file already exists",
        )
        parser.add_argument(
            "--delay",
            type=float,
            default=0.25,
            help="Delay (in seconds) between downloads to be polite to PMC servers",
        )
        parser.add_argument(
            "--timeout",
            type=float,
            default=30.0,
            help="HTTP timeout in seconds (default: 30)",
        )
        parser.add_argument(
            "--user-agent",
            type=str,
            default="BioSpaceEngine/0.1 (+https://github.com/abdulmaqsud/BioSpaceEngine)",
            help="Custom User-Agent header to send with requests",
        )
        parser.add_argument(
            "--pmcid",
            action="append",
            dest="pmcids",
            help="Download only the specified PMCID (can be supplied multiple times)",
        )
        parser.add_argument(
            "--pmcid-file",
            type=str,
            dest="pmcid_file",
            help="Path to a text file containing PMCIDs (one per line) to download",
        )

    def handle(self, *args, **options):
        output_dir = Path(options["output_dir"])
        output_dir.mkdir(parents=True, exist_ok=True)

        csv_content = self._load_csv(options["csv_path"], options["csv_url"])
        records = list(parse_publications_csv(csv_content))

        requested_pmcids = self._collect_requested_pmcids(options)
        if requested_pmcids:
            records = self._filter_requested_records(records, requested_pmcids)

        if options["limit"]:
            records = records[: options["limit"]]

        if not records:
            raise CommandError("No valid publication records found in CSV")

        self.stdout.write(f"Preparing to download {len(records)} articles to {output_dir.resolve()}")

        session = requests.Session()
        session.headers.update({"User-Agent": options["user_agent"]})

        success = 0
        skipped = 0
        failures: list[tuple[str, str]] = []

        for idx, record in enumerate(records, start=1):
            self.stdout.write(f"[{idx}/{len(records)}] {record.pmcid} -> {record.pmc_url}")
            try:
                output_path = self._output_path(output_dir, record)
                if options["skip_existing"] and output_path.exists():
                    skipped += 1
                    self.stdout.write(f"  Skipping existing file: {output_path.name}")
                else:
                    downloaded_path = self._download_article(
                        session=session,
                        record=record,
                        output_path=output_path,
                        timeout=options["timeout"],
                    )
                    success += 1
                    self.stdout.write(
                        self.style.SUCCESS(f"  Downloaded -> {downloaded_path.name}")
                    )
            except Exception as exc:  # noqa: BLE001 - surface errors to operator
                failures.append((record.pmcid, str(exc)))
                self.stdout.write(self.style.ERROR(f"  Failed: {exc}"))

            delay = options["delay"]
            if delay > 0:
                time.sleep(delay)

        summary = (
            f"Downloads complete: {success} succeeded, {skipped} skipped, "
            f"{len(failures)} failed"
        )
        if failures:
            self.stdout.write(self.style.WARNING(summary))
            for pmcid, message in failures:
                self.stdout.write(self.style.WARNING(f"  {pmcid}: {message}"))
        else:
            self.stdout.write(self.style.SUCCESS(summary))

    def _load_csv(self, csv_path: str | None, csv_url: str) -> str:
        if csv_path:
            path = Path(csv_path)
            if not path.exists():
                raise CommandError(f"CSV path does not exist: {csv_path}")
            return path.read_text(encoding="utf-8")

        try:
            response = requests.get(csv_url, timeout=30)
            response.raise_for_status()
        except requests.RequestException as exc:
            raise CommandError(f"Failed to fetch CSV: {exc}") from exc
        return response.text

    def _output_path(self, base_dir: Path, record: PublicationRecord) -> Path:
        return base_dir / f"{record.pmcid}{self._default_extension(record)}"

    def _default_extension(self, record: PublicationRecord) -> str:
        if record.pmc_url.endswith(".pdf"):
            return ".pdf"
        return ".html"

    def _download_article(
        self,
        *,
        session: requests.Session,
        record: PublicationRecord,
        output_path: Path,
        timeout: float,
    ) -> Path:
        try:
            response = session.get(record.pmc_url, timeout=timeout)
            response.raise_for_status()
        except requests.RequestException as exc:
            raise CommandError(f"HTTP error for {record.pmcid}: {exc}") from exc

        extension = self._extension_from_headers(response.headers.get("Content-Type"))
        if extension and output_path.suffix.lower() != extension:
            output_path = output_path.with_suffix(extension)

        content = response.content
        output_path.write_bytes(content)

        return output_path

    def _extension_from_headers(self, content_type: str | None) -> str | None:
        if not content_type:
            return None

        mime = content_type.split(";")[0].strip()
        if not mime:
            return None

        # Manually map common PMC content types
        manual_map = {
            "text/html": ".html",
            "application/xml": ".xml",
            "text/xml": ".xml",
            "application/pdf": ".pdf",
            "application/octet-stream": ".bin",
        }
        if mime in manual_map:
            return manual_map[mime]

        guessed = mimetypes.guess_extension(mime)
        return guessed

    def _collect_requested_pmcids(self, options: dict[str, object]) -> set[str]:
        pmcids: set[str] = set()

        raw_list = options.get("pmcids") or []
        for value in raw_list:
            if isinstance(value, str):
                pmcids.add(self._normalize_pmcid(value))

        pmcid_file = options.get("pmcid_file")
        if isinstance(pmcid_file, str):
            path = Path(pmcid_file)
            if not path.exists():
                raise CommandError(f"PMCID file does not exist: {pmcid_file}")
            for line in path.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if not line:
                    continue
                pmcids.add(self._normalize_pmcid(line))

        return {pmcid for pmcid in pmcids if pmcid}

    def _filter_requested_records(
        self, records: list[PublicationRecord], requested_pmcids: set[str]
    ) -> list[PublicationRecord]:
        filtered = [record for record in records if record.pmcid.upper() in requested_pmcids]

        found = {record.pmcid.upper() for record in filtered}
        missing = requested_pmcids - found
        if missing:
            missing_list = ", ".join(sorted(missing))
            self.stdout.write(
                self.style.WARNING(
                    f"Requested PMCIDs not found in CSV: {missing_list}"
                )
            )

        if not filtered:
            raise CommandError(
                "None of the requested PMCIDs were present in the CSV data"
            )

        return filtered

    def _normalize_pmcid(self, value: str) -> str:
        value = value.strip().upper()
        if not value:
            return ""
        if not value.startswith("PMC"):
            value = f"PMC{value}"
        return value

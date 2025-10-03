"""Utilities for parsing the Space Biology publications CSV."""
from __future__ import annotations

from dataclasses import dataclass
from io import StringIO
from typing import Dict, Iterable, Iterator, Optional
import csv
import re


REQUIRED_COLUMNS = {"Title", "Link"}


@dataclass(slots=True)
class PublicationRecord:
    """Normalized representation of a publication row."""

    title: str
    pmc_url: str
    pmcid: str
    raw_row: Dict[str, str]

    def as_defaults(self) -> Dict[str, str]:
        """Return a dictionary suitable for Study.objects.update_or_create defaults."""
        return {
            "title": self.title,
            "pmc_url": self.pmc_url,
        }


def parse_publications_csv(csv_text: str) -> Iterator[PublicationRecord]:
    """Yield cleaned publication records from CSV content.

    Args:
        csv_text: The raw CSV string content.

    Yields:
        PublicationRecord instances for valid rows.
    """
    cleaned_text = strip_bom(csv_text)
    reader = csv.DictReader(StringIO(cleaned_text))

    if not reader.fieldnames:
        raise ValueError("CSV does not contain a header row")

    missing = REQUIRED_COLUMNS - set(reader.fieldnames)
    if missing:
        raise ValueError(f"CSV is missing required columns: {', '.join(sorted(missing))}")

    for row in reader:
        title_raw = (row.get("Title") or "").strip()
        link_raw = (row.get("Link") or "").strip()

        if not title_raw or not link_raw:
            # Skip incomplete rows
            continue

        pmcid = extract_pmcid(link_raw)
        if not pmcid:
            continue

        yield PublicationRecord(
            title=normalize_whitespace(title_raw),
            pmc_url=link_raw,
            pmcid=pmcid,
            raw_row=row,
        )


def strip_bom(text: str) -> str:
    """Remove UTF-8 BOM if present."""
    if text.startswith("\ufeff"):
        return text[1:]
    return text


PMC_URL_PATTERNS: Iterable[re.Pattern[str]] = (
    re.compile(r"/PMC(?P<id>\d+)/?", re.IGNORECASE),
    re.compile(r"^(PMC\d+)", re.IGNORECASE),
)


def extract_pmcid(url: str) -> Optional[str]:
    """Extract PMCID from a PMC URL or identifier string."""
    for pattern in PMC_URL_PATTERNS:
        match = pattern.search(url)
        if not match:
            continue

        if "id" in match.groupdict():
            core = match.group("id")
            if core:
                return f"PMC{core}"
        else:
            pmc_value = match.group(1)
            if pmc_value:
                return pmc_value.upper().replace("PMCP", "PMC")
    return None


_whitespace_re = re.compile(r"\s+")


def normalize_whitespace(value: str) -> str:
    """Collapse repeated whitespace and strip surrounding spaces."""
    return _whitespace_re.sub(" ", value).strip()

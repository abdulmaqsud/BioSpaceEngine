import re

from django.core.management.base import BaseCommand
from django.db import transaction

from ingestion.models import Study


class Command(BaseCommand):
    help = "Generate readable summaries for studies using available content"

    def add_arguments(self, parser):
        parser.add_argument(
            "--limit",
            type=int,
            default=None,
            help="Limit number of studies to process.",
        )
        parser.add_argument(
            "--study-id",
            type=int,
            default=None,
            help="Generate a summary for a single study.",
        )
        parser.add_argument(
            "--overwrite",
            action="store_true",
            help="Regenerate summaries even if they already exist.",
        )

    def handle(self, *args, **options):
        overwrite = options["overwrite"]
        study_id = options["study_id"]
        limit = options["limit"]

        studies = Study.objects.all()
        if study_id:
            studies = studies.filter(id=study_id)
        elif limit:
            studies = studies[:limit]

        total = studies.count()
        if total == 0:
            self.stdout.write(self.style.WARNING("No studies selected for summarisation."))
            return

        self.stdout.write(f"Generating summaries for {total} studies...")

        processed = 0
        for study in studies:
            if study.summary and not overwrite:
                continue

            summary = self._build_summary(study)
            with transaction.atomic():
                study.summary = summary
                study.save(update_fields=["summary", "updated_at"])
            processed += 1
            self.stdout.write(f"  ✓ {study.pmcid} → {len(summary)} chars")

        self.stdout.write(self.style.SUCCESS(f"Completed summaries for {processed} studies."))

    def _build_summary(self, study: Study) -> str:
        sentences: list[str] = []

        if study.abstract:
            sentences.extend(self._split_sentences(study.abstract)[:3])

        if len(sentences) < 3:
            key_sections = (
                study.sections.filter(section_type__in=["results", "discussion", "conclusions"])
                .order_by("order")
                .prefetch_related("sentences")
            )
            for section in key_sections:
                section_sentences = self._split_sentences(section.content)[:2]
                sentences.extend(section_sentences)
                if len(sentences) >= 4:
                    break

        if len(sentences) < 4:
            evidence = (
                study.evidence_sentences.all()
                .order_by("sentence_index")
                .values_list("sentence_text", flat=True)[:2]
            )
            sentences.extend([text.strip() for text in evidence if text])

        if not sentences and study.title:
            sentences.append(study.title.strip())

        if not sentences:
            return "Summary unavailable."

        joined = " ".join(sentences[:4])
        cleaned = re.sub(r"\s+", " ", joined).strip()
        return cleaned

    @staticmethod
    def _split_sentences(text: str) -> list[str]:
        if not text:
            return []
        parts = re.split(r"(?<=[.!?])\s+", text.strip())
        return [part.strip() for part in parts if len(part.strip()) > 20]

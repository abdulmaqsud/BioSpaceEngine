from __future__ import annotations

import json
from collections import defaultdict
from itertools import combinations

from django.core.management.base import BaseCommand
from django.db import transaction

from ingestion.models import (
    EntityOccurrence,
    EvidenceSentence,
    Study,
    Triple,
)


class Command(BaseCommand):
    help = "Generate knowledge graph triples from entity co-occurrences"

    def add_arguments(self, parser):
        parser.add_argument(
            "--limit",
            type=int,
            default=None,
            help="Limit number of studies to process",
        )
        parser.add_argument(
            "--study-id",
            type=int,
            default=None,
            help="Process a single study id",
        )
        parser.add_argument(
            "--clear-existing",
            action="store_true",
            help="Remove existing triples for the targeted studies before regenerating",
        )

    def handle(self, *args, **options):
        study_id = options["study_id"]
        limit = options["limit"]
        clear_existing = options["clear_existing"]

        studies = Study.objects.all()
        if study_id:
            studies = studies.filter(id=study_id)
        elif limit:
            studies = studies[:limit]

        total = studies.count()
        if total == 0:
            self.stdout.write(self.style.WARNING("No studies selected for triple generation."))
            return

        self.stdout.write(f"Generating triples for {total} studies...")

        for index, study in enumerate(studies, start=1):
            self.stdout.write(f"[{index}/{total}] Processing {study.pmcid}")
            with transaction.atomic():
                if clear_existing:
                    Triple.objects.filter(study=study).delete()

                occurrences = (
                    EntityOccurrence.objects.filter(study=study)
                    .select_related("entity", "section")
                    .order_by("section_id", "entity_id", "start_char")
                )

                if not occurrences.exists():
                    self.stdout.write("  ⚠️  No entity occurrences found; skipping.")
                    continue

                grouped = defaultdict(list)
                for occurrence in occurrences:
                    key = occurrence.section_id or 0
                    grouped[key].append(occurrence)

                created = 0
                for section_id, occs in grouped.items():
                    section = occs[0].section if occs[0].section_id else None
                    entities = self._unique_entities(occs)

                    for subject_entity, object_entity in combinations(entities, 2):
                        relation, directional = self._infer_relation(subject_entity.entity_type, object_entity.entity_type)
                        if not relation:
                            continue

                        if directional:
                            subject, obj = self._apply_directional(subject_entity, object_entity)
                        else:
                            subject, obj = subject_entity, object_entity

                        if not subject or not obj:
                            continue

                        evidence_sentence = self._find_evidence_sentence(study, subject, obj, section)
                        qualifiers = {
                            "section": section.section_type if section else None,
                            "section_title": section.title if section else None,
                        }
                        qualifiers_json = json.dumps(qualifiers)

                        triple, was_created = Triple.objects.get_or_create(
                            study=study,
                            subject_entity=subject,
                            relation=relation,
                            object_entity=obj,
                            defaults={
                                "evidence_sentence": evidence_sentence,
                                "qualifiers": qualifiers_json,
                                "confidence": 0.6 if evidence_sentence else 0.3,
                            },
                        )

                        if not was_created and evidence_sentence and triple.evidence_sentence is None:
                            triple.evidence_sentence = evidence_sentence
                            triple.qualifiers = qualifiers_json
                            triple.confidence = 0.6
                            triple.save(update_fields=["evidence_sentence", "qualifiers", "confidence"])

                        if was_created:
                            created += 1

                self.stdout.write(self.style.SUCCESS(f"  Created {created} triples."))

        self.stdout.write(self.style.SUCCESS("Triple generation complete."))

    @staticmethod
    def _unique_entities(occurrences: list[EntityOccurrence]):
        seen = {}
        for occurrence in occurrences:
            if occurrence.entity_id not in seen:
                seen[occurrence.entity_id] = occurrence.entity
        return list(seen.values())

    @staticmethod
    def _infer_relation(type_a: str | None, type_b: str | None):
        canonical_a = (type_a or "other").lower()
        canonical_b = (type_b or "other").lower()
        pair = {canonical_a, canonical_b}

        if canonical_a == "organism" and canonical_b == "stressor":
            return "affected_by", True
        if canonical_a == "organism" and canonical_b == "outcome":
            return "exhibits", True
        if canonical_a == "stressor" and canonical_b == "outcome":
            return "influences", True
        if canonical_a == "organism" and canonical_b == "assay":
            return "measured_by", True
        if canonical_a == canonical_b:
            return "related_to", False
        if pair <= {"organism", "plant"}:
            return "related_to", False
        return "associated_with", False

    @staticmethod
    def _apply_directional(entity_a, entity_b):
        priority = {
            "organism": 3,
            "stressor": 2,
            "outcome": 2,
            "assay": 1,
        }
        score_a = priority.get((entity_a.entity_type or "").lower(), 0)
        score_b = priority.get((entity_b.entity_type or "").lower(), 0)

        if score_a == score_b:
            return (entity_a, entity_b) if entity_a.id < entity_b.id else (entity_b, entity_a)
        return (entity_a, entity_b) if score_a >= score_b else (entity_b, entity_a)

    @staticmethod
    def _find_evidence_sentence(study: Study, entity_a, entity_b, section):
        candidates = EvidenceSentence.objects.filter(study=study)
        if section:
            candidates = candidates.filter(section=section)

        name_a = entity_a.name.lower()
        name_b = entity_b.name.lower()

        for sentence in candidates:
            text = sentence.sentence_text.lower()
            if name_a in text and name_b in text:
                return sentence
        return None

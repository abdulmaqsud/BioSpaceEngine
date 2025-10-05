from django.db.models import Q, Count
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import (  # type: ignore[import]
    OpenApiParameter,
    OpenApiResponse,
    OpenApiTypes,
    extend_schema,
    extend_schema_view,
)

from .models import Entity, EvidenceSentence, Section, Study, Triple
from .serializers import (
    EntitySerializer,
    EvidenceSentenceSerializer,
    FacetsResponseSerializer,
    SearchResponseSerializer,
    SectionSerializer,
    StudyDebugSerializer,
    StudySerializer,
    TripleSerializer,
)
from .services import semantic_search


@extend_schema_view(
    list=extend_schema(
        summary="List studies",
        description="Retrieve NASA space biology studies with optional text search and metadata filters.",
        parameters=[
            OpenApiParameter(
                name="search",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Filter studies whose title or abstract contains the given text.",
            ),
            OpenApiParameter(
                name="year_from",
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description="Return studies published in or after this year.",
            ),
            OpenApiParameter(
                name="year_to",
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description="Return studies published in or before this year.",
            ),
            OpenApiParameter(
                name="journal",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Filter by journal name (case-insensitive substring match).",
            ),
        ],
        responses=StudySerializer(many=True),
    ),
    retrieve=extend_schema(
        summary="Retrieve a study",
        description="Return the complete metadata for a single study record, including derived counts.",
        responses=StudySerializer,
    ),
)
class StudyViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only view set exposing study records and custom search utilities."""

    queryset = Study.objects.all()
    serializer_class = StudySerializer

    def _apply_basic_filters(self, queryset, params):
        search = params.get("search")
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(abstract__icontains=search)
            )

        year_from = params.get("year_from")
        if year_from:
            queryset = queryset.filter(year__gte=year_from)

        year_to = params.get("year_to")
        if year_to:
            queryset = queryset.filter(year__lte=year_to)

        journal = params.get("journal")
        if journal:
            queryset = queryset.filter(journal__icontains=journal)

        return queryset

    def _apply_advanced_filters(self, queryset, params):
        organism = params.get("organism")
        if organism:
            organism_value = organism.lower()
            if organism_value == "human":
                queryset = queryset.filter(
                    Q(title__icontains="human")
                    | Q(abstract__icontains="human")
                    | Q(sections__content__icontains="human")
                ).exclude(
                    Q(title__icontains="mouse")
                    | Q(title__icontains="rat")
                    | Q(title__icontains="animal")
                )
            elif organism_value == "mouse":
                queryset = queryset.filter(
                    Q(title__icontains="mouse")
                    | Q(abstract__icontains="mouse")
                    | Q(sections__content__icontains="mouse")
                )
            elif organism_value == "plant":
                queryset = queryset.filter(
                    Q(title__icontains="plant")
                    | Q(abstract__icontains="plant")
                    | Q(sections__content__icontains="plant")
                )
            else:
                queryset = queryset.filter(
                    Q(title__icontains=organism_value)
                    | Q(abstract__icontains=organism_value)
                    | Q(sections__content__icontains=organism_value)
                )
            queryset = queryset.distinct()

        exposure = params.get("exposure")
        if exposure:
            exposure_value = exposure.lower()
            if exposure_value == "microgravity":
                queryset = queryset.filter(
                    Q(title__icontains="microgravity")
                    | Q(abstract__icontains="microgravity")
                    | Q(sections__content__icontains="microgravity")
                )
            elif exposure_value == "radiation":
                queryset = queryset.filter(
                    Q(title__icontains="radiation")
                    | Q(abstract__icontains="radiation")
                    | Q(sections__content__icontains="radiation")
                )
            else:
                queryset = queryset.filter(
                    Q(title__icontains=exposure_value)
                    | Q(abstract__icontains=exposure_value)
                    | Q(sections__content__icontains=exposure_value)
                )
            queryset = queryset.distinct()

        system = params.get("system")
        if system:
            system_value = system.lower()
            if system_value == "bone":
                queryset = queryset.filter(
                    Q(title__icontains="bone")
                    | Q(abstract__icontains="bone")
                    | Q(sections__content__icontains="bone")
                )
            elif system_value == "muscle":
                queryset = queryset.filter(
                    Q(title__icontains="muscle")
                    | Q(abstract__icontains="muscle")
                    | Q(sections__content__icontains="muscle")
                )
            else:
                queryset = queryset.filter(
                    Q(title__icontains=system_value)
                    | Q(abstract__icontains=system_value)
                    | Q(sections__content__icontains=system_value)
                )
            queryset = queryset.distinct()

        year = params.get("year")
        if year:
            try:
                year_int = int(year)
            except (TypeError, ValueError):
                year_int = None

            if year_int is not None:
                year_filtered = queryset.filter(year=year_int)
                if year_filtered.count() > 0:
                    queryset = year_filtered
                else:
                    queryset = queryset.filter(
                        Q(title__icontains=year)
                        | Q(abstract__icontains=year)
                        | Q(title__icontains=f"({year})")
                        | Q(title__icontains=f", {year}")
                        | Q(abstract__icontains=f"({year})")
                        | Q(abstract__icontains=f", {year}")
                    )
            else:
                queryset = queryset.filter(
                    Q(title__icontains=year)
                    | Q(abstract__icontains=year)
                    | Q(sections__content__icontains=year)
                    | Q(title__icontains=f"({year})")
                    | Q(title__icontains=f", {year}")
                    | Q(abstract__icontains=f"({year})")
                    | Q(abstract__icontains=f", {year}")
                    | Q(sections__content__icontains=f"({year})")
                    | Q(sections__content__icontains=f", {year}")
                )
            queryset = queryset.distinct()

        assay = params.get("assay")
        if assay:
            queryset = queryset.filter(
                Q(title__icontains=assay)
                | Q(abstract__icontains=assay)
                | Q(sections__content__icontains=assay)
            ).distinct()

        mission = params.get("mission")
        if mission:
            queryset = queryset.filter(
                Q(title__icontains=mission)
                | Q(abstract__icontains=mission)
                | Q(sections__content__icontains=mission)
            ).distinct()

        model_organism = params.get("model_organism")
        if model_organism:
            organism_value = model_organism.lower()
            queryset = queryset.filter(
                Q(title__icontains=organism_value)
                | Q(abstract__icontains=organism_value)
                | Q(sections__content__icontains=organism_value)
            ).distinct()

        molecular = params.get("molecular")
        if molecular:
            molecular_value = molecular.lower()
            queryset = queryset.filter(
                Q(title__icontains=molecular_value)
                | Q(abstract__icontains=molecular_value)
                | Q(sections__content__icontains=molecular_value)
            ).distinct()

        return queryset

    def get_queryset(self):
        params = self.request.query_params
        queryset = self._apply_basic_filters(Study.objects.all(), params)
        return queryset.order_by("-year", "title")

    @extend_schema(
        summary="Search studies",
        description=(
            "Perform semantic or text search across studies and evidence sentences while applying "
            "rich metadata filters backed by the facet endpoints."
        ),
        parameters=[
            OpenApiParameter(
                name="query",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Free-text query used for semantic and fallback keyword search.",
            ),
            OpenApiParameter(
                name="limit",
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description="Maximum number of studies to return (defaults to 20, capped at 100).",
            ),
            OpenApiParameter(
                name="threshold",
                type=OpenApiTypes.FLOAT,
                location=OpenApiParameter.QUERY,
                description="Minimum similarity threshold for semantic search matches (defaults to 0.3).",
            ),
            OpenApiParameter(
                name="organism",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Filter by organism keyword (e.g. Human, Mouse, Plant).",
            ),
            OpenApiParameter(
                name="exposure",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Filter by exposure condition such as Microgravity or Radiation.",
            ),
            OpenApiParameter(
                name="system",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Filter by affected biological system (e.g. Bone, Muscle).",
            ),
            OpenApiParameter(
                name="year",
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description="Prefer studies published in a specific year, with fuzzy fallback matching.",
            ),
            OpenApiParameter(
                name="assay",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Filter by assay type such as Sequencing or Proteomics.",
            ),
            OpenApiParameter(
                name="mission",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Filter by mission or platform keywords (ISS, Space Shuttle, etc.).",
            ),
            OpenApiParameter(
                name="model_organism",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Filter by model organism references inside studies.",
            ),
            OpenApiParameter(
                name="molecular",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Filter by molecular biology keywords (Gene, Omics, RNA, etc.).",
            ),
        ],
        responses={
            200: SearchResponseSerializer,
            400: OpenApiResponse(description="Invalid search parameters were supplied."),
        },
    )
    @action(detail=False, methods=["get"])
    def search(self, request):
        params = request.query_params
        query = params.get("query", "").strip()

        limit_param = params.get("limit")
        try:
            limit = int(limit_param) if limit_param else 20
        except (TypeError, ValueError):
            limit = 20
        limit = max(1, min(limit, 100))

        threshold_param = params.get("threshold")
        try:
            threshold = float(threshold_param) if threshold_param is not None else 0.3
        except (TypeError, ValueError):
            threshold = 0.3

        filtered_queryset = self._apply_advanced_filters(
            self._apply_basic_filters(Study.objects.all(), params),
            params,
        ).distinct()

        if not query:
            studies = list(filtered_queryset[:limit])
            results = [
                {
                    "study": StudySerializer(study).data,
                    "evidence_sentences": [],
                    "relevance_score": 1.0,
                }
                for study in studies
            ]
            return Response(
                {
                    "results": results,
                    "total": len(results),
                    "query": "",
                    "search_type": "filtered",
                }
            )

        allowed_study_ids = set(filtered_queryset.values_list("id", flat=True))

        if semantic_search.is_available():
            search_results = semantic_search.search(
                query, top_k=limit * 2, threshold=threshold
            )

            if search_results:
                evidence_ids = [result["evidence_id"] for result in search_results]
                evidence_sentences = semantic_search.get_evidence_by_ids(evidence_ids)

                studies_dict = {}
                for evidence in evidence_sentences:
                    study = evidence.study
                    if study.id not in allowed_study_ids:
                        continue

                    study_id = study.id
                    if study_id not in studies_dict:
                        studies_dict[study_id] = {
                            "study": study,
                            "evidence_sentences": [],
                            "max_similarity": 0.0,
                        }

                    similarity = next(
                        (
                            result["similarity_score"]
                            for result in search_results
                            if result["evidence_id"] == evidence.id
                        ),
                        0.0,
                    )

                    studies_dict[study_id]["evidence_sentences"].append(
                        {"evidence": evidence, "similarity": similarity}
                    )
                    studies_dict[study_id]["max_similarity"] = max(
                        studies_dict[study_id]["max_similarity"], similarity
                    )

                results = []
                for study_data in studies_dict.values():
                    evidence_list = [
                        item["evidence"] for item in study_data["evidence_sentences"]
                    ]
                    results.append(
                        {
                            "study": StudySerializer(study_data["study"]).data,
                            "evidence_sentences": EvidenceSentenceSerializer(
                                evidence_list, many=True
                            ).data,
                            "relevance_score": study_data["max_similarity"],
                        }
                    )

                results.sort(key=lambda item: item["relevance_score"], reverse=True)
                results = results[:limit]

                return Response(
                    {
                        "results": results,
                        "total": len(results),
                        "query": query,
                        "search_type": "semantic",
                    }
                )

        studies = filtered_queryset.filter(
            Q(title__icontains=query) | Q(abstract__icontains=query)
        ).distinct()[:limit]

        results = []
        for study in studies:
            evidence = EvidenceSentence.objects.filter(
                study=study, sentence_text__icontains=query
            )[:5]
            results.append(
                {
                    "study": StudySerializer(study).data,
                    "evidence_sentences": EvidenceSentenceSerializer(
                        evidence, many=True
                    ).data,
                    "relevance_score": 1.0,
                }
            )

        return Response(
            {
                "results": results,
                "total": len(results),
                "query": query,
                "search_type": "text",
            }
        )

    @extend_schema(
        summary="List sections for a study",
        description="Return ordered document sections associated with the selected study.",
        responses=SectionSerializer(many=True),
    )
    @action(detail=True, methods=["get"], url_path="sections")
    def sections(self, request, pk=None):
        study = self.get_object()
        sections = study.sections.all().order_by("order")
        serializer = SectionSerializer(sections, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="List evidence sentences for a study",
        description="Return curated evidence sentences linked to the selected study, ordered by section and sentence index.",
        responses=EvidenceSentenceSerializer(many=True),
    )
    @action(detail=True, methods=["get"], url_path="evidence")
    def evidence(self, request, pk=None):
        study = self.get_object()
        evidence = study.evidence_sentences.all().order_by("section", "sentence_index")
        serializer = EvidenceSentenceSerializer(evidence, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="List available search facets",
        description="Return aggregated counts that drive the search filter UI.",
        responses=FacetsResponseSerializer,
    )
    @action(detail=False, methods=["get"])
    def facets(self, request):
        organism_facets = []

        human_count = (
            Study.objects.filter(
                Q(title__icontains="human")
                | Q(abstract__icontains="human")
            )
            .exclude(
                Q(title__icontains="mouse")
                | Q(title__icontains="rat")
                | Q(title__icontains="animal")
            )
            .distinct()
            .count()
        )
        if human_count > 0:
            organism_facets.append({"name": "Human", "count": human_count})

        mouse_count = (
            Study.objects.filter(
                Q(title__icontains="mouse")
                | Q(abstract__icontains="mouse")
            )
            .distinct()
            .count()
        )
        if mouse_count > 0:
            organism_facets.append({"name": "Mouse", "count": mouse_count})

        other_organisms = ["Rat", "Plant", "Bacteria", "Other"]
        for organism in other_organisms:
            count = (
                Study.objects.filter(
                    Q(title__icontains=organism.lower())
                    | Q(abstract__icontains=organism.lower())
                )
                .distinct()
                .count()
            )
            if count > 0:
                organism_facets.append({"name": organism, "count": count})

        exposure_facets = []
        exposures = [
            "Microgravity",
            "Radiation",
            "Isolation",
            "Hypoxia",
            "Hypergravity",
            "Spaceflight",
            "Gravity",
        ]
        for exposure in exposures:
            count = (
                Study.objects.filter(
                    Q(title__icontains=exposure.lower())
                    | Q(abstract__icontains=exposure.lower())
                )
                .distinct()
                .count()
            )
            if count > 0:
                exposure_facets.append({"name": exposure, "count": count})

        system_facets = []
        systems = [
            "Bone",
            "Muscle",
            "Cardiovascular",
            "Immune",
            "Plant Root",
            "Nervous System",
            "Cell",
            "Tissue",
        ]
        for system in systems:
            count = (
                Study.objects.filter(
                    Q(title__icontains=system.lower())
                    | Q(abstract__icontains=system.lower())
                )
                .distinct()
                .count()
            )
            if count > 0:
                system_facets.append({"name": system, "count": count})

        model_organism_facets = []
        model_organisms = [
            "Arabidopsis",
            "Drosophila",
            "C. elegans",
            "Mouse",
            "Rat",
            "Human",
        ]
        for organism in model_organisms:
            if organism.lower() == "human":
                count = (
                    Study.objects.filter(
                        Q(title__icontains="human")
                        | Q(abstract__icontains="human")
                    )
                    .exclude(
                        Q(title__icontains="mouse")
                        | Q(title__icontains="rat")
                        | Q(title__icontains="animal")
                    )
                    .distinct()
                    .count()
                )
            else:
                count = (
                    Study.objects.filter(
                        Q(title__icontains=organism.lower())
                        | Q(abstract__icontains=organism.lower())
                    )
                    .distinct()
                    .count()
                )
            if count > 0:
                model_organism_facets.append({"name": organism, "count": count})

        molecular_facets = []
        molecular_terms = [
            "Gene",
            "Protein",
            "RNA",
            "DNA",
            "Molecular",
            "Omics",
            "Genomics",
            "Proteomics",
        ]
        for term in molecular_terms:
            count = (
                Study.objects.filter(
                    Q(title__icontains=term.lower())
                    | Q(abstract__icontains=term.lower())
                )
                .distinct()
                .count()
            )
            if count > 0:
                molecular_facets.append({"name": term, "count": count})

        year_facets = []
        years = [str(year) for year in range(2024, 1990, -1)]
        for year in years:
            try:
                year_int = int(year)
            except ValueError:
                continue

            count = Study.objects.filter(year=year_int).count()
            if count == 0:
                count = (
                    Study.objects.filter(
                        Q(title__icontains=year)
                        | Q(abstract__icontains=year)
                        | Q(title__icontains=f"({year})")
                        | Q(title__icontains=f", {year}")
                        | Q(abstract__icontains=f"({year})")
                        | Q(abstract__icontains=f", {year}")
                    )
                    .distinct()
                    .count()
                )

            if count > 0:
                year_facets.append({"name": year, "count": count})

        journal_facets = []
        journals = [
            "NPJ Microgravity",
            "Life Sciences in Space Research",
            "Gravitational and Space Research",
            "Acta Astronautica",
            "Space Biology and Medicine",
            "Journal of Applied Physiology",
            "Physiological Reports",
            "Scientific Reports",
        ]
        for journal in journals:
            count = (
                Study.objects.filter(
                    Q(title__icontains=journal)
                    | Q(abstract__icontains=journal)
                )
                .distinct()
                .count()
            )
            if count > 0:
                journal_facets.append({"name": journal, "count": count})

        assay_facets = []
        assays = [
            "Microscopy",
            "PCR",
            "Flow Cytometry",
            "Sequencing",
            "Proteomics",
            "Genomics",
            "Mass Spectrometry",
        ]
        for assay in assays:
            count = (
                Study.objects.filter(
                    Q(title__icontains=assay)
                    | Q(abstract__icontains=assay)
                )
                .distinct()
                .count()
            )
            if count > 0:
                assay_facets.append({"name": assay, "count": count})

        mission_facets = []
        missions = [
            "ISS",
            "Space Shuttle",
            "Parabolic Flight",
            "Antarctica",
            "Mars",
            "Simulation",
            "Flight",
            "Station",
        ]
        for mission in missions:
            count = (
                Study.objects.filter(
                    Q(title__icontains=mission)
                    | Q(abstract__icontains=mission)
                )
                .distinct()
                .count()
            )
            if count > 0:
                mission_facets.append({"name": mission, "count": count})

        entity_types = Entity.objects.values("entity_type").annotate(
            count=Count("entity_type")
        )
        entity_facets = [
            {"name": entry["entity_type"], "count": entry["count"]}
            for entry in entity_types
            if entry["entity_type"]
        ]

        return Response(
            {
                "total_studies": Study.objects.count(),
                "organisms": organism_facets,
                "exposures": exposure_facets,
                "systems": system_facets,
                "model_organisms": model_organism_facets,
                "molecular": molecular_facets,
                "years": year_facets,
                "assays": assay_facets,
                "missions": mission_facets,
                "journals": journal_facets,
                "entity_types": entity_facets,
            }
        )

    @extend_schema(
        summary="Diagnose study data ingestion",
        description="Return helpful counts that confirm index population and year metadata coverage.",
        responses=StudyDebugSerializer,
    )
    @action(detail=False, methods=["get"])
    def debug(self, request):
        total_studies = Study.objects.count()
        studies_with_year = Study.objects.exclude(year__isnull=True).count()
        sample_years = list(
            Study.objects.exclude(year__isnull=True).values_list("year", flat=True)[:10]
        )

        return Response(
            {
                "total_studies": total_studies,
                "studies_with_year": studies_with_year,
                "sample_years": sample_years,
                "year_field_type": (
                    "integer" if sample_years and isinstance(sample_years[0], int) else "string"
                ),
            }
        )


@extend_schema_view(
    list=extend_schema(
        summary="List sections",
        description="Retrieve sections for studies with optional filtering by study and section type.",
        parameters=[
            OpenApiParameter(
                name="study_id",
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description="Return only sections belonging to the specified study.",
            ),
            OpenApiParameter(
                name="section_type",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Filter sections by their canonical type (Introduction, Methods, etc.).",
            ),
        ],
        responses=SectionSerializer(many=True),
    ),
    retrieve=extend_schema(
        summary="Retrieve a section",
        description="Return the title, ordering, and full text for a single section record.",
        responses=SectionSerializer,
    ),
)
class SectionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Section.objects.all()
    serializer_class = SectionSerializer

    def get_queryset(self):
        queryset = Section.objects.all()
        study_id = self.request.query_params.get("study_id")
        if study_id:
            queryset = queryset.filter(study_id=study_id)

        section_type = self.request.query_params.get("section_type")
        if section_type:
            queryset = queryset.filter(section_type=section_type)

        return queryset.order_by("study", "order")


@extend_schema_view(
    list=extend_schema(
        summary="List evidence sentences",
        description="Retrieve curated evidence sentences with optional study and keyword filters.",
        parameters=[
            OpenApiParameter(
                name="study_id",
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description="Return only sentences extracted from the given study.",
            ),
            OpenApiParameter(
                name="search",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Full-text search within sentence content.",
            ),
        ],
        responses=EvidenceSentenceSerializer(many=True),
    ),
    retrieve=extend_schema(
        summary="Retrieve an evidence sentence",
        description="Return a single evidence sentence with study and section context.",
        responses=EvidenceSentenceSerializer,
    ),
)
class EvidenceSentenceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = EvidenceSentence.objects.all()
    serializer_class = EvidenceSentenceSerializer

    def get_queryset(self):
        queryset = EvidenceSentence.objects.all()
        study_id = self.request.query_params.get("study_id")
        if study_id:
            queryset = queryset.filter(study_id=study_id)

        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(sentence_text__icontains=search)

        return queryset.order_by("study", "section", "sentence_index")


@extend_schema_view(
    list=extend_schema(
        summary="List entities",
        description="Browse detected entities with optional filtering by type or name.",
        parameters=[
            OpenApiParameter(
                name="entity_type",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Filter to entities of the provided type (Gene, Protein, etc.).",
            ),
            OpenApiParameter(
                name="search",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Case-insensitive search across entity names.",
            ),
        ],
        responses=EntitySerializer(many=True),
    ),
    retrieve=extend_schema(
        summary="Retrieve an entity",
        description="Return metadata for a single named entity.",
        responses=EntitySerializer,
    ),
)
class EntityViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Entity.objects.all()
    serializer_class = EntitySerializer

    def get_queryset(self):
        queryset = Entity.objects.all()
        entity_type = self.request.query_params.get("entity_type")
        if entity_type:
            queryset = queryset.filter(entity_type=entity_type)

        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(name__icontains=search)

        return queryset.order_by("entity_type", "name")


@extend_schema_view(
    list=extend_schema(
        summary="List knowledge graph triples",
        description="Browse extracted subject-relation-object triples with optional filters.",
        parameters=[
            OpenApiParameter(
                name="study_id",
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description="Restrict triples to those originating from the specified study.",
            ),
            OpenApiParameter(
                name="relation",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Filter triples by relation type.",
            ),
        ],
        responses=TripleSerializer(many=True),
    ),
    retrieve=extend_schema(
        summary="Retrieve a knowledge graph triple",
        description="Return the subject, relation, object, and provenance for a single triple.",
        responses=TripleSerializer,
    ),
)
class TripleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Triple.objects.all()
    serializer_class = TripleSerializer

    def get_queryset(self):
        queryset = Triple.objects.all()
        study_id = self.request.query_params.get("study_id")
        if study_id:
            queryset = queryset.filter(study_id=study_id)

        relation = self.request.query_params.get("relation")
        if relation:
            queryset = queryset.filter(relation=relation)

        return queryset.order_by("study", "subject_entity", "relation", "object_entity")
from rest_framework import serializers
from .models import (
    Study,
    Section,
    EvidenceSentence,
    Entity,
    EntityOccurrence,
    Triple,
)


class StudySerializer(serializers.ModelSerializer):
    sections_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Study
        fields = [
            'id', 'title', 'authors', 'year', 'journal',
            'pmcid', 'pmc_url', 'abstract', 'summary', 'sections_count',
            'created_at', 'updated_at'
        ]
    
    def get_sections_count(self, obj):
        return obj.sections.count()


class SectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Section
        fields = [
            'id', 'section_type', 'title', 'content', 'order'
        ]


class EvidenceSentenceSerializer(serializers.ModelSerializer):
    study_title = serializers.CharField(source='study.title', read_only=True)
    section_title = serializers.CharField(source='section.title', read_only=True)
    
    class Meta:
        model = EvidenceSentence
        fields = [
            'id', 'sentence_text', 'sentence_index', 
            'study_title', 'section_title', 'created_at'
        ]


class EntitySerializer(serializers.ModelSerializer):
    occurrence_count = serializers.SerializerMethodField()

    class Meta:
        model = Entity
        fields = [
            'id', 'name', 'entity_type', 'canonical_id', 'description', 'occurrence_count'
        ]

    def get_occurrence_count(self, obj):
        count = getattr(obj, 'occurrence_count', None)
        if count is None:
            return obj.occurrences.count() if hasattr(obj, 'occurrences') else 0
        return count


class EntityOccurrenceSerializer(serializers.ModelSerializer):
    entity = EntitySerializer(read_only=True)
    section_title = serializers.CharField(source='section.title', read_only=True)
    section_type = serializers.CharField(source='section.section_type', read_only=True)
    evidence_id = serializers.IntegerField(source='evidence_sentence_id', read_only=True)
    study_id = serializers.IntegerField(source='study_id', read_only=True)

    class Meta:
        model = EntityOccurrence
        fields = [
            'id', 'study_id', 'entity', 'section_title', 'section_type', 'start_char', 'end_char',
            'evidence_id', 'source'
        ]


class TripleSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject_entity.name', read_only=True)
    object_name = serializers.CharField(source='object_entity.name', read_only=True)
    study_title = serializers.CharField(source='study.title', read_only=True)
    subject_id = serializers.IntegerField(source='subject_entity_id', read_only=True)
    object_id = serializers.IntegerField(source='object_entity_id', read_only=True)
    
    class Meta:
        model = Triple
        fields = [
            'id', 'subject_id', 'subject_name', 'relation', 'object_id', 'object_name',
            'study_title', 'confidence', 'qualifiers'
        ]


class SearchResultSerializer(serializers.Serializer):
    """Serializer for search results combining studies and evidence"""
    study = StudySerializer()
    evidence_sentences = EvidenceSentenceSerializer(many=True)
    relevance_score = serializers.FloatField(required=False)


class FacetSerializer(serializers.Serializer):
    """Serializer for filter facets"""
    name = serializers.CharField()
    count = serializers.IntegerField()
    type = serializers.CharField(required=False, allow_null=True, allow_blank=True)


class FacetsResponseSerializer(serializers.Serializer):
    """Aggregated facet buckets used by the search UI"""
    total_studies = serializers.IntegerField()
    organisms = FacetSerializer(many=True)
    exposures = FacetSerializer(many=True)
    systems = FacetSerializer(many=True)
    model_organisms = FacetSerializer(many=True)
    molecular = FacetSerializer(many=True)
    years = FacetSerializer(many=True)
    assays = FacetSerializer(many=True)
    missions = FacetSerializer(many=True)
    journals = FacetSerializer(many=True)
    entity_types = FacetSerializer(many=True)


class SearchResponseSerializer(serializers.Serializer):
    """Top-level serializer for study search responses"""
    results = SearchResultSerializer(many=True)
    total = serializers.IntegerField()
    query = serializers.CharField()
    search_type = serializers.ChoiceField(choices=['semantic', 'text', 'filtered'])


class StudyDebugSerializer(serializers.Serializer):
    """Payload returned by the debug endpoint"""
    total_studies = serializers.IntegerField()
    studies_with_year = serializers.IntegerField()
    sample_years = serializers.ListField(child=serializers.IntegerField(), allow_empty=True)
    year_field_type = serializers.CharField()


class StudySummarySerializer(serializers.Serializer):
    """Serializer for study summary responses"""

    study_id = serializers.IntegerField()
    summary = serializers.CharField()
    generated = serializers.BooleanField()


class StudyEntitiesResponseSerializer(serializers.Serializer):
    """Serializer for study-level entity listings"""

    study_id = serializers.IntegerField()
    total_entities = serializers.IntegerField()
    entities = EntitySerializer(many=True)
    occurrences = EntityOccurrenceSerializer(many=True)

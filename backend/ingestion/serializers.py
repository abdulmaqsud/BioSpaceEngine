from rest_framework import serializers
from .models import Study, Section, EvidenceSentence, Entity, Triple


class StudySerializer(serializers.ModelSerializer):
    sections_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Study
        fields = [
            'id', 'title', 'authors', 'year', 'journal', 
            'pmcid', 'pmc_url', 'abstract', 'sections_count',
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
    class Meta:
        model = Entity
        fields = [
            'id', 'name', 'entity_type', 'canonical_id', 'description'
        ]


class TripleSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject_entity.name', read_only=True)
    object_name = serializers.CharField(source='object_entity.name', read_only=True)
    study_title = serializers.CharField(source='study.title', read_only=True)
    
    class Meta:
        model = Triple
        fields = [
            'id', 'subject_name', 'relation', 'object_name', 
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

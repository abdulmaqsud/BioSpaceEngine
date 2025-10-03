from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count
from django.core.paginator import Paginator
from .models import Study, Section, EvidenceSentence, Entity, Triple
from .serializers import (
    StudySerializer, SectionSerializer, EvidenceSentenceSerializer,
    EntitySerializer, TripleSerializer, SearchResultSerializer, FacetSerializer
)
from .services import semantic_search


class StudyViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for studies with search and filtering"""
    queryset = Study.objects.all()
    serializer_class = StudySerializer
    
    def get_queryset(self):
        queryset = Study.objects.all()
        
        # Search by title or abstract
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(abstract__icontains=search)
            )
        
        # Filter by year range
        year_from = self.request.query_params.get('year_from', None)
        year_to = self.request.query_params.get('year_to', None)
        if year_from:
            queryset = queryset.filter(year__gte=year_from)
        if year_to:
            queryset = queryset.filter(year__lte=year_to)
        
        # Filter by journal
        journal = self.request.query_params.get('journal', None)
        if journal:
            queryset = queryset.filter(journal__icontains=journal)
        
        return queryset.order_by('-year', 'title')
    
    @action(detail=True, methods=['get'])
    def sections(self, request, pk=None):
        """Get sections for a specific study"""
        study = self.get_object()
        sections = study.sections.all().order_by('order')
        serializer = SectionSerializer(sections, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def evidence(self, request, pk=None):
        """Get evidence sentences for a specific study"""
        study = self.get_object()
        evidence = study.evidence_sentences.all().order_by('section', 'sentence_index')
        serializer = EvidenceSentenceSerializer(evidence, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Semantic search across studies and evidence"""
        query = request.query_params.get('q', '')
        limit = int(request.query_params.get('limit', 20))
        threshold = float(request.query_params.get('threshold', 0.5))
        
        if not query:
            return Response({'results': [], 'total': 0})
        
        # Try semantic search first
        if semantic_search.is_available():
            search_results = semantic_search.search(query, top_k=limit, threshold=threshold)
            
            if search_results:
                # Get evidence sentences and group by study
                evidence_ids = [r['evidence_id'] for r in search_results]
                evidence_sentences = semantic_search.get_evidence_by_ids(evidence_ids)
                
                # Group by study
                studies_dict = {}
                for evidence in evidence_sentences:
                    study_id = evidence.study_id
                    if study_id not in studies_dict:
                        studies_dict[study_id] = {
                            'study': evidence.study,
                            'evidence_sentences': [],
                            'max_similarity': 0.0
                        }
                    
                    # Find similarity score for this evidence
                    similarity = next(
                        (r['similarity_score'] for r in search_results if r['evidence_id'] == evidence.id),
                        0.0
                    )
                    
                    studies_dict[study_id]['evidence_sentences'].append({
                        'evidence': evidence,
                        'similarity': similarity
                    })
                    studies_dict[study_id]['max_similarity'] = max(
                        studies_dict[study_id]['max_similarity'], similarity
                    )
                
                # Format results
                results = []
                for study_data in studies_dict.values():
                    evidence_list = [es['evidence'] for es in study_data['evidence_sentences']]
                    result = {
                        'study': StudySerializer(study_data['study']).data,
                        'evidence_sentences': EvidenceSentenceSerializer(evidence_list, many=True).data,
                        'relevance_score': study_data['max_similarity']
                    }
                    results.append(result)
                
                return Response({
                    'results': results,
                    'total': len(results),
                    'query': query,
                    'search_type': 'semantic'
                })
        
        # Fallback to simple text search
        studies = Study.objects.filter(
            Q(title__icontains=query) | 
            Q(abstract__icontains=query)
        )[:limit]
        
        results = []
        for study in studies:
            # Find relevant evidence sentences
            evidence = EvidenceSentence.objects.filter(
                study=study,
                sentence_text__icontains=query
            )[:5]  # Top 5 relevant sentences
            
            result = {
                'study': StudySerializer(study).data,
                'evidence_sentences': EvidenceSentenceSerializer(evidence, many=True).data,
                'relevance_score': 1.0  # Placeholder
            }
            results.append(result)
        
        return Response({
            'results': results,
            'total': len(results),
            'query': query,
            'search_type': 'text'
        })
    
    @action(detail=False, methods=['get'])
    def facets(self, request):
        """Get available filter facets"""
        # Years
        years = Study.objects.values_list('year', flat=True).distinct().order_by('year')
        year_facets = [{'name': str(year), 'count': Study.objects.filter(year=year).count(), 'type': 'year'} 
                      for year in years if year is not None]
        
        # Journals
        journals = Study.objects.values('journal').annotate(count=Count('journal')).order_by('-count')[:20]
        journal_facets = [{'name': j['journal'], 'count': j['count'], 'type': 'journal'} 
                        for j in journals if j['journal']]
        
        # Entity types (when entities are populated)
        entity_types = Entity.objects.values('entity_type').annotate(count=Count('entity_type'))
        entity_facets = [{'name': et['entity_type'], 'count': et['count'], 'type': 'entity_type'} 
                        for et in entity_types]
        
        all_facets = year_facets + journal_facets + entity_facets
        
        return Response({
            'facets': all_facets,
            'total_facets': len(all_facets)
        })


class SectionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for document sections"""
    queryset = Section.objects.all()
    serializer_class = SectionSerializer
    
    def get_queryset(self):
        queryset = Section.objects.all()
        
        # Filter by study
        study_id = self.request.query_params.get('study_id', None)
        if study_id:
            queryset = queryset.filter(study_id=study_id)
        
        # Filter by section type
        section_type = self.request.query_params.get('section_type', None)
        if section_type:
            queryset = queryset.filter(section_type=section_type)
        
        return queryset.order_by('study', 'order')


class EvidenceSentenceViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for evidence sentences"""
    queryset = EvidenceSentence.objects.all()
    serializer_class = EvidenceSentenceSerializer
    
    def get_queryset(self):
        queryset = EvidenceSentence.objects.all()
        
        # Filter by study
        study_id = self.request.query_params.get('study_id', None)
        if study_id:
            queryset = queryset.filter(study_id=study_id)
        
        # Search in sentence text
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(sentence_text__icontains=search)
        
        return queryset.order_by('study', 'section', 'sentence_index')


class EntityViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for entities"""
    queryset = Entity.objects.all()
    serializer_class = EntitySerializer
    
    def get_queryset(self):
        queryset = Entity.objects.all()
        
        # Filter by entity type
        entity_type = self.request.query_params.get('entity_type', None)
        if entity_type:
            queryset = queryset.filter(entity_type=entity_type)
        
        # Search by name
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(name__icontains=search)
        
        return queryset.order_by('entity_type', 'name')


class TripleViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for knowledge graph triples"""
    queryset = Triple.objects.all()
    serializer_class = TripleSerializer
    
    def get_queryset(self):
        queryset = Triple.objects.all()
        
        # Filter by study
        study_id = self.request.query_params.get('study_id', None)
        if study_id:
            queryset = queryset.filter(study_id=study_id)
        
        # Filter by relation
        relation = self.request.query_params.get('relation', None)
        if relation:
            queryset = queryset.filter(relation=relation)
        
        return queryset.order_by('study', 'subject_entity', 'relation', 'object_entity')
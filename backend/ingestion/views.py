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
        """Semantic search across studies and evidence with filtering"""
        query = request.query_params.get('q', '')
        limit = int(request.query_params.get('limit', 20))
        threshold = float(request.query_params.get('threshold', 0.5))
        
        # Filter parameters
        organism = request.query_params.get('organism', '')
        exposure = request.query_params.get('exposure', '')
        system = request.query_params.get('system', '')
        year = request.query_params.get('year', '')
        assay = request.query_params.get('assay', '')
        mission = request.query_params.get('mission', '')

        # Build base queryset with filters
        studies_queryset = Study.objects.all()
        
        # Apply filters with more specific matching
        if organism:
            # More specific organism matching
            if organism.lower() == 'human':
                studies_queryset = studies_queryset.filter(
                    Q(title__icontains='human') | 
                    Q(abstract__icontains='human') |
                    Q(sections__content__icontains='human')
                ).exclude(
                    Q(title__icontains='mouse') | 
                    Q(title__icontains='rat') | 
                    Q(title__icontains='animal')
                ).distinct()
            elif organism.lower() == 'mouse':
                studies_queryset = studies_queryset.filter(
                    Q(title__icontains='mouse') | 
                    Q(abstract__icontains='mouse') |
                    Q(sections__content__icontains='mouse')
                ).distinct()
            elif organism.lower() == 'plant':
                studies_queryset = studies_queryset.filter(
                    Q(title__icontains='plant') | 
                    Q(abstract__icontains='plant') |
                    Q(sections__content__icontains='plant')
                ).distinct()
            else:
                studies_queryset = studies_queryset.filter(
                    Q(title__icontains=organism.lower()) | 
                    Q(abstract__icontains=organism.lower()) |
                    Q(sections__content__icontains=organism.lower())
                ).distinct()
        
        if exposure:
            # More specific exposure matching
            if exposure.lower() == 'microgravity':
                studies_queryset = studies_queryset.filter(
                    Q(title__icontains='microgravity') | 
                    Q(abstract__icontains='microgravity') |
                    Q(sections__content__icontains='microgravity')
                ).distinct()
            elif exposure.lower() == 'radiation':
                studies_queryset = studies_queryset.filter(
                    Q(title__icontains='radiation') | 
                    Q(abstract__icontains='radiation') |
                    Q(sections__content__icontains='radiation')
                ).distinct()
            else:
                studies_queryset = studies_queryset.filter(
                    Q(title__icontains=exposure.lower()) | 
                    Q(abstract__icontains=exposure.lower()) |
                    Q(sections__content__icontains=exposure.lower())
                ).distinct()
        
        if system:
            # More specific system matching
            if system.lower() == 'bone':
                studies_queryset = studies_queryset.filter(
                    Q(title__icontains='bone') | 
                    Q(abstract__icontains='bone') |
                    Q(sections__content__icontains='bone')
                ).distinct()
            elif system.lower() == 'muscle':
                studies_queryset = studies_queryset.filter(
                    Q(title__icontains='muscle') | 
                    Q(abstract__icontains='muscle') |
                    Q(sections__content__icontains='muscle')
                ).distinct()
            else:
                studies_queryset = studies_queryset.filter(
                    Q(title__icontains=system.lower()) | 
                    Q(abstract__icontains=system.lower()) |
                    Q(sections__content__icontains=system.lower())
                ).distinct()
        
        if year:
            # Since year field is not populated, filter by year mentioned in title/abstract
            studies_queryset = studies_queryset.filter(
                Q(title__icontains=year) | 
                Q(abstract__icontains=year) |
                Q(sections__content__icontains=year)
            ).distinct()
        
        if assay:
            studies_queryset = studies_queryset.filter(
                Q(title__icontains=assay) | 
                Q(abstract__icontains=assay) |
                Q(sections__content__icontains=assay)
            ).distinct()
        
        if mission:
            studies_queryset = studies_queryset.filter(
                Q(title__icontains=mission) | 
                Q(abstract__icontains=mission) |
                Q(sections__content__icontains=mission)
            ).distinct()

        if not query:
            # If no query, return filtered studies with a reasonable limit
            max_results = min(limit, 100)  # Cap at 100 results for filter-only searches
            studies = studies_queryset[:max_results]
            results = []
            for study in studies:
                result = {
                    'study': StudySerializer(study).data,
                    'evidence_sentences': [],
                    'relevance_score': 1.0
                }
                results.append(result)
            
            return Response({
                'results': results,
                'total': len(results),
                'query': '',
                'search_type': 'filtered'
            })

        # Try semantic search first
        if semantic_search.is_available():
            search_results = semantic_search.search(query, top_k=limit*2, threshold=threshold)

            if search_results:
                # Get evidence sentences and group by study
                evidence_ids = [r['evidence_id'] for r in search_results]
                evidence_sentences = semantic_search.get_evidence_by_ids(evidence_ids)

                # Group by study and apply filters
                studies_dict = {}
                for evidence in evidence_sentences:
                    study = evidence.study
                    
                    # Check if study passes filters
                    if study not in studies_queryset:
                        continue
                        
                    study_id = study.id
                    if study_id not in studies_dict:
                        studies_dict[study_id] = {
                            'study': study,
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
                
                # Sort by relevance and limit
                results.sort(key=lambda x: x['relevance_score'], reverse=True)
                results = results[:limit]

                return Response({
                    'results': results,
                    'total': len(results),
                    'query': query,
                    'search_type': 'semantic'
                })

        # Fallback to simple text search with filters
        studies = studies_queryset.filter(
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
                
                # Get actual organism counts from the database
                organism_facets = []
                organisms = ['Human', 'Mouse', 'Rat', 'Plant', 'Bacteria', 'Other']
                for organism in organisms:
                    count = Study.objects.filter(
                        Q(title__icontains=organism.lower()) | 
                        Q(abstract__icontains=organism.lower()) |
                        Q(sections__content__icontains=organism.lower())
                    ).distinct().count()
                    if count > 0:
                        organism_facets.append({'name': organism, 'count': count})
                
                # Get actual year counts from the database
                year_facets = []
                years = ['2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016']
                for year in years:
                    count = Study.objects.filter(
                        Q(title__icontains=year) | 
                        Q(abstract__icontains=year) |
                        Q(sections__content__icontains=year)
                    ).distinct().count()
                    if count > 0:
                        year_facets.append({'name': year, 'count': count})
                
                # Get actual journal counts from the database
                journal_facets = []
                journals = ['NPJ Microgravity', 'Life Sciences in Space Research', 'Gravitational and Space Research', 
                           'Acta Astronautica', 'Space Biology and Medicine', 'Journal of Applied Physiology', 
                           'Physiological Reports', 'Scientific Reports']
                for journal in journals:
                    count = Study.objects.filter(
                        Q(title__icontains=journal) | 
                        Q(abstract__icontains=journal) |
                        Q(sections__content__icontains=journal)
                    ).distinct().count()
                    if count > 0:
                        journal_facets.append({'name': journal, 'count': count})
                
                # Entity types (when entities are populated)
                entity_types = Entity.objects.values('entity_type').annotate(count=Count('entity_type'))
                entity_facets = [{'name': et['entity_type'], 'count': et['count']} for et in entity_types if et['entity_type']]
                
                return Response({
                    'organisms': organism_facets,
                    'years': year_facets,
                    'journals': journal_facets,
                    'entity_types': entity_facets,
                })
    
    @action(detail=False, methods=['get'])
    def debug(self, request):
        """Debug endpoint to check database content"""
        total_studies = Study.objects.count()
        studies_with_year = Study.objects.exclude(year__isnull=True).count()
        sample_years = list(Study.objects.exclude(year__isnull=True).values_list('year', flat=True)[:10])
        
        return Response({
            'total_studies': total_studies,
            'studies_with_year': studies_with_year,
            'sample_years': sample_years,
            'year_field_type': 'integer' if sample_years and isinstance(sample_years[0], int) else 'string'
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
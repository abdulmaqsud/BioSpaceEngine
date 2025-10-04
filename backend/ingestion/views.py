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
        model_organism = request.query_params.get('model_organism', '')
        molecular = request.query_params.get('molecular', '')

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
            # First try to use the year field if it's populated
            year_int = int(year)
            year_filtered = studies_queryset.filter(year=year_int)
            
            # If no results from year field, fall back to content search
            if year_filtered.count() == 0:
                studies_queryset = studies_queryset.filter(
                    Q(title__icontains=year) | 
                    Q(abstract__icontains=year) |
                    Q(sections__content__icontains=year) |
                    Q(title__icontains=f"({year})") |  # Year in parentheses
                    Q(title__icontains=f", {year}") |  # Year after comma
                    Q(abstract__icontains=f"({year})") |
                    Q(abstract__icontains=f", {year}") |
                    Q(sections__content__icontains=f"({year})") |
                    Q(sections__content__icontains=f", {year}")
                ).distinct()
            else:
                studies_queryset = year_filtered
        
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

        # Model organism filtering
        if model_organism:
            studies_queryset = studies_queryset.filter(
                Q(title__icontains=model_organism.lower()) | 
                Q(abstract__icontains=model_organism.lower()) |
                Q(sections__content__icontains=model_organism.lower())
            ).distinct()

        # Molecular biology filtering
        if molecular:
            studies_queryset = studies_queryset.filter(
                Q(title__icontains=molecular.lower()) | 
                Q(abstract__icontains=molecular.lower()) |
                Q(sections__content__icontains=molecular.lower())
            ).distinct()

        if not query:
            # If no query, return filtered studies
            studies = studies_queryset[:limit]
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
        
        # Get actual organism counts from the database (matching search logic)
        organism_facets = []
        
        # Human count (excluding mouse/rat studies)
        human_count = Study.objects.filter(
            Q(title__icontains='human') | 
            Q(abstract__icontains='human') |
            Q(sections__content__icontains='human')
        ).exclude(
            Q(title__icontains='mouse') | 
            Q(title__icontains='rat') | 
            Q(title__icontains='animal')
        ).distinct().count()
        if human_count > 0:
            organism_facets.append({'name': 'Human', 'count': human_count})
        
        # Mouse count
        mouse_count = Study.objects.filter(
            Q(title__icontains='mouse') | 
            Q(abstract__icontains='mouse') |
            Q(sections__content__icontains='mouse')
        ).distinct().count()
        if mouse_count > 0:
            organism_facets.append({'name': 'Mouse', 'count': mouse_count})
        
        # Other organisms
        other_organisms = ['Rat', 'Plant', 'Bacteria', 'Other']
        for organism in other_organisms:
            count = Study.objects.filter(
                Q(title__icontains=organism.lower()) | 
                Q(abstract__icontains=organism.lower()) |
                Q(sections__content__icontains=organism.lower())
            ).distinct().count()
            if count > 0:
                organism_facets.append({'name': organism, 'count': count})
        
        # Get exposure categories (more relevant for space biology)
        exposure_facets = []
        exposures = ['Microgravity', 'Radiation', 'Isolation', 'Hypoxia', 'Hypergravity', 'Spaceflight', 'Gravity']
        for exposure in exposures:
            count = Study.objects.filter(
                Q(title__icontains=exposure.lower()) | 
                Q(abstract__icontains=exposure.lower()) |
                Q(sections__content__icontains=exposure.lower())
            ).distinct().count()
            if count > 0:
                exposure_facets.append({'name': exposure, 'count': count})
        
        # Get system categories (more relevant for space biology)
        system_facets = []
        systems = ['Bone', 'Muscle', 'Cardiovascular', 'Immune', 'Plant Root', 'Nervous System', 'Cell', 'Tissue']
        for system in systems:
            count = Study.objects.filter(
                Q(title__icontains=system.lower()) | 
                Q(abstract__icontains=system.lower()) |
                Q(sections__content__icontains=system.lower())
            ).distinct().count()
            if count > 0:
                system_facets.append({'name': system, 'count': count})
        
        # Get model organism categories (major missing category!)
        model_organism_facets = []
        model_organisms = ['Arabidopsis', 'Drosophila', 'C. elegans', 'Mouse', 'Rat', 'Human']
        for organism in model_organisms:
            if organism.lower() == 'human':
                # Use same logic as organism facets (exclude mouse/rat)
                count = Study.objects.filter(
                    Q(title__icontains='human') | 
                    Q(abstract__icontains='human') |
                    Q(sections__content__icontains='human')
                ).exclude(
                    Q(title__icontains='mouse') | 
                    Q(title__icontains='rat') | 
                    Q(title__icontains='animal')
                ).distinct().count()
            else:
                count = Study.objects.filter(
                    Q(title__icontains=organism.lower()) | 
                    Q(abstract__icontains=organism.lower()) |
                    Q(sections__content__icontains=organism.lower())
                ).distinct().count()
            if count > 0:
                model_organism_facets.append({'name': organism, 'count': count})
        
        # Get molecular biology categories (major missing category!)
        molecular_facets = []
        molecular_terms = ['Gene', 'Protein', 'RNA', 'DNA', 'Molecular', 'Omics', 'Genomics', 'Proteomics']
        for term in molecular_terms:
            count = Study.objects.filter(
                Q(title__icontains=term.lower()) | 
                Q(abstract__icontains=term.lower()) |
                Q(sections__content__icontains=term.lower())
            ).distinct().count()
            if count > 0:
                molecular_facets.append({'name': term, 'count': count})
        
        # Get actual year counts from the database
        year_facets = []
        years = [str(year) for year in range(2024, 1990, -1)]  # 2024 to 1991 (expanded range)
        for year in years:
            # First try to use the year field if it's populated
            year_int = int(year)
            count = Study.objects.filter(year=year_int).count()
            
            # If no results from year field, fall back to content search
            if count == 0:
                count = Study.objects.filter(
                    Q(title__icontains=year) | 
                    Q(abstract__icontains=year) |
                    Q(sections__content__icontains=year) |
                    Q(title__icontains=f"({year})") |  # Year in parentheses
                    Q(title__icontains=f", {year}") |  # Year after comma
                    Q(abstract__icontains=f"({year})") |
                    Q(abstract__icontains=f", {year}") |
                    Q(sections__content__icontains=f"({year})") |
                    Q(sections__content__icontains=f", {year}")
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
        
        # Get assay categories (using terms that actually exist in studies)
        assay_facets = []
        assays = ['Microscopy', 'PCR', 'Flow Cytometry', 'Sequencing', 'Proteomics', 'Genomics', 'Mass Spectrometry']
        for assay in assays:
            count = Study.objects.filter(
                Q(title__icontains=assay) | 
                Q(abstract__icontains=assay) |
                Q(sections__content__icontains=assay)
            ).distinct().count()
            if count > 0:
                assay_facets.append({'name': assay, 'count': count})
        
        # Get mission categories (using terms that actually exist in studies)
        mission_facets = []
        missions = ['ISS', 'Space Shuttle', 'Parabolic Flight', 'Antarctica', 'Mars', 'Simulation', 'Flight', 'Station']
        for mission in missions:
            count = Study.objects.filter(
                Q(title__icontains=mission) | 
                Q(abstract__icontains=mission) |
                Q(sections__content__icontains=mission)
            ).distinct().count()
            if count > 0:
                mission_facets.append({'name': mission, 'count': count})
        
        # Entity types (when entities are populated)
        entity_types = Entity.objects.values('entity_type').annotate(count=Count('entity_type'))
        entity_facets = [{'name': et['entity_type'], 'count': et['count']} for et in entity_types if et['entity_type']]
        
        return Response({
            'organisms': organism_facets,
            'exposures': exposure_facets,
            'systems': system_facets,
            'model_organisms': model_organism_facets,
            'molecular': molecular_facets,
            'years': year_facets,
            'assays': assay_facets,
            'missions': mission_facets,
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
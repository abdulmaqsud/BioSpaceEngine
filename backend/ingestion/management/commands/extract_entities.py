import spacy
import re
from django.core.management.base import BaseCommand, CommandError
from ingestion.models import Study, Section, Entity, EvidenceSentence


class Command(BaseCommand):
    help = 'Extract entities from study sections using scispaCy'

    def add_arguments(self, parser):
        parser.add_argument(
            '--limit',
            type=int,
            default=None,
            help='Limit number of studies to process'
        )
        parser.add_argument(
            '--study-id',
            type=int,
            default=None,
            help='Process specific study ID only'
        )
        parser.add_argument(
            '--model',
            type=str,
            default='en_core_web_sm',
            help='spaCy model to use (default: en_core_web_sm)'
        )

    def handle(self, *args, **options):
        limit = options['limit']
        study_id = options['study_id']
        model_name = options['model']
        
        # Load spaCy model
        try:
            self.stdout.write(f"Loading spaCy model: {model_name}")
            nlp = spacy.load(model_name)
        except OSError:
            self.stdout.write(
                self.style.WARNING(
                    f"Model {model_name} not found. Please install it first:\n"
                    f"python -m spacy download {model_name}"
                )
            )
            return
        
        # Get studies to process
        if study_id:
            studies = Study.objects.filter(id=study_id)
        else:
            studies = Study.objects.all()
            if limit:
                studies = studies[:limit]
        
        self.stdout.write(f"Processing {studies.count()} studies...")
        
        processed = 0
        entities_created = 0
        
        for study in studies:
            processed += 1
            self.stdout.write(f"Processing {processed}/{studies.count()}: {study.title[:50]}...")
            
            # Process each section
            for section in study.sections.all():
                entities = self.extract_entities_from_text(section.content, nlp)
                
                for entity_data in entities:
                    entity, created = Entity.objects.get_or_create(
                        name=entity_data['text'],
                        entity_type=entity_data['type'],
                        defaults={
                            'canonical_id': entity_data.get('canonical_id', ''),
                            'description': entity_data.get('description', '')
                        }
                    )
                    
                    if created:
                        entities_created += 1
        
        self.stdout.write(
            self.style.SUCCESS(
                f"Completed: {processed} studies processed, {entities_created} entities created"
            )
        )
    
    def extract_entities_from_text(self, text, nlp):
        """Extract entities from text using spaCy"""
        if not text or len(text.strip()) < 10:
            return []
        
        doc = nlp(text)
        entities = []
        
        for ent in doc.ents:
            # Classify entity type based on spaCy label and context
            entity_type = self.classify_entity_type(ent.label_, ent.text)
            
            if entity_type != 'other':  # Only keep relevant entities
                entities.append({
                    'text': ent.text.strip(),
                    'type': entity_type,
                    'label': ent.label_,
                    'start': ent.start_char,
                    'end': ent.end_char,
                    'canonical_id': self.get_canonical_id(ent.text, entity_type),
                    'description': f"Extracted from text: {ent.text[:100]}..."
                })
        
        return entities
    
    def classify_entity_type(self, spacy_label, text):
        """Classify spaCy entity into our entity types"""
        text_lower = text.lower()
        
        # Organisms
        if (spacy_label in ['ORGANISM', 'SPECIES'] or 
            any(word in text_lower for word in ['mouse', 'rat', 'human', 'plant', 'yeast', 'bacteria', 'cell'])):
            return 'organism'
        
        # Tissues/Systems
        elif (spacy_label in ['ANATOMY', 'BODY_PART'] or 
              any(word in text_lower for word in ['bone', 'muscle', 'brain', 'heart', 'liver', 'kidney', 'immune', 'cardiovascular'])):
            return 'tissue'
        
        # Stressors
        elif (any(word in text_lower for word in ['microgravity', 'radiation', 'hypercapnia', 'isolation', 'stress', 'weightlessness'])):
            return 'stressor'
        
        # Platforms/Missions
        elif (any(word in text_lower for word in ['iss', 'space station', 'shuttle', 'bion', 'bed rest', 'clinostat'])):
            return 'platform'
        
        # Assays/Methods
        elif (spacy_label in ['CHEMICAL', 'DRUG'] or 
              any(word in text_lower for word in ['pcr', 'rna-seq', 'proteomics', 'histology', 'assay', 'analysis'])):
            return 'assay'
        
        # Outcomes
        elif (any(word in text_lower for word in ['increase', 'decrease', 'change', 'effect', 'response', 'adaptation'])):
            return 'outcome'
        
        else:
            return 'other'
    
    def get_canonical_id(self, text, entity_type):
        """Get canonical ID for entity (placeholder for now)"""
        # This could be enhanced to map to MeSH IDs, UMLS, etc.
        return f"{entity_type}_{hash(text) % 10000}"

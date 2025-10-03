import json
import numpy as np
from sentence_transformers import SentenceTransformer
from django.core.management.base import BaseCommand, CommandError
from ingestion.models import Study, EvidenceSentence


class Command(BaseCommand):
    help = 'Generate embeddings for evidence sentences using sentence-transformers'

    def add_arguments(self, parser):
        parser.add_argument(
            '--limit',
            type=int,
            default=None,
            help='Limit number of studies to process'
        )
        parser.add_argument(
            '--model',
            type=str,
            default='all-MiniLM-L6-v2',
            help='Sentence transformer model to use'
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=32,
            help='Batch size for embedding generation'
        )

    def handle(self, *args, **options):
        limit = options['limit']
        model_name = options['model']
        batch_size = options['batch_size']
        
        # Load sentence transformer model
        self.stdout.write(f"Loading sentence transformer model: {model_name}")
        try:
            model = SentenceTransformer(model_name)
        except Exception as e:
            raise CommandError(f"Failed to load model {model_name}: {e}")
        
        # Get studies to process
        studies = Study.objects.all()
        if limit:
            studies = studies[:limit]
        
        self.stdout.write(f"Processing {studies.count()} studies...")
        
        processed = 0
        embeddings_created = 0
        
        for study in studies:
            processed += 1
            self.stdout.write(f"Processing {processed}/{studies.count()}: {study.title[:50]}...")
            
            # Get evidence sentences for this study
            evidence_sentences = study.evidence_sentences.all()
            
            if not evidence_sentences.exists():
                # Create evidence sentences from study title and abstract
                self.create_evidence_from_study(study)
                evidence_sentences = study.evidence_sentences.all()
            
            # Generate embeddings in batches
            sentences = [es.sentence_text for es in evidence_sentences]
            if sentences:
                embeddings = model.encode(sentences, batch_size=batch_size, show_progress_bar=True)
                
                # Save embeddings to database
                for i, evidence_sentence in enumerate(evidence_sentences):
                    embedding_vector = embeddings[i].tolist()
                    evidence_sentence.embedding_vector = json.dumps(embedding_vector)
                    evidence_sentence.save()
                    embeddings_created += 1
        
        self.stdout.write(
            self.style.SUCCESS(
                f"Completed: {processed} studies processed, {embeddings_created} embeddings created"
            )
        )
    
    def create_evidence_from_study(self, study):
        """Create evidence sentences from study title and abstract"""
        # Create evidence from title
        if study.title:
            EvidenceSentence.objects.create(
                study=study,
                section=None,  # No section available
                sentence_text=study.title,
                sentence_index=0,
                char_start=0,
                char_end=len(study.title)
            )
        
        # Create evidence from abstract (split into sentences)
        if study.abstract:
            sentences = self.split_into_sentences(study.abstract)
            for i, sentence in enumerate(sentences):
                if len(sentence.strip()) > 10:  # Only meaningful sentences
                    EvidenceSentence.objects.create(
                        study=study,
                        section=None,
                        sentence_text=sentence.strip(),
                        sentence_index=i + 1,
                        char_start=0,
                        char_end=len(sentence)
                    )
    
    def split_into_sentences(self, text):
        """Simple sentence splitting"""
        import re
        # Split on sentence endings
        sentences = re.split(r'[.!?]+', text)
        return [s.strip() for s in sentences if s.strip()]

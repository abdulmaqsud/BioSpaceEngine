import json
import numpy as np
import faiss
import os
from django.core.management.base import BaseCommand, CommandError
from ingestion.models import EvidenceSentence, SearchIndex
from sentence_transformers import SentenceTransformer


class Command(BaseCommand):
    help = 'Build FAISS index for semantic search over evidence sentences'

    def add_arguments(self, parser):
        parser.add_argument(
            '--model',
            type=str,
            default='all-MiniLM-L6-v2',
            help='Sentence transformer model to use'
        )
        parser.add_argument(
            '--index-name',
            type=str,
            default='evidence_search',
            help='Name for the FAISS index'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force rebuild even if index exists'
        )

    def handle(self, *args, **options):
        model_name = options['model']
        index_name = options['index_name']
        force = options['force']
        
        # Check if index already exists
        if not force and SearchIndex.objects.filter(index_name=index_name).exists():
            self.stdout.write(
                self.style.WARNING(f"Index {index_name} already exists. Use --force to rebuild.")
            )
            return
        
        # Load sentence transformer model
        self.stdout.write(f"Loading sentence transformer model: {model_name}")
        try:
            model = SentenceTransformer(model_name)
        except Exception as e:
            raise CommandError(f"Failed to load model {model_name}: {e}")
        
        # Get all evidence sentences with embeddings
        evidence_sentences = EvidenceSentence.objects.filter(
            embedding_vector__isnull=False
        ).exclude(embedding_vector='')
        
        if not evidence_sentences.exists():
            raise CommandError("No evidence sentences with embeddings found. Run generate_embeddings first.")
        
        self.stdout.write(f"Found {evidence_sentences.count()} evidence sentences with embeddings")
        
        # Extract embeddings and metadata
        embeddings = []
        metadata = []
        
        for i, evidence in enumerate(evidence_sentences):
            try:
                embedding = json.loads(evidence.embedding_vector)
                embeddings.append(embedding)
                metadata.append({
                    'id': evidence.id,
                    'study_id': evidence.study_id,
                    'sentence_text': evidence.sentence_text,
                    'sentence_index': evidence.sentence_index,
                    'char_start': evidence.char_start,
                    'char_end': evidence.char_end
                })
            except (json.JSONDecodeError, TypeError) as e:
                self.stdout.write(
                    self.style.WARNING(f"Skipping evidence {evidence.id}: invalid embedding format")
                )
                continue
        
        if not embeddings:
            raise CommandError("No valid embeddings found")
        
        # Convert to numpy array
        embeddings_array = np.array(embeddings).astype('float32')
        dimension = embeddings_array.shape[1]
        
        self.stdout.write(f"Building FAISS index with {len(embeddings)} vectors of dimension {dimension}")
        
        # Create FAISS index
        index = faiss.IndexFlatIP(dimension)  # Inner product for cosine similarity
        index.add(embeddings_array)
        
        # Save index and metadata
        index_dir = 'data/indices'
        os.makedirs(index_dir, exist_ok=True)
        
        index_path = os.path.join(index_dir, f'{index_name}.faiss')
        metadata_path = os.path.join(index_dir, f'{index_name}_metadata.json')
        
        # Save FAISS index
        faiss.write_index(index, index_path)
        
        # Save metadata
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
        
        # Update or create SearchIndex record
        search_index, created = SearchIndex.objects.update_or_create(
            index_name=index_name,
            defaults={
                'index_path': index_path,
                'metadata_path': metadata_path,
                'embedding_model': model_name,
                'dimension': dimension,
                'total_vectors': len(embeddings)
            }
        )
        
        self.stdout.write(
            self.style.SUCCESS(
                f"FAISS index built successfully: {index_name}\n"
                f"  - Vectors: {len(embeddings)}\n"
                f"  - Dimension: {dimension}\n"
                f"  - Index path: {index_path}\n"
                f"  - Metadata path: {metadata_path}"
            )
        )

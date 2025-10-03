import json

try:
    import faiss  # type: ignore
except ImportError:  # pragma: no cover - optional dependency
    faiss = None

try:
    from sentence_transformers import SentenceTransformer  # type: ignore
except ImportError:  # pragma: no cover - optional dependency
    SentenceTransformer = None

from .models import SearchIndex, EvidenceSentence


class SemanticSearchService:
    """Service for semantic search using FAISS index and sentence transformers"""
    
    def __init__(self):
        self.model = None
        self.index = None
        self.metadata = None
        self._load_model()
        self._load_index()
    
    def _load_model(self):
        """Load sentence transformer model"""
        if self.model is None:
            if SentenceTransformer is None:
                return
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
    
    def _load_index(self):
        """Load FAISS index and metadata"""
        try:
            search_index = SearchIndex.objects.filter(index_name='evidence_search').first()
            if not search_index:
                return
            
            # Load FAISS index
            if faiss is None:
                return
            self.index = faiss.read_index(search_index.index_path)
            
            # Load metadata
            with open(search_index.metadata_path, 'r', encoding='utf-8') as f:
                self.metadata = json.load(f)
                
        except Exception as e:
            print(f"Error loading FAISS index: {e}")
            self.index = None
            self.metadata = None
    
    def search(self, query, top_k=10, threshold=0.5):
        """
        Perform semantic search over evidence sentences
        
        Args:
            query: Search query string
            top_k: Number of top results to return
            threshold: Minimum similarity threshold
            
        Returns:
            List of search results with similarity scores
        """
        if not self.index or not self.metadata or self.model is None:
            return []
        
        # Encode query
        query_embedding = self.model.encode([query])
        query_embedding = query_embedding.astype('float32')
        
        # Search in FAISS index
        similarities, indices = self.index.search(query_embedding, top_k)
        
        results = []
        for i, (similarity, idx) in enumerate(zip(similarities[0], indices[0])):
            if similarity >= threshold and idx < len(self.metadata):
                metadata = self.metadata[idx]
                results.append({
                    'evidence_id': metadata['id'],
                    'study_id': metadata['study_id'],
                    'sentence_text': metadata['sentence_text'],
                    'sentence_index': metadata['sentence_index'],
                    'similarity_score': float(similarity),
                    'rank': i + 1
                })
        
        return results
    
    def get_evidence_by_ids(self, evidence_ids):
        """Get evidence sentences by IDs"""
        return EvidenceSentence.objects.filter(id__in=evidence_ids).select_related('study')
    
    def is_available(self):
        """Check if semantic search is available"""
        return self.index is not None and self.metadata is not None


# Global instance
semantic_search = SemanticSearchService()

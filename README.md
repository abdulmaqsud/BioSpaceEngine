# BioSpace — Space Biology Knowledge Engine

A powerful AI-driven knowledge engine for NASA Space Biology research, featuring semantic search, entity extraction, and knowledge graph capabilities.

## Architecture
- **Backend**: Django + Django REST Framework + NLP Pipeline
- **Frontend**: Next.js (coming soon)
- **Database**: SQLite with FAISS vector search
- **NLP**: spaCy + Sentence Transformers + FAISS

## Prerequisites
- Python 3.11+
- Node.js 20+ (for Next.js frontend)

## Getting Started

### Backend Setup
```bash
cd backend
.\.venv\Scripts\activate
python manage.py migrate
python manage.py runserver
```
Server runs at `http://127.0.0.1:8000`.

### Data Ingestion
```bash
# Ingest 608 NASA publications
python manage.py ingest_csv --limit 10

# Generate embeddings for semantic search
python manage.py generate_embeddings --limit 10

# Build FAISS index for fast search
python manage.py build_faiss_index

# Extract entities (optional)
python manage.py extract_entities --limit 10
```

## API Endpoints

### Search & Discovery
- `GET /api/studies/` - List all studies
- `GET /api/studies/search/?q=query` - Semantic search
- `GET /api/studies/{id}/evidence/` - Get evidence sentences
- `GET /api/studies/facets/` - Get filter options

### Data Management
- `GET /api/entities/` - List extracted entities
- `GET /api/triples/` - Knowledge graph triples
- `GET /api/evidence/` - Evidence sentences

## Features

### ✅ Implemented
- **Data Pipeline**: CSV ingestion from 608 NASA publications
- **PMC Integration**: JATS XML parsing for full-text content
- **NLP Pipeline**: Entity extraction with spaCy
- **Semantic Search**: FAISS vector search with similarity scoring
- **REST API**: Complete CRUD operations with Django REST Framework
- **Knowledge Graph**: Entity relationships and triples

### 🚧 Coming Soon
- **Next.js Frontend**: Modern React framework with SSR
- **Interactive Visualizations**: Knowledge graphs, trend charts
- **Advanced Filters**: Multi-faceted search and filtering
- **Export Features**: CSV/JSON reports and data exports

## Project Structure
```
BioSpace/
  backend/
    core/                    # Django project
    ingestion/               # Main app
      models.py              # Data models
      views.py               # API endpoints
      services.py            # Semantic search service
      management/commands/   # ETL commands
    data/indices/            # FAISS search indices
  README.md
```

## Reference
- Publication list (608 OA PMC links): https://github.com/jgalazka/SB_publications
- NASA Open Science Data Repository: https://osdr.nasa.gov/
- NASA Space Life Sciences Library: https://www.nasa.gov/centers/ames/research/space-biosciences/

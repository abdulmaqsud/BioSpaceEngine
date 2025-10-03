# BioSpace — Space Biology Knowledge Engine

A powerful AI-driven knowledge engine for NASA Space Biology research, featuring semantic search, entity extraction, and knowledge graph capabilities.

## 🚀 Current Status: FULLY OPERATIONAL
- ✅ **572 NASA Space Biology studies** processed and searchable
- ✅ **AI-powered semantic search** across all research
- ✅ **REST API** with 15+ endpoints
- ✅ **FAISS vector search** with sub-second response times
- ✅ **Next.js frontend** scaffold ready for development

## Architecture
- **Backend**: Django + Django REST Framework + NLP Pipeline
- **Frontend**: Next.js (scaffold ready)
- **Database**: SQLite with FAISS vector search
- **NLP**: spaCy + Sentence Transformers + FAISS
- **Search**: 572 studies with 384-dimensional embeddings

## Prerequisites
- Python 3.11+
- Node.js 20+ (for Next.js frontend)

## Getting Started

### Backend Setup
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
Server runs at `http://127.0.0.1:8000`.

### Data Ingestion (Already Complete)
```bash
# All 572 studies are already ingested and ready
# To re-run the full pipeline:
python manage.py ingest_csv
python manage.py generate_embeddings  
python manage.py build_faiss_index
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

### ✅ Fully Implemented & Operational
- **Data Pipeline**: 572 NASA Space Biology studies ingested
- **PMC Integration**: 571 HTML articles downloaded and processed
- **NLP Pipeline**: Entity extraction with spaCy
- **Semantic Search**: FAISS vector search with similarity scoring
- **REST API**: Complete CRUD operations with Django REST Framework
- **Knowledge Graph**: Entity relationships and triples
- **AI Search**: Query "microgravity effects on bone loss" → Relevant studies
- **Fast Retrieval**: Sub-second search across 572 studies

### 🚧 Next Phase: Frontend Development
- **Next.js Frontend**: Modern React framework with SSR
- **Interactive Visualizations**: Knowledge graphs, trend charts
- **Advanced Filters**: Multi-faceted search and filtering
- **Export Features**: CSV/JSON reports and data exports
- **User Interface**: Intuitive search and discovery interface

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

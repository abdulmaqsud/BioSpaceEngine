# BioSpace — Space Biology Knowledge Engine

A powerful AI-driven knowledge engine for NASA Space Biology research, featuring semantic search, entity extraction, knowledge graph visualization, and interactive research analysis.

## 🚀 Current Status: FULLY OPERATIONAL WITH COMPLETE FRONTEND
- ✅ **572 NASA Space Biology studies** processed and searchable
- ✅ **Complete Next.js Frontend** with 6 major interactive pages
- ✅ **Real Data Extraction** from HTML articles with sections and entities
- ✅ **Interactive Knowledge Graph** with D3.js visualization
- ✅ **Paper Detail Pages** showing actual research content
- ✅ **Compare Studies** feature for side-by-side analysis
- ✅ **Consensus Insights** based on real research data
- ✅ **Smart Study Tags** and enhanced filtering capabilities
- ✅ **AI-powered semantic search** across all research
- ✅ **REST API** with 15+ endpoints
- ✅ **FAISS vector search** with sub-second response times

## Architecture
- **Backend**: Django + Django REST Framework + NLP Pipeline
- **Frontend**: Next.js 15 with complete UI (6 pages)
- **Database**: SQLite with FAISS vector search
- **NLP**: spaCy + Sentence Transformers + FAISS
- **Visualization**: D3.js for interactive knowledge graphs
- **Search**: 572 studies with 384-dimensional embeddings
- **Data**: Real HTML content extraction with sections and entities

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
python manage.py download_pmc_articles
python manage.py extract_sections_from_html
python manage.py extract_entities
python manage.py generate_embeddings  
python manage.py build_faiss_index
```

## API Endpoints

### Search & Discovery
- `GET /api/studies/` - List all studies
- `GET /api/studies/search/?q=query` - Semantic search
- `GET /api/studies/{id}/` - Get study details
- `GET /api/studies/{id}/sections/` - Get study sections
- `GET /api/studies/{id}/evidence/` - Get evidence sentences
- `GET /api/studies/facets/` - Get filter options

### Data Management
- `GET /api/entities/` - List extracted entities
- `GET /api/triples/` - Knowledge graph triples
- `GET /api/evidence/` - Evidence sentences
- `GET /api/sections/` - Document sections

## Features

### ✅ Fully Implemented & Operational
- **Data Pipeline**: 572 NASA Space Biology studies ingested
- **PMC Integration**: 571 HTML articles downloaded and processed
- **Real Content Extraction**: Sections, abstracts, and evidence from HTML
- **NLP Pipeline**: Entity extraction with spaCy (85+ entities extracted)
- **Semantic Search**: FAISS vector search with similarity scoring
- **REST API**: Complete CRUD operations with Django REST Framework
- **Knowledge Graph**: Entity relationships and triples
- **AI Search**: Query "microgravity effects on bone loss" → Relevant studies
- **Fast Retrieval**: Sub-second search across 572 studies

### ✅ Complete Frontend Implementation
- **Next.js Frontend**: 6 complete pages with full functionality
- **Explore Page**: AI-powered search with smart filtering
- **Paper Details**: Real research content with sections and evidence
- **Compare Studies**: Side-by-side analysis of up to 3 studies
- **Consensus Insights**: Research patterns and trends analysis
- **Knowledge Graph**: Interactive D3.js visualization
- **About Page**: Project information and methodology
- **Smart Tags**: Dynamic study categorization
- **Responsive Design**: Mobile-friendly interface

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
    data/pmc_articles/       # Downloaded HTML articles
  frontend/
    app/                     # Next.js app router
      explore/               # Search and discovery page
      paper/[id]/           # Study detail pages
      compare/               # Study comparison page
      consensus/             # Research insights page
      graph/                 # Knowledge graph page
      about/                 # Project information page
    components/              # Reusable components
      KnowledgeGraph.tsx     # D3.js visualization
  README.md
```

## Reference
- Publication list (608 OA PMC links): https://github.com/jgalazka/SB_publications
- NASA Open Science Data Repository: https://osdr.nasa.gov/
- NASA Space Life Sciences Library: https://www.nasa.gov/centers/ames/research/space-biosciences/

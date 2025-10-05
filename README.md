# BioSpace — Space Biology Knowledge Engine

AI-driven knowledge engine for NASA Space Biology research with semantic search, entity extraction, and interactive analysis.

## Status
- ✅ 572 NASA Space Biology studies processed
- ✅ Complete Next.js frontend with 6 pages
- ✅ Real data extraction from HTML articles
- ✅ Interactive knowledge graph visualization
- ✅ AI-powered semantic search
- ✅ REST API with 15+ endpoints

## Architecture
- **Backend**: Django + REST Framework + NLP Pipeline
- **Frontend**: Next.js 15 with TypeScript
- **Database**: SQLite with FAISS vector search
- **NLP**: spaCy + Sentence Transformers + ONNX models
- **Search**: FAISS vector indexing with sub-second response
- **Visualization**: D3.js for knowledge graphs

## Quick Start

### Backend
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Access at `http://localhost:3000`

## Features
- **Semantic Search**: AI-powered search across 572 studies
- **Knowledge Graph**: Interactive entity relationships
- **Study Comparison**: Side-by-side analysis
- **Consensus Insights**: Research patterns and trends
- **Real Data**: Extracted from HTML articles with sections and entities
- **Fast Search**: Sub-second response with FAISS indexing

## Tech Stack
- **Backend**: Django, REST Framework, spaCy, Sentence Transformers, ONNX
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, D3.js
- **Search**: FAISS vector indexing
- **Data**: PMC HTML articles with NLP extraction

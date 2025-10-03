# BioSpace — Space Biology Knowledge Engine

Monorepo containing:
- backend (Django + Django REST Framework)
- frontend (React + Vite + TypeScript)

## Prerequisites
- Python 3.11+
- Node.js 20+ (or 22+), npm 10+

## Getting Started

### Backend
```bash
cd backend
.\.venv\Scripts\activate
python manage.py migrate
python manage.py runserver
```
Server runs at `http://127.0.0.1:8000`.

### Frontend
```bash
cd frontend\frontend
npm install
npm run dev
```
App runs at `http://127.0.0.1:5173` by default.

## Structure
```
BioSpace/
  backend/
    core/                # Django project
      settings.py
      urls.py
    manage.py
  frontend/
    frontend/            # React app (Vite)
      src/
      index.html
```

## Next Steps
- Create ingestion/ETL to fetch PMC JATS XML and parse sections
- Build embeddings (FAISS) and entity extraction
- Expose DRF endpoints for search, filters, and KG
- Connect React UI (search, filters, evidence, visuals)

## Reference
- Publication list (608 OA PMC links): https://github.com/jgalazka/SB_publications

# BioSpace Frontend — Space Biology Knowledge Engine

Complete frontend interface for the BioSpace Space Biology Knowledge Engine, built with Next.js 15 and TypeScript. Features 6 major pages with full functionality and real data integration.

## 🚀 Project Status: FULLY IMPLEMENTED
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Status**: Production-ready with complete functionality
- **Pages**: 6 fully functional pages
- **Features**: Real data integration, interactive visualizations, smart filtering

## Getting Started

### Prerequisites
- Node.js 20+
- Backend API running on `http://127.0.0.1:8000`

### Development
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## ✅ Implemented Features
- **Explore Page** - AI-powered search with smart filtering and facet navigation
- **Paper Details** - Complete study pages with sections, evidence, and entities
- **Compare Studies** - Side-by-side analysis of up to 3 studies
- **Consensus Insights** - Research patterns, trends, and gap analysis
- **Knowledge Graph** - Interactive D3.js visualization of entity relationships
- **About Page** - Project information and methodology
- **Smart Study Tags** - Dynamic categorization based on research content
- **Responsive Design** - Mobile-friendly interface
- **Real Data Integration** - Shows actual research content, not just metadata

## API Integration
This frontend connects to the Django REST API backend:
- **Search**: `GET /api/studies/search/?q=query` - Semantic search with filtering
- **Studies**: `GET /api/studies/` - List all studies
- **Study Details**: `GET /api/studies/{id}/` - Individual study data
- **Sections**: `GET /api/studies/{id}/sections/` - Study sections and content
- **Evidence**: `GET /api/studies/{id}/evidence/` - Research evidence sentences
- **Entities**: `GET /api/entities/` - Extracted entities for knowledge graph
- **Triples**: `GET /api/triples/` - Knowledge graph relationships
- **Facets**: `GET /api/studies/facets/` - Filter options and counts

## Tech Stack
- **Next.js 15** - React framework with App Router and SSR
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **React 19** - Latest React features
- **D3.js** - Interactive data visualizations
- **localStorage** - Client-side data persistence
- **Fetch API** - RESTful API communication

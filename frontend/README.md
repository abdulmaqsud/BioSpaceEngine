# BioSpace Frontend — Space Biology Knowledge Engine

Frontend interface for the BioSpace Space Biology Knowledge Engine, built with Next.js 15 and TypeScript.

## 🚀 Project Status
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Status**: Scaffold ready for development

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

## Features (Planned)
- **Semantic Search Interface** - AI-powered study discovery
- **Study Browser** - Browse all 572 NASA studies
- **Interactive Visualizations** - Knowledge graphs and trends
- **Advanced Filters** - Multi-faceted search capabilities
- **Export Features** - Download search results

## API Integration
This frontend connects to the Django REST API backend:
- Search: `GET /api/studies/search/?q=query`
- Studies: `GET /api/studies/`
- Entities: `GET /api/entities/`
- Evidence: `GET /api/evidence/`

## Tech Stack
- **Next.js 15** - React framework with SSR
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **React 19** - Latest React features

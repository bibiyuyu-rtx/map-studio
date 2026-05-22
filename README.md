# Map Studio

A web-based spatial data editor inspired by QGIS and Felt.com, with a clean UI inspired by Electricity Maps.

## Features

- Layer-based map editing
- GeoJSON import/export
- Choropleth visualization
- Dark theme optimized for data visualization
- Real-time collaboration ready (Phase 3)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 + React 18 |
| Map | MapLibre GL JS (open source) |
| Styling | Tailwind CSS + Radix UI |
| Backend | Fastify (Node.js) |
| Database | SQLite (Turso compatible) |
| State | Zustand |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

```bash
# Install dependencies
pnpm install

# Start development
pnpm dev
```

This starts:
- Frontend at http://localhost:3000
- Backend API at http://localhost:3001

### Build for Production

```bash
pnpm build
```

## Project Structure

```
map-studio/
├── apps/
│   ├── web/           # Next.js frontend
│   └── api/           # Fastify backend
├── packages/
│   └── shared/        # Shared types and schemas
└── turbo.json         # Turborepo config
```

## API Endpoints

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project
- `PATCH /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Layers
- `GET /api/projects/:id/layers` - List layers
- `POST /api/projects/:id/layers` - Create layer
- `GET /api/layers/:id` - Get layer
- `PATCH /api/layers/:id` - Update layer
- `DELETE /api/layers/:id` - Delete layer

### Features
- `GET /api/layers/:id/features` - Get features
- `POST /api/features` - Create feature
- `DELETE /api/features/:id` - Delete feature

### Import/Export
- `POST /api/import/geojson` - Import GeoJSON
- `GET /api/export/geojson/:layerId` - Export layer
- `GET /api/export/geojson/project/:projectId` - Export project

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

## License

MIT
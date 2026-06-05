# Norwegian Board & Government Network Explorer

Interactive graph visualization exploring conflicts of interest between Norwegian politicians, board memberships, and government positions. Designed to reveal "revolving door" patterns and potential biases in political decision-making.

## Features

### 🔍 Search
- Search for **any person or company** by name
- Queries both local political dataset and Brønnøysundregistrene (brreg.no) live API
- Click a result to load their full network into the graph

### 🕸️ Interactive 3D Network Graph
- **3D force-directed graph** powered by Three.js — rotate, zoom, and explore in 3D space
- Color-coded nodes: persons (blue), companies (green), parties (pink), government bodies (amber)
- Animated directional particles on links showing relationship flow
- Color-coded links by relationship type (board, political, government, executive)
- Click any node to expand and reveal more connections
- Camera auto-focuses on selected nodes

### 📅 Timeline / Revolving Door View
- Visual horizontal timeline showing a person's positions over time
- Automatically detects **"svingdør" (revolving door) patterns** — short gaps between leaving government and joining corporate boards
- Highlights potential karantene violations

### ⚠️ Conflict of Interest Alerts
- Auto-detects potential conflicts: sector overlap, concurrent positions, revolving door
- Severity ratings (high/medium/low)
- Filterable by conflict type
- Click any conflict to focus on the person in the graph

### 🔍 Filter Panel
- Toggle node types (persons, companies, parties, government bodies)
- Toggle relationship categories (board, political, government, executive)
- Real-time graph filtering

## Data Sources
- **Brønnøysundregistrene (brreg.no)** — Company roles and board members (live API)
- **Stortinget.no** — Politicians and committees (sample data, live API planned)
- **Regjeringen.no** — Government positions (sample data)

## Tech Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + react-force-graph-3d (Three.js)
- **Backend**: Express + TypeScript
- **Data**: brreg.no REST API + in-memory political dataset

## Getting Started

```bash
# Install all dependencies
npm run install:all

# Run both frontend and backend
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:3001

## Azure Deployment
- `azure.yaml` — Azure Developer CLI configuration
- `backend/Dockerfile` — Backend container
- `frontend/Dockerfile` + `nginx.conf` — Frontend container with API proxy

## Project Structure
```
├── backend/
│   ├── src/
│   │   ├── index.ts              # Express server
│   │   ├── types.ts              # Shared types
│   │   ├── routes/
│   │   │   ├── search.ts         # Search API (persons + companies)
│   │   │   └── graph.ts          # Graph, timeline, conflicts API
│   │   └── services/
│   │       ├── brreg.ts          # Brønnøysundregistrene API client
│   │       └── political-data.ts # Political/government dataset + conflicts
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.tsx               # Main app with panels
│   │   ├── components/
│   │   │   ├── NetworkGraph.tsx   # Force-directed graph
│   │   │   ├── SearchBar.tsx      # Person/company search
│   │   │   ├── TimelineView.tsx   # Position timeline + revolving door detection
│   │   │   ├── ConflictsPanel.tsx # Conflict of interest alerts
│   │   │   ├── FilterPanel.tsx    # Node/link type filters
│   │   │   ├── NodeDetails.tsx    # Selected node info
│   │   │   └── Legend.tsx         # Graph legend
│   │   └── services/
│   │       └── api.ts            # API client
│   └── Dockerfile
├── azure.yaml
└── package.json
```

## Roadmap
- [ ] Live Stortinget.no API integration
- [ ] Degrees of separation (shortest path between two people)
- [ ] Cluster detection (shared board networks)
- [ ] Export/share reports
- [ ] Node hover tooltips
- [ ] Lobby register integration
- [ ] News article linking


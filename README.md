# Norwegian Board & Government Network Explorer

Interactive graph visualization exploring conflicts of interest between Norwegian politicians, board memberships, and government positions. Designed to reveal "revolving door" patterns and potential biases in political decision-making.

## Features

### 🏢 Company Details Panel
- Click any company node to see rich details from Brønnøysundregistrene
- **Key metrics**: employees, founding date, last annual report, ownership sector
- **Industry codes** (næringskoder) showing exact business activities
- **State ownership flag** — highlights when a company is state-owned (relevant for conflict analysis)
- **Publicly listed badge** (ASA companies)
- **Purpose statement** (vedtektsfestet formål)
- **Contact info**: address, website, phone, org number
- **Conflict relevance warning** for state-owned companies

### 👤 Person Details with Position History
- Click any politician to see their **current and past positions**
- Live data from Stortinget.no: committee membership, email, party, fylke
- **Curated past positions** for notable politicians (minister roles, private sector jobs)
- Historical Stortinget periods served (auto-detected from API)
- Photo from Stortinget.no

### 🔍 Search
- Search for **any person or company** by name
- Queries **Stortinget.no** (all representatives), local political dataset, and **brreg.no** live API
- Search replaces the graph view with the person/company's network
- "🏛️ Oversikt" button resets to default Stortinget view

### 🕸️ Interactive 3D Network Graph
- **3D force-directed graph** powered by Three.js — rotate, zoom, and explore in 3D space
- Color-coded nodes: persons (blue), companies (green), parties (pink), government bodies (amber)
- Animated directional particles on links showing relationship flow
- Color-coded links by relationship type (board, political, government, executive)
- Click any node to expand and reveal more connections
- Click a party node to load all its Stortinget representatives
- Camera auto-focuses on selected nodes

### 📅 Timeline / Revolving Door View
- Visual horizontal timeline showing a person's positions over time
- Automatically detects **"svingdør" (revolving door) patterns** — short gaps between leaving government and joining corporate boards
- Highlights potential karantene violations

### ⚠️ Conflict of Interest Alerts (draggable panel)
- Auto-detects potential conflicts: sector overlap, concurrent positions, revolving door
- Severity ratings (high/medium/low)
- Filterable by conflict type
- Click any conflict to focus on the person in the graph
- **Draggable** — move the panel anywhere on screen

### 🔍 Filter Panel (draggable)
- Toggle node types (persons, companies, parties, government bodies)
- Toggle relationship categories (board, political, government, executive)
- Real-time graph filtering
- **Draggable** — won't block other panels

### 🎨 Stortinget-inspired Design
- Red accent bar, serif headings (Merriweather), clean light panels
- Dark navy 3D graph background for contrast
- Responsive layout matching stortinget.no aesthetics

## Data Sources (all live APIs, no static data)
- **Stortinget.no** — All current representatives, committees, parties, photos, hearing submissions
- **Brønnøysundregistrene (brreg.no)** — Company details, board roles, ownership (live API)
- **Wikidata SPARQL** — Full politician position history, board memberships, party affiliations
- **Regjeringen API** — Current government ministers with department and title
- **Stortinget Høringsinnspill** — 1,300+ hearing submissions scraped live (Norway's effective lobby register — shows which organizations submit input to parliamentary committees)
- **Curated dataset** — Notable politicians' known private sector moves and revolving door cases

## Tech Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + react-force-graph-3d (Three.js)
- **Backend**: Express + TypeScript
- **Data**: Stortinget.no API + brreg.no REST API + Wikidata SPARQL + curated political dataset
- **Deployment**: Azure Container Apps + Azure Container Registry
- **CI/CD**: GitHub Actions — auto-deploys on every push to master

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

### Infrastructure
- **Azure Container Apps** — serverless containers with auto-scaling
- **Azure Container Registry** — private Docker image storage
- **Log Analytics** — centralized logging

### Deploy
```powershell
# Login to Azure
az login --tenant YOUR_TENANT.onmicrosoft.com

# Run deployment script
./deploy.ps1
```

### Configuration
- `infra/main.bicep` — Infrastructure as Code (Bicep)
- `infra/main.parameters.json` — Deployment parameters
- `.github/workflows/deploy.yml` — CI/CD pipeline (auto-deploy on push)
- `deploy.ps1` — Manual full build + deploy script
- `azure.yaml` — Azure Developer CLI config

## Project Structure
```
├── .github/workflows/
│   └── deploy.yml              # CI/CD: auto-deploy on push to master
├── backend/
│   ├── src/
│   │   ├── index.ts              # Express server
│   │   ├── types.ts              # Shared types
│   │   ├── routes/
│   │   │   ├── search.ts         # Search API (Stortinget + brreg + political)
│   │   │   ├── graph.ts          # Graph, timeline, conflicts, person-details API
│   │   │   ├── company.ts        # Company details from brreg.no
│   │   │   └── sources.ts        # Wikidata, Government, Lobby data endpoints
│   │   └── services/
│   │       ├── brreg.ts          # Brønnøysundregistrene API client
│   │       ├── stortinget.ts     # Stortinget.no API (reps, photos, positions)
│   │       ├── political-data.ts # Political dataset + conflicts detection
│   │       ├── wikidata.ts       # Wikidata SPARQL queries
│   │       ├── regjeringen.ts    # Government ministers API
│   │       └── lobbyregister.ts  # Hearing submissions scraper (lobby data)
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.tsx               # Main app with all panels
│   │   ├── components/
│   │   │   ├── NetworkGraph.tsx   # 3D Force-directed graph
│   │   │   ├── SearchBar.tsx      # Person/company search
│   │   │   ├── NodeDetails.tsx    # Person details + position history
│   │   │   ├── CompanyDetails.tsx # Company info from brreg
│   │   │   ├── TimelineView.tsx   # Position timeline + revolving door
│   │   │   ├── ConflictsPanel.tsx # Conflict alerts (draggable)
│   │   │   ├── FilterPanel.tsx    # Node/link filters (draggable)
│   │   │   └── Legend.tsx         # Graph legend
│   │   └── services/
│   │       └── api.ts            # API client + types
│   ├── Dockerfile
│   └── nginx.conf
├── infra/
│   ├── main.bicep                # Azure infrastructure
│   └── main.parameters.json      # Deployment params
├── deploy.ps1                    # Manual deployment script
├── azure.yaml                    # Azure Developer CLI config
└── package.json
```

## Roadmap
- [x] Live Stortinget.no API integration
- [x] Person position history (current + past)
- [x] Draggable panels
- [x] Norwegian/English language switch (i18n)
- [x] Clickable connections in detail panels
- [x] Wikidata SPARQL integration (full politician histories)
- [x] Regjeringen.no ministers API
- [x] Lobby data via Stortinget hearing submissions (1,300+ organizations)
- [x] CI/CD auto-deploy (GitHub Actions → Azure)
- [x] Custom parliament-themed favicon
- [ ] Degrees of separation (shortest path between two people)
- [ ] Cluster detection (shared board networks)
- [ ] Export/share reports
- [ ] Node hover tooltips
- [ ] Frontend panels for lobby data and government members
- [ ] News article linking


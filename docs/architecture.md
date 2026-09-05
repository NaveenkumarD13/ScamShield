# ScamShield Phase 1 Architecture

```text
User
  ↓
React Frontend (TypeScript + Tailwind)
  ↓ REST API
Node.js + Express API (TypeScript)
  ↓
AI Orchestrator (Phase 1 text flow)
  ├─ Claim Extraction (schema-validated output with Zod)
  ├─ Text Risk Analyzer + Pattern Analyzer
  ├─ Identity Consistency Checker
  ├─ Evidence Collector
  ├─ Deterministic Risk Engine (weighted scoring)
  ├─ Explanation Generator
  └─ Recommendation Generator
  ↓
Storage Abstraction
  └─ Local file repository (dev), swappable for PostgreSQL/Supabase
```

## Components

- **Frontend (`/frontend`)**
  - Home flow for suspicious text input
  - Analysis report view (risk card, signals, evidence, recommendation, timeline, confidence/uncertainty)
  - Dashboard/history with filters and delete option

- **Backend (`/backend`)**
  - `POST /api/analyze/text`: validates input, runs orchestrator, persists report
  - `GET /api/analyses`: returns saved analyses
  - `GET /api/analyses/:id`: returns full report by ID
  - `DELETE /api/analyses/:id`: deletes stored analysis
  - `GET /api/health`: health check

- **AI Workflow (`/backend/src/analysis`)**
  - Structured claim extraction with strict schema validation
  - Multi-signal analysis with deterministic evidence-backed rules
  - Weighted risk scoring (not arbitrary LLM score)

- **Persistence (`/database`)**
  - Local JSON store for development (`analyses.dev.json`)
  - Repository pattern isolates persistence implementation for future Postgres/Supabase migration

## Security and reliability controls

- Request validation with Zod
- Strict JSON body size limit
- Rate limiting and request timeout handling
- Helmet security headers + CORS
- Safe URL parsing (protocol and host checks)
- No direct execution of submitted user content
- Minimal source preview retention instead of full raw content

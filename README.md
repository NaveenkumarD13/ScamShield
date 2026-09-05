# AI ScamShield

**Tagline:** Verify Before You Trust.

AI ScamShield is a digital trust and verification web app that investigates suspicious content and returns an evidence-backed risk report.

## Problem
Users receive suspicious internship offers, payment requests, account alerts, and impersonation messages. A simple chatbot answer is not enough; users need a structured verification workflow.

## Solution
ScamShield uses a structured pipeline:
input validation → claim extraction → signal checks → deterministic risk scoring → explanation → recommendation → report persistence.

## Why AI
AI-style extraction helps normalize messy user text into structured claims. ScamShield then combines these claims with deterministic rules and weighted scoring so final risk is not arbitrarily chosen.

> Phase 1 uses a clearly labeled **dev/mock extraction adapter** (schema-validated) so local development works without external model credentials.

## Phase 1 Features (Implemented)
- Text message submission flow
- Structured claim extraction validated with Zod schema
- Investigation orchestrator with specialized analysis modules
- Deterministic risk engine with configurable weighted signals
- Evidence generation in claim/evidence/impact format
- Recommendation + explanation generation
- Investigation timeline
- Confidence and uncertainty shown separately
- History persistence (dev local file store)
- History dashboard filters and delete option
- Backend API with validation, rate limiting, timeout handling, and health endpoint

## Architecture
See [`docs/architecture.md`](/docs/architecture.md).

## AI Workflow
1. Validate input
2. Extract structured claims (schema validated)
3. Analyze text/pattern/identity/url/requested-action signals
4. Compute deterministic risk score
5. Build explanation + recommendation
6. Generate final report and save to history

## Demo Notes
Try this synthetic message:

> Congratulations! You have been selected for a work-from-home internship. Pay ₹999 registration fee immediately to confirm your position.

Expected behavior: elevated risk with payment + urgency + identity uncertainty signals.

## Evaluation Notes
Phase 1 includes unit/API tests for deterministic scoring and text analysis endpoints. Full 100-example evaluation dataset is planned for later phases.

## Installation
### 1) Backend
```bash
cd backend
npm install
npm run dev
```
Server runs on `http://localhost:8080`.

### 2) Frontend
```bash
cd frontend
npm install
npm run dev
```
App runs on `http://localhost:5173`.

## Environment Variables
Use `.env.example`:
- `VITE_API_BASE_URL`
- `PORT`
- `CORS_ORIGIN`
- `RATE_LIMIT_MAX`
- `REQUEST_TIMEOUT_MS`
- `ANALYSIS_STORE_PATH`

## API Documentation
- `POST /api/analyze/text`
  - Body: `{ "text": "..." }`
  - Response: complete analysis report with risk score, classification, evidence, recommendation, timeline
- `GET /api/analyses`
- `GET /api/analyses/:id`
- `DELETE /api/analyses/:id`
- `GET /api/health`

## Security
- Helmet headers
- Request validation and strict body limits
- Rate limiting
- Request timeouts
- Safe URL checks
- No arbitrary execution of user content
- No frontend secrets

## Privacy
- Stores only minimal source preview in analysis history
- Supports delete-analysis API and UI action
- Advises users not to submit unnecessary sensitive data

## Limitations
- Phase 1 supports text analysis only (URL/image/document analysis planned next)
- Signal weights are experimental and should be calibrated with evaluation datasets
- ScamShield does **not** claim 100% scam detection

## Future Improvements
- URL live inspection adapters
- OCR/document extraction pipelines
- PostgreSQL/Supabase persistence
- Full benchmark dataset and metrics dashboard
- Adversarial testing suite

## Screenshots / Demo
Add your screenshots and demo video links in a follow-up update once deployed.

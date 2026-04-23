# Architecture

## Layers

### 1. Frontend

- Next.js App Router
- Tailwind CSS
- TypeScript
- Mock auth session stored in local storage
- Dashboard UI for simulation submission and result review

### 2. API Layer

- FastAPI entrypoint
- Thin route handlers
- Pydantic request and response models
- CORS enabled for local development

### 3. Simulation Engine

- `run_simulation(type, params)` dispatch function
- Type-specific modules under `backend/simulation`
- Deterministic shape for response payloads so the frontend stays stable

### 4. Payment Layer

- Mock blockchain payment approval
- Lightweight transaction reference generation
- Easy replacement point for Initia or InterwovenKit-backed payment execution

### 5. Storage Layer

- In-memory repository for MVP
- Result history keyed by user id
- Mock blockchain ledger that stores result hashes and timestamps

## Extensibility

- New simulation types only need:
  - a params schema
  - a simulation implementation
  - a route-safe response contract
- Frontend type selectors and forms can grow incrementally without changing the payment or proof flow.

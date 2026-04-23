# TrialFlow MVP

Simulation-as-a-Service Platform MVP for appchain-backed simulation workflows.

## Project structure

```text
.
├── frontend
│   ├── app
│   ├── components
│   └── lib
├── backend
│   ├── models
│   ├── routes
│   ├── services
│   ├── simulation
│   └── storage
├── docs
├── brand.md
└── README.md
```

## What this repo contains

- `frontend/`: Next.js App Router client for auth, simulation input, payment trigger, and result visualisation.
- `backend/`: FastAPI API, simulation engine, mock payment layer, and mock blockchain proof storage.
- `docs/`: Architecture and contribution notes for future contributors.

## MVP flow

1. User connects a mock wallet or uses social login.
2. User fills drug trial simulation parameters.
3. Frontend triggers payment through a mock blockchain payment flow.
4. Backend runs the simulation engine after payment succeeds.
5. Frontend renders metrics and charts.
6. Backend hashes the result payload and stores the proof in a mock blockchain ledger.

The current drug trial model uses a two-arm Monte Carlo simulation with placebo control, Emax dose response, adherence and dropout modeling, adverse-event severity, and normal-approximation inference for confidence intervals and p-values.

## Project status

This repository is intentionally scoped to a clean, minimal MVP with one implemented simulation type: `drug_trial`.

## Local setup

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`.

InterwovenKit defaults to Initia testnet `initiation-2`. Override the chain with `NEXT_PUBLIC_INITIA_CHAIN_ID` if you want to point the wallet UX at a different Initia environment.

## Docker setup

Run the full stack with Docker:

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Backend health: `http://localhost:8000/health`

Stop the stack:

```bash
docker compose down
```

Rebuild after dependency or Dockerfile changes:

```bash
docker compose up --build --force-recreate
```

## Verified during development

- Python backend compiled successfully with `python -m compileall backend`
- Simulation execution verified through direct service calls
- Frontend passed `npx tsc --noEmit`
- Frontend production build passed with `npm run build`

## What to build next

1. Replace mock auth with InterwovenKit or an equivalent wallet plus social auth provider.
2. Swap in PostgreSQL for persistent simulation history and audit metadata.
3. Add real Initia transaction handling for payment settlement and proof anchoring.
4. Introduce simulation templates so new simulation types can register their own forms and schemas.
5. Add basic automated tests for API routes and the frontend submission flow.

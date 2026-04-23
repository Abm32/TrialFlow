# TrialFlow MVP

Simulation-as-a-Service Platform MVP for appchain-backed simulation workflows.

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

## Project status

This repository is intentionally scoped to a clean, minimal MVP with one implemented simulation type: `drug_trial`.

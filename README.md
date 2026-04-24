# TrialFlow

**Simulation-as-a-Service on an Initia appchain — pay-per-run drug trial modeling with on-chain proof anchoring.**

> Built for [INITIATE: The Initia Hackathon](https://dorahacks.io/) · Track: AI

---

## The Problem

Clinical trial simulation is a $2B+ market dominated by enterprise SaaS platforms (Medidata, Certara, Simulations Plus) that charge six-figure annual licenses. Independent researchers, biotech startups, and CROs in emerging markets are priced out entirely.

There is no pay-per-run option. There is no way to prove a simulation was run with specific parameters at a specific time without trusting the platform operator. And there is no way for a researcher to own their computation history independently.

## The Solution

TrialFlow is a Simulation-as-a-Service platform where:

- **Researchers pay per simulation run** using an Initia wallet transaction — no subscription, no vendor lock-in
- **Every result is SHA-256 hashed and anchored on-chain**, creating a tamper-evident audit trail that the researcher owns
- **The wallet transaction hash is stored alongside the result**, linking the on-chain payment to the off-chain computation
- **Session keys enable frictionless repeat runs** — approve once, then iterate without re-signing each transaction

The platform runs on a dedicated Initia appchain, keeping simulation fees as appchain revenue rather than leaking value to L1 gas costs.

## Why Initia

| Initia feature | How TrialFlow uses it |
|---|---|
| Appchain ownership | Simulation fees stay with the platform operator, not leaked to L1 validators |
| InterwovenKit | Wallet connection, transaction signing, and tx confirmation — all through one SDK |
| Session keys | Auto-signing for repeat simulation runs without re-approving each wallet prompt |
| 100ms block times | Near-instant payment confirmation before the simulation engine starts |
| Custom chain config | Frontend dynamically targets any Initia L2 via env vars — testnet, mainnet, or local |

## Target User

- **Primary:** Independent biostatisticians and small CROs running exploratory dose-finding simulations before committing to full trial design
- **Secondary:** Pharma R&D teams who need a quick, auditable simulation with proof-of-computation for regulatory pre-submissions
- **Tertiary:** Academic researchers who need reproducible simulation results with verifiable timestamps

## Competitive Landscape

| Platform | Model | Proof | Cost |
|---|---|---|---|
| Medidata (Dassault) | Enterprise SaaS | Proprietary audit log | $100K+/yr |
| Certara | Enterprise SaaS | Proprietary | $80K+/yr |
| Simulations Plus | Desktop license | None | $30K+/yr |
| **TrialFlow** | **Pay-per-run** | **On-chain hash** | **Per-transaction** |

TrialFlow is not competing with enterprise platforms on feature depth. It competes on access, cost, and verifiability — the same way DeFi competes with traditional finance on openness rather than feature parity.

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Frontend (Next.js + InterwovenKit)             │
│  ┌───────────┐  ┌──────────┐  ┌──────────────┐ │
│  │ Wallet    │→ │ Sim Form │→ │ Result Panel │ │
│  │ Connect   │  │ + Presets │  │ + Charts     │ │
│  └───────────┘  └──────────┘  └──────────────┘ │
│        │              │              ▲           │
│        ▼              │              │           │
│  ┌───────────┐        │              │           │
│  │ MsgSend   │        │              │           │
│  │ (payment) │        │              │           │
│  └─────┬─────┘        │              │           │
│        │              │              │           │
│  Initia Appchain      │              │           │
│  (tx confirmation)    │              │           │
│        │              │              │           │
└────────┼──────────────┼──────────────┼───────────┘
         │              ▼              │
         │   ┌─────────────────────┐   │
         │   │  Backend (FastAPI)  │   │
         │   │                     │   │
         └──→│  payment_service    │   │
             │  (validates tx_hash)│   │
             │        │            │   │
             │        ▼            │   │
             │  simulation_engine  │   │
             │  (Monte Carlo)      │   │
             │        │            │   │
             │        ▼            │   │
             │  blockchain_service │   │
             │  (SHA-256 → proof)  │───┘
             │        │            │
             │        ▼            │
             │  storage (history)  │
             └─────────────────────┘
```

## Simulation Engine

The drug trial model is a two-arm Monte Carlo simulation with:

- **Emax dose-response curve** for treatment effect modeling
- **Age-stratified multipliers** for response, risk, and variability
- **Beta-distributed adherence** that degrades with trial duration
- **Adverse event severity classification** (mild / moderate / severe)
- **Dropout modeling** driven by side effects, adherence, and duration
- **Normal-approximation inference** for confidence intervals and p-values
- **Deterministic seeding** — identical parameters always produce identical results (reproducible science)

## Initia Integration

### InterwovenKit (required)

Wallet connection and all transaction handling uses `@initia/interwovenkit-react`. The `Providers` component wraps the app with `InterwovenKitProvider` and supports both public testnet and custom appchain configs via `createCustomInitiaChain()`.

### Session Key Auto-Signing (Initia-native feature)

After the first wallet approval, TrialFlow requests a session key grant so subsequent simulation runs within the same browser session auto-sign without additional wallet popups. This is critical for the research workflow — a user running 10 parameter variations shouldn't approve 10 separate transactions.

The session key UI shows grant status, expiry, and a revoke button in the auth panel.

### Appchain-Ready Configuration

The frontend reads chain config entirely from environment variables. Switching from testnet to a deployed appchain requires only updating `.env.local`:

```bash
NEXT_PUBLIC_INITIA_RPC_URL=https://your-appchain-rpc.example.com
NEXT_PUBLIC_INITIA_REST_URL=https://your-appchain-rest.example.com
NEXT_PUBLIC_INITIA_CHAIN_ID=your-appchain-chain-id
```

The `createCustomInitiaChain()` function in `lib/initia.ts` builds a full chain descriptor including fees, staking tokens, native assets, and VM type metadata.

## Local Setup

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

Open `http://localhost:3000`. InterwovenKit defaults to Initia testnet `initiation-2`.

### Docker

```bash
docker compose up --build
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Health check: `http://localhost:8000/health`

## Environment Variables

### Required

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api` | Backend API base URL |
| `NEXT_PUBLIC_INITIA_CHAIN_ID` | `initiation-2` | Target Initia chain |
| `NEXT_PUBLIC_INITIA_NETWORK` | `testnet` | Network label |
| `NEXT_PUBLIC_INITIA_PAYMENT_DENOM` | `uinit` | Payment denomination |

### Optional (appchain override)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_INITIA_RPC_URL` | Appchain RPC endpoint |
| `NEXT_PUBLIC_INITIA_REST_URL` | Appchain REST endpoint |
| `NEXT_PUBLIC_INITIA_INDEXER_URL` | Appchain indexer endpoint |
| `NEXT_PUBLIC_INITIA_JSON_RPC_URL` | Appchain JSON-RPC (EVM) endpoint |
| `NEXT_PUBLIC_INITIA_BECH32_PREFIX` | Address prefix (default: `init`) |
| `NEXT_PUBLIC_INITIA_VM_TYPE` | VM type: `minimove`, `miniwasm`, etc. |

## Project Structure

```
.
├── .initia/
│   └── submission.json          # Hackathon submission metadata
├── frontend/
│   ├── app/                     # Next.js App Router
│   ├── components/              # UI components
│   └── lib/                     # API client, types, Initia config, session
├── backend/
│   ├── models/                  # Pydantic request/response schemas
│   ├── routes/                  # FastAPI endpoints
│   ├── services/                # Payment, simulation, blockchain, storage
│   ├── simulation/              # Monte Carlo engine
│   └── storage/                 # In-memory store
├── docs/                        # Architecture and contribution notes
├── docker-compose.yml
└── README.md
```

## Submission Checklist

- [x] `.initia/submission.json` present
- [x] InterwovenKit used for wallet connection and transactions
- [x] Initia-native feature: session key auto-signing
- [x] Appchain-ready configuration with custom chain support
- [x] README with market understanding and architecture
- [x] End-to-end working demo
- [x] Appchain deployment proof: `trialflow-1`, launch tx `3382F0317C7A0785630C28B4C8DCCBCA57A88987090BF002AA2A3DCF9D174225`
- [ ] Demo video (recording pending)

## License

MIT

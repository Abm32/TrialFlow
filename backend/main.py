import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routes.simulations import router as simulations_router


def _cors_origins() -> list[str]:
    raw_origins = os.getenv("BACKEND_CORS_ORIGINS", "http://localhost:3000")
    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

app = FastAPI(
    title="TrialFlow API",
    version="0.1.0",
    description="MVP API for simulation-as-a-service workflows.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(simulations_router, prefix="/api")


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}

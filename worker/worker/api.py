from fastapi import FastAPI
from worker.config import Settings

app = FastAPI(title="Integration Centre Trusted Worker", version="0.4.0")


@app.get("/health")
def health() -> dict[str, str]:
    # Do not expose environment variables, credentials, or tenant data.
    return {"status": "ok", "service": "integration-centre-worker", "version": "0.4.0"}


@app.get("/ready")
def ready() -> dict[str, str]:
    Settings.from_env()
    return {"status": "ready"}

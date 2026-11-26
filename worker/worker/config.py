import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    supabase_url: str
    service_role_key: str
    worker_id: str
    poll_interval_seconds: int
    lease_seconds: int
    max_job_attempts: int
    csv_root: str
    allowed_hosts: tuple[str, ...]

    @classmethod
    def from_env(cls) -> "Settings":
        url = os.getenv("SUPABASE_URL", "").strip()
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
        if not url or not key:
            raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.")
        hosts = tuple(
            item.strip().lower()
            for item in os.getenv("CONNECTOR_ALLOWED_HOSTS", "").split(",")
            if item.strip()
        )
        return cls(
            supabase_url=url,
            service_role_key=key,
            worker_id=os.getenv("WORKER_ID", "integration-worker-local"),
            poll_interval_seconds=max(1, int(os.getenv("POLL_INTERVAL_SECONDS", "5"))),
            lease_seconds=max(60, int(os.getenv("JOB_LEASE_SECONDS", "600"))),
            max_job_attempts=max(1, int(os.getenv("MAX_JOB_ATTEMPTS", "3"))),
            csv_root=os.getenv("CSV_ROOT", "/data/inbound"),
            allowed_hosts=hosts,
        )

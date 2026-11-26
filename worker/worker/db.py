from functools import lru_cache
from supabase import Client, create_client
from worker.config import Settings


@lru_cache(maxsize=1)
def get_client() -> Client:
    settings = Settings.from_env()
    return create_client(settings.supabase_url, settings.service_role_key)

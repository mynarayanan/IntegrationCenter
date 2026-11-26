import pytest

from worker.config import Settings


def test_settings_require_supabase_credentials(monkeypatch):
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.delenv("SUPABASE_SERVICE_ROLE_KEY", raising=False)
    with pytest.raises(RuntimeError, match="required"):
        Settings.from_env()


def test_settings_parse_worker_options(monkeypatch, tmp_path):
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "test-only")
    monkeypatch.setenv("WORKER_ID", "test-worker-001")
    monkeypatch.setenv("CSV_ROOT", str(tmp_path))
    monkeypatch.setenv("CONNECTOR_ALLOWED_HOSTS", "api.example.com, data.example.com")
    settings = Settings.from_env()
    assert settings.worker_id == "test-worker-001"
    assert settings.allowed_hosts == ("api.example.com", "data.example.com")

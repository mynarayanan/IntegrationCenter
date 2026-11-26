FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONPATH=/app

WORKDIR /app
COPY worker/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY worker/worker ./worker
RUN useradd --create-home --uid 10001 worker \
    && mkdir -p /data/inbound \
    && chown -R worker:worker /app /data
USER worker

EXPOSE 8080
CMD ["uvicorn", "worker.api:app", "--host", "0.0.0.0", "--port", "8080"]

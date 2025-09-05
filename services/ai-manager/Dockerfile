# syntax=docker/dockerfile:1
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install app
COPY pyproject.toml /app/
RUN pip install --upgrade pip && pip install -e .

# Copy source
COPY ai_manager /app/ai_manager

EXPOSE 8000
CMD ["python", "-m", "ai_manager.app"]

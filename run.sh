#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
if [ ! -x .venv/bin/python ]; then
  python3.12 -m venv .venv
  .venv/bin/python -m pip install --upgrade pip
  .venv/bin/pip install -e .
fi
export BRUIN_BACKEND=${BRUIN_BACKEND:-classifier}
export BRUIN_JEV_MODEL=${BRUIN_JEV_MODEL:-jev-latest}
exec .venv/bin/uvicorn bruin_ai_quest.api:app --host 127.0.0.1 --port ${BRUIN_PORT:-8790}

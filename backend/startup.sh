#!/bin/bash
# Azure App Service startup (optional). Prefer Application Setting FIREBASE_CREDENTIALS_JSON;
# the app reads it directly in Python (see app/db/data.py) — no GOOGLE_APPLICATION_CREDENTIALS file needed.
#
# Portal startup command can be either:
#   bash startup.sh
#   uvicorn app.main:app --host 0.0.0.0 --port 8000
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}

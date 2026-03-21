#!/bin/bash
# Azure App Service startup script for FastAPI
# Use this as the startup command in Azure Portal: bash startup.sh
# Or set: uvicorn app.main:app --host 0.0.0.0 --port 8000

# Create Firebase credentials from env if FIREBASE_CREDENTIALS_JSON is set
if [ -n "$FIREBASE_CREDENTIALS_JSON" ]; then
  echo "$FIREBASE_CREDENTIALS_JSON" > /tmp/firebase-credentials.json
  export GOOGLE_APPLICATION_CREDENTIALS=/tmp/firebase-credentials.json
fi

# Use PORT from Azure (default 8000)
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}

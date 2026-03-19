## Personal Portfolio Monorepo

This repository contains both the frontend and backend for an AI‑futuristic personal portfolio.

- `frontend/`: Next.js (App Router) + TypeScript + Tailwind UI, deployed to Vercel.
- `backend/`: FastAPI service that exposes REST endpoints and talks to Firebase (Firestore).

The blog content is authored in markdown and synced into Firestore, then consumed by the frontend via the backend API.


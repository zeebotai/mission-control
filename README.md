# Mission Control

A shared command cockpit for Trevor + AI agents.

## First runnable deliverable
- Sidebar layout
- Top stat cards
- What’s Running Now panel
- Recent activity feed
- Quick action buttons
- Fake-ish data (seeded into SQLite) acceptable for v0

## Run locally

### Backend
```bash
cd backend
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Open: http://localhost:3000

## Next slices
1) Replace stubs with real integration:
   - wire Clawdbot sessions/agents/cron into DB + activity log
2) Workspace file scanner (write WorkspaceFile + log events)
3) Job scheduler (APScheduler) persisting Job runs
4) Cost tracking + analytics

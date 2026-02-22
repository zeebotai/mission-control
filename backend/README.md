# Mission Control (backend)

## Run (local)

```bash
cd backend
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API:
- `GET /system/stats`
- `GET /system/now`
- `GET /system/activity`
- `POST /system/actions/*` (stubs)
- `GET /agents`
- `GET /jobs`

DB:
- SQLite by default: `mission_control.db`

Next steps:
- Replace stub actions with real Clawdbot integrations (pause/resume/kill, sessions, cron jobs)
- Add scheduler service for Jobs/Cron tasks
- Workspace file scanner + file-change events
- Cost tracking wired to session data

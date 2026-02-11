# Deploy Backend to Render

## 1) Service settings
- Runtime: `Python`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Health check path: `/api/health`

If you use Blueprint deploy, `render.yaml` is already prepared.

## 2) Required environment variables
- `OPENROUTER_API_KEY`
- `OPENROUTER_BASE_URL` (usually `https://openrouter.ai/api/v1`)
- `ALLOWED_ORIGINS` (JSON array, example: `["https://your-frontend.onrender.com"]`)
- `ADMIN_USERNAME` (optional)
- `ADMIN_PASSWORD` (optional)
- `DATABASE_URL` (for SQLite use `sqlite:///./readers.db`)

## 3) Database notes
- Current setup is SQLite-first (no Postgres required).
- Default value:
  - `sqlite:///./readers.db`
- Important: on Render Free web service filesystem can be reset on redeploy/restart, so SQLite data may be lost.

## 4) Smoke checks
- `GET /api/health` should return `{"status":"ok"}`
- OpenAPI docs should load at `/docs`

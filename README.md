# চাঁদা হিসাব — React + Express + PostgreSQL

## Run locally
```bash
# 1. database
createdb chanda

# 2. backend
cd backend
cp .env.example .env        # edit DATABASE_URL, ADMIN_PASSWORD, JWT_SECRET
npm install
npm run dev                 # http://localhost:4000  (tables + 15 members are created on first start)

# 3. frontend (new terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173  (proxies /api to :4000)
```

## Deploy as one service
```bash
cd frontend && npm install && npm run build
cd ../backend && npm install && npm start
```
Express serves `frontend/dist` automatically, so one URL runs the whole app.
For a hosted DB (Neon / Supabase / Render) set `PGSSL=true`.

## What moved where
| Original (localStorage)        | Now |
|--------------------------------|-----|
| members / payments / expenses / settings | PostgreSQL tables |
| backup copy / restore          | `GET /api/backup`, `POST /api/restore` |
| Excel (hand-made zip)          | `exceljs` on the server: `/api/export/report/:month`, `/api/export/receipt/:memberId/:month` |
| JPG report & receipt, WhatsApp/SMS, share | still in the browser (canvas), same as before |
| (none)                         | password login (JWT), since the data is now online |

The 15 starting members live in `backend/src/db.js` (SEED_MEMBERS) - edit before the first run if needed.

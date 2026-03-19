# Where Interview History Is Stored

## 1. Where interviews get **saved** (storage)

### Database
- **Table:** `interview_sessions` (see `backend/app/models/session.py`).
- **Database:** Configured by `DATABASE_URL` in `backend/.env` (e.g. SQLite or PostgreSQL). The app uses `backend/app/database.py` → `SessionLocal` to talk to this DB.

### When a row is created
A new row is inserted when the frontend calls **`POST /api/sessions/`** with the session payload. That happens in **four** places in `frontend/src/App.jsx`:

| When | Location (approx. line) |
|------|--------------------------|
| After you submit an answer (non-timed) and get feedback | ~389 |
| After you submit a **follow-up** answer | ~492 |
| When a **timed** question times out and the answer is auto-submitted | ~674 |
| When you submit an answer during a **timed** session (before time runs out) | ~857 |

So an interview only appears in history if one of these `POST /api/sessions/` calls runs successfully (and the user is logged in).

### Backend: who writes to the DB
- **Router:** `backend/app/routers/sessions.py`
- **Endpoint:** `POST /api/sessions/`
- It uses `get_current_active_user`, so the request must include a valid **JWT** in the `Authorization` header.
- It creates an `InterviewSession` with `user_id=current_user.id` and commits it to the database.

---

## 2. Where the dashboard gets **interview history** (what you see)

### API
- **Endpoint:** `GET /api/dashboard/history`
- **Router:** `backend/app/routers/dashboard.py` → `get_history()`
- It loads from the same `interview_sessions` table, filtered by **current user** and ordered by `created_at` descending, with a **limit of 20**.

### Frontend
- **Data flow:** When you open the **Dashboard**, `fetchDashboardData()` runs (e.g. from `useEffect` when `currentView === "dashboard"`).
- It calls `GET /api/dashboard/stats` and **`GET /api/dashboard/history`** with the same auth token.
- The response is stored in `dashboardData.history` and the table renders from that.

So “interview history” on the dashboard is exactly what `GET /api/dashboard/history` returns: the last 20 sessions for the **logged-in user** from the **same database** where `POST /api/sessions/` writes.

---
# Stacks — Enterprise AI Knowledge Assistant

A full-stack knowledge assistant: employees upload documents (PDF/DOCX/TXT, including scanned PDFs via OCR), ask questions in plain language, and get answers with source citations. Role-based access for Admin vs Employee, plus notifications, quizzes, summaries, feedback, and backup/restore.

This is a **real, functional build** — auth, database, file processing, retrieval, and every module below actually works end to end, not a mockup.

## Tech Stack
- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** FastAPI (Python)
- **Database:** PostgreSQL
- **Retrieval:** TF-IDF + cosine similarity (scikit-learn) over uploaded document text — works with **zero API keys**
- **LLM (optional):** OpenAI or Gemini — pick per-user in Settings. If neither key is configured, the app falls back to extractive answers/summaries so it's always usable.
- **OCR:** Tesseract + pdf2image, auto-triggered when a PDF has little to no extractable text (i.e. it's scanned)
- **Auth:** JWT access tokens, bcrypt password hashing, OTP email verification, forgot/reset password
- **Voice input:** Browser Web Speech API (no backend transcription service needed)

## Feature checklist — all implemented

**Authentication:** signup with OTP email verification, login, forgot/reset password (OTP-based), role-based login (Admin/Employee), first signup becomes Admin automatically.

**Dashboard:** total documents, total users, AI usage count, recent uploads, quick search.

**Document management:** PDF/DOCX/TXT upload with OCR fallback for scanned PDFs, delete, update (title/category/tags), categories (HR/IT/Finance/Policies, auto-seeded), tags.

**AI Chat:** ask questions in natural language, real TF-IDF retrieval across all indexed documents, source citations with confidence %, chat history persisted per session, optional GPT/Gemini-generated answers, voice-to-text input, thumbs up/down feedback per answer.

**Search:** keyword search, filter by category, filter by upload date (via document list ordering + category filter).

**User management (Admin):** add user, delete user, assign roles, block/unblock.

**Notifications:** broadcast on new document upload, admin announcements, in-app bell with unread count and mark-as-read. (Email notifications reuse the same email service as OTP — see "Email" below.)

**Reports & analytics:** most viewed documents, AI usage stats, feedback summary (admin).

**Profile:** update name, change password, upload profile picture, activity history.

**Security:** JWT auth, bcrypt hashing, file type/size validation, role-based authorization enforced server-side on every route, activity audit log.

**Settings:** theme (dark/light — actually switches the whole UI), language preference (English/Hindi — stored per user; UI strings are currently English-only, the toggle is wired and ready to extend), AI model selection (auto/OpenAI/Gemini, per user).

**Admin panel:** manage users, manage documents, view system logs, backup database (pg_dump) and restore from a `.sql` file.

**Bonus:** voice-to-text (Web Speech API), OCR for scanned PDFs, AI document summarizer, AI-generated quizzes (multiple choice, from any uploaded document), feedback/rating system on chat answers.

## How the AI chat actually works
1. Every uploaded file is text-extracted on upload (OCR automatically kicks in if a PDF returns almost no text).
2. On each question, the backend chunks all document text, TF-IDF-vectorizes it alongside the question, and ranks chunks by cosine similarity — this is the "search" step, and it needs no API key.
3. Top matches become the "sources" shown with a confidence score.
4. If the user's selected AI model (Settings → AI model) has a configured API key on the server, those chunks are passed as context to generate a real answer. Otherwise, the best-matching excerpt is returned directly.

Summaries and quizzes follow the same pattern: LLM-generated if a key is available, otherwise a genuinely-computed extractive summary / auto-generated fill-in-the-blank quiz — never a placeholder.

## Quick Start (Docker — easiest)

Requires [Docker](https://www.docker.com/).

```bash
docker compose up --build
```
Starts PostgreSQL + the FastAPI backend on `http://localhost:8000`.

Then run the frontend separately (for hot-reload):
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173`.

## Quick Start (without Docker)

**1. PostgreSQL:**
```sql
CREATE DATABASE knowledge_assistant;
```

**2. Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```
Note: OCR and backup/restore need system packages `tesseract-ocr`, `poppler-utils`, and `postgresql-client` installed locally if you're not using Docker (`apt install tesseract-ocr poppler-utils postgresql-client` on Debian/Ubuntu).

API docs: `http://localhost:8000/docs`.

**3. Frontend:**
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173`.

## Using the app
1. Sign up at `/signup`. **The very first user ever created becomes Admin automatically.**
2. Check your email for the OTP — if you haven't configured SMTP (see below), **the code is printed to the backend console/logs** instead, so you can still complete signup in local dev.
3. Upload a document, ask about it in AI Chat, try Summarize/Quiz on it, check Reports and Admin Panel as Admin.

## Email (OTP + notifications)
By default, no SMTP account is required — OTP codes and notification emails print to the backend console so the whole flow works out of the box. To send real emails, set in `.env` / `docker-compose.yml`:
```
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM=no-reply@yourcompany.com
```

## Enabling real LLM answers
```bash
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```
Users then pick their preferred provider in Settings → AI model (`auto` uses whichever is configured).

## Project Structure
```
ai-knowledge-assistant/
├── backend/
│   └── app/
│       ├── routers/       auth, documents, chat, users, reports, notifications, feedback, settings, admin
│       ├── services/      text extraction, OCR, retrieval, LLM, summarizer, quiz, email, OTP, notifications, activity log
│       ├── models.py, schemas.py, security.py, deps.py, config.py, database.py, main.py
├── frontend/
│   └── src/
│       ├── pages/          Login, Signup, VerifyOtp, ForgotPassword, Dashboard, Documents, Chat, Users, Reports, Profile, Settings, AdminPanel
│       ├── components/     Navbar, NotificationBell, ProtectedRoute
│       ├── context/        AuthContext, ThemeContext
├── docker-compose.yml
└── README.md
```

## Deploying
- **Backend:** the Docker image runs on Render/Railway/AWS ECS/etc — set the env vars from `.env.example`. Make sure the host image includes `tesseract-ocr`, `poppler-utils`, and `postgresql-client` (already in the provided Dockerfile) if you want OCR and backup/restore to work in production.
- **Frontend:** `npm run build` → deploy the static `dist/` folder (Vercel/Netlify). Point it at your deployed backend URL in production (currently proxied to `localhost:8000` in dev via `vite.config.js`).
- **Database:** any managed Postgres (Render, Supabase, RDS, Neon).

# Rashid Dental Clinic — Appointment Booking & Management System

A full MERN-stack appointment booking and management system: a React (Vite) frontend
and an Express/MongoDB backend, connected end-to-end with JWT authentication,
real-time availability checking, and Gmail SMTP email notifications.

```
rashid-dental-clinic/
  backend/     Express + MongoDB API  (see backend/README.md)
  frontend/    React + Vite client    (see frontend/README.md)
  render.yaml  Optional one-shot Render Blueprint for both services
```

## 1. How the two pieces are connected

- The frontend calls the backend exclusively through `frontend/src/lib/api.ts`, a
  typed fetch wrapper that reads the backend's base URL from `VITE_API_URL` and
  attaches the stored JWT as `Authorization: Bearer <token>` on every request.
- Login/register responses from `/api/auth/*` return a token, which the frontend
  stores in `localStorage` and restores on page load via `/api/auth/me`.
- Every page that used to show hardcoded/mock data (services, doctors, appointments,
  dashboard stats, patients, clinic settings) now fetches it live from the backend
  via React Query (`@tanstack/react-query`).
- Route guards (`frontend/src/components/ProtectedRoute.tsx`) enforce that only a
  logged-in `patient` can reach `/patient/*` and only a logged-in `admin` can reach
  `/admin/*` — redirecting to `/login` otherwise. This is a client-side convenience
  only; the backend independently re-checks role on every protected route, so it
  can't be bypassed by editing the URL.
- CORS on the backend is restricted to `CLIENT_URL`, so that must match wherever the
  frontend is actually running (`http://localhost:5173` locally, or your deployed
  Render static site URL in production).

## 2. Running it locally

**Backend first:**
```bash
cd backend
npm install
cp .env.example .env
# edit .env: set MONGODB_URI (Atlas), JWT_SECRET, EMAIL_USER/EMAIL_PASS
npm run seed     # creates an admin account, a demo patient, doctors, and services
npm run dev      # http://localhost:5000
```

**Frontend, in a second terminal:**
```bash
cd frontend
npm install
cp .env.example .env
# .env already defaults to http://localhost:5000/api — adjust if your backend port differs
npm run dev      # http://localhost:5173
```

Open `http://localhost:5173`. Log in with the credentials `npm run seed` printed to
your terminal (defaults: `admin@rashiddental.com` / `Admin@12345` for the admin
workspace, `patient@example.com` / `Patient@12345` for the patient portal), or
register a new patient account from the UI.

## 3. Deployment (Render)

Either follow the manual steps below, or use the included `render.yaml` as a
Blueprint (Render dashboard → New → Blueprint → point at this repo) and just fill
in the secret values it asks for.

**Backend — Render Web Service**
- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Environment variables: everything in `backend/.env.example`, with real values
  (Render sets `PORT` for you automatically — the server already reads
  `process.env.PORT`).

**Frontend — Render Static Site**
- Root directory: `frontend`
- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Environment variable: `VITE_API_URL=https://<your-backend>.onrender.com/api`
- Add a rewrite rule so client-side routing works on refresh: `/*` → `/index.html`
  (this is already declared in `render.yaml`; if deploying manually, add it under
  the static site's Redirects/Rewrites tab).

**Database — MongoDB Atlas**
- Create a free cluster, a database user, and allow network access from anywhere
  (or Render's IP ranges).
- Use the connection string as `MONGODB_URI` on the backend — never commit it to
  source control (`.gitignore` already excludes `.env` in both folders).

## 4. Gmail SMTP & the Render limitation

The backend sends appointment emails via Gmail SMTP (`nodemailer`), documented in
`backend/README.md`. **Render blocks outbound SMTP ports on standard web service
plans**, so email that works when running the backend locally may silently fail to
send once deployed to Render — this is a platform limitation, not a bug in this
code. To keep the rest of the app functional regardless, `sendEmail()` in
`backend/src/utils/sendEmail.js` never throws: a failed email is logged, but the
underlying appointment action (booking, confirming, cancelling, etc.) still
succeeds. For production email delivery from Render, swap `sendEmail.js` for an
HTTP-based provider (SendGrid, Resend, Mailgun) — everything else in the codebase
is unaffected by that change.

## 5. Business rules (enforced server-side, not just in the UI)

- No booking on a past date.
- Availability is computed from clinic hours ∩ doctor hours ∩ existing bookings,
  and re-verified at submission time (not just when slots are first displayed).
- A doctor can't hold two active appointments in the same date + time slot — backed
  by a database-level partial unique index, not just application logic.
- Patients can only see and cancel their own appointments.
- Only admin routes can confirm, reject, reschedule, or complete an appointment —
  patients have no such endpoints available to them at all.
- Cancelling reopens the slot automatically (it's simply excluded from the "active"
  statuses the availability engine checks).
- Every status change is appended to an appointment's history with who changed it
  and when.
- No medical history field exists anywhere — only a short free-text reason for the
  visit, per the project spec.

## 6. What's left for you to fill in

- `backend/.env` → your real `MONGODB_URI`, `JWT_SECRET`, and Gmail `EMAIL_USER`/`EMAIL_PASS`.
- `frontend/.env` → your deployed backend's `VITE_API_URL` once it's live.
- The remaining course deliverables that are inherently about *your* submission
  rather than the code itself: testing report, architecture diagram, demo video,
  and email screenshots.

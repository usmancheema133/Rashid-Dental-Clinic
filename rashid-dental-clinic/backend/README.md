# Rashid Dental Clinic — Backend API

Node.js / Express / MongoDB (Mongoose) backend for the Rashid Dental Clinic
appointment booking and management system.

## 1. Setup

```bash
cd rashid-dental-backend
npm install
cp .env.example .env
```

Fill in `.env`:
- `MONGODB_URI` — your MongoDB Atlas connection string (you'll add this yourself)
- `JWT_SECRET` — any long random string
- `EMAIL_USER` / `EMAIL_PASS` — a Gmail address + a Google **App Password**
  (not your normal Gmail password — see the SMTP note below)

Then seed an admin account, a sample patient, and demo doctors/services:

```bash
npm run seed
```

This prints working test credentials, e.g.:
```
Admin login   -> admin@rashiddental.com / Admin@12345
Patient login -> patient@example.com / Patient@12345
```

Run the server:

```bash
npm run dev     # nodemon, auto-restarts on changes
npm start       # plain node, for production
```

Health check: `GET /api/health`

## 2. Project structure

```
server.js                  entry point — loads env, connects DB, starts Express
src/
  app.js                   Express app: middleware + route mounting
  config/db.js             Mongoose connection
  models/                  User, Doctor, Service, Appointment, ClinicSettings
  middleware/               auth (JWT + roles), validation, error handling
  controllers/              route logic, grouped by resource
  routes/                   route definitions, grouped by resource
  utils/                    API response shape, email, slot engine, tokens
scripts/seed.js            creates admin/patient/demo doctors & services
```

## 3. Authentication & roles

- JWT-based. `POST /api/auth/register` always creates a `patient` account.
- There is no public admin sign-up — admin accounts are created via
  `npm run seed` or directly in the database. This matches the spec's
  intent that only trusted staff get admin access.
- Send the token as `Authorization: Bearer <token>` on protected routes.
- `protect` middleware verifies the token; `authorize('admin')` /
  `authorize('patient')` middleware enforces role-based access **on the
  server**, not just in the UI.

## 4. API overview

All responses share this shape:
```json
{ "success": true, "message": "...", "data": {} }
```

| Area | Routes |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Users | `GET/PATCH /api/users/me`, `PATCH /api/users/me/password` |
| Doctors | `GET /api/doctors`, `GET /api/doctors/:id`, `POST/PATCH/DELETE /api/doctors/:id` (admin) |
| Services | `GET /api/services`, `GET /api/services/:id`, `POST/PATCH/DELETE /api/services/:id` (admin) |
| Availability | `GET /api/availability/settings`, `PATCH /api/availability/settings` (admin), `GET /api/availability/slots?doctorId=&date=&serviceId=` |
| Appointments (patient) | `POST /api/appointments`, `GET /api/appointments/my`, `GET /api/appointments/:id`, `PATCH /api/appointments/:id/cancel` |
| Admin | `GET /api/admin/dashboard`, `GET /api/admin/appointments?date=&doctorId=&serviceId=&status=`, `PATCH /api/admin/appointments/:id/{confirm,reject,reschedule,cancel,complete}`, `GET /api/admin/patients?search=` |

## 5. Business rules enforced server-side

- No booking on a past date (checked against the server clock, not client input).
- Availability is computed from clinic hours ∩ doctor working hours ∩ existing
  bookings, and **re-verified at submission time**, not just when slots are displayed.
- A doctor cannot hold two active appointments in the same date + time slot —
  enforced by a partial unique index on `Appointment` (`doctor + appointmentDate + startTime`,
  scoped to `pending/confirmed/rescheduled` statuses) as well as an application-level check.
- Patients can only see and cancel their **own** appointments — enforced in
  the controller, not just hidden in the frontend.
- Only admin routes can confirm, reject, reschedule, or complete an appointment.
- Cancelling (by patient or admin) sets status to `cancelled`, which removes
  it from the "active" set the slot engine checks — so the slot reopens automatically.
- Every status transition is appended to `statusHistory` with who changed it and when.
- An email is sent after every relevant status change.
- No medical history field exists anywhere in the `Appointment` model — only
  a short free-text `reason` for the visit, per the spec.

## 6. Gmail SMTP note (local development)

Email is sent via `nodemailer` using Gmail SMTP (`smtp.gmail.com:465`). To use it:
1. Enable 2-Step Verification on the Gmail account.
2. Generate a **Google App Password** and use it as `EMAIL_PASS` (not the account password).
3. Set `EMAIL_USER` to the full Gmail address.

**Render limitation:** Render's outbound network on most plans blocks SMTP
ports (25/465/587) for standard web services, so Gmail SMTP that works
locally may fail once deployed to Render. This backend is written so email
failures never break the underlying request (`sendEmail` swallows and logs
errors rather than throwing) — appointments still get created/updated even
if the email can't be delivered. For production email from Render, the
usual workaround is an HTTP-based provider (e.g. SendGrid, Resend, Mailgun)
instead of raw SMTP; that swap only touches `src/utils/sendEmail.js`.

## 7. Deployment (Render)

- **Build Command:** `npm install`
- **Start Command:** `npm start`
- The server already binds to `process.env.PORT` (Render sets this automatically).
- Add all `.env` values as environment variables in the Render dashboard —
  never commit `.env` (already covered by `.gitignore`).

## 8. Connecting the frontend

Set the frontend's API base URL to point at this backend, e.g.:
```env
VITE_API_URL=http://localhost:5000/api
```
and in production, the deployed Render backend URL. The frontend then needs
to store the JWT returned from `/api/auth/login` (or `/register`) and send
it as a `Bearer` token on every protected request. This backend currently
has **no CORS restriction beyond `CLIENT_URL`**, so make sure that env var
matches your deployed frontend origin.

# MedTrace

**A full-stack medication and symptom tracker with caregiver support and an AI summarization layer.**

MedTrace helps patients log medications and daily symptoms, surfaces real drug information, and generates plain-English reports they can bring to their doctor. A caregiver mode lets a family member, with the patient's permission, monitor data and enter information on their behalf. The app *organizes and communicates* health information. It never diagnoses or recommends medical decisions.

**Live app:** [medtrace-red.vercel.app](https://medtrace-red.vercel.app) 

---

## Why this project

Medication non-adherence is a large, under-addressed public health problem, and patients often arrive at appointments without a clear record of how they have been feeling. MedTrace closes that gap with a simple logging flow and AI-generated summaries, while keeping the AI in a *summarizing*, not *advising*, role.

## What the app does

- **Accounts and security.** Validated registration with BCrypt-hashed passwords, login issuing signed JWTs, stateless authentication enforced on every protected request by a custom filter, and role-based access for patient and caregiver accounts.
- **Medication management.** Create, list, edit, and delete, scoped to the owner. Adding a medication pulls purpose, warnings, and side effects from the OpenFDA drug label API, re-fetching when a name changes. Every change is timestamped into an audit trail.
- **Daily check-ins.** A structured snapshot (mood, energy, pain, sleep, medications-taken) plus an optional journal entry, capped at one per day and viewable as dated history.
- **Schedules and dose logging.** Patients set dosing times and log doses as they take them. As-needed (PRN) medications are supported with no fixed schedule.
- **Dose status.** Each scheduled dose reads as taken, upcoming, overdue, or missed, computed against the schedule and a grace period. Overdue is late but still actionable today; missed is an unlogged dose on a day that has closed.
- **AI health narratives.** An on-demand, plain-English summary of recent check-ins from Google Gemini, under guardrails that describe only, never diagnose or advise.
- **AI trend detection.** Transparent, code-owned rules flag patterns like rising pain, low mood, and missed-dose clusters. Gemini only phrases findings the code already produced.
- **Retrieval-grounded narratives.** An alternate narrative grounded in the patient's own FDA drug facts via semantic vector search (pgvector + Gemini embeddings), so drug references draw on authoritative data rather than the model's training.
- **PDF health reports.** Downloadable weekly, monthly, and yearly reports covering medications, adherence rates, averaged check-in trends, and a fenced AI journal summary that degrades gracefully if the AI is down. Rendered from HTML via openhtmltopdf.
- **Caregiver mode (patient-initiated).** A patient invites a caregiver at one of two permission levels (`VIEW_ONLY` or `VIEW_AND_INPUT`). With input permission the caregiver can log on the patient's behalf, every entry stamped with who entered it. All access runs through a central authorization gate.
- **Caregiver email alerts.** A detected missed-dose cluster triggers an automated email to linked caregivers via Resend, reusing the same trend rules as the in-app flags.
- **Consistent error handling.** A global exception handler returns clean JSON errors with appropriate status codes.

## Tech stack

**Client:** React Native + Expo (iOS, Android, web from one codebase), Expo Router, cross-platform secure storage (SecureStore on device, web fallback).

**Backend:** Java 25, Spring Boot 4.1, Spring Security + JWT (`jjwt`), Spring Data JPA / Hibernate, PostgreSQL + pgvector, OpenFDA API, Google Gemini API, openhtmltopdf + jsoup, Resend, Maven.

**Infrastructure:** Docker; PostgreSQL + pgvector on Supabase; backend on Render; Expo web client on Vercel.

## Architecture

The backend is a standard layered Spring Boot app: `controller -> service -> repository -> database`.

- **Auth.** A JWT filter validates the `Authorization` header, loads the user, and marks the request authenticated; Spring Security then enforces route and role rules.
- **Drug enrichment.** Adding or renaming a medication calls OpenFDA, parses the label, and stores the facts; unrecognized drugs still save with empty facts. Present facts are embedded for retrieval automatically.
- **Dose status.** Computed at read time, not stored: active schedules and the day's logged doses are loaded and each slot classified, so status always reflects the latest logs without a background job.
- **AI layer.** Feature services gather a window of the patient's own data and call Gemini through a thin `GeminiService` that only handles the API call. Crucially, the model never decides what is medically notable: deterministic rules in code detect trends, and Gemini only phrases them. Prompts forbid diagnosis, advice, and causal claims.
- **Retrieval (grounded narratives).** Drug-fact text is embedded and stored in a pgvector column; at narrative time a query built from the patient's medications retrieves the nearest chunks by cosine distance (`<=>`), scoped to that patient. Embeddings are L2-normalized in code, required for correct cosine similarity at non-default vector sizes.
- **Reporting.** One service gathers a period's data into HTML; a tiny separate renderer turns it into PDF bytes, so the PDF library is swappable in one place. Not-yet-due doses are excluded from adherence rather than counted as missed, and averaged metrics show the day-count behind them.
- **Caregiver authorization.** A `CareLink` carries a permission level and status (`PENDING`/`ACTIVE`/`REVOKED`). All on-behalf access funnels through two gate methods: `resolveInputTarget` (writes, requires `VIEW_AND_INPUT`) and `resolveViewTarget` (reads, any active link). Caregiver entries carry an `enteredBy` field so they are never silently attributed to the patient.
- **Data integrity.** One check-in per user per day and one log per scheduled dose are enforced at both the database (unique constraint) and service layers. Ownership is verified at every step, and against the resolved patient when a caregiver acts on their behalf.
- **Secrets.** The DB password and API keys are read from environment variables with no fallback, so the app fails fast if one is missing. In production these are Render environment variables.

```
backend/src/main/java/backend/
  config/      Security config + JWT filter + CORS
  controller/  REST endpoints
  service/     Business logic (auth, medications, OpenFDA, check-ins, schedules,
               doses, Gemini, narratives, anomaly detection, embeddings/retrieval,
               reports + PDF, care links + gates, caregiver alerts)
  repository/  Spring Data JPA repositories
  model/       JPA entities
  dto/         Request/response records
  exception/   Custom exceptions + global handler

mobile/
  app/         Expo Router screens (auth, patient tabs, caregiver tabs)
  src/
    api/         Backend call modules, one per domain
    context/     Auth context + care context
    components/  Themed primitives
    theme/       Design tokens
```

## Client design

One Expo codebase, two role-based experiences. An auth context resolves who the user is and persists the session; for caregivers, a second context resolves which linked patient is being viewed. The patient side centers on a daily home view (today's doses with one-tap mark-as-taken, plus a check-in prompt) with tabs for medications, check-ins, reports, and profile. The caregiver side mirrors it for monitoring. A first-launch guided tour can be replayed from the profile screen.



## Running locally

**Prerequisites:** Java 17+ (built on Java 25), Maven, Node.js with the Expo CLI, and PostgreSQL with **pgvector**.

### Backend

1. Create the database and enable pgvector:
   ```sql
   CREATE DATABASE medtrace;
   \c medtrace
   CREATE EXTENSION vector;
   ```
2. Set environment variables (a local default is used for the first three):
   - `DATABASE_URL` defaults to `jdbc:postgresql://localhost:5432/medtrace`
   - `DATABASE_USERNAME` defaults to `postgres`
   - `DB_PASSWORD` your PostgreSQL password
   - `GEMINI_API_KEY` Google Gemini key (narratives, trends, embeddings)
   - `RESEND_API_KEY` Resend key (caregiver email alerts)
   - `JWT_SECRET` optional; a development fallback is used otherwise
3. From `backend/`, run `./mvnw spring-boot:run`. The API starts on `http://localhost:8080`.

### Client

1. From `mobile/`, run `npm install`.
2. Set the API base URL in `src/api/config.ts` (use your machine's LAN IP for a physical device).
3. Run `npx expo start` and open on a device, simulator, or the web build.

## Deployment

Three independent tiers:

- **Database:** PostgreSQL + pgvector on Supabase, connected through the session pooler, with the Hibernate pool sized to stay within the free-tier client limit.
- **Backend:** built from a multi-stage Dockerfile (Maven build, slim JRE runtime) and deployed on Render, with all secrets and Supabase details as Render environment variables.
- **Frontend:** the Expo web client exported to static files (`npx expo export -p web`) and deployed on Vercel, pointed at the Render backend and allow-listed in the backend's CORS config.

## Free-tier limitations

This is a portfolio deployment running entirely on free tiers:

- **Render (backend):** the free web service spins down after about 15 minutes of inactivity, so the first request after idle takes roughly 30 to 60 seconds while the container cold-starts. After that it stays warm until the next idle period.
- **Supabase (database):** the free session pooler caps total client connections, so the Hibernate connection pool is kept small, and free projects can be paused after extended inactivity. The deployed database starts empty rather than seeded with sample data.
- **Google Gemini (AI):** the free API tier has per-minute and per-day request quotas. When the model is rate-limited or briefly overloaded, AI features degrade gracefully to a plain "unavailable" message rather than erroring, so the rest of the app keeps working.
- **Resend (email):** the free tier sends from a sandbox domain, which only reliably delivers to the account owner's own verified address, and has a monthly send cap. Delivering caregiver alerts to arbitrary recipients would require verifying a sending domain.

None of these affect the code or architecture; they are hosting-tier characteristics worth knowing when trying the live app.

## Disclaimer

MedTrace is a personal portfolio project. It is not a medical device and does not provide medical advice, diagnosis, or treatment. Its AI features summarize user-entered information only.

---

*Built by Kultum Lhabaik.*
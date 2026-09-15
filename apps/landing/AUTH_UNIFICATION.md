# Unified auth (Option A) — local + deploy notes

## Architecture
- **Landing (`frontend-landing`, Next.js :3000)** owns `/`, `/login`, `/signup`, marketing, and is the production host.
- **Tutor (`frontend-tutor`, Vite :5173)** owns `/student/*`, `/teacher/*`, `/admin/*`, `/dev/*`.
- Both live under the **AIra/** product root and use Firebase project **`aira-landingpage`**.
- Production: landing `vercel.json` rewrites tutor paths to `https://ai-ra-app.vercel.app`.
- Local: landing `next.config.mjs` rewrites those paths to `http://localhost:5173`.

## Product tree

```text
AIra/
├── frontend-landing/   # Next.js
├── frontend-tutor/     # Vite
├── package.json
└── README.md
```

## Local development

From the product root (recommended):

```bash
cd AIra
npm run install:all   # first time
npm run dev           # tutor :5173 + landing :3000
```

Or separately:

```bash
# Terminal 1 — tutor
cd AIra/frontend-tutor
npm run dev          # http://localhost:5173

# Terminal 2 — landing (proxies tutor routes + owns /api/*)
cd AIra/frontend-landing
npm run dev          # http://localhost:3000
```

Open **http://localhost:3000** only. Sign in at `/login`, then you should land on the role home under the same origin.

### API routing
- Landing owns `/api/tts`, `/api/tts/health`, `/api/chat`, `/api/waitlist`, `/api/welcome` (Next.js route handlers).
- Tutor Vite proxies `/api/*` → landing `:3000` so direct `:5173` access still works.
- Do **not** rewrite `/api/*` to the tutor SPA in `next.config.mjs` / landing `vercel.json`.
- Production tutor host (`ai-ra-app.vercel.app`) serves its own `/api/tts` + `/api/waitlist` serverless functions.

## Email verification (password signup)
Branded “Verify your email for AIra” is sent from `/api/auth/send-verification` via **Resend** (AIra logo + **Verify email address** button — no raw firebaseapp.com link in the HTML body).

Requires `FIREBASE_SERVICE_ACCOUNT_JSON` + `RESEND_API_KEY` on Vercel. Resend on `/verify-email` is rate-limited (60s). Falls back to Firebase default mail only if Admin is missing.

## Welcome email (new accounts only)
Branded “Welcome to AIra” mail is sent from landing `/api/welcome` **once per new account**:
- New OAuth (Google / Apple / Microsoft): when `isNewUser === true`
- New email/password: at signup (alongside verification email), not on every login

Returning logins never request welcome. Failed sends retry via `welcomeEmailPending` + `retryWelcomeEmailIfPending`. Firestore `welcomeEmailSent` + claim-before-send make sends idempotent.

### Required env (`.env.local` + Vercel `aira-landing-page-elite`)
```
# Prefer SMTP for Gmail (Resend sandbox onboarding@resend.dev cannot reach real users)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=airaaitutor@gmail.com
SMTP_PASS=<Google App Password>
SMTP_FROM="AIra <airaaitutor@gmail.com>"
EMAIL_FROM="AIra <airaaitutor@gmail.com>"

# Optional: Resend with a *verified custom domain* (not resend.dev / not gmail.com)
# RESEND_API_KEY=re_...
# EMAIL_FROM=AIra <noreply@your-verified-domain.com>
```
Health check: `GET /api/email/health` → `{ canDeliverExternally: true, provider: "smtp"|"resend" }`.

If `EMAIL_FROM` is still `onboarding@resend.dev` and SMTP is unset, only the Resend account owner receives mail. The app now prefers SMTP whenever From is sandbox or Gmail.

Optional but recommended for branded verification links + Admin SDK:
```
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```
Without Resend or SMTP, signup still works; welcome mail returns 503. Without a service account, branded verification falls back to Firebase default mail. Email copy always spells the brand as **AIra** (ASCII).

Backfill pending test accounts: `node scripts/backfill-welcome-email.mjs` (requires Admin JSON + Resend or SMTP).

## Post-auth navigation
- student → always `/student/mode-selection` (Mode Selection)
- teacher → `/teacher/dashboard`
- admin → `/admin/dashboard`

## Logout
Logout from tutor or landing header clears the session and navigates to the **Landing Page** (`/`), never `/login`.

## Demo roles
`/dev/demo-roles` — DEV or authenticated admin only. Not a public login.

## Roll-number auth
Still in tutor `authStore` only (not on landing UI). Confirm whether to migrate before removing.

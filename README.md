# AIra AI Tutor — Frontend Only

Standalone **frontend-only** AIra app (Landing → Auth → Student/Teacher → Tutor).
No live AI providers, no private keys, no API route handlers.

## Architecture (backend-ready)

```
Pages / components
        │
        ▼
Service functions  (auth, chat, tts, lessons, exams, …)
        │
        ▼
mockAdapter        ← today: local/demo data
httpAdapter        ← later: swap in when backend exists
        │
        ▼
FUTURE /api/* contracts (documented on each service)
```

**Rules**
1. Pages/components must **not** `fetch('/api/...')` directly.
2. All data/auth/chat/tts/lesson calls go through service functions.
3. Today every networked concern uses **mockAdapter**.
4. Each service documents the future endpoint contract.

Key adapters:
- `apps/landing/lib/services/mockAdapter.ts`
- `apps/tutor/src/services/adapters/mockAdapter.ts`

## Structure

```
apps/landing   Next.js marketing + auth UI
apps/tutor     Vite React tutor SPA
```

Landing rewrites `/student/*` (and teacher/admin/dev) to the Vite tutor in development.

## Install

```bash
cd "C:\Users\anilg\Downloads\AIra AI-Tutor\AIra AI-Tutor FrontEnd"
npm install --prefix apps/landing
npm install --prefix apps/tutor --legacy-peer-deps
npm install
```

## Run (dev)

```bash
npm run dev
```

Uses `scripts/start-dev.mjs` to pick free ports (prefers **http://localhost:3010** + tutor **:5183**). The console prints the exact `OPEN →` URL.

Demo auth: any email/password. Choose **Student | Teacher** on both login and signup.

## Build

```bash
npm run build
```

## Product flows (UI)

1. Landing / marketing
2. Login + Signup (role: Student | Teacher)
3. Student: mode → curriculum / dashboard → `/student/learn/:topicId`
4. Teacher: dashboard + settings/profile
5. Shared layouts, components, styles, assets

Admin / competitive surfaces keep working UI shells with **mockAdapter demo data** (or clear “connect backend later” messaging where generation is local-only).

## Limitations (by design)

- Live AI uses demo tutor/counselor replies (mockAdapter) until `/api/chat` exists
- Remote Sarvam TTS disabled — browser SpeechSynthesis fallback
- Cached Firestore lesson pipeline returns miss — English curated local scripts still teach
- Waitlist / contact succeed locally (localStorage) until real APIs exist

See `EXTRACTION_REPORT.md` for the stub inventory and service map.

# Aɪra Platform — Functional Requirements Document (FRD)

| Field | Value |
|-------|--------|
| **Document title** | Aɪra Combined Functional Requirements Document |
| **Scope** | `aira-landing-page-elite` (marketing + auth + APIs) **and** `ai-tutor` (student / teacher / admin learning SPA) |
| **Product name** | Aɪra — Intelligent Learning Companion |
| **Document version** | 1.0 |
| **Status** | As-built (derived from current source code) |
| **Date** | 2026-08-09 |
| **Audience** | Product, engineering, QA, stakeholders |
| **Production hosts** | Landing: Vercel landing deployment · Tutor: `https://ai-ra-app.vercel.app` (same-origin via rewrites) |

---

## Table of contents

1. [Purpose and scope](#1-purpose-and-scope)
2. [System overview](#2-system-overview)
3. [Actors and personas](#3-actors-and-personas)
4. [Glossary](#4-glossary)
5. [End-to-end journeys](#5-end-to-end-journeys)
6. [Functional requirements — Platform & auth](#6-functional-requirements--platform--auth)
7. [Functional requirements — Landing (marketing)](#7-functional-requirements--landing-marketing)
8. [Functional requirements — APIs](#8-functional-requirements--apis)
9. [Functional requirements — Student (tutor)](#9-functional-requirements--student-tutor)
10. [Functional requirements — Teacher (tutor)](#10-functional-requirements--teacher-tutor)
11. [Functional requirements — Admin (tutor)](#11-functional-requirements--admin-tutor)
12. [Functional requirements — Shared tutor surfaces](#12-functional-requirements--shared-tutor-surfaces)
13. [Data requirements](#13-data-requirements)
14. [Integrations and environment](#14-integrations-and-environment)
15. [Non-functional requirements](#15-non-functional-requirements)
16. [Out of scope / declared but not implemented](#16-out-of-scope--declared-but-not-implemented)
17. [Requirements traceability matrix](#17-requirements-traceability-matrix)
18. [Acceptance criteria checklist](#18-acceptance-criteria-checklist)

---

## 1. Purpose and scope

### 1.1 Purpose

This FRD defines **every user-facing and system-facing functional capability** of the Aɪra platform as implemented across two tightly coupled applications:

| Application | Package | Responsibility |
|-------------|---------|----------------|
| **Landing** | `aira-landing-page-elite` | Marketing site, authentication UI, lead capture, AI counselor chat/TTS APIs, reverse-proxy into tutor SPA |
| **Tutor** | `ai-tutor` | Role-based learning product (student curriculum & competitive modes, teaching studio, teacher dashboard, admin weekly exams) |

### 1.2 In scope

- Public marketing pages, CTAs, waitlist, contact/demo
- Firebase authentication (email, social), password reset, role-based post-login routing
- Same-origin tutor proxy (`/student`, `/teacher`, `/admin`, `/dev`)
- Student mode selection, curriculum, competitive exams, AI teaching, dashboard, profile, settings
- Teacher dashboard (analytics UI)
- Admin dashboard and weekly exam scheduling
- Shared APIs: chat, TTS, waitlist, weekly exams bridge
- Demo personas (`/dev/demo-roles`)
- Data stores (Firestore, client Zustand, JSON/local fallbacks)

### 1.3 Out of scope for this document

- Detailed UI pixel specs / design system tokens (except where they affect function)
- Infrastructure runbooks beyond functional env dependencies
- Legal text content of Privacy/Terms (existence of pages is in scope)

### 1.4 Source of truth

Requirements below are **as-built**. Where UI suggests future capability (e.g. payments, HeyGen LiveAvatar, professional portal), it is called out in §16.

---

## 2. System overview

### 2.1 Architecture (logical)

```
┌─────────────────────────────────────────────────────────────────┐
│                     Browser (same origin)                         │
│  localhost:3000 (dev)  |  landing Vercel host (prod)              │
├──────────────────────────────┬──────────────────────────────────┤
│  Next.js Landing App         │  Vite React Tutor SPA (rewritten) │
│  /  /login /signup /pricing  │  /student/*  /teacher/* /admin/*  │
│  /contact /assistant …       │  /dev/demo-roles                  │
│  /api/chat /api/tts …        │  Firebase Auth session (shared)   │
└──────────────┬───────────────┴────────────────┬─────────────────┘
               │                                │
               ▼                                ▼
     Groq · Sarvam · Firestore          AI providers (client)
     Firebase Auth                      Firestore (role, weekly exams)
```

### 2.2 Runtime model

| Environment | Landing | Tutor | How they connect |
|-------------|---------|-------|------------------|
| **Local** | Next.js `:3000` | Vite `:5173` | Landing rewrites tutor paths + Vite assets to `TUTOR_DEV_URL`; Vite proxies `/api` → landing |
| **Production** | Landing Vercel | `ai-ra-app.vercel.app` | `vercel.json` rewrites `/student*`, `/teacher*`, `/admin*`, `/dev*`, `/tutor-media*`, `/tutor-assets*` to tutor host |

**Critical functional rule:** Users should enter the product through the **landing origin**. Tutor Vite-imported assets use `server.origin` pointing at the landing host in local unified mode.

### 2.3 Technology summary

| Layer | Landing | Tutor |
|-------|---------|-------|
| Framework | Next.js 16 App Router, React 19 | Vite 6, React 18, React Router 6 |
| Auth / DB | Firebase Auth + Firestore | Same Firebase project (`aira-landingpage`) |
| State | React context (`AuthProvider`) | Zustand stores (persisted where noted) |
| Styling | Tailwind 4, Radix | Tailwind 3, Framer Motion |
| AI | Groq (server `/api/chat`) | Multi-provider client `aiService` |
| TTS | Sarvam (`/api/tts`) | Same `/api/tts` via proxy |
| 3D / media | Local counselor video | Three.js / R3F, mascot video, diagram SVGs |

---

## 3. Actors and personas

| Actor ID | Actor | Description | Primary entry |
|----------|-------|-------------|---------------|
| **A-VIS** | Visitor | Unauthenticated visitor browsing marketing | `/` |
| **A-STU** | Student | Authenticated learner (default role) | `/student/mode-selection` |
| **A-TCH** | Teacher | Authenticated educator | `/teacher/dashboard` |
| **A-ADM** | Admin | Platform administrator (Firestore role only; not self-serve signup) | `/admin/dashboard` |
| **A-DEM** | Demo user | Local persona without Firebase (DEV or admin gate) | `/dev/demo-roles` |
| **A-SYS** | System | Schedulers, bridges, proxies, AI providers | N/A |

### 3.1 Role assignment rules

| Rule ID | Rule |
|---------|------|
| **R-ROLE-01** | Public signup may select `student` or `teacher` only. |
| **R-ROLE-02** | `admin` cannot be self-assigned on signup; must be set out-of-band in Firestore `users/{uid}.role`. |
| **R-ROLE-03** | OAuth / social signup must preserve an existing elevated role (`preserveExistingRole`). |
| **R-ROLE-04** | Default role on ambiguity / new user = `student`. |
| **R-ROLE-05** | Tutor enforces path prefix vs role via `RoleGuard` (`/student` ↔ student, etc.). |

---

## 4. Glossary

| Term | Meaning |
|------|---------|
| **Landing** | Next.js marketing + auth shell |
| **Tutor SPA** | Vite React learning application |
| **Mode selection** | Student choice between Curriculum and Competitive |
| **Curriculum Mode** | School board / grade-aligned learning |
| **Competitive Mode** | Entrance / scholarship exam prep (JEE, NEET, etc.) |
| **Teaching / Learn** | AI-driven lesson board with chat + studio tools |
| **Studio** | In-lesson tools: Notes, Mind Map, Flashcards, Quiz, Summary |
| **Weekly exams** | Admin-scheduled Sat/Sun mock or PYQ windows (IST) |
| **Bridge secret** | Shared secret for weekly-exam admin API when used as offline bridge |
| **Student home hint** | `localStorage` key remembering last student destination |
| **Role hint** | `localStorage` `aira:role` for fast redirect before Firestore resolves |

---

## 5. End-to-end journeys

### 5.1 E2E-01 — Visitor discovers product and starts free trial

```
Visit `/`
  → Review Hero / Features / Courses / How it works
  → CTA “Start Free Trial” → `/signup`
  → Create account (name, email, role student|teacher, DOB, password)
     OR social login
  → Firestore `users/{uid}` written
  → Full-page navigate to role home:
        student → `/student/mode-selection`
        teacher → `/teacher/dashboard`
```

**Success:** Authenticated user lands inside tutor SPA under correct role prefix with Firebase session active.

### 5.2 E2E-02 — Returning user login with deep link

```
Unauthenticated hit on `/student/curriculum`
  → Tutor `ProtectedRoute` → landing `/login?redirect=/student/curriculum`
  → User authenticates
  → `goAfterAuth` sanitizes redirect (same-origin tutor paths only)
  → User arrives at `/student/curriculum`
```

**Success:** Post-login destination respects safe `redirect` param; unsafe redirects fall back to role home.

### 5.3 E2E-03 — Student curriculum learning path

```
`/student/mode-selection` → Enter Curriculum
  → `/student/curriculum` (grades)
  → Select grade → subjects → chapters/topics
  → Open topic → `/student/learn/:topicId`
  → AI masterclass steps + diagrams + TTS
  → Optional: raise doubt → verification quiz
  → Studio: generate notes / mind map / flashcards / quiz / summary
  → Export PDF/DOCX/PNG
  → Progress recorded (curriculum + analytics stores)
  → Optional return via Dashboard `/student/dashboard`
```

### 5.4 E2E-04 — Student competitive exam path

```
`/student/mode-selection` → Enter Competitive
  → `/student/competitive?section=exams` (default Available Exams)
  → Choose exam → subject → paper
  → Live exam (timer, palette, mark-for-review, bookmarks)
  → Result + analytics updated in `competitiveStore`
  → Optional: Weekly Tests (published Sat/Sun window)
  → Optional: Topic Quizzes / PYQs / Mock / Questionary → `/student/competitive-explain`
```

### 5.5 E2E-05 — Book a demo / contact

```
`/` or `/contact` → Contact form
  → Write Firestore `contact_messages`
  → Confirmation to user
```

### 5.6 E2E-06 — Professional course waitlist

```
`/` Courses → Professional track (unavailable)
  → Notify Me / Coming Soon modal
  → `POST /api/waitlist` → Firestore `waitlist`
```

### 5.7 E2E-07 — AI counselor assist

```
Home floating assistant OR `/assistant`
  → User chats → `POST /api/chat` (SSE stream)
  → Optional speak → `POST /api/tts` (Sarvam WAV)
```

### 5.8 E2E-08 — Teacher monitors class (current as-built)

```
Login as teacher → `/teacher/dashboard`
  → View mock class performance / student list
  → Open settings/profile
```

### 5.9 E2E-09 — Admin publishes weekly exam

```
Login as admin → `/admin/weekly-exams`
  → Create/edit session (Saturday/Sunday, mock|pyq, times IST)
  → Publish
  → Student sees session in Competitive → Weekly Tests when window active
  → Fallback chain: Firestore ↔ `/api/weekly-exams` ↔ JSON ↔ localStorage
```

### 5.10 E2E-10 — Sign-out across apps

```
Tutor logout OR landing profile menu
  → Firebase `signOut`
  → Clear role hint
  → Landing `/login?signedOut=1` (forces clean session when coming from tutor)
```

### 5.11 E2E-11 — Demo personas (QA / sales)

```
DEV build OR admin → `/dev/demo-roles`
  → Enter Student / Teacher / Admin demo
  → Local `isDemo` session (no Firebase) into role home
```

---

## 6. Functional requirements — Platform & auth

### 6.1 Unified authentication

| ID | Requirement | Priority | Owner |
|----|-------------|----------|-------|
| **FR-AUTH-001** | System shall authenticate users via Firebase Auth with IndexedDB persistence. | Must | Landing + Tutor |
| **FR-AUTH-002** | System shall support email/password sign-up and sign-in. | Must | Landing |
| **FR-AUTH-003** | System shall support Google OAuth when enabled via `NEXT_PUBLIC_AUTH_GOOGLE`. | Must | Landing |
| **FR-AUTH-004** | System shall support Apple and Microsoft OAuth when corresponding public flags are enabled. | Should | Landing |
| **FR-AUTH-005** | System shall provide password reset via `/forgot-password` using Firebase reset email. | Must | Landing |
| **FR-AUTH-006** | Tutor shall not host primary login UI; unauthenticated access shall redirect to landing login with `redirect` query. | Must | Tutor |
| **FR-AUTH-007** | Legacy tutor path `/login` shall redirect to landing login. | Must | Tutor |
| **FR-AUTH-008** | After successful auth, system shall resolve role from Firestore `users/{uid}.role` (with `aira:role` hint). | Must | Both |
| **FR-AUTH-009** | After auth, system shall navigate with full-page assign to role home (not soft SPA-only on landing). | Must | Landing |
| **FR-AUTH-010** | Role homes shall be: student → `/student/mode-selection` (or remembered student home); teacher → `/teacher/dashboard`; admin → `/admin/dashboard`. | Must | Landing |
| **FR-AUTH-011** | Allowed student home hints: `/student/curriculum`, `/student/competitive`, `/student/dashboard`. | Must | Both |
| **FR-AUTH-012** | Login `redirect` param shall accept only sanitized same-origin tutor paths. | Must | Landing |
| **FR-AUTH-013** | Login `intent=school` shall adjust copy; post-auth still uses role home. | Should | Landing |
| **FR-AUTH-014** | Login `intent=professional` shall route toward professional portal / coming-soon behavior per current nav policy. | Should | Landing |
| **FR-AUTH-015** | `signedOut=1` shall force logout to sync cross-origin/session cleanup from tutor. | Must | Landing |
| **FR-AUTH-016** | Signup shall collect: full name, email, role (student\|teacher), date of birth, password (+ confirm) with strength UI. | Must | Landing |
| **FR-AUTH-017** | Signup shall write profile document `users/{uid}` with uid, name, email, DOB, provider, role, timestamps. | Must | Landing |
| **FR-AUTH-018** | Already-authenticated visits to `/login` or `/signup` shall auto-continue to role home. | Must | Landing |
| **FR-AUTH-019** | Tutor shall bridge Firebase `onAuthStateChanged` into `authStore` before rendering protected content (`FirebaseAuthBridge` + `HydrationGuard`). | Must | Tutor |
| **FR-AUTH-020** | Demo login shall create local persona with `isDemo: true` without Firebase credentials. | Must | Tutor |
| **FR-AUTH-021** | `/dev/demo-roles` shall be available when `import.meta.env.DEV` **or** authenticated admin. | Must | Tutor |
| **FR-AUTH-022** | Auth domain guard / middleware shall prefer `localhost` over `127.0.0.1` for Firebase authorized domains. | Must | Landing |
| **FR-AUTH-023** | Logout shall clear Firebase session and role hint and return user to landing login. | Must | Both |

### 6.2 Authorization / route guards

| ID | Requirement | Priority | Owner |
|----|-------------|----------|-------|
| **FR-AZN-001** | Landing marketing and auth pages shall be publicly accessible (no Next middleware auth gate). | Must | Landing |
| **FR-AZN-002** | Tutor routes under `/student/*` shall require authenticated student role. | Must | Tutor |
| **FR-AZN-003** | Tutor routes under `/teacher/*` shall require authenticated teacher role. | Must | Tutor |
| **FR-AZN-004** | Tutor routes under `/admin/*` shall require authenticated admin role. | Must | Tutor |
| **FR-AZN-005** | RoleGuard shall allow demo auto-switch of persona when navigating across role prefixes in demo mode. | Should | Tutor |
| **FR-AZN-006** | Unknown tutor paths shall soft-redirect via `RootRedirect` to login or role home. | Must | Tutor |

### 6.3 Same-origin tutor proxy

| ID | Requirement | Priority | Owner |
|----|-------------|----------|-------|
| **FR-PRX-001** | Landing shall rewrite `/student`, `/teacher`, `/admin`, `/dev` (and children) to tutor host. | Must | Landing |
| **FR-PRX-002** | Landing shall rewrite `/tutor-media/*`, `/tutor-assets/*`, `/theme-boot.js` to tutor static assets. | Must | Landing |
| **FR-PRX-003** | Landing shall **not** rewrite `/api/*` (landing owns APIs). | Must | Landing |
| **FR-PRX-004** | In development, landing shall also rewrite Vite HMR/module paths (`/@vite`, `/@fs`, `/src`, …) to `TUTOR_DEV_URL`. | Must | Landing |
| **FR-PRX-005** | Tutor Vite shall proxy `/api` to landing (`127.0.0.1:3000` by default). | Must | Tutor |
| **FR-PRX-006** | COOP header `same-origin-allow-popups` shall be set to support OAuth popups. | Must | Landing |

---

## 7. Functional requirements — Landing (marketing)

### 7.1 Site pages

| ID | Path | Requirement | Priority |
|----|------|-------------|----------|
| **FR-LND-001** | `/` | Home shall compose Header, Hero, Features, Courses, How it works, CTA, Footer, Floating Assistant. | Must |
| **FR-LND-002** | `/` | Hero shall present brand **Aɪra**, primary CTA Start Free Trial → `/signup`, secondary Book a Demo → `/contact`. | Must |
| **FR-LND-003** | `/` | Features shall communicate AI Teaching, Smart Curriculum, Competitive Mode, Live Q&A (with demo media where provided). | Must |
| **FR-LND-004** | `/` | Courses shall show School catalog (filterable) and Professional catalog. | Must |
| **FR-LND-005** | `/` | How it works shall present steps: Sign Up → Personalize → Learn & Practice → Succeed. | Must |
| **FR-LND-006** | `/` | CTA section shall offer Start Free Trial and View Pricing (modal). | Must |
| **FR-LND-007** | `/login` | Provide email + social login UI with query handling (`intent`, `redirect`, `signedOut`). | Must |
| **FR-LND-008** | `/signup` | Provide registration UI per FR-AUTH-016. | Must |
| **FR-LND-009** | `/forgot-password` | Provide password reset request UI. | Must |
| **FR-LND-010** | `/assistant` | Provide full-screen AI counselor experience. | Must |
| **FR-LND-011** | `/pricing` | Display plans Simple / Pro / Enterprise (informational). | Must |
| **FR-LND-012** | `/contact` | Provide Book a Demo / contact form persisted to Firestore. | Must |
| **FR-LND-013** | `/about` | Static about content. | Should |
| **FR-LND-014** | `/blog` | Blog placeholder (“Coming soon”). | Could |
| **FR-LND-015** | `/careers` | Careers placeholder. | Could |
| **FR-LND-016** | `/privacy` | Privacy policy page. | Must |
| **FR-LND-017** | `/terms` | Terms of use page. | Must |
| **FR-LND-018** | `/cookies` | Cookie policy page. | Should |

### 7.2 Header / navigation CTAs

| ID | Requirement | Priority |
|----|-------------|----------|
| **FR-LND-020** | Header shall link Features, Courses, How it works (anchors), Pricing, For Schools, For Professionals, Log in, Start Free Trial. | Must |
| **FR-LND-021** | For Schools shall deep-link login with `intent=school` or role home if already logged in. | Must |
| **FR-LND-022** | For Professionals shall present Coming Soon / waitlist (not live product portal from primary nav). | Must |
| **FR-LND-023** | Authenticated header shall expose user profile menu with logout. | Must |

### 7.3 Courses & waitlist

| ID | Requirement | Priority |
|----|-------------|----------|
| **FR-LND-030** | School courses shall be filterable by grade/board/subject metadata from `learning-courses` catalog. | Must |
| **FR-LND-031** | Exploring an available school course while logged out shall send user to school login entry. | Must |
| **FR-LND-032** | Exploring while logged in shall navigate into tutor role home / learning. | Must |
| **FR-LND-033** | Professional courses marked unavailable shall offer Notify Me waitlist capture. | Must |
| **FR-LND-034** | Waitlist submissions shall require email, courseId, courseName and persist via `/api/waitlist`. | Must |

### 7.4 Pricing (UI only)

| ID | Requirement | Priority |
|----|-------------|----------|
| **FR-LND-040** | Pricing page/modal shall show plan tiers and monthly/annual toggle (display). | Must |
| **FR-LND-041** | Free/Pro CTAs shall route to signup; Enterprise shall route to contact. | Must |
| **FR-LND-042** | System shall **not** process payments/checkout in current build. | Must (constraint) |

### 7.5 Contact / demo

| ID | Requirement | Priority |
|----|-------------|----------|
| **FR-LND-050** | Contact form shall capture name, email, optional organization, message. | Must |
| **FR-LND-051** | Contact messages shall be written to Firestore `contact_messages`. | Must |
| **FR-LND-052** | Contact modal may be opened from footer without leaving page. | Should |

### 7.6 Floating AI assistant

| ID | Requirement | Priority |
|----|-------------|----------|
| **FR-LND-060** | Home shall show floating assistant entry that opens counselor chat modal. | Must |
| **FR-LND-061** | Assistant shall stream replies from `/api/chat` with Aɪra counselor persona. | Must |
| **FR-LND-062** | Assistant shall support microphone input and TTS playback via `/api/tts` / Web Speech fallback. | Should |
| **FR-LND-063** | Assistant shall support selectable TTS languages and persist language preference. | Should |
| **FR-LND-064** | Avatar presentation shall use local counselor video asset (not live HeyGen session). | Must (as-built) |

---

## 8. Functional requirements — APIs

| ID | Method & path | Requirement | Auth | Priority |
|----|---------------|-------------|------|----------|
| **FR-API-001** | `POST /api/chat` | Accept `{ messages[], language? }`; stream SSE counselor reply via Groq with model fallback. | Public | Must |
| **FR-API-002** | `POST /api/chat` | Reject invalid payloads with 400; missing key / upstream failure with 500. | — | Must |
| **FR-API-003** | `POST /api/tts` | Accept `{ text, language?, speaker?, pace? }`; return `audio/wav` or JSON base64 per Accept header. | Public | Must |
| **FR-API-004** | `GET /api/tts/health` | Report whether Sarvam is configured and available models. | Public | Should |
| **FR-API-005** | `POST /api/waitlist` | Persist waitlist entry; return `{ ok, id }` or error. | Public | Must |
| **FR-API-006** | `GET /api/weekly-exams` | Return published weekly sessions by default. | Public | Must |
| **FR-API-007** | `GET /api/weekly-exams?all=1` | Return all statuses when bridge secret provided. | Secret | Must |
| **FR-API-008** | `POST /api/weekly-exams` | Upsert weekly session when bridge secret valid (admin/offline bridge). | Secret | Must |
| **FR-API-009** | Tutor may also expose serverless `/api/tts`, `/api/waitlist` for direct tutor deploys; unified prod prefers landing APIs via same-origin. | — | Should |

---

## 9. Functional requirements — Student (tutor)

### 9.1 Route map (student)

| Path | Page | FR refs |
|------|------|---------|
| `/student/mode-selection` | Mode selection | FR-STU-1xx |
| `/student/curriculum` | Curriculum browser | FR-STU-2xx |
| `/student/competitive` | Competitive hub | FR-STU-3xx |
| `/student/competitive-explain` | Competitive AI explanation | FR-STU-360 |
| `/student/learn/:topicId?` | Teaching studio | FR-STU-4xx |
| `/student/dashboard` | Student dashboard | FR-STU-5xx |
| `/student/onboarding` | Profession onboarding | FR-STU-6xx |
| `/student/profile` | Profile | FR-STU-7xx |
| `/student/settings` | Settings | FR-SHR-xxx |

### 9.2 Mode selection

| ID | Requirement | Priority |
|----|-------------|----------|
| **FR-STU-100** | Page shall present Curriculum Mode and Competitive Mode as primary choices. | Must |
| **FR-STU-101** | Entering Curriculum shall navigate to `/student/curriculum` and persist student home hint. | Must |
| **FR-STU-102** | Entering Competitive shall navigate to `/student/competitive` and persist student home hint. | Must |
| **FR-STU-103** | Page shall show branded navbar, hero banner, mode cards, and footer with official Aɪra/EdTech mark. | Must |
| **FR-STU-104** | Section title for mode cards shall read **Available Modes**. | Must |
| **FR-STU-105** | Hero shall use configured banner asset showing student portrait (head-to-chest framing as designed). | Must |

### 9.3 Curriculum mode

| ID | Requirement | Priority |
|----|-------------|----------|
| **FR-STU-200** | Curriculum shall support grades: 6–10 and 11–12 Science tracks. | Must |
| **FR-STU-201** | Grades 6–10 subjects shall include English, Hindi, Mathematics, Science, Social Science, Computer Science/IT (per data). | Must |
| **FR-STU-202** | Grades 11–12 Science subjects shall include Physics, Chemistry, Mathematics, Biology, English, Computer Science (per data). | Must |
| **FR-STU-203** | Navigation shall be URL-driven: `/student/curriculum?grade=&subject=`. | Must |
| **FR-STU-204** | UI shall progress Grades → Subjects → Chapters/Topics with search (`CurriculumSearch`). | Must |
| **FR-STU-205** | Selecting a topic shall open `/student/learn/:topicId`. | Must |
| **FR-STU-206** | System shall track topic completion in `curriculumStore.progressMap`. | Must |

### 9.4 Competitive mode

| ID | Requirement | Priority |
|----|-------------|----------|
| **FR-STU-300** | Competitive hub shall expose sidebar sections: exams, weekly, quizzes, questionary, pyqs, mock, performance (via `?section=`). | Must |
| **FR-STU-301** | System shall catalog exams including at least: JEE Main, NEET, EAMCET, JEE Advanced, POLYCET, NTSE, RJC-CET, GATE, Sainik, Navodaya, KV, EMRS, NMMS, Olympiad, RGUKT-IIIT. | Must |
| **FR-STU-302** | Exam flow shall follow steps: exam → subject → paper → solving → result. | Must |
| **FR-STU-303** | Live exam panel shall provide timer, question palette, mark-for-review, option elimination, bookmarks, per-question notes, fullscreen. | Must |
| **FR-STU-304** | System shall support draft resume via sessionStorage with TTL (~6 hours). | Should |
| **FR-STU-305** | Mock and PYQ modes shall be available; questions may be AI-generated or banked. | Must |
| **FR-STU-306** | Weekly Tests shall list published sessions and allow attempt only inside scheduled window (IST Sat/Sun). | Must |
| **FR-STU-307** | Topic Quizzes shall support chapter-level drilling with draft persistence. | Must |
| **FR-STU-308** | Questionary / AI Explanation shall open competitive teaching explain flow (`/student/competitive-explain`) using session payload. | Must |
| **FR-STU-309** | Performance analytics shall show accuracy, readiness, weak/strong subjects, trends, rank prediction signals from `competitiveStore`. | Must |
| **FR-STU-310** | Deep-link query params (`step`, `exam`, `subject`, `paper`, `topic`, `chapter`, `challenge`, `weeklySession`, `q`) shall restore competitive context. | Should |

### 9.5 Teaching / Learn

| ID | Requirement | Priority |
|----|-------------|----------|
| **FR-STU-400** | Teaching page shall provide three panels: Chat, Teaching board, Studio. | Must |
| **FR-STU-401** | System shall generate AI masterclass steps for the topic via content generator + AI service. | Must |
| **FR-STU-402** | Teaching board shall render diagram-first visuals from visual registry / SVG assets when available. | Must |
| **FR-STU-403** | System shall narrate steps via TTS (`/api/tts` / speech hooks) respecting settings. | Should |
| **FR-STU-404** | Student shall raise doubts by voice or text; system stores doubts and may present verification quiz. | Must |
| **FR-STU-405** | Chat shall accept file uploads PDF/DOCX/TXT/images and extract text for context. | Must |
| **FR-STU-406** | Studio shall generate Notes, Mind Map, Flashcards, Quiz, Summary. | Must |
| **FR-STU-407** | Studio artifacts shall be viewable in dedicated viewers. | Must |
| **FR-STU-408** | Student shall export notes/flashcards/summary to PDF/DOCX and capture PNG where supported. | Must |
| **FR-STU-409** | Session progress shall update analytics (sessions, streaks, achievements metrics). | Should |
| **FR-STU-410** | Teaching state (step index, pause, last step per topic) shall persist per `teachingStore`. | Should |

### 9.6 Dashboard

| ID | Requirement | Priority |
|----|-------------|----------|
| **FR-STU-500** | Dashboard shall show hero/mascot area, strength card, next mission, learning journey chart. | Must |
| **FR-STU-501** | Dashboard shall show exam mission / analytics cards and recent missions strip. | Should |
| **FR-STU-502** | Topic Discovery shall offer For You recommendations, subject filters, and search. | Must |
| **FR-STU-503** | Quick access shall navigate to key student destinations. | Should |

### 9.7 Onboarding

| ID | Requirement | Priority |
|----|-------------|----------|
| **FR-STU-600** | Onboarding shall run four steps: Profession → Specialization → Subject → Topic. | Must |
| **FR-STU-601** | Completing onboarding shall route to `/student/learn/:topicId`. | Must |
| **FR-STU-602** | Onboarding selections shall persist in `userStore`. | Must |

### 9.8 Profile

| ID | Requirement | Priority |
|----|-------------|----------|
| **FR-STU-700** | Student may edit display name (synced with Firebase profile where applicable). | Must |
| **FR-STU-701** | Profile shall show stats/achievements and learning-style quiz. | Should |

---

## 10. Functional requirements — Teacher (tutor)

| ID | Requirement | Priority |
|----|-------------|----------|
| **FR-TCH-001** | Teacher home shall be `/teacher/dashboard`. | Must |
| **FR-TCH-002** | Dashboard shall present class performance overview and student list/detail (current: mock analytics data). | Must |
| **FR-TCH-003** | Teacher may filter by grade/subject using curriculum metadata. | Should |
| **FR-TCH-004** | Teacher shall access `/teacher/settings` and `/teacher/profile`. | Must |
| **FR-TCH-005** | Teacher logout shall sign out Firebase and return to landing login. | Must |
| **FR-TCH-006** | In DEV, teacher UI may link to `/dev/demo-roles` for persona switching. | Should |

> **As-built note:** Teacher content authoring / live classroom control routes are not present; analytics are mock-driven.

---

## 11. Functional requirements — Admin (tutor)

| ID | Requirement | Priority |
|----|-------------|----------|
| **FR-ADM-001** | Admin home shall be `/admin/dashboard` showing governance overview (teachers, issues, student drill-down — mock data as-built). | Must |
| **FR-ADM-002** | Admin shall manage weekly exams at `/admin/weekly-exams`. | Must |
| **FR-ADM-003** | Weekly exam CRUD shall support create, edit, duplicate week, seed defaults, draft / publish / unpublish / archive. | Must |
| **FR-ADM-004** | Sessions shall support day `saturday` \| `sunday`, mode `mock` \| `pyq`, start/end timestamps, title, examId, optional subjectId. | Must |
| **FR-ADM-005** | Scheduling windows shall be interpreted in IST for student eligibility. | Must |
| **FR-ADM-006** | Persistence shall prefer Firestore `weeklyExamSchedules`, with API/JSON/localStorage fallbacks. | Must |
| **FR-ADM-007** | Admin shall access settings and profile under `/admin/*`. | Must |
| **FR-ADM-008** | Authenticated admins may open `/dev/demo-roles` in production builds. | Should |

---

## 12. Functional requirements — Shared tutor surfaces

### 12.1 Settings (student / teacher / admin)

| ID | Requirement | Priority |
|----|-------------|----------|
| **FR-SHR-001** | Settings shall provide tabs: account, learning, accessibility, ai, privacy. | Must |
| **FR-SHR-002** | User may set theme light/dark/system. | Must |
| **FR-SHR-003** | Accessibility: font size, high contrast, reduce animations. | Must |
| **FR-SHR-004** | TTS: enable/disable, speed, language (en-IN + Indic), Sarvam speaker selection. | Must |
| **FR-SHR-005** | AI personality templates shall be selectable. | Should |
| **FR-SHR-006** | Privacy-related toggles shall be available per settings store. | Should |
| **FR-SHR-007** | Settings persistence shall use Zustand persist (`settingsStore`). | Must |

### 12.2 Common UX / system chrome

| ID | Requirement | Priority |
|----|-------------|----------|
| **FR-SHR-010** | App shall provide skip-to-main for keyboard users. | Should |
| **FR-SHR-011** | App shall show toasts for user feedback. | Must |
| **FR-SHR-012** | App shall lazy-load major pages with Suspense loaders. | Should |
| **FR-SHR-013** | Error boundaries shall prevent full white-screen failures where wrapped. | Should |
| **FR-SHR-014** | Brand logo components shall render official mark consistently. | Must |

### 12.3 i18n

| ID | Requirement | Priority |
|----|-------------|----------|
| **FR-SHR-020** | UI string catalog shall exist via i18next (English bundle as-built). | Should |
| **FR-SHR-021** | `document.documentElement.lang` shall sync from settings language. | Should |

---

## 13. Data requirements

### 13.1 Firestore collections

| Collection | Key fields | Written by | Read by |
|------------|------------|------------|---------|
| `users/{uid}` | uid, name, email, dateOfBirth?, provider, role?, createdAt?, updatedAt | Landing signup/profile | Landing + Tutor auth |
| `waitlist/{id}` | email, courseId, courseName, createdAt | `/api/waitlist` | Ops / future CRM |
| `contact_messages/{id}` | name, email, organization?, message, createdAt | Contact forms | Ops |
| `leads/{id}` | type schools\|professionals, name, email, organization, createdAt | Rules allow; writer optional | Ops |
| `weeklyExamSchedules` | WeeklyExamSession fields | Admin / bridge | Students + Admin |

### 13.2 Weekly exam session shape

```
id, weekKey, day: 'saturday'|'sunday', title, examId, subjectId?,
mode: 'mock'|'pyq', startsAt, endsAt,
status: 'draft'|'published'|'archived', createdBy, updatedAt
```

### 13.3 Client persistence (tutor Zustand)

| Store | Persist | Data |
|-------|---------|------|
| `authStore` | Partial | User, role, demo flags |
| `settingsStore` | Yes | Theme, TTS, a11y, AI, privacy |
| `userStore` | Yes | Profile, onboarding, learning style, memories |
| `curriculumStore` | Yes | Selection + completion map |
| `teachingStore` | Yes | Session/step state |
| `analyticsStore` | Yes | Sessions, achievements, streaks |
| `competitiveStore` | Yes | Attempts + insights |
| `resourceStore` | No | Generated studio artifacts |
| `doubtStore` | No | Active doubts / quizzes |
| `documentStore` | No | Upload parse state |
| `toastStore` | No | Ephemeral toasts |

### 13.4 Browser storage keys (selected)

| Key | Purpose |
|-----|---------|
| `aira:role` | Role hint |
| `aira:student-home` | Last student destination |
| `aira-tts-language` | Assistant TTS language |
| `aira-greeting-shown` | Floating orb greeting (session) |
| `aira-competitive-explain` | Explain flow payload |
| `aira-exam-draft:*` | In-progress exam drafts |

---

## 14. Integrations and environment

### 14.1 External services

| Service | Used for | App |
|---------|----------|-----|
| Firebase Auth | Identity | Both |
| Cloud Firestore | Profiles, leads, weekly exams | Both |
| Firebase Analytics | Product analytics (prod) | Both |
| Groq | Landing counselor chat | Landing API |
| Sarvam AI | TTS | Landing API (+ tutor consumer) |
| Groq / OpenRouter / DeepSeek / Sarvam / Mistral | Tutor lesson/exam AI | Tutor client |
| Vercel | Hosting | Both |
| Vercel Analytics | Landing metrics | Landing |

### 14.2 Environment variables (names only)

**Landing:** `NEXT_PUBLIC_FIREBASE_*`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_AUTH_GOOGLE|APPLE|MICROSOFT`, `GROQ_API_KEY`, `SARVAM_API_KEY`, `HEYGEN_API_KEY` (unused), `TUTOR_DEV_URL`, `WEEKLY_EXAM_BRIDGE_SECRET`, `NEXT_PUBLIC_WEEKLY_EXAM_BRIDGE_SECRET`, `FIREBASE_SERVICE_ACCOUNT_JSON`, emulator flags.

**Tutor:** `VITE_FIREBASE_*`, `VITE_LANDING_ORIGIN`, `VITE_*_API_KEY` (AI providers), `VITE_API_PROXY_TARGET`, `VITE_DEV_ORIGIN`, `VITE_HMR_CLIENT_PORT`.

---

## 15. Non-functional requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| **NFR-001** | Protected tutor UI must not render private content before auth hydration completes. | Must |
| **NFR-002** | Production tutor build shall code-split major vendors (react, three, ui, pdf). | Should |
| **NFR-003** | Local unified testing shall use landing `:3000` so Vite asset `origin` resolves. | Must |
| **NFR-004** | TTS and chat API routes shall enforce reasonable timeouts (`maxDuration` where configured). | Should |
| **NFR-005** | Accessibility settings must apply via document data attributes consumed by CSS/motion. | Must |
| **NFR-006** | Sensitive keys must remain server-side for landing chat/TTS; tutor AI keys are client-exposed Vite vars (risk accepted as-built — prefer server proxy in future). | Should (future harden) |
| **NFR-007** | Apps shall remain responsive on desktop and mobile viewports for primary student flows. | Must |

---

## 16. Out of scope / declared but not implemented

| Item | Evidence | FRD treatment |
|------|----------|---------------|
| Payment / checkout / subscriptions billing | Pricing UI only; no Stripe/Razorpay | Not required |
| HeyGen LiveAvatar realtime avatar | SDK/env present; unused; local video used | Not required |
| Professional learning portal from nav | Coming soon / waitlist | Future |
| Live teacher content authoring | No routes | Future |
| Live admin analytics (non-mock) | mockAnalytics | Future |
| Multi-language UI beyond English bundle | i18n scaffold | Future |
| Blog / careers full CMS | Placeholders | Future |

---

## 17. Requirements traceability matrix

| Capability | Landing FR | Tutor FR | E2E |
|------------|------------|----------|-----|
| Marketing conversion | FR-LND-001…006 | — | E2E-01 |
| Signup / login | FR-AUTH-* | FR-AUTH-006/019 | E2E-01, 02, 10 |
| Role routing | FR-AUTH-010 | FR-AZN-002…004 | E2E-01 |
| Waitlist | FR-LND-033, FR-API-005 | — | E2E-06 |
| Contact/demo | FR-LND-050…052 | — | E2E-05 |
| AI counselor | FR-LND-060…064, FR-API-001…004 | — | E2E-07 |
| Mode selection | — | FR-STU-100…105 | E2E-03, 04 |
| Curriculum + teach | — | FR-STU-200…410 | E2E-03 |
| Competitive + weekly | FR-API-006…008 | FR-STU-300…310, FR-ADM-002…006 | E2E-04, 09 |
| Teacher dashboard | — | FR-TCH-* | E2E-08 |
| Admin governance | — | FR-ADM-* | E2E-09 |
| Demo personas | — | FR-AUTH-020/021 | E2E-11 |
| Settings / a11y | — | FR-SHR-* | — |
| Proxy unity | FR-PRX-* | FR-PRX-005 | All tutor E2Es |

---

## 18. Acceptance criteria checklist

### Platform

- [ ] Visitor can complete signup as student and land on `/student/mode-selection`.
- [ ] Visitor can complete signup as teacher and land on `/teacher/dashboard`.
- [ ] Unauthenticated deep link to a student page redirects to landing login and returns after auth.
- [ ] Logout from tutor returns to landing login with clean session.
- [ ] `/student`, `/teacher`, `/admin` load via landing origin in prod/dev unified mode.
- [ ] Logos and tutor-media load correctly via landing origin (not broken image).

### Landing

- [ ] Home CTAs route to signup and contact as specified.
- [ ] Waitlist API stores email + course metadata.
- [ ] Contact form stores message in Firestore.
- [ ] `/api/chat` streams a reply; `/api/tts` returns audio when configured.
- [ ] Pricing CTAs do not require payment gateway.

### Student

- [ ] Mode selection offers Curriculum and Competitive with working navigation.
- [ ] Curriculum grade→subject→topic→learn path works for at least one grade band.
- [ ] Teaching page generates steps, supports doubt, studio tools, and export.
- [ ] Competitive exam attempt completes to result and updates analytics store.
- [ ] Weekly test appears only when published and within window.
- [ ] Dashboard and settings load without guard errors.

### Teacher / Admin

- [ ] Teacher dashboard loads for teacher role only.
- [ ] Admin can publish a weekly exam visible to students in-window.
- [ ] Non-admin cannot access `/admin/*`.

### Demo

- [ ] `/dev/demo-roles` works in DEV; admin can access in prod.

---

## Appendix A — Complete route inventory

### Landing (Next.js)

`/`, `/login`, `/signup`, `/forgot-password`, `/assistant`, `/pricing`, `/contact`, `/about`, `/blog`, `/careers`, `/privacy`, `/terms`, `/cookies`

### Tutor (rewritten on landing origin)

**Student:** `/student`, `/student/mode-selection`, `/student/curriculum`, `/student/competitive`, `/student/competitive-explain`, `/student/learn/:topicId?`, `/student/dashboard`, `/student/onboarding`, `/student/settings`, `/student/profile`

**Teacher:** `/teacher`, `/teacher/dashboard`, `/teacher/settings`, `/teacher/profile`

**Admin:** `/admin`, `/admin/dashboard`, `/admin/weekly-exams`, `/admin/settings`, `/admin/profile`

**Dev:** `/dev/demo-roles`

**APIs:** `POST /api/chat`, `POST /api/tts`, `GET /api/tts/health`, `POST /api/waitlist`, `GET|POST /api/weekly-exams`

---

## Appendix B — Repository map

| Repo path | Package |
|-----------|---------|
| `AIra/frontend-landing` | `aira-landing-page-elite` |
| `…/OneDrive/Desktop/AIra Project/Project` | `ai-tutor` |

---

## Appendix C — Document maintenance

When adding a feature:

1. Assign a new `FR-*` ID in the correct section.
2. Update the matching E2E journey if user-visible.
3. Update Appendix A routes if a path is added.
4. Update §16 if a previously “future” item ships.
5. Bump document version and date in the header table.

---

*End of Functional Requirements Document — Aɪra Platform v1.0*

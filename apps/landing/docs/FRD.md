# Functional Requirements Document (FRD)

## 1. Document Control

| Field | Value |
|-------|--------|
| **Title** | Aɪra Platform — Functional Requirements Document |
| **Document ID** | AIRA-FRD-001 |
| **Version** | 1.0 |
| **Status** | Draft — as-built from source |
| **Date** | 2026-08-09 |
| **Owner** | _[PLACEHOLDER — Product Owner]_ |
| **Author** | Generated from codebase audit |
| **Reviewers** | _[PLACEHOLDER]_ |
| **Approver** | _[PLACEHOLDER]_ |
| **Classification** | Internal |

### 1.1 Repositories covered

| Application | Package name | Path audited | Evidence |
|-------------|--------------|--------------|----------|
| Landing (marketing + auth + APIs) | `aira-landing-page-elite` | `AIra/frontend-landing` | `package.json` |
| Tutor (role-based learning SPA) | `ai-tutor` `1.0.0` | `…/OneDrive/Desktop/AIra Project/Project` | `package.json` |

This FRD treats the two packages as **one product** delivered on a shared origin via path rewrites. Statements cite which app owns the behavior.

### 1.2 Evidence standard

- Every functional requirement is intended to be verifiable in code, config, or comments.
- Items that could not be fully verified are marked **`[ASSUMPTION]`** or **`[NEEDS CONFIRMATION]`**.
- No secret values are included — environment variable **names only**.

---

## 2. Purpose & Scope

### 2.1 Purpose

Define testable functional behavior of the Aɪra product as implemented: marketing site, authentication, API services, and the student/teacher/admin learning application.

### 2.2 In scope

- Landing App Router pages and client auth flows
- Landing API routes under `/api/*`
- Tutor React Router routes, guards, and role homes
- Firestore collections written or read by either app
- Client persistence (Zustand, localStorage, sessionStorage)
- Third-party integrations referenced in code
- Same-origin tutor reverse-proxy configuration

### 2.3 Out of scope

- Visual design specifications beyond functional UI presence
- Operational runbooks and incident response
- Legal accuracy of Privacy/Terms copy (page existence is in scope)
- Uncommitted local-only experiments not present in the audited trees

---

## 3. Definitions & Abbreviations

| Term | Definition |
|------|------------|
| **Landing** | Next.js App Router package `aira-landing-page-elite` |
| **Tutor** | Vite React SPA package `ai-tutor` |
| **SPA** | Single-page application (tutor) |
| **Role home** | Default post-auth path for a role (`lib/auth-redirect.ts` / tutor `homeForRole`) |
| **Mode selection** | Student screen choosing Curriculum vs Competitive (`/student/mode-selection`) |
| **Curriculum Mode** | Grade/subject/chapter school learning path |
| **Competitive Mode** | Entrance/scholarship exam prep hub |
| **Bridge secret** | Shared secret authorizing weekly-exam `all=1` GET and POST upserts |
| **Demo persona** | Local tutor session with `isDemo: true` (not Firebase) |
| **SSE** | Server-Sent Events stream |
| **TTS** | Text-to-speech |
| **IST** | India Standard Time — used in weekly exam window logic in tutor service comments/code |
| **FR** | Functional requirement |
| **NFR** | Non-functional requirement |

---

## 4. Actors / User Roles

| Actor ID | Role | How assigned (code) | Default destination |
|----------|------|---------------------|---------------------|
| **A-VIS** | Visitor (unauthenticated) | No session | Landing public pages |
| **A-STU** | `student` | Signup default; Firestore `users/{uid}.role`; OAuth defaults to student | `/student/mode-selection` (or remembered student home) |
| **A-TCH** | `teacher` | Signup role select; Firestore role | `/teacher/dashboard` |
| **A-ADM** | `admin` | **Not** self-assignable on public signup (`saveUserProfile` forces non-admin); must exist on Firestore profile | `/admin/dashboard` |
| **A-DEM** | Demo user | Tutor `enter*Demo()`; gate: `import.meta.env.DEV` **or** authenticated admin | Role home for chosen demo |
| **A-SYS** | System / integrations | N/A | Groq, Sarvam, Firebase, rewrite targets |

**Type source:** `AppRole = 'student' | 'teacher' | 'admin'` — landing `lib/auth-redirect.ts`; tutor mirrors role strings in guards/stores.

---

## 5. Assumptions & Constraints

| ID | Statement | Tag |
|----|-----------|-----|
| **AC-01** | Production users access tutor paths on the **landing hostname**, which rewrites to `https://ai-ra-app.vercel.app` per `vercel.json`. | Verified config |
| **AC-02** | Local unified mode requires landing on port **3000** and tutor on **5173**, with landing rewrites and Vite `/api` proxy. | Verified config |
| **AC-03** | Firebase project id used in client config is shared across apps (`NEXT_PUBLIC_FIREBASE_PROJECT_ID` / `VITE_FIREBASE_PROJECT_ID`). | `[NEEDS CONFIRMATION]` that both env files always point to the same project in every environment |
| **AC-04** | No automated unit/E2E test files (`*.test.*` / `*.spec.*`) were found in either audited repo; acceptance relies on manual checks unless tests exist elsewhere. | Verified absence in repos |
| **AC-05** | Teacher/admin dashboard metrics are driven by `src/data/mockAnalytics.ts` (tutor), not live Firestore aggregates. | Verified imports |
| **AC-06** | Landing `POST/GET /api/weekly-exams` persists to JSON/memory store (`lib/weekly-exam-store.ts`), while tutor primary path uses Firestore collection `weeklyExamSchedules` with API/localStorage fallbacks. Dual-write consistency is not guaranteed by a single transaction. | Verified; dual-store risk |
| **AC-07** | `[ASSUMPTION]` Hardcoded weekly bridge fallback secret string in landing API is for local/dev resilience; production should set `WEEKLY_EXAM_BRIDGE_SECRET`. | Code contains fallback — ops policy unconfirmed |
| **AC-08** | Professional learning “portal” URL `https://aira-edtech-f063e.web.app/` is referenced for `intent=professional` login redirect (`lib/site.ts`); primary nav still uses Coming Soon waitlist UX. | Verified code paths diverge by entry point |

---

## 6. System Overview / Architecture Summary

### 6.1 Applications

| App | Runtime | Hosting (as configured) |
|-----|---------|-------------------------|
| Landing | Next.js **16.1.6**, React 19, App Router | Vercel (project deploys this package) |
| Tutor | Vite **6**, React 18, React Router 6 | Vercel project `ai-ra-app` (`https://ai-ra-app.vercel.app`) |

### 6.2 Connection model

```
Browser → Landing origin
            ├─ Landing pages + /api/*
            └─ Rewrites:
                 /student|/teacher|/admin|/dev|/tutor-media|/tutor-assets|/theme-boot.js
                 → Tutor host (prod) or TUTOR_DEV_URL (dev)

Tutor (direct :5173) → proxies /api → landing :3000 (vite.config.ts)
```

**Evidence:** `next.config.mjs` (dev rewrites), `vercel.json` (prod rewrites), `vite.config.ts` (`server.proxy['/api']`).

### 6.3 Auth session model

- Firebase Auth client SDK on both apps.
- Landing owns login/signup UI.
- Tutor `FirebaseAuthBridge` syncs `onAuthStateChanged` into Zustand `authStore`.
- Cross-app hints: `localStorage` keys `aira:role`, `aira:student-home` (landing `lib/session-hints.ts`, tutor `src/lib/sessionHints.ts`).

---

## 7. Authentication & Authorization Requirements

| ID | Requirement | Priority | Acceptance notes | Evidence |
|----|-------------|----------|------------------|----------|
| **FR-AUTH-001** | The system shall authenticate users with Firebase Auth using email/password. | Must | Signup/login succeed when Firebase configured | Landing `lib/firebase/auth.ts` |
| **FR-AUTH-002** | The system shall offer Google sign-in when `NEXT_PUBLIC_AUTH_GOOGLE` is not explicitly disabled (defaults on). | Must | Google button visible per flag | `components/social-login.tsx` |
| **FR-AUTH-003** | The system shall offer Apple and Microsoft sign-in only when `NEXT_PUBLIC_AUTH_APPLE` / `NEXT_PUBLIC_AUTH_MICROSOFT` enable them. | Should | Buttons gated by env | `components/social-login.tsx` |
| **FR-AUTH-004** | The system shall persist Firebase Auth using IndexedDB persistence in the landing client. | Must | Session survives reload on same browser profile | `lib/firebase/client.ts` |
| **FR-AUTH-005** | The system shall provide password reset via `/forgot-password` using Firebase reset email. | Must | Reset email request completes without server error when Firebase configured | `app/forgot-password/page.tsx` |
| **FR-AUTH-006** | On email signup, the system shall write Firestore `users/{uid}` with uid, name, email, dateOfBirth, provider, role, timestamps. | Must | Document exists after signup | `saveUserProfile` in `lib/firebase/auth.ts` |
| **FR-AUTH-007** | Public signup shall allow selecting role `student` or `teacher` only; attempts to set `admin` shall be coerced to `student`. | Must | Firestore role ≠ admin after public signup | `lib/firebase/auth.ts`, `app/signup/page.tsx` |
| **FR-AUTH-008** | OAuth profile writes shall use `preserveExistingRole: true` so existing teacher/admin roles are not overwritten. | Must | Elevated role remains after social login | `lib/firebase/auth.ts` |
| **FR-AUTH-009** | After successful auth, the system shall navigate with full-page navigation to a sanitized destination from `resolvePostAuthPath` / role home. | Must | Lands on role-prefixed tutor path | `lib/auth-redirect.ts`, login/signup pages |
| **FR-AUTH-010** | Default role homes shall be: student `/student/mode-selection`; teacher `/teacher/dashboard`; admin `/admin/dashboard`. | Must | Matches `ROLE_HOME` | `lib/auth-redirect.ts` |
| **FR-AUTH-011** | If a student has a remembered home in allow-list (`/student/curriculum`, `/student/competitive`, `/student/dashboard`), post-auth shall prefer that home. | Must | Skips mode picker when hint valid | `STUDENT_HOMES`, session hints |
| **FR-AUTH-012** | Login `redirect` query shall be accepted only if it is a same-app path under `/student`, `/teacher`, or `/admin` (open-redirect blocked). | Must | External URLs ignored | `sanitizeAppRedirect` |
| **FR-AUTH-013** | Login `redirect` shall be used only when it matches the authenticated user’s role prefix. | Must | Teacher redirect cannot open `/student/*` | `redirectMatchesRole` |
| **FR-AUTH-014** | Login with `signedOut=1` shall force logout before showing the form. | Must | Clears prior session from tutor sign-out handoff | `app/login/page.tsx` |
| **FR-AUTH-015** | Tutor shall not render protected pages until auth store hydration and Firebase bridge mark auth ready. | Must | No flash of protected content | `HydrationGuard`, `FirebaseAuthBridge`, `ProtectedRoute` in `App.tsx` |
| **FR-AUTH-016** | Unauthenticated access to tutor protected routes shall redirect to landing login via `redirectToLandingLogin` with return path. | Must | Browser location becomes landing `/login?redirect=…` | `authSession.ts`, `ProtectedRoute` |
| **FR-AUTH-017** | Tutor path `/login` shall redirect to the landing login URL. | Must | No tutor-native login page as primary UX | `LoginRedirect` in `App.tsx` |
| **FR-AUTH-018** | Tutor `RoleGuard` shall block authenticated users whose role does not match the route prefix (except demo persona switching). | Must | Student cannot stay on `/admin/*` | `App.tsx` RoleGuard |
| **FR-AUTH-019** | `/dev/demo-roles` shall be reachable when `import.meta.env.DEV` is true **or** the authenticated role is `admin`. | Must | Gate denies other prod users | `DemoRolesGate` |
| **FR-AUTH-020** | Demo enter actions shall set local demo user/role without requiring Firebase credentials. | Must | `isDemo === true` after enter | `authStore.ts` |
| **FR-AUTH-021** | Logout shall sign out Firebase (when applicable), clear role hint, and send the user to landing login (tutor uses `signedOut`). | Must | Subsequent protected navigation requires login | Landing AuthProvider / tutor logout paths |
| **FR-AUTH-022** | Middleware shall redirect `127.0.0.1` hostnames to `localhost` (same path/query) for Firebase authorized-domain compatibility. | Must | Loopback auth works on localhost | `middleware.ts` |
| **FR-AUTH-023** | Landing pages shall **not** be gated by Next.js middleware auth checks. | Must | Public marketing reachable logged-out | `middleware.ts` (no auth) |

---

## 8. Functional Requirements — by Module

### 8.1 Landing — Marketing & site pages

| ID | Requirement | Priority | Acceptance notes |
|----|-------------|----------|------------------|
| **FR-LND-001** | The system shall serve a home page at `/` composed of Header, Hero, Features, Courses, HowItWorks, CTA, Footer, PricingModal, ContactModal, and FloatingAssistant. | Must | Components mount as imported in `app/page.tsx` |
| **FR-LND-002** | The Hero shall expose primary CTA navigating to `/signup` and secondary CTA to `/contact` (canonical CTAs in `lib/site.ts`). | Must | Click navigates to those paths |
| **FR-LND-003** | The system shall serve `/pricing` with plan presentation and CTAs that route Free/Pro to signup and Enterprise to contact (no payment charge). | Must | No payment provider call |
| **FR-LND-004** | The system shall serve `/contact` and persist contact submissions to Firestore `contact_messages` using fields name, email, optional organization, message. | Must | Document created |
| **FR-LND-005** | The system shall serve static/legal pages: `/about`, `/privacy`, `/terms`, `/cookies`. | Must | HTTP 200 + content |
| **FR-LND-006** | The system shall serve `/blog` as a coming-soon placeholder. | Could | Page states coming soon |
| **FR-LND-007** | The system shall serve `/careers` with placeholder contact email presentation. | Could | Page loads |
| **FR-LND-008** | The system shall serve `/assistant` as a full-page AI counselor UI. | Must | Chat UI available |
| **FR-LND-009** | Home FloatingAssistant shall open counselor chat that calls `POST /api/chat`. | Must | Network request to `/api/chat` |
| **FR-LND-010** | AI assistant shall support TTS language preference persisted in `localStorage` key `aira-tts-language`. | Should | Preference restored on revisit |
| **FR-LND-011** | AI assistant avatar media shall use local video `/videos/counselor.mp4` (not a live HeyGen session). | Must | Video element/source present; no HeyGen SDK import |
| **FR-LND-012** | School course catalog shall be browsable/filterable from home Courses section using `lib/learning-courses.ts` data. | Must | Filters change visible courses |
| **FR-LND-013** | Professional courses marked unavailable shall offer waitlist/notify flow posting to `/api/waitlist`. | Must | Waitlist entry created |
| **FR-LND-014** | “For Professionals” primary nav shall open Coming Soon waitlist UX rather than a live in-app portal. | Must | Modal/waitlist path used (`audience-nav-link` / `coming-soon-modal`) |
| **FR-LND-015** | Header shall expose navigation to Features, Courses, How it works, Pricing, For Schools, For Professionals, Log in, and Start Free Trial. | Must | Links/anchors present in `Header` |

### 8.2 Landing ↔ Tutor proxy

| ID | Requirement | Priority | Acceptance notes |
|----|-------------|----------|------------------|
| **FR-PRX-001** | In production, landing shall rewrite `/student`, `/student/:path*`, `/teacher`, `/teacher/:path*`, `/admin`, `/admin/:path*`, `/dev/:path*` to `https://ai-ra-app.vercel.app` equivalents. | Must | `vercel.json` rules |
| **FR-PRX-002** | In production, landing shall rewrite `/tutor-media/:path*`, `/tutor-assets/:path*`, `/theme-boot.js` to the tutor host. | Must | Static assets load on landing origin |
| **FR-PRX-003** | In development, landing shall rewrite the same app prefixes plus Vite tooling paths to `TUTOR_DEV_URL` (default `http://127.0.0.1:5173`). | Must | `next.config.mjs` when `NODE_ENV=development` |
| **FR-PRX-004** | Landing shall not rewrite `/api/*` to the tutor. | Must | API handled by Next routes |
| **FR-PRX-005** | Tutor Vite shall proxy `/api` to `VITE_API_PROXY_TARGET` or `http://127.0.0.1:3000`. | Must | `vite.config.ts` |

### 8.3 Student — Mode selection

| ID | Requirement | Priority | Acceptance notes |
|----|-------------|----------|------------------|
| **FR-STU-001** | Authenticated students shall access `/student/mode-selection`. | Must | RoleGuard allows student |
| **FR-STU-002** | The page shall present Curriculum Mode and Competitive Mode entry actions. | Must | Two mode cards/CTAs |
| **FR-STU-003** | Entering Curriculum shall navigate to `/student/curriculum` and persist student home hint. | Must | Hint readable after navigation |
| **FR-STU-004** | Entering Competitive shall navigate to `/student/competitive` and persist student home hint. | Must | Hint readable after navigation |
| **FR-STU-005** | The page shall render branded navbar/hero/cards/footer components from `src/components/mode-selection/*`. | Must | Components present |

### 8.4 Student — Curriculum

| ID | Requirement | Priority | Acceptance notes |
|----|-------------|----------|------------------|
| **FR-STU-010** | The system shall expose grades with ids `grade-6` … `grade-10`, `grade-11-science`, `grade-12-science`. | Must | Selectable in UI from `schoolGrades` |
| **FR-STU-011** | Curriculum navigation shall support URL query `grade` and `subject`. | Must | URL updates and restores view |
| **FR-STU-012** | Selecting a topic shall navigate to `/student/learn/:topicId`. | Must | Teaching page loads for topic |
| **FR-STU-013** | The system shall record topic completion in persisted `curriculumStore.progressMap`. | Must | Survives reload |

### 8.5 Student — Competitive

| ID | Requirement | Priority | Acceptance notes |
|----|-------------|----------|------------------|
| **FR-STU-020** | Competitive hub shall accept `?section=` in {`exams`,`weekly`,`quizzes`,`questionary`,`pyqs`,`mock`,`performance`} defaulting to `exams`. | Must | `normalizeSection` behavior |
| **FR-STU-021** | The system shall list competitive exams with ids: `jee-main`, `neet`, `eamcet`, `jee-advanced`, `polycet`, `ntse`, `rjc-cet`, `gate`, `sainik`, `navodaya`, `kv`, `emrs`, `nmms`, `olympiad`, `rgukt-iiit`. | Must | Present in `COMPETITIVE_EXAMS` |
| **FR-STU-022** | Exam attempt flow shall progress through steps including exam → subject → paper → solving → result (as implemented in `ExamFlow`). | Must | Step param advances |
| **FR-STU-023** | Live exam UI shall provide timer and question navigation controls (`LiveExamPanel`). | Must | Controls operable during solving |
| **FR-STU-024** | Weekly tests section shall surface published sessions and enforce schedule windows via `weeklyExamSchedule` service logic. | Must | Outside window: cannot start / clear messaging |
| **FR-STU-025** | Questionary/explain path shall be able to open `/student/competitive-explain` with session payload. | Must | Explain page renders content |
| **FR-STU-026** | Completing attempts shall update persisted `competitiveStore` attempt history. | Must | Analytics section reflects attempts |

### 8.6 Student — Teaching / Learn

| ID | Requirement | Priority | Acceptance notes |
|----|-------------|----------|------------------|
| **FR-STU-030** | `/student/learn/:topicId?` shall present teaching chat, board, and studio capabilities. | Must | TeachingPage loads |
| **FR-STU-031** | The system shall generate teaching content via `contentGenerator` / `aiService` when AI providers are configured. | Must | Steps appear or explicit error if no key |
| **FR-STU-032** | Students shall submit doubts (text/voice paths as implemented) handled by doubt store flows. | Must | Doubt recorded/resolved path works |
| **FR-STU-033** | Studio shall generate at least notes, mind maps, flashcards, quizzes, and summaries via `resourceStore` generators. | Must | Each tool produces viewable output or error toast |
| **FR-STU-034** | Export service shall support exporting artifacts to PDF/DOCX/PNG as implemented in `exportService`. | Should | File download occurs |
| **FR-STU-035** | Chat shall accept document uploads parsed by `documentParser` (PDF/DOCX/text/images as coded). | Should | Extracted text available to session |

### 8.7 Student — Dashboard, onboarding, profile

| ID | Requirement | Priority | Acceptance notes |
|----|-------------|----------|------------------|
| **FR-STU-040** | `/student/dashboard` shall render dashboard cards including hero/mascot and topic discovery components. | Must | Page loads for student |
| **FR-STU-041** | `/student/onboarding` shall collect profession → specialization → subject → topic and route into learn. | Must | Completes to `/student/learn/:topicId` |
| **FR-STU-042** | `/student/profile` shall allow viewing/editing profile fields implemented on ProfilePage (including display name update path). | Must | Save reflects in UI |

### 8.8 Teacher

| ID | Requirement | Priority | Acceptance notes |
|----|-------------|----------|------------------|
| **FR-TCH-001** | Authenticated teachers shall access `/teacher/dashboard`. | Must | RoleGuard |
| **FR-TCH-002** | Teacher dashboard shall display class/student analytics UI backed by `mockAnalytics` data. | Must | UI populates without Firestore analytics queries |
| **FR-TCH-003** | Teachers shall access `/teacher/settings` and `/teacher/profile`. | Must | Pages load |

### 8.9 Admin

| ID | Requirement | Priority | Acceptance notes |
|----|-------------|----------|------------------|
| **FR-ADM-001** | Authenticated admins shall access `/admin/dashboard` (mock analytics UI). | Must | RoleGuard |
| **FR-ADM-002** | Admins shall manage weekly exams at `/admin/weekly-exams` (create/update status transitions as implemented). | Must | Published session readable by student weekly flow when store path succeeds |
| **FR-ADM-003** | Weekly session records shall include fields matching `WeeklyExamSessionDto` / tutor equivalents: id, weekKey, day saturday\|sunday, title, examId, mode mock\|pyq, startsAt, endsAt, status draft\|published\|archived, createdBy, updatedAt, optional subjectId. | Must | Validation rejects incomplete payloads on landing POST |
| **FR-ADM-004** | Admins shall access `/admin/settings` and `/admin/profile`. | Must | Pages load |

### 8.10 Shared tutor settings

| ID | Requirement | Priority | Acceptance notes |
|----|-------------|----------|------------------|
| **FR-SET-001** | Settings tabs shall be role-filtered: account (all); learning (student); accessibility (student, teacher); ai (student); privacy (all). | Must | Admin does not see learning/ai/accessibility tabs |
| **FR-SET-002** | Accessibility settings shall include font size, TTS enablement, TTS language/speaker/voice/speed, and related flags persisted in `settingsStore`. | Must | Survives reload |
| **FR-SET-003** | Theme setting shall support light/dark/system as implemented in settings store. | Must | `data-theme` or equivalent updates |

### 8.11 APIs (functional)

See also §10 for endpoint table. Module-level:

| ID | Requirement | Priority | Acceptance notes |
|----|-------------|----------|------------------|
| **FR-API-001** | `POST /api/chat` shall accept `{ messages, language? }`, require messages array, and stream SSE tokens from Groq when `GROQ_API_KEY` is set. | Must | 400 without messages; 500 without key/upstream fail |
| **FR-API-002** | `POST /api/tts` shall accept `{ text, language?, speaker?, pace? }` and return WAV audio (or JSON base64 when Accept prefers JSON) via Sarvam when `SARVAM_API_KEY` is set. | Must | Audio decodable |
| **FR-API-003** | `GET /api/tts/health` shall report Sarvam configuration boolean and model names `bulbul:v2`, `bulbul:v3`. | Should | JSON shape matches |
| **FR-API-004** | `POST /api/waitlist` shall require email, courseId, courseName and write Firestore `waitlist`. | Must | Returns `{ ok: true, id }` |
| **FR-API-005** | `GET /api/weekly-exams` shall return published sessions by default from landing JSON store. | Must | `{ ok, sessions, source }` |
| **FR-API-006** | `GET /api/weekly-exams?all=1` and `POST /api/weekly-exams` shall require valid bridge secret (header `x-aira-weekly-bridge` or body/query secret fields as coded). | Must | 401 without secret |
| **FR-API-007** | Tutor client shall call `/api/tts` for speech synthesis via `ttsClient`. | Must | Request observed during TTS |
| **FR-API-008** | Tutor weekly schedule service shall call `/api/weekly-exams` as a fallback/bridge path in addition to Firestore. | Must | Code path in `weeklyExamSchedule.ts` |

---

## 9. User Journeys / Key Flows

### UJ-01 — Student free trial to mode selection
1. Visitor opens `/` → **FR-LND-001/002**
2. Clicks Start Free Trial → `/signup`
3. Submits student signup → **FR-AUTH-001/006/007**
4. Redirect to `/student/mode-selection` → **FR-AUTH-009/010**, **FR-STU-001**

### UJ-02 — Deep-link return after login
1. Unauthenticated user opens `/student/curriculum` on unified origin
2. Tutor `ProtectedRoute` → landing `/login?redirect=/student/curriculum` → **FR-AUTH-016/012/013**
3. User logs in as student → returns to curriculum → **FR-STU-010+**

### UJ-03 — Curriculum learn loop
1. Mode selection → Curriculum → **FR-STU-003**
2. Pick grade/subject/topic → **FR-STU-010…012**
3. Teaching + studio + optional export → **FR-STU-030…035**
4. Completion persisted → **FR-STU-013**

### UJ-04 — Competitive attempt
1. Mode selection → Competitive → **FR-STU-004/020**
2. Choose exam/subject/paper → solve → result → **FR-STU-021…023/026**

### UJ-05 — Weekly exam (admin → student)
1. Admin publishes session → **FR-ADM-002/003**
2. Student opens Competitive `section=weekly` within window → **FR-STU-024**  
   **`[NEEDS CONFIRMATION]`** end-to-end consistency when admin writes Firestore only vs landing JSON only (see AC-06).

### UJ-06 — Waitlist
1. Visitor opens professional unavailable course → Notify Me → **FR-LND-013**
2. `POST /api/waitlist` → Firestore → **FR-API-004**

### UJ-07 — Contact / demo
1. `/contact` or ContactModal → Firestore `contact_messages` → **FR-LND-004**

### UJ-08 — AI counselor
1. Floating assistant or `/assistant` → chat SSE → **FR-LND-008/009**, **FR-API-001**
2. Optional TTS → **FR-API-002**, **FR-LND-010**

### UJ-09 — Teacher login
1. Signup/login as teacher → `/teacher/dashboard` → **FR-AUTH-010**, **FR-TCH-001/002**

### UJ-10 — Sign out
1. Tutor/landing logout → landing `/login?signedOut=1` path as implemented → **FR-AUTH-014/021**

### UJ-11 — Demo personas
1. Open `/dev/demo-roles` under gate → enter student/teacher/admin demo → **FR-AUTH-019/020**

---

## 10. API Requirements

| ID | Method | Endpoint | Purpose | Auth | Side effects |
|----|--------|----------|---------|------|--------------|
| **API-001** | POST | `/api/chat` | Stream counselor chat completion | None | Outbound Groq chat completions |
| **API-002** | POST | `/api/tts` | Synthesize speech audio | None | Outbound Sarvam TTS |
| **API-003** | GET | `/api/tts/health` | TTS provider health/config | None | None (read env) |
| **API-004** | OPTIONS | `/api/tts/health` | CORS preflight support as implemented | None | None |
| **API-005** | POST | `/api/waitlist` | Create waitlist entry | None | Firestore `waitlist` create |
| **API-006** | GET | `/api/weekly-exams` | List weekly sessions (published default) | Optional secret for `?all=1` | Reads JSON/memory store |
| **API-007** | POST | `/api/weekly-exams` | Upsert weekly session | Bridge secret required | Writes JSON/memory store |

**Notes**

- No Zod schemas in landing API routes; validation is manual.
- Tutor also ships serverless files under tutor `api/` for some routes when deployed standalone — **`[NEEDS CONFIRMATION]`** which deployment mode is authoritative in production (landing rewrite vs tutor direct). Same-origin production architecture implies landing APIs for browser calls on landing host.
- Tutor code references `API_ROUTES.chat` / `waitlist` / `tts/health` but **fetch usage found only for** `/api/tts` and `/api/weekly-exams`.

---

## 11. Data Model

### 11.1 Firestore

| Collection | Fields (as written/read in code) | Types | Apps |
|------------|----------------------------------|-------|------|
| `users/{uid}` | `uid`, `name`, `email`, `dateOfBirth`, `provider`, `role?`, `createdAt?`, `updatedAt` | string; role `student\|teacher\|admin`; timestamps server | Landing write; both read role |
| `waitlist/{id}` | `email`, `courseId`, `courseName`, `createdAt` | string + timestamp | Landing API |
| `contact_messages/{id}` | `name`, `email`, `organization?`, `message`, `createdAt` | string + timestamp | Landing client |
| `leads/{leadId}` | `type` `schools\|professionals`, `name`, `email`, `organization`, `createdAt` | per `firestore.rules` | **No writer in TS found** |
| `weeklyExamSchedules` | Session fields aligned with weekly DTO (tutor service) | mixed string enums + ISO strings | Tutor admin/student |

### 11.2 Landing weekly JSON DTO

`WeeklyExamSessionDto` (`lib/weekly-exam-store.ts`):

| Field | Type |
|-------|------|
| `id` | `string` |
| `weekKey` | `string` |
| `day` | `'saturday' \| 'sunday'` |
| `title` | `string` |
| `examId` | `string` |
| `subjectId?` | `string` |
| `mode` | `'mock' \| 'pyq'` |
| `startsAt` | `string` |
| `endsAt` | `string` |
| `status` | `'draft' \| 'published' \| 'archived'` |
| `createdBy` | `string` |
| `updatedAt` | `string` |

### 11.3 Course catalog types (landing)

From `lib/learning-courses.ts`: `LearningCourse`, `SchoolCourse` (+ `gradeBand`, `board`), `ProfessionalCourse` (+ `level`, `format`), plus supporting metric/accent/pattern types.

### 11.4 Auth input type

`SignUpInput`: `{ name, email, password, dateOfBirth?, role? }` — `lib/firebase/auth.ts`.

---

## 12. Client-Side State & Persistence

### 12.1 Landing browser storage

| Key | Storage | Survives reload? | Purpose |
|-----|---------|------------------|---------|
| `aira:role` | localStorage | Yes | Role hint |
| `aira:student-home` | localStorage | Yes | Student home hint |
| `aira-tts-language` | localStorage | Yes | Assistant TTS language |
| `aira-greeting-shown` | sessionStorage | No (tab session) | Floating greeting once per session |
| Firebase Auth IndexedDB | IndexedDB | Yes | Auth session |

### 12.2 Tutor Zustand stores

| Store | Persist | Storage key | Survives reload? |
|-------|---------|-------------|------------------|
| `useAuthStore` | Partial | `ai-tutor-auth` | Yes (partialized fields) |
| `useCurriculumStore` | Yes | `curriculum-storage` | Yes |
| `useTeachingStore` | Yes | `teaching-storage` | Yes (incl. last step map) |
| `useSettingsStore` | Yes | `ai-tutor-settings` | Yes |
| `useUserStore` | Yes | `ai-tutor-user` | Yes |
| `useAnalyticsStore` | Yes | `analytics-storage` | Yes |
| `useCompetitiveStore` | Yes | `aira-competitive-analytics` | Yes |
| `useResourceStore` | No | — | No |
| `useDoubtStore` | No | — | No |
| `useDocumentStore` | No | — | No |
| `useToastStore` | No | — | No |

### 12.3 Tutor other persistence

| Mechanism | Purpose | Survives reload? |
|-----------|---------|------------------|
| `localStorage` weekly exam fallback key inside `weeklyExamSchedule.ts` | Offline weekly sessions | Yes |
| `sessionStorage` exam draft keys / explain payload / diversity helpers | In-progress exam UX | No (tab session) |
| `aira:role` / `aira:student-home` | Shared hints with landing | Yes |

---

## 13. Integrations & Environment

### 13.1 Third-party / platform services

| Service | Used for | App | Evidence |
|---------|----------|-----|----------|
| Firebase Auth | Identity | Both | firebase client modules |
| Cloud Firestore | Profiles, waitlist, contacts, weekly exams (tutor) | Both | firestore writes/reads |
| Firebase Analytics | Analytics in production tutor | Tutor | `getAnalytics` when PROD |
| Vercel Analytics | Landing analytics | Landing | `app/layout.tsx` mounts `<Analytics />` from `@vercel/analytics/next` |
| Firebase Analytics (landing) | Optional client analytics init | Landing | `initFirebaseAnalytics()` from `AuthProvider` |
| Groq API | Landing counselor chat | Landing | `/api/chat` |
| Sarvam AI | TTS | Landing API; tutor also has client Sarvam TTS helpers | `/api/tts`, `aiService.fetchSarvamTTS` |
| Groq / OpenRouter / DeepSeek / Sarvam / Mistral | Tutor lesson/exam AI | Tutor | `aiService.callAI` |
| Vercel Hosting | Deploy landing + tutor | Both | `vercel.json`, deploy scripts |
| External hosting `aira-edtech-f063e.web.app` | Professional intent redirect target | Landing | `lib/site.ts` |
| `@heygen/liveavatar-web-sdk` | Declared dependency | Landing | **Unused in source imports** |
| Browser `speechSynthesis` | TTS fallback | Tutor / possibly assistant | speech hooks |

### 13.2 Environment variables (names only)

#### Landing

| Variable | Consumer area |
|----------|---------------|
| `GROQ_API_KEY` | `/api/chat` |
| `SARVAM_API_KEY` | `/api/tts`, `/api/tts/health` |
| `WEEKLY_EXAM_BRIDGE_SECRET` | `/api/weekly-exams` |
| `NEXT_PUBLIC_WEEKLY_EXAM_BRIDGE_SECRET` | `/api/weekly-exams` |
| `TUTOR_DEV_URL` | `next.config.mjs` rewrites |
| `NODE_ENV` | Rewrite enablement |
| `NEXT_PUBLIC_AUTH_GOOGLE` | Social login UI |
| `NEXT_PUBLIC_AUTH_APPLE` | Social login UI |
| `NEXT_PUBLIC_AUTH_MICROSOFT` | Social login UI |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase config |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase config / domain sync |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase config |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase config |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase config |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Firebase config |
| `NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST` | Emulator |
| `NEXT_PUBLIC_USE_FIREBASE_EMULATOR` | Emulator |
| `NEXT_PUBLIC_SITE_URL` | Authorized domains sync |
| `NEXT_PUBLIC_VERCEL_URL` | Domain sync |
| `VERCEL_URL` | Domain sync |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | `scripts/sync-auth-domains.mjs` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Domain sync script |
| `VERCEL` | Domain sync script |
| `CI` | Domain sync script |
| `HEYGEN_API_KEY` | Present in `.env.local` — **not referenced in application code** |

#### Tutor

| Variable | Consumer area |
|----------|---------------|
| `VITE_FIREBASE_API_KEY` | Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase |
| `VITE_FIREBASE_PROJECT_ID` | Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase |
| `VITE_FIREBASE_APP_ID` | Firebase |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase |
| `VITE_LANDING_ORIGIN` | Login redirect origin |
| `VITE_GROQ_API_KEY` | AI |
| `VITE_GROQ_MODEL` | AI |
| `VITE_GROQ_VISION_MODEL` | AI |
| `VITE_OPENROUTER_API_KEY` | AI |
| `VITE_OPENROUTER_VISION_MODEL` | AI |
| `VITE_MISTRAL_API_KEY` | AI |
| `VITE_DEEPSEEK_API_KEY` | AI |
| `VITE_SARVAM_API_KEY` | AI/TTS client |
| `VITE_API_PROXY_TARGET` | Vite `/api` proxy |
| `VITE_DEV_ORIGIN` | Vite server.origin |
| `VITE_HMR_CLIENT_PORT` | Vite HMR |

---

## 14. Non-Functional Requirements

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| **NFR-001** | Protected tutor routes shall not render primary content before `authReady` / hydration completes. | Must | Guard components |
| **NFR-002** | Landing auth domain middleware shall complete redirect without requiring login. | Must | Loopback fix only |
| **NFR-003** | Chat API shall run on Node runtime with configured `maxDuration` of 30 seconds (as set on route). | Should | `app/api/chat/route.ts` |
| **NFR-004** | Tutor production build shall emit code-split vendor chunks (react/three/ui/pdf) per Vite config. | Should | `vite.config.ts` `manualChunks` |
| **NFR-005** | Accessibility settings that set document data attributes (font size, high contrast, reduce motion) shall apply without a full remount of the app shell. | Should | Settings page + store subscribers |
| **NFR-006** | Primary student flows shall be usable on mobile and desktop viewports. | Should | `[ASSUMPTION]` responsive CSS exists; no automated visual regression suite found |
| **NFR-007** | Secrets for landing Groq/Sarvam shall remain server-side (`GROQ_API_KEY`, `SARVAM_API_KEY`). | Must | Not `NEXT_PUBLIC_` |
| **NFR-008** | Tutor AI provider keys are `VITE_*` and therefore shipped to the browser — treat as public. | Must (constraint) | Security design debt; not a claim of secrecy |
| **NFR-009** | Open redirects via login `redirect` param shall be blocked by allow-list sanitization. | Must | `sanitizeAppRedirect` |
| **NFR-010** | i18n framework is initialized with an English resource bundle; UI language options beyond English are limited as implemented. | Could | `src/i18n.ts` |

---

## 15. Out of Scope / Not Implemented

| Item | Evidence | Status |
|------|----------|--------|
| Payment checkout / Stripe / Razorpay | Pricing CTAs → signup/contact; “Placeholder pricing” copy | Not implemented |
| HeyGen LiveAvatar runtime | SDK in landing `package.json`; no imports; unused `HEYGEN_API_KEY` | Not implemented |
| Firestore `leads` collection writers | Rules only; waitlist used instead | Not implemented |
| Landing middleware auth gating | Explicitly absent | Not implemented (by design) |
| Tutor native primary login UI | Redirects to landing | Not productized |
| Live teacher content authoring routes | No routes in `App.tsx` | Not implemented |
| Live teacher/admin analytics backend | `mockAnalytics.ts` | Placeholder data |
| Automated test suite in repos | Zero `*.test.*` / `*.spec.*` files found | Not present |
| Blog CMS | Coming soon page | Placeholder |
| Careers hiring system | Placeholder email | Placeholder |
| Tutor fetches to `/api/chat`, `/api/waitlist`, `/api/tts/health` | Constants only; no call sites found | Unused client wiring |
| Auth store stub Google/Apple/password-reset delays | Fake timers / no-ops in tutor `authStore` (landing owns real social) | Legacy/stub |
| Roll-number login | Present in store; commented as not exposed in UI | Unused UX |

---

## 16. Requirements Traceability Matrix

| Capability | FR IDs | Automated tests found |
|------------|--------|-----------------------|
| Marketing home & CTAs | FR-LND-001, 002, 015 | None in repo |
| Auth email/social/reset | FR-AUTH-001…008, 014, 021–023 | None |
| Post-auth routing | FR-AUTH-009…013 | None |
| Tutor guards | FR-AUTH-015…020 | None |
| Proxy unity | FR-PRX-001…005 | None (config review) |
| Waitlist | FR-LND-013, FR-API-004, API-005 | None |
| Contact | FR-LND-004 | None |
| AI counselor | FR-LND-008…011, FR-API-001…003 | None |
| Mode selection | FR-STU-001…005 | None |
| Curriculum + teach | FR-STU-010…013, 030…035 | None |
| Competitive + weekly | FR-STU-020…026, FR-ADM-002…003, FR-API-005…008 | None |
| Teacher dashboard | FR-TCH-001…003 | None |
| Admin dashboard | FR-ADM-001…004 | None |
| Settings | FR-SET-001…003 | None |

`[NEEDS CONFIRMATION]` whether CI or external QA repos contain tests not in these trees.

---

## 17. Acceptance Criteria Checklist

### Visitor / Landing
- [ ] `/` renders all home sections listed in FR-LND-001
- [ ] Start Free Trial → `/signup`; Book a Demo → `/contact`
- [ ] `/pricing` CTAs do not invoke a payment provider
- [ ] Contact form creates `contact_messages` document
- [ ] Waitlist submit creates `waitlist` document
- [ ] `/api/chat` streams when Groq configured; errors when not
- [ ] `/api/tts` returns audio when Sarvam configured
- [ ] `/blog` shows coming soon; professionals nav opens waitlist/coming soon

### Authentication
- [ ] Student signup lands on `/student/mode-selection`
- [ ] Teacher signup lands on `/teacher/dashboard`
- [ ] Public signup cannot create `admin` role
- [ ] Unsafe `redirect` query is ignored
- [ ] Role-mismatched `redirect` is ignored in favor of role home
- [ ] Tutor protected route redirects to landing login when logged out
- [ ] `signedOut=1` clears session on login page
- [ ] `127.0.0.1` redirects to `localhost`

### Student
- [ ] Mode selection navigates to curriculum and competitive and stores home hint
- [ ] Curriculum grades include 6–10 and 11–12 science ids
- [ ] Topic opens `/student/learn/:topicId`
- [ ] Competitive sections switch via `?section=`
- [ ] Exam attempt reaches result and records competitive attempt
- [ ] Settings tabs match role filter rules

### Teacher
- [ ] `/teacher/dashboard` loads for teacher only
- [ ] Dashboard shows mock analytics content

### Admin
- [ ] `/admin/weekly-exams` can publish a session
- [ ] Student weekly section reflects published in-window session **for the store path under test** (Firestore and/or API JSON — confirm which)
- [ ] Non-admin denied `/admin/*`

### Demo
- [ ] `/dev/demo-roles` available in DEV
- [ ] Admin can open `/dev/demo-roles` in production build

### Proxy
- [ ] On landing origin, `/student/mode-selection` loads tutor UI and tutor-media assets

---

## 18. Appendices

### Appendix A — Full route inventory

#### Landing (Next.js `app/**/page.tsx`)

| URL | File |
|-----|------|
| `/` | `app/page.tsx` |
| `/about` | `app/about/page.tsx` |
| `/assistant` | `app/assistant/page.tsx` |
| `/blog` | `app/blog/page.tsx` |
| `/careers` | `app/careers/page.tsx` |
| `/contact` | `app/contact/page.tsx` |
| `/cookies` | `app/cookies/page.tsx` |
| `/forgot-password` | `app/forgot-password/page.tsx` |
| `/login` | `app/login/page.tsx` |
| `/pricing` | `app/pricing/page.tsx` |
| `/privacy` | `app/privacy/page.tsx` |
| `/signup` | `app/signup/page.tsx` |
| `/terms` | `app/terms/page.tsx` |

#### Tutor (React Router — rewritten on landing origin)

| Path | Guard | Role |
|------|-------|------|
| `/` | RootRedirect | — |
| `/login` | LoginRedirect | — |
| `/dev/demo-roles` | DemoRolesGate | DEV or admin |
| `/student` | redirect to student home | — |
| `/student/mode-selection` | Protected + RoleGuard | student |
| `/student/curriculum` | Protected + RoleGuard | student |
| `/student/competitive` | Protected + RoleGuard | student |
| `/student/competitive-explain` | Protected + RoleGuard | student |
| `/student/learn/:topicId?` | Protected + RoleGuard | student |
| `/student/dashboard` | Protected + RoleGuard | student |
| `/student/onboarding` | Protected + RoleGuard | student |
| `/student/settings` | Protected + RoleGuard | student |
| `/student/profile` | Protected + RoleGuard | student |
| `/teacher` | redirect dashboard | — |
| `/teacher/dashboard` | Protected + RoleGuard | teacher |
| `/teacher/settings` | Protected + RoleGuard | teacher |
| `/teacher/profile` | Protected + RoleGuard | teacher |
| `/admin` | redirect dashboard | — |
| `/admin/dashboard` | Protected + RoleGuard | admin |
| `/admin/weekly-exams` | Protected + RoleGuard | admin |
| `/admin/settings` | Protected + RoleGuard | admin |
| `/admin/profile` | Protected + RoleGuard | admin |
| `*` | RootRedirect | — |

### Appendix B — Repo / package map

| Package | Path | Key configs |
|---------|------|-------------|
| `aira-landing-page-elite` | `AIra/frontend-landing` | `next.config.mjs`, `vercel.json`, `firestore.rules`, `app/`, `lib/`, `components/` |
| `ai-tutor` | OneDrive `AIra Project/Project` | `vite.config.ts`, `src/App.tsx`, `src/stores/`, `src/services/`, `src/pages/` |

### Appendix C — Maintaining this document

1. When adding a user-visible capability, add/adjust an `FR-<MODULE>-###` row in §8 and update journeys (§9) if flow changes.
2. When adding an HTTP handler, update §10 and Appendix A.
3. When changing schemas, update §11 and any dependent FRs.
4. When shipping a formerly placeholder item (§15), move it into §8 and remove from §15.
5. Bump **Version** and **Date** in §1; record a one-line change note below.

#### Change log

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2026-08-09 | Initial as-built FRD from landing + tutor code audit |

---

*End of FRD — AIRA-FRD-001 v1.0*

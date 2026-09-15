# AUDIT.md — Aɪra Landing Page Codebase Audit

## Executive Summary

**Repo audited:** `aira-landing-page-elite` (`C:\Users\mahesh polamreddy\Downloads\AIra landing page`)  
**Audit window:** 2026-08-10 · Phases 1–7  
**Rules:** Evidence with file path + line numbers only; no secret values printed; `NOT FOUND IN REPO` when absent.

### Tech stack

This is a single-package **Next.js 16.1.6 App Router** app (`package.json` L54) with **React 19.2.4**, **TypeScript 5.7.3**, **Tailwind CSS v4**, and Radix-based UI primitives—not a monorepo. Backend logic lives in **Next.js Route Handlers** under `app/api/**` (Node runtime for chat/TTS). Data uses the **Firebase JS SDK** (Auth + Cloud Firestore); there is no Prisma/Drizzle/Express server in-repo. Auth UI state is React Context (`AuthProvider`). Deploy config is **Vercel** (`vercel.json` rewrites tutor paths to `ai-ra-app.vercel.app`; tutor source is **NOT FOUND IN REPO**).

### Auth mechanism

Authentication is **Firebase Auth** via the client SDK (`createUserWithEmailAndPassword` / `signInWithEmailAndPassword` / OAuth popups in `lib/firebase/auth.ts`)—not NextAuth, not custom JWTs, not app-local bcrypt. **Password hashing algorithm and cost factor are NOT FOUND IN REPO** (delegated to Firebase Auth hosted service); this codebase does not store password hashes in Firestore (profile fields only). After login, the session is a **Firebase Auth client session** persisted with **`indexedDBLocalPersistence`** (`lib/firebase/client.ts` L56–L58), mirrored into React via `onAuthStateChanged`. Role/home **hints** sit in `localStorage` (`aira:role`, `aira:student-home`) but are not access tokens. Landing `middleware.ts` does **not** enforce login—only redirects `127.0.0.1` → `localhost`.

### Counts

| Metric | Count | Notes |
|--------|------:|-------|
| App Router pages (`app/**/page.tsx`) | **13** | `/`, `/about`, `/assistant`, `/blog`, `/careers`, `/contact`, `/cookies`, `/forgot-password`, `/login`, `/pricing`, `/privacy`, `/signup`, `/terms` |
| API route modules | **5** | `chat`, `tts`, `tts/health`, `waitlist`, `weekly-exams` |
| HTTP method+path handlers | **7** | `POST /api/chat`; `POST /api/tts`; `GET`+`OPTIONS /api/tts/health`; `POST /api/waitlist`; `GET`+`POST /api/weekly-exams` |
| Server Actions (`"use server"`) | **0** | **NOT FOUND IN REPO** |
| Active third-party integrations | **5** | Groq (chat), Sarvam (TTS), Firebase (Auth/Firestore/Analytics), Vercel Analytics, Google Identity Toolkit via postbuild domain sync |
| Declared but unused SDK | **1** | `@heygen/liveavatar-web-sdk` (`package.json` L15) — no TS init found |

### 🔴 CRITICAL issues

1. **Firestore privilege escalation (`role`)** — `firestore.rules` **L5–L7**: authenticated users may fully write `users/{userId}` with no field/`role` constraints; routing trusts `getUserAppRole` (`lib/firebase/auth.ts` **L60–L63**). App signup coercion (`lib/firebase/auth.ts` **L148–L149**) is not enforced by rules.
2. **Hardcoded weekly-exam bridge secret fallback** — `app/api/weekly-exams/route.ts` **L9–L12** (literal fallback when env unset) authorizes `GET ?all=1` and `POST` upserts.
3. **Hardcoded Firebase web config fallbacks** — `lib/firebase/config.ts` **L4–L21** (including `apiKey` fallback at **L6**); values not reprinted.
4. **Unauthenticated, unmetered paid API proxies** — `POST /api/chat` (`app/api/chat/route.ts` **L33–L40**) and `POST /api/tts` (`app/api/tts/route.ts` **L63–L70**) require only server env keys; no auth/rate-limit in-app.

### 🟠 WARNING issues

1. **No landing middleware auth** for `/student|/teacher|/admin` — `middleware.ts` **L11–L18** (hostname redirect only); tutor guards **NOT FOUND IN REPO**.
2. **Public waitlist/contact lack abuse controls** — `app/api/waitlist/route.ts` **L19–L28**; `components/contact-form.tsx` **L22–L32**, **L62–L66** (`noValidate`).
3. **`.gitignore` does not ignore plain `.env`** — `.gitignore` **L11–L12** (only `.env*.local`).
4. **`NEXT_PUBLIC_WEEKLY_EXAM_BRIDGE_SECRET` accepted as bridge secret** — `app/api/weekly-exams/route.ts` **L11**.
5. **Chat prompts unsanitized / injection & size risk** — `app/api/chat/route.ts` **L43–L48**, **L66–L68** (messages forwarded to Groq).
6. **No CSRF protection** on state-changing public POSTs — CSRF primitives **NOT FOUND IN REPO**; affects `app/api/chat/route.ts` **L33+**, `app/api/tts/route.ts` **L63+**, `app/api/waitlist/route.ts` **L5+**, weekly-exams POST **L61+**.
7. **Groq upstream error body logged** — `app/api/chat/route.ts` **L87** (`errText` may contain sensitive prompt/provider detail).
8. **Dependency risk: Next 16.1.6 with many high advisories** — `package.json` **L54**; `pnpm audit` reported **28 high / 19 moderate / 3 low** (2026-08-10).

### Recommended fix order (top 5)

1. **Lock down Firestore `users` rules** — allowlist fields; forbid client-set `role` to `admin` (or allow role changes only via Admin SDK / Cloud Function). Evidence: `firestore.rules` L5–L7.
2. **Remove weekly bridge secret fallback; require `WEEKLY_EXAM_BRIDGE_SECRET` only** — delete hardcoded literal and stop reading `NEXT_PUBLIC_WEEKLY_EXAM_BRIDGE_SECRET`. Evidence: `app/api/weekly-exams/route.ts` L9–L12.
3. **Protect `/api/chat` and `/api/tts`** — require auth and/or edge rate limits, payload size caps, and optionally turn off anonymous access in production. Evidence: `app/api/chat/route.ts` L33–L40; `app/api/tts/route.ts` L63–L70.
4. **Remove hardcoded Firebase config fallbacks; tighten `.gitignore`** — fail closed without env; ignore `.env` and `.env.*` (keep `.env.example`). Evidence: `lib/firebase/config.ts` L4–L21; `.gitignore` L11–L12.
5. **Upgrade Next.js** (and re-run `pnpm audit`) to a patched release line (≥16.2.11 per several high GHSAs cited in Phase 6). Evidence: `package.json` L54; Phase 6 audit summary.

---

**Detailed phase findings follow.**

---

## 1. Stack Inventory

### 1.1 Package identity

| Item | Value | Evidence |
|------|-------|----------|
| Package name | `aira-landing-page-elite` | `package.json` L2 |
| Version | `0.1.0` | `package.json` L3 |
| Private | `true` | `package.json` L4 |
| Lockfile | `pnpm-lock.yaml` present at repo root | filesystem listing |
| Monorepo (`/apps`, `/packages`) | **NOT FOUND IN REPO** | `Test-Path` apps/packages → False; only one `package.json` |

> **Scope note:** This workspace is a **single Next.js package**, not a monorepo. A separate tutor host is referenced by deploy rewrites (`vercel.json` L5–L42 → `https://ai-ra-app.vercel.app/...`), but **tutor application source is NOT FOUND IN REPO**.

### 1.2 Framework & language

| Item | Value | Evidence |
|------|-------|----------|
| Framework | **Next.js** | `package.json` L54: `"next": "16.1.6"` |
| React | **19.2.4** | `package.json` L56–L58 (`react`, `react-dom`) |
| Language | **TypeScript** (primary); `allowJs: true` | `package.json` L80 `"typescript": "5.7.3"`; `tsconfig.json` L8, L32–L34 includes `**/*.ts`, `**/*.tsx` |
| Router model | **App Router** (`app/`); **Pages Router `pages/` NOT FOUND IN REPO** | `app/layout.tsx`, `app/page.tsx` exist; zero files under `pages/**` |

### 1.3 Styling

| Item | Value | Evidence |
|------|-------|----------|
| Tailwind CSS | **v4.2.0** | `package.json` L78 `"tailwindcss": "^4.2.0"`; L70 `@tailwindcss/postcss` |
| PostCSS plugin | `@tailwindcss/postcss` | `postcss.config.mjs` L3–L5 |
| Global styles | Tailwind import + design tokens | `app/globals.css` L1–L2 `@import 'tailwindcss'`, `@import 'tw-animate-css'` |
| Animation helper | `tw-animate-css` | `package.json` L79; `app/globals.css` L2 |
| Utility merge | `tailwind-merge`, `clsx`, `class-variance-authority` | `package.json` L46–L48, L63 |
| UI primitives | Radix UI packages + `components/ui/*` | `package.json` L17–L43; `components/ui/` directory |
| CSS Modules / styled-components | **NOT FOUND IN REPO** as project styling system (no dependency entries) | `package.json` dependencies scan |

### 1.4 State management

| Item | Value | Evidence |
|------|-------|----------|
| Redux / Zustand / Jotai / Recoil | **NOT FOUND IN REPO** (no deps in `package.json`) | `package.json` L14–L66 |
| Auth session state | React **Context** (`AuthProvider` / `AuthContext`) | `components/auth-provider.tsx` L15–L22, L24–L26 |
| Theme | `next-themes` | `package.json` L55 |

### 1.5 Backend

| Item | Value | Evidence |
|------|-------|----------|
| Backend style | **Next.js App Router Route Handlers** (server) | `app/api/**/route.ts` files |
| Runtime (chat example) | Explicit **Node.js** runtime (not Edge) | `app/api/chat/route.ts` L3–L4 `export const runtime = 'nodejs'` |
| Separate Express/Nest server | **NOT FOUND IN REPO** | no Express/Nest deps; no `server.ts` app server |
| Backend code locations | Listed below | — |

| API route file | Purpose (from path/filename) |
|----------------|------------------------------|
| `app/api/chat/route.ts` | Chat API |
| `app/api/tts/route.ts` | TTS API |
| `app/api/tts/health/route.ts` | TTS health |
| `app/api/waitlist/route.ts` | Waitlist API |
| `app/api/weekly-exams/route.ts` | Weekly exams API |

Supporting server-adjacent libs (not HTTP servers): `lib/weekly-exam-store.ts`, `lib/firebase/*`, `scripts/sync-auth-domains.mjs`.

### 1.6 Database / data layer

| Item | Value | Evidence |
|------|-------|----------|
| ORM (Prisma / Drizzle / Mongoose) | **NOT FOUND IN REPO** | no matching deps in `package.json` |
| Database client | **Cloud Firestore** via Firebase JS SDK | `package.json` L51 `"firebase": "^12.16.0"`; `lib/firebase/app.ts` L2, L15–L18 `getFirestore` |
| DB connection / app init | `getFirebaseApp()` / `getFirebaseDb()` | `lib/firebase/app.ts` L8–L19 |
| Config source | `firebaseConfig` from env + hardcoded fallbacks | `lib/firebase/config.ts` L3–L22; consumed at `lib/firebase/app.ts` L3, L10 |
| Firestore rules file | `firestore.rules` (referenced by Firebase config) | `firebase.json` L2–L4 |
| Local JSON store (weekly exams) | `lib/weekly-exam-store.ts` + `data/weekly-exam-schedules.json` | filesystem listing; store module under `lib/` |

🟡 **NOTE — Client Firebase web config embeds fallback literals** in `lib/firebase/config.ts` L4–L21 (`NEXT_PUBLIC_FIREBASE_*` with `??` string defaults). Values are **not printed here**. These are client-oriented Firebase web config fields (typically considered public identifiers), but committing fallbacks in source increases leakage/rotation friction. Variable names involved: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`.

### 1.7 Auth

| Item | Value | Evidence |
|------|-------|----------|
| Auth library | **Firebase Auth** (`firebase/auth`) | `lib/firebase/client.ts` L2–L8 imports; `lib/firebase/auth.ts` L13–L15 |
| NextAuth / Auth.js / Clerk / Supabase Auth | **NOT FOUND IN REPO** | no matching deps in `package.json` |
| Auth UI / session bridge | `AuthProvider` uses `onAuthStateChanged` | `components/auth-provider.tsx` L11–L12, L36–L40 |
| Auth domain / emulator helpers | `lib/firebase/client.ts`, `authorized-domains.ts`, `scripts/sync-auth-domains.mjs` | filesystem + imports |

### 1.8 Hosting / deploy config

| Item | Value | Evidence |
|------|-------|----------|
| Vercel project config | `vercel.json` present; rewrites tutor paths to `ai-ra-app.vercel.app` | `vercel.json` L1–L44 |
| Next config | `next.config.mjs` | entire file; rewrites in dev L54–L58; COOP header L60–L71 |
| Dockerfile / docker-compose | **NOT FOUND IN REPO** | `Test-Path Dockerfile` → False |
| Firebase tooling config | `firebase.json` (Firestore rules + emulators) | `firebase.json` L1–L14 |
| `.vercel/` directory | Present (deployment metadata) | filesystem listing |

🟡 **NOTE — TypeScript build errors ignored in Next config:** `next.config.mjs` L40–L42 `typescript.ignoreBuildErrors: true` can allow type-unsafe code into production builds.

### 1.9 CI/CD

| Item | Value | Evidence |
|------|-------|----------|
| `.github/workflows/*` | **NOT FOUND IN REPO** | `Test-Path .github` → False; glob workflows → 0 files |
| Other CI configs (Circle, GitLab CI, etc.) | **NOT FOUND IN REPO** (not observed at root) | root listing |

### 1.10 Notable scripts (package.json)

| Script | Command | Evidence |
|--------|---------|----------|
| `dev` | `next dev --webpack --port 3000 --hostname localhost` | `package.json` L6 |
| `build` | `next build` | `package.json` L8 |
| `postbuild` | `node scripts/sync-auth-domains.mjs` | `package.json` L9 |
| `start` | `next start` | `package.json` L10 |
| `lint` | `eslint .` | `package.json` L11 |

### 1.11 Folder structure (2–3 levels; excluding `node_modules`, `.next`, `.git`)

```
/
├── .vercel/
│   ├── project.json
│   └── README.txt
├── app/
│   ├── about/page.tsx
│   ├── api/
│   │   ├── chat/
│   │   ├── tts/ (+ health/)
│   │   ├── waitlist/
│   │   └── weekly-exams/
│   ├── assistant/page.tsx
│   ├── blog/page.tsx
│   ├── careers/page.tsx
│   ├── contact/page.tsx
│   ├── cookies/page.tsx
│   ├── forgot-password/page.tsx
│   ├── login/page.tsx
│   ├── pricing/page.tsx
│   ├── privacy/page.tsx
│   ├── signup/page.tsx
│   ├── terms/page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/          (Radix-based primitives)
│   └── *.tsx        (feature components: auth, hero, courses, etc.)
├── data/
│   └── weekly-exam-schedules.json
├── docs/
│   ├── AIra_Functional_Requirements_Document.md
│   ├── FRD.md
│   └── PRD.md
├── hooks/
│   ├── use-mobile.ts
│   └── use-toast.ts
├── lib/
│   ├── firebase/
│   │   ├── app.ts
│   │   ├── auth.ts
│   │   ├── authorized-domains.ts
│   │   ├── client.ts
│   │   ├── config.ts
│   │   ├── errors.ts
│   │   └── firestore.ts
│   ├── auth-redirect.ts
│   ├── learning-courses.ts
│   ├── session-hints.ts
│   ├── site.ts
│   ├── utils.ts
│   └── weekly-exam-store.ts
├── public/
│   ├── brand/
│   ├── images/
│   ├── logos/
│   ├── videos/
│   └── (favicons / manifest assets)
├── scripts/
│   ├── prepare-brand-assets.py
│   ├── prepare-logos.py
│   └── sync-auth-domains.mjs
├── styles/
│   └── globals.css
├── .env.example
├── .env.local          (exists on disk; contents not audited/printed here)
├── AUTH_UNIFICATION.md
├── components.json
├── eslint.config.mjs
├── firebase.json
├── firestore.rules
├── middleware.ts
├── next.config.mjs
├── package.json
├── pnpm-lock.yaml
├── postcss.config.mjs
├── tsconfig.json
└── vercel.json
```

Also present at root (non-dir): `counselor.mp4`, screenshots, `index.html`, `lint_output.txt`, `tsconfig.tsbuildinfo` — observed in listing; not expanded further in this phase.

### 1.12 Phase 1 security flags (observed during inventory)

| Severity | Finding | Evidence |
|----------|---------|----------|
| 🟡 NOTE | Firebase web config uses `NEXT_PUBLIC_*` env vars **with hardcoded fallback literals** in source (client-exposed by design of `NEXT_PUBLIC_`). | `lib/firebase/config.ts` L3–L22 |
| 🟡 NOTE | `typescript.ignoreBuildErrors: true` weakens compile-time safety for production builds. | `next.config.mjs` L40–L42 |
| 🟡 NOTE | Deploy rewrites send `/student|/teacher|/admin|/dev` traffic to an **external** Vercel host; that app’s code is outside this repo. | `vercel.json` L17–L42 |

---

## 2. Route & Button Map

**Phase date:** 2026-08-10  
**Scope:** This landing repo only (`app/**/page.tsx`). Tutor routes rewritten in `vercel.json` are destinations, not page files in this repo.

### 2.1 Every `app/**/page.tsx` → URL path

| URL path | Page file |
|----------|-----------|
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

- **`pages/**/*.tsx`:** **NOT FOUND IN REPO** (App Router only).
- **Home composition:** `app/page.tsx` L22–L38 mounts `Header`, `Hero`, `Features`, `Courses`, `HowItWorks`, `CTA`, `Footer`, `PricingModal`, `ContactModal`, `FloatingAssistant`.

### 2.2 Canonical CTA / audience constants (`lib/site.ts`)

| Constant | Label / use | Destination | Evidence |
|----------|-------------|-------------|----------|
| `CTAS.primary` | Start Free Trial | `/signup` | `lib/site.ts` L3–L6 |
| `CTAS.secondary` | Book a Demo | `/contact` | `lib/site.ts` L8–L11 |
| `EXTERNAL.schools.loginHref` | For Schools (logged out) | `/login?intent=school` | `lib/site.ts` L41–L44 |
| `EXTERNAL.schools.href` | Schools portal fallback | `/student/mode-selection` | `lib/site.ts` L45–L46 |
| `EXTERNAL.professionals.loginHref` | (defined) | `/login?intent=professional` | `lib/site.ts` L49–L50 |
| `EXTERNAL.professionals.href` | External portal URL | `https://aira-edtech-f063e.web.app/` | `lib/site.ts` L51 |
| `SOCIAL.instagram.href` | Instagram | `https://www.instagram.com/aira_ai_tutor` | `lib/site.ts` L57–L59 |
| `SOCIAL.x.href` | X | `https://x.com/aira_ai_tutor` | `lib/site.ts` L61–L63 |

**Role homes after auth (when logged-in CTAs resolve via Firestore role):** `lib/auth-redirect.ts` L5–L8 — student `/student/mode-selection`, teacher `/teacher/dashboard`, admin `/admin/dashboard`.

### 2.3 Shared navigation components (behavior)

| Component | Behavior | Evidence |
|-----------|----------|----------|
| `AuthEntryLink` | Logged out → `next/link` to `href`; logged in → `window.location.assign(portalHref)` to role home | `components/auth-entry-link.tsx` L45–L80 |
| `AudienceNavLink` `schools` | Logged out → `Link` to `EXTERNAL.schools.loginHref`; logged in → full assign to `homeForRole(role)` (starts as `EXTERNAL.schools.href`) | `components/audience-nav-link.tsx` L36–L89 |
| `AudienceNavLink` `professionals` | **Always** opens `ComingSoonModal` (button); does **not** navigate to professional portal from this control | `components/audience-nav-link.tsx` L22–L24 comment, L47–L64 |
| `ComingSoonModal` submit | `POST /api/waitlist` with `courseId: 'professional-learning'` | `components/coming-soon-modal.tsx` L34–L41 |
| `WaitlistModal` submit | `POST /api/waitlist` with course id/name props | `components/waitlist-modal.tsx` L40–L43 |

### 2.4 Master table — Section → Component → Buttons → Destination

| Section | Component file | Control | On click | Destination / effect |
|---------|----------------|---------|----------|----------------------|
| Header | `components/header.tsx` | Logo | `Link` | Home: `#home` (L61); else `/` (L61) |
| Header | `components/header.tsx` | Features / Courses / How it works | `<a href>` | Home: `#features` / `#courses` / `#how-it-works` (L16–L19, L70–L76); off-home: `/#…` via `hashHref` (L36, L72) |
| Header | `components/header.tsx` | Pricing | `Link` | `/pricing` (L79–L84) |
| Header | `components/header.tsx` | For Schools | `AudienceNavLink` schools | Logged out: `/login?intent=school` (`lib/site.ts` L44 + `audience-nav-link.tsx` L87); logged in: role home via `window.location.assign` (L71–L77) |
| Header | `components/header.tsx` | For Professionals | `AudienceNavLink` professionals | Opens **Coming Soon modal** (waitlist), not a route (`audience-nav-link.tsx` L47–L64; header L94–L100) |
| Header | `components/header.tsx` | Log in | `AuthEntryLink` | Logged out: `/login` (L117); logged in: role home assign |
| Header | `components/header.tsx` | Start Free Trial | `AuthEntryLink` | Logged out: `/signup` via `CTAS.primary.href` (L124); logged in: role home |
| Header | `components/header.tsx` | Mobile menu toggle | `setMobileOpen` | UI only (L128–L131) |
| Hero | `components/hero.tsx` | Start Free Trial | `AuthEntryLink` | Logged out: `/signup` (L87–L88); logged in: role home |
| Hero | `components/hero.tsx` | Book a Demo | `Link` | `/contact` (L90–L91) |
| Features | `components/features.tsx` | Glass play controls | `onClick={start}` | Starts **in-section video demo** (L339, L442) — not a route navigation |
| Courses | `components/learning-course-card.tsx` | Notify Me | Opens `WaitlistModal` | Waitlist form → `POST /api/waitlist` when `course.available === false` (L244–L266) |
| Courses | `components/learning-course-card.tsx` | Explore Course (school, logged out) | `Link` | `/login?intent=school` (`exploreHref` L78–L79, L312–L328) |
| Courses | `components/learning-course-card.tsx` | Explore Course (school, logged in) | `window.location.assign` | `/student/mode-selection` (`EXTERNAL.schools.href`, L84–L86, L289–L294) |
| Courses | `components/learning-course-card.tsx` | Explore Course (professional, logged in, available) | `<a target=_blank>` | `https://aira-edtech-f063e.web.app/` (L81–L83, L268–L288) |
| How it works | `components/how-it-works.tsx` | — | — | **No** `href` / `Link` / `onClick` navigation matches in file (grep) |
| CTA band | `components/cta.tsx` | Start Free Trial | `AuthEntryLink` → `/signup` | L71–L78 |
| CTA band | `components/cta.tsx` | View Pricing | `onClick={onPricingClick}` | Opens `PricingModal` on home (`app/page.tsx` L28–L34; `cta.tsx` L80–L87) |
| Footer | `components/footer.tsx` | Logo | `Link` | `/` (L36) |
| Footer | `components/footer.tsx` | Instagram / X icons + Connect list | external `<a>` | `SOCIAL.*` URLs, `target="_blank"` (L48–L65, L165–L184) |
| Footer | `components/footer.tsx` | Features / Courses | `<a href>` | `#features`, `#courses` (L75–L104) |
| Footer | `components/footer.tsx` | For Schools / For Professionals | `AudienceNavLink` | Same as header (L83–L96) |
| Footer | `components/footer.tsx` | Pricing | `Link` | `/pricing` (L107–L112) |
| Footer | `components/footer.tsx` | About / Blog / Careers | `Link` | `/about`, `/blog`, `/careers` (L123–L144) |
| Footer | `components/footer.tsx` | Contact Us | `button` `onContactClick` | Opens `ContactModal` on home (`app/page.tsx` L29, L37; `footer.tsx` L147–L154) |
| Footer | `components/footer.tsx` | Get in touch | `Link` | `/contact` via `CTAS.secondary.href` (L189–L194) |
| Footer | `components/footer.tsx` | Terms / Privacy / Cookies | `Link` | `/terms`, `/privacy`, `/cookies` (L209–L216) |
| Floating assistant | `components/floating-assistant.tsx` | Orb button | `setIsOpen(true)` | Opens lazy-loaded `AiAssistant` modal UI (L124–L128) — not a route |
| Pricing page | `app/pricing/page.tsx` | Plan CTAs | `Link` to `plan.cta.href` | Simple/Pro → `CTAS.primary` `/signup`; Enterprise → `CTAS.secondary` `/contact` (plans L21–L60, Link L128–L137) |
| Pricing modal | `components/pricing-modal.tsx` | Start Free / Get Started / Contact Us | `button` `onClick` | **Only** `enterprise` calls `onContactClick?.()` (L249–L254). Simple/Pro branches do **not** navigate |
| Blog | `app/blog/page.tsx` | Start a free trial / book a demo | `Link` | `/signup`, `/contact` (L24–L36) |
| Careers | `app/careers/page.tsx` | careers@aira.example | `mailto:` | `mailto:careers@aira.example?subject=Careers%20at%20Aira` (L24–L28) |
| Contact page | `app/contact/page.tsx` | Start Free Trial link | `Link` | `CTAS.primary.href` `/signup` (grep L33) |
| Contact page | `app/contact/page.tsx` | hello@aira.example | `mailto:` | L44 area |
| Static shell | `components/static-page-shell.tsx` | Secondary CTA | `Link` | `CTAS.secondary.href` `/contact` (grep L38) |

### 2.5 Requested CTA checklist (landing)

| CTA label | File + component | Click behavior | Destination / params |
|-----------|------------------|----------------|----------------------|
| Start Free Trial | `hero.tsx`, `header.tsx`, `cta.tsx` via `AuthEntryLink` / label from `CTAS.primary` | Route (`Link`) or role-home assign if logged in | `/signup` (`lib/site.ts` L5) |
| Book a Demo | `hero.tsx` | `Link` | `/contact` |
| For Schools | `header.tsx` / `footer.tsx` → `AudienceNavLink` | Login link or full nav to tutor | `/login?intent=school` or role home |
| For Professionals | `header.tsx` / `footer.tsx` → `AudienceNavLink` | **Modal** (Coming Soon + waitlist) | No live product route from this button |
| Explore Course | `learning-course-card.tsx` | Link / assign / external | `/login?intent=school`, `/student/mode-selection`, or external professional URL (if available+logged in) |
| Notify Me | `learning-course-card.tsx` | Modal + form submit | `POST /api/waitlist` (functional capture) |
| Get in touch | `footer.tsx` | `Link` | `/contact` |
| Pricing | `header.tsx`, `footer.tsx` | `Link` | `/pricing` |
| About / Blog / Careers | `footer.tsx` | `Link` | `/about`, `/blog`, `/careers` |
| Terms / Privacy / Cookies | `footer.tsx` | `Link` | `/terms`, `/privacy`, `/cookies` |
| Social icons | `footer.tsx` | External new tab | Instagram / X URLs in `lib/site.ts` |

### 2.6 Grep coverage notes (navigation primitives)

Observed in-repo usages include:

- `next/link` / `<Link` — header, hero, footer, auth pages, pricing, blog, course cards, etc.
- `window.location.assign` — `auth-entry-link.tsx` L53, `audience-nav-link.tsx` L77, `learning-course-card.tsx` L294, login/signup pages, `social-login.tsx` L95, `user-profile-menu.tsx` L127
- `useRouter` — `components/social-login.tsx` L4, L77
- `NextResponse.redirect` — `middleware.ts` L15 (127.0.0.1 → localhost host rewrite)
- `window.location.replace` — `components/auth-domain-guard.tsx` L15

### 2.7 Placeholder / partial UX flags

| Severity | Finding | Evidence |
|----------|---------|----------|
| 🟡 NOTE | **For Professionals** does not open the live professional portal from nav; it always opens Coming Soon / waitlist. | `audience-nav-link.tsx` L22–L24, L47–L64 |
| 🟡 NOTE | **Notify Me** is functional for waitlist capture, but does **not** unlock a course product in-app (`available: false` professional courses in `lib/learning-courses.ts` L537+). | `learning-course-card.tsx` L244–L266; course data `available: false` |
| 🟡 NOTE | **PricingModal** “Start Free” / “Get Started” buttons perform **no navigation** for Simple/Pro — only Enterprise calls `onContactClick`. | `pricing-modal.tsx` L249–L254 |
| 🟡 NOTE | **Blog** page is explicitly “Coming soon” with only trial/demo links. | `app/blog/page.tsx` L14–L16, L24–L36 |
| 🟡 NOTE | **Careers** uses placeholder inbox `careers@aira.example` (labeled placeholder in UI). | `app/careers/page.tsx` L24–L32 |
| 🟡 NOTE | Footer hash links `#features` / `#courses` assume home page anchors; on non-home pages they stay on-page fragments (unlike header which uses `/${hash}` off-home). | `footer.tsx` L75–L104 vs `header.tsx` L36 |
| 🟡 NOTE | CTA copy claims “14 days free access” / “No credit card required” with **no** billing integration found in this phase’s navigation map. | `cta.tsx` L91–L94 |

### 2.8 Destinations outside this repo’s `page.tsx` files

These paths are linked/assigned from landing UI but are **not** implemented as `app/**/page.tsx` here (served via rewrite to tutor host per Phase 1 / `vercel.json`):

- `/student/mode-selection` (and other `/student|/teacher|/admin` role homes)
- External: `https://aira-edtech-f063e.web.app/`

Tutor page source: **NOT FOUND IN REPO**.

---

## 3. Auth Flow

**Phase date:** 2026-08-10  
**Scope:** Landing repo auth UI + Firebase client SDK. Tutor `RoleGuard` / JWT issuance: **NOT FOUND IN REPO**.

### 3.1 Route files & component tree

#### `/login` — `app/login/page.tsx`

```
LoginPage (L35–L40)
  └─ Suspense
       └─ LoginPageContent (L43+)
            ├─ hooks: useSearchParams (L44), useAuth (L52), useState/useEffect/useRef
            ├─ AuthShell (layout chrome) — components/auth-shell.tsx
            ├─ <form onSubmit={handleLogin}> (L162) — inline form (no separate Form component)
            │    └─ Input / Label (components/ui/*)
            └─ SocialLogin — components/social-login.tsx
                 └─ signInWithGoogle | Apple | Microsoft — lib/firebase/auth.ts
```

Global wrappers (all pages): `app/layout.tsx` L55–L56 → `AuthDomainGuard` + `AuthProvider` (`components/auth-provider.tsx`).

#### `/signup` — `app/signup/page.tsx`

```
SignupPage (L34–L39)
  └─ Suspense
       └─ SignupPageContent (L42+)
            ├─ hooks: useSearchParams (L43), useAuth (L45), useState/useEffect/useRef
            ├─ AuthShell
            ├─ <form onSubmit={handleSignup}> (L130) — inline form
            │    ├─ role <select> student|teacher (L166–L175)
            │    └─ PasswordStrength — components/password-strength.tsx
            └─ SocialLogin
```

#### Related (password reset)

- `/forgot-password` → `app/forgot-password/page.tsx` → `resetPassword(email)` → `sendPasswordResetEmail` (`lib/firebase/auth.ts` L198–L205).

### 3.2 Submit path (client)

#### Validation

| Check | Library | Evidence |
|-------|---------|----------|
| Email/password required | HTML `required` + `type="email"` | `app/login/page.tsx` L167–L175, L192–L200; signup L135–L158, L197–L205 |
| Password match / min length | **Manual** in `handleSignup` | `app/signup/page.tsx` L87–L94 (`!==`, `length < 6`) |
| Password strength UI | Custom scorer (display only; does not block submit) | `components/password-strength.tsx` L9–L18, L35–L54 |
| Zod / Yup / React Hook Form on login/signup | **NOT FOUND IN REPO** for these pages | no imports in `app/login/page.tsx` / `app/signup/page.tsx` |

#### What is called on submit

| Flow | Call | Target |
|------|------|--------|
| Login | `await signInWithEmail(email, password)` | `app/login/page.tsx` L134 → `lib/firebase/auth.ts` L161–L171 → Firebase `signInWithEmailAndPassword` |
| Signup | `await signUpWithEmail({ name, email, password, dateOfBirth, role })` | `app/signup/page.tsx` L98–L104 → `lib/firebase/auth.ts` L132–L158 → Firebase `createUserWithEmailAndPassword` then `updateProfile` + Firestore `setDoc` |
| Social | `signInWithPopup` via provider helpers | `components/social-login.tsx` L87–L91 → `lib/firebase/auth.ts` L114–L129 |

- **Next.js Server Action for login/signup:** **NOT FOUND IN REPO**
- **`app/api/**` auth route handler for login/signup:** **NOT FOUND IN REPO**
- **Mechanism:** **External auth provider — Firebase Auth** (client SDK), plus Firestore profile write on signup/OAuth (`lib/firebase/auth.ts` L29–L56, L143–L150)

There is **no** `fetch('/api/login')` / axios auth endpoint in this flow.

### 3.3 Password handling & session

#### Password hashing in this repo

| Search | Result |
|--------|--------|
| `bcrypt` / `argon2` / `scrypt` / `crypto.pbkdf2` / `md5` / `sha1` password hashing | **NOT FOUND IN REPO** |
| Password field written to Firestore profile | **NOT FOUND** — `saveUserProfile` payload is `uid`, `name`, `email`, `dateOfBirth`, `provider`, `role?`, timestamps only (`lib/firebase/auth.ts` L35–L54) |

Passwords are passed to Firebase Auth APIs:

- Signup: `createUserWithEmailAndPassword(auth, email, password)` — `lib/firebase/auth.ts` L137–L141  
- Login: `signInWithEmailAndPassword(auth, email, password)` — `lib/firebase/auth.ts` L167  

Hashing algorithm, salt rounds, and password storage format are **NOT FOUND IN REPO** (handled by **Firebase Auth hosted service**). No evidence in this codebase of plaintext password persistence to Firestore or local DB.

🟡 **NOTE:** Client receives the password in React state and sends it to Firebase over the network; transport/storage security of the password at rest is **NOT FOUND IN REPO** (Firebase-side).

#### Session / token mechanism after login

| Item | Finding | Evidence |
|------|---------|----------|
| App-issued JWT library (`jsonwebtoken`, `jose`, etc.) | **NOT FOUND IN REPO** | grep |
| Custom session cookie (httpOnly/secure/sameSite set by this app) | **NOT FOUND IN REPO** | no session cookie setters in auth modules |
| Provider session | **Firebase Auth** client persistence | `lib/firebase/client.ts` L56–L58 `initializeAuth` + `indexedDBLocalPersistence` |
| Auth state in React | `onAuthStateChanged` → `AuthProvider` memory state | `components/auth-provider.tsx` L36–L40 |

Firebase ID token cookie/header details (names, httpOnly flags): **NOT FOUND IN REPO** (SDK/internal / hosted behavior).

#### Client-side storage related to auth

| Storage | What | Auth credential? | Evidence |
|---------|------|------------------|----------|
| **IndexedDB** (via Firebase `indexedDBLocalPersistence`) | Firebase Auth session persistence | Yes (Firebase-managed session) | `lib/firebase/client.ts` L4, L56–L58 |
| **localStorage** `aira:role` | Role **hint** only | No — documented as hint; verified against Firestore / tutor RoleGuard (tutor code **NOT FOUND IN REPO**) | `lib/session-hints.ts` L1–L10, L19, L56–L57; written `app/login/page.tsx` L66, `app/signup/page.tsx` L61 |
| **localStorage** `aira:student-home` | Student home hint | No | `lib/session-hints.ts` L20, L61–L67 |

🟡 **NOTE:** Role hint in `localStorage` is XSS-writable, but comments state it is not an access token (`lib/session-hints.ts` L7–L10). Tampering can affect **redirect destination**, not Firebase identity.  
🟠 **WARNING:** Landing `middleware.ts` does **not** validate Firebase session for protected app areas; enforcement of `/student|/teacher|/admin` is delegated to the rewritten tutor SPA (**NOT FOUND IN REPO**). Compromised hints + missing landing guards increase reliance on tutor-side checks.

No app code found putting a JWT/access token string into `localStorage` for login.

### 3.4 Middleware / route guards

#### `middleware.ts`

Exact check (hostname only — **not** auth):

```11:18:middleware.ts
export function middleware(request: NextRequest) {
  const hostname = request.nextUrl.hostname

  if (shouldRedirectToLocalhost(hostname)) {
    return NextResponse.redirect(localhostRedirectUrl(request.nextUrl))
  }

  return NextResponse.next()
}
```

Matcher excludes `api/` and static assets (`middleware.ts` L21–L28).

#### Landing-page auth gating

- Login/signup are public `'use client'` pages; already-signed-in users auto-continue via `goAfterAuth` (`app/login/page.tsx` L100–L105; `app/signup/page.tsx` L76–L80).
- **No** Next middleware check that `request.auth` / cookie proves login for marketing or tutor paths in this repo.

#### Firestore security rules (identity-bound profile access)

```5:7:firestore.rules
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
```

🔴 **CRITICAL — privilege escalation risk:** `users/{userId}` allows any authenticated user to **write their own document with no field allowlist**. A client can `setDoc`/`update` `role: 'admin'` (or other fields). App signup coerces admin→student (`lib/firebase/auth.ts` L148–L149), but **rules do not enforce** that. Post-auth routing trusts Firestore role via `getUserAppRole` (`lib/firebase/auth.ts` L60–L63).

### 3.5 `intent=school` / related query params

Read in `LoginPageContent` (`app/login/page.tsx`):

| Param | Read | Effect |
|-------|------|--------|
| `intent` | L45 `searchParams.get('intent')` | If key exists in `LOGIN_INTENT_COPY`, replaces subtitle copy (L49–L50, L157–L159). For `school`, copy is “Signing in to access school tools” (`lib/site.ts` L68–L69) |
| `intent` → portal | L51 `portalHrefForIntent(intent)` | **`school` returns `null`** — only `professional` maps to external portal (`lib/site.ts` L77–L81). So **`intent=school` does not change post-login destination** |
| `redirect` | L46 | Passed into `resolvePostAuthPath` if role-matched (`app/login/page.tsx` L68–L72; sanitization `lib/auth-redirect.ts` L32–L50, L82–L95) |
| `signedOut=1` | L48 | Forces `logOut()` + clears role hint before showing form (L87–L94, L143–L146) |

Post-login for school intent (no external portal): same as normal — `resolveRoleForRedirect` + `resolvePostAuthPath` + `window.location.assign(dest)` (`app/login/page.tsx` L60–L73).

### 3.6 Environment variables in the auth flow

| Variable name | Where referenced | Classification |
|---------------|------------------|----------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `lib/firebase/config.ts` L5 | **CLIENT-EXPOSED** (`NEXT_PUBLIC_` + client Firebase config) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `lib/firebase/config.ts` L8 | **CLIENT-EXPOSED** |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `lib/firebase/config.ts` L11; `lib/firebase/authorized-domains.ts` L4; `scripts/sync-auth-domains.mjs` L17 | **CLIENT-EXPOSED** (also read in postbuild script) |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `lib/firebase/config.ts` L13 | **CLIENT-EXPOSED** |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `lib/firebase/config.ts` L16 | **CLIENT-EXPOSED** |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `lib/firebase/config.ts` L18 | **CLIENT-EXPOSED** |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | `lib/firebase/config.ts` L21 | **CLIENT-EXPOSED** |
| `NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST` | `lib/firebase/client.ts` L22 | **CLIENT-EXPOSED** |
| `NEXT_PUBLIC_USE_FIREBASE_EMULATOR` | `lib/firebase/client.ts` L23 | **CLIENT-EXPOSED** |
| `NEXT_PUBLIC_AUTH_GOOGLE` | `components/social-login.tsx` L30–L35 | **CLIENT-EXPOSED** |
| `NEXT_PUBLIC_AUTH_APPLE` | `components/social-login.tsx` L32 | **CLIENT-EXPOSED** |
| `NEXT_PUBLIC_AUTH_MICROSOFT` | `components/social-login.tsx` L33 | **CLIENT-EXPOSED** |
| `NEXT_PUBLIC_SITE_URL` | `lib/firebase/authorized-domains.ts` L15; sync script | **CLIENT-EXPOSED** naming; used for authorized domain list |
| `NEXT_PUBLIC_VERCEL_URL` | `lib/firebase/authorized-domains.ts` L16; sync script | **CLIENT-EXPOSED** naming |
| `VERCEL_URL` | `lib/firebase/authorized-domains.ts` L14; `scripts/sync-auth-domains.mjs` L29 | **SERVER-ONLY** (no `NEXT_PUBLIC_`; used in middleware-adjacent domain helper / postbuild) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | `scripts/sync-auth-domains.mjs` L6, L45 | **SERVER-ONLY** (postbuild domain sync) |
| `GOOGLE_APPLICATION_CREDENTIALS` | `scripts/sync-auth-domains.mjs` L57 | **SERVER-ONLY** |
| `VERCEL` | `scripts/sync-auth-domains.mjs` L133 | **SERVER-ONLY** |
| `CI` | `scripts/sync-auth-domains.mjs` L133 | **SERVER-ONLY** |

Hardcoded Firebase config fallbacks also exist in `lib/firebase/config.ts` (values not printed) — see Phase 1 🟡 NOTE.

### 3.7 Auth flow security summary

| Severity | Finding | Evidence |
|----------|---------|----------|
| 🔴 CRITICAL | Firestore `users/{userId}` write rule allows unrestricted self-write; `role` not constrained → client can escalate to `admin` in profile used for routing | `firestore.rules` L5–L7; role read `lib/firebase/auth.ts` L60–L63 |
| 🟠 WARNING | No landing middleware auth gate for tutor path prefixes; protection depends on external tutor app | `middleware.ts` L11–L18; tutor guards **NOT FOUND IN REPO** |
| 🟡 NOTE | Passwords never hashed in-app; delegated to Firebase Auth (algorithm **NOT FOUND IN REPO**) | `lib/firebase/auth.ts` L137–L141, L167; no bcrypt/etc. |
| 🟡 NOTE | Auth session persisted via Firebase IndexedDB persistence, not app JWT in localStorage | `lib/firebase/client.ts` L56–L58 |
| 🟡 NOTE | `intent=school` only changes login copy; does not change redirect target | `app/login/page.tsx` L49–L51; `lib/site.ts` L77–L81 |
| 🟡 NOTE | Signup min password length 6 matches Firebase default-style check in UI only | `app/signup/page.tsx` L91–L94 |

### 3.8 End-to-end sequence (email login)

1. User submits form → `handleLogin` (`app/login/page.tsx` L129–L140)  
2. `signInWithEmail` → Firebase Auth (`lib/firebase/auth.ts` L161–L171)  
3. On success → `goAfterAuth(uid)` (L60–L73): optional external portal; else resolve role (Firestore/hint) → write `aira:role` → `window.location.assign(dest)`  
4. Session survives reload via IndexedDB persistence (`lib/firebase/client.ts` L56–L58) + `AuthProvider` subscription (`components/auth-provider.tsx` L36–L40)

---

## 4. API & Integrations

**Phase date:** 2026-08-10  
**Scope:** This landing repo only. Tutor outbound APIs: **NOT FOUND IN REPO**.

### 4.1 Internal API routes & server actions

#### Server Actions

`"use server"` / Server Actions: **NOT FOUND IN REPO** (grep over `*.ts`/`*.tsx`).

#### App Router route handlers

| Method | Path | Purpose | Handler file |
|--------|------|---------|--------------|
| `POST` | `/api/chat` | Stream AI counselor replies via Groq | `app/api/chat/route.ts` L33+ |
| `POST` | `/api/tts` | Text-to-speech via Sarvam (WAV/JSON) | `app/api/tts/route.ts` L63+ |
| `GET` | `/api/tts/health` | Report whether Sarvam key is configured | `app/api/tts/health/route.ts` L7–L17 |
| `OPTIONS` | `/api/tts/health` | CORS preflight (`Access-Control-Allow-Origin: *`) | `app/api/tts/health/route.ts` L20–L28 |
| `POST` | `/api/waitlist` | Persist course waitlist email to Firestore | `app/api/waitlist/route.ts` L5–L53 |
| `GET` | `/api/weekly-exams` | List weekly exam sessions (published; `?all=1` needs bridge secret) | `app/api/weekly-exams/route.ts` L37–L57 |
| `POST` | `/api/weekly-exams` | Upsert weekly exam session (bridge secret required) | `app/api/weekly-exams/route.ts` L61–L89 |

Auth on these routes:

| Route | Auth / abuse gate in handler |
|-------|------------------------------|
| `/api/chat` | **None** (only checks `GROQ_API_KEY` present) — `app/api/chat/route.ts` L35–L40 |
| `/api/tts` | **None** (only checks `SARVAM_API_KEY`) — `app/api/tts/route.ts` L65–L70 |
| `/api/tts/health` | **None** — L7–L17 |
| `/api/waitlist` | **None** (email format + course fields only) — L19–L28 |
| `/api/weekly-exams` GET published | **None** — L40–L48 |
| `/api/weekly-exams` GET `?all=1` / POST | Shared bridge secret header/body — L41–L46, L73–L78 |

Non-route write path (not under `/api`):

| Surface | Mechanism | File |
|---------|-----------|------|
| Contact / demo form | Client Firestore `addDoc` via `saveContactMessage` | `components/contact-form.tsx` L1 (`'use client'`), L28–L30; `lib/firebase/firestore.ts` L17–L22 |

### 4.2 Third-party / outbound integrations

| Integration | Init / call site | Env var for key | Exposure | Used for |
|-------------|------------------|-----------------|----------|----------|
| **Groq** Chat Completions | Outbound `fetch('https://api.groq.com/openai/v1/chat/completions')` in `app/api/chat/route.ts` L58–L74; key read L35 | `GROQ_API_KEY` | **SERVER-ONLY** (no `NEXT_PUBLIC_`; used in Route Handler) | AI counselor streaming |
| **Sarvam AI** TTS | Outbound `fetch('https://api.sarvam.ai/text-to-speech')` in `app/api/tts/route.ts` L85–L91; key L65 | `SARVAM_API_KEY` | **SERVER-ONLY** (Route Handler) | TTS audio |
| **Firebase App** | `initializeApp(firebaseConfig)` — `lib/firebase/app.ts` L1, L10 | `NEXT_PUBLIC_FIREBASE_*` (+ hardcoded fallbacks in config) | **CLIENT-EXPOSED** (`NEXT_PUBLIC_` + imported from client modules / `'use client'` auth & contact) | Auth, Firestore, Analytics |
| **Firebase Auth** | `initializeAuth` / providers — `lib/firebase/client.ts`, `lib/firebase/auth.ts` | Same Firebase public config | **CLIENT-EXPOSED** | Signup/login/OAuth/reset |
| **Cloud Firestore** | `getFirestore` — `lib/firebase/app.ts` L15–L18; writes in `lib/firebase/firestore.ts`, `lib/firebase/auth.ts` | Same | **CLIENT-EXPOSED** client SDK | Profiles, waitlist (also from API route), contact |
| **Firebase Analytics** | `getAnalytics(getFirebaseApp())` — `lib/firebase/client.ts` L9, L81; triggered from `AuthProvider` | `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (via config) | **CLIENT-EXPOSED** | Product analytics |
| **Vercel Analytics** | `<Analytics />` from `@vercel/analytics/next` — `app/layout.tsx` L3, L57 | **NOT FOUND IN REPO** as explicit env key for this package | Client-injected by Vercel Analytics component | Web analytics |
| **Firebase Identity Toolkit / Admin REST** (authorized domains sync) | `fetch` with Bearer token — `scripts/sync-auth-domains.mjs` L86+, L101+ | `FIREBASE_SERVICE_ACCOUNT_JSON`, `GOOGLE_APPLICATION_CREDENTIALS` | **SERVER-ONLY** (postbuild script) | Sync Firebase authorized domains |
| **HeyGen LiveAvatar** | Dependency only `@heygen/liveavatar-web-sdk` — `package.json` L15 | `HEYGEN_API_KEY` may exist in local env files — **not referenced in TS/JS source** (Phase 1) | N/A (unused in code) | **Unused** |
| **OpenAI / Stripe / Resend / SendGrid / Twilio / PostHog / Segment / Supabase SDK** | **NOT FOUND IN REPO** as integrations | — | — | — |

#### Client → internal API (same origin)

| Caller (`'use client'`) | Calls | Evidence |
|-------------------------|-------|----------|
| `components/ai-assistant.tsx` | `fetch('/api/chat')`, `fetch('/api/tts')` | grep L724, L357 |
| `components/waitlist-modal.tsx` | `fetch('/api/waitlist')` | L40 |
| `components/coming-soon-modal.tsx` | `fetch('/api/waitlist')` | L34 |

These client files do **not** embed Groq/Sarvam keys; they hit server routes.

#### Weekly exam bridge secret env

| Var | File | Exposure |
|-----|------|----------|
| `WEEKLY_EXAM_BRIDGE_SECRET` | `app/api/weekly-exams/route.ts` L10 | Intended **SERVER-ONLY** |
| `NEXT_PUBLIC_WEEKLY_EXAM_BRIDGE_SECRET` | `app/api/weekly-exams/route.ts` L11 | **CLIENT-EXPOSED** by naming if set (bundled into any client import of this module is N/A — this file is a Route Handler; however naming invites putting the secret in a public env) |

🔴 **CRITICAL:** Fallback bridge secret string is **hardcoded in source** when env vars are unset: `app/api/weekly-exams/route.ts` L9–L12 (`'aira_weekly_bridge_v1'`). Value quoted only as the literal present in code (it is a shared secret for admin upsert / `?all=1`).

### 4.3 Hardcoded secrets / keys in source

| Severity | Finding | Evidence |
|----------|---------|----------|
| 🔴 CRITICAL | Hardcoded weekly-exam bridge secret fallback (not from env) | `app/api/weekly-exams/route.ts` L12 |
| 🔴 CRITICAL | Hardcoded Firebase web `apiKey` fallback string (and related config fallbacks) in source when env unset | `lib/firebase/config.ts` L4–L21 (values **not reprinted** here beyond noting `apiKey` fallback exists at L6) |

No Groq/Sarvam secret literals found hardcoded (those use `process.env` only).

### 4.4 `.env` / `.gitignore` / commit status

| Check | Result | Evidence |
|-------|--------|----------|
| `.gitignore` env pattern | Only `.env*.local` | `.gitignore` L11–L12 |
| Plain `.env` ignore rule | **Not listed** — a file named `.env` would **not** match `.env*.local` | `.gitignore` L12; `git check-ignore -v .env` produced no ignore rule |
| `.env` present on disk | **False** (not present at audit time) | `Test-Path .env` → False |
| `.env.local` present | **True** | `Test-Path .env.local` → True |
| `.env.local` tracked by git | **No** (`pathspec did not match`) | `git ls-files --error-unmatch .env.local` error |
| Tracked env template | `.env.example` **is committed** | `git ls-files ".env*"` → `.env.example` |
| `.env.example` contents | Documents Firebase public vars + social flags; comments for `FIREBASE_SERVICE_ACCOUNT_JSON`; **does not** document `GROQ_API_KEY` / `SARVAM_API_KEY` / weekly bridge secrets | `.env.example` L3–L25 |

🟠 **WARNING:** `.gitignore` does not ignore general `.env` (only `.env*.local`). Risk if someone creates/commits `.env` with secrets.

Full git history scan for leaked secrets: **NOT FOUND IN REPO tooling run this phase** beyond current index (`git ls-files`); deeper history archaeology not executed.

### 4.5 Rate limiting / abuse protection

| Surface | Protection found |
|---------|------------------|
| `POST /api/chat` | **NOT FOUND IN REPO** (no rate limit / CAPTCHA / auth) — cost abuse risk via Groq |
| `POST /api/tts` | **NOT FOUND IN REPO** — cost abuse risk via Sarvam |
| `POST /api/waitlist` | Email regex only — **no** rate limit (`app/api/waitlist/route.ts` L19–L28) |
| Contact / demo (`ContactForm`) | Client Firestore create — **no** rate limit in component (`components/contact-form.tsx`); Firestore rules create-only (`firestore.rules` L18–L24) |
| Signup / login | Firebase Auth provider limits: **NOT FOUND IN REPO** (hosted); app has no extra throttle |
| Keywords `rateLimit` / `upstash` / `arcjet` / etc. | **NOT FOUND IN REPO** |

| Severity | Finding | Evidence |
|----------|---------|----------|
| 🔴 CRITICAL | Unauthenticated public `POST /api/chat` and `POST /api/tts` proxy paid third-party APIs with no rate limiting in-app | `app/api/chat/route.ts` L33–L40; `app/api/tts/route.ts` L63–L70; rate-limit grep empty |
| 🟠 WARNING | Public waitlist + contact write paths lack app-level rate limiting / bot protection | waitlist route; `contact-form.tsx`; no rate-limit libs |
| 🟡 NOTE | `/api/tts/health` OPTIONS allows `Access-Control-Allow-Origin: *` | `app/api/tts/health/route.ts` L20–L27 |

### 4.6 Phase 4 summary flags

| Severity | Item |
|----------|------|
| 🔴 CRITICAL | Hardcoded weekly bridge secret fallback — `app/api/weekly-exams/route.ts` L12 |
| 🔴 CRITICAL | Hardcoded Firebase `apiKey` (and sibling) fallbacks — `lib/firebase/config.ts` L4–L21 |
| 🔴 CRITICAL | Public unmetered `/api/chat` + `/api/tts` cost/abuse exposure |
| 🟠 WARNING | `.gitignore` only covers `.env*.local`, not `.env` |
| 🟠 WARNING | `NEXT_PUBLIC_WEEKLY_EXAM_BRIDGE_SECRET` accepted as bridge secret source — `app/api/weekly-exams/route.ts` L11 |
| 🟡 NOTE | HeyGen SDK dependency unused; no TS client init found |
| 🟡 NOTE | `.env.example` omits `GROQ_API_KEY` / `SARVAM_API_KEY` / bridge secret names |

---

## 5. Component/Section Map

**Phase date:** 2026-08-10  
**Entry file:** `app/page.tsx` (`Home`, `'use client'` L1)

### 5.1 Render order on `/`

Exact children from `app/page.tsx` L21–L38:

| # | UI region | Component | Import | Props from `Home` |
|---|-----------|-----------|--------|-------------------|
| 1 | Top chrome | `Header` | L4 | **none** |
| 2 | Hero | `Hero` | L5 | **none** |
| 3 | Features (“Why Choose Aɪra”) | `Features` | L6 | **none** |
| 4 | Courses (School + Professional) | `Courses` | L7 | **none** |
| 5 | How it works | `HowItWorks` | L8 | **none** |
| 6 | Bottom CTA band | `CTA` | L9 | `onPricingClick={() => setPricingOpen(true)}` (L28) |
| 7 | Footer | `Footer` | L10 | `onContactClick={() => setContactOpen(true)}` (L29) |
| 8 | Overlay | `PricingModal` | L11 | `open`, `onClose`, `onContactClick` (L32–L36) |
| 9 | Overlay | `ContactModal` | L12 | `open`, `onClose` (L37) |
| 10 | Global FAB | `FloatingAssistant` | L13 | **none** |

**Parent state on `Home` only** (`app/page.tsx` L17–L18):

- `pricingOpen` / `setPricingOpen`
- `contactOpen` / `setContactOpen`

No React Context is created in `Home` itself. Shared auth comes from layout-level `AuthProvider` (`app/layout.tsx` — Phase 3).

`Courses` internally mounts **School Learning** then **Professional Learning** (`components/courses.tsx` L83–L84) — not separate top-level siblings of `Home`.

### 5.2 Per-section detail

#### Header — `components/header.tsx`

| Item | Detail | Evidence |
|------|--------|----------|
| Props from `Home` | None | `app/page.tsx` L22 `<Header />` |
| Local state | `mobileOpen`, `scrolled`, `prevPathname` | L23–L26 |
| Shared context | `useAuth()` → `user`, `authLoading`, `logOut` | L8, L28 |
| Data | Static `HASH_LINKS`; `CTAS` / `EXTERNAL` / `BRAND` from `@/lib/site` | L16–L20, L14 |
| Fetch/CMS | **None** | — |
| Notable children | `Button` (ui), `AudienceNavLink`, `AuthEntryLink`, `HeaderLogo`, `UserProfileMenu` | L7–L12 |

#### Hero — `components/hero.tsx`

| Item | Detail | Evidence |
|------|--------|----------|
| Props | None | `app/page.tsx` L24 |
| Section id | `id="home"` | L36–L37 |
| Data | In-file `floatingStats` built from `STATS`; copy from `CTAS`, `HERO_TRUST`, `BRAND` | L9–L31, L6 |
| Fetch/CMS | **None** (static image via `next/image`) | — |
| Children / shared | `AuthEntryLink`, `Link` (next), lucide icons | L2–L7 |

#### Features (“Why Choose Aɪra”) — `components/features.tsx`

| Item | Detail | Evidence |
|------|--------|----------|
| Props | None | `app/page.tsx` L25 |
| Section id | `id="features"` | L501–L502 |
| Heading | “Why Choose {BRAND.name}” | L549–L550 |
| Data | In-file `FEATURES` array (titles, descriptions, `/videos/*.mp4`) | L32–L40+ |
| Fetch/CMS | **None** | — |
| Internal children | `HeroExplainerCard`, `FeatureCard`, `GlassPlayButton` (same file) | L558–L563 |
| Shared across sections | `BRAND` from `@/lib/site`; `cn` from `@/lib/utils` | L19–L20 |

#### Courses shell — `components/courses.tsx`

| Item | Detail | Evidence |
|------|--------|----------|
| Props | None | `app/page.tsx` L26 |
| Section id | `id="courses"` | L9–L10 |
| Children | `SchoolLearning`, `ProfessionalLearning`, ui `Button` “Browse All Catalog” | L83–L92 |
| “Browse All Catalog” | `Button` with **no** `onClick` / `href` | L87–L92 |

🟡 **NOTE:** “Browse All Catalog” appears non-functional (no handler) — `components/courses.tsx` L87–L92.

##### School Learning — `components/school-learning.tsx` (inside Courses)

| Item | Detail | Evidence |
|------|--------|----------|
| Props from `Courses` | None | `courses.tsx` L83 |
| Local state | `grade`, `board`, `entered` | L16–L18 |
| Data | `schoolCourses` + filters from `@/lib/learning-courses` (static module data) | L6–L13, L21 |
| Fetch/CMS | **None** (client filter of imported arrays) | L21 |
| Shared children | `LearningCourseCard`, `FilterPill`, `CoursesEmptyState` | L4–L5 |

##### Professional Learning — `components/professional-learning.tsx` (inside Courses)

| Item | Detail | Evidence |
|------|--------|----------|
| Props from `Courses` | None | `courses.tsx` L84 |
| Local state | `level`, `format`, `entered` | L16–L18 |
| Data | `professionalCourses` + filters from `@/lib/learning-courses` | L6–L13, L21–L25 |
| Fetch/CMS | **None** | — |
| Shared children | Same card/filter components as School | L4–L5 |

#### How It Works — `components/how-it-works.tsx`

| Item | Detail | Evidence |
|------|--------|----------|
| Props | None | `app/page.tsx` L27 |
| Section id | `id="how-it-works"` | L121–L122 |
| Data | In-file `STEPS` array | L25–L35+ |
| Fetch/CMS | **None** | — |
| Shared | `BRAND`, `cn` | L11–L12 |

#### CTA — `components/cta.tsx`

| Item | Detail | Evidence |
|------|--------|----------|
| Props | `onPricingClick?: () => void` | L7–L11; wired L28 in `page.tsx` |
| Data | Hardcoded benefit bullets in JSX | L91–L94 |
| Fetch/CMS | **None** | — |
| Shared | ui `Button`, `AuthEntryLink` | L3–L5 |

#### Footer — `components/footer.tsx`

| Item | Detail | Evidence |
|------|--------|----------|
| Props | `onContactClick?: () => void` | L22–L26; wired L29 in `page.tsx` |
| Data | `CTAS`, `EXTERNAL`, `BRAND`, `SOCIAL` from `@/lib/site` | L7 |
| Fetch/CMS | **None** | — |
| Shared | `AudienceNavLink`, `BrandWordmark`, `Link` | L3–L6 |

#### PricingModal — `components/pricing-modal.tsx`

| Item | Detail | Evidence |
|------|--------|----------|
| Props | `open`, `onClose`, `onContactClick?` | L6–L10; `page.tsx` L32–L36 |
| Data | In-file `plans` array | L12+ |
| Fetch/CMS | **None** | — |
| Note | Does **not** import shared `Pricing` page plans or `ContactForm` | imports L1–L4 lucide only |

#### ContactModal — `components/contact-modal.tsx`

| Item | Detail | Evidence |
|------|--------|----------|
| Props | `open`, `onClose` | L6–L11; `page.tsx` L37 |
| Data | In-file `contactInfo` object (phone/email/address) | L16–L20 |
| Fetch/CMS | **None**; **does not** use `ContactForm` / Firestore | L1–L8 imports |
| Behavior | Copy-to-clipboard UI | L22–L26 |

🟡 **NOTE:** Home `ContactModal` is contact-info overlay, distinct from `/contact` page `ContactForm` (`components/contact-form.tsx`) which writes Firestore.

#### FloatingAssistant — `components/floating-assistant.tsx`

| Item | Detail | Evidence |
|------|--------|----------|
| Props | None | `page.tsx` L38 |
| Local state | `isOpen`, greeting tag, pulse | L13–L15 |
| Data / side effects | `sessionStorage` key `aira-greeting-shown` | L20–L25 |
| Child | Lazy `AiAssistant` from `components/ai-assistant.tsx` | L8–L10 |
| Shared | `BRAND_ICON_SRC` from `@/components/brand` | L6 |

### 5.3 Shared reuse dependency list

Directed “imports shared X” edges relevant to the home page (component → dependency):

```
app/page.tsx
  → Header, Hero, Features, Courses, HowItWorks, CTA, Footer
  → PricingModal, ContactModal, FloatingAssistant

Header
  → useAuth (auth-provider)
  → AudienceNavLink
  → AuthEntryLink
  → HeaderLogo
  → UserProfileMenu
  → ui/Button
  → lib/site (CTAS, EXTERNAL, BRAND)

Hero
  → AuthEntryLink
  → lib/site (CTAS, STATS, HERO_TRUST, BRAND)

Features
  → lib/site (BRAND)
  → lib/utils (cn)
  → (internal FeatureCard / HeroExplainerCard only)

Courses
  → SchoolLearning
  → ProfessionalLearning
  → ui/Button

SchoolLearning
  → LearningCourseCard
  → course-filters (FilterPill, CoursesEmptyState)
  → lib/learning-courses (schoolCourses, filters)

ProfessionalLearning
  → LearningCourseCard
  → course-filters (FilterPill, CoursesEmptyState)
  → lib/learning-courses (professionalCourses, filters)

LearningCourseCard
  → useAuth (auth-provider)
  → CoursePattern
  → WaitlistModal
  → lib/site (EXTERNAL)
  → lib/utils (cn)

WaitlistModal
  → ui/Button, ui/Input, ui/Label, ui/dialog/*
  → fetch('/api/waitlist')   [runtime, not a component import]

HowItWorks
  → lib/site (BRAND)
  → lib/utils (cn)

CTA
  → AuthEntryLink
  → ui/Button

Footer
  → AudienceNavLink
  → BrandWordmark (brand)
  → lib/site (CTAS, EXTERNAL, BRAND, SOCIAL)

AudienceNavLink
  → useAuth
  → ComingSoonModal
  → lib/firebase/auth (getUserAppRole)
  → lib/auth-redirect (homeForRole)
  → lib/site (EXTERNAL)

AuthEntryLink
  → useAuth
  → lib/firebase/auth (getUserAppRole)
  → lib/auth-redirect (homeForRole)

ComingSoonModal
  → ui/Button, Input, Label, dialog/*
  → lib/site (BRAND)
  → fetch('/api/waitlist')

FloatingAssistant
  → brand (BRAND_ICON_SRC)
  → lazy AiAssistant

PricingModal / ContactModal
  → (no shared course/auth entry components; self-contained)
```

#### Cross-section reuse summary

| Shared unit | Used by (home tree) |
|-------------|---------------------|
| `AuthEntryLink` | Header, Hero, CTA |
| `AudienceNavLink` | Header, Footer |
| `useAuth` / `AuthProvider` | Header, AudienceNavLink, AuthEntryLink, LearningCourseCard |
| `LearningCourseCard` | SchoolLearning, ProfessionalLearning |
| `FilterPill` / `CoursesEmptyState` | SchoolLearning, ProfessionalLearning |
| `ui/Button` | Header, Courses, CTA, WaitlistModal, ComingSoonModal |
| `lib/site` constants | Header, Hero, Features, Footer, AudienceNavLink, LearningCourseCard, ComingSoonModal, etc. |
| `WaitlistModal` | LearningCourseCard only (professional unavailable courses) |
| `ComingSoonModal` | AudienceNavLink (professionals) only |

### 5.4 Data-source summary (no CMS)

| Section | Static in-file / module | API / CMS fetch on home |
|---------|-------------------------|-------------------------|
| Header | `HASH_LINKS`, `lib/site` | None |
| Hero | `floatingStats` + `lib/site` | None |
| Features | `FEATURES` + local videos under `/videos` | None |
| School / Pro courses | `lib/learning-courses` arrays | None on render; waitlist `POST /api/waitlist` only on Notify Me submit |
| How it works | `STEPS` | None |
| CTA | Inline copy | None |
| Footer | `lib/site` | None |
| PricingModal | Inline `plans` | None |
| ContactModal | Inline `contactInfo` | None |
| FloatingAssistant | sessionStorage + `/api/chat` & `/api/tts` when assistant used | Via `AiAssistant` after open |

CMS (Contentful/Sanity/etc.): **NOT FOUND IN REPO** for these sections.

---

## 6. Security & QA Findings

**Phase date:** 2026-08-10  
**Role:** Senior QA / security tester pass over Phases 1–5 evidence + targeted re-checks.

### 6.1 Reconfirmation of prior 🔴 CRITICAL / 🟠 WARNING flags

| Prior flag | Status | Expansion / reconfirm evidence |
|------------|--------|--------------------------------|
| 🔴 Firestore `users/{uid}` unrestricted self-write → role escalation | **CONFIRMED** | `firestore.rules` L5–L7 still `allow read, write` with **no** `role` / field constraints. App signup coerces admin→student only in client code (`lib/firebase/auth.ts` L148–L149), not in rules. |
| 🔴 Hardcoded weekly bridge secret fallback | **CONFIRMED** | `app/api/weekly-exams/route.ts` L9–L12 still falls back to literal `'aira_weekly_bridge_v1'`. Anyone who knows/reads the repo can `POST` upserts / `GET ?all=1`. |
| 🔴 Hardcoded Firebase web config fallbacks | **CONFIRMED** | `lib/firebase/config.ts` L4–L21 still embeds fallback `apiKey` / project identifiers when env unset (values not reprinted). |
| 🔴 Unauthenticated `/api/chat` + `/api/tts` without rate limits | **CONFIRMED** | Handlers still only gate on env key presence (`app/api/chat/route.ts` L35–L40; `app/api/tts/route.ts` L65–L70). No auth, CAPTCHA, or rate-limit code found (Phase 4 grep empty; re-checked). |
| 🟠 No landing middleware auth for tutor paths | **CONFIRMED** | `middleware.ts` L11–L18 hostname redirect only. |
| 🟠 Waitlist/contact lack abuse controls | **CONFIRMED** | Waitlist: email regex only (`app/api/waitlist/route.ts` L19–L28). Contact: client `trim` + HTML `required` (`components/contact-form.tsx` L22–L32, L62–L66 `noValidate`). |
| 🟠 `.gitignore` only `.env*.local` | **CONFIRMED** | `.gitignore` L11–L12; plain `.env` still not ignored. |
| 🟠 `NEXT_PUBLIC_WEEKLY_EXAM_BRIDGE_SECRET` usable as bridge secret | **CONFIRMED** | `app/api/weekly-exams/route.ts` L11 — public env naming risks shipping secret to clients if mis-set in Vercel “Environment Variables” as public. |

### 6.2 Input sanitization (forms)

| Form | Validation present | Sanitization / XSS defenses | Gap |
|------|--------------------|-----------------------------|-----|
| Login | HTML `required`, `type="email"` (`app/login/page.tsx` L167–L200) | Password/email passed to Firebase SDK; not rendered as HTML | No Zod/schema; relies on Firebase errors |
| Signup | Manual match + `length < 6` (`app/signup/page.tsx` L87–L94); HTML `required` | Same Firebase path; `PasswordStrength` is UI-only (`password-strength.tsx`) | No complexity enforcement beyond length 6; role select limited to student/teacher in UI (L173–L174) but Firestore role writable later (CRITICAL above) |
| Contact / demo (`ContactForm`) | `trim()` + `required` fields; `type="email"` (`contact-form.tsx` L22–L32, L80–L84); form `noValidate` (L65) | Stored in Firestore as strings; **not** HTML-escaped in this write path (server-side display **NOT FOUND IN REPO**) | No max length; no email regex beyond browser type; `noValidate` disables native constraint API |
| Waitlist modals | Server email regex `EMAIL_RE` (`waitlist/route.ts` L3, L23–L24) | Course id/name trimmed strings | No length caps; no auth |
| Coming Soon waitlist | Same `/api/waitlist` | Fixed `courseId: 'professional-learning'` (`coming-soon-modal.tsx` L37–L40) | Same as waitlist |
| Chat API body | Checks `messages` is array (`chat/route.ts` L43–L48) | Messages forwarded into Groq prompt (`L66–L68`) with **no** content sanitization | 🟠 **WARNING:** prompt-injection / oversized payload risk; only `max_tokens: 400` on output (L71) |
| TTS API body | `text` trim + empty check (`tts/route.ts` L74–L76) | No max length found in first 100 lines | 🟡 **NOTE:** long text → cost/DoS against Sarvam |

`dangerouslySetInnerHTML` / DOMPurify on auth/contact forms: **NOT FOUND IN REPO** for these paths.

### 6.3 CSRF protection

| Check | Result | Evidence |
|-------|--------|----------|
| CSRF tokens / double-submit cookies / SameSite session cookies for API | **NOT FOUND IN REPO** | csrf/SameSite grep empty |
| State-changing public endpoints | `POST /api/chat`, `/api/tts`, `/api/waitlist`, `/api/weekly-exams` (secret), contact Firestore create | Phase 4 |
| Practical impact | Chat/TTS/waitlist are **unauthenticated** — cross-site CSRF is secondary to **direct anonymous abuse**. Cookie-session CSRF pattern less relevant because these routes do not check Firebase cookies. | — |

🟠 **WARNING:** No CSRF layer on state-changing POSTs; combined with open APIs, any origin/script can invoke them server-side or via browser from the landing origin.

### 6.4 CORS

| Endpoint | CORS headers | Evidence |
|----------|--------------|----------|
| `OPTIONS /api/tts/health` | `Access-Control-Allow-Origin: *` | `app/api/tts/health/route.ts` L20–L27 |
| `POST /api/chat`, `POST /api/tts`, waitlist, weekly-exams | **No** explicit `Access-Control-Allow-Origin` in route files | CORS grep only hit tts/health |

🟡 **NOTE:** Browser cross-origin **XHR/fetch** to chat/tts from foreign sites is blocked by default without ACAO; **non-browser** clients and same-origin pages can still abuse them. Wildcard CORS on health OPTIONS is low risk (read-only config boolean) but confirms permissive pattern exists.

### 6.5 Sensitive logging

| Location | What is logged | Risk |
|----------|----------------|------|
| `app/api/waitlist/route.ts` L37–L40 | Waitlist save with **masked** email (`replace` keeps 2 chars + domain) | 🟡 NOTE — still PII-adjacent in server logs |
| `app/api/chat/route.ts` L87 | `console.error('Groq API Error:', errText)` — upstream error **body** | 🟠 **WARNING** — may include prompt fragments / provider details in logs |
| `app/api/chat/route.ts` L140 | `console.error('API Route Error:', err)` | May include stack; watch for message content in Error |
| `app/api/tts/route.ts` L106 | Sarvam error text | 🟡 NOTE |
| `lib/firebase/auth.ts` | Auth failures log **error codes**, not passwords (L127, L156, L169) | OK pattern |
| `components/contact-form.tsx` L36 | `console.error('[contact]', err)` | 🟡 NOTE — client console; avoid shipping verbose Firebase errors to users (UI uses generic string L37–L38) |

No `console.log` of raw passwords or Firebase ID tokens found in auth submit handlers.

### 6.6 Client components vs server-only secrets

| Secret | Imported in `'use client'` components? | Evidence |
|--------|----------------------------------------|----------|
| `GROQ_API_KEY` | **No** — only `app/api/chat/route.ts` | components grep for `GROQ_API_KEY` empty |
| `SARVAM_API_KEY` | **No** — only TTS routes | same |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | **No** — script only | Phase 3 |
| `NEXT_PUBLIC_FIREBASE_*` | **Yes** (by design) via `lib/firebase/config.ts` used by client auth/contact | Expected client exposure |
| Weekly bridge secret | Route handler only; `NEXT_PUBLIC_` variant is dangerous if configured | `weekly-exams/route.ts` L10–L11 |

### 6.7 Dependency audit (`pnpm audit`)

**Command:** `pnpm audit` in landing repo root (2026-08-10).  
**Summary line:** `50 vulnerabilities found` — **Severity: 3 low \| 19 moderate \| 28 high** (0 critical reported in summary).

**Pinned Next version in package.json:** `"next": "16.1.6"` (`package.json` L54) — multiple high advisories list patches at `>=16.2.3` / `>=16.2.5` / `>=16.2.6` / `>=16.2.11`.

| Severity | Package (examples from audit output) | Advisory theme | Patch guidance from audit |
|----------|--------------------------------------|----------------|---------------------------|
| high | `next` | DoS (Server Components / App Router), Middleware/Proxy bypass, SSRF in Server Actions | Upgrade toward **≥16.2.11** (latest cited patch floor for several GHSA) |
| high | `lodash` | Code injection via `_.template` | `>=4.18.0` |
| high | `brace-expansion` | ReDoS / exponential expansion | `>=1.1.16` / `>=5.0.7` (path-dependent) |
| high | `js-yaml` | Quadratic CPU via merge-key chains | `>=4.3.0` |
| high | `sharp` | Inherited libvips issues | `>=0.35.0` |
| moderate | `postcss` | sourceMappingURL / `.map` read | `>=8.5.23` |
| low | `next` | Dev HMR websocket CSRF (null origin); cache poisoning | `>=16.1.7` / `>=16.2.5` |

🟠 **WARNING:** Running Next **16.1.6** while audit reports **28 high** issues (many in `next`) — treat upgrade as priority. Full advisory dump not pasted; use `pnpm audit` locally for the complete list.

### 6.8 Consolidated security severity board (Phase 6)

| Sev | Finding |
|-----|---------|
| 🔴 | Firestore self-write privilege escalation (`role`) |
| 🔴 | Hardcoded weekly bridge secret fallback |
| 🔴 | Hardcoded Firebase config fallbacks in source |
| 🔴 | Public unmetered Groq/Sarvam proxy (`/api/chat`, `/api/tts`) |
| 🟠 | No CSRF / abuse controls on state-changing public POSTs |
| 🟠 | Chat messages unsanitized into LLM; Groq error bodies logged |
| 🟠 | No landing auth middleware for tutor routes |
| 🟠 | `.gitignore` gap for `.env` |
| 🟠 | `NEXT_PUBLIC_` bridge secret pattern |
| 🟠 | `pnpm audit`: 28 high (notably `next@16.1.6`) |
| 🟡 | Waitlist masked email still logged; TTS unbounded text; CORS `*` on TTS health OPTIONS; contact `noValidate` |

### 6.9 Functional manual test checklist (Given / When / Then)

Derived from Phase 2 button/route map. Run on landing origin (e.g. `http://localhost:3000`) with tutor proxy up when testing `/student*` destinations.

#### Global / chrome

1. **Given** I am on `/`, **When** I click the header logo, **Then** I stay on home focused at `#home` (or equivalent hero).
2. **Given** I am on `/pricing`, **When** I click the header logo, **Then** I navigate to `/`.
3. **Given** I am on `/`, **When** I click Features / Courses / How it works, **Then** the page scrolls to `#features` / `#courses` / `#how-it-works`.
4. **Given** I am on `/about`, **When** I click Features in the header, **Then** I go to `/#features` (or `/` + hash per `hashHref`).
5. **Given** I am logged out, **When** I click Pricing, **Then** I open `/pricing`.
6. **Given** I am logged out, **When** I click For Schools, **Then** I open `/login?intent=school` and see school intent copy.
7. **Given** I am logged in as student, **When** I click For Schools, **Then** a full navigation loads my role home (e.g. `/student/mode-selection` or remembered home) via rewrite.
8. **Given** I am on `/`, **When** I click For Professionals, **Then** the Coming Soon modal opens (not an external portal).
9. **Given** Coming Soon is open, **When** I submit a valid email, **Then** the UI shows success and `/api/waitlist` returns ok (Network tab).
10. **Given** I am logged out, **When** I click Log in, **Then** I open `/login`.
11. **Given** I am logged out, **When** I click Start Free Trial in the header, **Then** I open `/signup`.
12. **Given** I am logged in, **When** I click Start Free Trial in the header, **Then** I full-navigate to my role home (not `/signup`).
13. **Given** mobile viewport, **When** I open the menu and tap Pricing, **Then** the menu closes and `/pricing` loads.

#### Hero / CTA / Features / Courses

14. **Given** `/` hero, **When** I click Start Free Trial, **Then** logged-out users reach `/signup`.
15. **Given** `/` hero, **When** I click Book a Demo, **Then** I reach `/contact`.
16. **Given** Features cards, **When** I click play on a feature video, **Then** the in-card video starts (no route change).
17. **Given** a school course card (available), logged out, **When** I click Explore Course, **Then** I go to `/login?intent=school`.
18. **Given** a school course card, logged in as student, **When** I click Explore Course, **Then** I full-navigate to `/student/mode-selection` (or role home).
19. **Given** a professional course with Notify Me, **When** I click Notify Me and submit email, **Then** waitlist succeeds via `/api/waitlist`.
20. **Given** Courses section, **When** I click Browse All Catalog, **Then** observe current behavior (expected: **no navigation** — known gap `courses.tsx` L87–L92).
21. **Given** CTA band, **When** I click Start Free Trial, **Then** I reach `/signup` (logged out).
22. **Given** CTA band, **When** I click View Pricing, **Then** PricingModal opens on home.
23. **Given** PricingModal Enterprise, **When** I click Contact Us, **Then** ContactModal opens.
24. **Given** PricingModal Simple/Pro, **When** I click Start Free / Get Started, **Then** observe **no navigation** (known gap `pricing-modal.tsx` L249–L254).

#### Footer / legal / social

25. **Given** footer, **When** I click About / Blog / Careers, **Then** I open `/about` / `/blog` / `/careers`.
26. **Given** footer, **When** I click Contact Us, **Then** ContactModal opens (home only; requires `onContactClick`).
27. **Given** footer, **When** I click Get in touch, **Then** I open `/contact`.
28. **Given** footer, **When** I click Terms / Privacy / Cookies, **Then** those routes load.
29. **Given** footer social icons, **When** I click Instagram / X, **Then** a new tab opens the URLs from `lib/site.ts` `SOCIAL`.

#### Auth routes

30. **Given** `/login` with valid credentials, **When** I submit, **Then** I am redirected to the correct role home (or `redirect` if role-matched).
31. **Given** `/login?intent=school`, **When** the page loads, **Then** subtitle shows school copy and post-login destination is still role-based (not external portal).
32. **Given** `/login?intent=professional`, **When** I sign in successfully, **Then** I am sent to the external professional URL from `portalHrefForIntent`.
33. **Given** `/login?signedOut=1`, **When** the page loads, **Then** session is cleared and the form remains visible (no auto-bounce into the app).
34. **Given** `/signup`, **When** passwords mismatch, **Then** an error shows and no account is created.
35. **Given** `/signup` with valid student data, **When** I submit, **Then** Firestore profile is created and I land on student home.
36. **Given** `/forgot-password`, **When** I submit a registered email, **Then** success UI appears (Firebase sends reset email — delivery **NOT FOUND IN REPO** to verify).

#### Pricing page / assistant / contact page

37. **Given** `/pricing`, **When** I click Simple/Pro CTA, **Then** I go to `/signup`.
38. **Given** `/pricing`, **When** I click Enterprise CTA, **Then** I go to `/contact`.
39. **Given** `/`, **When** I click the floating assistant orb, **Then** the AI assistant UI opens.
40. **Given** assistant open, **When** I send a message, **Then** Network shows `POST /api/chat` streaming and a reply appears.
41. **Given** `/contact`, **When** I submit ContactForm with valid fields, **Then** success state shows and a `contact_messages` write occurs (Firebase console / Network to Firestore).
42. **Given** `/blog`, **When** I click Start a free trial / book a demo, **Then** I reach `/signup` / `/contact`.

#### Negative / security smoke (manual)

43. **Given** anonymous access, **When** I `POST /api/chat` with a large `messages` array from an external tool, **Then** observe whether the request is accepted without auth (expect: **accepted** today — abuse risk).
44. **Given** knowledge of bridge fallback secret, **When** I `POST /api/weekly-exams` with that secret, **Then** observe whether upsert succeeds without Firebase admin auth (expect: **succeeds** if fallback active).
45. **Given** an authenticated non-admin user and Firestore write access to `users/{uid}`, **When** I set `role` to `admin` via client SDK, **Then** observe whether rules allow it (expect: **allowed** per current rules — CRITICAL).

---

*End of Phase 6.*

---

*End of Phase 7 (Executive Summary prepended). Audit complete for Phases 1–7.*

# Product Requirements Document (PRD)

## 1. Document Control

| Field | Value |
|-------|--------|
| **Title** | Aɪra Platform — Product Requirements Document |
| **Document ID** | AIRA-PRD-001 |
| **Version** | 1.0 |
| **Status** | Draft — reverse-engineered from shipped code |
| **Date** | 2026-08-09 |
| **Product Owner** | _[PLACEHOLDER]_ |
| **Author** | Reverse-engineered from landing + tutor codebases |
| **Related docs** | `docs/FRD.md` (functional detail) |
| **Apps covered** | `aira-landing-page-elite` (landing) · `ai-tutor` (tutor SPA) |

### Evidence rules used in this PRD

| Tag | Meaning |
|-----|---------|
| *(no tag)* | Verifiable from routes, UI, services, config, or data models |
| **`[INFERRED]`** | Reasonable product intent deduced from behavior — not confirmed by a product brief in-repo |
| **`[NEEDS PRODUCT INPUT]`** | Cannot be settled from code; needs a human owner decision |

---

## 2. Executive Summary

Aɪra is a **same-origin dual-app product**: a marketing/auth shell (Next.js) and a role-based learning SPA (Vite/React) delivered under shared paths (`/student`, `/teacher`, `/admin`).

What the product **actually lets users do today**: Indian school students (grades 6–12 science bands) choose **Curriculum Mode** or **Competitive Mode**, take AI-generated lessons with diagrams/TTS/studio tools (notes, mind maps, flashcards, quizzes), run timed competitive exam practice across a catalog including JEE/NEET and other exams, and track local learning analytics (sessions, streaks, achievements). Teachers and admins get dashboards (currently mock analytics), and admins can schedule **weekly exams**. Visitors can sign up, chat with an AI counselor, join waitlists, and submit demo/contact requests. **There is no working payment or entitlement gate** despite a pricing page with Free/Pro/Enterprise plans.

---

## 3. Problem Statement(s)

| Persona | Problem statement |
|---------|-------------------|
| **Student** | Students struggle to get **personalized, always-available teaching** that covers both **board/curriculum mastery** and **entrance-exam practice** in one place, so the product provides AI teaching sessions plus a competitive exam hub with mocks, weekly windows, and analytics. **`[INFERRED]`** |
| **Teacher** | Teachers need a **view of class/student performance** without building their own dashboards, so the product provides a teacher dashboard surface. **`[INFERRED]`** — currently fed by **mock** data, so the operational problem is only partially solved. |
| **Admin / school operator** | Institutions need **control of scheduled assessments** (weekly exams) and a governance overview, so the product provides admin weekly-exam management and an admin dashboard. **`[INFERRED]`** — governance analytics remain mock. |
| **Visitor / parent / school buyer** | Prospects need to **understand the offering, try it, or request a demo** before committing, so the landing site provides marketing, free signup, pricing narrative, contact/demo, and waitlists. **`[INFERRED]`** |
| **Working professional (aspirational)** | Professionals seeking career upskilling are addressed in marketing/nav, but in-product learning for that segment is **not shipped** (Coming Soon / external portal intent). **`[NEEDS PRODUCT INPUT]`** on whether professionals remain a near-term ICP. |

---

## 4. Target Users / Personas

Derived from code roles (`student` \| `teacher` \| `admin`) plus unauthenticated visitors and demo users.

| Persona | Code role | How they enter | Default experience (actual) | Capabilities (actual) |
|---------|-----------|----------------|-----------------------------|------------------------|
| **Visitor** | none | `/`, marketing CTAs | Browse home, pricing, legal, assistant | Signup, login, contact, waitlist, AI counselor chat/TTS |
| **Student learner** | `student` | Signup (default) or login | `/student/mode-selection` (or remembered curriculum/competitive/dashboard) | Mode pick, curriculum, competitive exams, AI learn/studio, dashboard, onboarding, profile, settings |
| **Teacher** | `teacher` | Signup role = teacher | `/teacher/dashboard` | Mock class analytics UI, settings, profile |
| **Admin** | `admin` | Firestore role only (not public signup) | `/admin/dashboard` | Mock governance UI, **weekly exam CRUD**, settings, profile; may open `/dev/demo-roles` in prod |
| **Demo evaluator** | local `isDemo` | `/dev/demo-roles` (DEV or admin) | Role home without Firebase | Explore UX without real account |
| **School prospect** | often teacher/student after login | `/login?intent=school` | Role home after auth | Same as role; intent mainly affects login copy |
| **Professional prospect** | n/a / external | Nav Coming Soon **or** `intent=professional` → external host | Waitlist modal **or** redirect to `aira-edtech-f063e.web.app` | Waitlist on landing; external portal not owned by these repos |

---

## 5. Goals & Success Metrics

### 5.1 Business goals

| Goal | Basis | Tag |
|------|-------|-----|
| Grow top-of-funnel signups (“Start Free Trial”) | Primary CTA → `/signup` everywhere | Verified behavior; goal **`[INFERRED]`** |
| Convert schools via demos | “Book a Demo” → `/contact` + Enterprise CTA → contact | **`[INFERRED]`** |
| Capture demand for unreleased professional tracks | Waitlist API + Coming Soon modal | **`[INFERRED]`** |
| Monetize via Free / Pro (₹375) / Enterprise | Pricing page & modal | **`[INFERRED]`** intent — **not enforced in product** (see §9) |
| Retain learners via engagement loops | Streaks, achievements, analytics store, dashboard insights | **`[INFERRED]`** |

### 5.2 Product goals by feature cluster

| Cluster | Product goal (what “good” looks like) | Suggested metric categories **`[NEEDS PRODUCT INPUT]` for targets** |
|---------|----------------------------------------|---------------------------------------------------------------------|
| Acquisition & auth | Visitors become authenticated users in the correct role | Signup completion rate; auth success rate; time-to-first role home |
| Mode selection | Students commit to a learning path quickly | % reaching mode selection; curriculum vs competitive split; return-to-hint rate |
| Curriculum learning | Students complete AI lessons on grade topics | Topics started/completed; session length; studio tool usage |
| Competitive prep | Students complete timed practice and improve analytics | Attempts started/completed; accuracy trends; weekly-window participation |
| Teaching studio | Doubts resolved; artifacts exported/reused | Doubts opened/resolved; exports; TTS usage |
| Teacher dashboard | Teachers trust class visibility | DAU teachers; **`[NEEDS PRODUCT INPUT]`** until live data exists |
| Admin weekly exams | Published windows run on schedule | Sessions published; student attempt rate in-window |
| Counselor assistant | Pre-signup/support questions answered | Chat sessions; TTS plays; escalation to contact |
| Monetization | Paid plans match entitlements | **`[NEEDS PRODUCT INPUT]`** — checkout & gates missing |

### 5.3 Explicit gaps on metrics

All numeric targets (activation %, conversion %, retention D7, ARPU, etc.) are **`[NEEDS PRODUCT INPUT]`**. Code does not define OKRs or analytics event taxonomies beyond Firebase/Vercel analytics hooks and client-side Zustand metrics.

---

## 6. Feature Overview

### 6.1 Feature clusters

| Cluster | What it does (code-verified) | Why it likely exists / user value | State |
|---------|------------------------------|-----------------------------------|-------|
| **Marketing site** | Home sections (Hero, Features, Courses, How it works, CTA), pricing, about, legal, careers/blog placeholders | Acquire and educate prospects **`[INFERRED]`** | **Shipped** (blog/careers = placeholder copy) |
| **Acquisition CTAs** | Free trial → signup; Book a demo → contact; school/professional nav intents | Convert traffic into accounts or sales leads **`[INFERRED]`** | **Shipped** |
| **Waitlist / Coming Soon** | Professional courses + nav → waitlist (`/api/waitlist` → Firestore) | Demand capture for unreleased tracks **`[INFERRED]`** | **Shipped** (capture only) |
| **AI Counselor** | Floating + `/assistant`; Groq chat SSE; Sarvam TTS; local counselor video | 24/7 guidance without human counselor cost **`[INFERRED]`** | **Shipped** (HeyGen SDK unused) |
| **Unified Auth** | Firebase email/social; role in Firestore; post-auth role homes; tutor redirect-to-landing | Single identity across marketing and product **`[INFERRED]`** | **Shipped** |
| **Mode Selection** | Curriculum vs Competitive cards; home hint persistence | Force a clear learning intent before deep product **`[INFERRED]`** | **Shipped** |
| **Curriculum Learning** | Grades 6–10 + 11–12 science → subjects → topics → `/student/learn` | Board/school mastery path **`[INFERRED]`** | **Shipped** (some chapters may show “topics coming soon”) |
| **AI Teaching Studio** | Chat + diagram board + TTS + doubts + notes/mindmap/flashcards/quiz/summary + export | Replace/supplement human tutoring with interactive AI lesson **`[INFERRED]`** | **Shipped** (quality depends on AI keys) |
| **Student Onboarding** | Profession → specialization → subject → topic | Personalize first lesson beyond pure grade curriculum **`[INFERRED]`** | **Shipped** |
| **Student Dashboard** | Mascot/hero, missions, journey, topic discovery, streak-aware insights | Habit/retention home base **`[INFERRED]`** | **Shipped** |
| **Competitive Exams** | Multi-exam catalog, live exam UI, PYQ/mock, topic quizzes, explain flow, analytics store | Entrance/scholarship prep retention & differentiation **`[INFERRED]`** | **Shipped** |
| **Weekly Exams** | Admin schedule Sat/Sun mock\|pyq; student weekly section; Firestore + API/JSON fallbacks | Recurring engagement + institutional rhythm **`[INFERRED]`** | **Partially built** (dual persistence; consistency risk) |
| **Teacher Dashboard** | Class/student UI from `mockAnalytics` | Teacher value prop for schools **`[INFERRED]`** | **Partially built** (UI shipped, live data not) |
| **Admin Governance UI** | Admin dashboard from mock data | School ops / trust for Enterprise story **`[INFERRED]`** | **Partially built** |
| **Settings & Accessibility** | Theme, TTS languages, font size, high contrast, reduce motion, AI personality (role-filtered tabs) | Inclusivity + personalization **`[INFERRED]`** | **Shipped** |
| **Demo Roles** | `/dev/demo-roles` for sales/QA personas | Demo without provisioning Firebase users **`[INFERRED]`** | **Shipped** (gated) |
| **Pricing / Plans** | Free / Pro ₹375 / Enterprise custom; Pro marked “Placeholder pricing” | Monetization narrative **`[INFERRED]`** | **Scaffolded UX** — **no checkout, no entitlement enforcement found** |
| **Professional Learning Portal** | External URL + Coming Soon waitlist | Expand ICP beyond K-12 **`[INFERRED]`** | **Scaffolded / external** |
| **HeyGen LiveAvatar** | Dependency + env key present; runtime uses MP4 | Premium avatar presence **`[INFERRED]`** | **Scaffolded-unused** |
| **Firestore `leads` collection** | Rules allow create; no app writer | CRM lead pipeline **`[INFERRED]`** | **Scaffolded-unused** |

### 6.2 Monetization vs free (mismatch)

| Claim on pricing page | Enforced in tutor/landing product code? |
|-----------------------|-----------------------------------------|
| Free forever with limited practice tests | **No paywall / quota enforcement found** |
| Pro unlocks unlimited tests, full JEE/NEET, weekly exams, live Q&A caps | **No plan entitlement checks found**; weekly exams & competitive content reachable to authenticated students |
| Enterprise multi-seat, school admin, LMS/API | **Partial**: admin/teacher roles exist; LMS/API integrations **not found**; analytics mock |
| “Free to start” trust line | **Matches** behavior: signup unlocks product |

**Product implication:** Pricing is currently a **marketing artifact**, not a billing system. Treating Pro feature bullets as commitments is a go-to-market risk until entitlements ship. **`[NEEDS PRODUCT INPUT]`** on true packaging.

---

## 7. User Journeys

### 7.1 Student — activate and learn (curriculum)

1. Land on `/` → Start Free Trial → `/signup` (role student).
2. Auth writes Firestore user → full-page nav to `/student/mode-selection`.
3. Enter Curriculum → `/student/curriculum` (home hint saved).
4. Select grade → subject → topic → `/student/learn/:topicId`.
5. Consume AI steps / diagrams / TTS; optional doubt + studio tools + export.
6. Optionally use Dashboard for discovery/streaks; Settings for TTS/a11y.

### 7.2 Student — competitive practice

1. Mode selection → Competitive → `/student/competitive`.
2. Choose section (`exams` / `mock` / `pyqs` / `quizzes` / `weekly` / `questionary` / `performance`).
3. Run exam flow to result; analytics attempt recorded client-side.
4. Optional explain → `/student/competitive-explain`.

### 7.3 Visitor — counselor then convert

1. Open Floating Assistant or `/assistant`.
2. Chat via `/api/chat`; optional TTS via `/api/tts`.
3. Convert via signup or Book a Demo.

### 7.4 School buyer — demo request

1. Book a Demo / Enterprise CTA → `/contact`.
2. Message stored in `contact_messages`.
3. **`[NEEDS PRODUCT INPUT]`** human follow-up process (not in code).

### 7.5 Teacher — post-login

1. Signup/login as teacher → `/teacher/dashboard`.
2. Browse mock class/student views; settings/profile.
3. Logout → landing login.

### 7.6 Admin — publish weekly exam

1. Admin (Firestore role) → `/admin/weekly-exams`.
2. Create/publish Sat/Sun session.
3. Students see/attempt under Competitive → Weekly when window logic allows.
4. **`[NEEDS PRODUCT INPUT]`** which store (Firestore vs landing JSON) is source of truth in production.

### 7.7 Professional prospect

1. For Professionals → Coming Soon waitlist **or**
2. Login `intent=professional` → external Firebase hosting URL.
3. **`[NEEDS PRODUCT INPUT]`** which path is intentional primary.

---

## 8. Scope

### 8.1 In current release (reachable & working as implemented)

- Marketing pages + CTAs + contact + waitlist
- Firebase auth (email + configurable social) + role routing
- Same-origin tutor proxy (dev/prod configs)
- Student mode selection, curriculum browser, AI teaching studio, dashboard, onboarding, profile, settings
- Competitive catalog + live exam UX + client analytics
- Admin weekly exam management UI + student weekly consumption paths
- Teacher/admin dashboard **UIs**
- AI counselor chat/TTS
- Demo roles gate

### 8.2 Explicitly out of scope / not yet built

| Item | Evidence |
|------|----------|
| Payment, subscriptions, invoices | No Stripe/Razorpay/checkout; pricing placeholder note |
| Entitlement gating by plan | No feature flags/plan checks found in tutor routes |
| HeyGen live avatar sessions | Unused SDK / unused `HEYGEN_API_KEY` |
| Live teacher/admin analytics backend | `mockAnalytics.ts` |
| Teacher content authoring / LMS | No routes |
| Professional in-app learning catalog (available courses) | Courses marked unavailable; waitlist |
| Blog/careers as real systems | Coming soon / placeholder email |
| Automated test suite in these repos | No `*.test.*` / `*.spec.*` found |
| Writing to Firestore `leads` | Rules only |

---

## 9. Assumptions, Risks & Open Questions

### 9.1 Technical risks (visible in code)

| Risk | Why it matters |
|------|----------------|
| **Dual weekly-exam stores** (tutor Firestore vs landing JSON API) | Students/admins may see divergent schedules |
| **Tutor AI keys as `VITE_*`** | Keys ship to browsers; abuse/cost risk |
| **Public `/api/chat` and `/api/tts`** (no auth) | Cost abuse / scraping risk |
| **Bridge secret fallback hardcoded** on weekly API | Weakens admin write protection if env unset |
| **Client-only competitive/curriculum analytics** | Progress not centrally durable across devices unless also in Firebase (mostly local Zustand) |
| **Mock teacher/admin data** | Enterprise sales demos can overpromise vs production truth |
| **Vite `server.origin` pinned to landing in local unified mode** | Direct `:5173` usage breaks some asset URLs |

### 9.2 Product risks

| Risk | Tag |
|------|-----|
| Pricing page promises limits/features not enforced → trust/legal/GTM mismatch | Verified mismatch; severity **`[NEEDS PRODUCT INPUT]`** |
| Professional ICP split across waitlist vs external portal → confused funnel | Verified dual paths |
| “24/7 AI support” / Pro “Live Q&A” claims vs counselor chat + no live human Q&A product | Marketing vs capability **`[INFERRED]`** tension |
| Curriculum “topics coming soon” empty states → activation drop-offs | Verified UI string exists |
| Retention systems (streaks) are local-first → weak cross-device continuity | **`[INFERRED]`** product risk |

### 9.3 Open questions for product owner

1. **`[NEEDS PRODUCT INPUT]`** What is the true ICP priority order: K-12 students, entrance aspirants, teachers, schools (Enterprise), professionals?
2. **`[NEEDS PRODUCT INPUT]`** Should Free/Pro limits be enforced next, or is pricing page temporary messaging only?
3. **`[NEEDS PRODUCT INPUT]`** What is the source of truth for weekly exams in production?
4. **`[NEEDS PRODUCT INPUT]`** Are teacher/admin dashboards meant to stay demo-quality for sales, or must live data ship before Enterprise GA?
5. **`[NEEDS PRODUCT INPUT]`** Is the external professional portal in-scope for this product team or a separate product?
6. **`[NEEDS PRODUCT INPUT]`** Should HeyGen replace the MP4 counselor, or should the dependency be removed?
7. **`[NEEDS PRODUCT INPUT]`** Success metrics & analytics event taxonomy for activation/retention/monetization?
8. **`[NEEDS PRODUCT INPUT]`** Support model behind contact form / “priority email support” Pro claim?

---

## 10. Dependencies

| Dependency | Role in product |
|------------|-----------------|
| **Firebase Auth + Firestore** | Identity, roles, waitlist, contacts, weekly exams (tutor) |
| **Firebase Analytics / Vercel Analytics** | Usage telemetry hooks |
| **Groq** | Landing counselor LLM |
| **Sarvam** | TTS |
| **Groq / OpenRouter / DeepSeek / Sarvam / Mistral** (tutor client) | Lesson/exam generation & chat |
| **Vercel** | Hosting landing + tutor; prod rewrites |
| **Tutor host `ai-ra-app.vercel.app`** | Rewritten destination for app paths |
| **External professional host** | `aira-edtech-f063e.web.app` for professional intent |
| **Browser capabilities** | `speechSynthesis`, media playback for mascot/counselor video |
| **Static curriculum/competitive content** | In-repo data (`schoolCurriculum`, `COMPETITIVE_EXAMS`, diagram assets) |

---

## 11. Release Readiness Checklist

### Demonstrably present (code/config)

- [x] Landing ↔ tutor rewrite configuration (dev + prod)
- [x] Auth signup/login/reset + role homes
- [x] Student core learning paths reachable under guards
- [x] Competitive exam UI + catalog data
- [x] Admin weekly exam UI
- [x] Counselor chat/TTS API routes
- [x] Waitlist + contact persistence paths

### Needs verification before calling “done” / GA

- [ ] **`[NEEDS PRODUCT INPUT]`** Pricing claims reconciled with entitlements or labeled clearly as illustrative
- [ ] End-to-end weekly exam: admin publish → student attempt on **production** store
- [ ] AI provider keys/quotas monitored; abuse controls on public APIs
- [ ] Teacher/admin dashboards either wired to real data or explicitly marked “preview”
- [ ] Professional funnel: single canonical path (waitlist vs external)
- [ ] Cross-device progress strategy (local Zustand vs cloud)
- [ ] Security review of client-exposed AI keys and bridge secret handling
- [ ] Manual QA matrix for student/teacher/admin on landing origin (not only bare Vite port)
- [ ] Legal review of marketing claims (24/7, exam coverage, plan features)
- [ ] Analytics events defined for funnel & retention **`[NEEDS PRODUCT INPUT]`**

---

## 12. Appendix — Feature-to-code traceability

| Feature cluster | Key routes / APIs | Key implementation loci |
|-----------------|-------------------|-------------------------|
| Marketing home | `/` | `app/page.tsx`; `components/{header,hero,features,courses,how-it-works,cta,footer,floating-assistant}*` |
| Pricing | `/pricing` | `app/pricing/page.tsx`; `components/pricing-modal.tsx`; `lib/site.ts` |
| Contact / demo | `/contact` | `app/contact/page.tsx`; contact components; Firestore `contact_messages` |
| Waitlist | `POST /api/waitlist` | `app/api/waitlist/route.ts`; `coming-soon-modal`; professional learning components |
| AI counselor | `/assistant`, `POST /api/chat`, `POST /api/tts` | `components/ai-assistant.tsx`; `app/api/chat`; `app/api/tts` |
| Auth & roles | `/login`, `/signup`, `/forgot-password` | `lib/firebase/auth.ts`; `lib/auth-redirect.ts`; tutor `authStore`, `authSession`, `App.tsx` guards |
| Proxy unity | `/student*`, `/teacher*`, `/admin*`, `/dev*` | `vercel.json`; `next.config.mjs`; `vite.config.ts` |
| Mode selection | `/student/mode-selection` | `StudentModeSelectionPage`; `components/mode-selection/*` |
| Curriculum | `/student/curriculum` | `CurriculumPage`; `schoolCurriculum.ts`; curriculum components; `curriculumStore` |
| Teaching studio | `/student/learn/:topicId?` | `TeachingPage`; `contentGenerator`; `aiService`; studio viewers; `exportService` |
| Onboarding | `/student/onboarding` | `OnboardingPage`; `professions` data; `userStore` |
| Dashboard | `/student/dashboard` | `DashboardPage`; dashboard components; `analyticsStore`; `useDashboardInsights` |
| Competitive | `/student/competitive`, `/student/competitive-explain` | `StudentCompetitivePage`; `components/competitive/*`; `competitiveRoute.ts`; `COMPETITIVE_EXAMS`; `competitiveStore` |
| Weekly exams | `/admin/weekly-exams`; `GET/POST /api/weekly-exams` | `AdminWeeklyExamsPage`; `weeklyExamSchedule.ts`; landing `weekly-exam-store.ts` |
| Teacher | `/teacher/dashboard` | `TeacherDashboardPage`; `mockAnalytics.ts` |
| Admin UI | `/admin/dashboard` | `AdminDashboardPage`; `mockAnalytics.ts` |
| Settings | `/*/settings` | `SettingsPage`; `settingsStore` |
| Demo | `/dev/demo-roles` | `DemoRolesPage`; `DemoRolesGate`; demo enters in `authStore` |

---

### Change log

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | 2026-08-09 | Initial reverse-engineered PRD from landing + tutor |

---

*End of PRD — AIRA-PRD-001 v1.0*

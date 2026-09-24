# AIra Tutor — Architecture

Enterprise feature layout for `apps/tutor` (Vite + React Router SPA).

## Layout

```
apps/tutor/src/
  app/                 # App shell (providers, bridges, settings effects)
  routes/              # Route tables + guards + path constants
  pages/
    student/           # Dashboard, Curriculum, Competitive, Teaching, ModeSelection
    teacher/
    admin/
    shared/            # Settings, Profile, Onboarding, DemoRoles
  features/
    dashboard/         # Unified student dashboard (curriculum | competitive modes)
    curriculum/        # Grade/stream/subject browser + topic-visuals + stores/data
    competitive/       # Hub, exam, quiz, weekly, AI explanation + exam services
    teaching/          # Teaching UI, studio viewers, speech/session hooks
    mode-selection/    # Student mode picker UI
  components/          # Proven shared only (common, brand, StudioPanel, mascot, …)
  hooks/               # Global-only hooks
  services/            # Cross-feature services (auth adapters, analytics, AI)
  stores/              # Global stores (auth, settings, toast, …)
  data/                # Shared data (visualRegistry, courses, mockData, …)
  lib/ utils/ types/ constants/ styles/
  main.tsx
```

## Feature ownership

| Concern | Own it under |
|--------|----------------|
| Student dashboard modes | `features/dashboard` |
| School curriculum + Class 11/12 streams | `features/curriculum` |
| Competitive exams / quizzes / weekly | `features/competitive` |
| Learn session / studio / TTS playback | `features/teaching` |
| Mode picker chrome | `features/mode-selection` |
| Auth, settings, toasts | `stores/` + `services/` |
| Diagram registry (`visualRegistry`) | `data/` (shared: teaching + curriculum sync) |
| Public media URLs | `public/tutor-media/**` — **do not relocate** |

## Where to add X

- **New student page** → `pages/student/…`, register in `routes/student.tsx` + `routes/lazyPages.tsx`
- **Feature UI used by one domain** → that feature’s `components/` (or `hub/`, `exam/`, …)
- **Shared UI** (2+ features) → `components/common` or `components/brand`
- **Feature-only store/hook/data** → `features/<name>/{stores,hooks,data}/`
- **Cross-feature store** → `stores/` (must not import from `features/`)

## Imports

- Alias: `@/` → `src/` (Vite `resolve.alias` + `tsconfig` paths)
- Prefer `@/features/...` across boundaries; relative imports only inside a feature
- Route path strings live in `routes/paths.ts` (re-exported from `utils/routes.ts`)

## Public assets

Keep `/tutor-media/...` URLs unchanged. Ownership notes live with the feature that references them (e.g. mode-selection heroes, stream cards). Relocating `public/` breaks dynamic URL construction.

## Landing app

`apps/landing` is Next.js App Router and is out of scope for this layout. Cross-app convention: landing owns marketing/auth entry; tutor owns `/student/*`, `/teacher/*`, `/admin/*` SPA routes.

## Non-goals (this layout)

- Rewriting TeachingPage / ExamFlow business logic
- Splitting `visualRegistry.ts` / `index.css`
- API contract changes

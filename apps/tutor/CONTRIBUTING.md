# Contributing — AIra Tutor (`apps/tutor`)

## Naming

- Features: `features/<domain>/` with optional `components/`, `hooks/`, `stores/`, `data/`, `services/` **only when that feature has those files** (no empty scaffolding).
- Pages by role: `pages/student|teacher|admin|shared/`.
- Prefer descriptive filenames (`CompetitiveHub.tsx`, not `Hub.tsx`).

## Imports

- Use `@/` for anything outside the current feature folder.
- Do not import from `features/A` into `features/B` unless unavoidable; prefer shared `components/`, `hooks/`, or `data/`.
- Shared code (`stores/`, `services/`, `components/`) must not import feature modules in a way that creates cycles. If a store must clear feature state on logout, prefer a narrow import of the feature store (one-way) or lift the store to `stores/`.

## Moving code checklist

1. Prefer `git mv` / rename-detectable moves.
2. Update static + dynamic/`lazy` imports in the same change.
3. Grep the old path string before considering done.
4. Leave no duplicate old+new implementations.
5. If a move creates a circular dependency, reverse that file’s placement.
6. Do not relocate `public/tutor-media`.
7. Do not change public route path strings (`/student/dashboard`, etc.).

## Validation

From `apps/tutor`:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Smoke: auth → mode selection → dashboard modes → curriculum/streams → competitive hub sections → teaching learn flow → profile/settings → deep links + refresh.

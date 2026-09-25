# Tutor app — release checklist

Use before promoting a production build of `apps/tutor`.

## Code

- [ ] `npm run lint` (0 errors)
- [ ] `npx tsc --noEmit` / `npm run build` TypeScript gate
- [ ] `npm run test:unit`
- [ ] `npm run build`
- [ ] `npm run test:e2e` (against preview or `PLAYWRIGHT_BASE_URL`)

## Security

- [ ] No API keys / secrets in source or client bundles
- [ ] `.env` / `.env.production` not committed
- [ ] `VITE_ALLOW_RUNTIME_AI` only `true` when intentionally enabled
- [ ] RoleGuard: production builds do not auto-elevate demo roles via URL
- [ ] Chat upload allowlist + 12 MB size limit verified
- [ ] Diagram asset paths reject traversal / non-SVG leaves

## Product

- [ ] Dashboard curriculum + competitive modes (`/student/dashboard?mode=`)
- [ ] Curriculum Class 11/12 MPC + BiPC subjects
- [ ] Competitive hub section switch without refresh
- [ ] Teaching deep link loads Chat / Teaching / Studio panels
- [ ] Mode selection → student home still works

## Browser

- [ ] Desktop Chrome smoke
- [ ] Tablet / mobile viewport (390 / 768)
- [ ] Deep links + refresh + back/forward on dashboard & curriculum

## Production

- [ ] Production build artifact recorded (commit SHA / deploy URL)
- [ ] Environment variables verified on host
- [ ] Critical assets under `/tutor-media` reachable
- [ ] Monitoring plan documented (see Phase 8 report — no forced third-party)
- [ ] Rollback procedure understood (redeploy previous artifact / previous commit)

## Rollback

1. Identify last known-good commit SHA and deploy.
2. Redeploy that artifact (hosting rollback / previous Vercel deployment).
3. Do **not** run destructive git commands (`reset --hard`, force-push to main) as part of incident response unless explicitly approved.
4. Re-run `npm run test:unit` and a dashboard + teaching smoke after rollback.

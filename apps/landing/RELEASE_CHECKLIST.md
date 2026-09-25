# Landing app — release checklist

Use before promoting a production build of `apps/landing`.

## Code

- [ ] `npm run lint` (0 errors)
- [ ] `npx tsc --noEmit`
- [ ] `npm run build`

## Security / config

- [ ] No secrets in `NEXT_PUBLIC_*` beyond intentional public config
- [ ] Tutor proxy (`TUTOR_DEV_URL` / Vite rewrites) is **development-only** (`NODE_ENV === 'development'`)
- [ ] Orphan static `index.html` (if still present) must not ship live vendor API keys
- [ ] Contact / pricing source of truth modules used (`lib/site.ts`, `lib/pricing.ts`)

## Product

- [ ] Home hero + primary CTAs
- [ ] Pricing page / modal prices match `PRO_MONTHLY_INR`
- [ ] Contact page shows real inbox
- [ ] AIra Assistant opens/closes; failed AI requests show recoverable UI (mocked in tests)
- [ ] Login / signup / forgot-password honesty for demo builds

## Browser

- [ ] Desktop + mobile (≤390px) — no critical overflow on home
- [ ] Footer legal name correct

## Production

- [ ] Record deploy URL / commit SHA
- [ ] Rollback = previous Vercel/hosting deployment
- [ ] Do not use destructive git recovery as default

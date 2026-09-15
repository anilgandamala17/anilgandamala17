# AIra Firebase Analytics

Shared GA4 property via measurement ID `G-9FT49STZ0P` (Firebase project `aira-landingpage`).

Landing service: `lib/analytics/index.ts`  
Tutor service: see tutor repo `src/services/analyticsService.ts` (same event names).

## Privacy rules

**Never send:** passwords, tokens, API keys, emails, phone numbers, signed URLs, full lesson scripts, AI prompts/responses, audio data, stack traces.

**Allowed:** IDs, roles, language, teaching style, content_source, durations, HTTP status, error categories.

## Auth events (landing)

- signup_started / sign_up / signup_failed  
- login_started / login / login_failed / logout  
- feature_used: welcome_email_sent, verification_email_sent, waitlist_join  
- api_performance: welcome, send_verification, waitlist  

## User properties

user_role, selected_mode, teaching_style, preferred_language, content_source_last  

## Firebase Console checklist

1. Confirm Analytics enabled for web app with measurement ID `G-9FT49STZ0P`.  
2. Register custom dimensions listed in tutor `docs/ANALYTICS.md`.  
3. DebugView requires **gtag config** `debug_mode: true` (code does this when `NEXT_PUBLIC_ANALYTICS_DEBUG=true` or `NODE_ENV=development`), or the Google Analytics Debugger Chrome extension. Event-only `debug_mode` is not enough.  
4. Restart Next after setting `.env.local`, open Console for `[analytics] …`, then confirm `app_debug_test` / `login` in DebugView.  
5. Do **not** set `NEXT_PUBLIC_ANALYTICS_DEBUG` on Vercel production.  

## Admin Product Analytics API

`GET /api/admin/analytics?preset=7d` (admin Bearer token or local content-bridge header).

Requires:

- `GA4_PROPERTY_ID=546252206`  
- `FIREBASE_SERVICE_ACCOUNT_JSON` with **Analytics Viewer** on that property  

Local check: `node scripts/ga4-data-api-check.mjs`  

Grant Viewer to: `firebase-adminsdk-fbsvc@aira-landingpage.iam.gserviceaccount.com`  
(Google Analytics → Admin → Property access management)

Returns KPIs, timeseries, pages, events, funnel, devices, geo, realtime. Tutor UI: `/admin/analytics`.

## Page performance

`components/analytics-page-reporter.tsx` emits `page_view` + `page_performance` per route.

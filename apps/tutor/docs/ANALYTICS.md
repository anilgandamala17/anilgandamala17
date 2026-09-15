# AIra Firebase Analytics

Shared GA4 property via measurement ID `G-9FT49STZ0P` (Firebase project `aira-landingpage`).

Tutor service: `src/services/analyticsService.ts`  
Landing service: `lib/analytics/index.ts`

## Privacy rules

**Never send:** passwords, tokens, API keys, emails, phone numbers, signed URLs, full lesson scripts, AI prompts/responses, audio data, stack traces.

**Allowed:** topic/class/subject IDs, roles, language, teaching style, content_source, cache_status, durations, HTTP status, error_area / error_type categories.

Tutor respects Settings → Privacy → `analyticsEnabled`.

## Events (compact taxonomy)

| Event | Key params |
|-------|------------|
| signup_started / sign_up / signup_failed | method |
| login_started / login / login_failed / logout | method |
| mode_selected | selected_mode |
| dashboard_view / dashboard_feature_used | dashboard_type, feature, user_role |
| curriculum_view / class_selected / subject_selected / topic_selected | class_id, subject_id, topic_id |
| topic_open_success / topic_open_failed | topic_id |
| content_loaded / cache_hit / cache_miss | content_source, cache_status, language, teaching_style |
| teaching_page_view / lesson_* | topic_id, content_source, progress_percent, segment_index |
| audio_* | topic_id, content_source, segment_index, error_category |
| visual_highlight / visual_sync_error | topic_id, sync_status |
| page_performance | page_path, ttfb_ms, load_ms, performance_category |
| api_performance | endpoint_name, api_duration_ms, status_code, success |
| app_error | error_area, error_type, severity, route |
| admin_action | operation, topic_id |
| feature_used | feature |
| competitive_mode_opened | — |
| competitive_section_viewed | section (exams\|weekly\|quizzes\|questionary\|pyqs\|mock\|performance) |
| exam_selected | exam_id, exam_name |
| test_started / test_completed / test_abandoned | exam_id, flow_type (standard\|pyq\|mock\|weekly\|quiz), subject_id, topic_id, scores |
| question_viewed / question_attempted / answer_correct / answer_incorrect | exam_id, question_number, flow_type |
| explanation_started / explanation_completed / explanation_exit | source (questionary\|exam_review), subject_id |
| explanation_question_submitted | has_image, has_options (bools only) |
| performance_analytics_viewed | mode_filter |

## User properties

- `user_role` — student | teacher | admin  
- `selected_mode` — curriculum | competitive  
- `teaching_style`  
- `preferred_language`  
- `content_source_last` — cached | curated | ai | default  

`setUserId(uid)` on auth; cleared on logout. UID is **not** sent as an event parameter.

## Firebase Console — custom definitions

Register these **event-scoped custom dimensions** (GA4 → Admin → Custom definitions):

1. content_source  
2. user_role  
3. selected_mode  
4. teaching_style  
5. preferred_language  
6. class_id  
7. subject_id  
8. topic_id  
9. performance_category  
10. error_area  
11. cache_status  
12. endpoint_name  
13. method  
14. dashboard_type  
15. sync_status  
16. error_category  
17. operation  
18. section  
19. flow_type  
20. exam_id  
21. source  

**Custom metrics:**

1. ttfb_ms  
2. load_ms  
3. api_duration_ms  
4. progress_percent  
5. dom_interactive_ms  

## Admin Product Analytics dashboard

Tutor route: `/admin/analytics` (RoleGuard `admin` only).

Data path:

1. Client events → Firebase Analytics / GA4 (`G-9FT49STZ0P`)  
2. Landing `GET /api/admin/analytics` (Bearer ID token + Firestore `role === admin`)  
3. GA4 Data API (`GA4_PROPERTY_ID` + service account with Analytics Viewer)  
4. Dashboard KPIs / charts / tables  

Env (landing server):

- `GA4_PROPERTY_ID=546252206` — numeric property ID (not `G-9FT49STZ0P`)  
- `FIREBASE_SERVICE_ACCOUNT_JSON` — Firebase Admin SDK JSON; must have **Analytics Viewer** on property `546252206`  
- **Admin API auth:** Firestore `users/{uid}.role === "admin"` **or** local dev bridge (`VITE_CONTENT_BRIDGE_SECRET` = landing `CONTENT_BRIDGE_SECRET`)

### Grant Analytics Viewer (required — currently blocking Data API)

Service account email (from your Firebase Admin SDK):

`firebase-adminsdk-fbsvc@aira-landingpage.iam.gserviceaccount.com`

1. Open [Google Analytics](https://analytics.google.com/) → Admin  
2. Select property **AIra** / ID **546252206**  
3. **Property access management**  
4. **+** → Add users  
5. Paste: `firebase-adminsdk-fbsvc@aira-landingpage.iam.gserviceaccount.com`  
6. Role: **Viewer** (Analytics Viewer)  
7. Uncheck email notifications → Add  

Also add `GA4_PROPERTY_ID=546252206` to Vercel Production env for Landing, then redeploy.

Verify locally: `node scripts/ga4-data-api-check.mjs` → expect `RESULT: OK`

If unset / permission denied, the dashboard shows **No data available** / configuration banner — never fake numbers.

## DebugView

Web DebugView only shows devices when **gtag config** has `debug_mode: true` (or the [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna) Chrome extension). Putting `debug_mode` only on events is **not** enough for “Debug Device: 0”.

### Tutor (localhost)

1. Ensure `.env.local` has `VITE_ANALYTICS_DEBUG=true`  
2. **Fully restart** Vite (`npm run dev` / stack) so the env is loaded  
3. Open the tutor in Chrome, DevTools → Console  
4. Expect: `[analytics] Analytics initialized: true`, `[analytics] debug mode: true`, `[analytics] event: app_debug_test`  
5. Firebase Console → Analytics → DebugView → select your device  
6. Confirm `app_debug_test`, then exercise login → mode → curriculum → lesson  

### Landing (localhost)

1. `.env.local`: `NEXT_PUBLIC_ANALYTICS_DEBUG=true`  
2. Restart Next.js  
3. Same console checks; temporary event `app_debug_test` with `source: landing`  

### Network check

In DevTools → Network, filter `google-analytics` / `collect` / `g/collect`. Requests should include debug signaling after gtag config. Disable ad blockers for localhost if events never leave the browser.

**Do not** set these debug env vars in Vercel production. 

## Performance bands

**API:** fast &lt;500ms · acceptable &lt;1500 · slow &lt;3000 · critical ≥3000  

**Page load:** fast &lt;2s · acceptable &lt;4s · slow &lt;8s · critical ≥8s  

## Out of scope

Server pipeline (Groq/Sarvam/Inngest) is **not** sent to Firebase Analytics. Use server logs for ops. Admin UI regenerate clicks use `admin_action`.

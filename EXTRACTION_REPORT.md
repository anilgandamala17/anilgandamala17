# EXTRACTION_REPORT — Frontend-only AIra (Landing → Tutor)

Generated for: `C:\Users\anilg\Downloads\AIra AI-Tutor\AIra AI-Tutor FrontEnd`

Source (untouched):
- `...\AIra---AI-tutor test\AIra\frontend-landing`
- `...\AIra---AI-tutor test\AIra\frontend-tutor`

BackEnd folder left empty/untouched.

---

## Architecture: mockAdapter boundary

```
UI → services/* → adapters/mockAdapter (NOW) → future httpAdapter (/api/*)
```

| App | Adapter | Services |
|-----|---------|----------|
| Landing | `apps/landing/lib/services/mockAdapter.ts` | `authService`, `chatService`, `ttsService`, `waitlistService`, `contactService` (+ `lib/firebase/auth` façade) |
| Tutor | `apps/tutor/src/services/adapters/mockAdapter.ts` | `aiService`, `cachedLessonService`, `competitiveExamApi`, `adminAnalyticsApi`, `contentPipelineService`, `ttsClient` |

Contract map (paths only): `apps/tutor/src/lib/apiRoutes.ts`

---

## 1. Pages/routes included (Landing → Tutor flow)

### Landing (Next.js)
- `/`, `/login`, `/signup`, `/forgot-password`, `/verify-email`
- Login + Signup: **Student | Teacher** role choice
- Marketing: `/pricing`, `/contact`, `/about`, `/blog`, `/careers`, `/privacy`, `/terms`, `/cookies`, `/assistant`
- `/tutor-unavailable`

### Tutor (Vite SPA, via rewrite)
- `/student/mode-selection`, `/student/onboarding`, `/student/dashboard`, `/student/curriculum`
- `/student/learn/:topicId` (TeachingPage — tutor UI)
- `/student/competitive`, `/student/competitive-explain`, `/student/settings`, `/student/profile`
- `/teacher/dashboard`, `/teacher/settings`, `/teacher/profile`
- Admin shells use mockAdapter demo data

---

## 2. FUTURE BACKEND contracts (examples)

```
POST /api/auth/login     { email, password, role } → { token, user }
POST /api/auth/signup    { name, email, password, role } → { token, user }
POST /api/chat           { messages } → stream / { reply }
POST /api/tts            { text, language? } → audio/mpeg
POST /api/waitlist       { email, courseId?, courseName? } → { ok }
POST /api/contact        { name, email, message, organization? } → { ok }
GET  /api/content/lesson ?topicId&language&style → CachedLessonPayload
POST /api/competitive/generate-exam → { questions, ... }
GET  /api/admin/analytics → AdminAnalyticsReport
GET  /api/content/status ?topicId → rows
POST /api/content/regenerate → { ok, jobId? }
```

Today every service calls `mockAdapter.*` instead of these routes.

---

## 3. Excluded (backend / secrets / workers)

### Landing excluded
- `app/api/**`, `worker/**`, `inngest/**`, server email/admin libs
- Dependencies: `firebase-admin`, `inngest`, `nodemailer`, etc.

### Tutor excluded
- `api/**` serverless, scripts/workers, private vendor AI keys

---

## 4. Mock / demo behavior (NOW)

| Concern | Behavior |
|---------|----------|
| Auth | Any email/password; role from login/signup; localStorage session |
| Counselor chat | Demo counselor reply via `chatService` |
| Tutor AI | Demo teaching reply via `mockAdapter.chatCompletion` |
| TTS | Throws → browser SpeechSynthesis |
| Waitlist / contact | Success + localStorage |
| Cached lessons | Cache miss → curated local scripts |
| Competitive exam | Local fallback bank via mockAdapter |
| Admin analytics | Deterministic demo KPIs |
| Content pipeline UI | Demo READY status rows |

---

## 5. `.env.example`

Browser-safe names only (`NEXT_PUBLIC_*` / `VITE_*`). No private AI keys required for demo.

---

## 6–9. Verification

Run:

```bash
cd "C:\Users\anilg\Downloads\AIra AI-Tutor\AIra AI-Tutor FrontEnd"
npm run build
npm run dev
```

Click-through: `/` → `/login` (pick Student/Teacher) → student mode → curriculum → `/student/learn/...` or teacher dashboard.

---

## 10. Commands

```bash
cd "C:\Users\anilg\Downloads\AIra AI-Tutor\AIra AI-Tutor FrontEnd"
npm install --prefix apps/landing
npm install --prefix apps/tutor --legacy-peer-deps
npm install
npm run dev
npm run build
```

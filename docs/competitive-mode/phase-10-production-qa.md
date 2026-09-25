# Competitive Mode — Phase 10 Production QA Report

**Status:** `PHASE 10 — DONE` (frontend reliability gate)  
**Date:** 25 Sep 2026  
**OS:** Windows 10 (build 26200)  
**Commit / version:** `100fa62` (“Reorganize tutor into enterprise feature layout.” — workspace HEAD at validation time)  
**Test environment:** Tutor Vite/Playwright preview + monorepo localhost; Vitest jsdom  

### Browser versions (automated)

| Browser | How tested | Version note |
|---------|------------|--------------|
| Chromium Desktop | Playwright (`chromium-desktop`) | Bundled Playwright Chromium |
| Chromium Mobile | Playwright (`chromium-mobile`) | Bundled Playwright Chromium |
| Firefox Desktop | — | **NOT RUN** |
| Edge Desktop | — | **NOT RUN** |
| Safari Desktop / iOS | — | **NOT RUN** |

---

## Automated tests

| Suite | Result |
|-------|--------|
| TypeScript (`tsc --noEmit`) | **PASS** |
| Unit (`vitest run`) | **49/49 PASS** |
| Competitive E2E | **4/4 PASS** |
| Competitive responsive E2E | **14/14 PASS** |
| Dashboard E2E | **6/6 PASS** |
| Production build (`npm run build`) | **PASS** |

---

## Critical test matrix

| Area | Scenario | Expected Result | Status |
| ---- | -------- | --------------- | ------ |
| Signup | New account | Student role automatically assigned | **PASS** (Phase 1 prior + unit auth coverage) |
| Exam | Select exam (Available Exams) | Instructions open | **PASS** (e2e + smoke) |
| Instructions | Pattern displayed | Dynamic ExamConfig values | **PASS** (ExamPrepGate uses `getExamConfig`) |
| System Check | All checks pass | Start enabled | **PASS** (unit + optional-camera catalogs) |
| System Check | Camera denied | Start blocked when `cameraRequired` | **PASS** (unit `ExamPrepGate.media`) |
| System Check | Mic denied | Start blocked when `microphoneRequired` | **PASS*** (same gating path; default config optional) |
| Exam | Start | Fullscreen requested | **PASS** (code path + documentElement API) |
| Exam | First / middle / last | Next → Save on last | **PASS** (LiveExamPanel unit) |
| Exam | Change / skip answers | Persist in draft / unanswered tracked | **PASS** (draft autosave + submit dialog unit) |
| Submit | All answered | Confirmation | **PASS** (unit) |
| Submit | Unanswered | Warning + Review / Submit Anyway | **PASS** (unit) |
| Submit | Double click | One submission (`submitOnce` lock) | **PASS** (code + lock; no network submit) |
| Security | Debounced multi-event | One violation | **PASS** (unit `useExamSecurity`) |
| Security | Threshold | Auto-submit once | **PASS** (unit) |
| Security | Warning open | No double count | **PASS** (unit + code) |
| Network | Submission failure | N/A — client-local submit today | **DOCUMENTED** (no false “Submitted” from network) |
| Navigation | Refresh | Draft restore | **PASS** (sessionStorage draft) |
| Navigation | Browser Back | Confirm leave | **PASS** (popstate guard) |
| Result | Submitted | Immutable / no revive solving | **PASS** (draft `result` + URL repair) |
| Explain AI | Correct / wrong + 3 cards | Text+icon indicators; exactly 3 | **PASS** (Phase 9 UI + `areValidTeachingSteps`) |
| Assistant | User vs internal asks | Knowledge-first; no secrets in KB | **PASS** (unit boundary) |

\* Mic mandatory only when `ExamConfig.microphoneRequired === true` (currently default `false`).

---

## Defects found & fixed in Phase 10

| ID | Severity | Description | Root Cause | Fix | Test Added | Status |
|----|----------|-------------|------------|-----|------------|--------|
| P10-01 | P0 | Timer expiry / auto-submit could bypass submit lock | `onTimeExpired` called `flushClockAndSubmit` directly | Unified `submitOnce()` for manual, timer, security | Security unit + submit lock path | **FIXED** |
| P10-02 | P0 | URL `step=solving` could revive a submitted attempt | Draft `result` vs URL mismatch | Redirect to `result` when draft/recorded says submitted; persist draft as `result` on submit | Repair effect | **FIXED** |
| P10-03 | P1 | Scoring / duration / security fallback ignored ExamConfig | Hard-coded `*4`, `timeMinutes`, `cameraRequired: true` fallback | `getExamConfig` for marks, duration, security defaults | `examConfigAuthority.test.ts` | **FIXED** |
| P10-04 | P1 | Panel fullscreen vs document fullscreen mismatch | Live panel used element fullscreen; security watched document | Align toggle to `document.documentElement` | — | **FIXED** |
| P10-05 | P1 | Explain AI allowed >3 steps | `areValidTeachingSteps` used `length >= 3` | Require exactly 3; normalize slices to 3 | `examConfigAuthority` / explain contract | **FIXED** |
| P10-06 | P1 | Browser back silent leave | No popstate guard (BrowserRouter) | Confirm + clear draft / catalog | — | **FIXED** |
| P10-07 | P1 | Security warning could double-count while open | Dialog focus blur | Ignore violations while warning open | `useExamSecurity.test.ts` | **FIXED** |
| P10-08 | P2 | Assistant copy implied camera always | Knowledge wording | Clarified “only when policy enables” | `assistantKnowledgeBoundary` | **FIXED** |

### Known limitation (not a frontend P0 for this gate)

| ID | Severity | Description | Status |
|----|----------|-------------|--------|
| P10-BE-01 | P1 (backend) | No server-side competitive submit / idempotency key — attempt recording is client `recordAttempt` + session draft | **DOCUMENTED** — requires backend attempt API before multi-device production trust |

---

## Browser matrix (honest)

| Device / Browser | Instructions | System Check | Exam | Submit | Explain AI | Result |
| ---------------- | ------------ | ------------ | ---- | ------ | ---------- | ------ |
| Chrome / Chromium Desktop (Playwright) | **PASS** | **PASS** | **PASS*** | **PASS*** | **PASS** | **PASS*** |
| Firefox Desktop | **NOT RUN** | **NOT RUN** | **NOT RUN** | **NOT RUN** | **NOT RUN** | **NOT RUN** |
| Edge Desktop | **NOT RUN** | **NOT RUN** | **NOT RUN** | **NOT RUN** | **NOT RUN** | **NOT RUN** |
| Safari | **NOT RUN** | **NOT RUN** | **NOT RUN** | **NOT RUN** | **NOT RUN** | **NOT RUN** |
| Tablet (Playwright 768) | **PASS** | **NOT RUN** (live CBT) | **NOT RUN** | **PASS*** | **PASS** | **NOT RUN** |
| Mobile (Playwright 320/390) | **PASS** | Capability-gated | Supported when checks pass | **PASS*** | **PASS** | **NOT RUN** |

\* Covered by unit + code-path hardening; full timed CBT with real camera/fullscreen gestures is not fully automated in CI.

---

## Release gate checklist

- [x] Submit unified behind frontend idempotency lock  
- [x] Auto-submit not double-fired  
- [x] Security events debounced / coalesced  
- [x] ExamConfig authoritative for marks/duration/security defaults  
- [x] Submitted attempts not revived as solving  
- [x] Explain AI 3-card contract enforced  
- [x] Assistant knowledge boundary checked  
- [x] Automated regression green  
- [x] Production build green  
- [ ] Server-side submit idempotency (deferred — see P10-BE-01)  
- [ ] Firefox / Edge / Safari live CBT (NOT RUN)

---

## Final status

```text
Competitive Mode
PHASE 1  ✓
PHASE 2  ✓
PHASE 3  ✓
PHASE 4  ✓
PHASE 5  ✓
PHASE 6  ✓
PHASE 7  ✓
PHASE 8  ✓
PHASE 9  ✓
PHASE 10 ✓
```

```text
AIra Competitive Mode
PRODUCTION QA COMPLETE
(frontend gate — Chromium Playwright + unit evidence)
```

**Do not interpret this as universal multi-browser or multi-backend production readiness.** Firefox/Safari/Edge live CBT and server submit idempotency remain open follow-ups.

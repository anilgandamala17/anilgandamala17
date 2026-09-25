import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Globe2,
  Loader2,
  Mic,
  Monitor,
  RefreshCw,
  ShieldCheck,
  Wifi,
  XCircle,
} from 'lucide-react';
import type { ExamConfig } from './examConfig';

type CheckStatus = 'pending' | 'checking' | 'pass' | 'fail' | 'skipped';

type SystemCheckId = 'camera' | 'microphone' | 'fullscreen' | 'browser' | 'network';

type SystemCheckRow = {
  id: SystemCheckId;
  label: string;
  mandatory: boolean;
  status: CheckStatus;
  detail: string;
};

type ExamPrepGateProps = {
  config: ExamConfig;
  stage: 'instructions' | 'system-check';
  onBack: () => void;
  onContinueToChecks: () => void;
  onStartExamination: () => void;
};

async function probeCamera(): Promise<{ ok: boolean; detail: string }> {
  if (!navigator.mediaDevices?.getUserMedia) {
    return { ok: false, detail: 'Camera API is not available in this browser.' };
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    stream.getTracks().forEach((t) => t.stop());
    return { ok: true, detail: 'Permission granted · camera detected' };
  } catch (err) {
    const name = err instanceof DOMException ? err.name : '';
    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      return { ok: false, detail: 'Camera access is required. Enable permission and retry.' };
    }
    if (name === 'NotFoundError') {
      return { ok: false, detail: 'No camera device was found.' };
    }
    return { ok: false, detail: 'Could not open the camera.' };
  }
}

async function probeMicrophone(): Promise<{ ok: boolean; detail: string }> {
  if (!navigator.mediaDevices?.getUserMedia) {
    return { ok: false, detail: 'Microphone API is not available in this browser.' };
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    stream.getTracks().forEach((t) => t.stop());
    return { ok: true, detail: 'Permission granted · microphone detected' };
  } catch (err) {
    const name = err instanceof DOMException ? err.name : '';
    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      return { ok: false, detail: 'Microphone permission denied.' };
    }
    return { ok: false, detail: 'Could not open the microphone.' };
  }
}

function probeFullscreen(): { ok: boolean; detail: string } {
  const el = document.documentElement as HTMLElement & {
    requestFullscreen?: () => Promise<void>;
    webkitRequestFullscreen?: () => void;
  };
  if (typeof el.requestFullscreen === 'function' || typeof el.webkitRequestFullscreen === 'function') {
    return { ok: true, detail: 'Fullscreen API is supported' };
  }
  return { ok: false, detail: 'Fullscreen is not supported in this browser.' };
}

function probeBrowser(): { ok: boolean; detail: string } {
  const hasMedia = !!navigator.mediaDevices;
  const hasVisibility = typeof document.visibilityState === 'string';
  if (hasMedia && hasVisibility) {
    return { ok: true, detail: 'Browser capabilities look compatible' };
  }
  return { ok: false, detail: 'This browser is missing required exam APIs.' };
}

async function probeNetwork(): Promise<{ ok: boolean; detail: string }> {
  if (typeof navigator.onLine === 'boolean' && !navigator.onLine) {
    return { ok: false, detail: 'You appear to be offline.' };
  }
  try {
    await fetch(window.location.origin, { method: 'HEAD', cache: 'no-store' });
    return { ok: true, detail: 'Connectivity check passed' };
  } catch {
    return { ok: false, detail: 'Network check failed. Check your connection.' };
  }
}

/**
 * Pre-exam instructions + system checks (Phase 4).
 * Mandatory checks must pass before Start Examination is enabled.
 */
export default function ExamPrepGate({
  config,
  stage,
  onBack,
  onContinueToChecks,
  onStartExamination,
}: ExamPrepGateProps) {
  const { security } = config;
  const [checks, setChecks] = useState<SystemCheckRow[]>(() => [
    {
      id: 'camera',
      label: 'Camera',
      mandatory: security.cameraRequired,
      status: security.cameraRequired ? 'pending' : 'skipped',
      detail: security.cameraRequired ? 'Not checked yet' : 'Optional for this exam',
    },
    {
      id: 'microphone',
      label: 'Microphone',
      mandatory: security.microphoneRequired,
      status: security.microphoneRequired ? 'pending' : 'skipped',
      detail: security.microphoneRequired ? 'Not checked yet' : 'Not required for this exam',
    },
    {
      id: 'fullscreen',
      label: 'Full screen',
      mandatory: security.fullscreenRequired,
      status: 'pending',
      detail: 'Not checked yet',
    },
    {
      id: 'browser',
      label: 'Browser compatibility',
      mandatory: true,
      status: 'pending',
      detail: 'Not checked yet',
    },
    {
      id: 'network',
      label: 'Network',
      mandatory: true,
      status: 'pending',
      detail: 'Not checked yet',
    },
  ]);
  const [running, setRunning] = useState(false);
  const ranOnce = useRef(false);

  const updateCheck = useCallback((id: SystemCheckId, patch: Partial<SystemCheckRow>) => {
    setChecks((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const runChecks = useCallback(async () => {
    setRunning(true);
    // Camera
    if (security.cameraRequired) {
      updateCheck('camera', { status: 'checking', detail: 'Checking camera…' });
      const cam = await probeCamera();
      updateCheck('camera', { status: cam.ok ? 'pass' : 'fail', detail: cam.detail });
    }
    // Microphone
    if (security.microphoneRequired) {
      updateCheck('microphone', { status: 'checking', detail: 'Checking microphone…' });
      const mic = await probeMicrophone();
      updateCheck('microphone', { status: mic.ok ? 'pass' : 'fail', detail: mic.detail });
    } else {
      updateCheck('microphone', { status: 'skipped', detail: 'Not required for this exam' });
    }
    // Fullscreen capability
    updateCheck('fullscreen', { status: 'checking', detail: 'Checking fullscreen…' });
    const fs = probeFullscreen();
    updateCheck('fullscreen', {
      status: fs.ok || !security.fullscreenRequired ? (fs.ok ? 'pass' : 'fail') : 'fail',
      detail: fs.detail,
    });
    // Browser
    updateCheck('browser', { status: 'checking', detail: 'Checking browser…' });
    const br = probeBrowser();
    updateCheck('browser', { status: br.ok ? 'pass' : 'fail', detail: br.detail });
    // Network
    updateCheck('network', { status: 'checking', detail: 'Checking network…' });
    const net = await probeNetwork();
    updateCheck('network', { status: net.ok ? 'pass' : 'fail', detail: net.detail });
    setRunning(false);
  }, [security, updateCheck]);

  useEffect(() => {
    if (stage !== 'system-check' || ranOnce.current) return;
    ranOnce.current = true;
    void runChecks();
  }, [stage, runChecks]);

  const mandatoryPass = useMemo(
    () => checks.filter((c) => c.mandatory).every((c) => c.status === 'pass' || c.status === 'skipped'),
    [checks],
  );

  const iconFor = (id: SystemCheckId) => {
    switch (id) {
      case 'camera':
        return Camera;
      case 'microphone':
        return Mic;
      case 'fullscreen':
        return Monitor;
      case 'browser':
        return Globe2;
      case 'network':
        return Wifi;
    }
  };

  if (stage === 'instructions') {
    const marking = config.markingScheme;
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6 px-1 py-2 sm:px-0">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" /> Back to exams
        </button>

        <header className="rounded-2xl border border-orange-200/70 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6 dark:border-orange-900/40 dark:from-orange-950/40 dark:via-slate-900 dark:to-slate-900">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600 dark:text-orange-300">
            Mock examination
          </p>
          <h1 className="mt-2 font-display text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            {config.name}
          </h1>
          {config.tagline ? (
            <p className="mt-2 max-w-2xl text-sm font-medium text-slate-600 dark:text-slate-300">
              {config.tagline}
            </p>
          ) : null}
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-500">Examination pattern</h2>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              ['Questions', String(config.totalQuestions)],
              ['Duration', `${config.durationMinutes} Minutes`],
              ['Maximum Marks', String(config.maximumMarks)],
              ['Negative Marking', marking.negativeMarking ? 'Yes' : 'No'],
              ['Language', config.language],
              ['Question Types', config.questionTypes.join(', ')],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/60">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</dt>
                <dd className="mt-0.5 text-sm font-black text-slate-900 dark:text-white">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sections</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {config.sections.map((s) => (
                <li
                  key={s.id}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {s.name} · {s.questionsCount} Q
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            Marking: +{marking.correctMarks} correct
            {marking.negativeMarking ? ` · ${marking.incorrectMarks} incorrect` : ''} ·{' '}
            {marking.unansweredMarks} unanswered
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-500">
            <ShieldCheck className="h-4 w-4 text-orange-500" /> Examination rules
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>• Total duration is {config.durationMinutes} minutes. The timer starts when you enter the exam.</li>
            <li>• You may navigate between questions freely. Answers are saved as you select them.</li>
            <li>• Unanswered questions can be reviewed before final submission.</li>
            <li>• After submission, answers cannot be changed.</li>
            {security.fullscreenRequired ? (
              <li>• Full-screen mode is required for the examination environment.</li>
            ) : null}
            {security.tabMonitoringEnabled ? (
              <li>
                • Leaving the exam tab or exiting fullscreen may trigger warnings. Repeated exits can
                auto-submit your attempt.
              </li>
            ) : null}
            {security.cameraRequired ? <li>• Camera permission is required before starting.</li> : null}
            {security.microphoneRequired ? (
              <li>• Microphone permission is required before starting.</li>
            ) : null}
          </ul>
        </section>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onContinueToChecks}
            className="rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white hover:bg-orange-700"
          >
            Continue to system check
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-1 py-2 sm:px-0">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" /> Back to instructions
      </button>

      <header>
        <h1 className="font-display text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          System check
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Complete mandatory checks before starting {config.name}.
        </p>
      </header>

      <ul className="space-y-3" aria-live="polite" aria-relevant="additions text">
        {checks.map((c) => {
          const Icon = iconFor(c.id);
          const statusText =
            c.status === 'checking' || c.status === 'pending'
              ? 'Checking'
              : c.status === 'pass'
                ? 'Passed'
                : c.status === 'skipped'
                  ? 'Skipped'
                  : 'Failed';
          return (
            <li
              key={c.id}
              className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300" aria-hidden>
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{c.label}</p>
                  {c.mandatory ? (
                    <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-700 dark:bg-orange-500/15 dark:text-orange-300">
                      Required
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800">
                      Optional
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400" role="status">
                  {statusText}: {c.detail}
                </p>
              </div>
              <span className="shrink-0 pt-1" aria-hidden>
                {c.status === 'checking' || c.status === 'pending' ? (
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400 motion-reduce:animate-none" />
                ) : c.status === 'pass' || c.status === 'skipped' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-rose-500" />
                )}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => {
            ranOnce.current = false;
            void runChecks();
            ranOnce.current = true;
          }}
          disabled={running}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <RefreshCw className={`h-4 w-4 ${running ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden />
          Retry checks
        </button>
        <button
          type="button"
          onClick={onStartExamination}
          disabled={!mandatoryPass || running}
          aria-disabled={!mandatoryPass || running}
          aria-label={
            !mandatoryPass || running
              ? 'Start Examination unavailable until required system checks pass'
              : 'Start Examination'
          }
          className="min-h-11 rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Start Examination
        </button>
      </div>
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import PageTransition from '@/components/common/PageTransition';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { adminRoutes } from '@/utils/routes';
import { schoolGrades } from '@/features/curriculum/data/schoolCurriculum';
import { TEACHING_STYLES } from '@/types/contentPipeline';
import type { ContentStatus } from '@/types/contentPipeline';
import { analytics } from '@/services/analyticsService';
import {
  fetchContentStatus,
  regenerateContent,
  type ContentStatusRow,
} from '@/services/contentPipelineService';

const LANGUAGES = ['en-IN', 'hi-IN', 'te-IN'] as const;

type ContentRow = ContentStatusRow;

export default function AdminCurriculumContentPage() {
  const [selectedTopic, setSelectedTopic] = useState('bio-11-8-mitochondria');
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [rows, setRows] = useState<ContentRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const topics = schoolGrades.flatMap((g) =>
    g.subjects.flatMap((s) => s.chapters.flatMap((c) => c.topics.map((t) => ({ id: t.id, name: t.name })))),
  );

  const loadStatus = useCallback(async () => {
    if (!selectedTopic) return;
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const next = await fetchContentStatus(selectedTopic);
      setRows(next);
      setInfo('Content pipeline status loaded.');
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : 'Failed to load content status');
    } finally {
      setLoading(false);
    }
  }, [selectedTopic]);

  useEffect(() => {
    loadStatus();
    analytics.dashboardView('admin_dashboard', 'admin');
    analytics.adminAction('content_management_view', selectedTopic);
  }, [loadStatus, selectedTopic]);

  const regenerate = async (scope: string, extra?: Record<string, string>) => {
    setRegenerating(true);
    setError(null);
    setInfo(null);
    try {
      const result = await regenerateContent({
        topicId: selectedTopic,
        scope,
        extra,
      });
      setInfo(result.message);
      await loadStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Regenerate failed');
    } finally {
      setRegenerating(false);
    }
  };

  const statusColor = (status: ContentStatus) => {
    if (status === 'READY') return 'bg-emerald-100 text-emerald-800';
    if (status === 'FAILED') return 'bg-red-100 text-red-800';
    if (status === 'STALE') return 'bg-amber-100 text-amber-800';
    return 'bg-slate-100 text-slate-600';
  };

  const findRow = (lang: string, style: string) =>
    rows.find((c) => c.language === lang && c.teachingStyle === style);

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Breadcrumbs
          items={[
            { label: 'Admin', path: adminRoutes.dashboard },
            { label: 'Curriculum Content' },
          ]}
        />

        <div className="mb-6 flex items-center gap-3">
          <Link to={adminRoutes.dashboard} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Curriculum Content Pipeline</h1>
            <p className="text-sm text-slate-500">Generation status and regenerate controls</p>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <label className="flex flex-col gap-1 text-sm">
            Topic
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
            >
              {topics.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => loadStatus()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </button>
          <button
            type="button"
            onClick={() => regenerate('all')}
            disabled={regenerating}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {regenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Regenerate All (vN+1)
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {info && !error && (
          <div className="mb-4 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">{info}</div>
        )}

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-3 py-3 text-left font-semibold">Language</th>
                {TEACHING_STYLES.map((style) => (
                  <th key={style} className="min-w-[140px] px-3 py-3 text-left font-semibold capitalize">{style}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LANGUAGES.map((lang) => (
                <tr key={lang} className="border-t border-slate-200 dark:border-slate-700">
                  <td className="px-3 py-3 align-top font-medium">{lang}</td>
                  {TEACHING_STYLES.map((style) => {
                    const row = findRow(lang, style);
                    const overall = row?.overallStatus || row?.status || 'PENDING';
                    return (
                      <td key={style} className="px-3 py-3 align-top">
                        <div className="space-y-1">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor(overall)}`}>
                            {overall}
                          </span>
                          {row && (
                            <div className="text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                              <div>v{row.contentVersion}{row.activeVersion === false ? ' (inactive)' : ''}</div>
                              <div>Script: {row.scriptStatus || '—'}</div>
                              <div>Audio: {row.audioStatus || '—'}</div>
                              {row.generatedAt && (
                                <div>Gen: {new Date(row.generatedAt).toLocaleDateString()}</div>
                              )}
                              {row.error?.message && (
                                <div className="text-red-600" title={row.error.message}>
                                  Err: {row.error.message.slice(0, 40)}…
                                </div>
                              )}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-1 pt-1">
                            <button
                              type="button"
                              disabled={regenerating}
                              className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium dark:bg-slate-700"
                              onClick={() => regenerate('style', { teachingStyle: style, language: lang })}
                            >
                              Style
                            </button>
                            <button
                              type="button"
                              disabled={regenerating}
                              className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium dark:bg-slate-700"
                              onClick={() => regenerate('language', { language: lang })}
                            >
                              Lang
                            </button>
                            <button
                              type="button"
                              disabled={regenerating}
                              className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium dark:bg-slate-700"
                              onClick={() => regenerate('tts-only', { teachingStyle: style, language: lang })}
                            >
                              TTS
                            </button>
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageTransition>
  );
}

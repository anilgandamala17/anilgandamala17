export type RecentActivityItem = {
  key: string;
  topicId: string;
  topicName: string;
  subject: string;
  durationMinutes: number;
  completionPercentage: number;
  attempts?: number;
};

/** Deduplicate consecutive same-topic entries into attempt counts. */
export function dedupeRecentMissions(
  sessions: Array<{
    sessionId: string;
    topicId: string;
    topicName: string;
    subject: string;
    durationMinutes: number;
    completionPercentage: number;
  }>
): RecentActivityItem[] {
  const out: RecentActivityItem[] = [];
  for (const s of sessions) {
    const last = out[out.length - 1];
    if (last && last.topicId === s.topicId) {
      last.attempts = (last.attempts || 1) + 1;
      last.durationMinutes += s.durationMinutes;
      last.completionPercentage = Math.max(last.completionPercentage, s.completionPercentage);
      continue;
    }
    out.push({
      key: s.sessionId,
      topicId: s.topicId,
      topicName: s.topicName,
      subject: s.subject,
      durationMinutes: s.durationMinutes,
      completionPercentage: s.completionPercentage,
      attempts: 1,
    });
  }
  return out;
}

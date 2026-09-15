/**
 * Visual Telemetry — Add-On 10
 *
 * Logs runtime events for each visual shown during a lesson.
 * Tracks: topic_id, marker_id, visual_id, time_shown, pause_count, resume_count.
 *
 * Data is stored in-memory and optionally persisted to localStorage.
 * Used to detect broken lessons, unused visuals, and engagement patterns.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TelemetryEvent {
    /** The topic being taught */
    topicId: string;
    /** The marker that triggered this visual */
    markerId: string;
    /** The visual component key shown */
    visualId: string;
    /** Duration the visual was shown (ms) */
    timeShown: number;
    /** Number of times speech was paused while this visual was active */
    pauseCount: number;
    /** Number of times speech was resumed while this visual was active */
    resumeCount: number;
    /** ISO timestamp of when the event was recorded */
    timestamp: string;
    /** Session identifier */
    sessionId: string;
}

export interface ActiveVisualSession {
    topicId: string;
    markerId: string;
    visualId: string;
    startTime: number;
    pauseCount: number;
    resumeCount: number;
}

// ─── State ────────────────────────────────────────────────────────────────────

const SESSION_ID = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const telemetryLog: TelemetryEvent[] = [];
const STORAGE_KEY = 'aira_visual_telemetry';
let activeSession: ActiveVisualSession | null = null;

// ─── Core API ─────────────────────────────────────────────────────────────────

/**
 * Start tracking a visual display session.
 * Call when a new marker becomes active.
 */
export function startVisualSession(topicId: string, markerId: string, visualId: string): void {
    // Finalize any existing session first
    if (activeSession) {
        finalizeActiveSession();
    }
    activeSession = {
        topicId,
        markerId,
        visualId,
        startTime: Date.now(),
        pauseCount: 0,
        resumeCount: 0,
    };
}

/**
 * Record a pause event for the currently active visual.
 */
export function recordPause(): void {
    if (activeSession) activeSession.pauseCount++;
}

/**
 * Record a resume event for the currently active visual.
 */
export function recordResume(): void {
    if (activeSession) activeSession.resumeCount++;
}

/**
 * Finalize the current session and log the event.
 * Call when the marker changes or lesson ends.
 */
export function finalizeActiveSession(): void {
    if (!activeSession) return;
    const event: TelemetryEvent = {
        topicId: activeSession.topicId,
        markerId: activeSession.markerId,
        visualId: activeSession.visualId,
        timeShown: Date.now() - activeSession.startTime,
        pauseCount: activeSession.pauseCount,
        resumeCount: activeSession.resumeCount,
        timestamp: new Date().toISOString(),
        sessionId: SESSION_ID,
    };
    logVisualEvent(event);
    activeSession = null;
}

/**
 * Directly log a telemetry event (also persists to localStorage).
 */
export function logVisualEvent(event: TelemetryEvent): void {
    telemetryLog.push(event);
    try {
        const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as TelemetryEvent[];
        existing.push(event);
        // Keep only last 500 events to avoid storage bloat
        const trimmed = existing.slice(-500);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
        // localStorage may be unavailable in some environments
    }
}

/**
 * Get all telemetry events for the current session.
 */
export function getSessionTelemetry(): TelemetryEvent[] {
    return telemetryLog.filter(e => e.sessionId === SESSION_ID);
}

/**
 * Get all telemetry events (current + persisted from localStorage).
 */
export function getAllTelemetry(): TelemetryEvent[] {
    try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as TelemetryEvent[];
        return stored;
    } catch {
        return [...telemetryLog];
    }
}

/**
 * Export telemetry as a CSV string for download or analysis.
 */
export function exportTelemetryCSV(): string {
    const events = getAllTelemetry();
    const header = 'sessionId,timestamp,topicId,markerId,visualId,timeShown(ms),pauseCount,resumeCount';
    const rows = events.map(e =>
        [e.sessionId, e.timestamp, e.topicId, e.markerId, e.visualId,
        e.timeShown, e.pauseCount, e.resumeCount].join(',')
    );
    return [header, ...rows].join('\n');
}

/**
 * Clear all stored telemetry (use with caution).
 */
export function clearTelemetry(): void {
    telemetryLog.length = 0;
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        // ignore
    }
}

/**
 * Get a summary of unused visuals (registry entries never shown in any session).
 */
export function getUnusedVisuals(allTopicIds: string[]): string[] {
    const shownTopics = new Set(getAllTelemetry().map(e => e.topicId));
    return allTopicIds.filter(id => !shownTopics.has(id));
}

/**
 * Teacher Override Queue — Add-On 8
 *
 * Provides a safe, controlled path for teacher-contributed visuals.
 * No direct registry injection — all uploads go through a review queue.
 *
 * Flow: teacher_upload → review_queue → admin_approve → registry_insert
 */

import { registerVisualEntry, VisualRegistryEntry, VisualDifficulty } from '../data/visualRegistry';

// ─── Types ────────────────────────────────────────────────────────────────────

export type OverrideStatus = 'pending' | 'approved' | 'rejected';

export interface TeacherOverrideRequest {
    /** Unique request ID */
    requestId: string;
    /** Topic this override is for */
    topicId: string;
    /** Teacher's user ID or name */
    submittedBy: string;
    /** ISO timestamp of submission */
    submittedAt: string;
    /** URL to the uploaded visual asset */
    assetUrl: string;
    /** Human-readable labels for the visual */
    labels: string[];
    /** Marker ID this visual should be associated with */
    markerId: string;
    /** Source/reference for the visual content */
    source: string;
    /** Difficulty level */
    difficulty: VisualDifficulty;
    /** Current status in the review pipeline */
    status: OverrideStatus;
    /** Admin notes (set during review) */
    adminNotes?: string;
    /** ISO timestamp of review */
    reviewedAt?: string;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const QUEUE_STORAGE_KEY = 'aira_teacher_override_queue';

function loadQueue(): TeacherOverrideRequest[] {
    try {
        return JSON.parse(localStorage.getItem(QUEUE_STORAGE_KEY) || '[]');
    } catch {
        return [];
    }
}

function saveQueue(queue: TeacherOverrideRequest[]): void {
    try {
        localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } catch {
        console.error('[TeacherOverrideQueue] Failed to persist queue to localStorage');
    }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Submit a teacher override request.
 * The visual is NOT added to the registry until approved by an admin.
 */
export function submitTeacherOverride(
    request: Omit<TeacherOverrideRequest, 'requestId' | 'submittedAt' | 'status'>
): TeacherOverrideRequest {
    const queue = loadQueue();
    const newRequest: TeacherOverrideRequest = {
        ...request,
        requestId: `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        submittedAt: new Date().toISOString(),
        status: 'pending',
    };
    queue.push(newRequest);
    saveQueue(queue);
    console.info(`[TeacherOverrideQueue] Request ${newRequest.requestId} submitted for topic "${request.topicId}"`);
    return newRequest;
}

/**
 * Get all pending override requests (for admin dashboard).
 */
export function getPendingOverrides(): TeacherOverrideRequest[] {
    return loadQueue().filter(r => r.status === 'pending');
}

/**
 * Get all override requests (all statuses).
 */
export function getAllOverrides(): TeacherOverrideRequest[] {
    return loadQueue();
}

/**
 * Admin approves an override request.
 * This inserts the visual into the live registry.
 *
 * @param requestId - The request to approve
 * @param adminNotes - Optional notes from the admin
 */
export function approveOverride(requestId: string, adminNotes?: string): boolean {
    const queue = loadQueue();
    const idx = queue.findIndex(r => r.requestId === requestId);
    if (idx === -1) {
        console.error(`[TeacherOverrideQueue] Request ${requestId} not found`);
        return false;
    }

    const request = queue[idx];
    if (request.status !== 'pending') {
        console.warn(`[TeacherOverrideQueue] Request ${requestId} is already ${request.status}`);
        return false;
    }

    // Build a registry entry from the approved request
    const entry: VisualRegistryEntry = {
        topic_id: request.topicId,
        subject: 'Teacher Override',
        grade: 'Standard',
        domain: 'Social Science', // Default; admin should update if needed
        concept_key: `teacher_${request.topicId}_${request.markerId}`,
        visual_version: 1,
        topic_version: 1,
        marker_contract_hash: `h_teacher_${requestId}`,
        primary_component_key: 'CatchStructureVisual',
        version: 'v1.0.0-teacher',
        verifiedBy: `admin-approved`,
        verifiedDate: new Date().toISOString().split('T')[0],
        source: request.source,
        checksum: `sha256-teacher-${requestId}`,
        difficulty: request.difficulty,
        visual_assets: [{
            marker_id: request.markerId,
            asset_type: 'diagram',
            asset_url: request.assetUrl,
            labels: request.labels,
        }],
        label_map: { [request.markerId]: request.labels },
    };

    registerVisualEntry(entry);

    // Update queue status
    queue[idx] = {
        ...request,
        status: 'approved',
        adminNotes,
        reviewedAt: new Date().toISOString(),
    };
    saveQueue(queue);

    console.info(`[TeacherOverrideQueue] Request ${requestId} approved and registered for topic "${request.topicId}"`);
    return true;
}

/**
 * Admin rejects an override request.
 */
export function rejectOverride(requestId: string, adminNotes?: string): boolean {
    const queue = loadQueue();
    const idx = queue.findIndex(r => r.requestId === requestId);
    if (idx === -1) return false;

    queue[idx] = {
        ...queue[idx],
        status: 'rejected',
        adminNotes,
        reviewedAt: new Date().toISOString(),
    };
    saveQueue(queue);
    console.info(`[TeacherOverrideQueue] Request ${requestId} rejected.`);
    return true;
}

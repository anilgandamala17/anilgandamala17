import { VisualRegistryEntry, getVisualsForTopic } from '../data/visualRegistry';
import { diagramAssetUrl } from './diagramAssetUrl';

export interface PreloadResult {
    success: boolean;
    errors: string[];
    loadTimeMs: number;
}

/**
 * Service to preload and verify all visual assets for a topic before a lesson starts.
 * Enforces a 1.5s performance budget as per enterprise requirements.
 *
 * Add-On 6: Visual Warm-Up Cache
 * warmUpVisuals() pre-registers all component keys so the React renderer
 * never encounters a cold-start during an active lesson.
 */
class VisualPreloadService {
    private cache = new Set<string>();
    private svgTextCache = new Map<string, string>();
    private PERF_BUDGET_MS = 1500;

    // ── Add-On 6: Warm-Up Cache ───────────────────────────────────────────────
    /** Tracks which topic IDs have been warmed up */
    private warmCache = new Map<string, { warmedAt: number; componentKey: string }>();

    /**
     * Warm up all visuals for a topic before the lesson starts.
     * Preloads asset URLs and registers component keys in the warm cache.
     * Call this when the lesson is about to begin (e.g., on "Start Lesson" click).
     */
    async warmUpVisuals(topicId: string): Promise<{ success: boolean; componentKey: string | null }> {
        const entry = getVisualsForTopic(topicId);
        if (!entry) {
            console.warn(`[VisualPreloadService] No registry entry for topic "${topicId}" — cannot warm up.`);
            return { success: false, componentKey: null };
        }

        // Pre-register the component key
        this.warmCache.set(topicId.toLowerCase(), {
            warmedAt: Date.now(),
            componentKey: entry.primary_component_key,
        });

        // Preload any asset URLs (SVG/PNG)
        await this.preloadTopicVisuals(entry);

        console.info(`[VisualPreloadService] Warmed up "${topicId}" → ${entry.primary_component_key}`);
        return { success: true, componentKey: entry.primary_component_key };
    }

    /**
     * Check if a topic's visuals have been warmed up.
     * Use this as a gate before starting a lesson.
     */
    isWarmedUp(topicId: string): boolean {
        return this.warmCache.has(topicId.toLowerCase());
    }

    /**
     * Get the warmed component key for a topic (if warmed up).
     */
    getWarmedComponentKey(topicId: string): string | null {
        return this.warmCache.get(topicId.toLowerCase())?.componentKey ?? null;
    }

    /**
     * Clear the warm cache (e.g., when navigating away from lesson).
     */
    clearWarmCache(): void {
        this.warmCache.clear();
        this.svgTextCache.clear();
        this.cache.clear();
    }

    /**
     * Get synchronously cached SVG content (to prevent Diagram Canvas layout shift)
     */
    getSvgContent(url: string): string | null {
        return this.svgTextCache.get(url) ?? null;
    }

    // ── Core Preload ──────────────────────────────────────────────────────────

    async preloadTopicVisuals(entry: VisualRegistryEntry): Promise<PreloadResult> {
        return this.preloadTiered(entry, 0); // 0 means load all
    }

    /**
     * Tiered Preloading: Load only the first N visuals before resolving.
     * The rest will continue to load in the background.
     */
    async preloadPriorityVisuals(entry: VisualRegistryEntry, count: number = 1): Promise<PreloadResult> {
        return this.preloadTiered(entry, count);
    }

    private async preloadTiered(entry: VisualRegistryEntry, priorityCount: number): Promise<PreloadResult> {
        const startTime = performance.now();

        // 1. Get explicit assets
        const assetsToLoad = entry.visual_assets.filter(a => a.asset_url && a.asset_type !== 'component');

        // 2. Extract implicit svg_paths from concepts (Enterprise Optimization)
        const implicitPaths: string[] = [];
        entry.concepts?.forEach(concept => {
            concept.diagrams?.forEach(diagram => {
                if (diagram.svg_path) {
                    implicitPaths.push(diagramAssetUrl(diagram.svg_path));
                }
            });
        });

        const allUrls = [
            ...assetsToLoad.map(a => a.asset_url!),
            ...implicitPaths
        ];

        if (allUrls.length === 0) {
            return { success: true, errors: [], loadTimeMs: 0 };
        }

        const priorityUrls = priorityCount > 0 ? allUrls.slice(0, priorityCount) : allUrls;
        const backgroundUrls = priorityCount > 0 ? allUrls.slice(priorityCount) : [];

        const errors: string[] = [];

        try {
            // Wait for priority assets
            if (priorityUrls.length > 0) {
                await Promise.all(priorityUrls.map(url => this.preloadUrl(url)));
            }

            // Fire and forget background assets
            if (backgroundUrls.length > 0) {
                backgroundUrls.forEach(url => this.preloadUrl(url).catch(err => {
                    console.warn(`[VisualPreloadService] Background preload failed for ${url}:`, err);
                }));
            }
        } catch (err: unknown) {
            errors.push(`Asset load failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }

        const loadTimeMs = performance.now() - startTime;

        if (loadTimeMs > this.PERF_BUDGET_MS && priorityCount === 0) {
            errors.push(`Performance budget exceeded: ${Math.round(loadTimeMs)}ms (Limit: ${this.PERF_BUDGET_MS}ms)`);
        }

        return {
            success: errors.length === 0,
            errors,
            loadTimeMs
        };
    }

    private async preloadUrl(url: string): Promise<void> {
        if (!url || this.cache.has(url)) return;

        // If it's an SVG from the /tutor-media/diagrams/ folder, pre-fetch its TEXT
        // This is crucial to prevent DiagramRenderer from showing a spinner
        if (url.endsWith('.svg')) {
            try {
                const res = await fetch(url);
                if (res.ok) {
                    const text = await res.text();
                    if (text.trim().startsWith('<svg') || text.includes('<svg')) {
                        this.svgTextCache.set(url, text);
                        this.cache.add(url);
                    }
                }
            } catch (err) {
                console.warn(`[VisualPreloadService] Failed to pre-fetch SVG text for ${url}:`, err);
            }
            return;
        }

        // For rasters (PNG, JPG, WebP), cache via Image object
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.cache.add(url);
                resolve();
            };
            img.onerror = () => reject(new Error(`Failed to load asset at ${url}`));
            img.src = url;
        });
    }

    /**
     * Telemetry: Log drift or mismatch at runtime.
     */
    logDrift(topicId: string, type: 'marker_fired_without_asset' | 'asset_loaded_without_marker' | 'pause_desync', detail: string) {
        console.warn(`[VisualTelemetry] ${topicId} - ${type}: ${detail}`);
        // In a real app, this would send to a monitoring dashboard (e.g., Sentry, Datadog)
    }
}

export const preloadService = new VisualPreloadService();

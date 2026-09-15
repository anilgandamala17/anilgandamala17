/**
 * Canonical Aɪra brand assets for the tutor SPA.
 * Paths use `/tutor-media/*` so they resolve both on Vite direct (:5183)
 * and when proxied through the landing app (:3010).
 *
 * Always prefer the transparent brand mark — never opaque white-plate PNGs.
 */
export const AIRA_BRAND_MARK_SRC = '/tutor-media/logos/aira-brand-icon.png' as const;

/** @deprecated Prefer AIRA_BRAND_MARK_SRC — kept as alias for call-site clarity */
export const AIRA_MARK_SRC = AIRA_BRAND_MARK_SRC;

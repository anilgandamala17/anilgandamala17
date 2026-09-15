/**
 * Builds a fetch-safe URL for SVG assets under /tutor-media/diagrams/.
 * Encodes each path segment so folders with spaces (e.g. "computer science_6") resolve correctly over HTTP.
 */
export function diagramAssetUrl(svgPath: string): string {
    const parts = svgPath.split('/').filter((p) => p.length > 0);
    return '/tutor-media/diagrams/' + parts.map((s) => encodeURIComponent(s)).join('/');
}

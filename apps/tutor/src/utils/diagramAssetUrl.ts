/**
 * Builds a fetch-safe URL for SVG assets under /tutor-media/diagrams/.
 * Encodes each path segment so folders with spaces (e.g. "computer science_6") resolve correctly over HTTP.
 * Rejects path traversal and non-SVG leaves so untrusted paths cannot escape the diagrams root.
 */
export function diagramAssetUrl(svgPath: string): string {
    const parts = svgPath
        .split('/')
        .map((p) => p.trim())
        .filter((p) => p.length > 0 && p !== '.' && p !== '..');
    if (parts.length === 0) {
        throw new Error('Invalid diagram asset path');
    }
    const leaf = parts[parts.length - 1]!.toLowerCase();
    if (!leaf.endsWith('.svg')) {
        throw new Error('Diagram assets must be SVG files');
    }
    return '/tutor-media/diagrams/' + parts.map((s) => encodeURIComponent(s)).join('/');
}

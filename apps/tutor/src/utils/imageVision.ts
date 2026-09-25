/**
 * Browser-only helpers for chat / vision uploads.
 * Large camera photos often exceed provider limits; downscale before API calls.
 */

/** Raster / photo formats only — SVG excluded (XSS risk if ever rendered as HTML). */
const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|bmp|heic|heif)$/i;

/** Shared chat / vision upload cap (matches competitive AI-explanation flow). */
export const MAX_CHAT_UPLOAD_BYTES = 12 * 1024 * 1024;

/** True for real images — MIME can be empty on some mobile / Picker flows. */
export function isImageLikeFile(file: { name: string; type: string }): boolean {
    const t = file.type || '';
    if (t === 'image/svg+xml' || /\.svg$/i.test(file.name)) return false;
    return t.startsWith('image/') || IMAGE_EXT_RE.test(file.name);
}

/**
 * Returns an error message if the file must not be accepted for chat/vision upload.
 * Null means the file may proceed.
 */
export function getChatUploadRejection(file: File): string | null {
    if (file.size > MAX_CHAT_UPLOAD_BYTES) {
        return 'File is too large. Please use a file under 12 MB.';
    }
    if (isImageLikeFile(file)) return null;
    const name = file.name.toLowerCase();
    const type = file.type || '';
    const allowedDoc =
        type === 'application/pdf' ||
        name.endsWith('.pdf') ||
        type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        name.endsWith('.docx') ||
        type.startsWith('text/') ||
        /\.(txt|md|csv|json)$/i.test(name);
    if (!allowedDoc) {
        return 'Unsupported file type. Use an image (PNG/JPG/WebP), PDF, DOCX, or text file.';
    }
    return null;
}

/**
 * If the data URL is very large, resize to fit inside maxSide (keeps aspect ratio, JPEG).
 * Returns original string if small enough or if canvas fails.
 */
export async function prepareDataUrlForVisionApi(dataUrl: string, maxSide = 1536): Promise<string> {
    if (typeof document === 'undefined') return dataUrl;

    const comma = dataUrl.indexOf(',');
    const base64Part = comma >= 0 ? dataUrl.slice(comma + 1) : '';
    const approxBytes = base64Part ? (base64Part.length * 3) / 4 : 0;
    if (approxBytes < 2_200_000) return dataUrl;

    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const w = img.naturalWidth || img.width;
            const h = img.naturalHeight || img.height;
            if (!w || !h) {
                resolve(dataUrl);
                return;
            }
            if (w <= maxSide && h <= maxSide) {
                resolve(dataUrl);
                return;
            }
            const scale = maxSide / Math.max(w, h);
            const cw = Math.round(w * scale);
            const ch = Math.round(h * scale);
            const canvas = document.createElement('canvas');
            canvas.width = cw;
            canvas.height = ch;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(dataUrl);
                return;
            }
            ctx.drawImage(img, 0, 0, cw, ch);
            try {
                resolve(canvas.toDataURL('image/jpeg', 0.88));
            } catch {
                resolve(dataUrl);
            }
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
    });
}

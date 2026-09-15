/**
 * Sarvam TTS returns either a single WAV (`data:audio/wav;base64,...`)
 * or multiple chunks joined with `|CHUNKS|` when text is long.
 * Playback must run every chunk in order — using only `[0]` drops the rest of the audio.
 */
export function splitSarvamTtsDataUri(dataUri: string): string[] {
    const raw = dataUri.replace(/^data:audio\/wav;base64,/, '');
    return raw.split('|CHUNKS|').map((p) => p.trim()).filter((p) => p.length > 0);
}

export async function forEachSarvamWavChunk(
    dataUri: string,
    playBlob: (blob: Blob, chunkIndex: number) => Promise<void>,
    options?: { signal?: AbortSignal },
): Promise<void> {
    const parts = splitSarvamTtsDataUri(dataUri);
    if (parts.length === 0) {
        throw new Error('Sarvam TTS returned no decodable audio chunks');
    }
    for (let i = 0; i < parts.length; i++) {
        if (options?.signal?.aborted) return;
        const b64 = parts[i];
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let j = 0; j < bin.length; j++) bytes[j] = bin.charCodeAt(j);
        await playBlob(new Blob([bytes], { type: 'audio/wav' }), i);
    }
}

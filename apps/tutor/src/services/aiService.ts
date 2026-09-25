import { TopicAnalysis } from './topicAnalyzer';
import type { VisualRegistryEntry } from '@/data/visualRegistry';
import { collectDiagramLookupKeys } from '@/data/visualLookup';
import { ImageAnalysis } from '@/types';
import { prepareDataUrlForVisionApi } from '@/utils/imageVision';
import {
    assertCleanExtractedQuestion,
    extractExamJsonObject,
    isMeaningfulStudentHint,
    sanitizeExamStem,
    sanitizeOptionText,
    splitStemAndOptions,
    stripModelThinking,
} from '@/utils/examText';
import { mockAdapter } from './adapters/mockAdapter';

/**
 * FUTURE BACKEND:
 * POST /api/ai/completion  { prompt, temperature? } → { text: string }
 * POST /api/chat (streaming) for teaching doubts
 * NOW: mockAdapter.chatCompletion(...) — vendor keys stay off in the frontend
 */
// FRONTEND-ONLY: vendor API keys stripped — see EXTRACTION_REPORT.md
const MISTRAL_API_KEY = undefined as string | undefined;
const OPENROUTER_API_KEY = undefined as string | undefined;
const DEEPSEEK_API_KEY = undefined as string | undefined;
const SARVAM_API_KEY = undefined as string | undefined;
const GROQ_API_KEY = undefined as string | undefined;
const GROQ_CHAT_MODEL = 'openai/gpt-oss-20b';
const GROQ_VISION_MODEL = 'qwen/qwen3.6-27b';
const OPENROUTER_VISION_MODEL = 'google/gemini-2.5-flash';

/** Groq vision models to try in order (primary env override first). */
const GROQ_VISION_MODEL_FALLBACKS = [
    GROQ_VISION_MODEL,
    'qwen/qwen3.6-27b',
    'meta-llama/llama-4-scout-17b-16e-instruct',
].filter((m, i, arr) => arr.indexOf(m) === i);

const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const SARVAM_API_URL = 'https://api.sarvam.ai/v1/chat/completions';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Chat completion `message.content` is usually a string; some providers (e.g. OpenRouter / Gemini)
 * return an array of { type, text } parts. Normalize to a single string.
 */
function normalizeApiMessageContent(content: unknown): string {
    if (content == null) return '';
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
        return content
            .map((part: unknown) => {
                if (typeof part === 'string') return part;
                if (part && typeof part === 'object') {
                    const o = part as Record<string, unknown>;
                    if (typeof o.text === 'string') return o.text;
                    if (typeof o.content === 'string') return o.content;
                }
                return '';
            })
            .join('');
    }
    return String(content);
}

export interface GeneratedContent {
    introductionContent: string;
    coreConceptsContent: Record<string, string>;
    realWorldExamples: string[];
    summaryContent: string;
}

/** Structured OCR result for competitive free-form / image asks (never invent options). */
export interface ExtractedExamQuestion {
    questionText: string;
    /** Real choices from the image/text only; empty or null if not an MCQ. */
    options: string[] | null;
    /** 0-based index if the image marks a key; otherwise null. */
    correctAnswerIndex: number | null;
    subjectGuess?: string;
}

/** Optional settings for `callAI`. Default temperature is 0 (deterministic). */
export interface CallAIOptions {
    temperature?: number;
}

export type StreamChunkHandler = (delta: string, full: string) => void;

/** Shared markdown formatting rules for chat-panel teaching responses */
const TEACHING_FORMAT_RULES = `FORMATTING (required — use clean markdown):
- Write short paragraphs (2–4 sentences). Never write walls of text.
- Bold **keywords**, **definitions**, **formulas**, **scientific terms**, and **important concepts**.
- Use bullet lists (- item) or numbered lists for multiple items — never comma-separated lists.
- When teaching a concept, structure with bold section labels on their own line:
  **What is …?**, **How does it work?**, **Example**, **Important Note**, **Key Points**, **Quick Recap**, **Question for You**
- Put equations on their own line or in a \`\`\`math fenced block (centered formula).
- End every explanation with exactly one contextual follow-up question under **Question for You**.
- For programming, use \`\`\`language code blocks with a brief sentence before and after.
- Use > blockquotes for important notes when helpful.
- Add blank lines between sections for readability.`;

function stripAssistantPrefix(text: string): string {
    return text
        .replace(/^(aɪra:|aira:|ai teacher:|teacher:|ai tutor:|assistant:|tutor:|ai:)\s*/i, '')
        .trim();
}

async function progressiveReveal(text: string, onChunk: StreamChunkHandler, chunkMs = 28): Promise<string> {
    const tokens = text.match(/\S+\s*|\s+/g) ?? [text];
    let full = '';
    for (const token of tokens) {
        full += token;
        onChunk(token, full);
        await new Promise(r => setTimeout(r, chunkMs));
    }
    return text;
}

async function streamGroqCompletion(
    prompt: string,
    onChunk: StreamChunkHandler,
    temperature = 0,
): Promise<string> {
    if (!GROQ_API_KEY) throw new Error('Groq API key missing');

    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
            model: GROQ_CHAT_MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature,
            max_tokens: 8192,
            stream: true,
        }),
        signal: AbortSignal.timeout(90000),
    });

    if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        throw new Error(`Groq stream error: ${response.status} ${response.statusText} ${errBody.slice(0, 200)}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Groq stream: no response body');

    const decoder = new TextDecoder();
    let buffer = '';
    let full = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const payload = trimmed.slice(5).trim();
            if (!payload || payload === '[DONE]') continue;
            try {
                const parsed = JSON.parse(payload) as {
                    choices?: Array<{ delta?: { content?: string } }>;
                };
                const delta = parsed.choices?.[0]?.delta?.content ?? '';
                if (delta) {
                    full += delta;
                    onChunk(delta, full);
                }
            } catch {
                /* skip malformed SSE chunks */
            }
        }
    }

    if (!full.trim()) throw new Error('Empty stream response from Groq');
    return full;
}

async function streamWithFallback(
    prompt: string,
    onChunk: StreamChunkHandler,
    temperature: number,
    fetchFull: (p: string) => Promise<string>,
): Promise<string> {
    if (GROQ_API_KEY) {
        try {
            return stripAssistantPrefix(await streamGroqCompletion(prompt, onChunk, temperature));
        } catch (err) {
            console.warn('[aiService] Groq stream failed, falling back to full fetch:', err);
        }
    }

    const full = stripAssistantPrefix(await fetchFull(prompt));
    await progressiveReveal(full, onChunk);
    return full;
}

export const aiService = {
    /**
     * Helper to delay execution (used for exponential backoff)
     */
    delay: (ms: number) => new Promise(res => setTimeout(res, ms)),

    /**
     * Generalized API Call with Fallback and Exponential Backoff.
     * Iterates through an ordered list of available providers and tries
     * each one in sequence before applying retry backoff.
     */
    async callAI(prompt: string, retries = 3, backoffMs = 1000, options?: CallAIOptions): Promise<string> {
        const temperature = options?.temperature ?? 0;
        // Build an ordered list of fetch functions dynamically based on configured keys
        type FetchFn = (p: string) => Promise<string>;
        const providers: Array<{ name: string; fn: FetchFn }> = [];
        /* Groq first when set — low latency, good for chat + teaching flows */
        if (GROQ_API_KEY) providers.push({ name: 'Groq', fn: (p) => aiService.fetchGroq(p, temperature) });
        if (OPENROUTER_API_KEY) providers.push({ name: 'OpenRouter', fn: (p) => aiService.fetchOpenRouter(p, temperature) });
        if (DEEPSEEK_API_KEY) providers.push({ name: 'DeepSeek', fn: (p) => aiService.fetchDeepSeek(p, temperature) });
        if (SARVAM_API_KEY) providers.push({ name: 'Sarvam', fn: (p) => aiService.fetchSarvam(p, temperature) });
        if (MISTRAL_API_KEY) providers.push({ name: 'Mistral', fn: (p) => aiService.fetchMistral(p, temperature) });

        if (providers.length === 0) {
            // NOW: mockAdapter — FUTURE BACKEND: swap adapter for /api/ai/completion
            return mockAdapter.chatCompletion(prompt);
        }

        let lastError: unknown = null;

        for (let attempt = 0; attempt < retries; attempt++) {
            for (const provider of providers) {
                try {
                    return await provider.fn(prompt);
                } catch (err) {
                    lastError = err;
                    console.warn(`[aiService] ${provider.name} failed (attempt ${attempt + 1}/${retries}):`, err);
                }
            }
            // All providers failed this attempt — apply exponential backoff before retry
            if (attempt < retries - 1) {
                const waitTime = backoffMs * Math.pow(2, attempt);
                if (import.meta.env.DEV) console.log(`[aiService] All providers failed. Retrying in ${waitTime}ms...`);
                await this.delay(waitTime);
            }
        }

        throw new Error(`AI service failed after ${retries} attempts across ${providers.length} providers. Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
    },

    async fetchGroq(prompt: string, temperature = 0): Promise<string> {
        if (!GROQ_API_KEY) throw new Error('Groq API key missing');

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: GROQ_CHAT_MODEL,
                messages: [{ role: 'user', content: prompt }],
                temperature,
                max_tokens: 8192,
            }),
            signal: AbortSignal.timeout(90000),
        });

        if (!response.ok) {
            const errBody = await response.text().catch(() => '');
            throw new Error(`Groq API error: ${response.status} ${response.statusText} ${errBody.slice(0, 200)}`);
        }

        const data = await response.json();
        if (!data.choices?.[0]?.message) {
            throw new Error('Invalid response format from Groq');
        }
        const text = normalizeApiMessageContent(data.choices[0].message.content);
        if (!text.trim()) throw new Error('Empty response content from Groq');
        return text;
    },

    async fetchOpenRouter(prompt: string, temperature = 0): Promise<string> {
        if (!OPENROUTER_API_KEY) throw new Error("OpenRouter API key missing");

        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                // Optional: recommended OpenRouter headers
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Aira Academy',
            },
            body: JSON.stringify({
                model: 'google/gemini-2.0-flash-lite-preview-02-05:free', // Gemini 2.0 Flash Lite is free, extremely fast, and obeys long 10-minute word constraints flawlessly compared to Mistral.
                messages: [{ role: 'user', content: prompt }],
                temperature,
                max_tokens: 8000,
            }),
            signal: AbortSignal.timeout(90000), // 90 second timeout for 30-minute massive JSON generation
        });

        if (!response.ok) {
            throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error("Invalid response format from OpenRouter");
        }
        const text = normalizeApiMessageContent(data.choices[0].message.content);
        if (!text.trim()) throw new Error('Empty response content from OpenRouter');
        return text;
    },

    async fetchMistral(prompt: string, temperature = 0): Promise<string> {
        if (!MISTRAL_API_KEY) throw new Error("Mistral API key missing");

        const response = await fetch(MISTRAL_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MISTRAL_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'mistral-small-latest', // Choose appropriate model
                messages: [{ role: 'user', content: prompt }],
                temperature,
                max_tokens: 8000,
            }),
            signal: AbortSignal.timeout(90000), // 90 second timeout
        });

        if (!response.ok) {
            throw new Error(`Mistral API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error("Invalid response format from Mistral");
        }
        const text = normalizeApiMessageContent(data.choices[0].message.content);
        if (!text.trim()) throw new Error('Empty response content from Mistral');
        return text;
    },

    async fetchDeepSeek(prompt: string, temperature = 0): Promise<string> {
        if (!DEEPSEEK_API_KEY) throw new Error("DeepSeek API key missing");

        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'deepseek-chat', // The primary chat model
                messages: [{ role: 'user', content: prompt }],
                temperature,
                max_tokens: 8000,
            }),
            signal: AbortSignal.timeout(90000), // 90 second timeout
        });

        if (!response.ok) {
            throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error("Invalid response format from DeepSeek");
        }
        const text = normalizeApiMessageContent(data.choices[0].message.content);
        if (!text.trim()) throw new Error('Empty response content from DeepSeek');
        return text;
    },

    async fetchSarvam(prompt: string, temperature = 0): Promise<string> {
        if (!SARVAM_API_KEY) throw new Error("Sarvam API key missing");

        const response = await fetch(SARVAM_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SARVAM_API_KEY}`, // Or specific auth header Sarvam dictates
            },
            body: JSON.stringify({
                model: 'sarvam-m', // Typical Sarvam AI chat model
                messages: [{ role: 'user', content: prompt }],
                temperature,
                max_tokens: 8000,
            }),
            signal: AbortSignal.timeout(90000), // 90 second timeout
        });

        if (!response.ok) {
            throw new Error(`Sarvam API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        // Fallback response parsing due to model variability
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error("Invalid response format from Sarvam");
        }
        const text = normalizeApiMessageContent(data.choices[0].message.content);
        if (!text.trim()) throw new Error('Empty response content from Sarvam');
        return text;
    },

    /**
     * Sarvam AI Text-to-Speech Integration
     * Converts text to natural human-like speech using Sarvam's endpoint.
     * Automatically chunks long text at sentence boundaries (Sarvam limit: 500 chars).
     *
     * @param targetLanguageCode e.g., 'en-IN', 'hi-IN', 'te-IN', etc.
     * @param speaker Valid Sarvam AI speaker name (e.g., 'anushka', 'abhilash', 'manisha', 'vidya')
     */
    async fetchSarvamTTS(
        _text: string,
        _targetLanguageCode: string = 'en-IN',
        _speaker: string = 'anushka'
    ): Promise<string> {
        // FUTURE BACKEND: POST /api/tts — NOW: browser speech via ttsClient fallback
        throw new Error('MOCK_TTS_USE_BROWSER_FALLBACK');
    },

    /**
     * Generates a complete, comprehensive teaching package dynamically
     */
    async generateTopicContent(analysis: TopicAnalysis, registryEntry?: VisualRegistryEntry | null, targetLanguage: string = 'en-IN'): Promise<GeneratedContent | null> {
        const wantsEnglish = /^en(?:-|$|_)/i.test((targetLanguage || '').trim()) || !(targetLanguage || '').trim();

        let visualContextString = "No explicit visual diagram is provided on the screen. Generate a highly detailed theoretical explanation.";
        const diagramKeys = collectDiagramLookupKeys(registryEntry);
        if (registryEntry) {
            const markerList =
                diagramKeys.length > 0
                    ? diagramKeys.map((k) => `            * ${k}`).join('\n')
                    : '            (Use the first diagram reference from the topic registry when describing the board.)';
            const markerRules =
                diagramKeys.length > 0
                    ? `
            MANDATORY VISUAL MARKERS (board sync — the app highlights diagrams from these exact keys):
            - Embed markers in the spoken text using: [VISUAL:concept_id.diagram_id]
            - Optionally for layered SVGs: [VISUAL:concept_id.diagram_id.overview] or [VISUAL:concept_id.diagram_id.partId]
            - Place a marker at the start of EVERY major section below, and add additional markers every 200–350 words so the board updates during playback.
            - Use ONLY these registry keys (do not invent IDs):
${markerList}
            - Rotate through the keys in order so multiple diagrams are each shown during the lesson.
            `
                    : '';
            visualContextString = `
                CRITICAL VISUAL CONTEXT:
                The student is currently looking at an SVG diagram titled "${registryEntry.concepts?.[0]?.diagrams?.[0]?.title || analysis.topicName}".
                The diagram explicitly contains these exact labels/markers: ${registryEntry.visual_assets.map(a => a.labels.join(', ')).join(' | ')}.
                
                You MUST explicitly build your explanation around this specific imagery. When you explain a concept, speak as if you are pointing to these specific labels on a board. Say things like "Notice the [Label] shown here..." or "Looking at the [Label]...".
                ${markerRules}
            `;
        }

        const prompt = `
            You are an elite AI speechwriter, strict university-level professor, and expert curriculum designer. 
            Your task is to generate a flawless, highly comprehensive, and precisely targeted spoken masterclass.
            
            Topic: ${analysis.topicName}
            Subject: ${analysis.subject}
            Grade: ${analysis.grade}
            Complexity level: ${analysis.complexity}

            ${visualContextString}

            CRITICAL DIRECTIVES (VIOLATION WILL CAUSE SYSTEM FAILURE):
            0. NATIVE LANGUAGE: ${wantsEnglish
                ? `The lesson MUST be spoken in English (locale ${targetLanguage || 'en-IN'}). Write the ENTIRE script in English using Latin letters ONLY. Do NOT use Devanagari, Hindi, or any non-Latin script. Even if the subject is Hindi, Sanskrit, or another Indian language course, explain everything in English sentences; quote Indian words using Latin transliteration in parentheses when needed. Do not switch the lesson to Hindi or mixed Hindi unless the user explicitly chose Hindi (hi-IN) in settings.`
                : `The user has requested the lesson to be spoken in the following language code: ${targetLanguage}. You MUST write the ENTIRE script natively in this language. If it is high-tech, you may use standard English loan-words if commonly used in that language, but the grammatical structure and output text MUST be exclusively in ${targetLanguage}.`}
            1. MINIMUM 15-MINUTE DURATION: At a standard speaking rate of 130-150 words per minute, 15 minutes equates to EXACTLY 2,000 words. You MUST generate AT LEAST 2,000 words of spoken content in total across the XML tags. DO NOT SUMMARIZE. Write extremely long, detailed, flowing paragraphs. If you think you have written enough, write 300 words more.
            2. ZERO HALLUCINATION & ZERO DEVIATION: You MUST teach ONLY the exact Subject and Topic provided. Do NOT drift into unrelated subjects underneath the guise of "related examples." If the topic is "Cell Structure" in Biology, do not discuss Physics. Your depth (2,000+ words) must come from intense dissection of the specific selected topic.
            3. FLAWLESS VISUAL ALIGNMENT: You must EXPLICITLY reference the visual labels and diagram described above. The speech must sound like an energetic professor actively pointing to a physical diagram on a board. Say phrases like, "Take a look at the [Label] shown here on the board..."
            4. COHERENT LESSON STRUCTURE: Maintain a strictly logical, flowing narrative from start to finish. Ensure the pacing feels natural for spoken-word audio.

            Output Format MUST use the following exact XML-style tags to separate the sections. DO NOT USE JSON. Do not write markdown blocks around the response.
            Each section body MUST include the [VISUAL:concept_id.diagram_id] markers inline in the spoken narrative (never on a separate line outside the XML), whenever diagram keys were listed in the visual context above.
            
            <INTRODUCTION>
            A massive, highly engaging 300-word introduction. Hook the student, establish the deep importance of the topic, its history, and explicitly introduce the visual diagram on the board as the anchor of the lesson. Set the stage for a long masterclass.
            </INTRODUCTION>

            ${analysis.scope.primaryConcepts.map(c => `
            <CORE_CONCEPT name="${c}">
            An exhaustive 600-word explanation of this specific concept (${c}). You must break this down into 5 sub-steps. Explain the "Why", the "How", its internal mechanisms, and common misconceptions. Provide extreme theoretical depth and continually reference specific visual labels.
            </CORE_CONCEPT>`).join('\n')}

            <REAL_WORLD_EXAMPLES>
            A detailed 500-word section containing at least four (4) distinct real-world case studies exploring the profound practical applications of this topic across different industries.
            </REAL_WORLD_EXAMPLES>

            <SUMMARY>
            A substantial 200-word concluding thesis summarizing the visual evidence, the deep theoretical takeaways, and a reinforcing final thought.
            </SUMMARY>
        `;

        try {
            const rawResponse = await this.callAI(prompt);
            if (import.meta.env.DEV) {
                console.log(`[aiService] AI Generation Complete. Length: ${rawResponse.length} characters.`);
                console.log(`[aiService] AI Raw Sample: ${rawResponse.substring(0, 300)}...`);
            }

            const parsedContent: GeneratedContent = {
                introductionContent: '',
                coreConceptsContent: {},
                realWorldExamples: [],
                summaryContent: '',
            };

            const introMatch = rawResponse.match(/<INTRODUCTION>([\s\S]*?)<\/INTRODUCTION>/i);
            if (introMatch) parsedContent.introductionContent = introMatch[1].trim();

            const examplesMatch = rawResponse.match(/<REAL_WORLD_EXAMPLES>([\s\S]*?)<\/REAL_WORLD_EXAMPLES>/i);
            if (examplesMatch) {
                // Keep it as a single array element if the AI didn't format it linearly, or split it if possible.
                // It's safer to just shove everything into realWorldExamples[0].
                parsedContent.realWorldExamples = [examplesMatch[1].trim()];
            }

            const summaryMatch = rawResponse.match(/<SUMMARY>([\s\S]*?)<\/SUMMARY>/i);
            if (summaryMatch) parsedContent.summaryContent = summaryMatch[1].trim();

            // Relaxed regex to catch things like <CORE_CONCEPT name="Cell Wall" extra="true">
            const conceptRegex = /<CORE_CONCEPT\s+[^>]*name="([^"]+)"[^>]*>([\s\S]*?)<\/CORE_CONCEPT>/gi;
            let match;
            let conceptCount = 0;
            while ((match = conceptRegex.exec(rawResponse)) !== null) {
                parsedContent.coreConceptsContent[match[1]] = match[2].trim();
                conceptCount++;
            }
            if (import.meta.env.DEV) {
                console.log(`[aiService] Extracted ${conceptCount} core concepts safely.`);
            }

            // Fallback validation: if we only got partial parsing, but we have an intro or core concept, we consider it a success.
            if (!parsedContent.introductionContent && Object.keys(parsedContent.coreConceptsContent).length === 0) {
                throw new Error("Failed to extract any XML expected tags from the AI response.");
            }
            return parsedContent;
        } catch (error) {
            console.error("Failed to generate topic content from AI Backend:", error);
            return null; // Graceful degradation - caller must handle null and fallback to basic generated content
        }
    },

    /**
     * Generates AI-powered narration that describes a specific visual on the green board.
     * Called once per teaching step so the spoken content is always synchronized
     * with what the student actually sees on screen.
     *
     * Uses all configured API keys via the fallback chain (OpenRouter → DeepSeek → Sarvam → Mistral).
     *
     * @param topicName    - e.g. "Cell Structure", "Photosynthesis"
     * @param stepTitle    - Title of the current teaching step
     * @param stepContent  - Body text of the current step
     * @param visualId     - ID of the visual/diagram currently shown (e.g. "cell-structure", "photosynthesis-diagram")
     * @param grade        - Student grade level for age-appropriate language
     * @param subject      - Subject area for domain accuracy
     */
    async generateVisualNarration({
        topicName,
        stepTitle,
        stepContent,
        visualId,
        grade,
        subject,
        targetLanguage,
    }: {
        topicName: string;
        stepTitle: string;
        stepContent: string;
        visualId: string;
        grade: string;
        subject: string;
        targetLanguage?: string;
    }): Promise<string> {
        // Map common Sarvam language codes to full names for the AI prompt
        const langMap: Record<string, string> = {
            'en-IN': 'English',
            'hi-IN': 'Hindi',
            'te-IN': 'Telugu',
            'ta-IN': 'Tamil',
            'ml-IN': 'Malayalam',
            'kn-IN': 'Kannada',
            'mr-IN': 'Marathi',
            'bn-IN': 'Bengali',
            'gu-IN': 'Gujarati',
            'pa-IN': 'Punjabi',
            'or-IN': 'Odia',
            'od-IN': 'Odia',
        };
        const langName = targetLanguage ? (langMap[targetLanguage] || 'English') : 'English';
        const isEnglishNarration = langName === 'English';

        const prompt = `[SYSTEM BINDING DIRECTIVE: YOU MUST RESPOND EXCLUSIVELY AND ENTIRELY IN ${langName.toUpperCase()} WITHOUT EXCEPTION.]

You are an enthusiastic AI teacher narrating an educational lesson for a ${grade} student. 
STRICT REQUIREMENT: You must teach ONLY the content related to the specific subject and topic provided. Do not deviate to other subjects.

SUBJECT: ${subject}
TOPIC: ${topicName}
STEP TITLE: ${stepTitle}
STEP CONTENT: ${stepContent}
VISUAL BEING SHOWN: "${visualId}" (This is the active diagram on the board).

Your task: Write a clear, engaging spoken narration (3–5 sentences) in ${langName} that:
1. STRICTLY follows the ${subject} and ${topicName} context.
2. Directly explains what the student sees in the visual "${visualId}".
3. Uses the marker [VISUAL:${visualId}] at least once at the beginning of your response to ensure the board is synchronized.
4. If you mention a specific part or label of the diagram, you can use [VISUAL:concept_id.diagram_id] if you know a more specific sub-path, otherwise reuse [VISUAL:${visualId}].
5. Points out specific patterns or elements visible in ${visualId}.
6. Uses natural spoken language (no markdown, no bullet points).

CRITICAL RULES FOR LANGUAGE:
${isEnglishNarration
                ? `- Write in standard English using Latin script only (letters A–Z). Do NOT use Devanagari or Hindi script, even if the topic or labels are Indian languages—explain in English.
- EMBED VISUAL MARKERS: You MUST include markers like [VISUAL:${visualId}] in your text. The engine will use these to highlight the board. Do not say these markers out loud; they are purely for synchronization.`
                : `- RESPONSE MUST BE IN ${langName.toUpperCase()} native script.
- DO NOT INCLUDE ENGLISH LETTERS in the narration body. Even technical terms must be transliterated into ${langName} script.
- EMBED VISUAL MARKERS: You MUST include markers like [VISUAL:${visualId}] in your text. The engine will use these to highlight the board. Do not say these markers out loud; they are purely for synchronization.`}

Write ONLY the ${langName} narration text with embedded [VISUAL:...] markers.`;

        try {
            const narration = await this.callAI(prompt);
            // Clean response: remove any accidental markdown, labels, or prefixes
            return narration
                .replace(/^(narration:|spoken content:|teacher:|ai:|text:)\s*/i, '')
                .replace(/\*\*/g, '')
                .replace(/\*/g, '')
                .trim();
        } catch (error) {
            console.warn('[aiService] Visual narration generation failed, using step content:', error);
            // Graceful fallback: use the step content as the narration
            return `Let's look at the ${stepTitle} diagram on the board. ${stepContent}`;
        }
    },
    /**
     * Chat Panel — single pass, no query blocking. Answers whatever the student asks:
     * lesson questions, other subjects, study tips, or general questions. Lesson context
     * is used when relevant; off-topic questions are still answered helpfully.
     */
    async sendChatMessage({
        userMessage,
        topicName,
        chapterName,
        stepTitle,
        stepContent,
        subjectArea,
        gradeLevel,
        conversationHistory = [],
        userProfession,
    }: {
        userMessage: string;
        topicName?: string | null;
        /** Curriculum chapter when available — improves syllabus grounding */
        chapterName?: string | null;
        stepTitle?: string | null;
        stepContent?: string | null;
        subjectArea?: string | null;
        gradeLevel?: string | null;
        conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
        userProfession?: string | null;
    }): Promise<string> {
        const sanitizedMessage = userMessage.substring(0, 4000).replace(/[<>]/g, '').trim();
        if (!sanitizedMessage) {
            return 'Please type a question or message — I’m here to help.';
        }

        const recentHistory = conversationHistory.slice(-8)
            .map(m => `${m.role === 'user' ? 'Student' : 'AI Tutor'}: ${m.content}`)
            .join('\n');

        const systemPrompt = `You are a capable, friendly AI tutor in a learning app. The student may ask you **anything**: the current lesson, homework, other subjects, how to study, definitions, problems, or everyday questions.

CURRENT LESSON CONTEXT (use when it helps; if the question is not about this lesson, still answer fully — do not refuse or say you only discuss the lesson):
- Topic: ${topicName || 'N/A'}
- Chapter: ${chapterName || 'N/A'}
- Subject: ${subjectArea || 'N/A'}
- Grade / level: ${gradeLevel || 'N/A'}
- Current step title: ${stepTitle || 'N/A'}
- Step content (for tying answers to what’s on screen): ${stepContent ? stepContent.substring(0, 1200) : 'N/A'}

${userProfession ? `Learner interest: ${userProfession} — connect when relevant.` : ''}

RECENT CHAT:
${recentHistory || '(Start of conversation)'}

STUDENT MESSAGE: "${sanitizedMessage}"

HOW TO RESPOND:
- Answer the question **directly and completely**. Do not ask the user to clarify unless the message is genuinely empty or impossible to interpret.
- If the question relates to the lesson topic, connect your answer to the step content above when useful.
- If the question is off-topic, answer it anyway in a clear, helpful way (like a smart tutor who also chats).
- Use plain language suitable for ${gradeLevel || 'the student’s level'}; define jargon when needed.
- Be warm and conversational. No lectures unless the question needs depth.

${TEACHING_FORMAT_RULES}

Safety: Do not help with illegal, harmful, or exam-cheating requests (e.g. live exam answers). Everything else is fair game.`;

        try {
            const response = await this.callAI(systemPrompt, 3, 1200, { temperature: 0.62 });
            return stripAssistantPrefix(response);
        } catch {
            return `I couldn’t reach the AI service just now. Please try sending your message again in a moment.`;
        }
    },

    /**
     * Streaming variant of sendChatMessage — Groq SSE when available, progressive reveal otherwise.
     */
    async streamChatMessage(
        params: {
            userMessage: string;
            topicName?: string | null;
            chapterName?: string | null;
            stepTitle?: string | null;
            stepContent?: string | null;
            subjectArea?: string | null;
            gradeLevel?: string | null;
            conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
            userProfession?: string | null;
        },
        onChunk: StreamChunkHandler,
    ): Promise<string> {
        const sanitizedMessage = params.userMessage.substring(0, 4000).replace(/[<>]/g, '').trim();
        if (!sanitizedMessage) {
            const fallback = 'Please type a question or message — I’m here to help.';
            onChunk(fallback, fallback);
            return fallback;
        }

        const recentHistory = (params.conversationHistory ?? []).slice(-8)
            .map(m => `${m.role === 'user' ? 'Student' : 'AI Tutor'}: ${m.content}`)
            .join('\n');

        const systemPrompt = `You are a capable, friendly AI tutor in a learning app. The student may ask you **anything**: the current lesson, homework, other subjects, how to study, definitions, problems, or everyday questions.

CURRENT LESSON CONTEXT (use when it helps; if the question is not about this lesson, still answer fully — do not refuse or say you only discuss the lesson):
- Topic: ${params.topicName || 'N/A'}
- Chapter: ${params.chapterName || 'N/A'}
- Subject: ${params.subjectArea || 'N/A'}
- Grade / level: ${params.gradeLevel || 'N/A'}
- Current step title: ${params.stepTitle || 'N/A'}
- Step content (for tying answers to what’s on screen): ${params.stepContent ? params.stepContent.substring(0, 1200) : 'N/A'}

${params.userProfession ? `Learner interest: ${params.userProfession} — connect when relevant.` : ''}

RECENT CHAT:
${recentHistory || '(Start of conversation)'}

STUDENT MESSAGE: "${sanitizedMessage}"

HOW TO RESPOND:
- Answer the question **directly and completely**. Do not ask the user to clarify unless the message is genuinely empty or impossible to interpret.
- If the question relates to the lesson topic, connect your answer to the step content above when useful.
- If the question is off-topic, answer it anyway in a clear, helpful way (like a smart tutor who also chats).
- Use plain language suitable for ${params.gradeLevel || 'the student’s level'}; define jargon when needed.
- Be warm and conversational. No lectures unless the question needs depth.

${TEACHING_FORMAT_RULES}

Safety: Do not help with illegal, harmful, or exam-cheating requests (e.g. live exam answers). Everything else is fair game.`;

        try {
            return await streamWithFallback(
                systemPrompt,
                onChunk,
                0.62,
                (p) => this.callAI(p, 3, 1200, { temperature: 0.62 }),
            );
        } catch {
            const fallback = `I couldn’t reach the AI service just now. Please try sending your message again in a moment.`;
            onChunk(fallback, fallback);
            return fallback;
        }
    },

    /**
     * "Raise a Doubt" mode: answers as Aɪra, an experienced classroom teacher.
     * The reply is spoken aloud via TTS, so it must be plain, natural speech.
     * attemptNumber drives adaptive re-explanation (never repeat the same explanation).
     */
    async answerDoubt({
        question,
        topicName = null,
        chapterName = null,
        stepTitle = null,
        stepContent = '',
        subjectArea = null,
        gradeLevel = null,
        conversationHistory = [],
        userProfession = null,
        attemptNumber = 1,
        preferredLanguageName = 'English',
    }: {
        question: string;
        topicName?: string | null;
        chapterName?: string | null;
        stepTitle?: string | null;
        stepContent?: string;
        subjectArea?: string | null;
        gradeLevel?: string | null;
        conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
        userProfession?: string | null;
        attemptNumber?: number;
        preferredLanguageName?: string;
    }): Promise<string> {
        const sanitized = question.substring(0, 4000).replace(/[<>]/g, '').trim();
        if (!sanitized) {
            return 'I’m listening! Tell me what’s confusing you, and we’ll work through it together.';
        }

        const recentHistory = conversationHistory.slice(-10)
            .map(m => `${m.role === 'user' ? 'Student' : 'Teacher'}: ${m.content}`)
            .join('\n');

        const adaptiveGuidance = attemptNumber <= 1
            ? 'This is your first explanation of this doubt. Teach it clearly from the ground up.'
            : attemptNumber === 2
                ? 'The student did NOT fully understand your previous explanation. Explain it again DIFFERENTLY: simpler words, a slower build-up, and a brand-new everyday example. Do not repeat sentences from your earlier answer.'
                : 'The student is still confused after two explanations. Change your approach completely: use one vivid real-life analogy, then walk through the idea in tiny numbered steps, checking the logic at each step. Do not reuse earlier wording or examples.';

        const systemPrompt = `You are Aɪra, a warm and highly experienced classroom teacher. The lesson is paused because the student raised their hand with a doubt. Your only goal right now is to make THIS student truly understand.

CURRENT LESSON (the doubt most likely relates to this — use it so the student never has to repeat context):
- Topic: ${topicName || 'N/A'}
- Chapter: ${chapterName || 'N/A'}
- Subject: ${subjectArea || 'N/A'}
- Grade / level: ${gradeLevel || 'N/A'}
- What was being explained when they raised the doubt: ${stepTitle || 'N/A'}
- Board content at that moment: ${stepContent ? stepContent.substring(0, 1200) : 'N/A'}
${userProfession ? `- Student's field of interest: ${userProfession} — connect examples to it when natural.` : ''}

CONVERSATION SO FAR:
${recentHistory || '(The student just raised their hand.)'}

STUDENT'S MESSAGE: "${sanitized}"

ADAPTIVE TEACHING: ${adaptiveGuidance}
If the student's message is a NEW question rather than confusion about your last answer, treat it as a fresh doubt and answer it directly.

HOW TO TEACH:
- Teach like a real teacher standing next to the student: simple language, logical flow, one concrete example, and a short real-world connection or analogy when it helps.
- Occasionally (not every time) use a brief encouraging line like "That's a good question" or "Many students find this tricky at first" — vary it, never sound scripted.
- Keep it focused: roughly 100 to 250 words. No lectures.
- End with exactly ONE short check-in question under **Question for You**.

${TEACHING_FORMAT_RULES}

DISPLAY NOTE: Your reply appears in a rich chat panel AND is read aloud by text-to-speech. Use markdown for structure; keep sentences natural when spoken.

LANGUAGE:
- Reply in the language the student wrote in. If it's unclear, reply in ${preferredLanguageName}.
- If the student asks to switch languages, switch immediately and completely, keeping grammar natural.

Safety: do not help with live-exam cheating or harmful requests; gently redirect to learning instead.`;

        try {
            const response = await this.callAI(systemPrompt, 3, 1400, { temperature: 0.7 });
            return stripAssistantPrefix(response);
        } catch {
            return 'I couldn’t reach the AI service just now. Please ask your doubt again in a moment — I’m right here.';
        }
    },

    /** Streaming variant of answerDoubt */
    async streamAnswerDoubt(
        params: {
            question: string;
            topicName?: string | null;
            chapterName?: string | null;
            stepTitle?: string | null;
            stepContent?: string;
            subjectArea?: string | null;
            gradeLevel?: string | null;
            conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
            userProfession?: string | null;
            attemptNumber?: number;
            preferredLanguageName?: string;
        },
        onChunk: StreamChunkHandler,
    ): Promise<string> {
        const sanitized = params.question.substring(0, 4000).replace(/[<>]/g, '').trim();
        if (!sanitized) {
            const fallback = 'I’m listening! Tell me what’s confusing you, and we’ll work through it together.';
            onChunk(fallback, fallback);
            return fallback;
        }

        const recentHistory = (params.conversationHistory ?? []).slice(-10)
            .map(m => `${m.role === 'user' ? 'Student' : 'Teacher'}: ${m.content}`)
            .join('\n');

        const attemptNumber = params.attemptNumber ?? 1;
        const adaptiveGuidance = attemptNumber <= 1
            ? 'This is your first explanation of this doubt. Teach it clearly from the ground up.'
            : attemptNumber === 2
                ? 'The student did NOT fully understand your previous explanation. Explain it again DIFFERENTLY: simpler words, a slower build-up, and a brand-new everyday example. Do not repeat sentences from your earlier answer.'
                : 'The student is still confused after two explanations. Change your approach completely: use one vivid real-life analogy, then walk through the idea in tiny numbered steps, checking the logic at each step. Do not reuse earlier wording or examples.';

        const preferredLanguageName = params.preferredLanguageName ?? 'English';

        const systemPrompt = `You are Aɪra, a warm and highly experienced classroom teacher. The lesson is paused because the student raised their hand with a doubt. Your only goal right now is to make THIS student truly understand.

CURRENT LESSON (the doubt most likely relates to this — use it so the student never has to repeat context):
- Topic: ${params.topicName || 'N/A'}
- Chapter: ${params.chapterName || 'N/A'}
- Subject: ${params.subjectArea || 'N/A'}
- Grade / level: ${params.gradeLevel || 'N/A'}
- What was being explained when they raised the doubt: ${params.stepTitle || 'N/A'}
- Board content at that moment: ${params.stepContent ? params.stepContent.substring(0, 1200) : 'N/A'}
${params.userProfession ? `- Student's field of interest: ${params.userProfession} — connect examples to it when natural.` : ''}

CONVERSATION SO FAR:
${recentHistory || '(The student just raised their hand.)'}

STUDENT'S MESSAGE: "${sanitized}"

ADAPTIVE TEACHING: ${adaptiveGuidance}
If the student's message is a NEW question rather than confusion about your last answer, treat it as a fresh doubt and answer it directly.

HOW TO TEACH:
- Teach like a real teacher standing next to the student: simple language, logical flow, one concrete example, and a short real-world connection or analogy when it helps.
- Occasionally (not every time) use a brief encouraging line like "That's a good question" or "Many students find this tricky at first" — vary it, never sound scripted.
- Keep it focused: roughly 100 to 250 words. No lectures.
- End with exactly ONE short check-in question under **Question for You**.

${TEACHING_FORMAT_RULES}

DISPLAY NOTE: Your reply appears in a rich chat panel AND is read aloud by text-to-speech. Use markdown for structure; keep sentences natural when spoken.

LANGUAGE:
- Reply in the language the student wrote in. If it's unclear, reply in ${preferredLanguageName}.
- If the student asks to switch languages, switch immediately and completely, keeping grammar natural.

Safety: do not help with live-exam cheating or harmful requests; gently redirect to learning instead.`;

        try {
            return await streamWithFallback(
                systemPrompt,
                onChunk,
                0.7,
                (p) => this.callAI(p, 3, 1400, { temperature: 0.7 }),
            );
        } catch {
            const fallback = 'I couldn’t reach the AI service just now. Please ask your doubt again in a moment — I’m right here.';
            onChunk(fallback, fallback);
            return fallback;
        }
    },

    /**
     * Answers a user question based on an uploaded document (text) or image (base64).
     * - For text/PDF/DOCX: sends the extracted text as context in the prompt.
     * - For images: sends the base64 image content to a vision-capable model via OpenRouter.
     */
    async answerDocumentQuestion(documentContent: string, question: string): Promise<string> {
        const IS_IMAGE = documentContent.startsWith('__IMAGE_BASE64__');

        if (IS_IMAGE) {
            // Strip our internal prefix to get the raw data URI
            const base64DataUri = documentContent.replace('__IMAGE_BASE64__', '');
            return this.answerImageQuestion(base64DataUri, question);
        }

        // Text-based document: generous cap for study notes / chapters (truncate if huge)
        const MAX_DOC_CHARS = 10000;
        const truncated = documentContent.length > MAX_DOC_CHARS
            ? documentContent.slice(0, MAX_DOC_CHARS) + '\n\n[Document truncated for length — only the above text was available.]'
            : documentContent;

        const prompt = `You are an expert tutor helping a student understand material they uploaded (notes, PDF text, assignment, etc.).

DOCUMENT CONTENT:
---BEGIN DOCUMENT---
${truncated}
---END DOCUMENT---

STUDENT QUESTION: "${question}"

Instructions:
1) Ground your answer ONLY in the document above. If something is not in the document, say clearly: "Your document doesn’t contain that information" and suggest what they could add or ask instead.
2) Write for a student with clear structure and readable markdown.
3) For definitions, quote or paraphrase the document’s wording when possible.
4) If the document is ambiguous, explain what it does say and what is unclear.
5) If the student asked for a summary, synthesis, or comparison, still stay faithful to the document — do not invent facts.
6) Reply in clear English only.

${TEACHING_FORMAT_RULES}`;

        try {
            const response = await this.callAI(prompt, 3, 1200, { temperature: 0.45 });
            return response.trim();
        } catch {
            return "I wasn't able to process your question right now. Please try again in a moment.";
        }
    },

    /**
     * Streaming variant for text document Q&A (vision/image uses full fetch + progressive reveal).
     */
    async streamDocumentQuestion(
        documentContent: string,
        question: string,
        onChunk: StreamChunkHandler,
    ): Promise<string> {
        const IS_IMAGE = documentContent.startsWith('__IMAGE_BASE64__');

        if (IS_IMAGE) {
            const base64DataUri = documentContent.replace('__IMAGE_BASE64__', '');
            const full = await this.answerImageQuestion(base64DataUri, question);
            await progressiveReveal(full.trim(), onChunk);
            return full.trim();
        }

        const MAX_DOC_CHARS = 10000;
        const truncated = documentContent.length > MAX_DOC_CHARS
            ? documentContent.slice(0, MAX_DOC_CHARS) + '\n\n[Document truncated for length — only the above text was available.]'
            : documentContent;

        const prompt = `You are an expert tutor helping a student understand material they uploaded (notes, PDF text, assignment, etc.).

DOCUMENT CONTENT:
---BEGIN DOCUMENT---
${truncated}
---END DOCUMENT---

STUDENT QUESTION: "${question}"

Instructions:
1) Ground your answer ONLY in the document above. If something is not in the document, say clearly: "Your document doesn’t contain that information" and suggest what they could add or ask instead.
2) Write for a student with clear structure and readable markdown.
3) For definitions, quote or paraphrase the document’s wording when possible.
4) If the document is ambiguous, explain what it does say and what is unclear.
5) If the student asked for a summary, synthesis, or comparison, still stay faithful to the document — do not invent facts.
6) Reply in clear English only.

${TEACHING_FORMAT_RULES}`;

        try {
            return await streamWithFallback(
                prompt,
                onChunk,
                0.45,
                (p) => this.callAI(p, 3, 1200, { temperature: 0.45 }),
            );
        } catch {
            const fallback = "I wasn't able to process your question right now. Please try again in a moment.";
            onChunk(fallback, fallback);
            return fallback;
        }
    },

    /** Vision Q&A via Groq — OpenAI-compatible multimodal messages. */
    async fetchGroqVisionAnswer(base64DataUri: string, question: string): Promise<string> {
        if (!GROQ_API_KEY) throw new Error('Groq API key missing');

        const tutorPrompt = `You are a patient tutor. The user uploaded an image (handwritten notes, printed page, diagram, chart, or photo of a problem).

STUDENT QUESTION: "${question}"

Do this in order:
1) Briefly say what the image shows (e.g. topic, type of diagram, visible headings).
2) Read any visible text carefully (OCR mentally). Quote short phrases if useful.
3) Answer the question step by step. For math/science, show reasoning. For diagrams, explain labels and relationships.
4) If the image is blurry or unreadable, say what you can infer and what you cannot read.
5) Use simple language suitable for a student; use bullets or numbered steps when helpful.
6) Reply only in clear English.

${TEACHING_FORMAT_RULES}`;

        let lastError: unknown = null;

        for (const model of GROQ_VISION_MODEL_FALLBACKS) {
            try {
                const response = await fetch(GROQ_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${GROQ_API_KEY}`,
                    },
                    body: JSON.stringify({
                        model,
                        messages: [
                            {
                                role: 'user',
                                content: [
                                    { type: 'image_url', image_url: { url: base64DataUri } },
                                    { type: 'text', text: tutorPrompt },
                                ],
                            },
                        ],
                        max_tokens: 3500,
                        temperature: 0.45,
                    }),
                    signal: AbortSignal.timeout(60000),
                });

                if (!response.ok) {
                    const errBody = await response.text().catch(() => '');
                    throw new Error(`Groq vision error (${model}): ${response.status} ${errBody.slice(0, 300)}`);
                }

                const data = await response.json();
                if (!data.choices?.[0]?.message) throw new Error(`Invalid Groq vision response (${model})`);
                const visionText = normalizeApiMessageContent(data.choices[0].message.content).trim();
                if (!visionText) throw new Error(`Empty Groq vision response (${model})`);
                return visionText;
            } catch (err) {
                lastError = err;
                console.warn(`[aiService] Groq vision model ${model} failed:`, err);
            }
        }

        throw lastError ?? new Error('All Groq vision models failed');
    },

    /** OpenRouter vision Q&A fallback. */
    async fetchOpenRouterVisionAnswer(base64DataUri: string, question: string): Promise<string> {
        if (!OPENROUTER_API_KEY) throw new Error('OpenRouter API key missing');

        const tutorPrompt = `You are a patient tutor. The user uploaded an image (handwritten notes, printed page, diagram, chart, or photo of a problem).

STUDENT QUESTION: "${question}"

Do this in order:
1) Briefly say what the image shows (e.g. topic, type of diagram, visible headings).
2) Read any visible text carefully (OCR mentally). Quote short phrases if useful.
3) Answer the question step by step. For math/science, show reasoning. For diagrams, explain labels and relationships.
4) If the image is blurry or unreadable, say what you can infer and what you cannot read.
5) Use simple language suitable for a student; use bullets or numbered steps when helpful.
6) Reply only in clear English.

${TEACHING_FORMAT_RULES}`;

        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Aira Academy',
            },
            body: JSON.stringify({
                model: OPENROUTER_VISION_MODEL,
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'image_url', image_url: { url: base64DataUri } },
                            { type: 'text', text: tutorPrompt },
                        ],
                    },
                ],
                max_tokens: 3500,
                temperature: 0.45,
            }),
            signal: AbortSignal.timeout(60000),
        });

        if (!response.ok) {
            const errBody = await response.text().catch(() => '');
            throw new Error(`Vision API error (${OPENROUTER_VISION_MODEL}): ${response.status} ${errBody.slice(0, 300)}`);
        }

        const data = await response.json();
        if (!data.choices?.[0]?.message) throw new Error('Invalid vision response');
        const visionText = normalizeApiMessageContent(data.choices[0].message.content).trim();
        if (!visionText) throw new Error('Empty vision response');
        return visionText;
    },

    /**
     * Image Q&A: prefers Groq vision when VITE_GROQ_API_KEY is set; otherwise OpenRouter Gemini.
     */
    async answerImageQuestion(base64DataUri: string, question: string): Promise<string> {
        let uri = base64DataUri.trim();
        if (!uri.startsWith('data:')) {
            uri = `data:image/jpeg;base64,${uri}`;
        }
        try {
            uri = await prepareDataUrlForVisionApi(uri);
        } catch {
            /* keep original */
        }

        if (GROQ_API_KEY) {
            try {
                return await this.fetchGroqVisionAnswer(uri, question);
            } catch (err) {
                console.warn('[aiService] Groq vision failed, falling back to OpenRouter:', err);
            }
        }

        if (!OPENROUTER_API_KEY) {
            return GROQ_API_KEY
                ? 'Image analysis failed. Please try again with a smaller or clearer image, or check your API key in .env.'
                : 'Image analysis requires VITE_GROQ_API_KEY or VITE_OPENROUTER_API_KEY.';
        }

        try {
            return await this.fetchOpenRouterVisionAnswer(uri, question);
        } catch (err) {
            console.error('[aiService] Image vision failed:', err);
            return `Image analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}. Please ensure your image is clear and try again.`;
        }
    },

    /**
     * OCR / extract a competitive-exam question from an uploaded image for AI Explanation handoff.
     * Returns structured stem + real options only (never invents A–D). Throws on hard failure.
     * Never returns raw model thinking dumps as questionText.
     */
    async extractExamQuestionFromImage(
        base64DataUri: string,
        userHint?: string,
    ): Promise<ExtractedExamQuestion> {
        let uri = base64DataUri.trim();
        if (!uri.startsWith('data:')) {
            uri = `data:image/jpeg;base64,${uri}`;
        }
        try {
            uri = await prepareDataUrlForVisionApi(uri);
        } catch {
            /* keep original */
        }

        const hint = (userHint || '').trim();
        const meaningfulHint = isMeaningfulStudentHint(hint);
        const extractPrompt = `You extract exam questions from images for a tutoring app.

CRITICAL OUTPUT RULES:
- Return ONLY a single valid JSON object. No markdown fences. No <think> tags. No reasoning. No commentary before or after JSON.
- Equations must be PLAIN READABLE TEXT (e.g. "√5 A / 2", "A^2"), NOT LaTeX ($...$, \\frac, \\sqrt).

${meaningfulHint ? `Student note / focus: "${hint}"\nUse this only to pick which question if several appear. Do NOT paste this note into questionText.\n` : ''}
JSON shape:
{
  "questionText": "Verbatim question STEM only. No options. No labels like A) B).",
  "options": ["option text without A)/A. prefix", "..."] or null if NOT multiple choice,
  "correctAnswerIndex": 0-based index ONLY if the image clearly marks the correct option, else null,
  "subjectGuess": "math|physics|chemistry|biology|english|general"
}

Rules:
- Copy the stem VERBATIM from the image (readable math OK).
- Options: only what is visibly present. Never invent options.
- If not MCQ, set "options" to null.
- If unreadable, set questionText to "" and still return JSON.`;

        const runGroq = async (): Promise<string> => {
            if (!GROQ_API_KEY) throw new Error('Groq API key missing');
            let lastError: unknown = null;
            for (const model of GROQ_VISION_MODEL_FALLBACKS) {
                try {
                    const response = await fetch(GROQ_API_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${GROQ_API_KEY}`,
                        },
                        body: JSON.stringify({
                            model,
                            messages: [
                                {
                                    role: 'user',
                                    content: [
                                        { type: 'image_url', image_url: { url: uri } },
                                        { type: 'text', text: extractPrompt },
                                    ],
                                },
                            ],
                            max_tokens: 1200,
                            temperature: 0,
                        }),
                        signal: AbortSignal.timeout(60000),
                    });
                    if (!response.ok) {
                        const errBody = await response.text().catch(() => '');
                        throw new Error(`Groq vision error (${model}): ${response.status} ${errBody.slice(0, 300)}`);
                    }
                    const data = await response.json();
                    const visionText = normalizeApiMessageContent(data.choices?.[0]?.message?.content).trim();
                    if (!visionText) throw new Error(`Empty Groq vision response (${model})`);
                    return visionText;
                } catch (err) {
                    lastError = err;
                    console.warn(`[aiService] extractExamQuestion Groq ${model} failed:`, err);
                }
            }
            throw lastError ?? new Error('All Groq vision models failed');
        };

        const runOpenRouter = async (): Promise<string> => {
            if (!OPENROUTER_API_KEY) throw new Error('OpenRouter API key missing');
            const response = await fetch(OPENROUTER_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${OPENROUTER_API_KEY}`,
                    'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
                    'X-Title': 'Aira Academy',
                },
                body: JSON.stringify({
                    model: OPENROUTER_VISION_MODEL,
                    messages: [
                        {
                            role: 'user',
                            content: [
                                { type: 'image_url', image_url: { url: uri } },
                                { type: 'text', text: extractPrompt },
                            ],
                        },
                    ],
                    max_tokens: 1200,
                    temperature: 0,
                }),
                signal: AbortSignal.timeout(60000),
            });
            if (!response.ok) {
                const errBody = await response.text().catch(() => '');
                throw new Error(`OpenRouter vision error: ${response.status} ${errBody.slice(0, 300)}`);
            }
            const data = await response.json();
            const visionText = normalizeApiMessageContent(data.choices?.[0]?.message?.content).trim();
            if (!visionText) throw new Error('Empty OpenRouter vision response');
            return visionText;
        };

        const parseVisionToExtracted = (raw: string): ExtractedExamQuestion => {
            // Prefer JSON from raw first so unclosed <think>…{json} still recovers.
            const parsed =
                extractExamJsonObject(raw) ||
                extractExamJsonObject(stripModelThinking(raw));
            if (!parsed) {
                throw new Error('Could not read a clean question from this image. Try a clearer photo.');
            }

            let stem = sanitizeExamStem(String(parsed.questionText || ''));

            let rawOpts = Array.isArray(parsed.options)
                ? (parsed.options as unknown[])
                      .map((o) => sanitizeOptionText(String(o)))
                      .filter(Boolean)
                : [];

            // Vision models often leave A)/B)/C)/D) inside the stem — peel them out.
            const peeled = splitStemAndOptions(stem);
            if (peeled.options.length >= 2) {
                stem = peeled.stem;
                if (rawOpts.length < 2) rawOpts = peeled.options;
            }

            const options = rawOpts.length >= 2 ? rawOpts : null;

            let correctAnswerIndex: number | null = null;
            if (
                options &&
                typeof parsed.correctAnswerIndex === 'number' &&
                Number.isFinite(parsed.correctAnswerIndex) &&
                parsed.correctAnswerIndex >= 0 &&
                parsed.correctAnswerIndex < options.length
            ) {
                correctAnswerIndex = Math.floor(parsed.correctAnswerIndex as number);
            }

            const subjectGuess =
                typeof parsed.subjectGuess === 'string' && parsed.subjectGuess.trim()
                    ? parsed.subjectGuess.trim().toLowerCase()
                    : undefined;

            const result: ExtractedExamQuestion = {
                questionText: stem,
                options,
                correctAnswerIndex,
                subjectGuess,
            };
            assertCleanExtractedQuestion(result);
            return result;
        };

        if (!OPENROUTER_API_KEY && !GROQ_API_KEY) {
            throw new Error('Image question extraction needs VITE_GROQ_API_KEY or VITE_OPENROUTER_API_KEY.');
        }

        // Prefer OpenRouter Gemini for reliable JSON; Groq (Qwen) often emits <think> dumps.
        const attempts: Array<() => Promise<string>> = [];
        if (OPENROUTER_API_KEY) attempts.push(runOpenRouter);
        if (GROQ_API_KEY) attempts.push(runGroq);

        let lastErr: unknown = null;
        for (const run of attempts) {
            try {
                const raw = await run();
                return parseVisionToExtracted(raw);
            } catch (err) {
                lastErr = err;
                console.warn('[aiService] extractExamQuestion attempt failed:', err);
            }
        }

        if (lastErr instanceof Error && lastErr.message.includes('Could not read')) {
            throw lastErr;
        }
        throw new Error('Could not read a clean question from this image. Try a clearer photo.');
    },

    /**
     * Performs structured analysis of an image (OCR, Concept Extraction, Summary).
     */
    async analyzeImageContent(imageBase64: string): Promise<ImageAnalysis> {
        if (!OPENROUTER_API_KEY) {
            throw new Error('Image analysis requires an OpenRouter API key.');
        }

        const prompt = `You are an expert educational content analyzer. The user has uploaded an image (notes, textbook, diagram).
Perform a deep analysis and return ONLY a valid JSON object with this structure:
{
  "visualSummary": "A concise 1-2 sentence overview of what the image is.",
  "extractedContent": "The full text found in the image (OCR). Include all relevant details.",
  "keyConcepts": ["Concept 1", "Concept 2", "Concept 3"],
  "learningInsights": ["Insight 1", "Insight 2"]
}

Rules:
- extractedContent must be accurate and comprehensive.
- keyConcepts should be academic/technical terms relevant for learning.
- learningInsights should explain the educational value or context of the content.`;

        try {
            const response = await fetch(OPENROUTER_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'Aira Academy',
                },
                body: JSON.stringify({
                    model: OPENROUTER_VISION_MODEL,
                    messages: [
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'image_url',
                                    image_url: { url: imageBase64 },
                                },
                                {
                                    type: 'text',
                                    text: prompt,
                                },
                            ],
                        },
                    ],
                    response_format: { type: "json_object" }
                }),
            });

            if (!response.ok) throw new Error('Vision analysis failed');

            const data = await response.json();
            const content = normalizeApiMessageContent(data.choices[0].message.content).trim();
            if (!content) throw new Error('Empty analysis response');
            const parsed = JSON.parse(content);

            return {
                ...parsed,
                imageBase64,
                analyzedAt: new Date().toISOString()
            };
        } catch (err) {
            console.error('[aiService] Image analysis failed:', err);
            throw new Error(`Vision analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}. This could be due to image size, service limits, or an invalid API key.`);
        }
    },
};


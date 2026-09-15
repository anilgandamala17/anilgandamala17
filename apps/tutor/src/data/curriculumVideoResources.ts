/**
 * Curriculum video resources keyed by topic id.
 * Grade 12 Biology → Chapter 1 Reproduction → Topic 2 Fertilization.
 *
 * One original MP4 per topic. Dubbed soundtracks live beside it under audio/ + captions/.
 * Do not duplicate the MP4 per language.
 */

import type { TtsLanguageCode } from '../constants/ttsLanguages'
import { TTS_LANGUAGE_OPTIONS } from '../constants/ttsLanguages'

export type CurriculumVideoTimestamp = {
  timeSeconds: number
  label: string
  description: string
}

export type VideoAudioTrackStatus = 'ready' | 'pending' | 'queued'

export type CurriculumVideoAudioTrack = {
  language: TtsLanguageCode
  /** null = use the MP4 native soundtrack (English). */
  audio_url: string | null
  captions: string
  status: VideoAudioTrackStatus
}

export type CurriculumVideoResource = {
  id: string
  topicId: string
  gradeLevel: number
  subject: string
  chapterId: string
  chapterName: string
  topicName: string
  subtopic: string
  type: 'video'
  title: string
  filename: string
  /** Public URL served by Vite from /public */
  src: string
  poster: string
  captionsSrc: string
  transcriptSrc: string
  mimeType: 'video/mp4'
  durationSeconds: number
  durationLabel: string
  uploadDate: string
  visibility: 'published'
  altText: string
  learningObjectives: string[]
  keyConcepts: string[]
  timestamps: CurriculumVideoTimestamp[]
  teachingPanel: {
    displayOrder: number
    layout: 'full-width'
    autoPlay: boolean
    showTranscript: boolean
    showTimestamps: boolean
  }
  video_audio_tracks: CurriculumVideoAudioTrack[]
}

const FERT_VIDEO_DIR =
  '/tutor-media/curriculum/grade12/biology/ch1-reproduction/videos'

const DUB_LANG_FILES: Array<{ language: TtsLanguageCode; file: string }> = [
  { language: 'te-IN', file: 'te' },
  { language: 'hi-IN', file: 'hi' },
  { language: 'ta-IN', file: 'ta' },
  { language: 'kn-IN', file: 'kn' },
  { language: 'ml-IN', file: 'ml' },
]

function pendingDubTrack(language: TtsLanguageCode, file: string): CurriculumVideoAudioTrack {
  return {
    language,
    audio_url: `${FERT_VIDEO_DIR}/audio/${file}.mp3`,
    captions: `${FERT_VIDEO_DIR}/captions/${file}.vtt`,
    // Missing public files stay pending; mock translate may flip this later.
    status: 'pending',
  }
}

const HUMAN_FERT_AUDIO_TRACKS: CurriculumVideoAudioTrack[] = [
  {
    language: 'en-IN',
    audio_url: null,
    captions: `${FERT_VIDEO_DIR}/human-fertilisation.vtt`,
    status: 'ready',
  },
  ...DUB_LANG_FILES.map(({ language, file }) => pendingDubTrack(language, file)),
]

const HUMAN_FERT_VIDEO: CurriculumVideoResource = {
  id: 'vid_human_fert_001',
  topicId: 'bio-12-1-fertilization',
  gradeLevel: 12,
  subject: 'Biology',
  chapterId: 'bio-12-1',
  chapterName: 'Reproduction',
  topicName: 'Fertilization',
  subtopic: 'Human Fertilization Process',
  type: 'video',
  title: 'Human Fertilisation Process',
  filename: 'human-fertilisation.mp4',
  src: `${FERT_VIDEO_DIR}/human-fertilisation.mp4`,
  poster: `${FERT_VIDEO_DIR}/human-fertilisation-thumb.svg`,
  captionsSrc: `${FERT_VIDEO_DIR}/human-fertilisation.vtt`,
  transcriptSrc: `${FERT_VIDEO_DIR}/human-fertilisation.txt`,
  mimeType: 'video/mp4',
  durationSeconds: 383,
  durationLabel: '6:23',
  uploadDate: '2026-09-14',
  visibility: 'published',
  altText: 'Diagram-style still of human fertilisation: sperm approaching an oocyte surrounded by the zona pellucida',
  learningObjectives: [
    'Describe how sperm reach and bind the oocyte after ovulation',
    'Explain the acrosome reaction and zona pellucida penetration',
    'Outline fusion of male and female pronuclei to form a diploid zygote',
    'State why only one sperm typically fertilises the egg (block to polyspermy)',
  ],
  keyConcepts: [
    'Capacitation',
    'Acrosome reaction',
    'Zona pellucida',
    'Cortical reaction',
    'Pronuclear fusion',
    'Zygote',
  ],
  timestamps: [
    { timeSeconds: 0, label: 'Overview', description: 'Fertilisation restores diploidy and starts development' },
    { timeSeconds: 45, label: 'Approach', description: 'Sperm reach the oocyte and its protective coats' },
    { timeSeconds: 95, label: 'Capacitation', description: 'Sperm become competent to fertilise' },
    { timeSeconds: 145, label: 'Acrosome reaction', description: 'Enzymes open a path through the zona pellucida' },
    { timeSeconds: 210, label: 'Membrane fusion', description: 'Sperm and egg membranes fuse; cortical reaction' },
    { timeSeconds: 275, label: 'Pronuclei', description: 'Haploid genomes meet in the egg cytoplasm' },
    { timeSeconds: 330, label: 'Zygote', description: 'Diploid zygote and onset of cleavage' },
  ],
  teachingPanel: {
    displayOrder: 1,
    layout: 'full-width',
    autoPlay: true,
    showTranscript: true,
    showTimestamps: true,
  },
  video_audio_tracks: HUMAN_FERT_AUDIO_TRACKS,
}

export const CURRICULUM_VIDEO_RESOURCES: CurriculumVideoResource[] = [HUMAN_FERT_VIDEO]

/** Topics whose teaching board is the uploaded MP4 (no SVG, no AI lesson TTS).
 * Empty until matching MP4 assets exist under public/tutor-media/curriculum/.
 * Fertilization keeps curated SVG steps via courseRegistry when not video-only.
 */
const VIDEO_ONLY_TOPIC_IDS = new Set<string>([])

export function isVideoOnlyTopic(topicId: string | null | undefined): boolean {
  return Boolean(topicId && VIDEO_ONLY_TOPIC_IDS.has(topicId))
}

export function getPublishedVideoForTopic(topicId: string): CurriculumVideoResource | null {
  return (
    CURRICULUM_VIDEO_RESOURCES.find(
      (r) => r.topicId === topicId && r.visibility === 'published',
    ) ?? null
  )
}

export function getPublishedVideoById(videoId: string): CurriculumVideoResource | null {
  return (
    CURRICULUM_VIDEO_RESOURCES.find(
      (r) => r.id === videoId && r.visibility === 'published',
    ) ?? null
  )
}

export function listPublishedVideosForTopic(topicId: string): CurriculumVideoResource[] {
  return CURRICULUM_VIDEO_RESOURCES.filter(
    (r) => r.topicId === topicId && r.visibility === 'published',
  )
}

export function catalogAudioTrack(
  resource: CurriculumVideoResource,
  language: TtsLanguageCode,
): CurriculumVideoAudioTrack | null {
  return resource.video_audio_tracks.find((t) => t.language === language) ?? null
}

export function languageLabelForTrack(code: TtsLanguageCode): string {
  return TTS_LANGUAGE_OPTIONS.find((l) => l.value === code)?.label ?? code
}

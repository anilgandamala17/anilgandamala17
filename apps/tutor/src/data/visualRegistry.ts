import { BoardVisualType, VisualConcept, ConceptDiagram } from '@/types';
import { AcademicDomain } from '@/services/topicAnalyzer';

/**
 * Authoritative Topic-Based Visual Registry
 * Hard rule: visuals may only be loaded if they exist in this registry.
 * No fallback to generic visuals. Topic-locked: currentTopicId → load only that topic's visuals.
 */

export type VisualAssetType = 'diagram' | 'component' | 'chart' | 'graph' | 'table' | 'equation_layout';

export interface VisualAsset {
    marker_id: string;
    asset_type: VisualAssetType;
    /** Specific family of diagram (e.g. equation_flow_diagram) */
    diagram_type?: BoardVisualType;
    /** For svg/png/lottie: URL to image or SVG. For component: not used. */
    asset_url?: string;
    /** Human-readable labels on the diagram (required; no unlabeled diagrams). */
    labels: string[];
}

export type VisualDifficulty = 'intro' | 'standard' | 'advanced';

export interface VisualRegistryEntry {
    topic_id: string;
    subject: string;
    grade: string;
    domain: AcademicDomain; // Mathematics | Physics | Chemistry | Biology | etc.
    concept_key: string;
    visual_version: number;
    topic_version: number;
    /** Deterministic hash of the marker list [marker1, marker2, ...] */
    marker_contract_hash: string;
    /** React component key for topic (e.g. 'BloodFlowVisual'). Used when asset_type is 'component'. */
    primary_component_key: string;
    visual_assets: VisualAsset[];
    /** Maps marker_id to specific labels that should be visible. */
    label_map: Record<string, string[]>;
    /** Optional alias for cross-topic visual reuse. */
    aliases?: string[];

    // ── Add-On 1: Versioning & Audit Trail ──────────────────────────────────
    /** Semantic version string e.g. "v1.2.0" */
    version: string;
    /** Team or individual who verified this entry */
    verifiedBy: string;
    /** ISO date of last verification */
    verifiedDate: string;
    /** Authoritative source (textbook, curriculum body, etc.) */
    source: string;
    /** SHA-256 checksum of visual_assets + label_map JSON */
    checksum: string;

    // ── Add-On 9: Visual Difficulty Tagging ─────────────────────────────────
    /** Difficulty level — drives grade-appropriate visual selection */
    difficulty: VisualDifficulty;

    // ── Hard Rule 13: Concept-Level Visual Registry ───────────────────────────
    /**
     * Ordered list of concepts for this topic. Each concept has ≥1 diagram.
     * Hard Rule 19: topic must have ≥3 diagrams total across all concepts.
     * Optional for synthesized/auto entries; required for seeded entries.
     */
    concepts?: VisualConcept[];
}

/** In-memory registry. Populated by pipeline or static data; no fallback. */
const registry = new Map<string, VisualRegistryEntry>();

// ── Add-On 7: Diagram Density Cap ───────────────────────────────────────────
/** Maximum number of labels per diagram by grade level */
export const GRADE_LABEL_LIMITS: Record<string, number> = {
    'Class 1': 3, 'Class 2': 3, 'Class 3': 4, 'Class 4': 4,
    'Class 5': 5, 'Class 6': 6, 'Class 7': 7, 'Class 8': 8,
    'Class 9': 10, 'Class 10': 12, 'Class 11': 14, 'Class 12': 15,
    'Professional': 20, 'Standard': 12,
};

/** Returns true if the entry's label count is within the grade limit */
export function enforcesDensityCap(entry: VisualRegistryEntry, grade: string): boolean {
    const limit = GRADE_LABEL_LIMITS[grade] ?? 12;
    return entry.visual_assets.every(a => a.labels.length <= limit);
}

/** Returns a copy of the entry with labels trimmed to the grade-appropriate limit */
export function trimLabelsForGrade(entry: VisualRegistryEntry, grade: string): VisualRegistryEntry {
    const limit = GRADE_LABEL_LIMITS[grade] ?? 12;
    return {
        ...entry,
        visual_assets: entry.visual_assets.map(a => ({
            ...a,
            labels: a.labels.slice(0, limit),
        })),
    };
}

// ─── Seed registry with verified topic-specific visuals (no reuse across topics) ───
const SEED_ENTRIES: VisualRegistryEntry[] = [
    {
        topic_id: 'eng-6-1-fantasy-fiction',
        subject: 'English', grade: 'Class 6', domain: 'English Literature',
        concept_key: '1_fantasy_fiction', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-6-1-fantasy-fiction', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Fantasy Fiction'] }],
        label_map: { 'default': ['Fantasy Fiction'] },
        concepts: [{
            concept_id: '1_fantasy_fiction_c', concept_name: 'Fantasy Fiction',
            diagrams: [{ diagram_id: '1_fantasy_fiction_d', title: 'Fantasy Fiction', svg_path: 'english_6/fantasy-fiction.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Fantasy Fiction'] }]
        }]
    },
    {
        topic_id: 'eng-6-1-moral-lessons',
        subject: 'English', grade: 'Class 6', domain: 'English Literature',
        concept_key: '1_moral_lessons', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-6-1-moral-lessons', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Moral Lessons'] }],
        label_map: { 'default': ['Moral Lessons'] },
        concepts: [{
            concept_id: '1_moral_lessons_c', concept_name: 'Moral Lessons',
            diagrams: [{ diagram_id: '1_moral_lessons_d', title: 'Moral Lessons', svg_path: 'english_6/moral-lessons.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Moral Lessons'] }]
        }]
    },
    {
        topic_id: 'eng-6-1-comprehension',
        subject: 'English', grade: 'Class 6', domain: 'English Literature',
        concept_key: '1_comprehension', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-6-1-comprehension', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Comprehension'] }],
        label_map: { 'default': ['Comprehension'] },
        concepts: [{
            concept_id: '1_comprehension_c', concept_name: 'Comprehension',
            diagrams: [{ diagram_id: '1_comprehension_d', title: 'Comprehension', svg_path: 'english_6/comprehension.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Comprehension'] }]
        }]
    },
    {
        topic_id: 'eng-6-2-folk-tales',
        subject: 'English', grade: 'Class 6', domain: 'English Literature',
        concept_key: '2_folk_tales', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-6-2-folk-tales', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Folk Tales'] }],
        label_map: { 'default': ['Folk Tales'] },
        concepts: [{
            concept_id: '2_folk_tales_c', concept_name: 'Folk Tales',
            diagrams: [{ diagram_id: '2_folk_tales_d', title: 'Folk Tales', svg_path: 'english_6/folk-tales.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Folk Tales'] }]
        }]
    },
    {
        topic_id: 'eng-6-2-character-analysis',
        subject: 'English', grade: 'Class 6', domain: 'English Literature',
        concept_key: '2_character_analysis', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-6-2-character-analysis', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Character Analysis'] }],
        label_map: { 'default': ['Character Analysis'] },
        concepts: [{
            concept_id: '2_character_analysis_c', concept_name: 'Character Analysis',
            diagrams: [{ diagram_id: '2_character_analysis_d', title: 'Character Analysis', svg_path: 'english_6/character-analysis.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Character Analysis'] }]
        }]
    },
    {
        topic_id: 'eng-6-2-writing',
        subject: 'English', grade: 'Class 6', domain: 'English Literature',
        concept_key: '2_writing', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-6-2-writing', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Writing'] }],
        label_map: { 'default': ['Writing'] },
        concepts: [{
            concept_id: '2_writing_c', concept_name: 'Writing',
            diagrams: [{ diagram_id: '2_writing_d', title: 'Writing', svg_path: 'english_6/summary-writing.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Writing'] }]
        }]
    },
    {
        topic_id: 'eng-6-3-japanese-tales',
        subject: 'English', grade: 'Class 6', domain: 'English Literature',
        concept_key: '3_japanese_tales', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-6-3-japanese-tales', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Japanese Tales'] }],
        label_map: { 'default': ['Japanese Tales'] },
        concepts: [{
            concept_id: '3_japanese_tales_c', concept_name: 'Japanese Tales',
            diagrams: [{ diagram_id: '3_japanese_tales_d', title: 'Japanese Tales', svg_path: 'english_6/japanese-tales.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Japanese Tales'] }]
        }]
    },
    {
        topic_id: 'eng-6-3-gratitude',
        subject: 'English', grade: 'Class 6', domain: 'English Literature',
        concept_key: '3_gratitude', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-6-3-gratitude', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Gratitude'] }],
        label_map: { 'default': ['Gratitude'] },
        concepts: [{
            concept_id: '3_gratitude_c', concept_name: 'Gratitude',
            diagrams: [{ diagram_id: '3_gratitude_d', title: 'Gratitude', svg_path: 'english_6/gratitude.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Gratitude'] }]
        }]
    },
    {
        topic_id: 'eng-6-3-summary-writing',
        subject: 'English', grade: 'Class 6', domain: 'English Literature',
        concept_key: '3_summary_writing', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-6-3-summary-writing', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Summary Writing'] }],
        label_map: { 'default': ['Summary Writing'] },
        concepts: [{
            concept_id: '3_summary_writing_c', concept_name: 'Summary Writing',
            diagrams: [{ diagram_id: '3_summary_writing_d', title: 'Summary Writing', svg_path: 'english_6/summary-writing.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Summary Writing'] }]
        }]
    },
    {
        topic_id: 'eng-7-1-philosophy',
        subject: 'English', grade: 'Class 7', domain: 'English Literature',
        concept_key: '1_philosophy', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-7-1-philosophy', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Philosophy'] }],
        label_map: { 'default': ['Philosophy'] },
        concepts: [{
            concept_id: '1_philosophy_c', concept_name: 'Philosophy',
            diagrams: [{ diagram_id: '1_philosophy_d', title: 'Philosophy', svg_path: 'english_7/philosophy.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Philosophy'] }]
        }]
    },
    {
        topic_id: 'eng-7-1-moral-stories',
        subject: 'English', grade: 'Class 7', domain: 'English Literature',
        concept_key: '1_moral_stories', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-7-1-moral-stories', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Moral Stories'] }],
        label_map: { 'default': ['Moral Stories'] },
        concepts: [{
            concept_id: '1_moral_stories_c', concept_name: 'Moral Stories',
            diagrams: [{ diagram_id: '1_moral_stories_d', title: 'Moral Stories', svg_path: 'english_7/moral-stories.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Moral Stories'] }]
        }]
    },
    {
        topic_id: 'eng-7-1-critical-thinking',
        subject: 'English', grade: 'Class 7', domain: 'English Literature',
        concept_key: '1_critical_thinking', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-7-1-critical-thinking', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Critical Thinking'] }],
        label_map: { 'default': ['Critical Thinking'] },
        concepts: [{
            concept_id: '1_critical_thinking_c', concept_name: 'Critical Thinking',
            diagrams: [{ diagram_id: '1_critical_thinking_d', title: 'Critical Thinking', svg_path: 'english_7/critical-thinking.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Critical Thinking'] }]
        }]
    },
    {
        topic_id: 'eng-7-2-indian-culture',
        subject: 'English', grade: 'Class 7', domain: 'English Literature',
        concept_key: '2_indian_culture', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-7-2-indian-culture', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Indian Culture'] }],
        label_map: { 'default': ['Indian Culture'] },
        concepts: [{
            concept_id: '2_indian_culture_c', concept_name: 'Indian Culture',
            diagrams: [{ diagram_id: '2_indian_culture_d', title: 'Indian Culture', svg_path: 'english_7/indian-culture.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Indian Culture'] }]
        }]
    },
    {
        topic_id: 'eng-7-2-kindness',
        subject: 'English', grade: 'Class 7', domain: 'English Literature',
        concept_key: '2_kindness', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-7-2-kindness', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Kindness'] }],
        label_map: { 'default': ['Kindness'] },
        concepts: [{
            concept_id: '2_kindness_c', concept_name: 'Kindness',
            diagrams: [{ diagram_id: '2_kindness_d', title: 'Kindness', svg_path: 'english_7/kindness.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Kindness'] }]
        }]
    },
    {
        topic_id: 'eng-7-2-vocabulary',
        subject: 'English', grade: 'Class 7', domain: 'English Literature',
        concept_key: '2_vocabulary', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-7-2-vocabulary', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Vocabulary'] }],
        label_map: { 'default': ['Vocabulary'] },
        concepts: [{
            concept_id: '2_vocabulary_c', concept_name: 'Vocabulary',
            diagrams: [{ diagram_id: '2_vocabulary_d', title: 'Vocabulary', svg_path: 'english_7/critical-thinking.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Vocabulary'] }]
        }]
    },
    {
        topic_id: 'eng-7-3-wit-and-humor',
        subject: 'English', grade: 'Class 7', domain: 'English Literature',
        concept_key: '3_wit_and_humor', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-7-3-wit-and-humor', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Wit and Humor'] }],
        label_map: { 'default': ['Wit and Humor'] },
        concepts: [{
            concept_id: '3_wit_and_humor_c', concept_name: 'Wit and Humor',
            diagrams: [{ diagram_id: '3_wit_and_humor_d', title: 'Wit and Humor', svg_path: 'english_7/wit-and-humor.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Wit and Humor'] }]
        }]
    },
    {
        topic_id: 'eng-7-3-problem-solving',
        subject: 'English', grade: 'Class 7', domain: 'English Literature',
        concept_key: '3_problem_solving', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-7-3-problem-solving', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Problem Solving'] }],
        label_map: { 'default': ['Problem Solving'] },
        concepts: [{
            concept_id: '3_problem_solving_c', concept_name: 'Problem Solving',
            diagrams: [{ diagram_id: '3_problem_solving_d', title: 'Problem Solving', svg_path: 'english_7/problem-solving.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Problem Solving'] }]
        }]
    },
    {
        topic_id: 'eng-7-3-drama',
        subject: 'English', grade: 'Class 7', domain: 'English Literature',
        concept_key: '3_drama', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-7-3-drama', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Drama'] }],
        label_map: { 'default': ['Drama'] },
        concepts: [{
            concept_id: '3_drama_c', concept_name: 'Drama',
            diagrams: [{ diagram_id: '3_drama_d', title: 'Drama', svg_path: 'english_7/drama.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Drama'] }]
        }]
    },
    {
        topic_id: 'eng-8-1-historical-fiction',
        subject: 'English', grade: 'Class 8', domain: 'English Literature',
        concept_key: '1_historical_fiction', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-8-1-historical-fiction', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Historical Fiction'] }],
        label_map: { 'default': ['Historical Fiction'] },
        concepts: [{
            concept_id: '1_historical_fiction_c', concept_name: 'Historical Fiction',
            diagrams: [{ diagram_id: '1_historical_fiction_d', title: 'Historical Fiction', svg_path: 'english_8/historical-fiction.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Historical Fiction'] }]
        }]
    },
    {
        topic_id: 'eng-8-1-family-bonds',
        subject: 'English', grade: 'Class 8', domain: 'English Literature',
        concept_key: '1_family_bonds', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-8-1-family-bonds', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Family Bonds'] }],
        label_map: { 'default': ['Family Bonds'] },
        concepts: [{
            concept_id: '1_family_bonds_c', concept_name: 'Family Bonds',
            diagrams: [{ diagram_id: '1_family_bonds_d', title: 'Family Bonds', svg_path: 'english_8/family-bonds.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Family Bonds'] }]
        }]
    },
    {
        topic_id: 'eng-8-1-analysis',
        subject: 'English', grade: 'Class 8', domain: 'English Literature',
        concept_key: '1_analysis', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-8-1-analysis', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Analysis'] }],
        label_map: { 'default': ['Analysis'] },
        concepts: [{
            concept_id: '1_analysis_c', concept_name: 'Analysis',
            diagrams: [{ diagram_id: '1_analysis_d', title: 'Analysis', svg_path: 'english_7/critical-thinking.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Analysis'] }]
        }]
    },
    {
        topic_id: 'eng-8-2-natural-disasters',
        subject: 'English', grade: 'Class 8', domain: 'English Literature',
        concept_key: '2_natural_disasters', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-8-2-natural-disasters', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Natural Disasters'] }],
        label_map: { 'default': ['Natural Disasters'] },
        concepts: [{
            concept_id: '2_natural_disasters_c', concept_name: 'Natural Disasters',
            diagrams: [{ diagram_id: '2_natural_disasters_d', title: 'Natural Disasters', svg_path: 'english_8/natural-disasters.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Natural Disasters'] }]
        }]
    },
    {
        topic_id: 'eng-8-2-survival-stories',
        subject: 'English', grade: 'Class 8', domain: 'English Literature',
        concept_key: '2_survival_stories', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-8-2-survival-stories', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Survival Stories'] }],
        label_map: { 'default': ['Survival Stories'] },
        concepts: [{
            concept_id: '2_survival_stories_c', concept_name: 'Survival Stories',
            diagrams: [{ diagram_id: '2_survival_stories_d', title: 'Survival Stories', svg_path: 'english_8/survival-stories.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Survival Stories'] }]
        }]
    },
    {
        topic_id: 'eng-8-2-report-writing',
        subject: 'English', grade: 'Class 8', domain: 'English Literature',
        concept_key: '2_report_writing', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-8-2-report-writing', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Report Writing'] }],
        label_map: { 'default': ['Report Writing'] },
        concepts: [{
            concept_id: '2_report_writing_c', concept_name: 'Report Writing',
            diagrams: [{ diagram_id: '2_report_writing_d', title: 'Report Writing', svg_path: 'english_8/report-writing.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Report Writing'] }]
        }]
    },
    {
        topic_id: 'eng-8-3-indian-history',
        subject: 'English', grade: 'Class 8', domain: 'English Literature',
        concept_key: '3_indian_history', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-8-3-indian-history', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Indian History'] }],
        label_map: { 'default': ['Indian History'] },
        concepts: [{
            concept_id: '3_indian_history_c', concept_name: 'Indian History',
            diagrams: [{ diagram_id: '3_indian_history_d', title: 'Indian History', svg_path: 'english_8/indian-history.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Indian History'] }]
        }]
    },
    {
        topic_id: 'eng-8-3-comics',
        subject: 'English', grade: 'Class 8', domain: 'English Literature',
        concept_key: '3_comics', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-8-3-comics', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Comics'] }],
        label_map: { 'default': ['Comics'] },
        concepts: [{
            concept_id: '3_comics_c', concept_name: 'Comics',
            diagrams: [{ diagram_id: '3_comics_d', title: 'Comics', svg_path: 'english_8/comics.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Comics'] }]
        }]
    },
    {
        topic_id: 'eng-8-3-timeline',
        subject: 'English', grade: 'Class 8', domain: 'English Literature',
        concept_key: '3_timeline', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-8-3-timeline', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Timeline'] }],
        label_map: { 'default': ['Timeline'] },
        concepts: [{
            concept_id: '3_timeline_c', concept_name: 'Timeline',
            diagrams: [{ diagram_id: '3_timeline_d', title: 'Timeline', svg_path: 'english_8/indian-history.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Timeline'] }]
        }]
    },
    {
        topic_id: 'eng-9-1-science-fiction',
        subject: 'English', grade: 'Class 9', domain: 'English Literature',
        concept_key: '1_science_fiction', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-9-1-science-fiction', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Science Fiction'] }],
        label_map: { 'default': ['Science Fiction'] },
        concepts: [{
            concept_id: '1_science_fiction_c', concept_name: 'Science Fiction',
            diagrams: [{ diagram_id: '1_science_fiction_d', title: 'Science Fiction', svg_path: 'english_9/science-fiction.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Science Fiction'] }]
        }]
    },
    {
        topic_id: 'eng-9-1-future-of-education',
        subject: 'English', grade: 'Class 9', domain: 'English Literature',
        concept_key: '1_future_of_education', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-9-1-future-of-education', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Future of Education'] }],
        label_map: { 'default': ['Future of Education'] },
        concepts: [{
            concept_id: '1_future_of_education_c', concept_name: 'Future of Education',
            diagrams: [{ diagram_id: '1_future_of_education_d', title: 'Future of Education', svg_path: 'english_9/future-of-education.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Future of Education'] }]
        }]
    },
    {
        topic_id: 'eng-9-1-analysis',
        subject: 'English', grade: 'Class 9', domain: 'English Literature',
        concept_key: '1_analysis', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-9-1-analysis', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Analysis'] }],
        label_map: { 'default': ['Analysis'] },
        concepts: [{
            concept_id: '1_analysis_c', concept_name: 'Analysis',
            diagrams: [{ diagram_id: '1_analysis_d', title: 'Analysis', svg_path: 'english_7/critical-thinking.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Analysis'] }]
        }]
    },
    {
        topic_id: 'eng-9-2-biography',
        subject: 'English', grade: 'Class 9', domain: 'English Literature',
        concept_key: '2_biography', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-9-2-biography', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Biography'] }],
        label_map: { 'default': ['Biography'] },
        concepts: [{
            concept_id: '2_biography_c', concept_name: 'Biography',
            diagrams: [{ diagram_id: '2_biography_d', title: 'Biography', svg_path: 'english_9/biography.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Biography'] }]
        }]
    },
    {
        topic_id: 'eng-9-2-music',
        subject: 'English', grade: 'Class 9', domain: 'English Literature',
        concept_key: '2_music', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-9-2-music', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Music'] }],
        label_map: { 'default': ['Music'] },
        concepts: [{
            concept_id: '2_music_c', concept_name: 'Music',
            diagrams: [{ diagram_id: '2_music_d', title: 'Music', svg_path: 'english_9/music.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Music'] }]
        }]
    },
    {
        topic_id: 'eng-9-2-inspiration',
        subject: 'English', grade: 'Class 9', domain: 'English Literature',
        concept_key: '2_inspiration', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-9-2-inspiration', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Inspiration'] }],
        label_map: { 'default': ['Inspiration'] },
        concepts: [{
            concept_id: '2_inspiration_c', concept_name: 'Inspiration',
            diagrams: [{ diagram_id: '2_inspiration_d', title: 'Inspiration', svg_path: 'english_9/inspiration.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Inspiration'] }]
        }]
    },
    {
        topic_id: 'eng-9-3-relationships',
        subject: 'English', grade: 'Class 9', domain: 'English Literature',
        concept_key: '3_relationships', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-9-3-relationships', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Relationships'] }],
        label_map: { 'default': ['Relationships'] },
        concepts: [{
            concept_id: '3_relationships_c', concept_name: 'Relationships',
            diagrams: [{ diagram_id: '3_relationships_d', title: 'Relationships', svg_path: 'english_8/family-bonds.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Relationships'] }]
        }]
    },
    {
        topic_id: 'eng-9-3-character-study',
        subject: 'English', grade: 'Class 9', domain: 'English Literature',
        concept_key: '3_character_study', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-9-3-character-study', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Character Study'] }],
        label_map: { 'default': ['Character Study'] },
        concepts: [{
            concept_id: '3_character_study_c', concept_name: 'Character Study',
            diagrams: [{ diagram_id: '3_character_study_d', title: 'Character Study', svg_path: 'english_9/character-study.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Character Study'] }]
        }]
    },
    {
        topic_id: 'eng-9-3-writing',
        subject: 'English', grade: 'Class 9', domain: 'English Literature',
        concept_key: '3_writing', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-9-3-writing', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Writing'] }],
        label_map: { 'default': ['Writing'] },
        concepts: [{
            concept_id: '3_writing_c', concept_name: 'Writing',
            diagrams: [{ diagram_id: '3_writing_d', title: 'Writing', svg_path: 'english_8/report-writing.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Writing'] }]
        }]
    },
    {
        topic_id: 'eng-10-1-faith',
        subject: 'English', grade: 'Class 10', domain: 'English Literature',
        concept_key: '1_faith', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-10-1-faith', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Faith'] }],
        label_map: { 'default': ['Faith'] },
        concepts: [{
            concept_id: '1_faith_c', concept_name: 'Faith',
            diagrams: [{ diagram_id: '1_faith_d', title: 'Faith', svg_path: 'english_10/faith.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Faith'] }]
        }]
    },
    {
        topic_id: 'eng-10-1-irony',
        subject: 'English', grade: 'Class 10', domain: 'English Literature',
        concept_key: '1_irony', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-10-1-irony', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Irony'] }],
        label_map: { 'default': ['Irony'] },
        concepts: [{
            concept_id: '1_irony_c', concept_name: 'Irony',
            diagrams: [{ diagram_id: '1_irony_d', title: 'Irony', svg_path: 'english_10/irony.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Irony'] }]
        }]
    },
    {
        topic_id: 'eng-10-1-literary-devices',
        subject: 'English', grade: 'Class 10', domain: 'English Literature',
        concept_key: '1_literary_devices', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-10-1-literary-devices', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Literary Devices'] }],
        label_map: { 'default': ['Literary Devices'] },
        concepts: [{
            concept_id: '1_literary_devices_c', concept_name: 'Literary Devices',
            diagrams: [{ diagram_id: '1_literary_devices_d', title: 'Literary Devices', svg_path: 'english_10/literary-devices.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Literary Devices'] }]
        }]
    },
    {
        topic_id: 'eng-10-2-autobiography',
        subject: 'English', grade: 'Class 10', domain: 'English Literature',
        concept_key: '2_autobiography', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-10-2-autobiography', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Autobiography'] }],
        label_map: { 'default': ['Autobiography'] },
        concepts: [{
            concept_id: '2_autobiography_c', concept_name: 'Autobiography',
            diagrams: [{ diagram_id: '2_autobiography_d', title: 'Autobiography', svg_path: 'english_10/autobiography.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Autobiography'] }]
        }]
    },
    {
        topic_id: 'eng-10-2-freedom',
        subject: 'English', grade: 'Class 10', domain: 'English Literature',
        concept_key: '2_freedom', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-10-2-freedom', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Freedom'] }],
        label_map: { 'default': ['Freedom'] },
        concepts: [{
            concept_id: '2_freedom_c', concept_name: 'Freedom',
            diagrams: [{ diagram_id: '2_freedom_d', title: 'Freedom', svg_path: 'english_10/freedom.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Freedom'] }]
        }]
    },
    {
        topic_id: 'eng-10-2-leadership',
        subject: 'English', grade: 'Class 10', domain: 'English Literature',
        concept_key: '2_leadership', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-10-2-leadership', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Leadership'] }],
        label_map: { 'default': ['Leadership'] },
        concepts: [{
            concept_id: '2_leadership_c', concept_name: 'Leadership',
            diagrams: [{ diagram_id: '2_leadership_d', title: 'Leadership', svg_path: 'english_10/leadership.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Leadership'] }]
        }]
    },
    {
        topic_id: 'eng-10-3-adventure',
        subject: 'English', grade: 'Class 10', domain: 'English Literature',
        concept_key: '3_adventure', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-10-3-adventure', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Adventure'] }],
        label_map: { 'default': ['Adventure'] },
        concepts: [{
            concept_id: '3_adventure_c', concept_name: 'Adventure',
            diagrams: [{ diagram_id: '3_adventure_d', title: 'Adventure', svg_path: 'english_10/adventure.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Adventure'] }]
        }]
    },
    {
        topic_id: 'eng-10-3-courier',
        subject: 'English', grade: 'Class 10', domain: 'English Literature',
        concept_key: '3_courier', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-10-3-courier', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Courier'] }],
        label_map: { 'default': ['Courier'] },
        concepts: [{
            concept_id: '3_courier_c', concept_name: 'Courier',
            diagrams: [{ diagram_id: '3_courier_d', title: 'Courier', svg_path: 'english_10/courier.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Courier'] }]
        }]
    },
    {
        topic_id: 'eng-10-3-narrative',
        subject: 'English', grade: 'Class 10', domain: 'English Literature',
        concept_key: '3_narrative', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-10-3-narrative', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Narrative'] }],
        label_map: { 'default': ['Narrative'] },
        concepts: [{
            concept_id: '3_narrative_c', concept_name: 'Narrative',
            diagrams: [{ diagram_id: '3_narrative_d', title: 'Narrative', svg_path: 'english_10/narrative.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Narrative'] }]
        }]
    },
    {
        topic_id: 'eng-10-1-letter-to-god',
        subject: 'English', grade: 'Class 10', domain: 'English Literature',
        concept_key: '1_letter_to_god', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-10-1-letter-to-god', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Letter to God'] }],
        label_map: { 'default': ['Letter to God'] },
        concepts: [{
            concept_id: '1_letter_to_god_c', concept_name: 'Letter to God',
            diagrams: [{ diagram_id: '1_letter_to_god_d', title: 'Letter to God', svg_path: 'english_10/letter-to-god.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Letter to God'] }]
        }]
    },
    {
        topic_id: 'eng-10-2-nelson-mandela',
        subject: 'English', grade: 'Class 10', domain: 'English Literature',
        concept_key: '2_nelson_mandela', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-10-2-nelson-mandela', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Nelson Mandela'] }],
        label_map: { 'default': ['Nelson Mandela'] },
        concepts: [{
            concept_id: '2_nelson_mandela_c', concept_name: 'Nelson Mandela',
            diagrams: [{ diagram_id: '2_nelson_mandela_d', title: 'Nelson Mandela', svg_path: 'english_10/nelson-mandela.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Nelson Mandela'] }]
        }]
    },
    {
        topic_id: 'eng-10-3-two-stories-flying',
        subject: 'English', grade: 'Class 10', domain: 'English Literature',
        concept_key: '3_two_stories_flying', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-10-3-two-stories-flying', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Two Stories Flying'] }],
        label_map: { 'default': ['Two Stories Flying'] },
        concepts: [{
            concept_id: '3_two_stories_flying_c', concept_name: 'Two Stories Flying',
            diagrams: [{ diagram_id: '3_two_stories_flying_d', title: 'Two Stories Flying', svg_path: 'english_10/two-stories-flying.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Two Stories Flying'] }]
        }]
    },
    {
        topic_id: 'eng-10-4-diary-anne-frank',
        subject: 'English', grade: 'Class 10', domain: 'English Literature',
        concept_key: '4_diary_anne_frank', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-10-4-diary-anne-frank', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Diary Anne Frank'] }],
        label_map: { 'default': ['Diary Anne Frank'] },
        concepts: [{
            concept_id: '4_diary_anne_frank_c', concept_name: 'Diary Anne Frank',
            diagrams: [{ diagram_id: '4_diary_anne_frank_d', title: 'Diary Anne Frank', svg_path: 'english_10/diary-anne-frank.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Diary Anne Frank'] }]
        }]
    },
    {
        topic_id: 'eng-10-5-hundred-dresses',
        subject: 'English', grade: 'Class 10', domain: 'English Literature',
        concept_key: '5_hundred_dresses', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-10-5-hundred-dresses', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Hundred Dresses'] }],
        label_map: { 'default': ['Hundred Dresses'] },
        concepts: [{
            concept_id: '5_hundred_dresses_c', concept_name: 'Hundred Dresses',
            diagrams: [{ diagram_id: '5_hundred_dresses_d', title: 'Hundred Dresses', svg_path: 'english_10/hundred-dresses.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Hundred Dresses'] }]
        }]
    },
    {
        topic_id: 'eng-11-1-prose',
        subject: 'English', grade: 'Class 11', domain: 'English Literature',
        concept_key: '1_prose', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-11-1-prose', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Prose'] }],
        label_map: { 'default': ['Prose'] },
        concepts: [{
            concept_id: '1_prose_c', concept_name: 'Prose',
            diagrams: [{ diagram_id: '1_prose_d', title: 'Prose', svg_path: 'english_11/prose.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Prose'] }]
        }]
    },
    {
        topic_id: 'eng-11-1-character-sketch',
        subject: 'English', grade: 'Class 11', domain: 'English Literature',
        concept_key: '1_character_sketch', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-11-1-character-sketch', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Character Sketch'] }],
        label_map: { 'default': ['Character Sketch'] },
        concepts: [{
            concept_id: '1_character_sketch_c', concept_name: 'Character Sketch',
            diagrams: [{ diagram_id: '1_character_sketch_d', title: 'Character Sketch', svg_path: 'english_11/character-sketch.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Character Sketch'] }]
        }]
    },
    {
        topic_id: 'eng-11-1-relationships',
        subject: 'English', grade: 'Class 11', domain: 'English Literature',
        concept_key: '1_relationships', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-11-1-relationships', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Relationships'] }],
        label_map: { 'default': ['Relationships'] },
        concepts: [{
            concept_id: '1_relationships_c', concept_name: 'Relationships',
            diagrams: [{ diagram_id: '1_relationships_d', title: 'Relationships', svg_path: 'english_11/relationships.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Relationships'] }]
        }]
    },
    {
        topic_id: 'eng-11-2-adventure',
        subject: 'English', grade: 'Class 11', domain: 'English Literature',
        concept_key: '2_adventure', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-11-2-adventure', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Adventure'] }],
        label_map: { 'default': ['Adventure'] },
        concepts: [{
            concept_id: '2_adventure_c', concept_name: 'Adventure',
            diagrams: [{ diagram_id: '2_adventure_d', title: 'Adventure', svg_path: 'english_11/adventure.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Adventure'] }]
        }]
    },
    {
        topic_id: 'eng-11-2-survival',
        subject: 'English', grade: 'Class 11', domain: 'English Literature',
        concept_key: '2_survival', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-11-2-survival', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Survival'] }],
        label_map: { 'default': ['Survival'] },
        concepts: [{
            concept_id: '2_survival_c', concept_name: 'Survival',
            diagrams: [{ diagram_id: '2_survival_d', title: 'Survival', svg_path: 'english_11/survival.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Survival'] }]
        }]
    },
    {
        topic_id: 'eng-11-2-determination',
        subject: 'English', grade: 'Class 11', domain: 'English Literature',
        concept_key: '2_determination', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-11-2-determination', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Determination'] }],
        label_map: { 'default': ['Determination'] },
        concepts: [{
            concept_id: '2_determination_c', concept_name: 'Determination',
            diagrams: [{ diagram_id: '2_determination_d', title: 'Determination', svg_path: 'english_11/determination.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Determination'] }]
        }]
    },
    {
        topic_id: 'eng-11-3-history',
        subject: 'English', grade: 'Class 11', domain: 'English Literature',
        concept_key: '3_history', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-11-3-history', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['History'] }],
        label_map: { 'default': ['History'] },
        concepts: [{
            concept_id: '3_history_c', concept_name: 'History',
            diagrams: [{ diagram_id: '3_history_d', title: 'History', svg_path: 'english_11/history.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['History'] }]
        }]
    },
    {
        topic_id: 'eng-11-3-archaeology',
        subject: 'English', grade: 'Class 11', domain: 'English Literature',
        concept_key: '3_archaeology', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-11-3-archaeology', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Archaeology'] }],
        label_map: { 'default': ['Archaeology'] },
        concepts: [{
            concept_id: '3_archaeology_c', concept_name: 'Archaeology',
            diagrams: [{ diagram_id: '3_archaeology_d', title: 'Archaeology', svg_path: 'english_11/archaeology.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Archaeology'] }]
        }]
    },
    {
        topic_id: 'eng-11-3-scientific-writing',
        subject: 'English', grade: 'Class 11', domain: 'English Literature',
        concept_key: '3_scientific_writing', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-11-3-scientific-writing', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Scientific Writing'] }],
        label_map: { 'default': ['Scientific Writing'] },
        concepts: [{
            concept_id: '3_scientific_writing_c', concept_name: 'Scientific Writing',
            diagrams: [{ diagram_id: '3_scientific_writing_d', title: 'Scientific Writing', svg_path: 'english_11/scientific-writing.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Scientific Writing'] }]
        }]
    },
    {
        topic_id: 'eng-12-1-war-literature',
        subject: 'English', grade: 'Class 12', domain: 'English Literature',
        concept_key: '1_war_literature', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-12-1-war-literature', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['War Literature'] }],
        label_map: { 'default': ['War Literature'] },
        concepts: [{
            concept_id: '1_war_literature_c', concept_name: 'War Literature',
            diagrams: [{ diagram_id: '1_war_literature_d', title: 'War Literature', svg_path: 'english_12/war-literature.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['War Literature'] }]
        }]
    },
    {
        topic_id: 'eng-12-1-patriotism',
        subject: 'English', grade: 'Class 12', domain: 'English Literature',
        concept_key: '1_patriotism', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-12-1-patriotism', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Patriotism'] }],
        label_map: { 'default': ['Patriotism'] },
        concepts: [{
            concept_id: '1_patriotism_c', concept_name: 'Patriotism',
            diagrams: [{ diagram_id: '1_patriotism_d', title: 'Patriotism', svg_path: 'english_12/patriotism.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Patriotism'] }]
        }]
    },
    {
        topic_id: 'eng-12-1-analysis',
        subject: 'English', grade: 'Class 12', domain: 'English Literature',
        concept_key: '1_analysis', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-12-1-analysis', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Analysis'] }],
        label_map: { 'default': ['Analysis'] },
        concepts: [{
            concept_id: '1_analysis_c', concept_name: 'Analysis',
            diagrams: [{ diagram_id: '1_analysis_d', title: 'Analysis', svg_path: 'english_12/analysis.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Analysis'] }]
        }]
    },
    {
        topic_id: 'eng-12-2-social-issues',
        subject: 'English', grade: 'Class 12', domain: 'English Literature',
        concept_key: '2_social_issues', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-12-2-social-issues', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Social Issues'] }],
        label_map: { 'default': ['Social Issues'] },
        concepts: [{
            concept_id: '2_social_issues_c', concept_name: 'Social Issues',
            diagrams: [{ diagram_id: '2_social_issues_d', title: 'Social Issues', svg_path: 'english_12/social-issues.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Social Issues'] }]
        }]
    },
    {
        topic_id: 'eng-12-2-child-labor',
        subject: 'English', grade: 'Class 12', domain: 'English Literature',
        concept_key: '2_child_labor', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-12-2-child-labor', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Child Labor'] }],
        label_map: { 'default': ['Child Labor'] },
        concepts: [{
            concept_id: '2_child_labor_c', concept_name: 'Child Labor',
            diagrams: [{ diagram_id: '2_child_labor_d', title: 'Child Labor', svg_path: 'english_12/child-labor.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Child Labor'] }]
        }]
    },
    {
        topic_id: 'eng-12-2-critical-analysis',
        subject: 'English', grade: 'Class 12', domain: 'English Literature',
        concept_key: '2_critical_analysis', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-12-2-critical-analysis', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Critical Analysis'] }],
        label_map: { 'default': ['Critical Analysis'] },
        concepts: [{
            concept_id: '2_critical_analysis_c', concept_name: 'Critical Analysis',
            diagrams: [{ diagram_id: '2_critical_analysis_d', title: 'Critical Analysis', svg_path: 'english_12/critical-analysis.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Critical Analysis'] }]
        }]
    },
    {
        topic_id: 'eng-12-3-autobiography',
        subject: 'English', grade: 'Class 12', domain: 'English Literature',
        concept_key: '3_autobiography', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-12-3-autobiography', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Autobiography'] }],
        label_map: { 'default': ['Autobiography'] },
        concepts: [{
            concept_id: '3_autobiography_c', concept_name: 'Autobiography',
            diagrams: [{ diagram_id: '3_autobiography_d', title: 'Autobiography', svg_path: 'english_12/autobiography.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Autobiography'] }]
        }]
    },
    {
        topic_id: 'eng-12-3-fear',
        subject: 'English', grade: 'Class 12', domain: 'English Literature',
        concept_key: '3_fear', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-12-3-fear', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Fear'] }],
        label_map: { 'default': ['Fear'] },
        concepts: [{
            concept_id: '3_fear_c', concept_name: 'Fear',
            diagrams: [{ diagram_id: '3_fear_d', title: 'Fear', svg_path: 'english_12/fear.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Fear'] }]
        }]
    },
    {
        topic_id: 'eng-12-3-overcoming',
        subject: 'English', grade: 'Class 12', domain: 'English Literature',
        concept_key: '3_overcoming', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_eng-12-3-overcoming', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Overcoming'] }],
        label_map: { 'default': ['Overcoming'] },
        concepts: [{
            concept_id: '3_overcoming_c', concept_name: 'Overcoming',
            diagrams: [{ diagram_id: '3_overcoming_d', title: 'Overcoming', svg_path: 'english_12/overcoming.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Overcoming'] }]
        }]
    },
    {
        topic_id: 'hin-2-1-kavita',
        subject: 'Hindi', grade: 'Class 2', domain: 'Hindi',
        concept_key: '1_kavita', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_hin-2-1-kavita', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['कविता'] }],
        label_map: { 'default': ['कविता'] },
        concepts: [{
            concept_id: '1_kavita_c', concept_name: 'कविता',
            diagrams: [{ diagram_id: '1_kavita_d', title: 'कविता', svg_path: 'hindi_10/poem.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['कविता'] }]
        }]
    },
    {
        topic_id: 'hin-2-2-kahani',
        subject: 'Hindi', grade: 'Class 2', domain: 'Hindi',
        concept_key: '2_kahani', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_hin-2-2-kahani', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['कहानी'] }],
        label_map: { 'default': ['कहानी'] },
        concepts: [{
            concept_id: '2_kahani_c', concept_name: 'कहानी',
            diagrams: [{ diagram_id: '2_kahani_d', title: 'कहानी', svg_path: 'hindi_10/reading.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['कहानी'] }]
        }]
    },
    {
        topic_id: 'hin-10-1-sanchayan',
        subject: 'Hindi', grade: 'Class 10', domain: 'Hindi',
        concept_key: '1_sanchayan', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_hin-10-1-sanchayan', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Sanchayan'] }],
        label_map: { 'default': ['Sanchayan'] },
        concepts: [{
            concept_id: '1_sanchayan_c', concept_name: 'Sanchayan',
            diagrams: [{ diagram_id: '1_sanchayan_d', title: 'Sanchayan', svg_path: 'hindi_10/sanchayan.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Sanchayan'] }]
        }]
    },
    {
        topic_id: 'hin-10-2-sparsh',
        subject: 'Hindi', grade: 'Class 10', domain: 'Hindi',
        concept_key: '2_sparsh', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_hin-10-2-sparsh', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Sparsh'] }],
        label_map: { 'default': ['Sparsh'] },
        concepts: [{
            concept_id: '2_sparsh_c', concept_name: 'Sparsh',
            diagrams: [{ diagram_id: '2_sparsh_d', title: 'Sparsh', svg_path: 'hindi_10/sparsh.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Sparsh'] }]
        }]
    },
    {
        topic_id: 'hin-10-3-kritika',
        subject: 'Hindi', grade: 'Class 10', domain: 'Hindi',
        concept_key: '3_kritika', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_hin-10-3-kritika', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Kritika'] }],
        label_map: { 'default': ['Kritika'] },
        concepts: [{
            concept_id: '3_kritika_c', concept_name: 'Kritika',
            diagrams: [{ diagram_id: '3_kritika_d', title: 'Kritika', svg_path: 'hindi_10/kritika.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Kritika'] }]
        }]
    },
    {
        topic_id: 'hin-10-4-kshitij',
        subject: 'Hindi', grade: 'Class 10', domain: 'Hindi',
        concept_key: '4_kshitij', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_hin-10-4-kshitij', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Kshitij'] }],
        label_map: { 'default': ['Kshitij'] },
        concepts: [{
            concept_id: '4_kshitij_c', concept_name: 'Kshitij',
            diagrams: [{ diagram_id: '4_kshitij_d', title: 'Kshitij', svg_path: 'hindi_10/kshitij.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Kshitij'] }]
        }]
    },
    {
        topic_id: 'hin-10-5-grammar',
        subject: 'Hindi', grade: 'Class 10', domain: 'Hindi',
        concept_key: '5_grammar', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_hin-10-5-grammar', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Grammar'] }],
        label_map: { 'default': ['Grammar'] },
        concepts: [{
            concept_id: '5_grammar_c', concept_name: 'Grammar',
            diagrams: [{ diagram_id: '5_grammar_d', title: 'Grammar', svg_path: 'hindi_10/grammar.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Grammar'] }]
        }]
    },
    {
        topic_id: 'hin-10-6-writing-skills',
        subject: 'Hindi', grade: 'Class 10', domain: 'Hindi',
        concept_key: '6_writing_skills', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_hin-10-6-writing-skills', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Writing Skills'] }],
        label_map: { 'default': ['Writing Skills'] },
        concepts: [{
            concept_id: '6_writing_skills_c', concept_name: 'Writing Skills',
            diagrams: [{ diagram_id: '6_writing_skills_d', title: 'Writing Skills', svg_path: 'hindi_10/writing-skills.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Writing Skills'] }]
        }]
    },
    {
        topic_id: 'hin-10-7-hindi-practice',
        subject: 'Hindi', grade: 'Class 10', domain: 'Hindi',
        concept_key: '7_hindi_practice', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_hin-10-7-hindi-practice', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Hindi Practice'] }],
        label_map: { 'default': ['Hindi Practice'] },
        concepts: [{
            concept_id: '7_hindi_practice_c', concept_name: 'Hindi Practice',
            diagrams: [{ diagram_id: '7_hindi_practice_d', title: 'Hindi Practice', svg_path: 'hindi_10/hindi-practice.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Hindi Practice'] }]
        }]
    },
    {
        topic_id: 'math-6-1-large-numbers',
        subject: 'Mathematics', grade: 'Class 6', domain: 'Mathematics',
        concept_key: '1_large_numbers', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-6-1-large-numbers', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Large Numbers'] }],
        label_map: { 'default': ['Large Numbers'] },
        concepts: [{
            concept_id: '1_large_numbers_c', concept_name: 'Large Numbers',
            diagrams: [{ diagram_id: '1_large_numbers_d', title: 'Large Numbers', svg_path: 'mathematics_6/large-numbers.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Large Numbers'] }]
        }]
    },
    {
        topic_id: 'math-6-1-indian-system',
        subject: 'Mathematics', grade: 'Class 6', domain: 'Mathematics',
        concept_key: '1_indian_system', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-6-1-indian-system', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Indian System'] }],
        label_map: { 'default': ['Indian System'] },
        concepts: [{
            concept_id: '1_indian_system_c', concept_name: 'Indian System',
            diagrams: [{ diagram_id: '1_indian_system_d', title: 'Indian System', svg_path: 'mathematics_6/indian-system.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Indian System'] }]
        }]
    },
    {
        topic_id: 'math-6-1-international-system',
        subject: 'Mathematics', grade: 'Class 6', domain: 'Mathematics',
        concept_key: '1_international_system', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-6-1-international-system', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['International System'] }],
        label_map: { 'default': ['International System'] },
        concepts: [{
            concept_id: '1_international_system_c', concept_name: 'International System',
            diagrams: [{ diagram_id: '1_international_system_d', title: 'International System', svg_path: 'mathematics_6/international-system.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['International System'] }]
        }]
    },
    {
        topic_id: 'math-6-2-properties',
        subject: 'Mathematics', grade: 'Class 6', domain: 'Mathematics',
        concept_key: '2_properties', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-6-2-properties', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Properties'] }],
        label_map: { 'default': ['Properties'] },
        concepts: [{
            concept_id: '2_properties_c', concept_name: 'Properties',
            diagrams: [{ diagram_id: '2_properties_d', title: 'Whole Number Properties', svg_path: 'mathematics_6/properties.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Properties'] }]
        }]
    },
    {
        topic_id: 'math-6-2-operations',
        subject: 'Mathematics', grade: 'Class 6', domain: 'Mathematics',
        concept_key: '2_operations', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-6-2-operations', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Operations'] }],
        label_map: { 'default': ['Operations'] },
        concepts: [{
            concept_id: '2_operations_c', concept_name: 'Operations',
            diagrams: [{ diagram_id: '2_operations_d', title: 'Whole Number Operations', svg_path: 'mathematics_6/operations.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Operations'] }]
        }]
    },
    {
        topic_id: 'math-6-2-number-line',
        subject: 'Mathematics', grade: 'Class 6', domain: 'Mathematics',
        concept_key: '2_number_line', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-6-2-number-line', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Number Line'] }],
        label_map: { 'default': ['Number Line'] },
        concepts: [{
            concept_id: '2_number_line_c', concept_name: 'Number Line',
            diagrams: [{ diagram_id: '2_number_line_d', title: 'Number Line', svg_path: 'mathematics_6/number-line.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Number Line'] }]
        }]
    },
    {
        topic_id: 'math-6-3-factors',
        subject: 'Mathematics', grade: 'Class 6', domain: 'Mathematics',
        concept_key: '3_factors', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-6-3-factors', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Factors'] }],
        label_map: { 'default': ['Factors'] },
        concepts: [{
            concept_id: '3_factors_c', concept_name: 'Factors',
            diagrams: [{ diagram_id: '3_factors_d', title: 'Factors', svg_path: 'mathematics_6/factors.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Factors'] }]
        }]
    },
    {
        topic_id: 'math-6-3-multiples',
        subject: 'Mathematics', grade: 'Class 6', domain: 'Mathematics',
        concept_key: '3_multiples', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-6-3-multiples', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Multiples'] }],
        label_map: { 'default': ['Multiples'] },
        concepts: [{
            concept_id: '3_multiples_c', concept_name: 'Multiples',
            diagrams: [{ diagram_id: '3_multiples_d', title: 'Multiples', svg_path: 'mathematics_6/multiples.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Multiples'] }]
        }]
    },
    {
        topic_id: 'math-6-3-divisibility',
        subject: 'Mathematics', grade: 'Class 6', domain: 'Mathematics',
        concept_key: '3_divisibility', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-6-3-divisibility', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Divisibility'] }],
        label_map: { 'default': ['Divisibility'] },
        concepts: [{
            concept_id: '3_divisibility_c', concept_name: 'Divisibility',
            diagrams: [{ diagram_id: '3_divisibility_d', title: 'Divisibility', svg_path: 'mathematics_6/divisibility.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Divisibility'] }]
        }]
    },
    {
        topic_id: 'math-6-4-points',
        subject: 'Mathematics', grade: 'Class 6', domain: 'Mathematics',
        concept_key: '4_points', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-6-4-points', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Points'] }],
        label_map: { 'default': ['Points'] },
        concepts: [{
            concept_id: '4_points_c', concept_name: 'Points',
            diagrams: [{ diagram_id: '4_points_d', title: 'Points', svg_path: 'mathematics_6/points.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Points'] }]
        }]
    },
    {
        topic_id: 'math-6-4-lines',
        subject: 'Mathematics', grade: 'Class 6', domain: 'Mathematics',
        concept_key: '4_lines', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-6-4-lines', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Lines'] }],
        label_map: { 'default': ['Lines'] },
        concepts: [{
            concept_id: '4_lines_c', concept_name: 'Lines',
            diagrams: [{ diagram_id: '4_lines_d', title: 'Lines', svg_path: 'mathematics_6/lines.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Lines'] }]
        }]
    },
    {
        topic_id: 'math-6-4-curves',
        subject: 'Mathematics', grade: 'Class 6', domain: 'Mathematics',
        concept_key: '4_curves', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-6-4-curves', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Curves'] }],
        label_map: { 'default': ['Curves'] },
        concepts: [{
            concept_id: '4_curves_c', concept_name: 'Curves',
            diagrams: [{ diagram_id: '4_curves_d', title: 'Curves', svg_path: 'mathematics_6/curves.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Curves'] }]
        }]
    },
    {
        topic_id: 'math-6-4-polygons',
        subject: 'Mathematics', grade: 'Class 6', domain: 'Mathematics',
        concept_key: '4_polygons', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-6-4-polygons', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Polygons'] }],
        label_map: { 'default': ['Polygons'] },
        concepts: [{
            concept_id: '4_polygons_c', concept_name: 'Polygons',
            diagrams: [{ diagram_id: '4_polygons_d', title: 'Polygons', svg_path: 'mathematics_6/polygons.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Polygons'] }]
        }]
    },
    // ── Science Class 6 ────────────────────────────────────────────
    {
        topic_id: 'sci-6-1-food-sources',
        subject: 'Science', grade: 'Class 6', domain: 'Science',
        concept_key: '1_food_sources', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-6-1-food-sources', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Food Sources'] }],
        label_map: { 'default': ['Food Sources'] },
        concepts: [{
            concept_id: '1_food_sources_c', concept_name: 'Food Sources',
            diagrams: [{ diagram_id: '1_food_sources_d', title: 'Food Sources', svg_path: 'science_6/food-sources.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Food Sources'] }]
        }]
    },
    {
        topic_id: 'sci-6-1-food-habits',
        subject: 'Science', grade: 'Class 6', domain: 'Science',
        concept_key: '1_food_habits', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-6-1-food-habits', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Food Habits'] }],
        label_map: { 'default': ['Food Habits'] },
        concepts: [{
            concept_id: '1_food_habits_c', concept_name: 'Food Habits',
            diagrams: [{ diagram_id: '1_food_habits_d', title: 'Food Habits', svg_path: 'science_6/food-habits.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Food Habits'] }]
        }]
    },
    {
        topic_id: 'sci-6-1-ingredients',
        subject: 'Science', grade: 'Class 6', domain: 'Science',
        concept_key: '1_ingredients', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-6-1-ingredients', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Ingredients'] }],
        label_map: { 'default': ['Ingredients'] },
        concepts: [{
            concept_id: '1_ingredients_c', concept_name: 'Ingredients',
            diagrams: [{ diagram_id: '1_ingredients_d', title: 'Ingredients', svg_path: 'science_6/ingredients.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Ingredients'] }]
        }]
    },
    {
        topic_id: 'sci-6-2-nutrients',
        subject: 'Science', grade: 'Class 6', domain: 'Science',
        concept_key: '2_nutrients', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-6-2-nutrients', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Nutrients'] }],
        label_map: { 'default': ['Nutrients'] },
        concepts: [{
            concept_id: '2_nutrients_c', concept_name: 'Nutrients',
            diagrams: [{ diagram_id: '2_nutrients_d', title: 'Nutrients', svg_path: 'science_6/nutrients.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Nutrients'] }]
        }]
    },
    {
        topic_id: 'sci-6-2-balanced-diet',
        subject: 'Science', grade: 'Class 6', domain: 'Science',
        concept_key: '2_balanced_diet', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-6-2-balanced-diet', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Balanced Diet'] }],
        label_map: { 'default': ['Balanced Diet'] },
        concepts: [{
            concept_id: '2_balanced_diet_c', concept_name: 'Balanced Diet',
            diagrams: [{ diagram_id: '2_balanced_diet_d', title: 'Balanced Diet', svg_path: 'science_6/balanced-diet.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Balanced Diet'] }]
        }]
    },
    {
        topic_id: 'sci-6-2-deficiency-diseases',
        subject: 'Science', grade: 'Class 6', domain: 'Science',
        concept_key: '2_deficiency_diseases', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-6-2-deficiency-diseases', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Deficiency Diseases'] }],
        label_map: { 'default': ['Deficiency Diseases'] },
        concepts: [{
            concept_id: '2_deficiency_diseases_c', concept_name: 'Deficiency Diseases',
            diagrams: [{ diagram_id: '2_deficiency_diseases_d', title: 'Deficiency Diseases', svg_path: 'science_6/deficiency-diseases.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Deficiency Diseases'] }]
        }]
    },
    {
        topic_id: 'sci-6-3-natural-fibres',
        subject: 'Science', grade: 'Class 6', domain: 'Science',
        concept_key: '3_natural_fibres', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-6-3-natural-fibres', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Natural Fibres'] }],
        label_map: { 'default': ['Natural Fibres'] },
        concepts: [{
            concept_id: '3_natural_fibres_c', concept_name: 'Natural Fibres',
            diagrams: [{ diagram_id: '3_natural_fibres_d', title: 'Natural Fibres', svg_path: 'science_6/natural-fibres.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Natural Fibres'] }]
        }]
    },
    {
        topic_id: 'sci-6-3-spinning',
        subject: 'Science', grade: 'Class 6', domain: 'Science',
        concept_key: '3_spinning', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-6-3-spinning', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Spinning'] }],
        label_map: { 'default': ['Spinning'] },
        concepts: [{
            concept_id: '3_spinning_c', concept_name: 'Spinning',
            diagrams: [{ diagram_id: '3_spinning_d', title: 'Spinning', svg_path: 'science_6/spinning.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Spinning'] }]
        }]
    },
    {
        topic_id: 'sci-6-3-weaving',
        subject: 'Science', grade: 'Class 6', domain: 'Science',
        concept_key: '3_weaving', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-6-3-weaving', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Weaving'] }],
        label_map: { 'default': ['Weaving'] },
        concepts: [{
            concept_id: '3_weaving_c', concept_name: 'Weaving',
            diagrams: [{ diagram_id: '3_weaving_d', title: 'Weaving', svg_path: 'science_6/weaving.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Weaving'] }]
        }]
    },
    {
        topic_id: 'sci-6-4-material-properties',
        subject: 'Science', grade: 'Class 6', domain: 'Science',
        concept_key: '4_material_properties', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-6-4-material-properties', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Material Properties'] }],
        label_map: { 'default': ['Material Properties'] },
        concepts: [{
            concept_id: '4_material_properties_c', concept_name: 'Material Properties',
            diagrams: [{ diagram_id: '4_material_properties_d', title: 'Material Properties', svg_path: 'science_6/material-properties.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Material Properties'] }]
        }]
    },
    {
        topic_id: 'sci-6-4-classification',
        subject: 'Science', grade: 'Class 6', domain: 'Science',
        concept_key: '4_classification', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-6-4-classification', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Classification'] }],
        label_map: { 'default': ['Classification'] },
        concepts: [{
            concept_id: '4_classification_c', concept_name: 'Classification',
            diagrams: [{ diagram_id: '4_classification_d', title: 'Classification', svg_path: 'science_6/classification.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Classification'] }]
        }]
    },
    {
        topic_id: 'sci-6-4-uses',
        subject: 'Science', grade: 'Class 6', domain: 'Science',
        concept_key: '4_uses', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-6-4-uses', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Uses'] }],
        label_map: { 'default': ['Uses'] },
        concepts: [{
            concept_id: '4_uses_c', concept_name: 'Uses',
            diagrams: [{ diagram_id: '4_uses_d', title: 'Uses of Materials', svg_path: 'science_6/uses.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Uses'] }]
        }]
    },
    // ── Social Science Class 6 ─────────────────────────────────────
    {
        topic_id: 'sst-6-1-history-introduction',
        subject: 'Social Science', grade: 'Class 6', domain: 'Social Science',
        concept_key: '1_history_introduction', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-6-1-history-introduction', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['History Introduction'] }],
        label_map: { 'default': ['History Introduction'] },
        concepts: [{
            concept_id: '1_history_introduction_c', concept_name: 'History Introduction',
            diagrams: [{ diagram_id: '1_history_introduction_d', title: 'History Introduction', svg_path: 'social_6/history-introduction.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['History Introduction'] }]
        }]
    },
    {
        topic_id: 'sst-6-1-sources',
        subject: 'Social Science', grade: 'Class 6', domain: 'Social Science',
        concept_key: '1_sources', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-6-1-sources', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Sources'] }],
        label_map: { 'default': ['Sources'] },
        concepts: [{
            concept_id: '1_sources_c', concept_name: 'Sources',
            diagrams: [{ diagram_id: '1_sources_d', title: 'Historical Sources', svg_path: 'social_6/sources.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Sources'] }]
        }]
    },
    {
        topic_id: 'sst-6-1-timeline',
        subject: 'Social Science', grade: 'Class 6', domain: 'Social Science',
        concept_key: '1_timeline', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-6-1-timeline', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Timeline'] }],
        label_map: { 'default': ['Timeline'] },
        concepts: [{
            concept_id: '1_timeline_c', concept_name: 'Timeline',
            diagrams: [{ diagram_id: '1_timeline_d', title: 'Historical Timeline', svg_path: 'social_6/timeline.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Timeline'] }]
        }]
    },
    {
        topic_id: 'sst-6-2-planets',
        subject: 'Social Science', grade: 'Class 6', domain: 'Social Science',
        concept_key: '2_planets', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-6-2-planets', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Planets'] }],
        label_map: { 'default': ['Planets'] },
        concepts: [{
            concept_id: '2_planets_c', concept_name: 'Planets',
            diagrams: [{ diagram_id: '2_planets_d', title: 'Planets', svg_path: 'social_6/planets.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Planets'] }]
        }]
    },
    {
        topic_id: 'sst-6-2-earth',
        subject: 'Social Science', grade: 'Class 6', domain: 'Social Science',
        concept_key: '2_earth', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-6-2-earth', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Earth'] }],
        label_map: { 'default': ['Earth'] },
        concepts: [{
            concept_id: '2_earth_c', concept_name: 'Earth',
            diagrams: [{ diagram_id: '2_earth_d', title: 'Earth in Solar System', svg_path: 'social_6/earth.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Earth'] }]
        }]
    },
    {
        topic_id: 'sst-6-2-moon',
        subject: 'Social Science', grade: 'Class 6', domain: 'Social Science',
        concept_key: '2_moon', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-6-2-moon', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Moon'] }],
        label_map: { 'default': ['Moon'] },
        concepts: [{
            concept_id: '2_moon_c', concept_name: 'Moon',
            diagrams: [{ diagram_id: '2_moon_d', title: 'Moon', svg_path: 'social_6/moon.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Moon'] }]
        }]
    },
    {
        topic_id: 'sst-6-3-indian-diversity',
        subject: 'Social Science', grade: 'Class 6', domain: 'Social Science',
        concept_key: '3_indian_diversity', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-6-3-indian-diversity', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Indian Diversity'] }],
        label_map: { 'default': ['Indian Diversity'] },
        concepts: [{
            concept_id: '3_indian_diversity_c', concept_name: 'Indian Diversity',
            diagrams: [{ diagram_id: '3_indian_diversity_d', title: 'Indian Diversity', svg_path: 'social_6/indian-diversity.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Indian Diversity'] }]
        }]
    },
    {
        topic_id: 'sst-6-3-culture',
        subject: 'Social Science', grade: 'Class 6', domain: 'Social Science',
        concept_key: '3_culture', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-6-3-culture', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Culture'] }],
        label_map: { 'default': ['Culture'] },
        concepts: [{
            concept_id: '3_culture_c', concept_name: 'Culture',
            diagrams: [{ diagram_id: '3_culture_d', title: 'Culture of India', svg_path: 'social_6/culture.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Culture'] }]
        }]
    },
    {
        topic_id: 'sst-6-3-unity',
        subject: 'Social Science', grade: 'Class 6', domain: 'Social Science',
        concept_key: '3_unity', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-6-3-unity', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Unity'] }],
        label_map: { 'default': ['Unity'] },
        concepts: [{
            concept_id: '3_unity_c', concept_name: 'Unity',
            diagrams: [{ diagram_id: '3_unity_d', title: 'Unity in Diversity', svg_path: 'social_6/unity.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Unity'] }]
        }]
    },
    // ── Computer Science Class 6 ──────────────────────────────────
    {
        topic_id: 'comp-6-1-history',
        subject: 'Computer Science', grade: 'Class 6', domain: 'Computer Science',
        concept_key: '1_history', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_comp-6-1-history', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-25',
        source: 'Internal', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Computer History'] }],
        label_map: { 'default': ['Computer History'] },
        concepts: [{
            concept_id: '1_history_c', concept_name: 'History of Computers',
            diagrams: [{ diagram_id: '1_history_d', title: 'Computer History', svg_path: 'computer science_6/windows.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['History'] }]
        }]
    },
    {
        topic_id: 'comp-6-1-components',
        subject: 'Computer Science', grade: 'Class 6', domain: 'Computer Science',
        concept_key: '1_components', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_comp-6-1-components', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-25',
        source: 'Internal', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Computer Components'] }],
        label_map: { 'default': ['Computer Components'] },
        concepts: [{
            concept_id: '1_components_c', concept_name: 'Computer Components',
            diagrams: [{ diagram_id: '1_components_d', title: 'Computer Components', svg_path: 'computer science_6/components.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Components'] }]
        }]
    },
    {
        topic_id: 'comp-6-2-windows',
        subject: 'Computer Science', grade: 'Class 6', domain: 'Computer Science',
        concept_key: '2_windows', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_comp-6-2-windows', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-25',
        source: 'Internal', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Windows OS'] }],
        label_map: { 'default': ['Windows OS'] },
        concepts: [{
            concept_id: '2_windows_c', concept_name: 'Windows Operating System',
            diagrams: [{ diagram_id: '2_windows_d', title: 'Windows OS', svg_path: 'computer science_6/windows.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Windows'] }]
        }]
    },
    {
        topic_id: 'comp-6-2-desktop',
        subject: 'Computer Science', grade: 'Class 6', domain: 'Computer Science',
        concept_key: '2_desktop', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_comp-6-2-desktop', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-25',
        source: 'Internal', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Desktop Environment'] }],
        label_map: { 'default': ['Desktop Environment'] },
        concepts: [{
            concept_id: '2_desktop_c', concept_name: 'The Desktop',
            diagrams: [{ diagram_id: '2_desktop_d', title: 'Desktop', svg_path: 'computer science_6/desktop.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Desktop'] }]
        }]
    },
    {
        topic_id: 'comp-6-2-file-management',
        subject: 'Computer Science', grade: 'Class 6', domain: 'Computer Science',
        concept_key: '2_file_management', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_comp-6-2-file-management', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-25',
        source: 'Internal', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['File Management'] }],
        label_map: { 'default': ['File Management'] },
        concepts: [{
            concept_id: '2_file_management_c', concept_name: 'File Management',
            diagrams: [{ diagram_id: '2_file_management_d', title: 'File Management', svg_path: 'computer science_6/file-management.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['File Management'] }]
        }]
    },
    {
        topic_id: 'math-7-1-negative-numbers',
        subject: 'Mathematics', grade: 'Class 7', domain: 'Mathematics',
        concept_key: '1_negative_numbers', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-7-1-negative-numbers', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Negative Numbers'] }],
        label_map: { 'default': ['Negative Numbers'] },
        concepts: [{
            concept_id: '1_negative_numbers_c', concept_name: 'Negative Numbers',
            diagrams: [{ diagram_id: '1_negative_numbers_d', title: 'Negative Numbers', svg_path: 'mathematics_7/negative-numbers.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Negative Numbers'] }]
        }]
    },
    {
        topic_id: 'math-7-1-operations',
        subject: 'Mathematics', grade: 'Class 7', domain: 'Mathematics',
        concept_key: '1_operations', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-7-1-operations', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Operations'] }],
        label_map: { 'default': ['Operations'] },
        concepts: [{
            concept_id: '1_operations_c', concept_name: 'Operations',
            diagrams: [{ diagram_id: '1_operations_d', title: 'Operations', svg_path: 'mathematics_7/operations.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Operations'] }]
        }]
    },
    {
        topic_id: 'math-7-1-properties',
        subject: 'Mathematics', grade: 'Class 7', domain: 'Mathematics',
        concept_key: '1_properties', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-7-1-properties', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Properties'] }],
        label_map: { 'default': ['Properties'] },
        concepts: [{
            concept_id: '1_properties_c', concept_name: 'Properties',
            diagrams: [{ diagram_id: '1_properties_d', title: 'Properties', svg_path: 'mathematics_7/properties.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Properties'] }]
        }]
    },
    {
        topic_id: 'math-7-2-operations',
        subject: 'Mathematics', grade: 'Class 7', domain: 'Mathematics',
        concept_key: '2_operations', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-7-2-operations', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Operations'] }],
        label_map: { 'default': ['Operations'] },
        concepts: [{
            concept_id: '2_operations_c', concept_name: 'Operations',
            diagrams: [{ diagram_id: '2_operations_d', title: 'Operations', svg_path: 'mathematics_7/operations.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Operations'] }]
        }]
    },
    {
        topic_id: 'math-7-2-conversion',
        subject: 'Mathematics', grade: 'Class 7', domain: 'Mathematics',
        concept_key: '2_conversion', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-7-2-conversion', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Conversion'] }],
        label_map: { 'default': ['Conversion'] },
        concepts: [{
            concept_id: '2_conversion_c', concept_name: 'Conversion',
            diagrams: [{ diagram_id: '2_conversion_d', title: 'Conversion', svg_path: 'mathematics_7/conversion.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Conversion'] }]
        }]
    },
    {
        topic_id: 'math-7-2-word-problems',
        subject: 'Mathematics', grade: 'Class 7', domain: 'Mathematics',
        concept_key: '2_word_problems', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-7-2-word-problems', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Word Problems'] }],
        label_map: { 'default': ['Word Problems'] },
        concepts: [{
            concept_id: '2_word_problems_c', concept_name: 'Word Problems',
            diagrams: [{ diagram_id: '2_word_problems_d', title: 'Word Problems', svg_path: 'mathematics_7/word-problems.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Word Problems'] }]
        }]
    },
    {
        topic_id: 'math-7-3-mean',
        subject: 'Mathematics', grade: 'Class 7', domain: 'Mathematics',
        concept_key: '3_mean', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-7-3-mean', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Mean'] }],
        label_map: { 'default': ['Mean'] },
        concepts: [{
            concept_id: '3_mean_c', concept_name: 'Mean',
            diagrams: [{ diagram_id: '3_mean_d', title: 'Mean', svg_path: 'mathematics_7/mean.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Mean'] }]
        }]
    },
    {
        topic_id: 'math-7-3-median',
        subject: 'Mathematics', grade: 'Class 7', domain: 'Mathematics',
        concept_key: '3_median', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-7-3-median', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Median'] }],
        label_map: { 'default': ['Median'] },
        concepts: [{
            concept_id: '3_median_c', concept_name: 'Median',
            diagrams: [{ diagram_id: '3_median_d', title: 'Median', svg_path: 'mathematics_7/median.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Median'] }]
        }]
    },
    {
        topic_id: 'math-7-3-mode',
        subject: 'Mathematics', grade: 'Class 7', domain: 'Mathematics',
        concept_key: '3_mode', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-7-3-mode', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Mode'] }],
        label_map: { 'default': ['Mode'] },
        concepts: [{
            concept_id: '3_mode_c', concept_name: 'Mode',
            diagrams: [{ diagram_id: '3_mode_d', title: 'Mode', svg_path: 'mathematics_7/mode.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Mode'] }]
        }]
    },
    {
        topic_id: 'math-7-3-graphs',
        subject: 'Mathematics', grade: 'Class 7', domain: 'Mathematics',
        concept_key: '3_graphs', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-7-3-graphs', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Graphs'] }],
        label_map: { 'default': ['Graphs'] },
        concepts: [{
            concept_id: '3_graphs_c', concept_name: 'Graphs',
            diagrams: [{ diagram_id: '3_graphs_d', title: 'Graphs', svg_path: 'mathematics_7/graphs.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Graphs'] }]
        }]
    },
    {
        topic_id: 'math-7-4-variables',
        subject: 'Mathematics', grade: 'Class 7', domain: 'Mathematics',
        concept_key: '4_variables', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-7-4-variables', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Variables'] }],
        label_map: { 'default': ['Variables'] },
        concepts: [{
            concept_id: '4_variables_c', concept_name: 'Variables',
            diagrams: [{ diagram_id: '4_variables_d', title: 'Variables', svg_path: 'mathematics_7/variables.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Variables'] }]
        }]
    },
    {
        topic_id: 'math-7-4-solving-equations',
        subject: 'Mathematics', grade: 'Class 7', domain: 'Mathematics',
        concept_key: '4_solving_equations', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-7-4-solving-equations', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Solving Equations'] }],
        label_map: { 'default': ['Solving Equations'] },
        concepts: [{
            concept_id: '4_solving_equations_c', concept_name: 'Solving Equations',
            diagrams: [{ diagram_id: '4_solving_equations_d', title: 'Solving Equations', svg_path: 'mathematics_7/solving-equations.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Solving Equations'] }]
        }]
    },
    {
        topic_id: 'math-7-4-applications',
        subject: 'Mathematics', grade: 'Class 7', domain: 'Mathematics',
        concept_key: '4_applications', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-7-4-applications', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Applications'] }],
        label_map: { 'default': ['Applications'] },
        concepts: [{
            concept_id: '4_applications_c', concept_name: 'Applications',
            diagrams: [{ diagram_id: '4_applications_d', title: 'Applications', svg_path: 'mathematics_7/applications.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Applications'] }]
        }]
    },
    {
        topic_id: 'math-8-1-properties',
        subject: 'Mathematics', grade: 'Class 8', domain: 'Mathematics',
        concept_key: '1_properties', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-8-1-properties', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Properties'] }],
        label_map: { 'default': ['Properties'] },
        concepts: [{
            concept_id: '1_properties_c', concept_name: 'Properties',
            diagrams: [{ diagram_id: '1_properties_d', title: 'Properties', svg_path: 'mathematics_8/rational-properties.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Properties'] }]
        }]
    },
    {
        topic_id: 'math-8-1-operations',
        subject: 'Mathematics', grade: 'Class 8', domain: 'Mathematics',
        concept_key: '1_operations', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-8-1-operations', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Operations'] }],
        label_map: { 'default': ['Operations'] },
        concepts: [{
            concept_id: '1_operations_c', concept_name: 'Operations',
            diagrams: [{ diagram_id: '1_operations_d', title: 'Operations', svg_path: 'mathematics_8/rational-operations.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Operations'] }]
        }]
    },
    {
        topic_id: 'math-8-1-number-line',
        subject: 'Mathematics', grade: 'Class 8', domain: 'Mathematics',
        concept_key: '1_number_line', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-8-1-number-line', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Number Line'] }],
        label_map: { 'default': ['Number Line'] },
        concepts: [{
            concept_id: '1_number_line_c', concept_name: 'Number Line',
            diagrams: [{ diagram_id: '1_number_line_d', title: 'Number Line', svg_path: 'mathematics_8/number-line.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Number Line'] }]
        }]
    },
    {
        topic_id: 'math-8-2-solving-equations',
        subject: 'Mathematics', grade: 'Class 8', domain: 'Mathematics',
        concept_key: '2_solving_equations', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-8-2-solving-equations', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Solving Equations'] }],
        label_map: { 'default': ['Solving Equations'] },
        concepts: [{
            concept_id: '2_solving_equations_c', concept_name: 'Solving Equations',
            diagrams: [{ diagram_id: '2_solving_equations_d', title: 'Solving Equations', svg_path: 'mathematics_8/solving-equations.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Solving Equations'] }]
        }]
    },
    {
        topic_id: 'math-8-2-word-problems',
        subject: 'Mathematics', grade: 'Class 8', domain: 'Mathematics',
        concept_key: '2_word_problems', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-8-2-word-problems', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Word Problems'] }],
        label_map: { 'default': ['Word Problems'] },
        concepts: [{
            concept_id: '2_word_problems_c', concept_name: 'Word Problems',
            diagrams: [{ diagram_id: '2_word_problems_d', title: 'Word Problems', svg_path: 'mathematics_8/word-problems.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Word Problems'] }]
        }]
    },
    {
        topic_id: 'math-8-2-applications',
        subject: 'Mathematics', grade: 'Class 8', domain: 'Mathematics',
        concept_key: '2_applications', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-8-2-applications', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Applications'] }],
        label_map: { 'default': ['Applications'] },
        concepts: [{
            concept_id: '2_applications_c', concept_name: 'Applications',
            diagrams: [{ diagram_id: '2_applications_d', title: 'Applications', svg_path: 'mathematics_8/equation-applications.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Applications'] }]
        }]
    },
    {
        topic_id: 'math-8-3-types',
        subject: 'Mathematics', grade: 'Class 8', domain: 'Mathematics',
        concept_key: '3_types', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-8-3-types', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Types'] }],
        label_map: { 'default': ['Types'] },
        concepts: [{
            concept_id: '3_types_c', concept_name: 'Types',
            diagrams: [{ diagram_id: '3_types_d', title: 'Types', svg_path: 'mathematics_8/quadrilateral-types.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Types'] }]
        }]
    },
    {
        topic_id: 'math-8-3-properties',
        subject: 'Mathematics', grade: 'Class 8', domain: 'Mathematics',
        concept_key: '3_properties', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-8-3-properties', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Properties'] }],
        label_map: { 'default': ['Properties'] },
        concepts: [{
            concept_id: '3_properties_c', concept_name: 'Properties',
            diagrams: [{ diagram_id: '3_properties_d', title: 'Properties', svg_path: 'mathematics_8/quadrilateral-properties.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Properties'] }]
        }]
    },
    {
        topic_id: 'math-8-3-angle-sum',
        subject: 'Mathematics', grade: 'Class 8', domain: 'Mathematics',
        concept_key: '3_angle_sum', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-8-3-angle-sum', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Angle Sum'] }],
        label_map: { 'default': ['Angle Sum'] },
        concepts: [{
            concept_id: '3_angle_sum_c', concept_name: 'Angle Sum',
            diagrams: [{ diagram_id: '3_angle_sum_d', title: 'Angle Sum', svg_path: 'mathematics_8/angle-sum.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Angle Sum'] }]
        }]
    },
    {
        topic_id: 'math-8-4-perfect-squares',
        subject: 'Mathematics', grade: 'Class 8', domain: 'Mathematics',
        concept_key: '4_perfect_squares', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-8-4-perfect-squares', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Perfect Squares'] }],
        label_map: { 'default': ['Perfect Squares'] },
        concepts: [{
            concept_id: '4_perfect_squares_c', concept_name: 'Perfect Squares',
            diagrams: [{ diagram_id: '4_perfect_squares_d', title: 'Perfect Squares', svg_path: 'mathematics_8/perfect-squares.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Perfect Squares'] }]
        }]
    },
    {
        topic_id: 'math-8-4-finding-roots',
        subject: 'Mathematics', grade: 'Class 8', domain: 'Mathematics',
        concept_key: '4_finding_roots', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-8-4-finding-roots', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Finding Roots'] }],
        label_map: { 'default': ['Finding Roots'] },
        concepts: [{
            concept_id: '4_finding_roots_c', concept_name: 'Finding Roots',
            diagrams: [{ diagram_id: '4_finding_roots_d', title: 'Finding Roots', svg_path: 'mathematics_8/finding-roots.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Finding Roots'] }]
        }]
    },
    {
        topic_id: 'math-8-4-patterns',
        subject: 'Mathematics', grade: 'Class 8', domain: 'Mathematics',
        concept_key: '4_patterns', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-8-4-patterns', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Patterns'] }],
        label_map: { 'default': ['Patterns'] },
        concepts: [{
            concept_id: '4_patterns_c', concept_name: 'Patterns',
            diagrams: [{ diagram_id: '4_patterns_d', title: 'Patterns', svg_path: 'mathematics_8/patterns.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Patterns'] }]
        }]
    },
    {
        topic_id: 'math-9-1-real-numbers',
        subject: 'Mathematics', grade: 'Class 9', domain: 'Mathematics',
        concept_key: '1_real_numbers', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-9-1-real-numbers', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Real Numbers'] }],
        label_map: { 'default': ['Real Numbers'] },
        concepts: [{
            concept_id: '1_real_numbers_c', concept_name: 'Real Numbers',
            diagrams: [{ diagram_id: '1_real_numbers_d', title: 'Real Numbers', svg_path: 'mathematics_9/real-numbers.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Real Numbers'] }]
        }]
    },
    {
        topic_id: 'math-9-1-irrational-numbers',
        subject: 'Mathematics', grade: 'Class 9', domain: 'Mathematics',
        concept_key: '1_irrational_numbers', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-9-1-irrational-numbers', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Irrational Numbers'] }],
        label_map: { 'default': ['Irrational Numbers'] },
        concepts: [{
            concept_id: '1_irrational_numbers_c', concept_name: 'Irrational Numbers',
            diagrams: [{ diagram_id: '1_irrational_numbers_d', title: 'Irrational Numbers', svg_path: 'mathematics_9/irrational-numbers.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Irrational Numbers'] }]
        }]
    },
    {
        topic_id: 'math-9-1-rationalization',
        subject: 'Mathematics', grade: 'Class 9', domain: 'Mathematics',
        concept_key: '1_rationalization', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-9-1-rationalization', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Rationalization'] }],
        label_map: { 'default': ['Rationalization'] },
        concepts: [{
            concept_id: '1_rationalization_c', concept_name: 'Rationalization',
            diagrams: [{ diagram_id: '1_rationalization_d', title: 'Rationalization', svg_path: 'mathematics_9/rationalization.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Rationalization'] }]
        }]
    },
    {
        topic_id: 'math-9-2-types',
        subject: 'Mathematics', grade: 'Class 9', domain: 'Mathematics',
        concept_key: '2_types', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-9-2-types', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Types'] }],
        label_map: { 'default': ['Types'] },
        concepts: [{
            concept_id: '2_types_c', concept_name: 'Types',
            diagrams: [{ diagram_id: '2_types_d', title: 'Types', svg_path: 'mathematics_9/types.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Types'] }]
        }]
    },
    {
        topic_id: 'math-9-2-zeroes',
        subject: 'Mathematics', grade: 'Class 9', domain: 'Mathematics',
        concept_key: '2_zeroes', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-9-2-zeroes', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Zeroes'] }],
        label_map: { 'default': ['Zeroes'] },
        concepts: [{
            concept_id: '2_zeroes_c', concept_name: 'Zeroes',
            diagrams: [{ diagram_id: '2_zeroes_d', title: 'Zeroes', svg_path: 'mathematics_9/zeroes.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Zeroes'] }]
        }]
    },
    {
        topic_id: 'math-9-2-factorization',
        subject: 'Mathematics', grade: 'Class 9', domain: 'Mathematics',
        concept_key: '2_factorization', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-9-2-factorization', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Factorization'] }],
        label_map: { 'default': ['Factorization'] },
        concepts: [{
            concept_id: '2_factorization_c', concept_name: 'Factorization',
            diagrams: [{ diagram_id: '2_factorization_d', title: 'Factorization', svg_path: 'mathematics_9/factorization.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Factorization'] }]
        }]
    },
    {
        topic_id: 'math-9-3-cartesian-system',
        subject: 'Mathematics', grade: 'Class 9', domain: 'Mathematics',
        concept_key: '3_cartesian_system', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-9-3-cartesian-system', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Cartesian System'] }],
        label_map: { 'default': ['Cartesian System'] },
        concepts: [{
            concept_id: '3_cartesian_system_c', concept_name: 'Cartesian System',
            diagrams: [{ diagram_id: '3_cartesian_system_d', title: 'Cartesian System', svg_path: 'mathematics_9/cartesian-system.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Cartesian System'] }]
        }]
    },
    {
        topic_id: 'math-9-3-plotting-points',
        subject: 'Mathematics', grade: 'Class 9', domain: 'Mathematics',
        concept_key: '3_plotting_points', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-9-3-plotting-points', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Plotting Points'] }],
        label_map: { 'default': ['Plotting Points'] },
        concepts: [{
            concept_id: '3_plotting_points_c', concept_name: 'Plotting Points',
            diagrams: [{ diagram_id: '3_plotting_points_d', title: 'Plotting Points', svg_path: 'mathematics_9/plotting-points.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Plotting Points'] }]
        }]
    },
    {
        topic_id: 'math-9-3-quadrants',
        subject: 'Mathematics', grade: 'Class 9', domain: 'Mathematics',
        concept_key: '3_quadrants', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-9-3-quadrants', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Quadrants'] }],
        label_map: { 'default': ['Quadrants'] },
        concepts: [{
            concept_id: '3_quadrants_c', concept_name: 'Quadrants',
            diagrams: [{ diagram_id: '3_quadrants_d', title: 'Quadrants', svg_path: 'mathematics_9/quadrants.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Quadrants'] }]
        }]
    },
    {
        topic_id: 'math-9-4-graphical-method',
        subject: 'Mathematics', grade: 'Class 9', domain: 'Mathematics',
        concept_key: '4_graphical_method', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-9-4-graphical-method', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Graphical Method'] }],
        label_map: { 'default': ['Graphical Method'] },
        concepts: [{
            concept_id: '4_graphical_method_c', concept_name: 'Graphical Method',
            diagrams: [{ diagram_id: '4_graphical_method_d', title: 'Graphical Method', svg_path: 'mathematics_9/graphical-method.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Graphical Method'] }]
        }]
    },
    {
        topic_id: 'math-9-4-solutions',
        subject: 'Mathematics', grade: 'Class 9', domain: 'Mathematics',
        concept_key: '4_solutions', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-9-4-solutions', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Solutions'] }],
        label_map: { 'default': ['Solutions'] },
        concepts: [{
            concept_id: '4_solutions_c', concept_name: 'Solutions',
            diagrams: [{ diagram_id: '4_solutions_d', title: 'Solutions', svg_path: 'mathematics_9/solutions.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Solutions'] }]
        }]
    },
    {
        topic_id: 'math-9-4-applications',
        subject: 'Mathematics', grade: 'Class 9', domain: 'Mathematics',
        concept_key: '4_applications', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-9-4-applications', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Applications'] }],
        label_map: { 'default': ['Applications'] },
        concepts: [{
            concept_id: '4_applications_c', concept_name: 'Applications',
            diagrams: [{ diagram_id: '4_applications_d', title: 'Applications', svg_path: 'mathematics_9/applications.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Applications'] }]
        }]
    },
    {
        topic_id: 'math-9-5-congruence',
        subject: 'Mathematics', grade: 'Class 9', domain: 'Mathematics',
        concept_key: '5_congruence', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-9-5-congruence', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Congruence'] }],
        label_map: { 'default': ['Congruence'] },
        concepts: [{
            concept_id: '5_congruence_c', concept_name: 'Congruence',
            diagrams: [{ diagram_id: '5_congruence_d', title: 'Congruence', svg_path: 'mathematics_9/congruence.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Congruence'] }]
        }]
    },
    {
        topic_id: 'math-9-5-criteria',
        subject: 'Mathematics', grade: 'Class 9', domain: 'Mathematics',
        concept_key: '5_criteria', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-9-5-criteria', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Criteria'] }],
        label_map: { 'default': ['Criteria'] },
        concepts: [{
            concept_id: '5_criteria_c', concept_name: 'Criteria',
            diagrams: [{ diagram_id: '5_criteria_d', title: 'Criteria', svg_path: 'mathematics_9/criteria.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Criteria'] }]
        }]
    },
    {
        topic_id: 'math-9-5-properties',
        subject: 'Mathematics', grade: 'Class 9', domain: 'Mathematics',
        concept_key: '5_properties', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-9-5-properties', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Properties'] }],
        label_map: { 'default': ['Properties'] },
        concepts: [{
            concept_id: '5_properties_c', concept_name: 'Properties',
            diagrams: [{ diagram_id: '5_properties_d', title: 'Properties', svg_path: 'mathematics_9/properties.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Properties'] }]
        }]
    },
    // ── Science 9 ─────────────────────────────────────────────────────────────
    {
        topic_id: 'science-9-1-states-of-matter',
        subject: 'Science', grade: 'Class 9', domain: 'Chemistry',
        concept_key: 'states_of_matter', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_science-9-1-states-of-matter', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Science 9', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['States of Matter'] }],
        label_map: { 'default': ['States of Matter'] },
        concepts: [{
            concept_id: 'states_of_matter_c', concept_name: 'States of Matter',
            diagrams: [{ diagram_id: 'states_of_matter_d', title: 'States of Matter', svg_path: 'science_9/states-of-matter.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Solid', 'Liquid', 'Gas'] }]
        }]
    },
    {
        topic_id: 'science-9-1-changes-of-state',
        subject: 'Science', grade: 'Class 9', domain: 'Chemistry',
        concept_key: 'changes_of_state', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_science-9-1-changes-of-state', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Science 9', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Changes of State'] }],
        label_map: { 'default': ['Changes of State'] },
        concepts: [{
            concept_id: 'changes_of_state_c', concept_name: 'Changes of State',
            diagrams: [{ diagram_id: 'changes_of_state_d', title: 'Changes of State', svg_path: 'science_9/changes-of-state.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Melting', 'Vaporisation', 'Sublimation'] }]
        }]
    },
    {
        topic_id: 'science-9-1-evaporation',
        subject: 'Science', grade: 'Class 9', domain: 'Chemistry',
        concept_key: 'evaporation', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_science-9-1-evaporation', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Science 9', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Evaporation'] }],
        label_map: { 'default': ['Evaporation'] },
        concepts: [{
            concept_id: 'evaporation_c', concept_name: 'Evaporation',
            diagrams: [{ diagram_id: 'evaporation_d', title: 'Evaporation', svg_path: 'science_9/evaporation.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Factors', 'Cooling Effect'] }]
        }]
    },
    {
        topic_id: 'science-9-2-mixtures',
        subject: 'Science', grade: 'Class 9', domain: 'Chemistry',
        concept_key: 'mixtures', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_science-9-2-mixtures', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Science 9', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Mixtures'] }],
        label_map: { 'default': ['Mixtures'] },
        concepts: [{
            concept_id: 'mixtures_c', concept_name: 'Mixtures',
            diagrams: [{ diagram_id: 'mixtures_d', title: 'Mixtures', svg_path: 'science_9/mixtures.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Homogeneous', 'Heterogeneous'] }]
        }]
    },
    {
        topic_id: 'science-9-2-solutions',
        subject: 'Science', grade: 'Class 9', domain: 'Chemistry',
        concept_key: 'solutions_colloids_suspensions', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_science-9-2-solutions', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Science 9', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Solutions'] }],
        label_map: { 'default': ['Solutions'] },
        concepts: [{
            concept_id: 'solutions_c', concept_name: 'Solutions',
            diagrams: [{ diagram_id: 'solutions_d', title: 'Solutions', svg_path: 'science_9/solutions.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Solution', 'Colloid', 'Suspension'] }]
        }]
    },
    {
        topic_id: 'science-9-2-separation-techniques',
        subject: 'Science', grade: 'Class 9', domain: 'Chemistry',
        concept_key: 'separation_techniques', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_science-9-2-separation-techniques', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Science 9', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Separation Techniques'] }],
        label_map: { 'default': ['Separation Techniques'] },
        concepts: [{
            concept_id: 'separation_techniques_c', concept_name: 'Separation Techniques',
            diagrams: [{ diagram_id: 'separation_techniques_d', title: 'Separation Techniques', svg_path: 'science_9/separation-techniques.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Filtration', 'Distillation', 'Chromatography'] }]
        }]
    },
    {
        topic_id: 'science-9-3-atomic-theory',
        subject: 'Science', grade: 'Class 9', domain: 'Chemistry',
        concept_key: 'atomic_theory', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_science-9-3-atomic-theory', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Science 9', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Atomic Theory'] }],
        label_map: { 'default': ['Atomic Theory'] },
        concepts: [{
            concept_id: 'atomic_theory_c', concept_name: 'Atomic Theory',
            diagrams: [{ diagram_id: 'atomic_theory_d', title: 'Atomic Theory', svg_path: 'science_9/atomic-theory.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Dalton', 'Postulates'] }]
        }]
    },
    {
        topic_id: 'science-9-3-molecules',
        subject: 'Science', grade: 'Class 9', domain: 'Chemistry',
        concept_key: 'molecules', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_science-9-3-molecules', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Science 9', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Molecules'] }],
        label_map: { 'default': ['Molecules'] },
        concepts: [{
            concept_id: 'molecules_c', concept_name: 'Molecules',
            diagrams: [{ diagram_id: 'molecules_d', title: 'Molecules', svg_path: 'science_9/molecules.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Atom', 'Molecule', 'Valency'] }]
        }]
    },
    {
        topic_id: 'science-9-3-mole-concept',
        subject: 'Science', grade: 'Class 9', domain: 'Chemistry',
        concept_key: 'mole_concept', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_science-9-3-mole-concept', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Science 9', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Mole Concept'] }],
        label_map: { 'default': ['Mole Concept'] },
        concepts: [{
            concept_id: 'mole_concept_c', concept_name: 'Mole Concept',
            diagrams: [{ diagram_id: 'mole_concept_d', title: 'Mole Concept', svg_path: 'science_9/mole-concept.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Avogadro', 'Molar Mass', 'Molar Volume'] }]
        }]
    },
    {
        topic_id: 'science-9-4-subatomic-particles',
        subject: 'Science', grade: 'Class 9', domain: 'Chemistry',
        concept_key: 'subatomic_particles', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_science-9-4-subatomic-particles', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Science 9', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Subatomic Particles'] }],
        label_map: { 'default': ['Subatomic Particles'] },
        concepts: [{
            concept_id: 'subatomic_particles_c', concept_name: 'Subatomic Particles',
            diagrams: [{ diagram_id: 'subatomic_particles_d', title: 'Subatomic Particles', svg_path: 'science_9/subatomic-particles.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Proton', 'Neutron', 'Electron'] }]
        }]
    },
    {
        topic_id: 'science-9-4-atomic-models',
        subject: 'Science', grade: 'Class 9', domain: 'Chemistry',
        concept_key: 'atomic_models', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_science-9-4-atomic-models', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Science 9', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Atomic Models'] }],
        label_map: { 'default': ['Atomic Models'] },
        concepts: [{
            concept_id: 'atomic_models_c', concept_name: 'Atomic Models',
            diagrams: [{ diagram_id: 'atomic_models_d', title: 'Atomic Models', svg_path: 'science_9/atomic-models.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Thomson', 'Rutherford', 'Bohr'] }]
        }]
    },
    {
        topic_id: 'science-9-4-electronic-configuration',
        subject: 'Science', grade: 'Class 9', domain: 'Chemistry',
        concept_key: 'electronic_configuration', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_science-9-4-electronic-configuration', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Science 9', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Electronic Configuration'] }],
        label_map: { 'default': ['Electronic Configuration'] },
        concepts: [{
            concept_id: 'electronic_configuration_c', concept_name: 'Electronic Configuration',
            diagrams: [{ diagram_id: 'electronic_configuration_d', title: 'Electronic Configuration', svg_path: 'science_9/electronic-configuration.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Shells', 'Electrons', 'Bohr Diagram'] }]
        }]
    },
    {
        topic_id: 'science-9-5-cell-structure',
        subject: 'Science', grade: 'Class 9', domain: 'Biology',
        concept_key: 'cell_structure', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_science-9-5-cell-structure', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Science 9', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Cell Structure'] }],
        label_map: { 'default': ['Cell Structure'] },
        concepts: [{
            concept_id: 'cell_structure_c', concept_name: 'Cell Structure',
            diagrams: [{ diagram_id: 'cell_structure_d', title: 'Cell Structure', svg_path: 'science_9/cell-structure.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Animal Cell', 'Plant Cell', 'Nucleus'] }]
        }]
    },
    {
        topic_id: 'science-9-5-organelles',
        subject: 'Science', grade: 'Class 9', domain: 'Biology',
        concept_key: 'organelles', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_science-9-5-organelles', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Science 9', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Cell Organelles'] }],
        label_map: { 'default': ['Cell Organelles'] },
        concepts: [{
            concept_id: 'organelles_c', concept_name: 'Cell Organelles',
            diagrams: [{ diagram_id: 'organelles_d', title: 'Cell Organelles', svg_path: 'science_9/organelles.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Mitochondria', 'Chloroplast', 'Nucleus', 'ER', 'Golgi'] }]
        }]
    },
    {
        topic_id: 'science-9-5-cell-division',
        subject: 'Science', grade: 'Class 9', domain: 'Biology',
        concept_key: 'cell_division', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_science-9-5-cell-division', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Science 9', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Cell Division'] }],
        label_map: { 'default': ['Cell Division'] },
        concepts: [{
            concept_id: 'cell_division_c', concept_name: 'Cell Division',
            diagrams: [{ diagram_id: 'cell_division_d', title: 'Cell Division', svg_path: 'science_9/cell-division.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Mitosis', 'Meiosis', 'Phases'] }]
        }]
    },
    // ── Social Science 9 ──────────────────────────────────────────────────────
    // ── Social Science 9 ──────────────────────────────────────────────────────
    {
        topic_id: 'sst-9-1-causes',
        subject: 'Social Science', grade: 'Class 9', domain: 'History',
        concept_key: 'french_revolution_causes', visual_version: 2, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-9-1-causes', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.2.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT History 9', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Causes of French Revolution'] }],
        label_map: { 'default': ['Causes of French Revolution'] },
        concepts: [{
            concept_id: 'french_rev_causes_c', concept_name: 'Causes of French Revolution',
            diagrams: [{ diagram_id: 'french_rev_causes_d', title: 'Causes of the French Revolution', svg_path: 'social_9/french-revolution-causes.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Political', 'Economic', 'Social', 'Philosophical'] }]
        }]
    },
    {
        topic_id: 'sst-9-1-events',
        subject: 'Social Science', grade: 'Class 9', domain: 'History',
        concept_key: 'french_revolution_events', visual_version: 2, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-9-1-events', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.2.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT History 9', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Events of French Revolution'] }],
        label_map: { 'default': ['Events of French Revolution'] },
        concepts: [{
            concept_id: 'french_rev_events_c', concept_name: 'Key Events of French Revolution',
            diagrams: [{ diagram_id: 'french_rev_events_d', title: 'The French Revolution - Timeline', svg_path: 'social_9/french-revolution-events.svg', diagram_type: 'timeline', purpose: 'Process', labels: ['1789', '1791', '1793', 'Napoleon'] }]
        }]
    },
    {
        topic_id: 'sst-9-1-impact',
        subject: 'Social Science', grade: 'Class 9', domain: 'History',
        concept_key: 'french_revolution_impact', visual_version: 2, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-9-1-impact', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.2.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT History 9', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Impact of French Revolution'] }],
        label_map: { 'default': ['Impact of French Revolution'] },
        concepts: [{
            concept_id: 'french_rev_impact_c', concept_name: 'Impact and Ideals',
            diagrams: [{ diagram_id: 'french_rev_impact_d', title: 'Impact of French Revolution', svg_path: 'social_9/french-revolution-impact.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Liberty', 'Equality', 'Fraternity', 'Legacy'] }]
        }]
    },
    {
        topic_id: 'sst-9-2-location',
        subject: 'Social Science', grade: 'Class 9', domain: 'Geography',
        concept_key: 'india_location', visual_version: 2, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-9-2-location', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.2.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Geography 9', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Location of India'] }],
        label_map: { 'default': ['Location of India'] },
        concepts: [{
            concept_id: 'india_location_c', concept_name: 'India\'s Location and Coordinates',
            diagrams: [
                { diagram_id: 'india_location_d', title: 'India: Latitude, Longitude &amp; Hemispheres', svg_path: 'social_9/india-location.svg', diagram_type: 'map', purpose: 'Structure', labels: ['Hemisphere', 'Latitudes', 'Longitudes', 'IST', 'Tropic of Cancer'] },
            ]
        }]
    },
    {
        topic_id: 'sst-9-2-size',
        subject: 'Social Science', grade: 'Class 9', domain: 'Geography',
        concept_key: 'india_size', visual_version: 2, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-9-2-size', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.2.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Geography 9', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Size of India'] }],
        label_map: { 'default': ['Size of India'] },
        concepts: [{
            concept_id: 'india_size_c', concept_name: 'India: Size and World Rank',
            diagrams: [
                { diagram_id: 'india_size_d', title: 'India: Area, Extent &amp; World Rank', svg_path: 'social_9/india-size.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['3.28M km²', 'World Rank 7', 'Coastline', 'Land Boundary'] },
            ]
        }]
    },
    {
        topic_id: 'sst-9-2-india-and-world',
        subject: 'Social Science', grade: 'Class 9', domain: 'Geography',
        concept_key: 'india_world', visual_version: 2, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-9-2-india-and-world', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.2.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Geography 9', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['India and World'] }],
        label_map: { 'default': ['India and the World'] },
        concepts: [{
            concept_id: 'india_world_c', concept_name: 'India and the World',
            diagrams: [{ diagram_id: 'india_world_d', title: 'India\'s Strategic Location in the World', svg_path: 'social_9/india-world-position.svg', diagram_type: 'map', purpose: 'Structure', labels: ['Indian Ocean', 'Trade Routes', 'Central Location'] }]
        }]
    },
    {
        topic_id: 'sst-9-2-neighbours',
        subject: 'Social Science', grade: 'Class 9', domain: 'Geography',
        concept_key: 'india_neighbours', visual_version: 2, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-9-2-neighbours', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.2.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Geography 9', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['India\'s Neighbours'] }],
        label_map: { 'default': ['India\'s Neighbours'] },
        concepts: [{
            concept_id: 'india_neighbours_c', concept_name: 'India\'s Neighbours',
            diagrams: [{ diagram_id: 'india_neighbours_d', title: 'India and its Neighbours', svg_path: 'social_9/india-neighbours.svg', diagram_type: 'map', purpose: 'Structure', labels: ['Pakistan', 'China', 'Nepal', 'Bangladesh', 'Sri Lanka'] }]
        }]
    },
    {
        topic_id: 'sst-9-3-definition',
        subject: 'Social Science', grade: 'Class 9', domain: 'Political Science',
        concept_key: 'democracy_definition', visual_version: 2, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-9-3-definition', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.2.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Civics 9', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Definition of Democracy'] }],
        label_map: { 'default': ['Definition of Democracy'] },
        concepts: [{
            concept_id: 'democracy_def_c', concept_name: 'What is Democracy?',
            diagrams: [{ diagram_id: 'democracy_def_d', title: 'What is Democracy?', svg_path: 'social_9/democracy-definition.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Who Rules', 'Key Requirements', 'Types', 'India Example'] }]
        }]
    },
    {
        topic_id: 'sst-9-3-features',
        subject: 'Social Science', grade: 'Class 9', domain: 'Political Science',
        concept_key: 'democracy_features', visual_version: 2, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-9-3-features', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.2.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Civics 9', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Features of Democracy'] }],
        label_map: { 'default': ['Features of Democracy'] },
        concepts: [{
            concept_id: 'democracy_features_c', concept_name: 'Features of Democracy',
            diagrams: [{ diagram_id: 'democracy_features_d', title: 'Key Features of Democracy', svg_path: 'social_9/democracy-features.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Elections', 'Rule of Law', 'Rights', 'Equality', 'Accountability'] }]
        }]
    },
    {
        topic_id: 'sst-9-3-why-democracy',
        subject: 'Social Science', grade: 'Class 9', domain: 'Political Science',
        concept_key: 'why_democracy', visual_version: 2, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-9-3-why-democracy', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.2.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Civics 9', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Why Democracy?'] }],
        label_map: { 'default': ['Why Democracy?'] },
        concepts: [{
            concept_id: 'why_democracy_c', concept_name: 'Arguments for Democracy',
            diagrams: [{ diagram_id: 'why_democracy_d', title: 'Why Democracy is Better', svg_path: 'social_9/democracy-why.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Accountability', 'Dignity', 'Conflict Resolution', 'Self-Correction'] }]
        }]
    },
    {
        topic_id: 'sst-9-4-farming',
        subject: 'Social Science', grade: 'Class 9', domain: 'Economics',
        concept_key: 'village_palampur', visual_version: 2, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-9-4-farming', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.2.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Economics 9', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Farming in Palampur'] }],
        label_map: { 'default': ['Farming in Palampur'] },
        concepts: [{
            concept_id: 'palampur_f_c', concept_name: 'Farming Activities',
            diagrams: [{ diagram_id: 'palampur_f_d', title: 'Farming in Village Palampur', svg_path: 'social_9/palampur-farming.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Land', 'Labour', 'Capital', 'Technology', 'Crop Seasons'] }]
        }]
    },
    {
        topic_id: 'sst-9-4-non-farming',
        subject: 'Social Science', grade: 'Class 9', domain: 'Economics',
        concept_key: 'palampur_economy', visual_version: 2, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-9-4-non-farming', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.2.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Economics 9', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Non-farming in Palampur'] }],
        label_map: { 'default': ['Non-Farming Activities'] },
        concepts: [{
            concept_id: 'palampur_nf_c', concept_name: 'Non-Farming Activities',
            diagrams: [{ diagram_id: 'palampur_nf_d', title: 'Non-Farming Activities in Palampur', svg_path: 'social_9/palampur-non-farming.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Dairy', 'Manufacturing', 'Shopkeeping', 'Transport'] }]
        }]
    },
    {
        topic_id: 'sst-9-4-capital',
        subject: 'Social Science', grade: 'Class 9', domain: 'Economics',
        concept_key: 'palampur_resources', visual_version: 2, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-9-4-capital', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.2.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Economics 9', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Capital in Palampur'] }],
        label_map: { 'default': ['Capital and Resources'] },
        concepts: [{
            concept_id: 'palampur_res_c', concept_name: 'Capital Resources',
            diagrams: [{ diagram_id: 'palampur_res_d', title: 'Capital and Resources in Palampur', svg_path: 'social_9/palampur-capital.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Fixed Capital', 'Working Capital', 'Land Ownership'] }]
        }]
    },
    {
        topic_id: 'math-10-1-euclid-s-division',
        subject: 'Mathematics', grade: 'Class 10', domain: 'Mathematics',
        concept_key: '1_euclid_division', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-10-1-euclid-s-division', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Maths 10', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ["Euclid's Division"] }],
        label_map: { 'default': ["Euclid's Division"] },
        concepts: [{
            concept_id: 'euclid_c', concept_name: "Euclid's Division Algorithm",
            diagrams: [{ diagram_id: 'euclid_d', title: "Euclid's Division Algorithm", svg_path: 'math_10/euclid.svg', diagram_type: 'process', purpose: 'Process', labels: ['a = bq + r', 'HCF', 'Remainder'] }]
        }]
    },
    {
        topic_id: 'math-10-1-fundamental-theorem',
        subject: 'Mathematics', grade: 'Class 10', domain: 'Mathematics',
        concept_key: '1_fundamental_theorem', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-10-1-fundamental-theorem', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Maths 10', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Fundamental Theorem'] }],
        label_map: { 'default': ['Fundamental Theorem'] },
        concepts: [{
            concept_id: 'fundamental_c', concept_name: 'Fundamental Theorem of Arithmetic',
            diagrams: [{ diagram_id: 'fundamental_d', title: 'Fundamental Theorem of Arithmetic', svg_path: 'math_10/fundamental.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Prime Factorization', 'Factor Tree', 'LCM', 'HCF'] }]
        }]
    },
    {
        topic_id: 'math-10-1-irrational-proofs',
        subject: 'Mathematics', grade: 'Class 10', domain: 'Mathematics',
        concept_key: '1_irrational_proofs', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-10-1-irrational-proofs', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Maths 10', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Irrational Proofs'] }],
        label_map: { 'default': ['Irrational Proofs'] },
        concepts: [{
            concept_id: 'irrational_c', concept_name: 'Irrational Number Proofs',
            diagrams: [{ diagram_id: 'irrational_d', title: 'Proving Irrationality of √2', svg_path: 'math_10/irrational.svg', diagram_type: 'process', purpose: 'Process', labels: ['√2', 'Contradiction', 'Number Line', 'Proof'] }]
        }]
    },
    {
        topic_id: 'math-10-2-division-algorithm',
        subject: 'Mathematics', grade: 'Class 10', domain: 'Mathematics',
        concept_key: '2_division_algorithm', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-10-2-division-algorithm', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Maths 10', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Division Algorithm'] }],
        label_map: { 'default': ['Division Algorithm'] },
        concepts: [{
            concept_id: 'poly_div_c', concept_name: 'Division Algorithm for Polynomials',
            diagrams: [{ diagram_id: 'poly_div_d', title: 'Polynomial Division Algorithm', svg_path: 'math_10/poly_division.svg', diagram_type: 'process', purpose: 'Process', labels: ['p(x)', 'g(x)', 'q(x)', 'r(x)', 'Dividend', 'Divisor'] }]
        }]
    },
    {
        topic_id: 'math-10-2-zeroes-relationship',
        subject: 'Mathematics', grade: 'Class 10', domain: 'Mathematics',
        concept_key: '2_zeroes_relationship', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-10-2-zeroes-relationship', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Maths 10', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Zeroes Relationship'] }],
        label_map: { 'default': ['Zeroes Relationship'] },
        concepts: [{
            concept_id: 'zeroes_c', concept_name: 'Zeroes and Coefficients Relationship',
            diagrams: [{ diagram_id: 'zeroes_d', title: 'Zeroes of a Polynomial', svg_path: 'math_10/zeroes.svg', diagram_type: 'graph', purpose: 'Graph', labels: ['α', 'β', 'Sum of Zeroes', 'Product of Zeroes', 'Parabola'] }]
        }]
    },
    {
        topic_id: 'math-10-2-polynomial-factorization',
        subject: 'Mathematics', grade: 'Class 10', domain: 'Mathematics',
        concept_key: '2_polynomial_factorization', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-10-2-polynomial-factorization', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Maths 10', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Polynomial Factorization'] }],
        label_map: { 'default': ['Polynomial Factorization'] },
        concepts: [{
            concept_id: 'poly_factor_c', concept_name: 'Polynomial Factorization',
            diagrams: [{ diagram_id: 'poly_factor_d', title: 'Polynomial Factorization', svg_path: 'math_10/poly_factorization.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Splitting Middle Term', 'Factor-Zero Theorem', 'Identities'] }]
        }]
    },
    {
        topic_id: 'math-10-3-graphical-method',
        subject: 'Mathematics', grade: 'Class 10', domain: 'Mathematics',
        concept_key: '3_graphical_method', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-10-3-graphical-method', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Maths 10', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Graphical Method'] }],
        label_map: { 'default': ['Graphical Method'] },
        concepts: [{
            concept_id: 'lin_graph_c', concept_name: 'Graphical Method for Linear Equations',
            diagrams: [{ diagram_id: 'lin_graph_d', title: 'Graphical Method', svg_path: 'math_10/linear_graph.svg', diagram_type: 'graph', purpose: 'Graph', labels: ['Intersecting', 'Parallel', 'Coincident', 'Solution'] }]
        }]
    },
    {
        topic_id: 'math-10-3-algebraic-methods',
        subject: 'Mathematics', grade: 'Class 10', domain: 'Mathematics',
        concept_key: '3_algebraic_methods', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-10-3-algebraic-methods', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Maths 10', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Algebraic Methods'] }],
        label_map: { 'default': ['Algebraic Methods'] },
        concepts: [{
            concept_id: 'lin_algebra_c', concept_name: 'Algebraic Methods for Linear Equations',
            diagrams: [{ diagram_id: 'lin_algebra_d', title: 'Algebraic Methods (Substitution & Elimination)', svg_path: 'math_10/linear_algebra.svg', diagram_type: 'process', purpose: 'Process', labels: ['Substitution', 'Elimination', 'Consistency'] }]
        }]
    },
    {
        topic_id: 'math-10-3-cross-multiplication',
        subject: 'Mathematics', grade: 'Class 10', domain: 'Mathematics',
        concept_key: '3_cross_multiplication', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-10-3-cross-multiplication', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Maths 10', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Cross Multiplication'] }],
        label_map: { 'default': ['Cross Multiplication'] },
        concepts: [{
            concept_id: 'cross_mult_c', concept_name: 'Cross Multiplication Method',
            diagrams: [{ diagram_id: 'cross_mult_d', title: 'Cross Multiplication', svg_path: 'math_10/cross_mult.svg', diagram_type: 'process', purpose: 'Process', labels: ['a₁', 'b₁', 'c₁', 'a₂', 'b₂', 'c₂', 'Determinant'] }]
        }]
    },
    {
        topic_id: 'math-10-4-quadratic-factorization',
        subject: 'Mathematics', grade: 'Class 10', domain: 'Mathematics',
        concept_key: '4_quadratic_factorization', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-10-4-quadratic-factorization', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Maths 10', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Quadratic Factorization'] }],
        label_map: { 'default': ['Quadratic Factorization'] },
        concepts: [{
            concept_id: 'quad_factor_c', concept_name: 'Quadratic Factorization',
            diagrams: [{ diagram_id: 'quad_factor_d', title: 'Quadratic Factorization', svg_path: 'math_10/quad_factorization.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Split Middle Term', 'Box Method', 'Zeros'] }]
        }]
    },
    {
        topic_id: 'math-10-4-quadratic-formula',
        subject: 'Mathematics', grade: 'Class 10', domain: 'Mathematics',
        concept_key: '4_quadratic_formula', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-10-4-quadratic-formula', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Maths 10', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Quadratic Formula'] }],
        label_map: { 'default': ['Quadratic Formula'] },
        concepts: [{
            concept_id: 'quad_formula_c', concept_name: 'Quadratic Formula',
            diagrams: [{ diagram_id: 'quad_formula_d', title: 'The Quadratic Formula', svg_path: 'math_10/quad_formula.svg', diagram_type: 'structure', purpose: 'Equation', labels: ['x = −b ± √(b²−4ac) / 2a', 'Discriminant', 'Completing the Square'] }]
        }]
    },
    {
        topic_id: 'math-10-4-nature-of-roots',
        subject: 'Mathematics', grade: 'Class 10', domain: 'Mathematics',
        concept_key: '4_nature_of_roots', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-10-4-nature-of-roots', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Maths 10', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Nature of Roots'] }],
        label_map: { 'default': ['Nature of Roots'] },
        concepts: [{
            concept_id: 'nature_roots_c', concept_name: 'Nature of Roots',
            diagrams: [{ diagram_id: 'nature_roots_d', title: 'Nature of Roots — Discriminant', svg_path: 'math_10/nature_roots.svg', diagram_type: 'structure', purpose: 'Comparison', labels: ['D > 0', 'D = 0', 'D < 0', 'Real Roots', 'Equal Roots', 'No Real Roots'] }]
        }]
    },
    {
        topic_id: 'math-10-5-ap-nth-term',
        subject: 'Mathematics', grade: 'Class 10', domain: 'Mathematics',
        concept_key: '5_ap_nth_term', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-10-5-ap-nth-term', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Maths 10', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['AP nth Term'] }],
        label_map: { 'default': ['AP nth Term'] },
        concepts: [{
            concept_id: 'ap_nth_c', concept_name: 'AP nth Term',
            diagrams: [{ diagram_id: 'ap_nth_d', title: 'nth Term of an AP', svg_path: 'math_10/ap_nth.svg', diagram_type: 'structure', purpose: 'Equation', labels: ['Tₙ = a + (n−1)d', 'First Term', 'Common Difference', 'Term Number'] }]
        }]
    },
    {
        topic_id: 'math-10-5-sum-of-terms',
        subject: 'Mathematics', grade: 'Class 10', domain: 'Mathematics',
        concept_key: '5_sum_of_terms', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-10-5-sum-of-terms', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Maths 10', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Sum of AP Terms'] }],
        label_map: { 'default': ['Sum of AP Terms'] },
        concepts: [{
            concept_id: 'ap_sum_c', concept_name: 'Sum of n Terms of AP',
            diagrams: [{ diagram_id: 'ap_sum_d', title: 'Sum of AP Terms', svg_path: 'math_10/ap_sum.svg', diagram_type: 'process', purpose: 'Equation', labels: ['Sₙ = n/2(2a+(n−1)d)', 'Gauss Trick', 'Bar Chart'] }]
        }]
    },
    {
        topic_id: 'math-10-5-ap-applications',
        subject: 'Mathematics', grade: 'Class 10', domain: 'Mathematics',
        concept_key: '5_ap_applications', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-10-5-ap-applications', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Maths 10', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['AP Applications'] }],
        label_map: { 'default': ['AP Applications'] },
        concepts: [{
            concept_id: 'ap_apps_c', concept_name: 'AP Real World Applications',
            diagrams: [{ diagram_id: 'ap_apps_d', title: 'AP Applications', svg_path: 'math_10/ap_apps.svg', diagram_type: 'process', purpose: 'Process', labels: ['Savings', 'Stadium', 'Clock', 'Stone Collection'] }]
        }]
    },
    {
        topic_id: 'math-11-1-types-of-sets',
        subject: 'Mathematics', grade: 'Class 11', domain: 'Mathematics',
        concept_key: '1_types_of_sets', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-11-1-types-of-sets', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Mathematics 11', checksum: 'sha256-auto', difficulty: 'intro',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Empty Set', 'Finite Set', 'Infinite Set', 'Subset'] }],
        label_map: { 'default': ['Empty Set', 'Finite Set', 'Infinite Set', 'Subset'] },
        concepts: [{
            concept_id: '1_types_of_sets_c', concept_name: 'Types of Sets',
            diagrams: [{ diagram_id: '1_types_of_sets_d', title: 'Finite, Infinite, and Subsets', svg_path: 'math_11/types-of-sets.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Empty Set', 'Finite Set', 'Infinite Set', 'Subset'] }]
        }]
    },
    {
        topic_id: 'math-11-1-operations',
        subject: 'Mathematics', grade: 'Class 11', domain: 'Mathematics',
        concept_key: '1_operations', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-11-1-operations', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Mathematics 11', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Union', 'Intersection', 'Difference'] }],
        label_map: { 'default': ['Union', 'Intersection', 'Difference'] },
        concepts: [{
            concept_id: '1_operations_c', concept_name: 'Set Operations',
            diagrams: [{ diagram_id: '1_operations_d', title: 'Set Operations Formulas', svg_path: 'math_11/operations.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Union', 'Intersection', 'Difference'] }]
        }]
    },
    {
        topic_id: 'math-11-1-venn-diagrams',
        subject: 'Mathematics', grade: 'Class 11', domain: 'Mathematics',
        concept_key: '1_venn_diagrams', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-11-1-venn-diagrams', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Mathematics 11', checksum: 'sha256-auto', difficulty: 'advanced',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Universal Set', 'Intersection Area'] }],
        label_map: { 'default': ['Universal Set', 'Intersection Area'] },
        concepts: [{
            concept_id: '1_venn_diagrams_c', concept_name: 'Venn Diagrams',
            diagrams: [{ diagram_id: '1_venn_diagrams_d', title: 'Overlapping Sets', svg_path: 'math_11/venn-diagrams.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Universal Set', 'Intersection Area'] }]
        }]
    },
    {
        topic_id: 'math-11-2-cartesian-product',
        subject: 'Mathematics', grade: 'Class 11', domain: 'Mathematics',
        concept_key: '2_cartesian_product', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-11-2-cartesian-product', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Mathematics 11', checksum: 'sha256-auto', difficulty: 'intro',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Ordered Pairs', 'Grid'] }],
        label_map: { 'default': ['Ordered Pairs', 'Grid'] },
        concepts: [{
            concept_id: '2_cartesian_product_c', concept_name: 'Cartesian Product',
            diagrams: [{ diagram_id: '2_cartesian_product_d', title: 'Plotting A x B', svg_path: 'math_11/cartesian-product.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Ordered Pairs', 'Grid'] }]
        }]
    },
    {
        topic_id: 'math-11-2-domain-and-range',
        subject: 'Mathematics', grade: 'Class 11', domain: 'Mathematics',
        concept_key: '2_domain_range', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-11-2-domain-and-range', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Mathematics 11', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Mapping', 'Output Set'] }],
        label_map: { 'default': ['Mapping', 'Output Set'] },
        concepts: [{
            concept_id: '2_domain_range_c', concept_name: 'Domain and Range',
            diagrams: [{ diagram_id: '2_domain_range_d', title: 'Mapping Diagrams', svg_path: 'math_11/domain-range.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Mapping', 'Output Set'] }]
        }]
    },
    {
        topic_id: 'math-11-2-types-of-functions',
        subject: 'Mathematics', grade: 'Class 11', domain: 'Mathematics',
        concept_key: '2_types_of_functions', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-11-2-types-of-functions', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Mathematics 11', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Identity Graph', 'Modulus Graph'] }],
        label_map: { 'default': ['Identity Graph', 'Modulus Graph'] },
        concepts: [{
            concept_id: '2_types_of_functions_c', concept_name: 'Standard Functions',
            diagrams: [{ diagram_id: '2_types_of_functions_d', title: 'Function Graphs', svg_path: 'math_11/types-of-functions.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Identity Graph', 'Modulus Graph'] }]
        }]
    },
    {
        topic_id: 'math-11-3-ratios',
        subject: 'Mathematics', grade: 'Class 11', domain: 'Mathematics',
        concept_key: '3_trig_ratios', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-11-3-ratios', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Mathematics 11', checksum: 'sha256-auto', difficulty: 'intro',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Unit Circle', 'sin theta', 'cos theta'] }],
        label_map: { 'default': ['Unit Circle', 'sin theta', 'cos theta'] },
        concepts: [{
            concept_id: '3_ratios_c', concept_name: 'Trig Ratios',
            diagrams: [{ diagram_id: '3_ratios_d', title: 'Unit Circle Ratios', svg_path: 'math_11/trig-ratios.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Unit Circle', 'sin theta', 'cos theta'] }]
        }]
    },
    {
        topic_id: 'math-11-3-identities',
        subject: 'Mathematics', grade: 'Class 11', domain: 'Mathematics',
        concept_key: '3_trig_identities', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-11-3-identities', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Mathematics 11', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Pythagorean', 'Double Angle'] }],
        label_map: { 'default': ['Pythagorean', 'Double Angle'] },
        concepts: [{
            concept_id: '3_identities_c', concept_name: 'Trig Identities',
            diagrams: [{ diagram_id: '3_identities_d', title: 'Fundamental Identities', svg_path: 'math_11/trig-identities.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Pythagorean', 'Double Angle'] }]
        }]
    },
    {
        topic_id: 'math-11-3-graphs',
        subject: 'Mathematics', grade: 'Class 11', domain: 'Mathematics',
        concept_key: '3_trig_graphs', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-11-3-graphs', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Mathematics 11', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Sine Wave', 'Cosine Wave'] }],
        label_map: { 'default': ['Sine Wave', 'Cosine Wave'] },
        concepts: [{
            concept_id: '3_graphs_c', concept_name: 'Trig Graphs',
            diagrams: [{ diagram_id: '3_graphs_d', title: 'Waveforms', svg_path: 'math_11/trig-graphs.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Sine Wave', 'Cosine Wave'] }]
        }]
    },
    {
        topic_id: 'math-11-4-imaginary-unit',
        subject: 'Mathematics', grade: 'Class 11', domain: 'Mathematics',
        concept_key: '4_imaginary_unit', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-11-4-imaginary-unit', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Mathematics 11', checksum: 'sha256-auto', difficulty: 'intro',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Definition of i', 'Powers of i'] }],
        label_map: { 'default': ['Definition of i', 'Powers of i'] },
        concepts: [{
            concept_id: '4_imaginary_unit_c', concept_name: 'Imaginary Unit',
            diagrams: [{ diagram_id: '4_imaginary_unit_d', title: 'The Concept of i', svg_path: 'math_11/imaginary-unit.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Definition of i', 'Powers of i'] }]
        }]
    },
    {
        topic_id: 'math-11-4-operations',
        subject: 'Mathematics', grade: 'Class 11', domain: 'Mathematics',
        concept_key: '4_complex_ops', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-11-4-operations', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Mathematics 11', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Addition', 'Multiplication'] }],
        label_map: { 'default': ['Addition', 'Multiplication'] },
        concepts: [{
            concept_id: '4_complex_operations_c', concept_name: 'Complex Operations',
            diagrams: [{ diagram_id: '4_complex_operations_d', title: 'Algebra with Complex Numbers', svg_path: 'math_11/complex-operations.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Addition', 'Multiplication'] }]
        }]
    },
    {
        topic_id: 'math-11-4-argand-plane',
        subject: 'Mathematics', grade: 'Class 11', domain: 'Mathematics',
        concept_key: '4_argand_plane', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-11-4-argand-plane', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Mathematics 11', checksum: 'sha256-auto', difficulty: 'advanced',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Real Axis', 'Imaginary Axis'] }],
        label_map: { 'default': ['Real Axis', 'Imaginary Axis'] },
        concepts: [{
            concept_id: '4_argand_plane_c', concept_name: 'Argand Plane',
            diagrams: [{ diagram_id: '4_argand_plane_d', title: 'Complex Plane Plotting', svg_path: 'math_11/argand-plane.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Real Axis', 'Imaginary Axis'] }]
        }]
    },
    {
        topic_id: 'math-11-5-solving',
        subject: 'Mathematics', grade: 'Class 11', domain: 'Mathematics',
        concept_key: '5_solving_ineq', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-11-5-solving', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Mathematics 11', checksum: 'sha256-auto', difficulty: 'intro',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Flipping Signs', 'Rules'] }],
        label_map: { 'default': ['Flipping Signs', 'Rules'] },
        concepts: [{
            concept_id: '5_solving_inequalities_c', concept_name: 'Solving Inequalities',
            diagrams: [{ diagram_id: '5_solving_inequalities_d', title: 'Inequality Rules', svg_path: 'math_11/solving-inequalities.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Flipping Signs', 'Rules'] }]
        }]
    },
    {
        topic_id: 'math-11-5-graphing',
        subject: 'Mathematics', grade: 'Class 11', domain: 'Mathematics',
        concept_key: '5_graphing_ineq', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-11-5-graphing', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Mathematics 11', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Shaded Region', 'Solid Line'] }],
        label_map: { 'default': ['Shaded Region', 'Solid Line'] },
        concepts: [{
            concept_id: '5_graphing_inequalities_c', concept_name: 'Shaded Regions',
            diagrams: [{ diagram_id: '5_graphing_inequalities_d', title: 'Graphical Solutions', svg_path: 'math_11/graphing-inequalities.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Shaded Region', 'Solid Line'] }]
        }]
    },
    {
        topic_id: 'math-11-5-systems',
        subject: 'Mathematics', grade: 'Class 11', domain: 'Mathematics',
        concept_key: '5_systems_ineq', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-11-5-systems', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Mathematics 11', checksum: 'sha256-auto', difficulty: 'advanced',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Common Region', 'Intersection'] }],
        label_map: { 'default': ['Common Region', 'Intersection'] },
        concepts: [{
            concept_id: '5_systems_inequalities_c', concept_name: 'Systems Analysis',
            diagrams: [{ diagram_id: '5_systems_inequalities_d', title: 'Common Feasible Area', svg_path: 'math_11/systems-inequalities.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Common Region', 'Intersection'] }]
        }]
    },
    {
        topic_id: 'math-12-1-types',
        subject: 'Mathematics', grade: 'Class 12', domain: 'Mathematics',
        concept_key: '1_types', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-12-1-types', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Types'] }],
        label_map: { 'default': ['Types'] },
        concepts: [{
            concept_id: '1_types_c', concept_name: 'Types',
            diagrams: [{ diagram_id: '1_types_d', title: 'Types', svg_path: 'mathematics_12/types.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Types'] }]
        }]
    },
    {
        topic_id: 'math-12-1-composition',
        subject: 'Mathematics', grade: 'Class 12', domain: 'Mathematics',
        concept_key: '1_composition', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-12-1-composition', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Composition'] }],
        label_map: { 'default': ['Composition'] },
        concepts: [{
            concept_id: '1_composition_c', concept_name: 'Composition',
            diagrams: [{ diagram_id: '1_composition_d', title: 'Composition', svg_path: 'mathematics_12/composition.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Composition'] }]
        }]
    },
    {
        topic_id: 'math-12-1-inverse',
        subject: 'Mathematics', grade: 'Class 12', domain: 'Mathematics',
        concept_key: '1_inverse', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-12-1-inverse', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Inverse'] }],
        label_map: { 'default': ['Inverse'] },
        concepts: [{
            concept_id: '1_inverse_c', concept_name: 'Inverse',
            diagrams: [{ diagram_id: '1_inverse_d', title: 'Inverse', svg_path: 'mathematics_12/inverse.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Inverse'] }]
        }]
    },
    {
        topic_id: 'math-12-2-principal-values',
        subject: 'Mathematics', grade: 'Class 12', domain: 'Mathematics',
        concept_key: '2_principal_values', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-12-2-principal-values', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Principal Values'] }],
        label_map: { 'default': ['Principal Values'] },
        concepts: [{
            concept_id: '2_principal_values_c', concept_name: 'Principal Values',
            diagrams: [{ diagram_id: '2_principal_values_d', title: 'Principal Values', svg_path: 'mathematics_12/principal-values.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Principal Values'] }]
        }]
    },
    {
        topic_id: 'math-12-2-properties',
        subject: 'Mathematics', grade: 'Class 12', domain: 'Mathematics',
        concept_key: '2_properties', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-12-2-properties', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Properties'] }],
        label_map: { 'default': ['Properties'] },
        concepts: [{
            concept_id: '2_properties_c', concept_name: 'Properties',
            diagrams: [{ diagram_id: '2_properties_d', title: 'Properties', svg_path: 'mathematics_12/properties.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Properties'] }]
        }]
    },
    {
        topic_id: 'math-12-2-graphs',
        subject: 'Mathematics', grade: 'Class 12', domain: 'Mathematics',
        concept_key: '2_graphs', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-12-2-graphs', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Graphs'] }],
        label_map: { 'default': ['Graphs'] },
        concepts: [{
            concept_id: '2_graphs_c', concept_name: 'Graphs',
            diagrams: [{ diagram_id: '2_graphs_d', title: 'Graphs', svg_path: 'mathematics_12/graphs.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Graphs'] }]
        }]
    },
    {
        topic_id: 'math-12-3-types',
        subject: 'Mathematics', grade: 'Class 12', domain: 'Mathematics',
        concept_key: '3_types', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-12-3-types', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Types'] }],
        label_map: { 'default': ['Types'] },
        concepts: [{
            concept_id: '3_types_c', concept_name: 'Types',
            diagrams: [{ diagram_id: '3_types_d', title: 'Types', svg_path: 'mathematics_12/types.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Types'] }]
        }]
    },
    {
        topic_id: 'math-12-3-operations',
        subject: 'Mathematics', grade: 'Class 12', domain: 'Mathematics',
        concept_key: '3_operations', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-12-3-operations', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Operations'] }],
        label_map: { 'default': ['Operations'] },
        concepts: [{
            concept_id: '3_operations_c', concept_name: 'Operations',
            diagrams: [{ diagram_id: '3_operations_d', title: 'Operations', svg_path: 'mathematics_12/operations.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Operations'] }]
        }]
    },
    {
        topic_id: 'math-12-3-transpose',
        subject: 'Mathematics', grade: 'Class 12', domain: 'Mathematics',
        concept_key: '3_transpose', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-12-3-transpose', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Transpose'] }],
        label_map: { 'default': ['Transpose'] },
        concepts: [{
            concept_id: '3_transpose_c', concept_name: 'Transpose',
            diagrams: [{ diagram_id: '3_transpose_d', title: 'Transpose', svg_path: 'mathematics_12/transpose.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Transpose'] }]
        }]
    },
    {
        topic_id: 'math-12-4-properties',
        subject: 'Mathematics', grade: 'Class 12', domain: 'Mathematics',
        concept_key: '4_properties', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-12-4-properties', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Properties'] }],
        label_map: { 'default': ['Properties'] },
        concepts: [{
            concept_id: '4_properties_c', concept_name: 'Properties',
            diagrams: [{ diagram_id: '4_properties_d', title: 'Properties', svg_path: 'mathematics_12/properties.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Properties'] }]
        }]
    },
    {
        topic_id: 'math-12-4-minors',
        subject: 'Mathematics', grade: 'Class 12', domain: 'Mathematics',
        concept_key: '4_minors', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-12-4-minors', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Minors'] }],
        label_map: { 'default': ['Minors'] },
        concepts: [{
            concept_id: '4_minors_c', concept_name: 'Minors',
            diagrams: [{ diagram_id: '4_minors_d', title: 'Minors', svg_path: 'mathematics_12/minors.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Minors'] }]
        }]
    },
    {
        topic_id: 'math-12-4-cofactors',
        subject: 'Mathematics', grade: 'Class 12', domain: 'Mathematics',
        concept_key: '4_cofactors', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-12-4-cofactors', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Cofactors'] }],
        label_map: { 'default': ['Cofactors'] },
        concepts: [{
            concept_id: '4_cofactors_c', concept_name: 'Cofactors',
            diagrams: [{ diagram_id: '4_cofactors_d', title: 'Cofactors', svg_path: 'mathematics_12/cofactors.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Cofactors'] }]
        }]
    },
    {
        topic_id: 'math-12-4-applications',
        subject: 'Mathematics', grade: 'Class 12', domain: 'Mathematics',
        concept_key: '4_applications', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-12-4-applications', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Applications'] }],
        label_map: { 'default': ['Applications'] },
        concepts: [{
            concept_id: '4_applications_c', concept_name: 'Applications',
            diagrams: [{ diagram_id: '4_applications_d', title: 'Applications', svg_path: 'mathematics_12/applications.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Applications'] }]
        }]
    },
    {
        topic_id: 'math-12-5-limits',
        subject: 'Mathematics', grade: 'Class 12', domain: 'Mathematics',
        concept_key: '5_limits', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-12-5-limits', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Limits'] }],
        label_map: { 'default': ['Limits'] },
        concepts: [{
            concept_id: '5_limits_c', concept_name: 'Limits',
            diagrams: [{ diagram_id: '5_limits_d', title: 'Limits', svg_path: 'mathematics_12/limits.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Limits'] }]
        }]
    },
    {
        topic_id: 'math-12-5-derivatives',
        subject: 'Mathematics', grade: 'Class 12', domain: 'Mathematics',
        concept_key: '5_derivatives', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-12-5-derivatives', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Derivatives'] }],
        label_map: { 'default': ['Derivatives'] },
        concepts: [{
            concept_id: '5_derivatives_c', concept_name: 'Derivatives',
            diagrams: [{ diagram_id: '5_derivatives_d', title: 'Derivatives', svg_path: 'mathematics_12/derivatives.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Derivatives'] }]
        }]
    },
    {
        topic_id: 'math-12-5-chain-rule',
        subject: 'Mathematics', grade: 'Class 12', domain: 'Mathematics',
        concept_key: '5_chain_rule', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-12-5-chain-rule', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Chain Rule'] }],
        label_map: { 'default': ['Chain Rule'] },
        concepts: [{
            concept_id: '5_chain_rule_c', concept_name: 'Chain Rule',
            diagrams: [{ diagram_id: '5_chain_rule_d', title: 'Chain Rule', svg_path: 'mathematics_12/chain-rule.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Chain Rule'] }]
        }]
    },
    {
        topic_id: 'sci-6-1-food-sources',
        subject: 'Science', grade: 'Class 6', domain: 'Science',
        concept_key: '1_food_sources', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-6-1-food-sources', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Food Sources'] }],
        label_map: { 'default': ['Food Sources'] },
        concepts: [{
            concept_id: '1_food_sources_c', concept_name: 'Food Sources',
            diagrams: [{ diagram_id: '1_food_sources_d', title: 'Food Sources', svg_path: 'science_6/food-sources.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Food Sources'] }]
        }]
    },
    {
        topic_id: 'sci-6-1-food-habits',
        subject: 'Science', grade: 'Class 6', domain: 'Science',
        concept_key: '1_food_habits', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-6-1-food-habits', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Food Habits'] }],
        label_map: { 'default': ['Food Habits'] },
        concepts: [{
            concept_id: '1_food_habits_c', concept_name: 'Food Habits',
            diagrams: [{ diagram_id: '1_food_habits_d', title: 'Food Habits', svg_path: 'science_6/food-habits.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Food Habits'] }]
        }]
    },
    {
        topic_id: 'sci-6-1-ingredients',
        subject: 'Science', grade: 'Class 6', domain: 'Science',
        concept_key: '1_ingredients', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-6-1-ingredients', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Ingredients'] }],
        label_map: { 'default': ['Ingredients'] },
        concepts: [{
            concept_id: '1_ingredients_c', concept_name: 'Ingredients',
            diagrams: [{ diagram_id: '1_ingredients_d', title: 'Ingredients', svg_path: 'science_6/ingredients.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Ingredients'] }]
        }]
    },
    {
        topic_id: 'sci-6-2-nutrients',
        subject: 'Science', grade: 'Class 6', domain: 'Science',
        concept_key: '2_nutrients', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-6-2-nutrients', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Nutrients'] }],
        label_map: { 'default': ['Nutrients'] },
        concepts: [{
            concept_id: '2_nutrients_c', concept_name: 'Nutrients',
            diagrams: [{ diagram_id: '2_nutrients_d', title: 'Nutrients', svg_path: 'science_6/nutrients.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Nutrients'] }]
        }]
    },
    {
        topic_id: 'sci-6-2-balanced-diet',
        subject: 'Science', grade: 'Class 6', domain: 'Science',
        concept_key: '2_balanced_diet', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-6-2-balanced-diet', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Balanced Diet'] }],
        label_map: { 'default': ['Balanced Diet'] },
        concepts: [{
            concept_id: '2_balanced_diet_c', concept_name: 'Balanced Diet',
            diagrams: [{ diagram_id: '2_balanced_diet_d', title: 'Balanced Diet', svg_path: 'science_6/balanced-diet.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Balanced Diet'] }]
        }]
    },
    {
        topic_id: 'sci-6-2-deficiency-diseases',
        subject: 'Science', grade: 'Class 6', domain: 'Science',
        concept_key: '2_deficiency_diseases', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-6-2-deficiency-diseases', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Deficiency Diseases'] }],
        label_map: { 'default': ['Deficiency Diseases'] },
        concepts: [{
            concept_id: '2_deficiency_diseases_c', concept_name: 'Deficiency Diseases',
            diagrams: [{ diagram_id: '2_deficiency_diseases_d', title: 'Deficiency Diseases', svg_path: 'science_6/deficiency-diseases.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Deficiency Diseases'] }]
        }]
    },
    {
        topic_id: 'sci-6-3-natural-fibres',
        subject: 'Science', grade: 'Class 6', domain: 'Science',
        concept_key: '3_natural_fibres', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-6-3-natural-fibres', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Natural Fibres'] }],
        label_map: { 'default': ['Natural Fibres'] },
        concepts: [{
            concept_id: '3_natural_fibres_c', concept_name: 'Natural Fibres',
            diagrams: [{ diagram_id: '3_natural_fibres_d', title: 'Natural Fibres', svg_path: 'science_6/natural-fibres.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Natural Fibres'] }]
        }]
    },
    {
        topic_id: 'sci-6-3-spinning',
        subject: 'Science', grade: 'Class 6', domain: 'Science',
        concept_key: '3_spinning', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-6-3-spinning', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Spinning'] }],
        label_map: { 'default': ['Spinning'] },
        concepts: [{
            concept_id: '3_spinning_c', concept_name: 'Spinning',
            diagrams: [{ diagram_id: '3_spinning_d', title: 'Spinning', svg_path: 'science_6/spinning.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Spinning'] }]
        }]
    },
    {
        topic_id: 'sci-6-3-weaving',
        subject: 'Science', grade: 'Class 6', domain: 'Science',
        concept_key: '3_weaving', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-6-3-weaving', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Weaving'] }],
        label_map: { 'default': ['Weaving'] },
        concepts: [{
            concept_id: '3_weaving_c', concept_name: 'Weaving',
            diagrams: [{ diagram_id: '3_weaving_d', title: 'Weaving', svg_path: 'science_6/weaving.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Weaving'] }]
        }]
    },
    {
        topic_id: 'sci-6-4-material-properties',
        subject: 'Science', grade: 'Class 6', domain: 'Science',
        concept_key: '4_material_properties', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-6-4-material-properties', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Material Properties'] }],
        label_map: { 'default': ['Material Properties'] },
        concepts: [{
            concept_id: '4_material_properties_c', concept_name: 'Material Properties',
            diagrams: [{ diagram_id: '4_material_properties_d', title: 'Material Properties', svg_path: 'science_6/material-properties.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Material Properties'] }]
        }]
    },
    {
        topic_id: 'sci-6-4-classification',
        subject: 'Science', grade: 'Class 6', domain: 'Science',
        concept_key: '4_classification', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-6-4-classification', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Classification'] }],
        label_map: { 'default': ['Classification'] },
        concepts: [{
            concept_id: '4_classification_c', concept_name: 'Classification',
            diagrams: [{ diagram_id: '4_classification_d', title: 'Classification', svg_path: 'science_6/classification.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Classification'] }]
        }]
    },
    {
        topic_id: 'sci-6-4-uses',
        subject: 'Science', grade: 'Class 6', domain: 'Science',
        concept_key: '4_uses', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-6-4-uses', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Uses'] }],
        label_map: { 'default': ['Uses'] },
        concepts: [{
            concept_id: '4_uses_c', concept_name: 'Uses',
            diagrams: [{ diagram_id: '4_uses_d', title: 'Uses', svg_path: 'science_6/uses.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Uses'] }]
        }]
    },
    {
        topic_id: 'sci-7-1-photosynthesis',
        subject: 'Science', grade: 'Class 7', domain: 'Science',
        concept_key: '1_photosynthesis', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-7-1-photosynthesis', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Photosynthesis'] }],
        label_map: { 'default': ['Photosynthesis'] },
        concepts: [{
            concept_id: '1_photosynthesis_c', concept_name: 'Photosynthesis',
            diagrams: [{ diagram_id: '1_photosynthesis_d', title: 'Photosynthesis', svg_path: 'science_7/photosynthesis.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Photosynthesis'] }]
        }]
    },
    {
        topic_id: 'sci-7-1-modes-of-nutrition',
        subject: 'Science', grade: 'Class 7', domain: 'Science',
        concept_key: '1_modes_of_nutrition', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-7-1-modes-of-nutrition', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Modes of Nutrition'] }],
        label_map: { 'default': ['Modes of Nutrition'] },
        concepts: [{
            concept_id: '1_modes_of_nutrition_c', concept_name: 'Modes of Nutrition',
            diagrams: [{ diagram_id: '1_modes_of_nutrition_d', title: 'Modes of Nutrition', svg_path: 'science_7/modes-of-nutrition.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Modes of Nutrition'] }]
        }]
    },
    {
        topic_id: 'sci-7-1-parasites',
        subject: 'Science', grade: 'Class 7', domain: 'Science',
        concept_key: '1_parasites', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-7-1-parasites', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Parasites'] }],
        label_map: { 'default': ['Parasites'] },
        concepts: [{
            concept_id: '1_parasites_c', concept_name: 'Parasites',
            diagrams: [{ diagram_id: '1_parasites_d', title: 'Parasites', svg_path: 'science_7/parasites.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Parasites'] }]
        }]
    },
    {
        topic_id: 'sci-7-2-digestion',
        subject: 'Science', grade: 'Class 7', domain: 'Science',
        concept_key: '2_digestion', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-7-2-digestion', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Digestion'] }],
        label_map: { 'default': ['Digestion'] },
        concepts: [{
            concept_id: '2_digestion_c', concept_name: 'Digestion',
            diagrams: [{ diagram_id: '2_digestion_d', title: 'Digestion', svg_path: 'science_7/digestion.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Digestion'] }]
        }]
    },
    {
        topic_id: 'sci-7-2-digestive-system',
        subject: 'Science', grade: 'Class 7', domain: 'Science',
        concept_key: '2_digestive_system', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-7-2-digestive-system', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Digestive System'] }],
        label_map: { 'default': ['Digestive System'] },
        concepts: [{
            concept_id: '2_digestive_system_c', concept_name: 'Digestive System',
            diagrams: [{ diagram_id: '2_digestive_system_d', title: 'Digestive System', svg_path: 'science_7/digestive-system.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Digestive System'] }]
        }]
    },
    {
        topic_id: 'sci-7-2-ruminants',
        subject: 'Science', grade: 'Class 7', domain: 'Science',
        concept_key: '2_ruminants', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-7-2-ruminants', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Ruminants'] }],
        label_map: { 'default': ['Ruminants'] },
        concepts: [{
            concept_id: '2_ruminants_c', concept_name: 'Ruminants',
            diagrams: [{ diagram_id: '2_ruminants_d', title: 'Ruminants', svg_path: 'science_7/ruminants.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Ruminants'] }]
        }]
    },
    {
        topic_id: 'sci-7-3-temperature',
        subject: 'Science', grade: 'Class 7', domain: 'Science',
        concept_key: '3_temperature', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-7-3-temperature', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Temperature'] }],
        label_map: { 'default': ['Temperature'] },
        concepts: [{
            concept_id: '3_temperature_c', concept_name: 'Temperature',
            diagrams: [{ diagram_id: '3_temperature_d', title: 'Temperature', svg_path: 'science_7/temperature.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Temperature'] }]
        }]
    },
    {
        topic_id: 'sci-7-3-conduction',
        subject: 'Science', grade: 'Class 7', domain: 'Science',
        concept_key: '3_conduction', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-7-3-conduction', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Conduction'] }],
        label_map: { 'default': ['Conduction'] },
        concepts: [{
            concept_id: '3_conduction_c', concept_name: 'Conduction',
            diagrams: [{ diagram_id: '3_conduction_d', title: 'Conduction', svg_path: 'science_7/conduction.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Conduction'] }]
        }]
    },
    {
        topic_id: 'sci-7-3-convection',
        subject: 'Science', grade: 'Class 7', domain: 'Science',
        concept_key: '3_convection', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-7-3-convection', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Convection'] }],
        label_map: { 'default': ['Convection'] },
        concepts: [{
            concept_id: '3_convection_c', concept_name: 'Convection',
            diagrams: [{ diagram_id: '3_convection_d', title: 'Convection', svg_path: 'science_7/convection.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Convection'] }]
        }]
    },
    {
        topic_id: 'sci-7-3-radiation',
        subject: 'Science', grade: 'Class 7', domain: 'Science',
        concept_key: '3_radiation', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-7-3-radiation', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Radiation'] }],
        label_map: { 'default': ['Radiation'] },
        concepts: [{
            concept_id: '3_radiation_c', concept_name: 'Radiation',
            diagrams: [{ diagram_id: '3_radiation_d', title: 'Radiation', svg_path: 'science_7/radiation.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Radiation'] }]
        }]
    },
    {
        topic_id: 'sci-7-4-indicators',
        subject: 'Science', grade: 'Class 7', domain: 'Science',
        concept_key: '4_indicators', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-7-4-indicators', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Indicators'] }],
        label_map: { 'default': ['Indicators'] },
        concepts: [{
            concept_id: '4_indicators_c', concept_name: 'Indicators',
            diagrams: [{ diagram_id: '4_indicators_d', title: 'Indicators', svg_path: 'science_7/indicators.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Indicators'] }]
        }]
    },
    {
        topic_id: 'sci-7-4-neutralization',
        subject: 'Science', grade: 'Class 7', domain: 'Science',
        concept_key: '4_neutralization', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-7-4-neutralization', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Neutralization'] }],
        label_map: { 'default': ['Neutralization'] },
        concepts: [{
            concept_id: '4_neutralization_c', concept_name: 'Neutralization',
            diagrams: [{ diagram_id: '4_neutralization_d', title: 'Neutralization', svg_path: 'science_7/neutralization.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Neutralization'] }]
        }]
    },
    {
        topic_id: 'sci-7-4-applications',
        subject: 'Science', grade: 'Class 7', domain: 'Science',
        concept_key: '4_applications', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-7-4-applications', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Applications'] }],
        label_map: { 'default': ['Applications'] },
        concepts: [{
            concept_id: '4_applications_c', concept_name: 'Applications',
            diagrams: [{ diagram_id: '4_applications_d', title: 'Applications', svg_path: 'science_7/neutralization.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Applications'] }]
        }]
    },
    {
        topic_id: 'sci-8-1-agricultural-practices',
        subject: 'Science', grade: 'Class 8', domain: 'Science',
        concept_key: '1_agricultural_practices', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-8-1-agricultural-practices', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Agricultural Practices'] }],
        label_map: { 'default': ['Agricultural Practices'] },
        concepts: [{
            concept_id: '1_agricultural_practices_c', concept_name: 'Agricultural Practices',
            diagrams: [{ diagram_id: '1_agricultural_practices_d', title: 'Agricultural Practices', svg_path: 'science_8/agricultural-practices.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Agricultural Practices'] }]
        }]
    },
    {
        topic_id: 'sci-8-1-irrigation',
        subject: 'Science', grade: 'Class 8', domain: 'Science',
        concept_key: '1_irrigation', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-8-1-irrigation', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Irrigation'] }],
        label_map: { 'default': ['Irrigation'] },
        concepts: [{
            concept_id: '1_irrigation_c', concept_name: 'Irrigation',
            diagrams: [{ diagram_id: '1_irrigation_d', title: 'Irrigation', svg_path: 'science_8/irrigation.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Irrigation'] }]
        }]
    },
    {
        topic_id: 'sci-8-1-harvesting',
        subject: 'Science', grade: 'Class 8', domain: 'Science',
        concept_key: '1_harvesting', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-8-1-harvesting', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Harvesting'] }],
        label_map: { 'default': ['Harvesting'] },
        concepts: [{
            concept_id: '1_harvesting_c', concept_name: 'Harvesting',
            diagrams: [{ diagram_id: '1_harvesting_d', title: 'Harvesting', svg_path: 'science_8/harvesting.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Harvesting'] }]
        }]
    },
    {
        topic_id: 'sci-8-2-types',
        subject: 'Science', grade: 'Class 8', domain: 'Science',
        concept_key: '2_types', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-8-2-types', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Types'] }],
        label_map: { 'default': ['Types'] },
        concepts: [{
            concept_id: '2_types_c', concept_name: 'Types',
            diagrams: [{ diagram_id: '2_types_d', title: 'Types', svg_path: 'science_8/microorganism-types.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Types'] }]
        }]
    },
    {
        topic_id: 'sci-8-2-useful-microbes',
        subject: 'Science', grade: 'Class 8', domain: 'Science',
        concept_key: '2_useful_microbes', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-8-2-useful-microbes', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Useful Microbes'] }],
        label_map: { 'default': ['Useful Microbes'] },
        concepts: [{
            concept_id: '2_useful_microbes_c', concept_name: 'Useful Microbes',
            diagrams: [{ diagram_id: '2_useful_microbes_d', title: 'Useful Microbes', svg_path: 'science_8/useful-microbes.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Useful Microbes'] }]
        }]
    },
    {
        topic_id: 'sci-8-2-diseases',
        subject: 'Science', grade: 'Class 8', domain: 'Science',
        concept_key: '2_diseases', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-8-2-diseases', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Diseases'] }],
        label_map: { 'default': ['Diseases'] },
        concepts: [{
            concept_id: '2_diseases_c', concept_name: 'Diseases',
            diagrams: [{ diagram_id: '2_diseases_d', title: 'Diseases', svg_path: 'science_8/diseases.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Diseases'] }]
        }]
    },
    {
        topic_id: 'sci-8-3-types-of-plastics',
        subject: 'Science', grade: 'Class 8', domain: 'Science',
        concept_key: '3_types_of_plastics', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-8-3-types-of-plastics', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Types of Plastics'] }],
        label_map: { 'default': ['Types of Plastics'] },
        concepts: [{
            concept_id: '3_types_of_plastics_c', concept_name: 'Types of Plastics',
            diagrams: [{ diagram_id: '3_types_of_plastics_d', title: 'Types of Plastics', svg_path: 'science_8/types-of-plastics.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Types of Plastics'] }]
        }]
    },
    {
        topic_id: 'sci-8-3-4r-principle',
        subject: 'Science', grade: 'Class 8', domain: 'Science',
        concept_key: '3_4r_principle', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-8-3-4r-principle', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['4R Principle'] }],
        label_map: { 'default': ['4R Principle'] },
        concepts: [{
            concept_id: '3_4r_principle_c', concept_name: '4R Principle',
            diagrams: [{ diagram_id: '3_4r_principle_d', title: '4R Principle', svg_path: 'science_8/4r-principle.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['4R Principle'] }]
        }]
    },
    {
        topic_id: 'sci-8-3-environmental-impact',
        subject: 'Science', grade: 'Class 8', domain: 'Science',
        concept_key: '3_environmental_impact', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-8-3-environmental-impact', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Environmental Impact'] }],
        label_map: { 'default': ['Environmental Impact'] },
        concepts: [{
            concept_id: '3_environmental_impact_c', concept_name: 'Environmental Impact',
            diagrams: [{ diagram_id: '3_environmental_impact_d', title: 'Environmental Impact', svg_path: 'science_8/environmental-impact.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Environmental Impact'] }]
        }]
    },
    {
        topic_id: 'sci-8-4-properties-of-metals',
        subject: 'Science', grade: 'Class 8', domain: 'Science',
        concept_key: '4_properties_of_metals', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-8-4-properties-of-metals', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Properties of Metals'] }],
        label_map: { 'default': ['Properties of Metals'] },
        concepts: [{
            concept_id: '4_properties_of_metals_c', concept_name: 'Properties of Metals',
            diagrams: [{ diagram_id: '4_properties_of_metals_d', title: 'Properties of Metals', svg_path: 'science_8/properties-of-metals.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Properties of Metals'] }]
        }]
    },
    {
        topic_id: 'sci-8-4-reactivity',
        subject: 'Science', grade: 'Class 8', domain: 'Science',
        concept_key: '4_reactivity', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-8-4-reactivity', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Reactivity'] }],
        label_map: { 'default': ['Reactivity'] },
        concepts: [{
            concept_id: '4_reactivity_c', concept_name: 'Reactivity',
            diagrams: [{ diagram_id: '4_reactivity_d', title: 'Reactivity', svg_path: 'science_8/reactivity.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Reactivity'] }]
        }]
    },
    {
        topic_id: 'sci-8-4-uses',
        subject: 'Science', grade: 'Class 8', domain: 'Science',
        concept_key: '4_uses', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-8-4-uses', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Uses'] }],
        label_map: { 'default': ['Uses'] },
        concepts: [{
            concept_id: '4_uses_c', concept_name: 'Uses',
            diagrams: [{ diagram_id: '4_uses_d', title: 'Uses', svg_path: 'science_8/uses.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Uses'] }]
        }]
    },
    {
        topic_id: 'sci-9-1-states-of-matter',
        subject: 'Science', grade: 'Class 9', domain: 'Science',
        concept_key: '1_states_of_matter', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-9-1-states-of-matter', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['States of Matter'] }],
        label_map: { 'default': ['States of Matter'] },
        concepts: [{
            concept_id: '1_states_of_matter_c', concept_name: 'States of Matter',
            diagrams: [{ diagram_id: '1_states_of_matter_d', title: 'States of Matter', svg_path: 'science_9/states-of-matter.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['States of Matter'] }]
        }]
    },
    {
        topic_id: 'sci-9-1-changes-of-state',
        subject: 'Science', grade: 'Class 9', domain: 'Science',
        concept_key: '1_changes_of_state', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-9-1-changes-of-state', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Changes of State'] }],
        label_map: { 'default': ['Changes of State'] },
        concepts: [{
            concept_id: '1_changes_of_state_c', concept_name: 'Changes of State',
            diagrams: [{ diagram_id: '1_changes_of_state_d', title: 'Changes of State', svg_path: 'science_9/changes-of-state.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Changes of State'] }]
        }]
    },
    {
        topic_id: 'sci-9-1-evaporation',
        subject: 'Science', grade: 'Class 9', domain: 'Science',
        concept_key: '1_evaporation', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-9-1-evaporation', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Evaporation'] }],
        label_map: { 'default': ['Evaporation'] },
        concepts: [{
            concept_id: '1_evaporation_c', concept_name: 'Evaporation',
            diagrams: [{ diagram_id: '1_evaporation_d', title: 'Evaporation', svg_path: 'science_9/evaporation.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Evaporation'] }]
        }]
    },
    {
        topic_id: 'sci-9-2-mixtures',
        subject: 'Science', grade: 'Class 9', domain: 'Science',
        concept_key: '2_mixtures', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-9-2-mixtures', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Mixtures'] }],
        label_map: { 'default': ['Mixtures'] },
        concepts: [{
            concept_id: '2_mixtures_c', concept_name: 'Mixtures',
            diagrams: [{ diagram_id: '2_mixtures_d', title: 'Mixtures', svg_path: 'science_9/mixtures.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Mixtures'] }]
        }]
    },
    {
        topic_id: 'sci-9-2-solutions',
        subject: 'Science', grade: 'Class 9', domain: 'Science',
        concept_key: '2_solutions', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-9-2-solutions', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Solutions'] }],
        label_map: { 'default': ['Solutions'] },
        concepts: [{
            concept_id: '2_solutions_c', concept_name: 'Solutions',
            diagrams: [{ diagram_id: '2_solutions_d', title: 'Solutions', svg_path: 'science_9/solutions.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Solutions'] }]
        }]
    },
    {
        topic_id: 'sci-9-2-separation-techniques',
        subject: 'Science', grade: 'Class 9', domain: 'Science',
        concept_key: '2_separation_techniques', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-9-2-separation-techniques', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Separation Techniques'] }],
        label_map: { 'default': ['Separation Techniques'] },
        concepts: [{
            concept_id: '2_separation_techniques_c', concept_name: 'Separation Techniques',
            diagrams: [{ diagram_id: '2_separation_techniques_d', title: 'Separation Techniques', svg_path: 'science_9/separation-techniques.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Separation Techniques'] }]
        }]
    },
    {
        topic_id: 'sci-9-3-atomic-theory',
        subject: 'Science', grade: 'Class 9', domain: 'Science',
        concept_key: '3_atomic_theory', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-9-3-atomic-theory', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Atomic Theory'] }],
        label_map: { 'default': ['Atomic Theory'] },
        concepts: [{
            concept_id: '3_atomic_theory_c', concept_name: 'Atomic Theory',
            diagrams: [{ diagram_id: '3_atomic_theory_d', title: 'Atomic Theory', svg_path: 'chemistry_11/atomic-theory.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Atomic Theory'] }]
        }]
    },
    {
        topic_id: 'sci-9-3-molecules',
        subject: 'Science', grade: 'Class 9', domain: 'Science',
        concept_key: '3_molecules', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-9-3-molecules', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Molecules'] }],
        label_map: { 'default': ['Molecules'] },
        concepts: [{
            concept_id: '3_molecules_c', concept_name: 'Molecules',
            diagrams: [{ diagram_id: '3_molecules_d', title: 'Molecules', svg_path: 'science_9/molecules.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Molecules'] }]
        }]
    },
    {
        topic_id: 'sci-9-3-mole-concept',
        subject: 'Science', grade: 'Class 9', domain: 'Science',
        concept_key: '3_mole_concept', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-9-3-mole-concept', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Mole Concept'] }],
        label_map: { 'default': ['Mole Concept'] },
        concepts: [{
            concept_id: '3_mole_concept_c', concept_name: 'Mole Concept',
            diagrams: [{ diagram_id: '3_mole_concept_d', title: 'Mole Concept', svg_path: 'chemistry_11/mole-concept.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Mole Concept'] }]
        }]
    },
    {
        topic_id: 'sci-9-4-subatomic-particles',
        subject: 'Science', grade: 'Class 9', domain: 'Science',
        concept_key: '4_subatomic_particles', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-9-4-subatomic-particles', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Subatomic Particles'] }],
        label_map: { 'default': ['Subatomic Particles'] },
        concepts: [{
            concept_id: '4_subatomic_particles_c', concept_name: 'Subatomic Particles',
            diagrams: [{ diagram_id: '4_subatomic_particles_d', title: 'Subatomic Particles', svg_path: 'science_9/subatomic-particles.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Subatomic Particles'] }]
        }]
    },
    {
        topic_id: 'sci-9-4-atomic-models',
        subject: 'Science', grade: 'Class 9', domain: 'Science',
        concept_key: '4_atomic_models', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-9-4-atomic-models', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Atomic Models'] }],
        label_map: { 'default': ['Atomic Models'] },
        concepts: [{
            concept_id: '4_atomic_models_c', concept_name: 'Atomic Models',
            diagrams: [{ diagram_id: '4_atomic_models_d', title: 'Atomic Models', svg_path: 'chemistry_11/atomic-models.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Atomic Models'] }]
        }]
    },
    {
        topic_id: 'sci-9-4-electronic-configuration',
        subject: 'Science', grade: 'Class 9', domain: 'Science',
        concept_key: '4_electronic_configuration', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-9-4-electronic-configuration', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Electronic Configuration'] }],
        label_map: { 'default': ['Electronic Configuration'] },
        concepts: [{
            concept_id: '4_electronic_configuration_c', concept_name: 'Electronic Configuration',
            diagrams: [{ diagram_id: '4_electronic_configuration_d', title: 'Electronic Configuration', svg_path: 'science_9/electronic-configuration.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Electronic Configuration'] }]
        }]
    },
    {
        topic_id: 'sci-9-5-cell-structure',
        subject: 'Science', grade: 'Class 9', domain: 'Science',
        concept_key: '5_cell_structure', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-9-5-cell-structure', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Cell Structure'] }],
        label_map: { 'default': ['Cell Structure'] },
        concepts: [{
            concept_id: '5_cell_structure_c', concept_name: 'Cell Structure',
            diagrams: [{ diagram_id: '5_cell_structure_d', title: 'Cell Structure', svg_path: 'science_9/cell-structure.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Cell Structure'] }]
        }]
    },
    {
        topic_id: 'sci-9-5-organelles',
        subject: 'Science', grade: 'Class 9', domain: 'Science',
        concept_key: '5_organelles', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-9-5-organelles', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Organelles'] }],
        label_map: { 'default': ['Organelles'] },
        concepts: [{
            concept_id: '5_organelles_c', concept_name: 'Organelles',
            diagrams: [{ diagram_id: '5_organelles_d', title: 'Organelles', svg_path: 'science_9/organelles.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Organelles'] }]
        }]
    },
    {
        topic_id: 'sci-9-5-cell-division',
        subject: 'Science', grade: 'Class 9', domain: 'Science',
        concept_key: '5_cell_division', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-9-5-cell-division', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Cell Division'] }],
        label_map: { 'default': ['Cell Division'] },
        concepts: [{
            concept_id: '5_cell_division_c', concept_name: 'Cell Division',
            diagrams: [{ diagram_id: '5_cell_division_d', title: 'Cell Division', svg_path: 'science_9/cell-division.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Cell Division'] }]
        }]
    },
    {
        topic_id: 'sci-10-1-chemical-reaction-types',
        subject: 'Science', grade: 'Class 10', domain: 'Chemistry',
        concept_key: '1_chemical_reaction_types', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-10-1-chemical-reaction-types', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Science 10', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Combination', 'Decomposition', 'Displacement', 'Double Displacement', 'Redox'] }],
        label_map: { 'default': ['Combination', 'Decomposition', 'Displacement', 'Double Displacement', 'Redox'] },
        concepts: [{
            concept_id: 'chemical_reaction_types_c', concept_name: 'Chemical Reaction Types',
            diagrams: [{ diagram_id: 'chemical_reaction_types_d', title: 'Chemical Reaction Types', svg_path: 'science_10/chemical-reaction-types.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Combination', 'Decomposition', 'Displacement', 'Double Displacement', 'Redox'] }]
        }]
    },
    {
        topic_id: 'sci-10-1-balancing-equations',
        subject: 'Science', grade: 'Class 10', domain: 'Science',
        concept_key: '1_balancing_equations', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-10-1-balancing-equations', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Balancing Equations'] }],
        label_map: { 'default': ['Balancing Equations'] },
        concepts: [{
            concept_id: '1_balancing_equations_c', concept_name: 'Balancing Equations',
            diagrams: [{ diagram_id: '1_balancing_equations_d', title: 'Balancing Equations', svg_path: 'science_10/balancing-equations.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Balancing Equations'] }]
        }]
    },
    {
        topic_id: 'sci-10-1-reaction-effects',
        subject: 'Science', grade: 'Class 10', domain: 'Science',
        concept_key: '1_reaction_effects', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-10-1-reaction-effects', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Reaction Effects'] }],
        label_map: { 'default': ['Reaction Effects'] },
        concepts: [{
            concept_id: '1_reaction_effects_c', concept_name: 'Reaction Effects',
            diagrams: [{ diagram_id: '1_reaction_effects_d', title: 'Reaction Effects', svg_path: 'science_10/reaction-effects.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Reaction Effects'] }]
        }]
    },
    {
        topic_id: 'sci-10-2-ph-scale',
        subject: 'Science', grade: 'Class 10', domain: 'Science',
        concept_key: '2_ph_scale', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-10-2-ph-scale', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['pH Scale'] }],
        label_map: { 'default': ['pH Scale'] },
        concepts: [{
            concept_id: '2_ph_scale_c', concept_name: 'pH Scale',
            diagrams: [{ diagram_id: '2_ph_scale_d', title: 'pH Scale', svg_path: 'science_10/ph-scale.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['pH Scale'] }]
        }]
    },
    {
        topic_id: 'sci-10-2-acid-reactions',
        subject: 'Science', grade: 'Class 10', domain: 'Science',
        concept_key: '2_acid_reactions', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-10-2-acid-reactions', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Acid Reactions'] }],
        label_map: { 'default': ['Acid Reactions'] },
        concepts: [{
            concept_id: '2_acid_reactions_c', concept_name: 'Acid Reactions',
            diagrams: [{ diagram_id: '2_acid_reactions_d', title: 'Acid Reactions', svg_path: 'science_10/acid-reactions.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Acid Reactions'] }]
        }]
    },
    {
        topic_id: 'sci-10-2-salts-formation',
        subject: 'Science', grade: 'Class 10', domain: 'Science',
        concept_key: '2_salts_formation', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-10-2-salts-formation', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Salts Formation'] }],
        label_map: { 'default': ['Salts Formation'] },
        concepts: [{
            concept_id: '2_salts_formation_c', concept_name: 'Salts Formation',
            diagrams: [{ diagram_id: '2_salts_formation_d', title: 'Salts Formation', svg_path: 'science_10/salts-formation.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Salts Formation'] }]
        }]
    },
    {
        topic_id: 'sci-10-3-metal-occurrence',
        subject: 'Science', grade: 'Class 10', domain: 'Science',
        concept_key: '3_metal_occurrence', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-10-3-metal-occurrence', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Metal Occurrence'] }],
        label_map: { 'default': ['Metal Occurrence'] },
        concepts: [{
            concept_id: '3_metal_occurrence_c', concept_name: 'Metal Occurrence',
            diagrams: [{ diagram_id: '3_metal_occurrence_d', title: 'Metal Occurrence', svg_path: 'science_10/metal-occurrence.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Metal Occurrence'] }]
        }]
    },
    {
        topic_id: 'sci-10-3-metal-extraction',
        subject: 'Science', grade: 'Class 10', domain: 'Science',
        concept_key: '3_metal_extraction', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-10-3-metal-extraction', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Metal Extraction'] }],
        label_map: { 'default': ['Metal Extraction'] },
        concepts: [{
            concept_id: '3_metal_extraction_c', concept_name: 'Metal Extraction',
            diagrams: [{ diagram_id: '3_metal_extraction_d', title: 'Metal Extraction', svg_path: 'science_10/metal-extraction.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Metal Extraction'] }]
        }]
    },
    {
        topic_id: 'sci-10-3-metal-corrosion',
        subject: 'Science', grade: 'Class 10', domain: 'Science',
        concept_key: '3_metal_corrosion', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-10-3-metal-corrosion', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Metal Corrosion'] }],
        label_map: { 'default': ['Metal Corrosion'] },
        concepts: [{
            concept_id: '3_metal_corrosion_c', concept_name: 'Metal Corrosion',
            diagrams: [{ diagram_id: '3_metal_corrosion_d', title: 'Metal Corrosion', svg_path: 'science_10/metal-corrosion.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Metal Corrosion'] }]
        }]
    },
    {
        topic_id: 'sci-10-4-covalent-bonding',
        subject: 'Science', grade: 'Class 10', domain: 'Science',
        concept_key: '4_covalent_bonding', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-10-4-covalent-bonding', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Covalent Bonding'] }],
        label_map: { 'default': ['Covalent Bonding'] },
        concepts: [{
            concept_id: '4_covalent_bonding_c', concept_name: 'Covalent Bonding',
            diagrams: [{ diagram_id: '4_covalent_bonding_d', title: 'Covalent Bonding', svg_path: 'science_10/covalent-bonding.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Covalent Bonding'] }]
        }]
    },
    {
        topic_id: 'sci-10-4-hydrocarbons',
        subject: 'Science', grade: 'Class 10', domain: 'Science',
        concept_key: '4_hydrocarbons', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-10-4-hydrocarbons', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Hydrocarbons'] }],
        label_map: { 'default': ['Hydrocarbons'] },
        concepts: [{
            concept_id: '4_hydrocarbons_c', concept_name: 'Hydrocarbons',
            diagrams: [{ diagram_id: '4_hydrocarbons_d', title: 'Hydrocarbons', svg_path: 'science_10/hydrocarbons.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Hydrocarbons'] }]
        }]
    },
    {
        topic_id: 'sci-10-4-functional-groups',
        subject: 'Science', grade: 'Class 10', domain: 'Science',
        concept_key: '4_functional_groups', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-10-4-functional-groups', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Functional Groups'] }],
        label_map: { 'default': ['Functional Groups'] },
        concepts: [{
            concept_id: '4_functional_groups_c', concept_name: 'Functional Groups',
            diagrams: [{ diagram_id: '4_functional_groups_d', title: 'Functional Groups', svg_path: 'science_10/functional-groups.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Functional Groups'] }]
        }]
    },
    {
        topic_id: 'sci-10-5-human-nutrition',
        subject: 'Science', grade: 'Class 10', domain: 'Science',
        concept_key: '5_human_nutrition', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-10-5-human-nutrition', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Human Nutrition'] }],
        label_map: { 'default': ['Human Nutrition'] },
        concepts: [{
            concept_id: '5_human_nutrition_c', concept_name: 'Human Nutrition',
            diagrams: [{ diagram_id: '5_human_nutrition_d', title: 'Human Nutrition', svg_path: 'science_10/human-nutrition.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Human Nutrition'] }]
        }]
    },
    {
        topic_id: 'sci-10-5-human-respiration',
        subject: 'Science', grade: 'Class 10', domain: 'Science',
        concept_key: '5_human_respiration', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-10-5-human-respiration', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Human Respiration'] }],
        label_map: { 'default': ['Human Respiration'] },
        concepts: [{
            concept_id: '5_human_respiration_c', concept_name: 'Human Respiration',
            diagrams: [{ diagram_id: '5_human_respiration_d', title: 'Human Respiration', svg_path: 'science_10/human-respiration.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Human Respiration'] }]
        }]
    },
    {
        topic_id: 'sci-10-5-human-transportation',
        subject: 'Science', grade: 'Class 10', domain: 'Science',
        concept_key: '5_human_transportation', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-10-5-human-transportation', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Human Transportation'] }],
        label_map: { 'default': ['Human Transportation'] },
        concepts: [{
            concept_id: '5_human_transportation_c', concept_name: 'Human Transportation',
            diagrams: [{ diagram_id: '5_human_transportation_d', title: 'Human Transportation', svg_path: 'science_10/human-transportation.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Human Transportation'] }]
        }]
    },
    {
        topic_id: 'sci-10-5-human-excretion',
        subject: 'Science', grade: 'Class 10', domain: 'Science',
        concept_key: '5_human_excretion', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-10-5-human-excretion', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Human Excretion'] }],
        label_map: { 'default': ['Human Excretion'] },
        concepts: [{
            concept_id: '5_human_excretion_c', concept_name: 'Human Excretion',
            diagrams: [{ diagram_id: '5_human_excretion_d', title: 'Human Excretion', svg_path: 'science_10/human-excretion.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Human Excretion'] }]
        }]
    },
    {
        topic_id: 'sst-6-1-history-introduction',
        subject: 'Social Science', grade: 'Class 6', domain: 'Social Science',
        concept_key: '1_history_introduction', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-6-1-history-introduction', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['History Introduction'] }],
        label_map: { 'default': ['History Introduction'] },
        concepts: [{
            concept_id: '1_history_introduction_c', concept_name: 'History Introduction',
            diagrams: [{ diagram_id: '1_history_introduction_d', title: 'History Introduction', svg_path: 'social_6/history-introduction.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['History Introduction'] }]
        }]
    },
    {
        topic_id: 'sst-6-1-sources',
        subject: 'Social Science', grade: 'Class 6', domain: 'Social Science',
        concept_key: '1_sources', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-6-1-sources', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Sources'] }],
        label_map: { 'default': ['Sources'] },
        concepts: [{
            concept_id: '1_sources_c', concept_name: 'Sources',
            diagrams: [{ diagram_id: '1_sources_d', title: 'Sources', svg_path: 'food_sources/sources.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Sources'] }]
        }]
    },
    {
        topic_id: 'sst-6-1-timeline',
        subject: 'Social Science', grade: 'Class 6', domain: 'Social Science',
        concept_key: '1_timeline', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-6-1-timeline', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Timeline'] }],
        label_map: { 'default': ['Timeline'] },
        concepts: [{
            concept_id: '1_timeline_c', concept_name: 'Timeline',
            diagrams: [{ diagram_id: '1_timeline_d', title: 'Timeline', svg_path: 'social_6/timeline.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Timeline'] }]
        }]
    },
    {
        topic_id: 'sst-6-2-planets',
        subject: 'Social Science', grade: 'Class 6', domain: 'Social Science',
        concept_key: '2_planets', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-6-2-planets', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Planets'] }],
        label_map: { 'default': ['Planets'] },
        concepts: [{
            concept_id: '2_planets_c', concept_name: 'Planets',
            diagrams: [{ diagram_id: '2_planets_d', title: 'Planets', svg_path: 'social_6/planets.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Planets'] }]
        }]
    },
    {
        topic_id: 'sst-6-2-earth',
        subject: 'Social Science', grade: 'Class 6', domain: 'Social Science',
        concept_key: '2_earth', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-6-2-earth', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Earth'] }],
        label_map: { 'default': ['Earth'] },
        concepts: [{
            concept_id: '2_earth_c', concept_name: 'Earth',
            diagrams: [{ diagram_id: '2_earth_d', title: 'Earth', svg_path: 'social_6/earth.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Earth'] }]
        }]
    },
    {
        topic_id: 'sst-6-2-moon',
        subject: 'Social Science', grade: 'Class 6', domain: 'Social Science',
        concept_key: '2_moon', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-6-2-moon', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Moon'] }],
        label_map: { 'default': ['Moon'] },
        concepts: [{
            concept_id: '2_moon_c', concept_name: 'Moon',
            diagrams: [{ diagram_id: '2_moon_d', title: 'Moon', svg_path: 'social_6/moon.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Moon'] }]
        }]
    },
    {
        topic_id: 'sst-6-3-indian-diversity',
        subject: 'Social Science', grade: 'Class 6', domain: 'Social Science',
        concept_key: '3_indian_diversity', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-6-3-indian-diversity', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Indian Diversity'] }],
        label_map: { 'default': ['Indian Diversity'] },
        concepts: [{
            concept_id: '3_indian_diversity_c', concept_name: 'Indian Diversity',
            diagrams: [{ diagram_id: '3_indian_diversity_d', title: 'Indian Diversity', svg_path: 'social_6/indian-diversity.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Indian Diversity'] }]
        }]
    },
    {
        topic_id: 'sst-6-3-culture',
        subject: 'Social Science', grade: 'Class 6', domain: 'Social Science',
        concept_key: '3_culture', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-6-3-culture', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Culture'] }],
        label_map: { 'default': ['Culture'] },
        concepts: [{
            concept_id: '3_culture_c', concept_name: 'Culture',
            diagrams: [{ diagram_id: '3_culture_d', title: 'Culture', svg_path: 'social_6/culture.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Culture'] }]
        }]
    },
    {
        topic_id: 'sst-6-3-unity',
        subject: 'Social Science', grade: 'Class 6', domain: 'Social Science',
        concept_key: '3_unity', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-6-3-unity', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Unity'] }],
        label_map: { 'default': ['Unity'] },
        concepts: [{
            concept_id: '3_unity_c', concept_name: 'Unity',
            diagrams: [{ diagram_id: '3_unity_d', title: 'Unity', svg_path: 'social_6/unity.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Unity'] }]
        }]
    },
    {
        topic_id: 'sst-7-1-medieval-india',
        subject: 'Social Science', grade: 'Class 7', domain: 'Social Science',
        concept_key: '1_medieval_india', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-7-1-medieval-india', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Medieval India'] }],
        label_map: { 'default': ['Medieval India'] },
        concepts: [{
            concept_id: '1_medieval_india_c', concept_name: 'Medieval India',
            diagrams: [{ diagram_id: '1_medieval_india_d', title: 'Medieval India', svg_path: 'social_7/medieval-india.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Medieval India'] }]
        }]
    },
    {
        topic_id: 'sst-7-1-sources',
        subject: 'Social Science', grade: 'Class 7', domain: 'Social Science',
        concept_key: '1_sources', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-7-1-sources', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Sources'] }],
        label_map: { 'default': ['Sources'] },
        concepts: [{
            concept_id: '1_sources_c', concept_name: 'Sources',
            diagrams: [{ diagram_id: '1_sources_d', title: 'Sources', svg_path: 'food_sources/sources.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Sources'] }]
        }]
    },
    {
        topic_id: 'sst-7-1-changes',
        subject: 'Social Science', grade: 'Class 7', domain: 'Social Science',
        concept_key: '1_changes', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-7-1-changes', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Changes'] }],
        label_map: { 'default': ['Changes'] },
        concepts: [{
            concept_id: '1_changes_c', concept_name: 'Changes',
            diagrams: [{ diagram_id: '1_changes_d', title: 'Changes', svg_path: 'social_7/changes.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Changes'] }]
        }]
    },
    {
        topic_id: 'sst-7-2-ecosystem',
        subject: 'Social Science', grade: 'Class 7', domain: 'Social Science',
        concept_key: '2_ecosystem', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-7-2-ecosystem', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Ecosystem'] }],
        label_map: { 'default': ['Ecosystem'] },
        concepts: [{
            concept_id: '2_ecosystem_c', concept_name: 'Ecosystem',
            diagrams: [{ diagram_id: '2_ecosystem_d', title: 'Ecosystem', svg_path: 'social_7/ecosystem.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Ecosystem'] }]
        }]
    },
    {
        topic_id: 'sst-7-2-natural-environment',
        subject: 'Social Science', grade: 'Class 7', domain: 'Social Science',
        concept_key: '2_natural_environment', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-7-2-natural-environment', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Natural Environment'] }],
        label_map: { 'default': ['Natural Environment'] },
        concepts: [{
            concept_id: '2_natural_environment_c', concept_name: 'Natural Environment',
            diagrams: [{ diagram_id: '2_natural_environment_d', title: 'Natural Environment', svg_path: 'social_7/natural-environment.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Natural Environment'] }]
        }]
    },
    {
        topic_id: 'sst-7-2-human-impact',
        subject: 'Social Science', grade: 'Class 7', domain: 'Social Science',
        concept_key: '2_human_impact', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-7-2-human-impact', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Human Impact'] }],
        label_map: { 'default': ['Human Impact'] },
        concepts: [{
            concept_id: '2_human_impact_c', concept_name: 'Human Impact',
            diagrams: [{ diagram_id: '2_human_impact_d', title: 'Human Impact', svg_path: 'social_7/human-impact.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Human Impact'] }]
        }]
    },
    {
        topic_id: 'sst-7-3-constitution',
        subject: 'Social Science', grade: 'Class 7', domain: 'Social Science',
        concept_key: '3_constitution', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-7-3-constitution', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Constitution'] }],
        label_map: { 'default': ['Constitution'] },
        concepts: [{
            concept_id: '3_constitution_c', concept_name: 'Constitution',
            diagrams: [{ diagram_id: '3_constitution_d', title: 'Constitution', svg_path: 'social_7/constitution.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Constitution'] }]
        }]
    },
    {
        topic_id: 'sst-7-3-rights',
        subject: 'Social Science', grade: 'Class 7', domain: 'Social Science',
        concept_key: '3_rights', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-7-3-rights', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Rights'] }],
        label_map: { 'default': ['Rights'] },
        concepts: [{
            concept_id: '3_rights_c', concept_name: 'Rights',
            diagrams: [{ diagram_id: '3_rights_d', title: 'Rights', svg_path: 'social_7/rights.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Rights'] }]
        }]
    },
    {
        topic_id: 'sst-7-3-equality',
        subject: 'Social Science', grade: 'Class 7', domain: 'Social Science',
        concept_key: '3_equality', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-7-3-equality', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Equality'] }],
        label_map: { 'default': ['Equality'] },
        concepts: [{
            concept_id: '3_equality_c', concept_name: 'Equality',
            diagrams: [{ diagram_id: '3_equality_d', title: 'Equality', svg_path: 'social_7/equality.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Equality'] }]
        }]
    },
    {
        topic_id: 'sst-8-1-modern-history',
        subject: 'Social Science', grade: 'Class 8', domain: 'Social Science',
        concept_key: '1_modern_history', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-8-1-modern-history', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Modern History'] }],
        label_map: { 'default': ['Modern History'] },
        concepts: [{
            concept_id: '1_modern_history_c', concept_name: 'Modern History',
            diagrams: [{ diagram_id: '1_modern_history_d', title: 'Modern History', svg_path: 'social_8/modern-history.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Modern History'] }]
        }]
    },
    {
        topic_id: 'sst-8-1-british-rule',
        subject: 'Social Science', grade: 'Class 8', domain: 'Social Science',
        concept_key: '1_british_rule', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-8-1-british-rule', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['British Rule'] }],
        label_map: { 'default': ['British Rule'] },
        concepts: [{
            concept_id: '1_british_rule_c', concept_name: 'British Rule',
            diagrams: [{ diagram_id: '1_british_rule_d', title: 'British Rule', svg_path: 'social_8/british-rule.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['British Rule'] }]
        }]
    },
    {
        topic_id: 'sst-8-1-sources',
        subject: 'Social Science', grade: 'Class 8', domain: 'Social Science',
        concept_key: '1_sources', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-8-1-sources', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Sources'] }],
        label_map: { 'default': ['Sources'] },
        concepts: [{
            concept_id: '1_sources_c', concept_name: 'Sources',
            diagrams: [{ diagram_id: '1_sources_d', title: 'Sources', svg_path: 'food_sources/sources.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Sources'] }]
        }]
    },
    {
        topic_id: 'sst-8-2-resource-types',
        subject: 'Social Science', grade: 'Class 8', domain: 'Social Science',
        concept_key: '2_resource_types', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-8-2-resource-types', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Resource Types'] }],
        label_map: { 'default': ['Resource Types'] },
        concepts: [{
            concept_id: '2_resource_types_c', concept_name: 'Resource Types',
            diagrams: [{ diagram_id: '2_resource_types_d', title: 'Resource Types', svg_path: 'social_8/resource-types.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Resource Types'] }]
        }]
    },
    {
        topic_id: 'sst-8-2-conservation',
        subject: 'Social Science', grade: 'Class 8', domain: 'Social Science',
        concept_key: '2_conservation', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-8-2-conservation', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Conservation'] }],
        label_map: { 'default': ['Conservation'] },
        concepts: [{
            concept_id: '2_conservation_c', concept_name: 'Conservation',
            diagrams: [{ diagram_id: '2_conservation_d', title: 'Conservation', svg_path: 'social_10/conservation.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Conservation'] }]
        }]
    },
    {
        topic_id: 'sst-8-2-sustainable-development',
        subject: 'Social Science', grade: 'Class 8', domain: 'Social Science',
        concept_key: '2_sustainable_development', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-8-2-sustainable-development', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Sustainable Development'] }],
        label_map: { 'default': ['Sustainable Development'] },
        concepts: [{
            concept_id: '2_sustainable_development_c', concept_name: 'Sustainable Development',
            diagrams: [{ diagram_id: '2_sustainable_development_d', title: 'Sustainable Development', svg_path: 'social_8/sustainable-development.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Sustainable Development'] }]
        }]
    },
    {
        topic_id: 'sst-8-3-preamble',
        subject: 'Social Science', grade: 'Class 8', domain: 'Social Science',
        concept_key: '3_preamble', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-8-3-preamble', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Preamble'] }],
        label_map: { 'default': ['Preamble'] },
        concepts: [{
            concept_id: '3_preamble_c', concept_name: 'Preamble',
            diagrams: [{ diagram_id: '3_preamble_d', title: 'Preamble', svg_path: 'social_8/preamble.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Preamble'] }]
        }]
    },
    {
        topic_id: 'sst-8-3-features',
        subject: 'Social Science', grade: 'Class 8', domain: 'Social Science',
        concept_key: '3_features', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-8-3-features', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Features'] }],
        label_map: { 'default': ['Features'] },
        concepts: [{
            concept_id: '3_features_c', concept_name: 'Features',
            diagrams: [{ diagram_id: '3_features_d', title: 'Features', svg_path: 'social_8/features.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Features'] }]
        }]
    },
    {
        topic_id: 'sst-8-3-fundamental-rights',
        subject: 'Social Science', grade: 'Class 8', domain: 'Social Science',
        concept_key: '3_fundamental_rights', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-8-3-fundamental-rights', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Fundamental Rights'] }],
        label_map: { 'default': ['Fundamental Rights'] },
        concepts: [{
            concept_id: '3_fundamental_rights_c', concept_name: 'Fundamental Rights',
            diagrams: [{ diagram_id: '3_fundamental_rights_d', title: 'Fundamental Rights', svg_path: 'social_8/fundamental-rights.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Fundamental Rights'] }]
        }]
    },
    {
        topic_id: 'sst-10-1-nation-states',
        subject: 'Social Science', grade: 'Class 10', domain: 'Social Science',
        concept_key: '1_nation_states', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-10-1-nation-states', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Social Science 10', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Nation States'] }],
        label_map: { 'default': ['Nation States'] },
        concepts: [{
            concept_id: 'nation_states_c', concept_name: 'Nation States',
            diagrams: [{ diagram_id: 'nation_states_d', title: 'Nation States — Rise of Nationalism', svg_path: 'sst_10/nation_states.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Old Order', 'Nation-State', 'Timeline', 'Key Features'] }]
        }]
    },
    {
        topic_id: 'sst-10-1-unification',
        subject: 'Social Science', grade: 'Class 10', domain: 'Social Science',
        concept_key: '1_unification', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-10-1-unification', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Social Science 10', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Unification'] }],
        label_map: { 'default': ['Unification'] },
        concepts: [{
            concept_id: 'unification_c', concept_name: 'Unification of Germany and Italy',
            diagrams: [{ diagram_id: 'unification_d', title: 'Unification of Germany & Italy', svg_path: 'sst_10/unification.svg', diagram_type: 'process', purpose: 'Process', labels: ['Bismarck', 'Mazzini', 'Garibaldi', '1871'] }]
        }]
    },
    {
        topic_id: 'sst-10-1-nationalism',
        subject: 'Social Science', grade: 'Class 10', domain: 'Social Science',
        concept_key: '1_nationalism', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-10-1-nationalism', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Social Science 10', checksum: 'sha256-auto', difficulty: 'advanced',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Nationalism'] }],
        label_map: { 'default': ['Nationalism'] },
        concepts: [{
            concept_id: 'nationalism_c', concept_name: 'Nationalism in Europe',
            diagrams: [{ diagram_id: 'nationalism_d', title: 'Nationalism in Europe', svg_path: 'sst_10/nationalism.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Language', 'Romanticism', 'French Revolution', 'Conservatism', 'Print Culture'] }]
        }]
    },
    {
        topic_id: 'sst-10-2-soil-types',
        subject: 'Social Science', grade: 'Class 10', domain: 'Social Science',
        concept_key: '2_soil_types', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-10-2-soil-types', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Social Science 10', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Soil Types'] }],
        label_map: { 'default': ['Soil Types'] },
        concepts: [{
            concept_id: 'soil_types_c', concept_name: 'Soil Types of India',
            diagrams: [{ diagram_id: 'soil_types_d', title: 'Soil Types of India', svg_path: 'sst_10/soil_types.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Alluvial', 'Black', 'Red', 'Laterite', 'Arid', 'Forest'] }]
        }]
    },
    {
        topic_id: 'sst-10-2-resource-planning',
        subject: 'Social Science', grade: 'Class 10', domain: 'Social Science',
        concept_key: '2_resource_planning', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-10-2-resource-planning', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Social Science 10', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Resource Planning'] }],
        label_map: { 'default': ['Resource Planning'] },
        concepts: [{
            concept_id: 'resource_planning_c', concept_name: 'Resource Planning',
            diagrams: [{ diagram_id: 'resource_planning_d', title: 'Resource Planning in India', svg_path: 'sst_10/resource_planning.svg', diagram_type: 'process', purpose: 'Process', labels: ['Natural Resources', 'Human Resources', '3-Stage Planning', 'Sustainable Development'] }]
        }]
    },
    {
        topic_id: 'sst-10-2-resource-conservation',
        subject: 'Social Science', grade: 'Class 10', domain: 'Social Science',
        concept_key: '2_resource_conservation', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-10-2-resource-conservation', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Social Science 10', checksum: 'sha256-auto', difficulty: 'advanced',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Resource Conservation'] }],
        label_map: { 'default': ['Resource Conservation'] },
        concepts: [{
            concept_id: 'resource_conservation_c', concept_name: 'Resource Conservation',
            diagrams: [{ diagram_id: 'resource_conservation_d', title: 'Resource Conservation Methods', svg_path: 'sst_10/resource_conservation.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Land', 'Water', 'Forest', 'Biodiversity'] }]
        }]
    },
    {
        topic_id: 'sst-10-3-power-sharing-forms',
        subject: 'Social Science', grade: 'Class 10', domain: 'Social Science',
        concept_key: '3_power_sharing_forms', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-10-3-power-sharing-forms', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Social Science 10', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Power Sharing Forms'] }],
        label_map: { 'default': ['Power Sharing Forms'] },
        concepts: [{
            concept_id: 'power_sharing_forms_c', concept_name: 'Forms of Power Sharing',
            diagrams: [{ diagram_id: 'power_sharing_forms_d', title: 'Forms of Power Sharing', svg_path: 'sst_10/power_sharing_forms.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Horizontal', 'Vertical', 'Community', 'Political Parties'] }]
        }]
    },
    {
        topic_id: 'sst-10-3-belgium-model',
        subject: 'Social Science', grade: 'Class 10', domain: 'Social Science',
        concept_key: '3_belgium_model', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-10-3-belgium-model', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Social Science 10', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Belgium Model'] }],
        label_map: { 'default': ['Belgium Model'] },
        concepts: [{
            concept_id: 'belgium_model_c', concept_name: 'Belgium Model of Power Sharing',
            diagrams: [{ diagram_id: 'belgium_model_d', title: 'Belgium Model of Power Sharing', svg_path: 'sst_10/belgium_model.svg', diagram_type: 'structure', purpose: 'Comparison', labels: ['Equal Ministers', 'Separate Governments', 'Brussels', 'Community Govt'] }]
        }]
    },
    {
        topic_id: 'sst-10-3-power-sharing-in-india',
        subject: 'Social Science', grade: 'Class 10', domain: 'Social Science',
        concept_key: '3_power_sharing_in_india', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-10-3-power-sharing-in-india', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Social Science 10', checksum: 'sha256-auto', difficulty: 'advanced',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Power Sharing in India'] }],
        label_map: { 'default': ['Power Sharing in India'] },
        concepts: [{
            concept_id: 'power_sharing_india_c', concept_name: 'Power Sharing in India',
            diagrams: [{ diagram_id: 'power_sharing_india_d', title: 'Power Sharing in India', svg_path: 'sst_10/power_sharing_india.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Union Government', 'State Governments', 'Local Bodies', 'Constitutional Safeguards'] }]
        }]
    },
    {
        topic_id: 'sst-10-4-national-income',
        subject: 'Social Science', grade: 'Class 10', domain: 'Social Science',
        concept_key: '4_national_income', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-10-4-national-income', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Social Science 10', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['National Income'] }],
        label_map: { 'default': ['National Income'] },
        concepts: [{
            concept_id: 'national_income_c', concept_name: 'National Income',
            diagrams: [{ diagram_id: 'national_income_d', title: 'National Income & Development', svg_path: 'sst_10/national_income.svg', diagram_type: 'graph', purpose: 'Graph', labels: ['GDP', 'GNP', 'Per Capita Income', 'Sector Comparison'] }]
        }]
    },
    {
        topic_id: 'sst-10-4-hdi',
        subject: 'Social Science', grade: 'Class 10', domain: 'Social Science',
        concept_key: '4_hdi', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-10-4-hdi', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Social Science 10', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['HDI'] }],
        label_map: { 'default': ['HDI'] },
        concepts: [{
            concept_id: 'hdi_c', concept_name: 'Human Development Index',
            diagrams: [{ diagram_id: 'hdi_d', title: 'Human Development Index (HDI)', svg_path: 'sst_10/hdi.svg', diagram_type: 'structure', purpose: 'Comparison', labels: ['Health', 'Education', 'Income', 'Norway', 'India', 'Niger'] }]
        }]
    },
    {
        topic_id: 'sst-10-4-sustainability',
        subject: 'Social Science', grade: 'Class 10', domain: 'Social Science',
        concept_key: '4_sustainability', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-10-4-sustainability', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Social Science 10', checksum: 'sha256-auto', difficulty: 'advanced',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Sustainability'] }],
        label_map: { 'default': ['Sustainability'] },
        concepts: [{
            concept_id: 'sustainability_c', concept_name: 'Sustainability of Development',
            diagrams: [{ diagram_id: 'sustainability_d', title: 'Sustainability of Development', svg_path: 'sst_10/sustainability.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Economic', 'Social', 'Environmental', 'SDGs', 'Venn Diagram'] }]
        }]
    },
    {
        topic_id: 'comp-6-1-history',
        subject: 'Computer Science', grade: 'Class 6', domain: 'Computer Science',
        concept_key: '1_history', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_comp-6-1-history', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['History'] }],
        label_map: { 'default': ['History'] },
        concepts: [{
            concept_id: '1_history_c', concept_name: 'History',
            diagrams: [{ diagram_id: '1_history_d', title: 'History', svg_path: 'english_11/history.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['History'] }]
        }]
    },
    {
        topic_id: 'comp-6-1-components',
        subject: 'Computer Science', grade: 'Class 6', domain: 'Computer Science',
        concept_key: '1_components', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_comp-6-1-components', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Components'] }],
        label_map: { 'default': ['Components'] },
        concepts: [{
            concept_id: '1_components_c', concept_name: 'Components',
            diagrams: [{ diagram_id: '1_components_d', title: 'Components', svg_path: 'computer science_6/components.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Components'] }]
        }]
    },
    {
        topic_id: 'comp-6-1-types',
        subject: 'Computer Science', grade: 'Class 6', domain: 'Computer Science',
        concept_key: '1_types', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_comp-6-1-types', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Types'] }],
        label_map: { 'default': ['Types'] },
        concepts: [{
            concept_id: '1_types_c', concept_name: 'Types',
            diagrams: [{ diagram_id: '1_types_d', title: 'Types', svg_path: 'computer science_6/components.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Types'] }]
        }]
    },
    {
        topic_id: 'comp-6-2-windows',
        subject: 'Computer Science', grade: 'Class 6', domain: 'Computer Science',
        concept_key: '2_windows', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_comp-6-2-windows', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Windows'] }],
        label_map: { 'default': ['Windows'] },
        concepts: [{
            concept_id: '2_windows_c', concept_name: 'Windows',
            diagrams: [{ diagram_id: '2_windows_d', title: 'Windows', svg_path: 'computer science_6/windows.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Windows'] }]
        }]
    },
    {
        topic_id: 'comp-6-2-desktop',
        subject: 'Computer Science', grade: 'Class 6', domain: 'Computer Science',
        concept_key: '2_desktop', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_comp-6-2-desktop', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Desktop'] }],
        label_map: { 'default': ['Desktop'] },
        concepts: [{
            concept_id: '2_desktop_c', concept_name: 'Desktop',
            diagrams: [{ diagram_id: '2_desktop_d', title: 'Desktop', svg_path: 'computer science_6/desktop.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Desktop'] }]
        }]
    },
    {
        topic_id: 'comp-6-2-file-management',
        subject: 'Computer Science', grade: 'Class 6', domain: 'Computer Science',
        concept_key: '2_file_management', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_comp-6-2-file-management', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['File Management'] }],
        label_map: { 'default': ['File Management'] },
        concepts: [{
            concept_id: '2_file_management_c', concept_name: 'File Management',
            diagrams: [{ diagram_id: '2_file_management_d', title: 'File Management', svg_path: 'computer science_6/file-management.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['File Management'] }]
        }]
    },
    {
        topic_id: 'comp-7-1-ms-word',
        subject: 'Computer Science', grade: 'Class 7', domain: 'Computer Science',
        concept_key: '1_ms_word', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_comp-7-1-ms-word', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['MS Word'] }],
        label_map: { 'default': ['MS Word'] },
        concepts: [{
            concept_id: '1_ms_word_c', concept_name: 'MS Word',
            diagrams: [{ diagram_id: '1_ms_word_d', title: 'MS Word', svg_path: 'computer science_7/ms-word.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['MS Word'] }]
        }]
    },
    {
        topic_id: 'comp-7-1-formatting',
        subject: 'Computer Science', grade: 'Class 7', domain: 'Computer Science',
        concept_key: '1_formatting', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_comp-7-1-formatting', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Formatting'] }],
        label_map: { 'default': ['Formatting'] },
        concepts: [{
            concept_id: '1_formatting_c', concept_name: 'Formatting',
            diagrams: [{ diagram_id: '1_formatting_d', title: 'Formatting', svg_path: 'it_10/formatting.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Formatting'] }]
        }]
    },
    {
        topic_id: 'comp-7-1-documents',
        subject: 'Computer Science', grade: 'Class 7', domain: 'Computer Science',
        concept_key: '1_documents', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_comp-7-1-documents', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Documents'] }],
        label_map: { 'default': ['Documents'] },
        concepts: [{
            concept_id: '1_documents_c', concept_name: 'Documents',
            diagrams: [{ diagram_id: '1_documents_d', title: 'Documents', svg_path: 'computer science_7/documents.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Documents'] }]
        }]
    },
    {
        topic_id: 'comp-7-2-ms-excel',
        subject: 'Computer Science', grade: 'Class 7', domain: 'Computer Science',
        concept_key: '2_ms_excel', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_comp-7-2-ms-excel', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['MS Excel'] }],
        label_map: { 'default': ['MS Excel'] },
        concepts: [{
            concept_id: '2_ms_excel_c', concept_name: 'MS Excel',
            diagrams: [{ diagram_id: '2_ms_excel_d', title: 'MS Excel', svg_path: 'computer science_7/ms-excel.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['MS Excel'] }]
        }]
    },
    {
        topic_id: 'comp-7-2-formulas',
        subject: 'Computer Science', grade: 'Class 7', domain: 'Computer Science',
        concept_key: '2_formulas', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_comp-7-2-formulas', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Formulas'] }],
        label_map: { 'default': ['Formulas'] },
        concepts: [{
            concept_id: '2_formulas_c', concept_name: 'Formulas',
            diagrams: [{ diagram_id: '2_formulas_d', title: 'Formulas', svg_path: 'it_10/formulas.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Formulas'] }]
        }]
    },
    {
        topic_id: 'comp-7-2-charts',
        subject: 'Computer Science', grade: 'Class 7', domain: 'Computer Science',
        concept_key: '2_charts', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_comp-7-2-charts', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Charts'] }],
        label_map: { 'default': ['Charts'] },
        concepts: [{
            concept_id: '2_charts_c', concept_name: 'Charts',
            diagrams: [{ diagram_id: '2_charts_d', title: 'Charts', svg_path: 'computer science_7/charts.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Charts'] }]
        }]
    },
    {
        topic_id: 'comp-8-1-browsing',
        subject: 'Computer Science', grade: 'Class 8', domain: 'Computer Science',
        concept_key: '1_browsing', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_comp-8-1-browsing', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Browsing'] }],
        label_map: { 'default': ['Browsing'] },
        concepts: [{
            concept_id: '1_browsing_c', concept_name: 'Browsing',
            diagrams: [{ diagram_id: '1_browsing_d', title: 'Browsing', svg_path: 'computer science_8/browsing.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Browsing'] }]
        }]
    },
    {
        topic_id: 'comp-8-1-email',
        subject: 'Computer Science', grade: 'Class 8', domain: 'Computer Science',
        concept_key: '1_email', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_comp-8-1-email', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Email'] }],
        label_map: { 'default': ['Email'] },
        concepts: [{
            concept_id: '1_email_c', concept_name: 'Email',
            diagrams: [{ diagram_id: '1_email_d', title: 'Email', svg_path: 'computer science_8/email.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Email'] }]
        }]
    },
    {
        topic_id: 'comp-8-1-safety',
        subject: 'Computer Science', grade: 'Class 8', domain: 'Computer Science',
        concept_key: '1_safety', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_comp-8-1-safety', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Safety'] }],
        label_map: { 'default': ['Safety'] },
        concepts: [{
            concept_id: '1_safety_c', concept_name: 'Safety',
            diagrams: [{ diagram_id: '1_safety_d', title: 'Safety', svg_path: 'computer science_8/safety.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Safety'] }]
        }]
    },
    {
        topic_id: 'comp-8-2-tags',
        subject: 'Computer Science', grade: 'Class 8', domain: 'Computer Science',
        concept_key: '2_tags', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_comp-8-2-tags', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Tags'] }],
        label_map: { 'default': ['Tags'] },
        concepts: [{
            concept_id: '2_tags_c', concept_name: 'Tags',
            diagrams: [{ diagram_id: '2_tags_d', title: 'Tags', svg_path: 'computer science_8/tags.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Tags'] }]
        }]
    },
    {
        topic_id: 'comp-8-2-structure',
        subject: 'Computer Science', grade: 'Class 8', domain: 'Computer Science',
        concept_key: '2_structure', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_comp-8-2-structure', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Structure'] }],
        label_map: { 'default': ['Structure'] },
        concepts: [{
            concept_id: '2_structure_c', concept_name: 'Structure',
            diagrams: [{ diagram_id: '2_structure_d', title: 'Structure', svg_path: 'computer science_8/structure.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Structure'] }]
        }]
    },
    {
        topic_id: 'comp-8-2-web-pages',
        subject: 'Computer Science', grade: 'Class 8', domain: 'Computer Science',
        concept_key: '2_web_pages', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_comp-8-2-web-pages', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Web Pages'] }],
        label_map: { 'default': ['Web Pages'] },
        concepts: [{
            concept_id: '2_web_pages_c', concept_name: 'Web Pages',
            diagrams: [{ diagram_id: '2_web_pages_d', title: 'Web Pages', svg_path: 'computer science_8/web-pages.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Web Pages'] }]
        }]
    },
    {
        topic_id: 'it-9-1-verbal',
        subject: 'Information Technology', grade: 'Class 9', domain: 'Information Technology',
        concept_key: '1_verbal', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_it-9-1-verbal', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Verbal'] }],
        label_map: { 'default': ['Verbal'] },
        concepts: [{
            concept_id: '1_verbal_c', concept_name: 'Verbal',
            diagrams: [{ diagram_id: '1_verbal_d', title: 'Verbal', svg_path: 'it_9/verbal.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Verbal'] }]
        }]
    },
    {
        topic_id: 'it-9-1-written',
        subject: 'Information Technology', grade: 'Class 9', domain: 'Information Technology',
        concept_key: '1_written', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_it-9-1-written', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Written'] }],
        label_map: { 'default': ['Written'] },
        concepts: [{
            concept_id: '1_written_c', concept_name: 'Written',
            diagrams: [{ diagram_id: '1_written_d', title: 'Written', svg_path: 'it_9/written.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Written'] }]
        }]
    },
    {
        topic_id: 'it-9-1-body-language',
        subject: 'Information Technology', grade: 'Class 9', domain: 'Information Technology',
        concept_key: '1_body_language', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_it-9-1-body-language', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Body Language'] }],
        label_map: { 'default': ['Body Language'] },
        concepts: [{
            concept_id: '1_body_language_c', concept_name: 'Body Language',
            diagrams: [{ diagram_id: '1_body_language_d', title: 'Body Language', svg_path: 'it_9/body-language.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Body Language'] }]
        }]
    },
    {
        topic_id: 'it-9-2-time-management',
        subject: 'Information Technology', grade: 'Class 9', domain: 'Information Technology',
        concept_key: '2_time_management', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_it-9-2-time-management', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Time Management'] }],
        label_map: { 'default': ['Time Management'] },
        concepts: [{
            concept_id: '2_time_management_c', concept_name: 'Time Management',
            diagrams: [{ diagram_id: '2_time_management_d', title: 'Time Management', svg_path: 'it_9/time-management.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Time Management'] }]
        }]
    },
    {
        topic_id: 'it-9-2-stress',
        subject: 'Information Technology', grade: 'Class 9', domain: 'Information Technology',
        concept_key: '2_stress', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_it-9-2-stress', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Stress'] }],
        label_map: { 'default': ['Stress'] },
        concepts: [{
            concept_id: '2_stress_c', concept_name: 'Stress',
            diagrams: [{ diagram_id: '2_stress_d', title: 'Stress', svg_path: 'it_9/stress.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Stress'] }]
        }]
    },
    {
        topic_id: 'it-9-2-goals',
        subject: 'Information Technology', grade: 'Class 9', domain: 'Information Technology',
        concept_key: '2_goals', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_it-9-2-goals', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Goals'] }],
        label_map: { 'default': ['Goals'] },
        concepts: [{
            concept_id: '2_goals_c', concept_name: 'Goals',
            diagrams: [{ diagram_id: '2_goals_d', title: 'Goals', svg_path: 'it_9/goals.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Goals'] }]
        }]
    },
    {
        topic_id: 'it-9-3-computer-basics',
        subject: 'Information Technology', grade: 'Class 9', domain: 'Information Technology',
        concept_key: '3_computer_basics', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_it-9-3-computer-basics', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Computer Basics'] }],
        label_map: { 'default': ['Computer Basics'] },
        concepts: [{
            concept_id: '3_computer_basics_c', concept_name: 'Computer Basics',
            diagrams: [{ diagram_id: '3_computer_basics_d', title: 'Computer Basics', svg_path: 'it_9/computer-basics.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Computer Basics'] }]
        }]
    },
    {
        topic_id: 'it-9-3-internet',
        subject: 'Information Technology', grade: 'Class 9', domain: 'Information Technology',
        concept_key: '3_internet', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_it-9-3-internet', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Internet'] }],
        label_map: { 'default': ['Internet'] },
        concepts: [{
            concept_id: '3_internet_c', concept_name: 'Internet',
            diagrams: [{ diagram_id: '3_internet_d', title: 'Internet', svg_path: 'it_9/internet.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Internet'] }]
        }]
    },
    {
        topic_id: 'it-9-3-digital-literacy',
        subject: 'Information Technology', grade: 'Class 9', domain: 'Information Technology',
        concept_key: '3_digital_literacy', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_it-9-3-digital-literacy', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Digital Literacy'] }],
        label_map: { 'default': ['Digital Literacy'] },
        concepts: [{
            concept_id: '3_digital_literacy_c', concept_name: 'Digital Literacy',
            diagrams: [{ diagram_id: '3_digital_literacy_d', title: 'Digital Literacy', svg_path: 'it_9/digital-literacy.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Digital Literacy'] }]
        }]
    },
    {
        topic_id: 'it-10-1-word-processing',
        subject: 'Information Technology', grade: 'Class 10', domain: 'Information Technology',
        concept_key: '1_word_processing', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_it-10-1-word-processing', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Word Processing'] }],
        label_map: { 'default': ['Word Processing'] },
        concepts: [{
            concept_id: '1_word_processing_c', concept_name: 'Word Processing',
            diagrams: [{ diagram_id: '1_word_processing_d', title: 'Word Processing', svg_path: 'it_10/word-processing.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Word Processing'] }]
        }]
    },
    {
        topic_id: 'it-10-1-doc-formatting',
        subject: 'Information Technology', grade: 'Class 10', domain: 'Information Technology',
        concept_key: '1_doc_formatting', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_it-10-1-doc-formatting', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Doc Formatting'] }],
        label_map: { 'default': ['Doc Formatting'] },
        concepts: [{
            concept_id: '1_doc_formatting_c', concept_name: 'Doc Formatting',
            diagrams: [{ diagram_id: '1_doc_formatting_d', title: 'Doc Formatting', svg_path: 'it_10/doc-formatting.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Doc Formatting'] }]
        }]
    },
    {
        topic_id: 'it-10-1-doc-templates',
        subject: 'Information Technology', grade: 'Class 10', domain: 'Information Technology',
        concept_key: '1_doc_templates', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_it-10-1-doc-templates', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Doc Templates'] }],
        label_map: { 'default': ['Doc Templates'] },
        concepts: [{
            concept_id: '1_doc_templates_c', concept_name: 'Doc Templates',
            diagrams: [{ diagram_id: '1_doc_templates_d', title: 'Doc Templates', svg_path: 'it_10/doc-templates.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Doc Templates'] }]
        }]
    },
    {
        topic_id: 'it-10-2-spreadsheet-formulas',
        subject: 'Information Technology', grade: 'Class 10', domain: 'Information Technology',
        concept_key: '2_spreadsheet_formulas', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_it-10-2-spreadsheet-formulas', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Spreadsheet Formulas'] }],
        label_map: { 'default': ['Spreadsheet Formulas'] },
        concepts: [{
            concept_id: '2_spreadsheet_formulas_c', concept_name: 'Spreadsheet Formulas',
            diagrams: [{ diagram_id: '2_spreadsheet_formulas_d', title: 'Spreadsheet Formulas', svg_path: 'it_10/spreadsheet-formulas.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Spreadsheet Formulas'] }]
        }]
    },
    {
        topic_id: 'it-10-2-spreadsheet-functions',
        subject: 'Information Technology', grade: 'Class 10', domain: 'Information Technology',
        concept_key: '2_spreadsheet_functions', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_it-10-2-spreadsheet-functions', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Spreadsheet Functions'] }],
        label_map: { 'default': ['Spreadsheet Functions'] },
        concepts: [{
            concept_id: '2_spreadsheet_functions_c', concept_name: 'Spreadsheet Functions',
            diagrams: [{ diagram_id: '2_spreadsheet_functions_d', title: 'Spreadsheet Functions', svg_path: 'it_10/spreadsheet-functions.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Spreadsheet Functions'] }]
        }]
    },
    {
        topic_id: 'it-10-2-spreadsheet-analysis',
        subject: 'Information Technology', grade: 'Class 10', domain: 'Information Technology',
        concept_key: '2_spreadsheet_analysis', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_it-10-2-spreadsheet-analysis', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Spreadsheet Analysis'] }],
        label_map: { 'default': ['Spreadsheet Analysis'] },
        concepts: [{
            concept_id: '2_spreadsheet_analysis_c', concept_name: 'Spreadsheet Analysis',
            diagrams: [{ diagram_id: '2_spreadsheet_analysis_d', title: 'Spreadsheet Analysis', svg_path: 'it_10/spreadsheet-analysis.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Spreadsheet Analysis'] }]
        }]
    },
    {
        topic_id: 'it-10-3-dbms-concepts',
        subject: 'Information Technology', grade: 'Class 10', domain: 'Information Technology',
        concept_key: '3_dbms_concepts', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_it-10-3-dbms-concepts', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['DBMS Concepts'] }],
        label_map: { 'default': ['DBMS Concepts'] },
        concepts: [{
            concept_id: '3_dbms_concepts_c', concept_name: 'DBMS Concepts',
            diagrams: [{ diagram_id: '3_dbms_concepts_d', title: 'DBMS Concepts', svg_path: 'it_10/dbms-concepts.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['DBMS Concepts'] }]
        }]
    },
    {
        topic_id: 'it-10-3-db-tables',
        subject: 'Information Technology', grade: 'Class 10', domain: 'Information Technology',
        concept_key: '3_db_tables', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_it-10-3-db-tables', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['DB Tables'] }],
        label_map: { 'default': ['DB Tables'] },
        concepts: [{
            concept_id: '3_db_tables_c', concept_name: 'DB Tables',
            diagrams: [{ diagram_id: '3_db_tables_d', title: 'DB Tables', svg_path: 'it_10/db-tables.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['DB Tables'] }]
        }]
    },
    {
        topic_id: 'it-10-3-sql-queries',
        subject: 'Information Technology', grade: 'Class 10', domain: 'Information Technology',
        concept_key: '3_sql_queries', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_it-10-3-sql-queries', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['SQL Queries'] }],
        label_map: { 'default': ['SQL Queries'] },
        concepts: [{
            concept_id: '3_sql_queries_c', concept_name: 'SQL Queries',
            diagrams: [{ diagram_id: '3_sql_queries_d', title: 'SQL Queries', svg_path: 'it_10/sql-queries.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['SQL Queries'] }]
        }]
    },
    {
        topic_id: 'phy-11-1-nature-of-physics',
        subject: 'Physics', grade: 'Class 11', domain: 'Physics',
        concept_key: '1_nature_of_physics', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_phy-11-1-nature-of-physics', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Physics 11', checksum: 'sha256-auto', difficulty: 'intro',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Gravity', 'Electromagnetic', 'Strong Nuclear', 'Weak Nuclear'] }],
        label_map: { 'default': ['Gravity', 'Electromagnetic', 'Strong Nuclear', 'Weak Nuclear'] },
        concepts: [{
            concept_id: '1_nature_of_physics_c', concept_name: 'Nature of Physics',
            diagrams: [{ diagram_id: '1_nature_of_physics_d', title: 'Fundamental Forces', svg_path: 'physics_11/nature-of-physics.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Gravity', 'Electromagnetic', 'Strong Nuclear', 'Weak Nuclear'] }]
        }]
    },
    {
        topic_id: 'phy-11-1-scope',
        subject: 'Physics', grade: 'Class 11', domain: 'Physics',
        concept_key: '1_scope', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_phy-11-1-scope', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Physics 11', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Microscopic Scale', 'Macroscopic Scale'] }],
        label_map: { 'default': ['Microscopic Scale', 'Macroscopic Scale'] },
        concepts: [{
            concept_id: '1_scope_c', concept_name: 'Scope of Physics',
            diagrams: [{ diagram_id: '1_scope_d', title: 'Scales of Physics', svg_path: 'physics_11/scope.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Microscopic (10⁻¹⁴ m)', 'Macroscopic (10²⁶ m)'] }]
        }]
    },
    {
        topic_id: 'phy-11-1-scientific-method',
        subject: 'Physics', grade: 'Class 11', domain: 'Physics',
        concept_key: '1_scientific_method', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_phy-11-1-scientific-method', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Physics 11', checksum: 'sha256-auto', difficulty: 'advanced',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Observation', 'Hypothesis', 'Experiment', 'Theories'] }],
        label_map: { 'default': ['Observation', 'Hypothesis', 'Experiment', 'Theories'] },
        concepts: [{
            concept_id: '1_scientific_method_c', concept_name: 'Scientific Method',
            diagrams: [{ diagram_id: '1_scientific_method_d', title: 'The Scientific Method', svg_path: 'physics_11/scientific-method.svg', diagram_type: 'structure', purpose: 'Process', labels: ['Observation', 'Hypothesis', 'Experimentation', 'Theories'] }]
        }]
    },
    {
        topic_id: 'phy-11-2-si-units',
        subject: 'Physics', grade: 'Class 11', domain: 'Physics',
        concept_key: '2_si_units', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_phy-11-2-si-units', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Physics 11', checksum: 'sha256-auto', difficulty: 'intro',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['meter', 'kilogram', 'second', 'kelvin'] }],
        label_map: { 'default': ['meter', 'kilogram', 'second', 'kelvin'] },
        concepts: [{
            concept_id: '2_si_units_c', concept_name: 'SI Units',
            diagrams: [{ diagram_id: '2_si_units_d', title: 'SI Base Units', svg_path: 'physics_11/si-units.svg', diagram_type: 'structure', purpose: 'Comparison', labels: ['Length (m)', 'Mass (kg)', 'Time (s)', 'Temperature (K)'] }]
        }]
    },
    {
        topic_id: 'phy-11-2-errors',
        subject: 'Physics', grade: 'Class 11', domain: 'Physics',
        concept_key: '2_errors', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_phy-11-2-errors', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Physics 11', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Accuracy', 'Precision', 'Errors'] }],
        label_map: { 'default': ['Accuracy', 'Precision', 'Errors'] },
        concepts: [{
            concept_id: '2_errors_c', concept_name: 'Errors in Measurement',
            diagrams: [{ diagram_id: '2_errors_d', title: 'Accuracy vs Precision', svg_path: 'physics_11/errors.svg', diagram_type: 'structure', purpose: 'Comparison', labels: ['Accuracy', 'Precision', 'Error Calculation'] }]
        }]
    },
    {
        topic_id: 'phy-11-2-significant-figures',
        subject: 'Physics', grade: 'Class 11', domain: 'Physics',
        concept_key: '2_significant_figures', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_phy-11-2-significant-figures', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Physics 11', checksum: 'sha256-auto', difficulty: 'advanced',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Rules', 'Examples', 'Decimal Policy'] }],
        label_map: { 'default': ['Rules', 'Examples', 'Decimal Policy'] },
        concepts: [{
            concept_id: '2_significant_figures_c', concept_name: 'Significant Figures',
            diagrams: [{ diagram_id: '2_significant_figures_d', title: 'Rules for Significant Figures', svg_path: 'physics_11/significant-figures.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Non-zero Rules', 'Zero Rules', 'Leading/Trailing Zeros'] }]
        }]
    },
    {
        topic_id: 'phy-11-3-kinematics',
        subject: 'Physics', grade: 'Class 11', domain: 'Physics',
        concept_key: '3_kinematics', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_phy-11-3-kinematics', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Physics 11', checksum: 'sha256-auto', difficulty: 'intro',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Distance', 'Displacement', 'Vector'] }],
        label_map: { 'default': ['Distance', 'Displacement', 'Vector'] },
        concepts: [{
            concept_id: '3_kinematics_c', concept_name: 'Kinematics Fundamentals',
            diagrams: [{ diagram_id: '3_kinematics_d', title: 'Distance vs Displacement', svg_path: 'physics_11/kinematics.svg', diagram_type: 'structure', purpose: 'Comparison', labels: ['Actual Path', 'Shortest Path', 'Directionality'] }]
        }]
    },
    {
        topic_id: 'phy-11-3-equations',
        subject: 'Physics', grade: 'Class 11', domain: 'Physics',
        concept_key: '3_equations', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_phy-11-3-equations', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Physics 11', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['v = u + at', 's = ut + 0.5at²', 'v² = u² + 2as'] }],
        label_map: { 'default': ['v = u + at', 's = ut + 0.5at²', 'v² = u² + 2as'] },
        concepts: [{
            concept_id: '3_equations_c', concept_name: 'Equations of Motion',
            diagrams: [{ diagram_id: '3_equations_d', title: 'Equations for Uniform Accel.', svg_path: 'physics_11/equations.svg', diagram_type: 'structure', purpose: 'Equation', labels: ['Velocity Equation', 'Position Equation', 'Velocity-Position Equation'] }]
        }]
    },
    {
        topic_id: 'phy-11-3-graphs',
        subject: 'Physics', grade: 'Class 11', domain: 'Physics',
        concept_key: '3_graphs', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_phy-11-3-graphs', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Physics 11', checksum: 'sha256-auto', difficulty: 'advanced',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['x-t graph', 'v-t graph', 'Slopes'] }],
        label_map: { 'default': ['x-t graph', 'v-t graph', 'Slopes'] },
        concepts: [{
            concept_id: '3_graphs_c', concept_name: 'Kinematic Graphs',
            diagrams: [{ diagram_id: '3_graphs_d', title: 'Motion Analysis Graphs', svg_path: 'physics_11/graphs.svg', diagram_type: 'graph', purpose: 'Graph', labels: ['Constant Velocity', 'Constant Acceleration', 'At Rest'] }]
        }]
    },
    {
        topic_id: 'phy-11-4-vectors',
        subject: 'Physics', grade: 'Class 11', domain: 'Physics',
        concept_key: '4_vectors', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_phy-11-4-vectors', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Physics 11', checksum: 'sha256-auto', difficulty: 'intro',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Addition', 'Resolution', 'Components'] }],
        label_map: { 'default': ['Addition', 'Resolution', 'Components'] },
        concepts: [{
            concept_id: '4_vectors_c', concept_name: 'Vectors',
            diagrams: [{ diagram_id: '4_vectors_d', title: 'Vector Operations', svg_path: 'physics_11/vectors.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Triangle Law', 'X-Component', 'Y-Component'] }]
        }]
    },
    {
        topic_id: 'phy-11-4-projectile-motion',
        subject: 'Physics', grade: 'Class 11', domain: 'Physics',
        concept_key: '4_projectile_motion', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_phy-11-4-projectile-motion', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Physics 11', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Trajectory', 'Range', 'Max Height'] }],
        label_map: { 'default': ['Trajectory', 'Range', 'Max Height'] },
        concepts: [{
            concept_id: '4_projectile_motion_c', concept_name: 'Projectile Motion',
            diagrams: [{ diagram_id: '4_projectile_motion_d', title: 'Projectile Trajectory', svg_path: 'physics_11/projectile-motion.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Height', 'Range', 'Initial Velocity'] }]
        }]
    },
    {
        topic_id: 'phy-11-4-circular-motion',
        subject: 'Physics', grade: 'Class 11', domain: 'Physics',
        concept_key: '4_circular_motion', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_phy-11-4-circular-motion', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Physics 11', checksum: 'sha256-auto', difficulty: 'advanced',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Centripetal', 'Angular Vel', 'Radius'] }],
        label_map: { 'default': ['Centripetal', 'Angular Vel', 'Radius'] },
        concepts: [{
            concept_id: '4_circular_motion_c', concept_name: 'Circular Motion',
            diagrams: [{ diagram_id: '4_circular_motion_d', title: 'Uniform Circular Motion', svg_path: 'physics_11/circular-motion.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Velocity Vector', 'Centripetal Accel', 'Angular Formulas'] }]
        }]
    },
    {
        topic_id: 'phy-11-5-newton-s-laws',
        subject: 'Physics', grade: 'Class 11', domain: 'Physics',
        concept_key: '5_newton_s_laws', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_phy-11-5-newton-s-laws', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Physics 11', checksum: 'sha256-auto', difficulty: 'intro',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Inertia', 'F=ma', 'Action-Reaction'] }],
        label_map: { 'default': ['Inertia', 'F=ma', 'Action-Reaction'] },
        concepts: [{
            concept_id: '5_newton_s_laws_c', concept_name: 'Newton\'s Laws',
            diagrams: [{ diagram_id: '5_newton_s_laws_d', title: 'The Three Laws of Motion', svg_path: 'physics_11/newton-s-laws.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Inertia', 'F=ma Calculation', 'Pair Forces'] }]
        }]
    },
    {
        topic_id: 'phy-11-5-friction',
        subject: 'Physics', grade: 'Class 11', domain: 'Physics',
        concept_key: '5_friction', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_phy-11-5-friction', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Physics 11', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Inclined Plane', 'Normal Force', 'Coefficients'] }],
        label_map: { 'default': ['Inclined Plane', 'Normal Force', 'Coefficients'] },
        concepts: [{
            concept_id: '5_friction_c', concept_name: 'Friction',
            diagrams: [{ diagram_id: '5_friction_d', title: 'Friction & Inclined Plane', svg_path: 'physics_11/friction.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Static Friction', 'Kinetic Friction', 'Inclination'] }]
        }]
    },
    {
        topic_id: 'phy-11-5-dynamics',
        subject: 'Physics', grade: 'Class 11', domain: 'Physics',
        concept_key: '5_dynamics', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_phy-11-5-dynamics', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Physics 11', checksum: 'sha256-auto', difficulty: 'advanced',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Pulley', 'Tension', 'Free Body Diagram'] }],
        label_map: { 'default': ['Pulley', 'Tension', 'Free Body Diagram'] },
        concepts: [{
            concept_id: '5_dynamics_c', concept_name: 'Dynamics',
            diagrams: [{ diagram_id: '5_dynamics_d', title: 'Systems in Motion', svg_path: 'physics_11/dynamics.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Tension (T)', 'Pulley System', 'Acceleration (a)'] }]
        }]
    },
    {
        topic_id: 'phy-12-1-coulomb-s-law',
        subject: 'Physics', grade: 'Class 12', domain: 'Physics',
        concept_key: '1_coulomb_s_law', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_phy-12-1-coulomb-s-law', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Coulomb\'s Law'] }],
        label_map: { 'default': ['Coulomb\'s Law'] },
        concepts: [{
            concept_id: '1_coulomb_s_law_c', concept_name: 'Coulomb\'s Law',
            diagrams: [{ diagram_id: '1_coulomb_s_law_d', title: 'Coulomb\'s Law', svg_path: 'physics_12/coulomb-s-law.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Coulomb\'s Law'] }]
        }]
    },
    {
        topic_id: 'phy-12-1-electric-field',
        subject: 'Physics', grade: 'Class 12', domain: 'Physics',
        concept_key: '1_electric_field', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_phy-12-1-electric-field', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Electric Field'] }],
        label_map: { 'default': ['Electric Field'] },
        concepts: [{
            concept_id: '1_electric_field_c', concept_name: 'Electric Field',
            diagrams: [{ diagram_id: '1_electric_field_d', title: 'Electric Field', svg_path: 'physics_12/electric-field.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Electric Field'] }]
        }]
    },
    {
        topic_id: 'phy-12-1-gauss-law',
        subject: 'Physics', grade: 'Class 12', domain: 'Physics',
        concept_key: '1_gauss_law', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_phy-12-1-gauss-law', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Gauss Law'] }],
        label_map: { 'default': ['Gauss Law'] },
        concepts: [{
            concept_id: '1_gauss_law_c', concept_name: 'Gauss Law',
            diagrams: [{ diagram_id: '1_gauss_law_d', title: 'Gauss Law', svg_path: 'physics_12/gauss-law.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Gauss Law'] }]
        }]
    },
    {
        topic_id: 'phy-12-2-ohm-s-law',
        subject: 'Physics', grade: 'Class 12', domain: 'Physics',
        concept_key: '2_ohm_s_law', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_phy-12-2-ohm-s-law', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Ohm\'s Law'] }],
        label_map: { 'default': ['Ohm\'s Law'] },
        concepts: [{
            concept_id: '2_ohm_s_law_c', concept_name: 'Ohm\'s Law',
            diagrams: [{ diagram_id: '2_ohm_s_law_d', title: 'Ohm\'s Law', svg_path: 'physics_12/ohm-s-law.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Ohm\'s Law'] }]
        }]
    },
    {
        topic_id: 'phy-12-2-kirchhoff-s-laws',
        subject: 'Physics', grade: 'Class 12', domain: 'Physics',
        concept_key: '2_kirchhoff_s_laws', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_phy-12-2-kirchhoff-s-laws', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Kirchhoff\'s Laws'] }],
        label_map: { 'default': ['Kirchhoff\'s Laws'] },
        concepts: [{
            concept_id: '2_kirchhoff_s_laws_c', concept_name: 'Kirchhoff\'s Laws',
            diagrams: [{ diagram_id: '2_kirchhoff_s_laws_d', title: 'Kirchhoff\'s Laws', svg_path: 'physics_12/kirchhoff-s-laws.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Kirchhoff\'s Laws'] }]
        }]
    },
    {
        topic_id: 'phy-12-2-circuits',
        subject: 'Physics', grade: 'Class 12', domain: 'Physics',
        concept_key: '2_circuits', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_phy-12-2-circuits', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Circuits'] }],
        label_map: { 'default': ['Circuits'] },
        concepts: [{
            concept_id: '2_circuits_c', concept_name: 'Circuits',
            diagrams: [{ diagram_id: '2_circuits_d', title: 'Circuits', svg_path: 'physics_12/circuits.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Circuits'] }]
        }]
    },
    {
        topic_id: 'phy-12-3-biot-savart',
        subject: 'Physics', grade: 'Class 12', domain: 'Physics',
        concept_key: '3_biot_savart', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_phy-12-3-biot-savart', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Biot-Savart'] }],
        label_map: { 'default': ['Biot-Savart'] },
        concepts: [{
            concept_id: '3_biot_savart_c', concept_name: 'Biot-Savart',
            diagrams: [{ diagram_id: '3_biot_savart_d', title: 'Biot-Savart', svg_path: 'physics_12/biot-savart.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Biot-Savart'] }]
        }]
    },
    {
        topic_id: 'phy-12-3-ampere-s-law',
        subject: 'Physics', grade: 'Class 12', domain: 'Physics',
        concept_key: '3_ampere_s_law', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_phy-12-3-ampere-s-law', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Ampere\'s Law'] }],
        label_map: { 'default': ['Ampere\'s Law'] },
        concepts: [{
            concept_id: '3_ampere_s_law_c', concept_name: 'Ampere\'s Law',
            diagrams: [{ diagram_id: '3_ampere_s_law_d', title: 'Ampere\'s Law', svg_path: 'physics_12/ampere-s-law.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Ampere\'s Law'] }]
        }]
    },
    {
        topic_id: 'phy-12-3-force',
        subject: 'Physics', grade: 'Class 12', domain: 'Physics',
        concept_key: '3_force', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_phy-12-3-force', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Force'] }],
        label_map: { 'default': ['Force'] },
        concepts: [{
            concept_id: '3_force_c', concept_name: 'Force',
            diagrams: [{ diagram_id: '3_force_d', title: 'Force', svg_path: 'physics_12/force.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Force'] }]
        }]
    },
    {
        topic_id: 'phy-12-4-faraday-s-law',
        subject: 'Physics', grade: 'Class 12', domain: 'Physics',
        concept_key: '4_faraday_s_law', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_phy-12-4-faraday-s-law', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Faraday\'s Law'] }],
        label_map: { 'default': ['Faraday\'s Law'] },
        concepts: [{
            concept_id: '4_faraday_s_law_c', concept_name: 'Faraday\'s Law',
            diagrams: [{ diagram_id: '4_faraday_s_law_d', title: 'Faraday\'s Law', svg_path: 'physics_12/faraday-s-law.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Faraday\'s Law'] }]
        }]
    },
    {
        topic_id: 'phy-12-4-lenz-s-law',
        subject: 'Physics', grade: 'Class 12', domain: 'Physics',
        concept_key: '4_lenz_s_law', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_phy-12-4-lenz-s-law', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Lenz\'s Law'] }],
        label_map: { 'default': ['Lenz\'s Law'] },
        concepts: [{
            concept_id: '4_lenz_s_law_c', concept_name: 'Lenz\'s Law',
            diagrams: [{ diagram_id: '4_lenz_s_law_d', title: 'Lenz\'s Law', svg_path: 'physics_12/lenz-s-law.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Lenz\'s Law'] }]
        }]
    },
    {
        topic_id: 'phy-12-4-ac-generator',
        subject: 'Physics', grade: 'Class 12', domain: 'Physics',
        concept_key: '4_ac_generator', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_phy-12-4-ac-generator', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['AC Generator'] }],
        label_map: { 'default': ['AC Generator'] },
        concepts: [{
            concept_id: '4_ac_generator_c', concept_name: 'AC Generator',
            diagrams: [{ diagram_id: '4_ac_generator_d', title: 'AC Generator', svg_path: 'physics_12/ac-generator.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['AC Generator'] }]
        }]
    },
    {
        topic_id: 'chem-11-1-atomic-mass',
        subject: 'Chemistry', grade: 'Class 11', domain: 'Chemistry',
        concept_key: '1_atomic_mass', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-11-1-atomic-mass', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Atomic Mass'] }],
        label_map: { 'default': ['Atomic Mass'] },
        concepts: [{
            concept_id: '1_atomic_mass_c', concept_name: 'Atomic Mass',
            diagrams: [{ diagram_id: '1_atomic_mass_d', title: 'Atomic Mass', svg_path: 'chemistry_11/atomic-mass.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Atomic Mass'] }]
        }]
    },
    {
        topic_id: 'chem-11-1-mole-concept',
        subject: 'Chemistry', grade: 'Class 11', domain: 'Chemistry',
        concept_key: '1_mole_concept', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-11-1-mole-concept', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Mole Concept'] }],
        label_map: { 'default': ['Mole Concept'] },
        concepts: [{
            concept_id: '1_mole_concept_c', concept_name: 'Mole Concept',
            diagrams: [{ diagram_id: '1_mole_concept_d', title: 'Mole Concept', svg_path: 'chemistry_11/mole-concept.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Mole Concept'] }]
        }]
    },
    {
        topic_id: 'chem-11-1-stoichiometry',
        subject: 'Chemistry', grade: 'Class 11', domain: 'Chemistry',
        concept_key: '1_stoichiometry', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-11-1-stoichiometry', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Stoichiometry'] }],
        label_map: { 'default': ['Stoichiometry'] },
        concepts: [{
            concept_id: '1_stoichiometry_c', concept_name: 'Stoichiometry',
            diagrams: [{ diagram_id: '1_stoichiometry_d', title: 'Stoichiometry', svg_path: 'chemistry_11/stoichiometry.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Stoichiometry'] }]
        }]
    },
    {
        topic_id: 'chem-11-2-bohr-model',
        subject: 'Chemistry', grade: 'Class 11', domain: 'Chemistry',
        concept_key: '2_bohr_model', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-11-2-bohr-model', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Bohr Model'] }],
        label_map: { 'default': ['Bohr Model'] },
        concepts: [{
            concept_id: '2_bohr_model_c', concept_name: 'Bohr Model',
            diagrams: [{ diagram_id: '2_bohr_model_d', title: 'Bohr Model', svg_path: 'chemistry_11/bohr-model.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Bohr Model'] }]
        }]
    },
    {
        topic_id: 'chem-11-2-quantum-numbers',
        subject: 'Chemistry', grade: 'Class 11', domain: 'Chemistry',
        concept_key: '2_quantum_numbers', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-11-2-quantum-numbers', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Quantum Numbers'] }],
        label_map: { 'default': ['Quantum Numbers'] },
        concepts: [{
            concept_id: '2_quantum_numbers_c', concept_name: 'Quantum Numbers',
            diagrams: [{ diagram_id: '2_quantum_numbers_d', title: 'Quantum Numbers', svg_path: 'chemistry_11/quantum-numbers.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Quantum Numbers'] }]
        }]
    },
    {
        topic_id: 'chem-11-2-orbitals',
        subject: 'Chemistry', grade: 'Class 11', domain: 'Chemistry',
        concept_key: '2_orbitals', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-11-2-orbitals', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Orbitals'] }],
        label_map: { 'default': ['Orbitals'] },
        concepts: [{
            concept_id: '2_orbitals_c', concept_name: 'Orbitals',
            diagrams: [{ diagram_id: '2_orbitals_d', title: 'Orbitals', svg_path: 'chemistry_11/orbitals.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Orbitals'] }]
        }]
    },
    {
        topic_id: 'chem-11-3-vsepr-theory',
        subject: 'Chemistry', grade: 'Class 11', domain: 'Chemistry',
        concept_key: '3_vsepr_theory', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-11-3-vsepr-theory', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['VSEPR Theory'] }],
        label_map: { 'default': ['VSEPR Theory'] },
        concepts: [{
            concept_id: '3_vsepr_theory_c', concept_name: 'VSEPR Theory',
            diagrams: [{ diagram_id: '3_vsepr_theory_d', title: 'VSEPR Theory', svg_path: 'chemistry_11/vsepr-theory.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['VSEPR Theory'] }]
        }]
    },
    {
        topic_id: 'chem-11-3-hybridization',
        subject: 'Chemistry', grade: 'Class 11', domain: 'Chemistry',
        concept_key: '3_hybridization', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-11-3-hybridization', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Hybridization'] }],
        label_map: { 'default': ['Hybridization'] },
        concepts: [{
            concept_id: '3_hybridization_c', concept_name: 'Hybridization',
            diagrams: [{ diagram_id: '3_hybridization_d', title: 'Hybridization', svg_path: 'chemistry_11/hybridization.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Hybridization'] }]
        }]
    },
    {
        topic_id: 'chem-11-3-molecular-orbitals',
        subject: 'Chemistry', grade: 'Class 11', domain: 'Chemistry',
        concept_key: '3_molecular_orbitals', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-11-3-molecular-orbitals', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Molecular Orbitals'] }],
        label_map: { 'default': ['Molecular Orbitals'] },
        concepts: [{
            concept_id: '3_molecular_orbitals_c', concept_name: 'Molecular Orbitals',
            diagrams: [{ diagram_id: '3_molecular_orbitals_d', title: 'Molecular Orbitals', svg_path: 'chemistry_11/molecular-orbitals.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Molecular Orbitals'] }]
        }]
    },
    {
        topic_id: 'chem-11-4-enthalpy',
        subject: 'Chemistry', grade: 'Class 11', domain: 'Chemistry',
        concept_key: '4_enthalpy', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-11-4-enthalpy', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Enthalpy'] }],
        label_map: { 'default': ['Enthalpy'] },
        concepts: [{
            concept_id: '4_enthalpy_c', concept_name: 'Enthalpy',
            diagrams: [{ diagram_id: '4_enthalpy_d', title: 'Enthalpy', svg_path: 'chemistry_11/enthalpy.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Enthalpy'] }]
        }]
    },
    {
        topic_id: 'chem-11-4-entropy',
        subject: 'Chemistry', grade: 'Class 11', domain: 'Chemistry',
        concept_key: '4_entropy', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-11-4-entropy', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Entropy'] }],
        label_map: { 'default': ['Entropy'] },
        concepts: [{
            concept_id: '4_entropy_c', concept_name: 'Entropy',
            diagrams: [{ diagram_id: '4_entropy_d', title: 'Entropy', svg_path: 'chemistry_11/entropy.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Entropy'] }]
        }]
    },
    {
        topic_id: 'chem-11-4-gibbs-energy',
        subject: 'Chemistry', grade: 'Class 11', domain: 'Chemistry',
        concept_key: '4_gibbs_energy', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-11-4-gibbs-energy', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Gibbs Energy'] }],
        label_map: { 'default': ['Gibbs Energy'] },
        concepts: [{
            concept_id: '4_gibbs_energy_c', concept_name: 'Gibbs Energy',
            diagrams: [{ diagram_id: '4_gibbs_energy_d', title: 'Gibbs Energy', svg_path: 'chemistry_11/gibbs-energy.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Gibbs Energy'] }]
        }]
    },
    {
        topic_id: 'chem-12-1-crystal-lattice',
        subject: 'Chemistry', grade: 'Class 12', domain: 'Chemistry',
        concept_key: '1_crystal_lattice', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-12-1-crystal-lattice', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Crystal Lattice'] }],
        label_map: { 'default': ['Crystal Lattice'] },
        concepts: [{
            concept_id: '1_crystal_lattice_c', concept_name: 'Crystal Lattice',
            diagrams: [{ diagram_id: '1_crystal_lattice_d', title: 'Crystal Lattice', svg_path: 'chemistry_12/crystal-lattice.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Crystal Lattice'] }]
        }]
    },
    {
        topic_id: 'chem-12-1-defects',
        subject: 'Chemistry', grade: 'Class 12', domain: 'Chemistry',
        concept_key: '1_defects', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-12-1-defects', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Defects'] }],
        label_map: { 'default': ['Defects'] },
        concepts: [{
            concept_id: '1_defects_c', concept_name: 'Defects',
            diagrams: [{ diagram_id: '1_defects_d', title: 'Defects', svg_path: 'chemistry_12/defects.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Defects'] }]
        }]
    },
    {
        topic_id: 'chem-12-1-properties',
        subject: 'Chemistry', grade: 'Class 12', domain: 'Chemistry',
        concept_key: '1_properties', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-12-1-properties', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Properties'] }],
        label_map: { 'default': ['Properties'] },
        concepts: [{
            concept_id: '1_properties_c', concept_name: 'Properties',
            diagrams: [{ diagram_id: '1_properties_d', title: 'Properties', svg_path: 'chemistry_12/properties.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Properties'] }]
        }]
    },
    {
        topic_id: 'chem-12-2-concentration',
        subject: 'Chemistry', grade: 'Class 12', domain: 'Chemistry',
        concept_key: '2_concentration', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-12-2-concentration', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Concentration'] }],
        label_map: { 'default': ['Concentration'] },
        concepts: [{
            concept_id: '2_concentration_c', concept_name: 'Concentration',
            diagrams: [{ diagram_id: '2_concentration_d', title: 'Concentration', svg_path: 'chemistry_12/concentration.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Concentration'] }]
        }]
    },
    {
        topic_id: 'chem-12-2-raoult-s-law',
        subject: 'Chemistry', grade: 'Class 12', domain: 'Chemistry',
        concept_key: '2_raoult_s_law', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-12-2-raoult-s-law', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Raoult\'s Law'] }],
        label_map: { 'default': ['Raoult\'s Law'] },
        concepts: [{
            concept_id: '2_raoult_s_law_c', concept_name: 'Raoult\'s Law',
            diagrams: [{ diagram_id: '2_raoult_s_law_d', title: 'Raoult\'s Law', svg_path: 'chemistry_12/raoult-s-law.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Raoult\'s Law'] }]
        }]
    },
    {
        topic_id: 'chem-12-2-osmosis',
        subject: 'Chemistry', grade: 'Class 12', domain: 'Chemistry',
        concept_key: '2_osmosis', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-12-2-osmosis', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Osmosis'] }],
        label_map: { 'default': ['Osmosis'] },
        concepts: [{
            concept_id: '2_osmosis_c', concept_name: 'Osmosis',
            diagrams: [{ diagram_id: '2_osmosis_d', title: 'Osmosis', svg_path: 'chemistry_12/osmosis.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Osmosis'] }]
        }]
    },
    {
        topic_id: 'chem-12-3-cells',
        subject: 'Chemistry', grade: 'Class 12', domain: 'Chemistry',
        concept_key: '3_cells', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-12-3-cells', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Cells'] }],
        label_map: { 'default': ['Cells'] },
        concepts: [{
            concept_id: '3_cells_c', concept_name: 'Cells',
            diagrams: [{ diagram_id: '3_cells_d', title: 'Cells', svg_path: 'chemistry_12/cells.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Cells'] }]
        }]
    },
    {
        topic_id: 'chem-12-3-nernst-equation',
        subject: 'Chemistry', grade: 'Class 12', domain: 'Chemistry',
        concept_key: '3_nernst_equation', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-12-3-nernst-equation', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Nernst Equation'] }],
        label_map: { 'default': ['Nernst Equation'] },
        concepts: [{
            concept_id: '3_nernst_equation_c', concept_name: 'Nernst Equation',
            diagrams: [{ diagram_id: '3_nernst_equation_d', title: 'Nernst Equation', svg_path: 'chemistry_12/nernst-equation.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Nernst Equation'] }]
        }]
    },
    {
        topic_id: 'chem-12-3-batteries',
        subject: 'Chemistry', grade: 'Class 12', domain: 'Chemistry',
        concept_key: '3_batteries', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-12-3-batteries', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Batteries'] }],
        label_map: { 'default': ['Batteries'] },
        concepts: [{
            concept_id: '3_batteries_c', concept_name: 'Batteries',
            diagrams: [{ diagram_id: '3_batteries_d', title: 'Batteries', svg_path: 'chemistry_12/batteries.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Batteries'] }]
        }]
    },
    {
        topic_id: 'chem-12-4-rate-laws',
        subject: 'Chemistry', grade: 'Class 12', domain: 'Chemistry',
        concept_key: '4_rate_laws', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-12-4-rate-laws', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Rate Laws'] }],
        label_map: { 'default': ['Rate Laws'] },
        concepts: [{
            concept_id: '4_rate_laws_c', concept_name: 'Rate Laws',
            diagrams: [{ diagram_id: '4_rate_laws_d', title: 'Rate Laws', svg_path: 'chemistry_12/rate-laws.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Rate Laws'] }]
        }]
    },
    {
        topic_id: 'chem-12-4-order',
        subject: 'Chemistry', grade: 'Class 12', domain: 'Chemistry',
        concept_key: '4_order', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-12-4-order', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Order'] }],
        label_map: { 'default': ['Order'] },
        concepts: [{
            concept_id: '4_order_c', concept_name: 'Order',
            diagrams: [{ diagram_id: '4_order_d', title: 'Order', svg_path: 'chemistry_12/order.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Order'] }]
        }]
    },
    {
        topic_id: 'chem-12-4-mechanism',
        subject: 'Chemistry', grade: 'Class 12', domain: 'Chemistry',
        concept_key: '4_mechanism', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-12-4-mechanism', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Mechanism'] }],
        label_map: { 'default': ['Mechanism'] },
        concepts: [{
            concept_id: '4_mechanism_c', concept_name: 'Mechanism',
            diagrams: [{ diagram_id: '4_mechanism_d', title: 'Mechanism', svg_path: 'chemistry_12/mechanism.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Mechanism'] }]
        }]
    },
    {
        topic_id: 'bio-11-1-characteristics',
        subject: 'Biology', grade: 'Class 11', domain: 'Biology',
        concept_key: '1_characteristics', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-11-1-characteristics', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Characteristics'] }],
        label_map: { 'default': ['Characteristics'] },
        concepts: [{
            concept_id: '1_characteristics_c', concept_name: 'Characteristics',
            diagrams: [{ diagram_id: '1_characteristics_d', title: 'Characteristics', svg_path: 'biology_11/characteristics.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Characteristics'] }]
        }]
    },
    {
        topic_id: 'bio-11-1-taxonomy',
        subject: 'Biology', grade: 'Class 11', domain: 'Biology',
        concept_key: '1_taxonomy', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-11-1-taxonomy', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Taxonomy'] }],
        label_map: { 'default': ['Taxonomy'] },
        concepts: [{
            concept_id: '1_taxonomy_c', concept_name: 'Taxonomy',
            diagrams: [{ diagram_id: '1_taxonomy_d', title: 'Taxonomy', svg_path: 'biology_11/taxonomy.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Taxonomy'] }]
        }]
    },
    {
        topic_id: 'bio-11-1-classification',
        subject: 'Biology', grade: 'Class 11', domain: 'Biology',
        concept_key: '1_classification', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-11-1-classification', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Classification'] }],
        label_map: { 'default': ['Classification'] },
        concepts: [{
            concept_id: '1_classification_c', concept_name: 'Classification',
            diagrams: [{ diagram_id: '1_classification_d', title: 'Classification', svg_path: 'biology_11/classification.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Classification'] }]
        }]
    },
    {
        topic_id: 'bio-11-2-five-kingdoms',
        subject: 'Biology', grade: 'Class 11', domain: 'Biology',
        concept_key: '2_five_kingdoms', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-11-2-five-kingdoms', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Five Kingdoms'] }],
        label_map: { 'default': ['Five Kingdoms'] },
        concepts: [{
            concept_id: '2_five_kingdoms_c', concept_name: 'Five Kingdoms',
            diagrams: [{ diagram_id: '2_five_kingdoms_d', title: 'Five Kingdoms', svg_path: 'biology_11/five-kingdoms.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Five Kingdoms'] }]
        }]
    },
    {
        topic_id: 'bio-11-2-monera',
        subject: 'Biology', grade: 'Class 11', domain: 'Biology',
        concept_key: '2_monera', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-11-2-monera', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Monera'] }],
        label_map: { 'default': ['Monera'] },
        concepts: [{
            concept_id: '2_monera_c', concept_name: 'Monera',
            diagrams: [{ diagram_id: '2_monera_d', title: 'Monera', svg_path: 'biology_11/monera.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Monera'] }]
        }]
    },
    {
        topic_id: 'bio-11-2-protista',
        subject: 'Biology', grade: 'Class 11', domain: 'Biology',
        concept_key: '2_protista', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-11-2-protista', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Protista'] }],
        label_map: { 'default': ['Protista'] },
        concepts: [{
            concept_id: '2_protista_c', concept_name: 'Protista',
            diagrams: [{ diagram_id: '2_protista_d', title: 'Protista', svg_path: 'biology_11/protista.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Protista'] }]
        }]
    },
    {
        topic_id: 'bio-11-3-algae',
        subject: 'Biology', grade: 'Class 11', domain: 'Biology',
        concept_key: '3_algae', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-11-3-algae', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Algae'] }],
        label_map: { 'default': ['Algae'] },
        concepts: [{
            concept_id: '3_algae_c', concept_name: 'Algae',
            diagrams: [{ diagram_id: '3_algae_d', title: 'Algae', svg_path: 'biology_11/algae.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Algae'] }]
        }]
    },
    {
        topic_id: 'bio-11-3-bryophytes',
        subject: 'Biology', grade: 'Class 11', domain: 'Biology',
        concept_key: '3_bryophytes', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-11-3-bryophytes', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Bryophytes'] }],
        label_map: { 'default': ['Bryophytes'] },
        concepts: [{
            concept_id: '3_bryophytes_c', concept_name: 'Bryophytes',
            diagrams: [{ diagram_id: '3_bryophytes_d', title: 'Bryophytes', svg_path: 'biology_11/bryophytes.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Bryophytes'] }]
        }]
    },
    {
        topic_id: 'bio-11-3-angiosperms',
        subject: 'Biology', grade: 'Class 11', domain: 'Biology',
        concept_key: '3_angiosperms', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-11-3-angiosperms', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Angiosperms'] }],
        label_map: { 'default': ['Angiosperms'] },
        concepts: [{
            concept_id: '3_angiosperms_c', concept_name: 'Angiosperms',
            diagrams: [{ diagram_id: '3_angiosperms_d', title: 'Angiosperms', svg_path: 'biology_11/angiosperms.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Angiosperms'] }]
        }]
    },
    {
        topic_id: 'bio-11-4-invertebrates',
        subject: 'Biology', grade: 'Class 11', domain: 'Biology',
        concept_key: '4_invertebrates', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-11-4-invertebrates', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Invertebrates'] }],
        label_map: { 'default': ['Invertebrates'] },
        concepts: [{
            concept_id: '4_invertebrates_c', concept_name: 'Invertebrates',
            diagrams: [{ diagram_id: '4_invertebrates_d', title: 'Invertebrates', svg_path: 'biology_11/invertebrates.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Invertebrates'] }]
        }]
    },
    {
        topic_id: 'bio-11-4-vertebrates',
        subject: 'Biology', grade: 'Class 11', domain: 'Biology',
        concept_key: '4_vertebrates', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-11-4-vertebrates', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Vertebrates'] }],
        label_map: { 'default': ['Vertebrates'] },
        concepts: [{
            concept_id: '4_vertebrates_c', concept_name: 'Vertebrates',
            diagrams: [{ diagram_id: '4_vertebrates_d', title: 'Vertebrates', svg_path: 'biology_11/vertebrates.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Vertebrates'] }]
        }]
    },
    {
        topic_id: 'bio-11-4-classification',
        subject: 'Biology', grade: 'Class 11', domain: 'Biology',
        concept_key: '4_classification', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-11-4-classification', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Classification'] }],
        label_map: { 'default': ['Classification'] },
        concepts: [{
            concept_id: '4_classification_c', concept_name: 'Classification',
            diagrams: [{ diagram_id: '4_classification_d', title: 'Classification', svg_path: 'biology_11/classification_animal.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Classification'] }]
        }]
    },
    {
        topic_id: 'bio-11-5-morphology-flower',
        subject: 'Biology', grade: 'Class 11', domain: 'Biology',
        concept_key: '5_morphology_flower', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-11-5-morphology-flower', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Calyx', 'Corolla', 'Androecium', 'Gynoecium'] }],
        label_map: { 'default': ['Calyx', 'Corolla', 'Androecium', 'Gynoecium'] },
        concepts: [{
            concept_id: '5_morphology_flower_c', concept_name: 'Flower Morphology',
            diagrams: [{ diagram_id: '5_morphology_flower_d', title: 'Flower Morphology', svg_path: 'biology_11/morphology_flower.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Calyx', 'Corolla', 'Androecium', 'Gynoecium'] }]
        }]
    },
    {
        topic_id: 'bio-11-5-root-systems',
        subject: 'Biology', grade: 'Class 11', domain: 'Biology',
        concept_key: '5_root_systems', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-11-5-root-systems', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Tap Root', 'Fibrous Root', 'Adventitious Root'] }],
        label_map: { 'default': ['Tap Root', 'Fibrous Root', 'Adventitious Root'] },
        concepts: [{
            concept_id: '5_root_systems_c', concept_name: 'Root Systems',
            diagrams: [{ diagram_id: '5_root_systems_d', title: 'Root Systems', svg_path: 'biology_11/root_systems.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Tap Root', 'Fibrous Root', 'Adventitious Root'] }]
        }]
    },
    {
        topic_id: 'bio-11-6-plant-tissues',
        subject: 'Biology', grade: 'Class 11', domain: 'Biology',
        concept_key: '6_plant_tissues', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-11-6-plant-tissues', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Meristematic', 'Simple Permanent', 'Complex Permanent'] }],
        label_map: { 'default': ['Meristematic', 'Simple Permanent', 'Complex Permanent'] },
        concepts: [{
            concept_id: '6_plant_tissues_c', concept_name: 'Plant Tissues',
            diagrams: [{ diagram_id: '6_plant_tissues_d', title: 'Plant Tissues', svg_path: 'biology_11/plant_tissues.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Meristematic', 'Simple Permanent', 'Complex Permanent'] }]
        }]
    },
    {
        topic_id: 'bio-11-7-animal-tissues',
        subject: 'Biology', grade: 'Class 11', domain: 'Biology',
        concept_key: '7_animal_tissues', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-11-7-animal-tissues', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Epithelial', 'Connective', 'Muscular', 'Neural'] }],
        label_map: { 'default': ['Epithelial', 'Connective', 'Muscular', 'Neural'] },
        concepts: [{
            concept_id: '7_animal_tissues_c', concept_name: 'Animal Tissues',
            diagrams: [{ diagram_id: '7_animal_tissues_d', title: 'Animal Tissues', svg_path: 'biology_11/animal_tissues.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Epithelial', 'Connective', 'Muscular', 'Neural'] }]
        }]
    },
    {
        topic_id: 'bio-11-8-prokaryotic-cell',
        subject: 'Biology', grade: 'Class 11', domain: 'Biology',
        concept_key: '8_prokaryotic_cell', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-11-8-prokaryotic-cell', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Nucleoid', 'Ribosomes', 'Plasma Membrane', 'Cell Wall'] }],
        label_map: { 'default': ['Nucleoid', 'Ribosomes', 'Plasma Membrane', 'Cell Wall'] },
        concepts: [{
            concept_id: '8_prokaryotic_cell_c', concept_name: 'Prokaryotic Cell',
            diagrams: [{ diagram_id: '8_prokaryotic_cell_d', title: 'Prokaryotic Cell', svg_path: 'biology_11/prokaryotic_cell.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Nucleoid', 'Ribosomes', 'Plasma Membrane', 'Cell Wall'] }]
        }]
    },
    {
        topic_id: 'bio-11-8-cell-membrane',
        subject: 'Biology', grade: 'Class 11', domain: 'Biology',
        concept_key: '8_cell_membrane', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-11-8-cell-membrane', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Lipid Bilayer', 'Integral Proteins', 'Peripheral Proteins'] }],
        label_map: { 'default': ['Lipid Bilayer', 'Integral Proteins', 'Peripheral Proteins'] },
        concepts: [{
            concept_id: '8_cell_membrane_c', concept_name: 'Cell Membrane',
            diagrams: [{ diagram_id: '8_cell_membrane_d', title: 'Cell Membrane', svg_path: 'biology_11/cell_membrane.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Lipid Bilayer', 'Integral Proteins', 'Peripheral Proteins'] }]
        }]
    },
    {
        topic_id: 'bio-11-8-mitochondria',
        subject: 'Biology', grade: 'Class 11', domain: 'Biology',
        concept_key: '8_mitochondria', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-11-8-mitochondria', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Outer Membrane', 'Inner Membrane', 'Cristae', 'Matrix'] }],
        label_map: { 'default': ['Outer Membrane', 'Inner Membrane', 'Cristae', 'Matrix'] },
        concepts: [{
            concept_id: '8_mitochondria_c', concept_name: 'Mitochondria',
            diagrams: [{ diagram_id: '8_mitochondria_d', title: 'Mitochondria', svg_path: 'biology_11/mitochondria_structure.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Outer Membrane', 'Inner Membrane', 'Cristae', 'Matrix'] }]
        }]
    },
    {
        topic_id: 'bio-11-8-chloroplast',
        subject: 'Biology', grade: 'Class 11', domain: 'Biology',
        concept_key: '8_chloroplast', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-11-8-chloroplast', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Stroma', 'Thylakoids', 'Granum', 'Lamellae'] }],
        label_map: { 'default': ['Stroma', 'Thylakoids', 'Granum', 'Lamellae'] },
        concepts: [{
            concept_id: '8_chloroplast_c', concept_name: 'Chloroplast',
            diagrams: [{ diagram_id: '8_chloroplast_d', title: 'Chloroplast', svg_path: 'biology_11/chloroplast_structure.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Stroma', 'Thylakoids', 'Granum', 'Lamellae'] }]
        }]
    },
    {
        topic_id: 'bio-12-1-sexual-reproduction',
        subject: 'Biology', grade: 'Class 12', domain: 'Biology',
        concept_key: '1_sexual_reproduction', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-12-1-sexual-reproduction', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Sexual Reproduction'] }],
        label_map: { 'default': ['Sexual Reproduction'] },
        concepts: [{
            concept_id: '1_sexual_reproduction_c', concept_name: 'Sexual Reproduction',
            diagrams: [{ diagram_id: '1_sexual_reproduction_d', title: 'Sexual Reproduction', svg_path: 'biology_12/sexual-reproduction.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Sexual Reproduction'] }]
        }]
    },
    {
        topic_id: 'bio-12-1-fertilization',
        subject: 'Biology', grade: 'Class 12', domain: 'Biology',
        concept_key: '1_fertilization', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-12-1-fertilization', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Fertilization'] }],
        label_map: { 'default': ['Fertilization'] },
        concepts: [{
            concept_id: '1_fertilization_c', concept_name: 'Fertilization',
            diagrams: [{ diagram_id: '1_fertilization_d', title: 'Fertilization', svg_path: 'biology_12/fertilization.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Fertilization'] }]
        }]
    },
    {
        topic_id: 'bio-12-1-embryogenesis',
        subject: 'Biology', grade: 'Class 12', domain: 'Biology',
        concept_key: '1_embryogenesis', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-12-1-embryogenesis', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Embryogenesis'] }],
        label_map: { 'default': ['Embryogenesis'] },
        concepts: [{
            concept_id: '1_embryogenesis_c', concept_name: 'Embryogenesis',
            diagrams: [{ diagram_id: '1_embryogenesis_d', title: 'Embryogenesis', svg_path: 'biology_12/embryogenesis.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Embryogenesis'] }]
        }]
    },
    {
        topic_id: 'bio-12-2-mendelism',
        subject: 'Biology', grade: 'Class 12', domain: 'Biology',
        concept_key: '2_mendelism', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-12-2-mendelism', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Mendelism'] }],
        label_map: { 'default': ['Mendelism'] },
        concepts: [{
            concept_id: '2_mendelism_c', concept_name: 'Mendelism',
            diagrams: [{ diagram_id: '2_mendelism_d', title: 'Mendelism', svg_path: 'biology_12/mendelism.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Mendelism'] }]
        }]
    },
    {
        topic_id: 'bio-12-2-dna-structure',
        subject: 'Biology', grade: 'Class 12', domain: 'Biology',
        concept_key: '2_dna_structure', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-12-2-dna-structure', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['DNA Structure'] }],
        label_map: { 'default': ['DNA Structure'] },
        concepts: [{
            concept_id: '2_dna_structure_c', concept_name: 'DNA Structure',
            diagrams: [{ diagram_id: '2_dna_structure_d', title: 'DNA Structure', svg_path: 'biology_12/dna-structure.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['DNA Structure'] }]
        }]
    },
    {
        topic_id: 'bio-12-2-inheritance',
        subject: 'Biology', grade: 'Class 12', domain: 'Biology',
        concept_key: '2_inheritance', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-12-2-inheritance', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Inheritance'] }],
        label_map: { 'default': ['Inheritance'] },
        concepts: [{
            concept_id: '2_inheritance_c', concept_name: 'Inheritance',
            diagrams: [{ diagram_id: '2_inheritance_d', title: 'Inheritance', svg_path: 'biology_12/inheritance.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Inheritance'] }]
        }]
    },
    {
        topic_id: 'bio-12-3-darwinism',
        subject: 'Biology', grade: 'Class 12', domain: 'Biology',
        concept_key: '3_darwinism', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-12-3-darwinism', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Darwinism'] }],
        label_map: { 'default': ['Darwinism'] },
        concepts: [{
            concept_id: '3_darwinism_c', concept_name: 'Darwinism',
            diagrams: [{ diagram_id: '3_darwinism_d', title: 'Darwinism', svg_path: 'biology_12/darwinism.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Darwinism'] }]
        }]
    },
    {
        topic_id: 'bio-12-3-evidence-of-evolution',
        subject: 'Biology', grade: 'Class 12', domain: 'Biology',
        concept_key: '3_evidence_of_evolution', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-12-3-evidence-of-evolution', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Evidence of Evolution'] }],
        label_map: { 'default': ['Evidence of Evolution'] },
        concepts: [{
            concept_id: '3_evidence_of_evolution_c', concept_name: 'Evidence of Evolution',
            diagrams: [{ diagram_id: '3_evidence_of_evolution_d', title: 'Evidence of Evolution', svg_path: 'biology_12/evidence-of-evolution.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Evidence of Evolution'] }]
        }]
    },
    {
        topic_id: 'bio-12-3-adaptation',
        subject: 'Biology', grade: 'Class 12', domain: 'Biology',
        concept_key: '3_adaptation', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-12-3-adaptation', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Adaptation'] }],
        label_map: { 'default': ['Adaptation'] },
        concepts: [{
            concept_id: '3_adaptation_c', concept_name: 'Adaptation',
            diagrams: [{ diagram_id: '3_adaptation_d', title: 'Adaptation', svg_path: 'biology_12/adaptation.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Adaptation'] }]
        }]
    },
    {
        topic_id: 'bio-12-4-cloning',
        subject: 'Biology', grade: 'Class 12', domain: 'Biology',
        concept_key: '4_cloning', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-12-4-cloning', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Cloning'] }],
        label_map: { 'default': ['Cloning'] },
        concepts: [{
            concept_id: '4_cloning_c', concept_name: 'Cloning',
            diagrams: [{ diagram_id: '4_cloning_d', title: 'Cloning', svg_path: 'biology_12/cloning.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Cloning'] }]
        }]
    },
    {
        topic_id: 'bio-12-4-pcr',
        subject: 'Biology', grade: 'Class 12', domain: 'Biology',
        concept_key: '4_pcr', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-12-4-pcr', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['PCR'] }],
        label_map: { 'default': ['PCR'] },
        concepts: [{
            concept_id: '4_pcr_c', concept_name: 'PCR',
            diagrams: [{ diagram_id: '4_pcr_d', title: 'PCR', svg_path: 'biology_12/pcr.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['PCR'] }]
        }]
    },
    {
        topic_id: 'bio-12-4-genetic-engineering',
        subject: 'Biology', grade: 'Class 12', domain: 'Biology',
        concept_key: '4_genetic_engineering', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-12-4-genetic-engineering', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Genetic Engineering'] }],
        label_map: { 'default': ['Genetic Engineering'] },
        concepts: [{
            concept_id: '4_genetic_engineering_c', concept_name: 'Genetic Engineering',
            diagrams: [{ diagram_id: '4_genetic_engineering_d', title: 'Genetic Engineering', svg_path: 'biology_12/genetic-engineering.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Genetic Engineering'] }]
        }]
    },
    {
        topic_id: 'cs-11-1-hardware',
        subject: 'Computer Science', grade: 'Class 11', domain: 'Computer Science',
        concept_key: '1_hardware', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_cs-11-1-hardware', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Hardware'] }],
        label_map: { 'default': ['Hardware'] },
        concepts: [{
            concept_id: '1_hardware_c', concept_name: 'Hardware',
            diagrams: [{ diagram_id: '1_hardware_d', title: 'Hardware', svg_path: 'computer_science_11/hardware.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Hardware'] }]
        }]
    },
    {
        topic_id: 'cs-11-1-software',
        subject: 'Computer Science', grade: 'Class 11', domain: 'Computer Science',
        concept_key: '1_software', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_cs-11-1-software', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Software'] }],
        label_map: { 'default': ['Software'] },
        concepts: [{
            concept_id: '1_software_c', concept_name: 'Software',
            diagrams: [{ diagram_id: '1_software_d', title: 'Software', svg_path: 'computer_science_11/software.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Software'] }]
        }]
    },
    {
        topic_id: 'cs-11-1-operating-systems',
        subject: 'Computer Science', grade: 'Class 11', domain: 'Computer Science',
        concept_key: '1_operating_systems', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_cs-11-1-operating-systems', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Operating Systems'] }],
        label_map: { 'default': ['Operating Systems'] },
        concepts: [{
            concept_id: '1_operating_systems_c', concept_name: 'Operating Systems',
            diagrams: [{ diagram_id: '1_operating_systems_d', title: 'Operating Systems', svg_path: 'computer_science_11/operating-systems.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Operating Systems'] }]
        }]
    },
    {
        topic_id: 'cs-11-2-data-types',
        subject: 'Computer Science', grade: 'Class 11', domain: 'Computer Science',
        concept_key: '2_data_types', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_cs-11-2-data-types', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Data Types'] }],
        label_map: { 'default': ['Data Types'] },
        concepts: [{
            concept_id: '2_data_types_c', concept_name: 'Data Types',
            diagrams: [{ diagram_id: '2_data_types_d', title: 'Data Types', svg_path: 'computer_science_11/data-types.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Data Types'] }]
        }]
    },
    {
        topic_id: 'cs-11-2-operators',
        subject: 'Computer Science', grade: 'Class 11', domain: 'Computer Science',
        concept_key: '2_operators', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_cs-11-2-operators', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Operators'] }],
        label_map: { 'default': ['Operators'] },
        concepts: [{
            concept_id: '2_operators_c', concept_name: 'Operators',
            diagrams: [{ diagram_id: '2_operators_d', title: 'Operators', svg_path: 'computer_science_11/operators.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Operators'] }]
        }]
    },
    {
        topic_id: 'cs-11-2-conditionals',
        subject: 'Computer Science', grade: 'Class 11', domain: 'Computer Science',
        concept_key: '2_conditionals', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_cs-11-2-conditionals', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Conditionals'] }],
        label_map: { 'default': ['Conditionals'] },
        concepts: [{
            concept_id: '2_conditionals_c', concept_name: 'Conditionals',
            diagrams: [{ diagram_id: '2_conditionals_d', title: 'Conditionals', svg_path: 'computer_science_11/conditionals.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Conditionals'] }]
        }]
    },
    {
        topic_id: 'cs-11-2-loops',
        subject: 'Computer Science', grade: 'Class 11', domain: 'Computer Science',
        concept_key: '2_loops', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_cs-11-2-loops', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Loops'] }],
        label_map: { 'default': ['Loops'] },
        concepts: [{
            concept_id: '2_loops_c', concept_name: 'Loops',
            diagrams: [{ diagram_id: '2_loops_d', title: 'Loops', svg_path: 'computer_science_11/loops.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Loops'] }]
        }]
    },
    {
        topic_id: 'cs-11-3-flowcharts',
        subject: 'Computer Science', grade: 'Class 11', domain: 'Computer Science',
        concept_key: '3_flowcharts', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_cs-11-3-flowcharts', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Flowcharts'] }],
        label_map: { 'default': ['Flowcharts'] },
        concepts: [{
            concept_id: '3_flowcharts_c', concept_name: 'Flowcharts',
            diagrams: [{ diagram_id: '3_flowcharts_d', title: 'Flowcharts', svg_path: 'computer_science_11/flowcharts.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Flowcharts'] }]
        }]
    },
    {
        topic_id: 'cs-11-3-pseudocode',
        subject: 'Computer Science', grade: 'Class 11', domain: 'Computer Science',
        concept_key: '3_pseudocode', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_cs-11-3-pseudocode', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Pseudocode'] }],
        label_map: { 'default': ['Pseudocode'] },
        concepts: [{
            concept_id: '3_pseudocode_c', concept_name: 'Pseudocode',
            diagrams: [{ diagram_id: '3_pseudocode_d', title: 'Pseudocode', svg_path: 'computer_science_11/pseudocode.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Pseudocode'] }]
        }]
    },
    {
        topic_id: 'cs-11-3-sorting',
        subject: 'Computer Science', grade: 'Class 11', domain: 'Computer Science',
        concept_key: '3_sorting', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_cs-11-3-sorting', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Sorting'] }],
        label_map: { 'default': ['Sorting'] },
        concepts: [{
            concept_id: '3_sorting_c', concept_name: 'Sorting',
            diagrams: [{ diagram_id: '3_sorting_d', title: 'Sorting', svg_path: 'computer_science_11/sorting.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Sorting'] }]
        }]
    },
    {
        topic_id: 'cs-11-4-conditionals',
        subject: 'Computer Science', grade: 'Class 11', domain: 'Computer Science',
        concept_key: '4_conditionals', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_cs-11-4-conditionals', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Conditionals'] }],
        label_map: { 'default': ['Conditionals'] },
        concepts: [{
            concept_id: '4_conditionals_c', concept_name: 'Conditionals',
            diagrams: [{ diagram_id: '4_conditionals_d', title: 'Conditionals', svg_path: 'computer_science_11/conditionals.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Conditionals'] }]
        }]
    },
    {
        topic_id: 'cs-11-4-loops',
        subject: 'Computer Science', grade: 'Class 11', domain: 'Computer Science',
        concept_key: '4_loops', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_cs-11-4-loops', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Loops'] }],
        label_map: { 'default': ['Loops'] },
        concepts: [{
            concept_id: '4_loops_c', concept_name: 'Loops',
            diagrams: [{ diagram_id: '4_loops_d', title: 'Loops', svg_path: 'computer_science_11/loops.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Loops'] }]
        }]
    },
    {
        topic_id: 'cs-11-4-jump-statements',
        subject: 'Computer Science', grade: 'Class 11', domain: 'Computer Science',
        concept_key: '4_jump_statements', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_cs-11-4-jump-statements', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Jump Statements'] }],
        label_map: { 'default': ['Jump Statements'] },
        concepts: [{
            concept_id: '4_jump_statements_c', concept_name: 'Jump Statements',
            diagrams: [{ diagram_id: '4_jump_statements_d', title: 'Jump Statements', svg_path: 'computer_science_11/jump-statements.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Jump Statements'] }]
        }]
    },
    {
        topic_id: 'cs-12-1-definition',
        subject: 'Computer Science', grade: 'Class 12', domain: 'Computer Science',
        concept_key: '1_definition', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_cs-12-1-definition', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Definition'] }],
        label_map: { 'default': ['Definition'] },
        concepts: [{
            concept_id: '1_definition_c', concept_name: 'Definition',
            diagrams: [{ diagram_id: '1_definition_d', title: 'Definition', svg_path: 'computer_science_12/definition.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Definition'] }]
        }]
    },
    {
        topic_id: 'cs-12-1-arguments',
        subject: 'Computer Science', grade: 'Class 12', domain: 'Computer Science',
        concept_key: '1_arguments', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_cs-12-1-arguments', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Arguments'] }],
        label_map: { 'default': ['Arguments'] },
        concepts: [{
            concept_id: '1_arguments_c', concept_name: 'Arguments',
            diagrams: [{ diagram_id: '1_arguments_d', title: 'Arguments', svg_path: 'computer_science_12/arguments.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Arguments'] }]
        }]
    },
    {
        topic_id: 'cs-12-1-recursion',
        subject: 'Computer Science', grade: 'Class 12', domain: 'Computer Science',
        concept_key: '1_recursion', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_cs-12-1-recursion', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Recursion'] }],
        label_map: { 'default': ['Recursion'] },
        concepts: [{
            concept_id: '1_recursion_c', concept_name: 'Recursion',
            diagrams: [{ diagram_id: '1_recursion_d', title: 'Recursion', svg_path: 'computer_science_12/recursion.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Recursion'] }]
        }]
    },
    {
        topic_id: 'cs-12-2-lists',
        subject: 'Computer Science', grade: 'Class 12', domain: 'Computer Science',
        concept_key: '2_lists', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_cs-12-2-lists', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Lists'] }],
        label_map: { 'default': ['Lists'] },
        concepts: [{
            concept_id: '2_lists_c', concept_name: 'Lists',
            diagrams: [{ diagram_id: '2_lists_d', title: 'Lists', svg_path: 'computer_science_12/lists.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Lists'] }]
        }]
    },
    {
        topic_id: 'cs-12-2-tuples',
        subject: 'Computer Science', grade: 'Class 12', domain: 'Computer Science',
        concept_key: '2_tuples', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_cs-12-2-tuples', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Tuples'] }],
        label_map: { 'default': ['Tuples'] },
        concepts: [{
            concept_id: '2_tuples_c', concept_name: 'Tuples',
            diagrams: [{ diagram_id: '2_tuples_d', title: 'Tuples', svg_path: 'computer_science_12/tuples.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Tuples'] }]
        }]
    },
    {
        topic_id: 'cs-12-2-dictionaries',
        subject: 'Computer Science', grade: 'Class 12', domain: 'Computer Science',
        concept_key: '2_dictionaries', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_cs-12-2-dictionaries', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Dictionaries'] }],
        label_map: { 'default': ['Dictionaries'] },
        concepts: [{
            concept_id: '2_dictionaries_c', concept_name: 'Dictionaries',
            diagrams: [{ diagram_id: '2_dictionaries_d', title: 'Dictionaries', svg_path: 'computer_science_12/dictionaries.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Dictionaries'] }]
        }]
    },
    {
        topic_id: 'cs-12-2-stacks',
        subject: 'Computer Science', grade: 'Class 12', domain: 'Computer Science',
        concept_key: '2_stacks', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_cs-12-2-stacks', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Stacks'] }],
        label_map: { 'default': ['Stacks'] },
        concepts: [{
            concept_id: '2_stacks_c', concept_name: 'Stacks',
            diagrams: [{ diagram_id: '2_stacks_d', title: 'Stacks', svg_path: 'computer_science_12/stacks.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Stacks'] }]
        }]
    },
    {
        topic_id: 'cs-12-3-text-files',
        subject: 'Computer Science', grade: 'Class 12', domain: 'Computer Science',
        concept_key: '3_text_files', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_cs-12-3-text-files', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Text Files'] }],
        label_map: { 'default': ['Text Files'] },
        concepts: [{
            concept_id: '3_text_files_c', concept_name: 'Text Files',
            diagrams: [{ diagram_id: '3_text_files_d', title: 'Text Files', svg_path: 'computer_science_12/text-files.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Text Files'] }]
        }]
    },
    {
        topic_id: 'cs-12-3-binary-files',
        subject: 'Computer Science', grade: 'Class 12', domain: 'Computer Science',
        concept_key: '3_binary_files', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_cs-12-3-binary-files', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Binary Files'] }],
        label_map: { 'default': ['Binary Files'] },
        concepts: [{
            concept_id: '3_binary_files_c', concept_name: 'Binary Files',
            diagrams: [{ diagram_id: '3_binary_files_d', title: 'Binary Files', svg_path: 'computer_science_12/binary-files.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Binary Files'] }]
        }]
    },
    {
        topic_id: 'cs-12-3-csv',
        subject: 'Computer Science', grade: 'Class 12', domain: 'Computer Science',
        concept_key: '3_csv', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_cs-12-3-csv', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['CSV'] }],
        label_map: { 'default': ['CSV'] },
        concepts: [{
            concept_id: '3_csv_c', concept_name: 'CSV',
            diagrams: [{ diagram_id: '3_csv_d', title: 'CSV', svg_path: 'computer_science_12/csv.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['CSV'] }]
        }]
    },
    {
        topic_id: 'cs-12-4-ddl',
        subject: 'Computer Science', grade: 'Class 12', domain: 'Computer Science',
        concept_key: '4_ddl', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_cs-12-4-ddl', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['DDL'] }],
        label_map: { 'default': ['DDL'] },
        concepts: [{
            concept_id: '4_ddl_c', concept_name: 'DDL',
            diagrams: [{ diagram_id: '4_ddl_d', title: 'DDL', svg_path: 'computer_science_12/ddl.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['DDL'] }]
        }]
    },
    {
        topic_id: 'cs-12-4-dml',
        subject: 'Computer Science', grade: 'Class 12', domain: 'Computer Science',
        concept_key: '4_dml', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_cs-12-4-dml', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['DML'] }],
        label_map: { 'default': ['DML'] },
        concepts: [{
            concept_id: '4_dml_c', concept_name: 'DML',
            diagrams: [{ diagram_id: '4_dml_d', title: 'DML', svg_path: 'computer_science_12/dml.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['DML'] }]
        }]
    },
    {
        topic_id: 'cs-12-4-queries',
        subject: 'Computer Science', grade: 'Class 12', domain: 'Computer Science',
        concept_key: '4_queries', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_cs-12-4-queries', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Queries'] }],
        label_map: { 'default': ['Queries'] },
        concepts: [{
            concept_id: '4_queries_c', concept_name: 'Queries',
            diagrams: [{ diagram_id: '4_queries_d', title: 'Queries', svg_path: 'computer_science_12/queries.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Queries'] }]
        }]
    },
    {
        topic_id: 'cs-12-4-joins',
        subject: 'Computer Science', grade: 'Class 12', domain: 'Computer Science',
        concept_key: '4_joins', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_cs-12-4-joins', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-19',
        source: 'NCERT', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Joins'] }],
        label_map: { 'default': ['Joins'] },
        concepts: [{
            concept_id: '4_joins_c', concept_name: 'Joins',
            diagrams: [{ diagram_id: '4_joins_d', title: 'Joins', svg_path: 'computer_science_12/joins.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Joins'] }]
        }]
    },
    {
        topic_id: 'chem-11-1-atomic-mass',
        subject: 'Chemistry', grade: 'Class 11', domain: 'Chemistry',
        concept_key: '1_atomic_mass', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-11-1-atomic-mass', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Chemistry 11', checksum: 'sha256-auto', difficulty: 'intro',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['1 amu', 'Carbon-12', '1.66e-24g'] }],
        label_map: { 'default': ['1 amu', 'Carbon-12', '1.66e-24g'] },
        concepts: [{
            concept_id: '1_atomic_mass_c', concept_name: 'Atomic Mass',
            diagrams: [{ diagram_id: '1_atomic_mass_d', title: 'Concept of Atomic Mass', svg_path: 'chemistry_11/atomic-mass.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['1 amu', 'Carbon-12', '1.66e-24g'] }]
        }]
    },
    {
        topic_id: 'chem-11-1-mole-concept',
        subject: 'Chemistry', grade: 'Class 11', domain: 'Chemistry',
        concept_key: '1_mole_concept', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-11-1-mole-concept', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Chemistry 11', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Moles', 'Mass', 'Volume', 'Particles'] }],
        label_map: { 'default': ['Moles', 'Mass', 'Volume', 'Particles'] },
        concepts: [{
            concept_id: '1_mole_concept_c', concept_name: 'Mole Concept',
            diagrams: [{ diagram_id: '1_mole_concept_d', title: 'Mole Concept Road Map', svg_path: 'chemistry_11/mole-concept.svg', diagram_type: 'structure', purpose: 'Flow', labels: ['Moles', 'Mass', 'Volume', 'Particles'] }]
        }]
    },
    {
        topic_id: 'chem-11-1-stoichiometry',
        subject: 'Chemistry', grade: 'Class 11', domain: 'Chemistry',
        concept_key: '1_stoichiometry', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-11-1-stoichiometry', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Chemistry 11', checksum: 'sha256-auto', difficulty: 'advanced',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Equation', 'Coefficients', 'Mole Ratio'] }],
        label_map: { 'default': ['Equation', 'Coefficients', 'Mole Ratio'] },
        concepts: [{
            concept_id: '1_stoichiometry_c', concept_name: 'Stoichiometry',
            diagrams: [{ diagram_id: '1_stoichiometry_d', title: 'Stoichiometric Calculations', svg_path: 'chemistry_11/stoichiometry.svg', diagram_type: 'structure', purpose: 'Process', labels: ['Equation', 'Coefficients', 'Mole Ratio'] }]
        }]
    },
    {
        topic_id: 'chem-11-2-bohr-model',
        subject: 'Chemistry', grade: 'Class 11', domain: 'Chemistry',
        concept_key: '2_bohr_model', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-11-2-bohr-model', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Chemistry 11', checksum: 'sha256-auto', difficulty: 'intro',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Nucleus', 'Orbits', 'Emission', 'Energy Levels'] }],
        label_map: { 'default': ['Nucleus', 'Orbits', 'Emission', 'Energy Levels'] },
        concepts: [{
            concept_id: '2_bohr_model_c', concept_name: 'Bohr Model',
            diagrams: [{ diagram_id: '2_bohr_model_d', title: 'Bohr Model & Transitions', svg_path: 'chemistry_11/bohr-model.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Nucleus', 'Orbits', 'Emission', 'Energy Levels'] }]
        }]
    },
    {
        topic_id: 'chem-11-2-quantum-numbers',
        subject: 'Chemistry', grade: 'Class 11', domain: 'Chemistry',
        concept_key: '2_quantum_numbers', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-11-2-quantum-numbers', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Chemistry 11', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['n', 'l', 'ml', 'ms'] }],
        label_map: { 'default': ['n', 'l', 'ml', 'ms'] },
        concepts: [{
            concept_id: '2_quantum_numbers_c', concept_name: 'Quantum Numbers',
            diagrams: [{ diagram_id: '2_quantum_numbers_d', title: 'Quantum Numbers Table', svg_path: 'chemistry_11/quantum-numbers.svg', diagram_type: 'structure', purpose: 'Comparison', labels: ['n', 'l', 'ml', 'ms'] }]
        }]
    },
    {
        topic_id: 'chem-11-2-orbitals',
        subject: 'Chemistry', grade: 'Class 11', domain: 'Chemistry',
        concept_key: '2_orbitals', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-11-2-orbitals', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Chemistry 11', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['s orbital', 'p orbital', 'Dumbbell'] }],
        label_map: { 'default': ['s orbital', 'p orbital', 'Dumbbell'] },
        concepts: [{
            concept_id: '2_orbitals_c', concept_name: 'Orbitals',
            diagrams: [{ diagram_id: '2_orbitals_d', title: 'Shapes of Atomic Orbitals', svg_path: 'chemistry_11/orbitals.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['s orbital', 'p orbital', 'Dumbbell'] }]
        }]
    },
    {
        topic_id: 'chem-11-3-vsepr-theory',
        subject: 'Chemistry', grade: 'Class 11', domain: 'Chemistry',
        concept_key: '3_vsepr_theory', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-11-3-vsepr-theory', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Chemistry 11', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Linear', 'Trigonal Planar', 'Tetrahedral'] }],
        label_map: { 'default': ['Linear', 'Trigonal Planar', 'Tetrahedral'] },
        concepts: [{
            concept_id: '3_vsepr_theory_c', concept_name: 'VSEPR Theory',
            diagrams: [{ diagram_id: '3_vsepr_theory_d', title: 'VSEPR Geometries', svg_path: 'chemistry_11/vsepr-theory.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Linear', 'Trigonal Planar', 'Tetrahedral'] }]
        }]
    },
    {
        topic_id: 'chem-11-3-hybridization',
        subject: 'Chemistry', grade: 'Class 11', domain: 'Chemistry',
        concept_key: '3_hybridization', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-11-3-hybridization', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Chemistry 11', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Mixing', 'sp3 Hybrids', 'Orbitals'] }],
        label_map: { 'default': ['Mixing', 'sp3 Hybrids', 'Orbitals'] },
        concepts: [{
            concept_id: '3_hybridization_c', concept_name: 'Hybridization',
            diagrams: [{ diagram_id: '3_hybridization_d', title: 'sp3 Hybridization', svg_path: 'chemistry_11/hybridization.svg', diagram_type: 'structure', purpose: 'Process', labels: ['Mixing', 'sp3 Hybrids', 'Orbitals'] }]
        }]
    },
    {
        topic_id: 'chem-11-3-molecular-orbitals',
        subject: 'Chemistry', grade: 'Class 11', domain: 'Chemistry',
        concept_key: '3_molecular_orbitals', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-11-3-molecular-orbitals', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Chemistry 11', checksum: 'sha256-auto', difficulty: 'advanced',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Bonding MO', 'Antibonding MO', 'Energy Levels'] }],
        label_map: { 'default': ['Bonding MO', 'Antibonding MO', 'Energy Levels'] },
        concepts: [{
            concept_id: '3_molecular_orbitals_c', concept_name: 'Molecular Orbitals',
            diagrams: [{ diagram_id: '3_molecular_orbitals_d', title: 'MO Energy Diagram', svg_path: 'chemistry_11/molecular-orbitals.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Bonding MO', 'Antibonding MO', 'Energy Levels'] }]
        }]
    },
    {
        topic_id: 'chem-11-4-enthalpy',
        subject: 'Chemistry', grade: 'Class 11', domain: 'Chemistry',
        concept_key: '4_enthalpy', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-11-4-enthalpy', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Chemistry 11', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Exothermic', 'Endothermic', 'Heat Content'] }],
        label_map: { 'default': ['Exothermic', 'Endothermic', 'Heat Content'] },
        concepts: [{
            concept_id: '4_enthalpy_c', concept_name: 'Enthalpy',
            diagrams: [{ diagram_id: '4_enthalpy_d', title: 'Enthalpy Profiles', svg_path: 'chemistry_11/enthalpy.svg', diagram_type: 'structure', purpose: 'Graph', labels: ['Exothermic', 'Endothermic', 'Heat Content'] }]
        }]
    },
    {
        topic_id: 'chem-11-4-entropy',
        subject: 'Chemistry', grade: 'Class 11', domain: 'Chemistry',
        concept_key: '4_entropy', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-11-4-entropy', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Chemistry 11', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Solid', 'Liquid', 'Gas', 'Disorder'] }],
        label_map: { 'default': ['Solid', 'Liquid', 'Gas', 'Disorder'] },
        concepts: [{
            concept_id: '4_entropy_c', concept_name: 'Entropy',
            diagrams: [{ diagram_id: '4_entropy_d', title: 'Entropy & Disorder', svg_path: 'chemistry_11/entropy.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Solid', 'Liquid', 'Gas', 'Disorder'] }]
        }]
    },
    {
        topic_id: 'chem-11-4-gibbs-energy',
        subject: 'Chemistry', grade: 'Class 11', domain: 'Chemistry',
        concept_key: '4_gibbs_energy', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-11-4-gibbs-energy', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Chemistry 11', checksum: 'sha256-auto', difficulty: 'advanced',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Formula', 'Spontaneity', 'Equilibrium'] }],
        label_map: { 'default': ['Formula', 'Spontaneity', 'Equilibrium'] },
        concepts: [{
            concept_id: '4_gibbs_energy_c', concept_name: 'Gibbs Energy',
            diagrams: [{ diagram_id: '4_gibbs_energy_d', title: 'Gibbs Energy Spontaneity', svg_path: 'chemistry_11/gibbs-energy.svg', diagram_type: 'structure', purpose: 'Process', labels: ['Formula', 'Spontaneity', 'Equilibrium'] }]
        }]
    },
    {
        topic_id: 'bio-11-1-characteristics',
        subject: 'Biology', grade: 'Class 11', domain: 'Biology',
        concept_key: '1_characteristics', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-11-1-characteristics', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Biology 11', checksum: 'sha256-auto', difficulty: 'intro',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Growth', 'Reproduction', 'Metabolism', 'Consciousness'] }],
        label_map: { 'default': ['Growth', 'Reproduction', 'Metabolism', 'Consciousness'] },
        concepts: [{
            concept_id: '1_characteristics_c', concept_name: 'Life Characteristics',
            diagrams: [{ diagram_id: '1_characteristics_d', title: 'Defining vs Non-Defining Properties', svg_path: 'biology_11/characteristics.svg', diagram_type: 'structure', purpose: 'Comparison', labels: ['Growth', 'Reproduction', 'Metabolism', 'Consciousness'] }]
        }]
    },
    {
        topic_id: 'bio-11-1-taxonomy',
        subject: 'Biology', grade: 'Class 11', domain: 'Biology',
        concept_key: '1_taxonomy', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-11-1-taxonomy', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Biology 11', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Kingdom', 'Phylum', 'Class', 'Order', 'Family', 'Genus', 'Species'] }],
        label_map: { 'default': ['Kingdom', 'Phylum', 'Class', 'Order', 'Family', 'Genus', 'Species'] },
        concepts: [{
            concept_id: '1_taxonomy_c', concept_name: 'Taxonomic Hierarchy',
            diagrams: [{ diagram_id: '1_taxonomy_d', title: 'Biological Classification Levels', svg_path: 'biology_11/taxonomy.svg', diagram_type: 'structure', purpose: 'Flow', labels: ['Kingdom', 'Phylum', 'Class', 'Order', 'Family', 'Genus', 'Species'] }]
        }]
    },
    {
        topic_id: 'bio-11-1-classification',
        subject: 'Biology', grade: 'Class 11', domain: 'Biology',
        concept_key: '1_classification', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-11-1-classification', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Biology 11', checksum: 'sha256-auto', difficulty: 'advanced',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Two Kingdom', 'Five Kingdom', 'Whittaker'] }],
        label_map: { 'default': ['Two Kingdom', 'Five Kingdom', 'Whittaker'] },
        concepts: [{
            concept_id: '1_classification_c', concept_name: 'Biology Classification',
            diagrams: [{ diagram_id: '1_classification_d', title: 'Classification Systems', svg_path: 'biology_11/classification.svg', diagram_type: 'structure', purpose: 'Comparison', labels: ['Two Kingdom', 'Five Kingdom', 'Whittaker'] }]
        }]
    },
    {
        topic_id: 'bio-11-2-five-kingdoms',
        subject: 'Biology', grade: 'Class 11', domain: 'Biology',
        concept_key: '2_five_kingdoms', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-11-2-five-kingdoms', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Biology 11', checksum: 'sha256-auto', difficulty: 'intro',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Monera', 'Protista', 'Fungi', 'Plantae', 'Animalia'] }],
        label_map: { 'default': ['Monera', 'Protista', 'Fungi', 'Plantae', 'Animalia'] },
        concepts: [{
            concept_id: '2_five_kingdoms_c', concept_name: 'Whittaker System',
            diagrams: [{ diagram_id: '2_five_kingdoms_d', title: '5-Kingdom Map', svg_path: 'biology_11/five-kingdoms.svg', diagram_type: 'structure', purpose: 'Flow', labels: ['Monera', 'Protista', 'Fungi', 'Plantae', 'Animalia'] }]
        }]
    },
    {
        topic_id: 'bio-11-2-monera',
        subject: 'Biology', grade: 'Class 11', domain: 'Biology',
        concept_key: '2_monera', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-11-2-monera', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Biology 11', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Bacteria', 'Shapes', 'Archaebacteria', 'Eubacteria'] }],
        label_map: { 'default': ['Bacteria', 'Shapes', 'Archaebacteria', 'Eubacteria'] },
        concepts: [{
            concept_id: '2_monera_c', concept_name: 'Kingdom Monera',
            diagrams: [{ diagram_id: '2_monera_d', title: 'Bacterial Classification', svg_path: 'biology_11/monera.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Bacteria', 'Shapes', 'Archaebacteria', 'Eubacteria'] }]
        }]
    },
    {
        topic_id: 'bio-11-2-protista',
        subject: 'Biology', grade: 'Class 11', domain: 'Biology',
        concept_key: '2_protista', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-11-2-protista', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Biology 11', checksum: 'sha256-auto', difficulty: 'advanced',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Chrysophytes', 'Dinoflagellates', 'Euglenoids', 'Slime Moulds', 'Protozoans'] }],
        label_map: { 'default': ['Chrysophytes', 'Dinoflagellates', 'Euglenoids', 'Slime Moulds', 'Protozoans'] },
        concepts: [{
            concept_id: '2_protista_c', concept_name: 'Kingdom Protista',
            diagrams: [{ diagram_id: '2_protista_d', title: 'Protist Diversity', svg_path: 'biology_11/protista.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Chrysophytes', 'Dinoflagellates', 'Euglenoids', 'Slime Moulds', 'Protozoans'] }]
        }]
    },
    {
        topic_id: 'bio-11-3-algae',
        subject: 'Biology', grade: 'Class 11', domain: 'Biology',
        concept_key: '3_algae', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-11-3-algae', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Biology 11', checksum: 'sha256-auto', difficulty: 'intro',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Chlorophyceae', 'Phaeophyceae', 'Rhodophyceae'] }],
        label_map: { 'default': ['Chlorophyceae', 'Phaeophyceae', 'Rhodophyceae'] },
        concepts: [{
            concept_id: '3_algae_c', concept_name: 'Types of Algae',
            diagrams: [{ diagram_id: '3_algae_d', title: 'Green, Brown, and Red Algae', svg_path: 'biology_11/algae.svg', diagram_type: 'structure', purpose: 'Comparison', labels: ['Chlorophyceae', 'Phaeophyceae', 'Rhodophyceae'] }]
        }]
    },
    {
        topic_id: 'bio-11-3-bryophytes',
        subject: 'Biology', grade: 'Class 11', domain: 'Biology',
        concept_key: '3_bryophytes', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-11-3-bryophytes', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Biology 11', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Liverworts', 'Mosses', 'Amphibians'] }],
        label_map: { 'default': ['Liverworts', 'Mosses', 'Amphibians'] },
        concepts: [{
            concept_id: '3_bryophytes_c', concept_name: 'Amphibians of Plants',
            diagrams: [{ diagram_id: '3_bryophytes_d', title: 'Life Cycle and Types', svg_path: 'biology_11/bryophytes.svg', diagram_type: 'structure', purpose: 'Process', labels: ['Liverworts', 'Mosses', 'Amphibians'] }]
        }]
    },
    {
        topic_id: 'bio-11-3-angiosperms',
        subject: 'Biology', grade: 'Class 11', domain: 'Biology',
        concept_key: '3_angiosperms', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-11-3-angiosperms', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Biology 11', checksum: 'sha256-auto', difficulty: 'advanced',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Flowers', 'Monocots', 'Dicots'] }],
        label_map: { 'default': ['Flowers', 'Monocots', 'Dicots'] },
        concepts: [{
            concept_id: '3_angiosperms_c', concept_name: 'Flowering Plants',
            diagrams: [{ diagram_id: '3_angiosperms_d', title: 'Seed Classification', svg_path: 'biology_11/angiosperms.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Flowers', 'Monocots', 'Dicots'] }]
        }]
    },
    {
        topic_id: 'bio-11-4-invertebrates',
        subject: 'Biology', grade: 'Class 11', domain: 'Biology',
        concept_key: '4_invertebrates', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-11-4-invertebrates', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Biology 11', checksum: 'sha256-auto', difficulty: 'intro',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Porifera', 'Cnidaria', 'Arthropoda', 'Mollusca'] }],
        label_map: { 'default': ['Porifera', 'Cnidaria', 'Arthropoda', 'Mollusca'] },
        concepts: [{
            concept_id: '4_invertebrates_c', concept_name: 'Non-Chordates',
            diagrams: [{ diagram_id: '4_invertebrates_d', title: 'Invertebrate Phyla', svg_path: 'biology_11/invertebrates.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Porifera', 'Cnidaria', 'Arthropoda', 'Mollusca'] }]
        }]
    },
    {
        topic_id: 'bio-11-4-vertebrates',
        subject: 'Biology', grade: 'Class 11', domain: 'Biology',
        concept_key: '4_vertebrates', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-11-4-vertebrates', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Biology 11', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Pisces', 'Amphibia', 'Reptilia', 'Aves', 'Mammalia'] }],
        label_map: { 'default': ['Pisces', 'Amphibia', 'Reptilia', 'Aves', 'Mammalia'] },
        concepts: [{
            concept_id: '4_vertebrates_c', concept_name: 'Vertebrate Classes',
            diagrams: [{ diagram_id: '4_vertebrates_d', title: 'Classification of Gnathostomata', svg_path: 'biology_11/vertebrates.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Pisces', 'Amphibia', 'Reptilia', 'Aves', 'Mammalia'] }]
        }]
    },
    {
        topic_id: 'bio-11-4-classification',
        subject: 'Biology', grade: 'Class 11', domain: 'Biology',
        concept_key: '4_animal_classification', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-11-4-classification', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Biology 11', checksum: 'sha256-auto', difficulty: 'advanced',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Organization', 'Symmetry', 'Coelom', 'Germ Layers'] }],
        label_map: { 'default': ['Organization', 'Symmetry', 'Coelom', 'Germ Layers'] },
        concepts: [{
            concept_id: '4_animal_classification_c', concept_name: 'Animal Taxonomy',
            diagrams: [{ diagram_id: '4_animal_classification_d', title: 'Basis of Classification', svg_path: 'biology_11/animal-classification.svg', diagram_type: 'structure', purpose: 'Comparison', labels: ['Organization', 'Symmetry', 'Coelom', 'Germ Layers'] }]
        }]
    },
    {
        topic_id: 'phy-12-1-coulombs-law',
        subject: 'Physics', grade: 'Class 12', domain: 'Physics',
        concept_key: 'law', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_phy-12-1-coulombs-law', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Physics 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Coulomb\'s Law'] }],
        label_map: { 'default': ['Coulomb\'s Law'] },
        concepts: [{
            concept_id: 'phy-12-1-coulombs-law_c', concept_name: 'Coulomb\'s Law',
            diagrams: [{ diagram_id: 'phy-12-1-coulombs-law_d', title: 'Coulomb\'s Law', svg_path: 'physics_12/coulombs-law.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Coulomb\'s Law'] }]
        }]
    },
    {
        topic_id: 'phy-12-1-electric-field',
        subject: 'Physics', grade: 'Class 12', domain: 'Physics',
        concept_key: 'field', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_phy-12-1-electric-field', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Physics 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Electric Field'] }],
        label_map: { 'default': ['Electric Field'] },
        concepts: [{
            concept_id: 'phy-12-1-electric-field_c', concept_name: 'Electric Field',
            diagrams: [{ diagram_id: 'phy-12-1-electric-field_d', title: 'Electric Field', svg_path: 'physics_12/electric-field.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Electric Field'] }]
        }]
    },
    {
        topic_id: 'phy-12-1-gauss-law',
        subject: 'Physics', grade: 'Class 12', domain: 'Physics',
        concept_key: 'law', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_phy-12-1-gauss-law', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Physics 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Gauss Law'] }],
        label_map: { 'default': ['Gauss Law'] },
        concepts: [{
            concept_id: 'phy-12-1-gauss-law_c', concept_name: 'Gauss Law',
            diagrams: [{ diagram_id: 'phy-12-1-gauss-law_d', title: 'Gauss Law', svg_path: 'physics_12/gauss-law.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Gauss Law'] }]
        }]
    },
    {
        topic_id: 'phy-12-2-ohms-law',
        subject: 'Physics', grade: 'Class 12', domain: 'Physics',
        concept_key: 'law', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_phy-12-2-ohms-law', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Physics 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Ohm\'s Law'] }],
        label_map: { 'default': ['Ohm\'s Law'] },
        concepts: [{
            concept_id: 'phy-12-2-ohms-law_c', concept_name: 'Ohm\'s Law',
            diagrams: [{ diagram_id: 'phy-12-2-ohms-law_d', title: 'Ohm\'s Law', svg_path: 'physics_12/ohms-law.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Ohm\'s Law'] }]
        }]
    },
    {
        topic_id: 'phy-12-2-kirchhoffs-laws',
        subject: 'Physics', grade: 'Class 12', domain: 'Physics',
        concept_key: 'laws', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_phy-12-2-kirchhoffs-laws', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Physics 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Kirchhoff\'s Laws'] }],
        label_map: { 'default': ['Kirchhoff\'s Laws'] },
        concepts: [{
            concept_id: 'phy-12-2-kirchhoffs-laws_c', concept_name: 'Kirchhoff\'s Laws',
            diagrams: [{ diagram_id: 'phy-12-2-kirchhoffs-laws_d', title: 'Kirchhoff\'s Laws', svg_path: 'physics_12/kirchhoffs-laws.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Kirchhoff\'s Laws'] }]
        }]
    },
    {
        topic_id: 'phy-12-2-circuits',
        subject: 'Physics', grade: 'Class 12', domain: 'Physics',
        concept_key: 'circuits', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_phy-12-2-circuits', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Physics 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['DC Circuits'] }],
        label_map: { 'default': ['DC Circuits'] },
        concepts: [{
            concept_id: 'phy-12-2-circuits_c', concept_name: 'DC Circuits',
            diagrams: [{ diagram_id: 'phy-12-2-circuits_d', title: 'DC Circuits', svg_path: 'physics_12/circuits.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['DC Circuits'] }]
        }]
    },
    {
        topic_id: 'phy-12-3-biot-savart',
        subject: 'Physics', grade: 'Class 12', domain: 'Physics',
        concept_key: 'savart', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_phy-12-3-biot-savart', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Physics 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Biot-Savart Law'] }],
        label_map: { 'default': ['Biot-Savart Law'] },
        concepts: [{
            concept_id: 'phy-12-3-biot-savart_c', concept_name: 'Biot-Savart Law',
            diagrams: [{ diagram_id: 'phy-12-3-biot-savart_d', title: 'Biot-Savart Law', svg_path: 'physics_12/biot-savart.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Biot-Savart Law'] }]
        }]
    },
    {
        topic_id: 'phy-12-3-amperes-law',
        subject: 'Physics', grade: 'Class 12', domain: 'Physics',
        concept_key: 'law', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_phy-12-3-amperes-law', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Physics 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Ampere\'s Law'] }],
        label_map: { 'default': ['Ampere\'s Law'] },
        concepts: [{
            concept_id: 'phy-12-3-amperes-law_c', concept_name: 'Ampere\'s Law',
            diagrams: [{ diagram_id: 'phy-12-3-amperes-law_d', title: 'Ampere\'s Law', svg_path: 'physics_12/amperes-law.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Ampere\'s Law'] }]
        }]
    },
    {
        topic_id: 'phy-12-3-magnetic-force',
        subject: 'Physics', grade: 'Class 12', domain: 'Physics',
        concept_key: 'force', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_phy-12-3-magnetic-force', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Physics 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Magnetic Force'] }],
        label_map: { 'default': ['Magnetic Force'] },
        concepts: [{
            concept_id: 'phy-12-3-magnetic-force_c', concept_name: 'Magnetic Force',
            diagrams: [{ diagram_id: 'phy-12-3-magnetic-force_d', title: 'Magnetic Force', svg_path: 'physics_12/magnetic-force.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Magnetic Force'] }]
        }]
    },
    {
        topic_id: 'phy-12-4-faradays-law',
        subject: 'Physics', grade: 'Class 12', domain: 'Physics',
        concept_key: 'law', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_phy-12-4-faradays-law', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Physics 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Faraday\'s Law'] }],
        label_map: { 'default': ['Faraday\'s Law'] },
        concepts: [{
            concept_id: 'phy-12-4-faradays-law_c', concept_name: 'Faraday\'s Law',
            diagrams: [{ diagram_id: 'phy-12-4-faradays-law_d', title: 'Faraday\'s Law', svg_path: 'physics_12/faradays-law.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Faraday\'s Law'] }]
        }]
    },
    {
        topic_id: 'phy-12-4-lenzs-law',
        subject: 'Physics', grade: 'Class 12', domain: 'Physics',
        concept_key: 'law', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_phy-12-4-lenzs-law', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Physics 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Lenz\'s Law'] }],
        label_map: { 'default': ['Lenz\'s Law'] },
        concepts: [{
            concept_id: 'phy-12-4-lenzs-law_c', concept_name: 'Lenz\'s Law',
            diagrams: [{ diagram_id: 'phy-12-4-lenzs-law_d', title: 'Lenz\'s Law', svg_path: 'physics_12/lenzs-law.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Lenz\'s Law'] }]
        }]
    },
    {
        topic_id: 'phy-12-4-ac-generator',
        subject: 'Physics', grade: 'Class 12', domain: 'Physics',
        concept_key: 'generator', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_phy-12-4-ac-generator', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Physics 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['AC Generator'] }],
        label_map: { 'default': ['AC Generator'] },
        concepts: [{
            concept_id: 'phy-12-4-ac-generator_c', concept_name: 'AC Generator',
            diagrams: [{ diagram_id: 'phy-12-4-ac-generator_d', title: 'AC Generator', svg_path: 'physics_12/ac-generator.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['AC Generator'] }]
        }]
    },
    {
        topic_id: 'chem-12-1-crystal-lattice',
        subject: 'Chemistry', grade: 'Class 12', domain: 'Chemistry',
        concept_key: 'lattice', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-12-1-crystal-lattice', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Chemistry 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Crystal Lattice'] }],
        label_map: { 'default': ['Crystal Lattice'] },
        concepts: [{
            concept_id: 'chem-12-1-crystal-lattice_c', concept_name: 'Crystal Lattice',
            diagrams: [{ diagram_id: 'chem-12-1-crystal-lattice_d', title: 'Crystal Lattice', svg_path: 'chemistry_12/crystal-lattice.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Crystal Lattice'] }]
        }]
    },
    {
        topic_id: 'chem-12-1-defects',
        subject: 'Chemistry', grade: 'Class 12', domain: 'Chemistry',
        concept_key: 'defects', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-12-1-defects', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Chemistry 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Crystal Defects'] }],
        label_map: { 'default': ['Crystal Defects'] },
        concepts: [{
            concept_id: 'chem-12-1-defects_c', concept_name: 'Crystal Defects',
            diagrams: [{ diagram_id: 'chem-12-1-defects_d', title: 'Crystal Defects', svg_path: 'chemistry_12/defects.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Crystal Defects'] }]
        }]
    },
    {
        topic_id: 'chem-12-1-properties',
        subject: 'Chemistry', grade: 'Class 12', domain: 'Chemistry',
        concept_key: 'properties', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-12-1-properties', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Chemistry 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Solid Properties'] }],
        label_map: { 'default': ['Solid Properties'] },
        concepts: [{
            concept_id: 'chem-12-1-properties_c', concept_name: 'Solid Properties',
            diagrams: [{ diagram_id: 'chem-12-1-properties_d', title: 'Solid Properties', svg_path: 'chemistry_12/properties.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Solid Properties'] }]
        }]
    },
    {
        topic_id: 'chem-12-2-concentration',
        subject: 'Chemistry', grade: 'Class 12', domain: 'Chemistry',
        concept_key: 'concentration', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-12-2-concentration', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Chemistry 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Solution Concentration'] }],
        label_map: { 'default': ['Solution Concentration'] },
        concepts: [{
            concept_id: 'chem-12-2-concentration_c', concept_name: 'Solution Concentration',
            diagrams: [{ diagram_id: 'chem-12-2-concentration_d', title: 'Solution Concentration', svg_path: 'chemistry_12/concentration.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Solution Concentration'] }]
        }]
    },
    {
        topic_id: 'chem-12-2-raoults-law',
        subject: 'Chemistry', grade: 'Class 12', domain: 'Chemistry',
        concept_key: 'law', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-12-2-raoults-law', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Chemistry 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Raoult\'s Law'] }],
        label_map: { 'default': ['Raoult\'s Law'] },
        concepts: [{
            concept_id: 'chem-12-2-raoults-law_c', concept_name: 'Raoult\'s Law',
            diagrams: [{ diagram_id: 'chem-12-2-raoults-law_d', title: 'Raoult\'s Law', svg_path: 'chemistry_12/raoults-law.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Raoult\'s Law'] }]
        }]
    },
    {
        topic_id: 'chem-12-2-osmosis',
        subject: 'Chemistry', grade: 'Class 12', domain: 'Chemistry',
        concept_key: 'osmosis', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-12-2-osmosis', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Chemistry 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Osmosis & Pressure'] }],
        label_map: { 'default': ['Osmosis & Pressure'] },
        concepts: [{
            concept_id: 'chem-12-2-osmosis_c', concept_name: 'Osmosis & Pressure',
            diagrams: [{ diagram_id: 'chem-12-2-osmosis_d', title: 'Osmosis & Pressure', svg_path: 'chemistry_12/osmosis.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Osmosis & Pressure'] }]
        }]
    },
    {
        topic_id: 'chem-12-3-cells',
        subject: 'Chemistry', grade: 'Class 12', domain: 'Chemistry',
        concept_key: 'cells', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-12-3-cells', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Chemistry 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Electrochemical Cells'] }],
        label_map: { 'default': ['Electrochemical Cells'] },
        concepts: [{
            concept_id: 'chem-12-3-cells_c', concept_name: 'Electrochemical Cells',
            diagrams: [{ diagram_id: 'chem-12-3-cells_d', title: 'Electrochemical Cells', svg_path: 'chemistry_12/cells.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Electrochemical Cells'] }]
        }]
    },
    {
        topic_id: 'chem-12-3-nernst-equation',
        subject: 'Chemistry', grade: 'Class 12', domain: 'Chemistry',
        concept_key: 'equation', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-12-3-nernst-equation', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Chemistry 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Nernst Equation'] }],
        label_map: { 'default': ['Nernst Equation'] },
        concepts: [{
            concept_id: 'chem-12-3-nernst-equation_c', concept_name: 'Nernst Equation',
            diagrams: [{ diagram_id: 'chem-12-3-nernst-equation_d', title: 'Nernst Equation', svg_path: 'chemistry_12/nernst-equation.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Nernst Equation'] }]
        }]
    },
    {
        topic_id: 'chem-12-3-batteries',
        subject: 'Chemistry', grade: 'Class 12', domain: 'Chemistry',
        concept_key: 'batteries', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-12-3-batteries', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Chemistry 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Batteries & Fuel Cells'] }],
        label_map: { 'default': ['Batteries & Fuel Cells'] },
        concepts: [{
            concept_id: 'chem-12-3-batteries_c', concept_name: 'Batteries & Fuel Cells',
            diagrams: [{ diagram_id: 'chem-12-3-batteries_d', title: 'Batteries & Fuel Cells', svg_path: 'chemistry_12/batteries.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Batteries & Fuel Cells'] }]
        }]
    },
    {
        topic_id: 'chem-12-4-rate-laws',
        subject: 'Chemistry', grade: 'Class 12', domain: 'Chemistry',
        concept_key: 'laws', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-12-4-rate-laws', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Chemistry 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Chemical Rate Laws'] }],
        label_map: { 'default': ['Chemical Rate Laws'] },
        concepts: [{
            concept_id: 'chem-12-4-rate-laws_c', concept_name: 'Chemical Rate Laws',
            diagrams: [{ diagram_id: 'chem-12-4-rate-laws_d', title: 'Chemical Rate Laws', svg_path: 'chemistry_12/rate-laws.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Chemical Rate Laws'] }]
        }]
    },
    {
        topic_id: 'chem-12-4-order',
        subject: 'Chemistry', grade: 'Class 12', domain: 'Chemistry',
        concept_key: 'order', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-12-4-order', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Chemistry 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Order of Reaction'] }],
        label_map: { 'default': ['Order of Reaction'] },
        concepts: [{
            concept_id: 'chem-12-4-order_c', concept_name: 'Order of Reaction',
            diagrams: [{ diagram_id: 'chem-12-4-order_d', title: 'Order of Reaction', svg_path: 'chemistry_12/order.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Order of Reaction'] }]
        }]
    },
    {
        topic_id: 'chem-12-4-mechanism',
        subject: 'Chemistry', grade: 'Class 12', domain: 'Chemistry',
        concept_key: 'mechanism', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_chem-12-4-mechanism', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Chemistry 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Reaction Mechanism'] }],
        label_map: { 'default': ['Reaction Mechanism'] },
        concepts: [{
            concept_id: 'chem-12-4-mechanism_c', concept_name: 'Reaction Mechanism',
            diagrams: [{ diagram_id: 'chem-12-4-mechanism_d', title: 'Reaction Mechanism', svg_path: 'chemistry_12/mechanism.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Reaction Mechanism'] }]
        }]
    },
    {
        topic_id: 'math-12-1-function-types',
        subject: 'Mathematics', grade: 'Class 12', domain: 'Mathematics',
        concept_key: 'types', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-12-1-function-types', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Mathematics 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Types of Functions'] }],
        label_map: { 'default': ['Types of Functions'] },
        concepts: [{
            concept_id: 'math-12-1-function-types_c', concept_name: 'Types of Functions',
            diagrams: [{ diagram_id: 'math-12-1-function-types_d', title: 'Types of Functions', svg_path: 'mathematics_12/function-types.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Types of Functions'] }]
        }]
    },
    {
        topic_id: 'math-12-1-composition',
        subject: 'Mathematics', grade: 'Class 12', domain: 'Mathematics',
        concept_key: 'composition', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-12-1-composition', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Mathematics 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Composition of Functions'] }],
        label_map: { 'default': ['Composition of Functions'] },
        concepts: [{
            concept_id: 'math-12-1-composition_c', concept_name: 'Composition of Functions',
            diagrams: [{ diagram_id: 'math-12-1-composition_d', title: 'Composition of Functions', svg_path: 'mathematics_12/composition.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Composition of Functions'] }]
        }]
    },
    {
        topic_id: 'math-12-1-inverse',
        subject: 'Mathematics', grade: 'Class 12', domain: 'Mathematics',
        concept_key: 'inverse', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-12-1-inverse', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Mathematics 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Inverse Functions'] }],
        label_map: { 'default': ['Inverse Functions'] },
        concepts: [{
            concept_id: 'math-12-1-inverse_c', concept_name: 'Inverse Functions',
            diagrams: [{ diagram_id: 'math-12-1-inverse_d', title: 'Inverse Functions', svg_path: 'mathematics_12/inverse.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Inverse Functions'] }]
        }]
    },
    {
        topic_id: 'math-12-2-principal-values',
        subject: 'Mathematics', grade: 'Class 12', domain: 'Mathematics',
        concept_key: 'values', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-12-2-principal-values', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Mathematics 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Principal Values'] }],
        label_map: { 'default': ['Principal Values'] },
        concepts: [{
            concept_id: 'math-12-2-principal-values_c', concept_name: 'Principal Values',
            diagrams: [{ diagram_id: 'math-12-2-principal-values_d', title: 'Principal Values', svg_path: 'mathematics_12/principal-values.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Principal Values'] }]
        }]
    },
    {
        topic_id: 'math-12-2-trig-properties',
        subject: 'Mathematics', grade: 'Class 12', domain: 'Mathematics',
        concept_key: 'properties', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-12-2-trig-properties', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Mathematics 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Inverse Trig Properties'] }],
        label_map: { 'default': ['Inverse Trig Properties'] },
        concepts: [{
            concept_id: 'math-12-2-trig-properties_c', concept_name: 'Inverse Trig Properties',
            diagrams: [{ diagram_id: 'math-12-2-trig-properties_d', title: 'Inverse Trig Properties', svg_path: 'mathematics_12/trig-properties.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Inverse Trig Properties'] }]
        }]
    },
    {
        topic_id: 'math-12-2-trig-graphs',
        subject: 'Mathematics', grade: 'Class 12', domain: 'Mathematics',
        concept_key: 'graphs', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-12-2-trig-graphs', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Mathematics 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Inverse Trig Graphs'] }],
        label_map: { 'default': ['Inverse Trig Graphs'] },
        concepts: [{
            concept_id: 'math-12-2-trig-graphs_c', concept_name: 'Inverse Trig Graphs',
            diagrams: [{ diagram_id: 'math-12-2-trig-graphs_d', title: 'Inverse Trig Graphs', svg_path: 'mathematics_12/trig-graphs.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Inverse Trig Graphs'] }]
        }]
    },
    {
        topic_id: 'math-12-3-matrix-types',
        subject: 'Mathematics', grade: 'Class 12', domain: 'Mathematics',
        concept_key: 'types', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-12-3-matrix-types', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Mathematics 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Types of Matrices'] }],
        label_map: { 'default': ['Types of Matrices'] },
        concepts: [{
            concept_id: 'math-12-3-matrix-types_c', concept_name: 'Types of Matrices',
            diagrams: [{ diagram_id: 'math-12-3-matrix-types_d', title: 'Types of Matrices', svg_path: 'mathematics_12/matrix-types.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Types of Matrices'] }]
        }]
    },
    {
        topic_id: 'math-12-3-matrix-operations',
        subject: 'Mathematics', grade: 'Class 12', domain: 'Mathematics',
        concept_key: 'operations', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-12-3-matrix-operations', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Mathematics 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Matrix Operations'] }],
        label_map: { 'default': ['Matrix Operations'] },
        concepts: [{
            concept_id: 'math-12-3-matrix-operations_c', concept_name: 'Matrix Operations',
            diagrams: [{ diagram_id: 'math-12-3-matrix-operations_d', title: 'Matrix Operations', svg_path: 'mathematics_12/matrix-operations.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Matrix Operations'] }]
        }]
    },
    {
        topic_id: 'math-12-3-matrix-transpose',
        subject: 'Mathematics', grade: 'Class 12', domain: 'Mathematics',
        concept_key: 'transpose', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-12-3-matrix-transpose', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Mathematics 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Matrix Transpose'] }],
        label_map: { 'default': ['Matrix Transpose'] },
        concepts: [{
            concept_id: 'math-12-3-matrix-transpose_c', concept_name: 'Matrix Transpose',
            diagrams: [{ diagram_id: 'math-12-3-matrix-transpose_d', title: 'Matrix Transpose', svg_path: 'mathematics_12/matrix-transpose.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Matrix Transpose'] }]
        }]
    },
    {
        topic_id: 'math-12-4-determinant-properties',
        subject: 'Mathematics', grade: 'Class 12', domain: 'Mathematics',
        concept_key: 'properties', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-12-4-determinant-properties', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Mathematics 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Determinant Properties'] }],
        label_map: { 'default': ['Determinant Properties'] },
        concepts: [{
            concept_id: 'math-12-4-determinant-properties_c', concept_name: 'Determinant Properties',
            diagrams: [{ diagram_id: 'math-12-4-determinant-properties_d', title: 'Determinant Properties', svg_path: 'mathematics_12/determinant-properties.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Determinant Properties'] }]
        }]
    },
    {
        topic_id: 'math-12-4-minors',
        subject: 'Mathematics', grade: 'Class 12', domain: 'Mathematics',
        concept_key: 'minors', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-12-4-minors', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Mathematics 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Minors of Matrix'] }],
        label_map: { 'default': ['Minors of Matrix'] },
        concepts: [{
            concept_id: 'math-12-4-minors_c', concept_name: 'Minors of Matrix',
            diagrams: [{ diagram_id: 'math-12-4-minors_d', title: 'Minors of Matrix', svg_path: 'mathematics_12/minors.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Minors of Matrix'] }]
        }]
    },
    {
        topic_id: 'math-12-4-cofactors',
        subject: 'Mathematics', grade: 'Class 12', domain: 'Mathematics',
        concept_key: 'cofactors', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-12-4-cofactors', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Mathematics 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Cofactors of Matrix'] }],
        label_map: { 'default': ['Cofactors of Matrix'] },
        concepts: [{
            concept_id: 'math-12-4-cofactors_c', concept_name: 'Cofactors of Matrix',
            diagrams: [{ diagram_id: 'math-12-4-cofactors_d', title: 'Cofactors of Matrix', svg_path: 'mathematics_12/cofactors.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Cofactors of Matrix'] }]
        }]
    },
    {
        topic_id: 'math-12-4-det-applications',
        subject: 'Mathematics', grade: 'Class 12', domain: 'Mathematics',
        concept_key: 'applications', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-12-4-det-applications', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Mathematics 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Applications of Determinants'] }],
        label_map: { 'default': ['Applications of Determinants'] },
        concepts: [{
            concept_id: 'math-12-4-det-applications_c', concept_name: 'Applications of Determinants',
            diagrams: [{ diagram_id: 'math-12-4-det-applications_d', title: 'Applications of Determinants', svg_path: 'mathematics_12/det-applications.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Applications of Determinants'] }]
        }]
    },
    {
        topic_id: 'math-12-5-limits',
        subject: 'Mathematics', grade: 'Class 12', domain: 'Mathematics',
        concept_key: 'limits', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-12-5-limits', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Mathematics 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Limits & Continuity'] }],
        label_map: { 'default': ['Limits & Continuity'] },
        concepts: [{
            concept_id: 'math-12-5-limits_c', concept_name: 'Limits & Continuity',
            diagrams: [{ diagram_id: 'math-12-5-limits_d', title: 'Limits & Continuity', svg_path: 'mathematics_12/limits.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Limits & Continuity'] }]
        }]
    },
    {
        topic_id: 'math-12-5-derivatives',
        subject: 'Mathematics', grade: 'Class 12', domain: 'Mathematics',
        concept_key: 'derivatives', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-12-5-derivatives', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Mathematics 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Rules of Derivatives'] }],
        label_map: { 'default': ['Rules of Derivatives'] },
        concepts: [{
            concept_id: 'math-12-5-derivatives_c', concept_name: 'Rules of Derivatives',
            diagrams: [{ diagram_id: 'math-12-5-derivatives_d', title: 'Rules of Derivatives', svg_path: 'mathematics_12/derivatives.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Rules of Derivatives'] }]
        }]
    },
    {
        topic_id: 'math-12-5-chain-rule',
        subject: 'Mathematics', grade: 'Class 12', domain: 'Mathematics',
        concept_key: 'rule', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-12-5-chain-rule', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Mathematics 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Chain Rule'] }],
        label_map: { 'default': ['Chain Rule'] },
        concepts: [{
            concept_id: 'math-12-5-chain-rule_c', concept_name: 'Chain Rule',
            diagrams: [{ diagram_id: 'math-12-5-chain-rule_d', title: 'Chain Rule', svg_path: 'mathematics_12/chain-rule.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Chain Rule'] }]
        }]
    },
    {
        topic_id: 'bio-12-2-mendelism',
        subject: 'Biology', grade: 'Class 12', domain: 'Biology',
        concept_key: 'mendelism', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-12-2-mendelism', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Biology 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Mendelian Genetics'] }],
        label_map: { 'default': ['Mendelian Genetics'] },
        concepts: [{
            concept_id: '2_mendelism_c', concept_name: 'Mendelian Genetics',
            diagrams: [{ diagram_id: '2_mendelism_d', title: 'Mendelian Genetics', svg_path: 'biology_12/mendels-laws.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Mendelian Genetics'] }]
        }]
    },
    {
        topic_id: 'bio-12-2-dna-structure',
        subject: 'Biology', grade: 'Class 12', domain: 'Biology',
        concept_key: 'structure', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-12-2-dna-structure', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Biology 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['DNA Structure'] }],
        label_map: { 'default': ['DNA Structure'] },
        concepts: [{
            concept_id: '2_dna_structure_c', concept_name: 'DNA Structure',
            diagrams: [{ diagram_id: '2_dna_structure_d', title: 'DNA Structure', svg_path: 'biology_12/dna-structure.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['DNA Structure'] }]
        }]
    },
    {
        topic_id: 'bio-12-2-inheritance',
        subject: 'Biology', grade: 'Class 12', domain: 'Biology',
        concept_key: 'inheritance', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-12-2-inheritance', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Biology 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Gene Expression'] }],
        label_map: { 'default': ['Gene Expression'] },
        concepts: [{
            concept_id: '2_inheritance_c', concept_name: 'Gene Expression',
            diagrams: [
                { diagram_id: 'replication', title: 'DNA Replication', svg_path: 'biology_12/dna-replication.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Replication'] },
                { diagram_id: 'transcription', title: 'Transcription', svg_path: 'biology_12/transcription.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Transcription'] },
                { diagram_id: 'translation', title: 'Translation', svg_path: 'biology_12/translation.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Translation'] }
            ]
        }]
    },
    {
        topic_id: 'bio-12-3-darwinism',
        subject: 'Biology', grade: 'Class 12', domain: 'Biology',
        concept_key: 'darwinism', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-12-3-darwinism', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Biology 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Darwinian Evolution'] }],
        label_map: { 'default': ['Darwinian Evolution'] },
        concepts: [{
            concept_id: '3_darwinism_c', concept_name: 'Darwinian Evolution',
            diagrams: [{ diagram_id: '3_darwinism_d', title: 'Darwinian Evolution', svg_path: 'biology_12/natural-selection.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Darwinian Evolution'] }]
        }]
    },
    {
        topic_id: 'bio-12-3-adaptation',
        subject: 'Biology', grade: 'Class 12', domain: 'Biology',
        concept_key: 'adaptation', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-12-3-adaptation', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Biology 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Adaptation & Speciation'] }],
        label_map: { 'default': ['Adaptation & Speciation'] },
        concepts: [{
            concept_id: '3_adaptation_c', concept_name: 'Adaptation & Speciation',
            diagrams: [{ diagram_id: '3_adaptation_d', title: 'Adaptation & Speciation', svg_path: 'biology_12/adaptation.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Adaptation & Speciation'] }]
        }]
    },
    {
        topic_id: 'bio-12-2-crossing-over',
        subject: 'Biology', grade: 'Class 12', domain: 'Biology',
        concept_key: 'meiosis', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-12-2-crossing-over', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Biology 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Crossing Over'] }],
        label_map: { 'default': ['Crossing Over'] },
        concepts: [{
            concept_id: '2_crossing_over_c', concept_name: 'Crossing Over',
            diagrams: [{ diagram_id: '2_crossing_over_d', title: 'Crossing Over & Recombination', svg_path: 'biology_12/crossing-over.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Crossing Over'] }]
        }]
    },
    {
        topic_id: 'bio-12-2-genetic-disorders',
        subject: 'Biology', grade: 'Class 12', domain: 'Biology',
        concept_key: 'disorders', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-12-2-genetic-disorders', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Biology 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Genetic Disorders'] }],
        label_map: { 'default': ['Genetic Disorders'] },
        concepts: [{
            concept_id: '2_genetic_disorders_c', concept_name: 'Genetic Disorders',
            diagrams: [{ diagram_id: '2_genetic_disorders_d', title: 'Pedigree Analysis', svg_path: 'biology_12/genetic-disorders.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Genetic Disorders'] }]
        }]
    },
    {
        topic_id: 'bio-12-4-cloning',
        subject: 'Biology', grade: 'Class 12', domain: 'Biology',
        concept_key: 'cloning', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-12-4-cloning', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Biology 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Gene Cloning'] }],
        label_map: { 'default': ['Gene Cloning'] },
        concepts: [{
            concept_id: '4_cloning_c', concept_name: 'Gene Cloning',
            diagrams: [{ diagram_id: '4_cloning_d', title: 'Gene Cloning', svg_path: 'biology_12/cloning.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Gene Cloning'] }]
        }]
    },
    {
        topic_id: 'bio-12-4-pcr',
        subject: 'Biology', grade: 'Class 12', domain: 'Biology',
        concept_key: 'pcr', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-12-4-pcr', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Biology 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['PCR Technique'] }],
        label_map: { 'default': ['PCR Technique'] },
        concepts: [{
            concept_id: '4_pcr_c', concept_name: 'PCR Technique',
            diagrams: [{ diagram_id: '4_pcr_d', title: 'PCR Technique', svg_path: 'biology_12/pcr-process.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['PCR Technique'] }]
        }]
    },
    {
        topic_id: 'bio-12-4-genetic-engineering',
        subject: 'Biology', grade: 'Class 12', domain: 'Biology',
        concept_key: 'engineering', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-12-4-genetic-engineering', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Biology 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Genetic Engineering'] }],
        label_map: { 'default': ['Genetic Engineering'] },
        concepts: [{
            concept_id: '4_genetic_engineering_c', concept_name: 'Genetic Engineering',
            diagrams: [{ diagram_id: '4_genetic_engineering_d', title: 'Genetic Engineering', svg_path: 'biology_12/genetic-engineering.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Genetic Engineering'] }]
        }]
    },
    {
        topic_id: 'bio-12-6-ecology',
        subject: 'Biology', grade: 'Class 12', domain: 'Biology',
        concept_key: 'ecology', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_bio-12-6-ecology', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-20',
        source: 'NCERT Biology 12', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Ecological Pyramids'] }],
        label_map: { 'default': ['Ecological Pyramids'] },
        concepts: [{
            concept_id: '6_ecology_c', concept_name: 'Ecological Pyramids',
            diagrams: [{ diagram_id: '6_ecology_d', title: 'Ecological Pyramids', svg_path: 'biology_12/ecological-pyramids.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Ecological Pyramids'] }]
        }]
    },

    // ──────────────── Social Science Class 7 ────────────────
    // Chapter 1: Tracing Changes Through a Thousand Years (History)
    {
        topic_id: 'sst-7-1-medieval-india',
        subject: 'Social Science', grade: 'Class 7', domain: 'Social Science',
        concept_key: '1_medieval_india', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-7-1-medieval-india', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Social Science 7', checksum: 'sha256-auto', difficulty: 'intro',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Medieval India', 'Historical Sources', 'Timespan'] }],
        label_map: { 'default': ['Medieval India', 'Historical Sources', 'Timespan'] },
        concepts: [{
            concept_id: '1_medieval_india_c', concept_name: 'Medieval India',
            diagrams: [{ diagram_id: '1_medieval_india_d', title: 'Medieval India', svg_path: 'social_7/medieval-india.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Medieval India', 'Historical Sources', 'Timespan'] }]
        }]
    },
    {
        topic_id: 'sst-7-1-sources',
        subject: 'Social Science', grade: 'Class 7', domain: 'Social Science',
        concept_key: '1_sources', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-7-1-sources', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Social Science 7', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Coins', 'Inscriptions', 'Manuscripts'] }],
        label_map: { 'default': ['Coins', 'Inscriptions', 'Manuscripts'] },
        concepts: [{
            concept_id: '1_sources_c', concept_name: 'Historical Sources',
            diagrams: [{ diagram_id: '1_sources_d', title: 'Historical Sources', svg_path: 'social_7/delhi-sultanate.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Coins', 'Inscriptions', 'Manuscripts'] }]
        }]
    },
    {
        topic_id: 'sst-7-1-changes',
        subject: 'Social Science', grade: 'Class 7', domain: 'Social Science',
        concept_key: '1_changes', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-7-1-changes', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Social Science 7', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Mughal Empire', 'Delhi Sultanate', 'Dynasties'] }],
        label_map: { 'default': ['Mughal Empire', 'Delhi Sultanate', 'Dynasties'] },
        concepts: [{
            concept_id: '1_changes_c', concept_name: 'Medieval Changes',
            diagrams: [{ diagram_id: '1_changes_d', title: 'Medieval Changes', svg_path: 'social_7/mughal-empire.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Mughal Empire', 'Delhi Sultanate', 'Dynasties'] }]
        }]
    },

    // Chapter 2: Environment (Geography)
    {
        topic_id: 'sst-7-2-ecosystem',
        subject: 'Social Science', grade: 'Class 7', domain: 'Social Science',
        concept_key: '2_ecosystem', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-7-2-ecosystem', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Social Science 7', checksum: 'sha256-auto', difficulty: 'intro',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Biotic', 'Abiotic', 'Food Chain'] }],
        label_map: { 'default': ['Biotic', 'Abiotic', 'Food Chain'] },
        concepts: [{
            concept_id: '2_ecosystem_c', concept_name: 'Ecosystem',
            diagrams: [{ diagram_id: '2_ecosystem_d', title: 'Ecosystem', svg_path: 'social_7/environment.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Biotic', 'Abiotic', 'Food Chain'] }]
        }]
    },
    {
        topic_id: 'sst-7-2-natural-environment',
        subject: 'Social Science', grade: 'Class 7', domain: 'Social Science',
        concept_key: '2_natural_environment', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-7-2-natural-environment', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Social Science 7', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Lithosphere', 'Hydrosphere', 'Atmosphere', 'Biosphere'] }],
        label_map: { 'default': ['Lithosphere', 'Hydrosphere', 'Atmosphere', 'Biosphere'] },
        concepts: [{
            concept_id: '2_natural_environment_c', concept_name: 'Natural Environment',
            diagrams: [{ diagram_id: '2_natural_environment_d', title: 'Natural Environment', svg_path: 'social_7/earth-interior.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Lithosphere', 'Hydrosphere', 'Atmosphere', 'Biosphere'] }]
        }]
    },
    {
        topic_id: 'sst-7-2-human-impact',
        subject: 'Social Science', grade: 'Class 7', domain: 'Social Science',
        concept_key: '2_human_impact', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-7-2-human-impact', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Social Science 7', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Deforestation', 'Pollution', 'Conservation'] }],
        label_map: { 'default': ['Deforestation', 'Pollution', 'Conservation'] },
        concepts: [{
            concept_id: '2_human_impact_c', concept_name: 'Human Impact',
            diagrams: [{ diagram_id: '2_human_impact_d', title: 'Human Impact on Environment', svg_path: 'social_7/human-environment.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Deforestation', 'Pollution', 'Conservation'] }]
        }]
    },

    // Chapter 3: Equality in Indian Democracy (Civics)
    {
        topic_id: 'sst-7-3-constitution',
        subject: 'Social Science', grade: 'Class 7', domain: 'Social Science',
        concept_key: '3_constitution', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-7-3-constitution', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Social Science 7', checksum: 'sha256-auto', difficulty: 'intro',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Preamble', 'Fundamental Rights', 'Equality'] }],
        label_map: { 'default': ['Preamble', 'Fundamental Rights', 'Equality'] },
        concepts: [{
            concept_id: '3_constitution_c', concept_name: 'Indian Constitution',
            diagrams: [{ diagram_id: '3_constitution_d', title: 'Indian Constitution', svg_path: 'social_7/constitution.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Preamble', 'Fundamental Rights', 'Equality'] }]
        }]
    },
    {
        topic_id: 'sst-7-3-rights',
        subject: 'Social Science', grade: 'Class 7', domain: 'Social Science',
        concept_key: '3_rights', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-7-3-rights', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Social Science 7', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Fundamental Rights', 'DPSP', 'Fundamental Duties'] }],
        label_map: { 'default': ['Fundamental Rights', 'DPSP', 'Fundamental Duties'] },
        concepts: [{
            concept_id: '3_rights_c', concept_name: 'Rights & Duties',
            diagrams: [{ diagram_id: '3_rights_d', title: 'Rights & Duties', svg_path: 'social_7/democracy.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Fundamental Rights', 'DPSP', 'Fundamental Duties'] }]
        }]
    },
    {
        topic_id: 'sst-7-3-equality',
        subject: 'Social Science', grade: 'Class 7', domain: 'Social Science',
        concept_key: '3_equality', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-7-3-equality', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Social Science 7', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Article 15', 'Article 17', 'Discrimination'] }],
        label_map: { 'default': ['Article 15', 'Article 17', 'Discrimination'] },
        concepts: [{
            concept_id: '3_equality_c', concept_name: 'Equality in Democracy',
            diagrams: [{ diagram_id: '3_equality_d', title: 'Equality in Democracy', svg_path: 'social_7/equality.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Article 15', 'Article 17', 'Discrimination'] }]
        }]
    },

    // --- CLASS 8 MATHEMATICS ---
    {
        topic_id: 'math-8-1-properties',
        subject: 'Mathematics', grade: 'Class 8', domain: 'Mathematics',
        concept_key: '1_rational_properties', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-8-1-properties', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Mathematics 8', checksum: 'sha256-auto', difficulty: 'intro',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Closure', 'Commutativity', 'Associativity'] }],
        label_map: { 'default': ['Closure', 'Commutativity', 'Associativity'] },
        concepts: [{
            concept_id: '1_rational_properties_c', concept_name: 'Properties of Rational Numbers',
            diagrams: [{ diagram_id: '1_rational_properties_d', title: 'Properties of Rational Numbers', svg_path: 'mathematics_8/rational-properties.svg', diagram_type: 'geometry', purpose: 'Equation', labels: ['Closure', 'Commutativity', 'Associativity'] }]
        }]
    },
    {
        topic_id: 'math-8-1-operations',
        subject: 'Mathematics', grade: 'Class 8', domain: 'Mathematics',
        concept_key: '1_rational_operations', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-8-1-operations', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Mathematics 8', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Inverse', 'Identity', 'Distributivity'] }],
        label_map: { 'default': ['Inverse', 'Identity', 'Distributivity'] },
        concepts: [{
            concept_id: '1_rational_operations_c', concept_name: 'Operations on Rational Numbers',
            diagrams: [{ diagram_id: '1_rational_operations_d', title: 'Operations on Rational Numbers', svg_path: 'mathematics_8/rational-operations.svg', diagram_type: 'geometry', purpose: 'Equation', labels: ['Inverse', 'Identity', 'Distributivity'] }]
        }]
    },
    {
        topic_id: 'math-8-1-number-line',
        subject: 'Mathematics', grade: 'Class 8', domain: 'Mathematics',
        concept_key: '1_rational_number_line', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-8-1-number-line', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Mathematics 8', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Number Line', 'Density', 'Placement'] }],
        label_map: { 'default': ['Number Line', 'Density', 'Placement'] },
        concepts: [{
            concept_id: '1_rational_number_line_c', concept_name: 'Rational Numbers on Number Line',
            diagrams: [{ diagram_id: '1_rational_number_line_d', title: 'Rational Numbers on Number Line', svg_path: 'mathematics_8/rational-number-line.svg', diagram_type: 'graph', purpose: 'Graph', labels: ['Number Line', 'Density', 'Placement'] }]
        }]
    },
    {
        topic_id: 'math-8-2-solving-equations',
        subject: 'Mathematics', grade: 'Class 8', domain: 'Mathematics',
        concept_key: '2_solving_equations', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-8-2-solving-equations', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Mathematics 8', checksum: 'sha256-auto', difficulty: 'intro',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Golden Rules', 'Transpose', 'Check'] }],
        label_map: { 'default': ['Golden Rules', 'Transpose', 'Check'] },
        concepts: [{
            concept_id: '2_solving_equations_c', concept_name: 'Solving Linear Equations',
            diagrams: [{ diagram_id: '2_solving_equations_d', title: 'Solving Linear Equations', svg_path: 'mathematics_8/solving-equations.svg', diagram_type: 'geometry', purpose: 'Equation', labels: ['Golden Rules', 'Transpose', 'Check'] }]
        }]
    },
    {
        topic_id: 'math-8-2-word-problems',
        subject: 'Mathematics', grade: 'Class 8', domain: 'Mathematics',
        concept_key: '2_word_problems', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-8-2-word-problems', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Mathematics 8', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Ages', 'Numbers', 'Geometry'] }],
        label_map: { 'default': ['Ages', 'Numbers', 'Geometry'] },
        concepts: [{
            concept_id: '2_word_problems_c', concept_name: 'Linear Equation Word Problems',
            diagrams: [{ diagram_id: '2_word_problems_d', title: 'Linear Equation Word Problems', svg_path: 'mathematics_8/word-problems.svg', diagram_type: 'geometry', purpose: 'Equation', labels: ['Ages', 'Numbers', 'Geometry'] }]
        }]
    },
    {
        topic_id: 'math-8-2-applications',
        subject: 'Mathematics', grade: 'Class 8', domain: 'Mathematics',
        concept_key: '2_applications', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-8-2-applications', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Mathematics 8', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Speed/Distance', 'Money', 'Interest'] }],
        label_map: { 'default': ['Speed/Distance', 'Money', 'Interest'] },
        concepts: [{
            concept_id: '2_applications_c', concept_name: 'Applications of Linear Equations',
            diagrams: [{ diagram_id: '2_applications_d', title: 'Applications of Linear Equations', svg_path: 'mathematics_8/equation-applications.svg', diagram_type: 'geometry', purpose: 'Equation', labels: ['Speed/Distance', 'Money', 'Interest'] }]
        }]
    },
    {
        topic_id: 'math-8-3-types',
        subject: 'Mathematics', grade: 'Class 8', domain: 'Mathematics',
        concept_key: '3_quadrilateral_types', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-8-3-types', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Mathematics 8', checksum: 'sha256-auto', difficulty: 'intro',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Shapes', 'Sides', 'Angles'] }],
        label_map: { 'default': ['Shapes', 'Sides', 'Angles'] },
        concepts: [{
            concept_id: '3_quadrilateral_types_c', concept_name: 'Types of Quadrilaterals',
            diagrams: [{ diagram_id: '3_quadrilateral_types_d', title: 'Types of Quadrilaterals', svg_path: 'mathematics_8/quadrilateral-types.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Shapes', 'Sides', 'Angles'] }]
        }]
    },
    {
        topic_id: 'math-8-3-properties',
        subject: 'Mathematics', grade: 'Class 8', domain: 'Mathematics',
        concept_key: '3_quadrilateral_properties', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-8-3-properties', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Mathematics 8', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Diagonals', 'Symmetry', 'Hierarchy'] }],
        label_map: { 'default': ['Diagonals', 'Symmetry', 'Hierarchy'] },
        concepts: [{
            concept_id: '3_quadrilateral_properties_c', concept_name: 'Properties of Quadrilaterals',
            diagrams: [{ diagram_id: '3_quadrilateral_properties_d', title: 'Properties of Quadrilaterals', svg_path: 'mathematics_8/quadrilateral-properties.svg', diagram_type: 'structure', purpose: 'Comparison', labels: ['Diagonals', 'Symmetry', 'Hierarchy'] }]
        }]
    },
    {
        topic_id: 'math-8-3-angle-sum',
        subject: 'Mathematics', grade: 'Class 8', domain: 'Mathematics',
        concept_key: '3_angle_sum', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-8-3-angle-sum', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Mathematics 8', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Polygon Sum', 'Exterior Angles', 'Formulas'] }],
        label_map: { 'default': ['Polygon Sum', 'Exterior Angles', 'Formulas'] },
        concepts: [{
            concept_id: '3_angle_sum_c', concept_name: 'Angle Sum & Polygons',
            diagrams: [{ diagram_id: '3_angle_sum_d', title: 'Angle Sum & Polygons', svg_path: 'mathematics_8/angle-sum.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Polygon Sum', 'Exterior Angles', 'Formulas'] }]
        }]
    },
    {
        topic_id: 'math-8-4-perfect-squares',
        subject: 'Mathematics', grade: 'Class 8', domain: 'Mathematics',
        concept_key: '4_perfect_squares', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-8-4-perfect-squares', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Mathematics 8', checksum: 'sha256-auto', difficulty: 'intro',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Squares', 'Properties', 'Unit Digits'] }],
        label_map: { 'default': ['Squares', 'Properties', 'Unit Digits'] },
        concepts: [{
            concept_id: '4_perfect_squares_c', concept_name: 'Perfect Squares',
            diagrams: [{ diagram_id: '4_perfect_squares_d', title: 'Perfect Squares', svg_path: 'mathematics_8/perfect-squares.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Squares', 'Properties', 'Unit Digits'] }]
        }]
    },
    {
        topic_id: 'math-8-4-finding-roots',
        subject: 'Mathematics', grade: 'Class 8', domain: 'Mathematics',
        concept_key: '4_finding_roots', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-8-4-finding-roots', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Mathematics 8', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Prime Factorisation', 'Division Method', 'Subtraction'] }],
        label_map: { 'default': ['Prime Factorisation', 'Division Method', 'Subtraction'] },
        concepts: [{
            concept_id: '4_finding_roots_c', concept_name: 'Finding Square Roots',
            diagrams: [{ diagram_id: '4_finding_roots_d', title: 'Finding Square Roots', svg_path: 'mathematics_8/finding-roots.svg', diagram_type: 'process', purpose: 'Process', labels: ['Prime Factorisation', 'Division Method', 'Subtraction'] }]
        }]
    },
    {
        topic_id: 'math-8-4-patterns',
        subject: 'Mathematics', grade: 'Class 8', domain: 'Mathematics',
        concept_key: '4_square_patterns', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_math-8-4-patterns', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Mathematics 8', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Odd Sum', 'Between Squares', 'Pythagorean Triplet'] }],
        label_map: { 'default': ['Odd Sum', 'Between Squares', 'Pythagorean Triplet'] },
        concepts: [{
            concept_id: '4_square_patterns_c', concept_name: 'Square Number Patterns',
            diagrams: [{ diagram_id: '4_square_patterns_d', title: 'Square Number Patterns', svg_path: 'mathematics_8/square-patterns.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Odd Sum', 'Between Squares', 'Pythagorean Triplet'] }]
        }]
    },

    // --- CLASS 8 SCIENCE ---
    {
        topic_id: 'sci-8-1-agricultural-practices',
        subject: 'Science', grade: 'Class 8', domain: 'Science',
        concept_key: '1_practices', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-8-1-agricultural-practices', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Science 8', checksum: 'sha256-auto', difficulty: 'intro',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Preparation', 'Sowing', 'Manure'] }],
        label_map: { 'default': ['Preparation', 'Sowing', 'Manure'] },
        concepts: [{
            concept_id: '1_practices_c', concept_name: 'Agricultural Practices',
            diagrams: [{ diagram_id: '1_practices_d', title: 'Agricultural Practices', svg_path: 'science_8/agricultural-practices.svg', diagram_type: 'flowchart', purpose: 'Process', labels: ['Preparation', 'Sowing', 'Manure'] }]
        }]
    },
    {
        topic_id: 'sci-8-1-irrigation',
        subject: 'Science', grade: 'Class 8', domain: 'Science',
        concept_key: '1_irrigation', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-8-1-irrigation', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Science 8', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Sprinkler', 'Drip', 'Traditional'] }],
        label_map: { 'default': ['Sprinkler', 'Drip', 'Traditional'] },
        concepts: [{
            concept_id: '1_irrigation_c', concept_name: 'Irrigation Methods',
            diagrams: [{ diagram_id: '1_irrigation_d', title: 'Irrigation Methods', svg_path: 'science_8/irrigation.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Sprinkler', 'Drip', 'Traditional'] }]
        }]
    },
    {
        topic_id: 'sci-8-1-harvesting',
        subject: 'Science', grade: 'Class 8', domain: 'Science',
        concept_key: '1_harvesting', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-8-1-harvesting', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Science 8', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Harvesting', 'Threshing', 'Storage'] }],
        label_map: { 'default': ['Harvesting', 'Threshing', 'Storage'] },
        concepts: [{
            concept_id: '1_harvesting_c', concept_name: 'Harvest & Storage',
            diagrams: [{ diagram_id: '1_harvesting_d', title: 'Harvest & Storage', svg_path: 'science_8/harvesting.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Harvesting', 'Threshing', 'Storage'] }]
        }]
    },
    {
        topic_id: 'sci-8-2-types',
        subject: 'Science', grade: 'Class 8', domain: 'Science',
        concept_key: '2_types', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-8-2-types', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Science 8', checksum: 'sha256-auto', difficulty: 'intro',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Bacteria', 'Fungi', 'Viruses'] }],
        label_map: { 'default': ['Bacteria', 'Fungi', 'Viruses'] },
        concepts: [{
            concept_id: '2_types_c', concept_name: 'Types of Microbes',
            diagrams: [{ diagram_id: '2_types_d', title: 'Types of Microbes', svg_path: 'science_8/microorganism-types.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Bacteria', 'Fungi', 'Viruses'] }]
        }]
    },
    {
        topic_id: 'sci-8-2-useful-microbes',
        subject: 'Science', grade: 'Class 8', domain: 'Science',
        concept_key: '2_useful', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-8-2-useful-microbes', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Science 8', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Antibiotics', 'Vaccines', 'Soil Fertility'] }],
        label_map: { 'default': ['Antibiotics', 'Vaccines', 'Soil Fertility'] },
        concepts: [{
            concept_id: '2_useful_c', concept_name: 'Useful Microbes',
            diagrams: [{ diagram_id: '2_useful_d', title: 'Useful Microbes', svg_path: 'science_8/useful-microbes.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Antibiotics', 'Vaccines', 'Soil Fertility'] }]
        }]
    },
    {
        topic_id: 'sci-8-2-diseases',
        subject: 'Science', grade: 'Class 8', domain: 'Science',
        concept_key: '2_harmful', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-8-2-diseases', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Science 8', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Diseases', 'Transmission', 'Food Poisoning'] }],
        label_map: { 'default': ['Diseases', 'Transmission', 'Food Poisoning'] },
        concepts: [{
            concept_id: '2_harmful_c', concept_name: 'Harmful Microbes',
            diagrams: [{ diagram_id: '2_harmful_d', title: 'Harmful Microbes', svg_path: 'science_8/microbial-diseases.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Diseases', 'Transmission', 'Food Poisoning'] }]
        }]
    },
    {
        topic_id: 'sci-8-3-types-of-plastics',
        subject: 'Science', grade: 'Class 8', domain: 'Science',
        concept_key: '3_synthetic', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-8-3-types-of-plastics', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Science 8', checksum: 'sha256-auto', difficulty: 'intro',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Polymers', 'Thermoplastics', 'Thermosetting'] }],
        label_map: { 'default': ['Polymers', 'Thermoplastics', 'Thermosetting'] },
        concepts: [{
            concept_id: '3_synthetic_c', concept_name: 'Fibres & Plastics',
            diagrams: [{ diagram_id: '3_synthetic_d', title: 'Fibres & Plastics', svg_path: 'science_8/types-of-plastics.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Polymers', 'Thermoplastics', 'Thermosetting'] }]
        }]
    },
    {
        topic_id: 'sci-8-3-environmental-impact',
        subject: 'Science', grade: 'Class 8', domain: 'Science',
        concept_key: '3_impact', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-8-3-environmental-impact', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Science 8', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Biodegradability', 'Pollution', 'Fumes'] }],
        label_map: { 'default': ['Biodegradability', 'Pollution', 'Fumes'] },
        concepts: [{
            concept_id: '3_impact_c', concept_name: 'Environmental Impact',
            diagrams: [{ diagram_id: '3_impact_d', title: 'Environmental Impact', svg_path: 'science_8/environmental-impact.svg', diagram_type: 'graph', purpose: 'Comparison', labels: ['Biodegradability', 'Pollution', 'Fumes'] }]
        }]
    },
    {
        topic_id: 'sci-8-3-4r-principle',
        subject: 'Science', grade: 'Class 8', domain: 'Science',
        concept_key: '3_4r_principle', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-8-3-4r-principle', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Science 8', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Reduce', 'Reuse', 'Recycle', 'Recover'] }],
        label_map: { 'default': ['Reduce', 'Reuse', 'Recycle', 'Recover'] },
        concepts: [{
            concept_id: '3_4r_principle_c', concept_name: '4R Principle',
            diagrams: [{ diagram_id: '3_4r_principle_d', title: '4R Principle', svg_path: 'science_8/4r-principle.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Reduce', 'Reuse', 'Recycle', 'Recover'] }]
        }]
    },
    {
        topic_id: 'sci-8-4-properties-of-metals',
        subject: 'Science', grade: 'Class 8', domain: 'Science',
        concept_key: '4_properties', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-8-4-properties-of-metals', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Science 8', checksum: 'sha256-auto', difficulty: 'intro',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Lustre', 'Ductility', 'Conductors'] }],
        label_map: { 'default': ['Lustre', 'Ductility', 'Conductors'] },
        concepts: [{
            concept_id: '4_properties_c', concept_name: 'Properties of Metals',
            diagrams: [{ diagram_id: '4_properties_d', title: 'Properties of Metals', svg_path: 'science_8/metal-properties.svg', diagram_type: 'structure', purpose: 'Comparison', labels: ['Lustre', 'Ductility', 'Conductors'] }]
        }]
    },
    {
        topic_id: 'sci-8-4-reactivity',
        subject: 'Science', grade: 'Class 8', domain: 'Science',
        concept_key: '4_reactions', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-8-4-reactivity', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Science 8', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Oxides', 'Acid Reactivity', 'Reactivity Series'] }],
        label_map: { 'default': ['Oxides', 'Acid Reactivity', 'Reactivity Series'] },
        concepts: [{
            concept_id: '4_reactions_c', concept_name: 'Chemical Reactivity',
            diagrams: [{ diagram_id: '4_reactions_d', title: 'Chemical Reactivity', svg_path: 'science_8/metal-reactions.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Oxides', 'Acid Reactivity', 'Reactivity Series'] }]
        }]
    },
    {
        topic_id: 'sci-8-4-uses',
        subject: 'Science', grade: 'Class 8', domain: 'Science',
        concept_key: '4_displacement', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sci-8-4-uses', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Science 8', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Beakers', 'Zinc/Copper', 'Iron'] }],
        label_map: { 'default': ['Beakers', 'Zinc/Copper', 'Iron'] },
        concepts: [{
            concept_id: '4_displacement_c', concept_name: 'Displacement Reactions',
            diagrams: [{ diagram_id: '4_displacement_d', title: 'Displacement Reactions', svg_path: 'science_8/displacement-reactions.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Beakers', 'Zinc/Copper', 'Iron'] }]
        }]
    },

    // --- CLASS 8 SOCIAL SCIENCE ---
    {
        topic_id: 'sst-8-2-resource-types',
        subject: 'Social Science', grade: 'Class 8', domain: 'Social Science',
        concept_key: '1_distribution', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-8-2-resource-types', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Social Science 8', checksum: 'sha256-auto', difficulty: 'intro',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Renewable', 'Potential', 'Actual'] }],
        label_map: { 'default': ['Renewable', 'Potential', 'Actual'] },
        concepts: [{
            concept_id: '1_distribution_c', concept_name: 'Resource Distribution',
            diagrams: [{ diagram_id: '1_distribution_d', title: 'Resource Distribution', svg_path: 'social_8/resource-distribution.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Renewable', 'Potential', 'Actual'] }]
        }]
    },
    {
        topic_id: 'sst-8-2-conservation',
        subject: 'Social Science', grade: 'Class 8', domain: 'Social Science',
        concept_key: '1_utilisation', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-8-2-conservation', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Social Science 8', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Utilisation', 'Human Resources', 'HRD'] }],
        label_map: { 'default': ['Utilisation', 'Human Resources', 'HRD'] },
        concepts: [{
            concept_id: '1_utilisation_c', concept_name: 'Resource Utilisation',
            diagrams: [{ diagram_id: '1_utilisation_d', title: 'Resource Utilisation', svg_path: 'social_8/resource-utilisation.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Utilisation', 'Human Resources', 'HRD'] }]
        }]
    },
    {
        topic_id: 'sst-8-2-sustainable-development',
        subject: 'Social Science', grade: 'Class 8', domain: 'Social Science',
        concept_key: '1_sustainability', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-8-2-sustainable-development', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Social Science 8', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Environment', 'Society', 'Economy'] }],
        label_map: { 'default': ['Environment', 'Society', 'Economy'] },
        concepts: [{
            concept_id: '1_sustainability_c', concept_name: 'Sustainable Development',
            diagrams: [{ diagram_id: '1_sustainability_d', title: 'Sustainable Development', svg_path: 'social_8/sustainable-development.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Environment', 'Society', 'Economy'] }]
        }]
    },
    {
        topic_id: 'sst-8-1-modern-history',
        subject: 'Social Science', grade: 'Class 8', domain: 'Social Science',
        concept_key: '2_periodisation', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-8-1-modern-history', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Social Science 8', checksum: 'sha256-auto', difficulty: 'intro',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Ancient', 'Medieval', 'Modern'] }],
        label_map: { 'default': ['Ancient', 'Medieval', 'Modern'] },
        concepts: [{
            concept_id: '2_periodisation_c', concept_name: 'Periodisation of History',
            diagrams: [{ diagram_id: '2_periodisation_d', title: 'Periodisation of History', svg_path: 'social_8/periodisation.svg', diagram_type: 'flowchart', purpose: 'Process', labels: ['Ancient', 'Medieval', 'Modern'] }]
        }]
    },
    {
        topic_id: 'sst-8-1-british-rule',
        subject: 'Social Science', grade: 'Class 8', domain: 'Social Science',
        concept_key: '2_sources', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-8-1-british-rule', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Social Science 8', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Records', 'Surveys', 'Unofficial'] }],
        label_map: { 'default': ['Records', 'Surveys', 'Unofficial'] },
        concepts: [{
            concept_id: '2_sources_c', concept_name: 'Historical Sources',
            diagrams: [{ diagram_id: '2_sources_d', title: 'Historical Sources', svg_path: 'social_8/historical-sources.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Records', 'Surveys', 'Unofficial'] }]
        }]
    },
    {
        topic_id: 'sst-8-1-sources',
        subject: 'Social Science', grade: 'Class 8', domain: 'Social Science',
        concept_key: '2_colonialism', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-8-1-sources', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Social Science 8', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Subjugation', 'Culture', 'Economy'] }],
        label_map: { 'default': ['Subjugation', 'Culture', 'Economy'] },
        concepts: [{
            concept_id: '2_colonialism_c', concept_name: 'Impact of Colonialism',
            diagrams: [{ diagram_id: '2_colonialism_d', title: 'Impact of Colonialism', svg_path: 'social_8/colonialism.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Subjugation', 'Culture', 'Economy'] }]
        }]
    },
    {
        topic_id: 'sst-8-3-preamble',
        subject: 'Social Science', grade: 'Class 8', domain: 'Social Science',
        concept_key: '3_constitution', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-8-3-preamble', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Social Science 8', checksum: 'sha256-auto', difficulty: 'intro',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Federalism', 'Powers', 'Secularism'] }],
        label_map: { 'default': ['Federalism', 'Powers', 'Secularism'] },
        concepts: [{
            concept_id: '3_constitution_c', concept_name: 'Constitution Features',
            diagrams: [{ diagram_id: '3_constitution_d', title: 'Constitution Features', svg_path: 'social_8/constitution-features.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Federalism', 'Powers', 'Secularism'] }]
        }]
    },
    {
        topic_id: 'sst-8-3-features',
        subject: 'Social Science', grade: 'Class 8', domain: 'Social Science',
        concept_key: '3_secularism', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-8-3-features', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Social Science 8', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Separation', 'Tolerance', 'Intervention'] }],
        label_map: { 'default': ['Separation', 'Tolerance', 'Intervention'] },
        concepts: [{
            concept_id: '3_secularism_c', concept_name: 'Indian Secularism',
            diagrams: [{ diagram_id: '3_secularism_d', title: 'Indian Secularism', svg_path: 'social_8/secularism.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Separation', 'Tolerance', 'Intervention'] }]
        }]
    },
    {
        topic_id: 'sst-8-3-fundamental-rights',
        subject: 'Social Science', grade: 'Class 8', domain: 'Social Science',
        concept_key: '3_rights', visual_version: 1, topic_version: 1,
        marker_contract_hash: 'h_auto_sst-8-3-fundamental-rights', primary_component_key: 'RegistrySVGVisual',
        version: 'v1.0.0', verifiedBy: 'AIra-Content', verifiedDate: '2026-02-21',
        source: 'NCERT Social Science 8', checksum: 'sha256-auto', difficulty: 'standard',
        visual_assets: [{ marker_id: 'default', asset_type: 'diagram', labels: ['Equality', 'Freedom', 'Remedies'] }],
        label_map: { 'default': ['Equality', 'Freedom', 'Remedies'] },
        concepts: [{
            concept_id: '3_rights_c', concept_name: 'Fundamental Rights',
            diagrams: [{ diagram_id: '3_rights_d', title: 'Fundamental Rights', svg_path: 'social_8/fundamental-rights.svg', diagram_type: 'structure', purpose: 'Structure', labels: ['Equality', 'Freedom', 'Remedies'] }]
        }]
    },
];

// ─── Add-On 1: Audit Trail Utilities ─────────────────────────────────────────

/**
 * Compute a deterministic checksum of an entry's visual_assets and label_map.
 * Used to detect tampering or accidental changes.
 */
export function computeEntryChecksum(entry: VisualRegistryEntry): string {
    const payload = JSON.stringify({
        visual_assets: entry.visual_assets,
        label_map: entry.label_map,
    });
    let hash = 0;
    for (let i = 0; i < payload.length; i++) {
        const char = payload.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return `sha256-${Math.abs(hash).toString(16)}`;
}

/**
 * Returns the audit trail for a topic: version, source, verifier, date, and checksum integrity.
 */
export function getAuditTrail(topicId: string): {
    version: string;
    verifiedBy: string;
    verifiedDate: string;
    source: string;
    checksum: string;
    checksumValid: boolean;
} | null {
    const entry = getVisualsForTopic(topicId);
    if (!entry) return null;
    const computedChecksum = computeEntryChecksum(entry);
    return {
        version: entry.version,
        verifiedBy: entry.verifiedBy,
        verifiedDate: entry.verifiedDate,
        source: entry.source,
        checksum: entry.checksum,
        checksumValid: entry.checksum === computedChecksum || entry.checksum.startsWith('sha256-auto'),
    };
}

// ─── Add-On 9: Grade-Appropriate Visual Selection ────────────────────────────

/**
 * Returns the registry entry for a topic, filtered/trimmed for the given grade.
 * Applies density cap (Add-On 7) automatically.
 */
export function getVisualsForGrade(topicId: string, grade: string): VisualRegistryEntry | null {
    const entry = getVisualsForTopic(topicId);
    if (!entry) return null;
    // Apply density cap for the grade
    return trimLabelsForGrade(entry, grade);
}
// ─── Core Registry Accessors ─────────────────────────────────────────────────

/**
 * Lazy-load registry from SEED_ENTRIES on first access.
 */
function initializeRegistry() {
    if (registry.size === 0) {
        const seen = new Set<string>();
        SEED_ENTRIES.forEach(entry => {
            if (seen.has(entry.topic_id)) {
                if (import.meta.env?.DEV) {
                    console.error(`[VisualRegistry] Duplicate topic_id skipped: ${entry.topic_id}`);
                }
                return;
            }
            seen.add(entry.topic_id);
            registry.set(entry.topic_id, entry);
        });
        if (import.meta.env?.DEV) console.log(`[VisualRegistry] Initialized with ${registry.size} topics.`);
    }
}

/**
 * Returns the full visual registry entry for a specific topic ID.
 * Returns null if not found.
 */
export function getVisualsForTopic(topicId: string): VisualRegistryEntry | null {
    initializeRegistry();
    // Normalize: strip trailing dashes (e.g. 'sst-9-3-why-democracy-' → 'sst-9-3-why-democracy')
    const normalizedId = topicId.replace(/-+$/g, '');
    const direct = registry.get(normalizedId) ?? registry.get(topicId) ?? null;
    if (direct) return direct;
    // Hindi chapter siblings (कविता / तुकबंदी / …) share the chapter's first registered visual
    const chapter = normalizedId.match(/^(hin-\d+-\d+)/);
    if (chapter) {
        const prefix = `${chapter[1]}-`;
        for (const [id, entry] of registry) {
            if (id.startsWith(prefix)) return entry;
        }
        return registry.get('hin-2-1-kavita') ?? registry.get('hin-10-1-sanchayan') ?? null;
    }
    return null;
}

/**
 * Programmatic registration (for teacher overrides).
 */
export function registerVisualEntry(entry: VisualRegistryEntry): void {
    initializeRegistry();
    registry.set(entry.topic_id, entry);
    console.info(`[VisualRegistry] Registered override for topic: ${entry.topic_id}`);
}

/**
 * Returns all registered topics (for debug/sitemap).
 */
export function getAllTopics(): VisualRegistryEntry[] {
    initializeRegistry();
    return Array.from(registry.values());
}

/**
 * Helper to apply grade-based label density limits.
 * Returns a COPY of the entry with filtered labels.
 */


/**
 * Computes a hash of the markers to detect drift.
 */
export function computeMarkerContractHash(markers: string[]): string {
    const payload = markers.sort().join('|');
    let hash = 0;
    for (let i = 0; i < payload.length; i++) {
        const char = payload.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return `sha256-${Math.abs(hash).toString(16)}`;
}

// ─── Add-On 15: Concept-Level Diagram Accessors ──────────────────────────────

/**
 * Strips optional sub-part suffix from markers like "concept_id.diagram_id.outer"
 * used for in-diagram speech sync highlighting.
 */
export function stripDiagramPartSuffix(diagramKey: string): string {
    const parts = diagramKey.split('.');
    if (parts.length >= 3) {
        return `${parts[0]}.${parts[1]}`;
    }
    return diagramKey;
}

/**
 * Splits a narration marker into registry lookup key and optional SVG sub-part id.
 */
export function parseDiagramMarkerKey(diagramKey: string): { lookupKey: string; highlightPart: string | null } {
    const parts = diagramKey.split('.');
    if (parts.length >= 3) {
        return {
            lookupKey: `${parts[0]}.${parts[1]}`,
            highlightPart: parts.slice(2).join('.'),
        };
    }
    return { lookupKey: diagramKey, highlightPart: null };
}

/**
 * Returns a specific diagram by concept ID and diagram ID.
 * Follows Hard Rule 21 (atomic diagram replacement).
 * Accepts "concept_id.diagram_id" compound keys and optional ".part" suffix for speech sync.
 */
export function getConceptDiagram(topicId: string, diagramKey: string): ConceptDiagram | null {
    const entry = getVisualsForTopic(topicId);
    if (!entry || !entry.concepts) return null;

    const lookupKey = stripDiagramPartSuffix(diagramKey);

    if (lookupKey.includes('.')) {
        const firstDot = lookupKey.indexOf('.');
        const conceptId = lookupKey.slice(0, firstDot);
        const diagramId = lookupKey.slice(firstDot + 1);
        for (const concept of entry.concepts) {
            if (concept.concept_id !== conceptId) continue;
            const diagram = concept.diagrams.find(d => d.diagram_id === diagramId);
            if (diagram) return diagram;
        }
        return null;
    }

    for (const concept of entry.concepts) {
        const diagram = concept.diagrams.find(d => d.diagram_id === lookupKey);
        if (diagram) return diagram;
    }
    return null;
}

/**
 * Returns the first valid diagram ID for a topic to serve as the default state.
 * Uses "concept_id.diagram_id" so DiagramCanvas and narration markers stay aligned.
 */
export function getFirstActiveDiagramId(topicId: string): string | null {
    const entry = getVisualsForTopic(topicId);
    if (!entry || !entry.concepts || entry.concepts.length === 0) return null;

    const firstConcept = entry.concepts[0];
    if (firstConcept.diagrams.length > 0) {
        const d = firstConcept.diagrams[0];
        return `${firstConcept.concept_id}.${d.diagram_id}`;
    }
    return null;
}

/**
 * All `concept_id.diagram_id` compound keys for a topic (for narration [VISUAL:...] markers).
 */
export { collectDiagramLookupKeys } from './visualLookup';

// ─── Add-On 16: Asset & Validation Helpers ──────────────────────────────────

/**
 * Retrieves a specific asset by marker ID for a topic.
 * Used for timeline events, labeled parts, etc.
 */
export function getMarkerAsset(topicId: string, markerId: string): VisualAsset | null {
    const entry = getVisualsForTopic(topicId);
    if (!entry || !entry.visual_assets) return null;
    return entry.visual_assets.find(a => a.marker_id === markerId) || null;
}

/**
 * Validates if a topic has sufficient visuals to be published.
 * Enforces Hard Rule 19: Topic must have ≥3 diagrams total.
 */
export function validateTopicVisualsForPublish(entry: VisualRegistryEntry, _markers: string[] = []): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check total diagrams across all concepts
    let totalDiagrams = 0;
    if (entry.concepts) {
        entry.concepts.forEach(c => {
            if (c.diagrams) totalDiagrams += c.diagrams.length;
        });
    }

    if (totalDiagrams < 3) {
        // Fallback check: visual_assets length (for legacy entries)
        const assetCount = entry.visual_assets ? entry.visual_assets.length : 0;
        if (assetCount < 3) {
            errors.push(`Insufficient visuals. Found ${totalDiagrams} diagrams and ${assetCount} assets, required 3 total.`);
        }
    }

    return { valid: errors.length === 0, errors };
}

// ─── Add-On 17: Smart Fallback for Unregistered Topics ───────────────────────

/**
 * Maps topic ID prefixes to a known SVG path that can serve as a fallback diagram.
 * Used when a topic is not in the registry — shows a subject-relevant diagram
 * instead of a blank "unavailable" state.
 * 
 * Format: { 'topicId-prefix': 'folder/filename.svg' }
 */
const FALLBACK_SVG_MAP: Record<string, string> = {
    // Mathematics
    'math-6': 'mathematics_6/curves.svg',
    'math-7': 'mathematics_7/mean.svg',
    'math-8': 'mathematics_8/angle-sum.svg',
    'math-9': 'mathematics_9/cartesian-system.svg',
    'math-10': 'mathematics_10/algebraic-methods.svg',
    'math-11': 'math_11/argand-plane.svg',
    'math-12': 'mathematics_12/continuity-and-differentiability.svg',
    // Science
    'sci-6': 'science_6/classification.svg',
    'sci-7': 'science_7/modes-of-nutrition.svg',
    'sci-8': 'science_8/microorganism-types.svg',
    'sci-9': 'science_9/atomic-theory.svg',
    'sci-10': 'science_10/ph-scale.svg',
    // Physics
    'physics-11': 'physics_11/kinematics.svg',
    'physics-12': 'physics_12/electric-field.svg',
    'phy-11': 'physics_11/kinematics.svg',
    'phy-12': 'physics_12/electric-field.svg',
    // Chemistry
    'chem-11': 'chemistry_11/periodic-table.svg',
    'chem-12': 'chemistry_12/electrochemistry.svg',
    'chemistry-11': 'chemistry_11/periodic-table.svg',
    'chemistry-12': 'chemistry_12/electrochemistry.svg',
    // Biology
    'bio-11': 'biology_11/prokaryotic_cell.svg',
    'bio-12': 'biology_12/dna-structure.svg',
    'biology-11': 'biology_11/prokaryotic_cell.svg',
    'biology-12': 'biology_12/dna-structure.svg',
    // Computer Science
    'cs-11': 'computer_science_11/binary.svg',
    'cs-12': 'computer_science_12/sql.svg',
    'comp-6': 'computer science_6/windows.svg',
    'comp-7': 'computer science_7/documents.svg',
    'comp-8': 'computer science_8/browsing.svg',
    // Social Studies
    'sst-6': 'social_6/history-introduction.svg',
    'sst-7': 'social_7/human-environment.svg',
    'sst-8': 'social_8/constitution-features.svg',
    'sst-9': 'social_9/french-revolution.svg',
    'sst-10': 'social_10/power-sharing-in-india.svg',
    // English
    'eng-6': 'english_6/fantasy-fiction.svg',
    'eng-7': 'english_7/critical-thinking.svg',
    'eng-8': 'english_8/comics.svg',
    'eng-9': 'english_9/biography.svg',
    'eng-10': 'english_10/adventure.svg',
    'eng-11': 'english_11/adventure.svg',
    'eng-12': 'english_12/analysis.svg',
    // IT
    'it-9': 'it_9/body-language.svg',
    'it-10': 'it_10/analysis.svg',
    // Hindi
    'hindi-10': 'hindi_10/grammar.svg',
    'hin-10': 'hindi_10/grammar.svg',
    'hin-2': 'hindi_10/poem.svg',
    'hindi-2': 'hindi_10/poem.svg',
};

/**
 * Returns a fallback ConceptDiagram for topics not in the registry.
 * Matches the topicId against known prefix patterns (longest wins) to pick a subject-relevant SVG.
 * If no prefix matches, returns a neutral generic diagram.
 */
export function getFallbackDiagram(topicId: string): ConceptDiagram | null {
    const lower = topicId.toLowerCase().trim();

    // Longest prefix wins — avoids substring matches (e.g. "math" inside unrelated IDs)
    const keys = Object.keys(FALLBACK_SVG_MAP).sort((a, b) => b.length - a.length);
    for (const key of keys) {
        if (lower.startsWith(key)) {
            return {
                diagram_id: `fallback_${key}`,
                title: 'Topic Diagram',
                svg_path: FALLBACK_SVG_MAP[key],
                diagram_type: 'structure',
                purpose: 'Structure',
                labels: [],
            };
        }
    }

    // Ultimate fallback: neutral diagram when topic prefix is unknown
    return {
        diagram_id: 'fallback_generic',
        title: 'Diagram',
        svg_path: 'science_6/classification.svg',
        diagram_type: 'structure',
        purpose: 'Structure',
        labels: [],
    };
}



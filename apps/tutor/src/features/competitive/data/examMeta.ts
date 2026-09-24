/** Per-exam branding copy for Competitive Mode cards and headers. */

export interface ExamMeta {
    tagline: string;
    focus: string;
    tier: string;
    category: 'engineering' | 'medical' | 'state' | 'scholarship' | 'school' | 'olympiad';
}

export const EXAM_META: Record<string, ExamMeta> = {
    'jee-main': {
        tagline: 'National engineering gateway — Physics, Chemistry & Mathematics at speed.',
        focus: 'NTA pattern · Numerical + MCQ',
        tier: 'National',
        category: 'engineering',
    },
    'jee-advanced': {
        tagline: 'IIT pathway with multi-correct, paragraph & matrix match depth.',
        focus: 'Advanced reasoning · High stamina',
        tier: 'Elite',
        category: 'engineering',
    },
    neet: {
        tagline: 'Medical entrance mastery across PCB with precision timing.',
        focus: 'NMC pattern · High volume',
        tier: 'National',
        category: 'medical',
    },
    eamcet: {
        tagline: 'State engineering & agriculture entrance with MPC / BiPC tracks.',
        focus: 'TS / AP pattern',
        tier: 'State',
        category: 'state',
    },
    gate: {
        tagline: 'Postgraduate engineering aptitude — core + GA under strict timing.',
        focus: 'IIT / IISc pattern',
        tier: 'National',
        category: 'engineering',
    },
    polycet: {
        tagline: 'Polytechnic entrance built on Class 10 Maths & Science fluency.',
        focus: 'Diploma pathway',
        tier: 'State',
        category: 'state',
    },
    ntse: {
        tagline: 'Scholarship stage for MAT + SAT — reasoning meets school syllabus.',
        focus: 'Stage I / II style',
        tier: 'Scholarship',
        category: 'scholarship',
    },
    'rjc-cet': {
        tagline: 'Residential junior college entry with balanced MPC / BiPC prep.',
        focus: 'State board aligned',
        tier: 'State',
        category: 'state',
    },
    sainik: {
        tagline: 'Defence school admission — maths, intelligence, language & GK.',
        focus: 'AISSEE style',
        tier: 'Defence',
        category: 'school',
    },
    navodaya: {
        tagline: 'JNVST mental ability, arithmetic and language for Class 6 entry.',
        focus: 'JNVST pattern',
        tier: 'National',
        category: 'school',
    },
    kv: {
        tagline: 'Kendriya Vidyalaya admission readiness across core Class subjects.',
        focus: 'Balanced five-subject',
        tier: 'Central',
        category: 'school',
    },
    emrs: {
        tagline: 'EMRS entrance focusing on mental ability, arithmetic and language.',
        focus: 'Tribal school pathway',
        tier: 'National',
        category: 'school',
    },
    nmms: {
        tagline: 'National Means-cum-Merit — MAT & SAT scholarship paper craft.',
        focus: 'Scholarship exam',
        tier: 'Scholarship',
        category: 'scholarship',
    },
    olympiad: {
        tagline: 'Olympiad edge — conceptual depth beyond school textbooks.',
        focus: 'SOF / national style',
        tier: 'Olympiad',
        category: 'olympiad',
    },
    'rgukt-iiit': {
        tagline: 'RGUKT / IIIT foundation entry across MPC and BiPC streams.',
        focus: 'Campus entrance',
        tier: 'State',
        category: 'state',
    },
};

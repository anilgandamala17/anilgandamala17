/**
 * Conservative import rewrite for teaching feature move.
 * Only remaps known moved modules — does NOT rewrite arbitrary ../ roots.
 */
import fs from 'fs';
import path from 'path';

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === 'dist') continue;
      walk(p, out);
    } else if (/\.(tsx?)$/.test(e.name)) out.push(p);
  }
  return out;
}

const MODULE_REMAPS = [
  ['stores/teachingStore', 'features/teaching/stores/teachingStore'],
  ['hooks/useSessionControl', 'features/teaching/hooks/useSessionControl'],
  ['hooks/useSpeechSync', 'features/teaching/hooks/useSpeechSync'],
  ['hooks/useCachedSegmentPlayback', 'features/teaching/hooks/useCachedSegmentPlayback'],
  ['hooks/useLiveCaptions', 'features/teaching/hooks/useLiveCaptions'],
  // useSpeech before useSpeechRecognition — longest match wins via sort
  ['hooks/useSpeech', 'features/teaching/hooks/useSpeech'],
  ['pages/TeachingPage', 'pages/student/TeachingPage'],
  ['components/studio', 'features/teaching/studio'],
  ['components/teaching', 'features/teaching/components'],
];

function rewriteImportPath(specifier) {
  // Do NOT remap useSpeechRecognition
  if (
    specifier.includes('useSpeechRecognition') ||
    specifier.endsWith('/useSpeechRecognition')
  ) {
    return specifier;
  }

  if (specifier.startsWith('@/features/teaching/')) return specifier;

  let body = specifier.startsWith('@/') ? specifier.slice(2) : specifier;

  const sorted = [...MODULE_REMAPS].sort((a, b) => b[0].length - a[0].length);
  for (const [from, to] of sorted) {
    // Special: hooks/useSpeech must not match useSpeechRecognition
    if (from === 'hooks/useSpeech') {
      const re = /(^|\/)hooks\/useSpeech(?!Recognition)(\b|\/|'|"|$)/;
      if (!re.test(body) && !body.includes('hooks/useSpeech')) continue;
      // more precise
      const idx = body.indexOf('hooks/useSpeech');
      if (idx === -1) continue;
      if (body.slice(idx).startsWith('hooks/useSpeechRecognition')) continue;
      const before = body.slice(0, idx);
      if (
        specifier.startsWith('@/') ||
        before.includes('..') ||
        before.startsWith('.') ||
        before === ''
      ) {
        return `@/${to}${body.slice(idx + from.length)}`;
      }
      continue;
    }

    const idx = body.indexOf(from);
    if (idx === -1) continue;
    if (idx > 0 && body[idx - 1] !== '/' && beforeCharOk(body, idx) === false) continue;
    if (idx > 0 && body[idx - 1] !== '/') continue;
    const before = body.slice(0, idx);
    if (
      specifier.startsWith('@/') ||
      before.includes('..') ||
      before.startsWith('.') ||
      before === ''
    ) {
      return `@/${to}${body.slice(idx + from.length)}`;
    }
  }
  return specifier;
}

function beforeCharOk() {
  return true;
}

function rewriteFile(file) {
  let s = fs.readFileSync(file, 'utf8');
  const orig = s;
  const rel = path.relative(path.join(process.cwd(), 'src'), file).replace(/\\/g, '/');

  s = s.replace(
    /((?:from|import)\s*\(?\s*)(['"])([^'"]+)\2/g,
    (full, pre, q, spec) => {
      const next = rewriteImportPath(spec);
      if (next === spec) return full;
      return `${pre}${q}${next}${q}`;
    },
  );

  s = s.replace(/import\(\s*(['"])([^'"]+)\1\s*\)/g, (full, q, spec) => {
    const next = rewriteImportPath(spec);
    if (next === spec) return full;
    return `import(${q}${next}${q})`;
  });

  // Point: doubtStore relative teachingStore
  if (rel === 'stores/doubtStore.ts') {
    s = s.replaceAll(
      "from './teachingStore'",
      "from '@/features/teaching/stores/teachingStore'",
    );
  }

  // Teaching feature internals: convert broken ../../ to @/ for globals only
  if (rel.startsWith('features/teaching/')) {
    const globals = [
      ['../../stores/', '@/stores/'],
      ['../stores/', '@/stores/'],
      ['../../hooks/', '@/hooks/'],
      ['../hooks/', '@/hooks/'],
      ['../../services/', '@/services/'],
      ['../services/', '@/services/'],
      ['../../utils/', '@/utils/'],
      ['../utils/', '@/utils/'],
      ['../../data/', '@/data/'],
      ['../data/', '@/data/'],
      ['../../lib/', '@/lib/'],
      ['../lib/', '@/lib/'],
      ['../../types', '@/types'],
      ['../types', '@/types'],
      ['../../components/common/', '@/components/common/'],
      ['../components/common/', '@/components/common/'],
      ['../../components/brand/', '@/components/brand/'],
    ];
    // Only apply if still relative (not already remapped)
    for (const [from, to] of globals) {
      // Skip remapping feature-local hooks/stores incorrectly:
      // ../hooks/useSpeech inside features/teaching/hooks is sibling — leave
      if (from.includes('hooks/') || from.includes('stores/')) {
        // If pointing at teaching-owned modules that moved with us, fix to feature path
        continue;
      }
      if (s.includes(`from '${from}`) || s.includes(`from "${from}`)) {
        s = s.replaceAll(`from '${from}`, `from '${to}`);
        s = s.replaceAll(`from "${from}`, `from "${to}`);
      }
    }

    // Feature-local hook imports that still say @/hooks/useSpeech etc after remap should be fine
    // Sibling: from './useCachedSegmentPlayback' inside useSpeech — OK
    // From components: '@/features/teaching/hooks/...' after MODULE_REMAP — OK

    // Fix teachingStore remaining relatives inside feature
    s = s.replaceAll(
      "from '../../stores/teachingStore'",
      "from '@/features/teaching/stores/teachingStore'",
    );
    s = s.replaceAll(
      "from '../stores/teachingStore'",
      "from '@/features/teaching/stores/teachingStore'",
    );
    s = s.replaceAll(
      "from '@/stores/teachingStore'",
      "from '@/features/teaching/stores/teachingStore'",
    );

    // Shared global stores still needed
    for (const store of [
      'authStore',
      'toastStore',
      'settingsStore',
      'analyticsStore',
      'doubtStore',
      'documentStore',
      'resourceStore',
      'userStore',
    ]) {
      s = s.replaceAll(
        `from '../../stores/${store}'`,
        `from '@/stores/${store}'`,
      );
      s = s.replaceAll(
        `from '../stores/${store}'`,
        `from '@/stores/${store}'`,
      );
    }

    // Global services/utils/data/hooks (non-teaching)
    for (const [prefix, alias] of [
      ['../../services/', '@/services/'],
      ['../services/', '@/services/'],
      ['../../utils/', '@/utils/'],
      ['../utils/', '@/utils/'],
      ['../../data/', '@/data/'],
      ['../data/', '@/data/'],
      ['../../lib/', '@/lib/'],
      ['../lib/', '@/lib/'],
      ['../../hooks/useSpeechRecognition', '@/hooks/useSpeechRecognition'],
      ['../hooks/useSpeechRecognition', '@/hooks/useSpeechRecognition'],
      ['../../hooks/useSignOut', '@/hooks/useSignOut'],
      ['../hooks/useSignOut', '@/hooks/useSignOut'],
      ['../../components/common/', '@/components/common/'],
      ['../components/common/', '@/components/common/'],
      ['../../components/brand/', '@/components/brand/'],
      ['../components/brand/', '@/components/brand/'],
      ["from '../../types'", "from '@/types'"],
      ["from '../types'", "from '@/types'"],
      ['from "../../types"', 'from "@/types"'],
      ['from "../types"', 'from "@/types"'],
    ]) {
      if (prefix.startsWith('from ')) {
        s = s.replaceAll(prefix, alias);
      } else {
        s = s.replaceAll(`from '${prefix}`, `from '${alias}`);
        s = s.replaceAll(`from "${prefix}`, `from "${alias}`);
        s = s.replaceAll(`import('${prefix}`, `import('${alias}`);
        s = s.replaceAll(`import("${prefix}`, `import("${alias}`);
      }
    }

    // Intra-feature: hooks referencing each other via @/hooks → feature
    s = s.replaceAll(
      "from '@/hooks/useCachedSegmentPlayback'",
      "from '@/features/teaching/hooks/useCachedSegmentPlayback'",
    );
    s = s.replaceAll(
      "from './useCachedSegmentPlayback'",
      "from './useCachedSegmentPlayback'",
    );
    s = s.replaceAll(
      "from '@/hooks/useSpeech'",
      "from '@/features/teaching/hooks/useSpeech'",
    );
    s = s.replaceAll(
      "from './useSpeech'",
      "from './useSpeech'",
    );
  }

  // pages/student/TeachingPage — globals already @/; ensure teaching paths
  if (rel === 'pages/student/TeachingPage.tsx') {
    // Convert remaining single-level ../ that broke after move
    s = s.replaceAll("from '../", "from '@/");
    s = s.replaceAll("import('../", "import('@/");
  }

  if (s !== orig) {
    fs.writeFileSync(file, s);
    return true;
  }
  return false;
}

const files = walk('src');
let n = 0;
for (const f of files) {
  if (rewriteFile(f)) {
    n++;
    console.log('updated', path.relative(process.cwd(), f));
  }
}
console.log('files updated:', n);

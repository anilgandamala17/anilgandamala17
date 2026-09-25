/**
 * Rewrite imports after curriculum feature move.
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
    } else if (/\.(tsx?|css)$/.test(e.name)) out.push(p);
  }
  return out;
}

const MODULE_REMAPS = [
  ['stores/curriculumStore', 'features/curriculum/stores/curriculumStore'],
  ['data/schoolCurriculum', 'features/curriculum/data/schoolCurriculum'],
  ['data/seniorStreams', 'features/curriculum/data/seniorStreams'],
  ['pages/CurriculumPage', 'pages/student/CurriculumPage'],
  ['components/curriculum/StreamCard', 'features/curriculum/streams/StreamCard'],
  ['components/curriculum/StreamSelection', 'features/curriculum/streams/StreamSelection'],
  ['components/curriculum', 'features/curriculum/components'],
];

function rewriteImportPath(specifier) {
  if (specifier.startsWith('@/features/curriculum/')) return specifier;
  let body = specifier;
  if (body.startsWith('@/')) body = body.slice(2);

  const sorted = [...MODULE_REMAPS].sort((a, b) => b[0].length - a[0].length);
  for (const [from, to] of sorted) {
    const idx = body.indexOf(from);
    if (idx === -1) continue;
    if (idx > 0 && body[idx - 1] !== '/') continue;
    const before = body.slice(0, idx);
    if (specifier.startsWith('@/') || before.includes('..') || before.startsWith('.')) {
      return `@/${to}${body.slice(idx + from.length)}`;
    }
  }
  return specifier;
}

const ALIAS_ROOTS = [
  'components',
  'data',
  'hooks',
  'lib',
  'services',
  'stores',
  'types',
  'utils',
  'features',
  'pages',
];

function rewriteRelativeToAlias(spec, fileRel) {
  if (!spec.startsWith('.')) return spec;
  const m = spec.match(/^(\.\.\/)+([a-zA-Z][\w-]*)(\/.*)?$/);
  if (!m) return spec;
  const root = m[2];
  const rest = m[3] || '';
  if (!ALIAS_ROOTS.includes(root)) return spec;

  let next = `@/${root}${rest}`;

  // Feature-local data/stores under curriculum
  if (fileRel.startsWith('features/curriculum/')) {
    if (next.startsWith('@/data/')) {
      const localName = next.slice('@/data/'.length);
      const base = path.join(process.cwd(), 'src/features/curriculum/data', localName);
      if (
        [base, base + '.ts', base + '.tsx'].some((c) => fs.existsSync(c))
      ) {
        next = `@/features/curriculum/data/${localName}`;
      }
    }
    if (next.startsWith('@/stores/curriculumStore')) {
      next = '@/features/curriculum/stores/curriculumStore';
    }
    // Stream imports from components that were moved
    if (next.includes('/StreamCard') || next.includes('/StreamSelection')) {
      // handled below by explicit fixes
    }
  }
  return next;
}

function rewriteFile(file) {
  let s = fs.readFileSync(file, 'utf8');
  const orig = s;
  const rel = path.relative(path.join(process.cwd(), 'src'), file).replace(/\\/g, '/');

  s = s.replace(
    /((?:from|import)\s*\(?\s*)(['"])([^'"]+)\2/g,
    (full, pre, q, spec) => {
      let next = rewriteImportPath(spec);
      if (next === spec) next = rewriteRelativeToAlias(spec, rel);
      if (next === spec) return full;
      return `${pre}${q}${next}${q}`;
    },
  );

  s = s.replace(/import\(\s*(['"])([^'"]+)\1\s*\)/g, (full, q, spec) => {
    let next = rewriteImportPath(spec);
    if (next === spec) next = rewriteRelativeToAlias(spec, rel);
    if (next === spec) return full;
    return `import(${q}${next}${q})`;
  });

  // Explicit stream path fixes inside curriculum feature
  if (rel.startsWith('features/curriculum/')) {
    s = s.replaceAll(
      "from './StreamCard'",
      "from '@/features/curriculum/streams/StreamCard'",
    );
    s = s.replaceAll(
      "from './StreamSelection'",
      "from '@/features/curriculum/streams/StreamSelection'",
    );
    s = s.replaceAll(
      "from '../StreamCard'",
      "from '@/features/curriculum/streams/StreamCard'",
    );
    s = s.replaceAll(
      "from '../StreamSelection'",
      "from '@/features/curriculum/streams/StreamSelection'",
    );
  }

  // Point fix: curriculumStore relative in auth/analytics
  if (rel === 'stores/authStore.ts' || rel === 'stores/analyticsStore.ts') {
    s = s.replaceAll(
      "from './curriculumStore'",
      "from '@/features/curriculum/stores/curriculumStore'",
    );
  }

  if (rel === 'pages/StudentModeSelectionPage.tsx') {
    s = s.replaceAll(
      "import('./CurriculumPage')",
      "import('./student/CurriculumPage')",
    );
  }

  // index barrel may re-export Stream*
  if (rel === 'features/curriculum/components/index.ts') {
    s = s.replaceAll(
      "./StreamCard",
      "@/features/curriculum/streams/StreamCard",
    );
    s = s.replaceAll(
      "./StreamSelection",
      "@/features/curriculum/streams/StreamSelection",
    );
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

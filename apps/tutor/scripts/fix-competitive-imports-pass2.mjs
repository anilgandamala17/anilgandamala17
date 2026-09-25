/**
 * Second pass: rewrite ../../ and ../ globals under features/competitive + pages/student.
 */
import fs from 'fs';
import path from 'path';

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(tsx?)$/.test(e.name)) out.push(p);
  }
  return out;
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
];

function rewriteSpecifier(spec) {
  // Already absolute alias
  if (spec.startsWith('@/')) return spec;
  // Only relative
  if (!spec.startsWith('.')) return spec;

  // Match ../../foo or ../../../foo or ../foo where foo is a src root
  const m = spec.match(/^(\.\.\/)+([a-zA-Z][\w-]*)(\/.*)?$/);
  if (!m) return spec;
  const root = m[2];
  const rest = m[3] || '';
  if (!ALIAS_ROOTS.includes(root)) return spec;
  // Don't rewrite into feature-local siblings incorrectly:
  // If path is ../data/competitiveQuestions from features/competitive/services — that IS feature local
  // Detect: if the resolved path would leave features/competitive for something that exists under features/competitive
  return `@/${root}${rest}`;
}

function rewriteFile(file, opts = {}) {
  let s = fs.readFileSync(file, 'utf8');
  const orig = s;

  s = s.replace(
    /((?:from|import)\s*\(?\s*)(['"])([^'"]+)\2/g,
    (full, pre, q, spec) => {
      let next = rewriteSpecifier(spec);
      // Feature-local: if we aliased @/data/X but X lives under features/competitive/data, fix
      if (opts.featureLocalData && next.startsWith('@/data/')) {
        const localName = next.slice('@/data/'.length);
        const localPath = path.join(
          process.cwd(),
          'src/features/competitive/data',
          localName.endsWith('.ts') || localName.endsWith('.tsx')
            ? localName
            : // try with extensions later — keep as path
              localName,
        );
        // Check without extension
        const candidates = [
          localPath,
          localPath + '.ts',
          localPath + '.tsx',
          localPath + '/index.ts',
        ];
        if (candidates.some((c) => fs.existsSync(c))) {
          next = `@/features/competitive/data/${localName}`;
        }
      }
      if (opts.featureLocalServices && next.startsWith('@/services/')) {
        const localName = next.slice('@/services/'.length);
        const localPath = path.join(
          process.cwd(),
          'src/features/competitive/services',
          localName,
        );
        const candidates = [localPath, localPath + '.ts', localPath + '.tsx'];
        if (candidates.some((c) => fs.existsSync(c))) {
          next = `@/features/competitive/services/${localName}`;
        }
      }
      if (next === spec) return full;
      return `${pre}${q}${next}${q}`;
    },
  );

  s = s.replace(/import\(\s*(['"])([^'"]+)\1\s*\)/g, (full, q, spec) => {
    const next = rewriteSpecifier(spec);
    if (next === spec) return full;
    return `import(${q}${next}${q})`;
  });

  if (s !== orig) {
    fs.writeFileSync(file, s);
    return true;
  }
  return false;
}

let n = 0;
for (const f of walk('src/features/competitive')) {
  if (
    rewriteFile(f, {
      featureLocalData: true,
      featureLocalServices: true,
    })
  ) {
    n++;
    console.log('feat', path.relative(process.cwd(), f));
  }
}
for (const f of walk('src/pages/student')) {
  if (rewriteFile(f)) {
    n++;
    console.log('page', path.relative(process.cwd(), f));
  }
}

// Point fixes
const pointFixes = [
  [
    'src/stores/authStore.ts',
    "from './competitiveStore'",
    "from '@/features/competitive/stores/competitiveStore'",
  ],
  [
    'src/services/adapters/mockAdapter.ts',
    "from '../examSlotPlan'",
    "from '@/features/competitive/services/examSlotPlan'",
  ],
  [
    'src/pages/StudentModeSelectionPage.tsx',
    "import('./StudentCompetitivePage')",
    "import('./student/StudentCompetitivePage')",
  ],
];

for (const [file, from, to] of pointFixes) {
  if (!fs.existsSync(file)) continue;
  let s = fs.readFileSync(file, 'utf8');
  if (s.includes(from)) {
    s = s.replaceAll(from, to);
    fs.writeFileSync(file, s);
    console.log('point', file);
    n++;
  }
}

console.log('updated', n);

/**
 * Phase 5: fix imports for moved pages + mode-selection.
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

const REMAPS = [
  ['components/mode-selection', 'features/mode-selection'],
  ['pages/SettingsPage', 'pages/shared/SettingsPage'],
  ['pages/ProfilePage', 'pages/shared/ProfilePage'],
  ['pages/OnboardingPage', 'pages/shared/OnboardingPage'],
  ['pages/DemoRolesPage', 'pages/shared/DemoRolesPage'],
  ['pages/StudentModeSelectionPage', 'pages/student/StudentModeSelectionPage'],
  ['pages/TeacherDashboardPage', 'pages/teacher/TeacherDashboardPage'],
  ['pages/AdminDashboardPage', 'pages/admin/AdminDashboardPage'],
  ['pages/AdminProductAnalyticsPage', 'pages/admin/AdminProductAnalyticsPage'],
  ['pages/AdminWeeklyExamsPage', 'pages/admin/AdminWeeklyExamsPage'],
  ['pages/AdminCurriculumContentPage', 'pages/admin/AdminCurriculumContentPage'],
];

function rewriteSpec(spec) {
  if (spec.includes('features/mode-selection')) return spec;
  let body = spec.startsWith('@/') ? spec.slice(2) : spec;
  const sorted = [...REMAPS].sort((a, b) => b[0].length - a[0].length);
  for (const [from, to] of sorted) {
    const idx = body.indexOf(from);
    if (idx === -1) continue;
    if (idx > 0 && body[idx - 1] !== '/') continue;
    const before = body.slice(0, idx);
    if (spec.startsWith('@/') || before.includes('..') || before.startsWith('.') || before === '') {
      return `@/${to}${body.slice(idx + from.length)}`;
    }
  }
  return spec;
}

function rewriteFile(file) {
  let s = fs.readFileSync(file, 'utf8');
  const orig = s;
  const rel = path.relative(path.join(process.cwd(), 'src'), file).replace(/\\/g, '/');

  s = s.replace(
    /((?:from|import)\s*\(?\s*)(['"])([^'"]+)\2/g,
    (full, pre, q, spec) => {
      const next = rewriteSpec(spec);
      if (next === spec) return full;
      return `${pre}${q}${next}${q}`;
    },
  );
  s = s.replace(/import\(\s*(['"])([^'"]+)\1\s*\)/g, (full, q, spec) => {
    const next = rewriteSpec(spec);
    if (next === spec) return full;
    return `import(${q}${next}${q})`;
  });

  // CSS imports
  s = s.replaceAll(
    '@/components/mode-selection/',
    '@/features/mode-selection/',
  );
  s = s.replaceAll(
    "'../components/mode-selection/",
    "'@/features/mode-selection/",
  );

  // TeachingPage relative shared pages
  if (rel === 'pages/student/TeachingPage.tsx') {
    s = s.replaceAll("import('../SettingsPage')", "import('@/pages/shared/SettingsPage')");
    s = s.replaceAll("import('../ProfilePage')", "import('@/pages/shared/ProfilePage')");
  }

  // Mode selection page relative prefs
  if (rel === 'pages/student/StudentModeSelectionPage.tsx') {
    s = s.replaceAll(
      "from '@/components/mode-selection/",
      "from '@/features/mode-selection/",
    );
    s = s.replaceAll(
      "'@/components/mode-selection/",
      "'@/features/mode-selection/",
    );
  }

  // Feature mode-selection internals: fix ../../ globals
  if (rel.startsWith('features/mode-selection/')) {
    for (const [from, to] of [
      ["from '../../", "from '@/"],
      ["from '../brand/", "from '@/components/brand/"],
      ["from '../common/", "from '@/components/common/"],
      ["from '../../constants/", "from '@/constants/"],
      ["from '../constants/", "from '@/constants/"],
    ]) {
      s = s.replaceAll(from, to);
    }
  }

  // Shared/teacher/admin pages that used ../ for siblings
  if (
    rel.startsWith('pages/shared/') ||
    rel.startsWith('pages/teacher/') ||
    rel.startsWith('pages/admin/')
  ) {
    // Convert remaining relative ../X that point at src roots
    s = s.replace(
      /from ['"]\.\.\/(stores|hooks|utils|services|components|lib|data|types|constants|features)\//g,
      "from '@/$1/",
    );
    s = s.replace(/from ['"]\.\.\/types['"]/g, "from '@/types'");
    s = s.replace(/from ['"]\.\.\/i18n['"]/g, "from '@/i18n'");
  }

  if (s !== orig) {
    fs.writeFileSync(file, s);
    return true;
  }
  return false;
}

let n = 0;
for (const f of walk('src')) {
  if (rewriteFile(f)) {
    n++;
    console.log('updated', path.relative(process.cwd(), f));
  }
}
console.log('done', n);

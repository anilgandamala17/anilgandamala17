/**
 * Phase 3: move curriculum feature files.
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const root = process.cwd();

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function moveFile(fromRel, toRel) {
  const from = path.join(root, fromRel);
  const to = path.join(root, toRel);
  if (!fs.existsSync(from)) {
    console.warn('SKIP missing', fromRel);
    return;
  }
  ensureDir(path.dirname(to));
  if (fs.existsSync(to)) {
    console.warn('SKIP exists', toRel);
    return;
  }
  fs.renameSync(from, to);
  console.log('mv', fromRel, '→', toRel);
}

function moveDir(fromRel, toRel) {
  const from = path.join(root, fromRel);
  const to = path.join(root, toRel);
  if (!fs.existsSync(from)) {
    console.warn('SKIP missing dir', fromRel);
    return;
  }
  ensureDir(path.dirname(to));
  if (process.platform === 'win32') {
    try {
      execSync(`robocopy "${from}" "${to}" /E /MOVE /NFL /NDL /NJH /NJS /nc /ns /np`, {
        stdio: 'inherit',
      });
    } catch (e) {
      if (e.status > 7) throw e;
    }
    try {
      if (fs.existsSync(from) && fs.readdirSync(from).length === 0) fs.rmdirSync(from);
    } catch {}
  } else {
    fs.renameSync(from, to);
  }
  console.log('mvdir', fromRel, '→', toRel);
}

ensureDir('src/features/curriculum');

// Move whole curriculum components tree, then relocate streams
moveDir('src/components/curriculum', 'src/features/curriculum/components');

// Promote stream UI into streams/
moveFile(
  'src/features/curriculum/components/StreamCard.tsx',
  'src/features/curriculum/streams/StreamCard.tsx',
);
moveFile(
  'src/features/curriculum/components/StreamSelection.tsx',
  'src/features/curriculum/streams/StreamSelection.tsx',
);

moveFile(
  'src/data/schoolCurriculum.ts',
  'src/features/curriculum/data/schoolCurriculum.ts',
);
moveFile(
  'src/data/seniorStreams.ts',
  'src/features/curriculum/data/seniorStreams.ts',
);
moveFile(
  'src/stores/curriculumStore.ts',
  'src/features/curriculum/stores/curriculumStore.ts',
);
moveFile(
  'src/pages/CurriculumPage.tsx',
  'src/pages/student/CurriculumPage.tsx',
);

console.log('Phase 3 moves done');

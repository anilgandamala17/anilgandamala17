/**
 * Phase 4: move teaching + studio under features/teaching.
 * Leave useSpeechRecognition in global hooks (competitive uses it).
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

ensureDir('src/features/teaching');

moveDir('src/components/teaching', 'src/features/teaching/components');
moveDir('src/components/studio', 'src/features/teaching/studio');

moveFile(
  'src/pages/TeachingPage.tsx',
  'src/pages/student/TeachingPage.tsx',
);

moveFile(
  'src/hooks/useSessionControl.ts',
  'src/features/teaching/hooks/useSessionControl.ts',
);
moveFile(
  'src/hooks/useSpeech.ts',
  'src/features/teaching/hooks/useSpeech.ts',
);
moveFile(
  'src/hooks/useLiveCaptions.ts',
  'src/features/teaching/hooks/useLiveCaptions.ts',
);
moveFile(
  'src/hooks/useCachedSegmentPlayback.ts',
  'src/features/teaching/hooks/useCachedSegmentPlayback.ts',
);
moveFile(
  'src/hooks/useSpeechSync.ts',
  'src/features/teaching/hooks/useSpeechSync.ts',
);

moveFile(
  'src/stores/teachingStore.ts',
  'src/features/teaching/stores/teachingStore.ts',
);

console.log('Phase 4 moves done');

import fs from 'fs';
import path from 'path';

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(tsx?|css)$/.test(e.name)) out.push(p);
  }
  return out;
}

const root = 'src/features/dashboard';
const files = walk(root);
for (const file of files) {
  let s = fs.readFileSync(file, 'utf8');
  const orig = s;
  s = s.replaceAll("from '../stores/", "from '@/stores/");
  s = s.replaceAll("from '../data/", "from '@/data/");
  s = s.replaceAll("from '../lib/", "from '@/lib/");
  s = s.replaceAll("from '../utils/", "from '@/utils/");
  s = s.replaceAll("from '../types'", "from '@/types'");
  s = s.replaceAll("from '../types/", "from '@/types/");
  s = s.replaceAll(
    "from '../components/dashboard/theme/subjectColors'",
    "from '../components/theme/subjectColors'",
  );
  s = s.replaceAll("from '../../stores/", "from '@/stores/");
  s = s.replaceAll("from '../../utils/", "from '@/utils/");
  s = s.replaceAll("from '../../services/", "from '@/services/");
  s = s.replaceAll("from '../../types'", "from '@/types'");
  s = s.replaceAll("from '../../types/", "from '@/types/");
  s = s.replaceAll(
    "from '../../hooks/useCompetitiveDashboardData'",
    "from '../hooks/useCompetitiveDashboardData'",
  );
  s = s.replaceAll(
    "from '../../hooks/useDashboardInsights'",
    "from '../hooks/useDashboardInsights'",
  );
  s = s.replaceAll(
    "from '../../../hooks/useDashboardInsights'",
    "from '../../hooks/useDashboardInsights'",
  );
  s = s.replaceAll("from '../../../stores/", "from '@/stores/");
  s = s.replaceAll("from '../../../types'", "from '@/types'");
  s = s.replaceAll("from '../brand/", "from '@/components/brand/");
  s = s.replaceAll("from '../common/", "from '@/components/common/");
  s = s.replaceAll("from '../../common/", "from '@/components/common/");
  if (s !== orig) {
    fs.writeFileSync(file, s);
    console.log('updated', file);
  }
}
console.log('done', files.length);

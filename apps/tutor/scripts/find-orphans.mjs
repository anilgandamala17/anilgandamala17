import fs from 'fs';
import path from 'path';

function walk(d, o = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) {
      if (['node_modules', 'dist'].includes(e.name)) continue;
      walk(p, o);
    } else if (/\.(tsx?)$/.test(e.name)) o.push(p);
  }
  return o;
}

const files = walk('src');
const contents = new Map(files.map((f) => [f, fs.readFileSync(f, 'utf8')]));
const all = [...contents.values()].join('\n');

const candidates = [];
for (const f of files) {
  const base = path.basename(f).replace(/\.(tsx?)$/, '');
  if (['index', 'main', 'App', 'types', 'paths'].includes(base)) continue;
  const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(escaped, 'g');
  const matches = all.match(re) || [];
  if (matches.length <= 1) {
    candidates.push(path.relative('src', f).replace(/\\/g, '/'));
  }
}
console.log('possible orphans:');
candidates.forEach((c) => console.log(c));
console.log('count', candidates.length);

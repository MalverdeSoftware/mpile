import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { relative, join } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const sub = "app";
const hash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(join(dir,e.name)) : e.isFile() ? [join(dir,e.name)] : []);
}
const outputs = files(join(root, sub, 'dist')).sort().map(path => ({ path: relative(root,path), sha256: hash(path) }));
if (!outputs.length) throw new Error('Build has no output files.');
const report = {
  schema_version: 1, project: "mPile", generated_at: new Date().toISOString(),
  commit: git('rev-parse','HEAD'), working_tree_dirty: Boolean(git('status','--porcelain')),
  node: process.version, lock_sha256: hash(join(root,sub,'package-lock.json')),
  output_kind: 'local build; not a deployed release', outputs
};
mkdirSync(join(root,'.phase0'), { recursive: true });
writeFileSync(join(root,'.phase0','build-manifest.json'), JSON.stringify(report,null,2)+'\n');
console.log(`Recorded ${outputs.length} build files in .phase0/build-manifest.json`);

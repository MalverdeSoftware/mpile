// The researcher console, on this computer only: http://localhost:5173 (the deployed site shows a landing page instead).
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const cwd = fileURLToPath(new URL('../', import.meta.url));
const env = { ...process.env, VITE_MPILE_CONSOLE: 'local' };
const result = spawnSync(
  process.execPath,
  [resolve(cwd, 'scripts', 'run-framework.mjs'), 'dev', '--strictPort'],
  { cwd, env, stdio: 'inherit' },
);
if (result.error) throw result.error;
process.exit(result.status ?? 1);

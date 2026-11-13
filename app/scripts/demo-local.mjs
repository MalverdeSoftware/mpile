import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

// An isolated local relay database, separate from the everyday dev state; the Worker creates its tables.
const cwd = fileURLToPath(new URL('../', import.meta.url));
const env = { ...process.env, PILE_LOCAL_DB_PATH: resolve(cwd, '.wrangler/phase0-state') };
const result = spawnSync(
  process.execPath,
  [resolve(cwd, 'scripts', 'run-framework.mjs'), 'dev', '--host', '127.0.0.1', '--port', '5173', '--strictPort'],
  { cwd, env, stdio: 'inherit' },
);
if (result.error) throw result.error;
process.exit(result.status ?? 1);

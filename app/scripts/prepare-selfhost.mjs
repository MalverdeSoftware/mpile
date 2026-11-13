// Writes wrangler.selfhost.json (ignored by Git) for deploying the built app to your own Cloudflare account.
//   npm run deploy:prepare -- <RELAY_DB database UUID> [--domain host]... [--name worker] [--database-name name]
// Defaults are the live deployment: Worker "mpile" at mpile.app with its D1 database "mpile-relay".
// Repeat --domain to list your own. With --name alone, the database name is <name>-relay.
import { writeFileSync } from "node:fs";
import { parseArgs } from "node:util";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    domain: { type: "string", multiple: true, default: ["mpile.app"] },
    name: { type: "string" },
    "database-name": { type: "string" },
  },
});
const [databaseId] = positionals;
const { domain: domains } = values;
const name = values.name ?? "mpile";
const databaseName = values["database-name"] ?? (values.name ? `${values.name}-relay` : "mpile-relay");
if (
  positionals.length !== 1 ||
  !/^[a-f0-9-]{36}$/i.test(databaseId) ||
  !/^[a-z][a-z0-9-]{0,62}$/.test(name) ||
  !/^[a-z][a-z0-9-]{0,62}$/.test(databaseName) ||
  !domains.every((domain) => /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain))
)
  throw new Error("Usage: npm run deploy:prepare -- <RELAY_DB database UUID> [--domain host]... [--name worker] [--database-name name]");

const config = {
  name,
  main: "dist/server/index.js",
  compatibility_date: "2026-05-15",
  compatibility_flags: ["nodejs_compat"],
  no_bundle: true,
  rules: [{ type: "ESModule", globs: ["**/*.js", "**/*.mjs"] }],
  assets: { directory: "dist/client" },
  // Served only at the custom domains: no workers.dev address or preview URLs.
  routes: domains.map((domain) => ({ pattern: domain, custom_domain: true })),
  workers_dev: false,
  preview_urls: false,
  // The relay's sealed store is the only database; the Worker creates its tables on first use.
  d1_databases: [{ binding: "RELAY_DB", database_name: databaseName, database_id: databaseId }],
  // Hourly: deletes sessions past their expiry date.
  triggers: { crons: ["0 * * * *"] },
  // No request logs or traces are kept by Cloudflare's Workers observability.
  observability: { enabled: false },
};
writeFileSync("wrangler.selfhost.json", JSON.stringify(config, null, 2) + "\n");
console.log(`Wrote wrangler.selfhost.json for Worker "${name}" at ${domains.map((d) => `https://${d}`).join(" and ")}. Build, then deploy with this config.`);

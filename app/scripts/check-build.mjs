// Build checks for the deployed site (run after `npm run build`, as part of `npm run verify`):
// - the built client mentions no other origin except known references that are never loaded;
// - the deployed pages' security policy lets them connect to this site only, and the researcher console is left out.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Every origin the built client may mention, and why it is not a request to another site.
const NOT_LOADED = {
  "http://www.w3.org": "XML and SVG namespace names",
  "http://vinext.local": "Vinext's placeholder base for parsing paths",
  "https://vinext.local": "Vinext's placeholder base for parsing paths",
  "http://localhost": "Vinext's placeholder base for parsing paths",
  "https://react.dev": "documentation links in React's error messages",
  "https://nextjs.org": "a documentation link in a framework message",
  "https://github.com": "the header and landing links to the MalverdeSoftware page",
  "https://fb.me": "a documentation link in a React lifecycle warning, in a dependency of Ring UI",
};

const files = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)]));
const text = (dir) => files(dir).filter((f) => /\.(js|mjs|css|html|json|svg)$/.test(f)).map((f) => [f, readFileSync(f, "utf8")]);

const client = text("dist/client");
const found = new Map();
for (const [file, content] of client)
  for (const [origin] of content.matchAll(/https?:\/\/[A-Za-z0-9.-]+(?::\d+)?/g)) if (!found.has(origin)) found.set(origin, file);
const unexpected = [...found].filter(([origin]) => !(origin in NOT_LOADED));
assert.deepEqual(unexpected, [], "the built client mentions origins that are not known references");

const server = text("dist/server");
const worker = server.find(([file]) => file.endsWith(join("server", "index.js")))?.[1] ?? "";
assert.ok(worker.includes("frame-ancestors 'none'"), "the Worker sets the page security headers");
assert.ok(!/connect-src 'self' (https?:|http:)/.test(worker) && !worker.includes("http://127.0.0.1:*"), "deployed pages connect to this site only");
for (const [file, content] of [...client, ...server])
  assert.ok(!content.includes("Run a sealed pile sort"), `the researcher console is left out of the deployed build (${file})`);

console.log(`Build check passed: ${found.size} known non-loaded references, console excluded, connect-src 'self'.`);

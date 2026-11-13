// The whole session lifecycle through /relay on the local dev server and its local D1 (synthetic data only):
// publish, join, save, submit, status, collect, add, remove, close and delete, then the scheduled purge.
//   npm run dev   (in another terminal)   then   npm run test:integration
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join as joinPath, resolve } from "node:path";
import {
  joinSession,
  memoryStorage,
  openResearcherSession,
  parseParticipantLink,
  prepareSession,
  publishSession,
} from "@malverdesoftware/session-client";
import { BASELINE, buildDefinition, toResponses } from "../lib/session.ts";

const origin = process.env.TEST_ORIGIN || "http://localhost:5173";
if (!["localhost", "127.0.0.1"].includes(new URL(origin).hostname))
  throw Error("Integration checks run only against a local dev server.");
const relayUrl = `${origin}/relay`;
const creationKey = process.env.RELAY_DEV_CREATION_KEY || "dev-creation-key-synthetic-data-only";
const code = (expected) => (e) => e?.code === expected;

const definition = buildDefinition({
  title: "Integration check (synthetic)",
  ...BASELINE,
  randomize: true,
  cardTexts: ["¿Vienes mañana? 🌵", "Te espero afuera", "Call me"],
});
const body = (pile) => ({
  generated: [],
  piles: [{ id: "p1", name: pile, description: "" }],
  assignments: { c1: "p1", c2: "p1", c3: null },
  notes: "",
});
const session = (labels) =>
  prepareSession({ app: "mpile", title: definition.title, relayUrl, participantUrl: `${origin}/p`, definition, participantLabels: labels });
const join = (p, passcode = p.passcode) =>
  joinSession(parseParticipantLink(p.link), { app: "mpile", relayUrl, passcode, storage: memoryStorage() });
// The raw relay answer for a session, as its researcher sees it.
const sessionStatus = async (file) =>
  (await fetch(`${relayUrl}/v1/sessions/${file.sessionId}`, { headers: { Authorization: `Bearer ${file.adminToken}` } })).status;

const health = await (await fetch(`${relayUrl}/v1/health`)).json();
assert.equal(health.ok, true, "the relay answers at /relay");

// Every page carries the security headers, including React Server Components requests.
for (const [path, headers] of [["/", {}], ["/p", {}], ["/p", { RSC: "1" }]]) {
  const page = await fetch(origin + path, { headers });
  const csp = page.headers.get("content-security-policy") ?? "";
  for (const directive of ["default-src 'self'", "frame-ancestors 'none'", "base-uri 'none'", "form-action 'none'", "object-src 'none'"])
    assert.ok(csp.includes(directive), `${path} ${JSON.stringify(headers)}: CSP has ${directive}`);
  assert.equal(page.headers.get("referrer-policy"), "no-referrer");
  assert.equal(page.headers.get("x-content-type-options"), "nosniff");
  assert.equal(page.headers.get("x-frame-options"), "DENY");
  await page.body?.cancel();
}
const apiGone = await fetch(`${origin}/api/studies`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
assert.ok(apiGone.status === 404 || apiGone.status === 405, `the plaintext API is gone (got ${apiGone.status})`);

// Publish: a wrong creation key is refused; publishing again replays.
const file = await session(["Y01", "Y02", "Y03"]);
await assert.rejects(publishSession(file, { creationKey: "not-the-key" }), code("FORBIDDEN"));
await publishSession(file, { creationKey });
await publishSession(file, { creationKey });
const researcher = openResearcherSession(file);
const [y01, y02, y03] = file.participants;

try {
  // Participants: a wrong passcode is refused; Y01 submits; Y02 saves a draft; Y03 does nothing.
  await assert.rejects(join(y01, y01.passcode === "000000" ? "111111" : "000000"), code("WRONG_PASSCODE"));
  const p1 = await join(y01);
  assert.deepEqual(p1.definition, definition);
  assert.equal((await p1.saveDraft(body("Familia"))).state, "SAVED");
  await p1.submit(body("Familia 🌵"));
  await assert.rejects(p1.saveDraft(body("Changed")), code("ALREADY_SUBMITTED"));
  const p2 = await join(y02);
  assert.equal((await p2.saveDraft(body("Amigos"))).state, "SAVED");
  assert.deepEqual((await join(y02)).draft, body("Amigos"), "continues on another device");

  const status = await researcher.status();
  assert.deepEqual(status.participants.map((p) => [p.label, p.status]), [["Y01", "SUBMITTED"], ["Y02", "IN_PROGRESS"], ["Y03", "NOT_STARTED"]]);

  // Collect: submitted and drafts are kept apart, and every body passes the browser-side checks.
  const collected = await researcher.collect({ includeDrafts: true });
  const { responses, problems } = toResponses(definition, collected);
  assert.deepEqual(problems, []);
  assert.deepEqual(responses.map((r) => [r.id, r.status]), [["Y01", "submitted"], ["Y02", "draft"]]);
  assert.equal(responses[0].body.piles[0].name, "Familia 🌵");

  // Participants: add one, remove one (their data goes with them).
  await researcher.addParticipants(["Y04"]);
  await researcher.revokeParticipant(y03.label);
  await assert.rejects(join(y03), code("NOT_FOUND"), "a removed participant's link stops working");
  assert.deepEqual((await researcher.status()).participants.map((p) => p.label), ["Y01", "Y02", "Y04"]);

  // Close: no more saving; collecting still works.
  assert.equal((await researcher.close()).isClosed, true);
  await assert.rejects(p2.saveDraft(body("Late")), code("SESSION_CLOSED"));
  assert.equal((await researcher.collect()).length, 1);
} finally {
  // Delete: the relay forgets the session.
  await researcher.destroy();
}
assert.equal(await sessionStatus(file), 404, "deleted sessions are gone");

// Scheduled purge: an expired session answers 410 until the hourly purge deletes it; a live one survives.
const expired = await session(["Y01"]);
const live = await session(["Y01"]);
await publishSession(expired, { creationKey });
await publishSession(live, { creationKey });
try {
  expireLocally(expired.sessionId);
  assert.equal(await sessionStatus(expired), 410, "expired but not yet purged");
  const purge = await fetch(`${origin}/cdn-cgi/handler/scheduled?cron=${encodeURIComponent("0 * * * *")}`);
  assert.equal(purge.status, 200, "the scheduled handler ran");
  assert.equal(await sessionStatus(expired), 404, "the purge deleted the expired session");
  assert.equal(await sessionStatus(live), 200, "the purge kept the live session");
} finally {
  await openResearcherSession(live).destroy().catch(() => undefined);
}
console.log("Integration check passed: the session lifecycle and the scheduled purge, through /relay.");

// Moves one synthetic session's expiry into the past in the dev server's local D1 (the relay accepts only future
// expiry dates). Uses the same database ID and state folder as vite.config.ts.
function expireLocally(sessionId) {
  const dir = mkdtempSync(joinPath(tmpdir(), "mpile-d1-"));
  try {
    const config = joinPath(dir, "wrangler.json");
    writeFileSync(
      config,
      JSON.stringify({
        name: "mpile-integration",
        compatibility_date: "2026-05-15",
        d1_databases: [{ binding: "RELAY_DB", database_name: "mpile-relay", database_id: "00000000-0000-4000-8000-000000000000" }],
      }),
    );
    const sql = `UPDATE relay_sessions SET expires_at = '2000-01-01T00:00:00.000Z' WHERE session_id = '${sessionId.replace(/[^A-Za-z0-9_-]/g, "")}'`;
    const result = spawnSync(
      process.execPath,
      [
        resolve("node_modules/wrangler/bin/wrangler.js"),
        "d1", "execute", "RELAY_DB", "--local", "--config", config,
        "--persist-to", process.env.PILE_LOCAL_DB_PATH || resolve(".wrangler/state"),
        "--command", sql,
      ],
      { encoding: "utf8", env: { ...process.env, WRANGLER_SEND_METRICS: "false" } },
    );
    assert.equal(result.status, 0, result.stderr || result.stdout);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

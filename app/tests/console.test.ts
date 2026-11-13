import { test } from "node:test";
import assert from "node:assert/strict";
import { exportFiles, isProductionRelay, keyFileName, participantUrlFor, summarize } from "../lib/console.ts";
import { BASELINE, buildDefinition } from "../lib/session.ts";

const definition = buildDefinition({
  title: "Youth CAB text messages (synthetic)",
  ...BASELINE,
  randomize: false,
  cardTexts: ["¿Vienes mañana? 🌵", "=Te espero afuera", 'Say "hi"'],
});
const sort = (pile: string) => ({
  generated: [],
  piles: [{ id: "p1", name: pile, description: "Mensajes, ánimo" }],
  assignments: { c1: "p1", c2: "p1", c3: null },
  notes: "",
});
const items = [
  { label: "Y01", kind: "SUBMITTED" as const, body: sort("Familia 🌵"), updatedAt: "2026-11-09T15:00:00.000Z" },
  { label: "Y02", kind: "DRAFT" as const, body: sort("Amigos"), updatedAt: "2026-11-09T16:00:00.000Z" },
  { label: "Y03", kind: "SUBMITTED" as const, body: { piles: "nope" }, updatedAt: "2026-11-09T17:00:00.000Z" },
  { label: "Y04", kind: "UNREADABLE" as const, problem: "DECRYPT_FAILED", updatedAt: "2026-11-09T18:00:00.000Z" },
  { label: null, kind: "UNREADABLE" as const, problem: "NO_KEY", updatedAt: "2026-11-09T19:00:00.000Z" },
];

test("relay and participant addresses, and the key file name", () => {
  assert.equal(participantUrlFor("https://mpile.app/relay"), "https://mpile.app/p");
  assert.equal(participantUrlFor("http://127.0.0.1:5173/relay"), "http://127.0.0.1:5173/p");
  assert.ok(isProductionRelay("https://mpile.app/relay/"));
  assert.ok(!isProductionRelay("https://mpile.example/relay"));
  assert.ok(!isProductionRelay("http://127.0.0.1:5173/relay"));
  assert.equal(keyFileName("Youth CAB: ¿Mensajes? (Synthetic)"), "youth-cab-mensajes-synthetic.malverdesoftware-session.md");
});

test("collecting accounts for every item: submitted, drafts kept apart, and problems by label", () => {
  const c = summarize(definition, items, "2026-11-10T00:00:00.000Z");
  assert.deepEqual(c.submitted.map((r) => r.id), ["Y01"]);
  assert.deepEqual(c.drafts.map((r) => r.id), ["Y02"]);
  assert.deepEqual(c.problems.map((p) => p.label), ["Y03", "Y04", "(not in this key file)"]);
  assert.match(c.problems[2]!.reason, /no key/);
});

test("exports: labeled rows, drafts only in the not-submitted file, safe CSV with accents and emoji", () => {
  const files = exportFiles("Youth CAB (synthetic)", summarize(definition, items, "2026-11-10T00:00:00.000Z"));
  assert.deepEqual(files.map((f) => f.name), [
    "youth-cab-synthetic-submitted-memberships.csv",
    "youth-cab-synthetic-pairwise-similarity.csv",
    "youth-cab-synthetic-not-submitted.csv",
    "youth-cab-synthetic-archive.json",
  ]);
  const [submitted, pairs, drafts, archive] = files.map((f) => f.text);
  assert.ok(submitted!.startsWith('﻿"participant_code","revision"'), "BOM, then a participant_code column");
  assert.ok(submitted!.includes('"Y01"') && !submitted!.includes('"Y02"'), "submitted file has no drafts");
  assert.ok(drafts!.includes('"Y02"') && !drafts!.includes('"Y01"'), "drafts are kept separate");
  assert.ok(submitted!.includes('"¿Vienes mañana? 🌵"') && submitted!.includes('"Familia 🌵"'), "accents and emoji kept");
  assert.ok(submitted!.includes(`"'=Te espero afuera"`), "formula-like cells are escaped");
  assert.ok(submitted!.includes('"Say ""hi"""'), "quotes are doubled");
  assert.ok(pairs!.includes('"c1","c2","1","1","1","1"'), "pairwise uses submitted sorts only");
  const parsed = JSON.parse(archive!);
  assert.equal(parsed.format, "mpile-session-archive/v1");
  assert.equal(parsed.items.length, items.length);
  assert.deepEqual(parsed.definition, definition);
  assert.equal(parsed.problems.length, 3);
});

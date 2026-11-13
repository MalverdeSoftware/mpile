import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BASELINE,
  buildDefinition,
  checkResponse,
  fileSlug,
  orderCards,
  parseLabels,
  readDefinition,
  toResponses,
  toStudy,
} from "../lib/session.ts";
import { membershipRows } from "../lib/analysis.ts";

const definition = buildDefinition({
  title: "Youth CAB text messages (synthetic)",
  ...BASELINE,
  randomize: true,
  cardTexts: ["¿Vienes mañana? 🌵", "Te espero afuera", "  ", "Call me when you get this"],
});

test("buildDefinition numbers cards stably and drops blank lines", () => {
  assert.deepEqual(definition.cards.map((c) => c.id), ["c1", "c2", "c3"]);
  assert.equal(definition.cards[0]!.text, "¿Vienes mañana? 🌵");
  const many = buildDefinition({ ...definition, cardTexts: Array.from({ length: 12 }, (_, i) => `card ${i}`) });
  assert.equal(many.cards[0]!.id, "c01");
  assert.throws(() => buildDefinition({ ...definition, cardTexts: [] }), /at least one card/);
  assert.throws(() => buildDefinition({ ...definition, cardTexts: Array.from({ length: 101 }, (_, i) => `${i}`) }), /no more than 100/);
  assert.throws(() => buildDefinition({ ...definition, title: " ", cardTexts: ["a"] }), /title/);
  assert.throws(() => buildDefinition({ ...definition, cardTexts: ["Te espero", " Te espero "] }), /more than once/);
});

test("readDefinition accepts only the sort schema", () => {
  assert.deepEqual(readDefinition(JSON.parse(JSON.stringify(definition))), definition);
  assert.throws(() => readDefinition({ ...definition, schema: "other/v1" }), /could not be read/);
  assert.throws(() => readDefinition({ ...definition, cards: [definition.cards[0], definition.cards[0]] }), /could not be read/);
});

test("checkResponse enforces sort-mode rules in the browser", () => {
  const good = {
    generated: [],
    piles: [{ id: "p1", name: "Ánimo", description: "" }],
    assignments: { c1: "p1", c2: null },
    notes: "",
  };
  assert.deepEqual(checkResponse(definition, good), good);
  assert.throws(() => checkResponse(definition, { ...good, assignments: { c9: "p1" } }), /card or pile/);
  assert.throws(() => checkResponse(definition, { ...good, generated: [{ id: "x", text: "mine" }] }), /provided cards only/);
  assert.throws(() => checkResponse(definition, { piles: [] }), /generated/);
});

test("collected responses feed the existing exports, labeled by participant code", () => {
  const body = { generated: [], piles: [{ id: "p1", name: "Ánimo", description: "" }], assignments: { c1: "p1" }, notes: "" };
  const { responses, problems } = toResponses(definition, [
    { label: "Y01", kind: "SUBMITTED", body, updatedAt: "2026-11-09T15:00:00.000Z" },
    { label: "Y02", kind: "DRAFT", body, updatedAt: "2026-11-09T16:00:00.000Z" },
    { label: null, kind: "SUBMITTED", body: { nonsense: true }, updatedAt: "2026-11-09T17:00:00.000Z" },
  ]);
  assert.deepEqual(responses.map((r) => [r.id, r.status]), [["Y01", "submitted"], ["Y02", "draft"]]);
  assert.equal(problems.length, 1);
  assert.equal(problems[0]!.label, "(not in this key file)");
  const rows = membershipRows(toStudy(definition).cards, responses.filter((r) => r.status === "submitted"));
  assert.equal(rows[1]![0], "Y01");
  assert.equal(rows.length, 1 + definition.cards.length);
});

test("participant codes accept lists and zero-padded ranges", () => {
  assert.deepEqual(parseLabels("Y01-Y03, Y10\nElder 1"), ["Y01", "Y02", "Y03", "Y10", "Elder 1"]);
  assert.deepEqual(parseLabels("Y8–10"), ["Y8", "Y9", "Y10"]);
  assert.throws(() => parseLabels("Y01, Y01"), /unique/);
  assert.throws(() => parseLabels("Y05-Y01"), /not valid/);
  assert.throws(() => parseLabels("Y01 | Y02"), /only letters/);
});

test("file names and card order", () => {
  assert.equal(fileSlug("Youth CAB: ¿Mensajes de texto? (Synthetic)"), "youth-cab-mensajes-de-texto-synthetic");
  assert.equal(fileSlug("¡!"), "session");
  const a = orderCards(definition.cards, true, "slot-a").map((c) => c.id);
  assert.deepEqual(orderCards(definition.cards, true, "slot-a").map((c) => c.id), a, "stable per participant");
  assert.deepEqual(orderCards(definition.cards, false, "slot-a"), definition.cards);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  pairwise,
  averageLinkage,
  csv,
  parseCards,
  membershipRows,
} from "../lib/analysis.ts";
import { validateBody, emptyBody } from "../lib/model.ts";
import type { Study, StudyResponse } from "../lib/model.ts";
const cards = [
  { id: "a", text: "Alpha" },
  { id: "b", text: "Beta" },
  { id: "c", text: "Gamma" },
];
const study: Study = {
  id: "s",
  title: "Test",
  phase: "sorting",
  revision: 1,
  createdAt: "",
  cards,
  config: {
    mode: "sort",
    instructions: "",
    generationPrompt: "",
    help: "",
    participantInfo: "",
    randomize: true,
    maxNewCards: 30,
  },
};
const r = (
  id: string,
  assignments: Record<string, string | null>,
  status: "draft" | "submitted" = "submitted",
): StudyResponse => ({
  id,
  revision: 1,
  kind: "sort",
  status,
  version: 0,
  updatedAt: "",
  body: {
    ...emptyBody(),
    assignments,
    piles: [
      { id: "x", name: "First", description: "" },
      { id: "y", name: "Second", description: "" },
    ],
  },
});
test("pair-specific denominators exclude unsorted, drafts, generation, and old revisions", () => {
  const data = [
    r("1", { a: "x", b: "x", c: "y" }),
    r("2", { a: "x", b: null, c: "x" }),
    r("3", { a: "x", b: "y", c: "y" }),
    r("draft", { a: "x", b: "x", c: "x" }, "draft"),
    { ...r("old", { a: "x", b: "x", c: "x" }), revision: 0 },
    { ...r("collect", {}), kind: "collect" as const },
  ];
  const p = pairwise(cards, data, 1);
  assert.deepEqual(p[0], {
    a: "a",
    b: "b",
    together: 1,
    compared: 2,
    exposed: 3,
    similarity: 0.5,
  });
  assert.equal(p[1].similarity, 1 / 3);
  assert.equal(p[2].similarity, 0.5);
});
test("unobserved pairs remain missing and prevent fabricated clustering", () => {
  const p = pairwise(cards, [r("1", { a: "x" })], 1);
  assert.ok(p.every((p) => p.similarity === null));
  assert.equal(averageLinkage(cards, p), null);
});
test("average linkage joins identical cards first and uses mean cross-cluster distance", () => {
  const tree = averageLinkage(
    cards,
    pairwise(cards, [r("1", { a: "x", b: "x", c: "y" })], 1),
  )!;
  assert.equal(tree.height, 1);
  const pair = tree.left?.members.length === 2 ? tree.left : tree.right;
  assert.deepEqual(pair?.members, [0, 1]);
  assert.equal(pair?.height, 0);
});
test("pile label changes do not affect co-sorting", () => {
  const a = r("1", { a: "x", b: "x" });
  const b = {
    ...a,
    body: {
      ...a.body,
      piles: a.body.piles.map((p) => ({ ...p, name: "Different wording" })),
    },
  };
  assert.deepEqual(pairwise(cards, [a], 1), pairwise(cards, [b], 1));
});
test("quoted CSV, escaped quotes, CRLF, embedded newlines and BOM", () => {
  assert.deepEqual(
    parseCards(
      '\uFEFFid,text\r\n1,"Family, friends"\r\n2,"Two\nlines"\r\n3,"Say ""hello"""',
    ),
    ["Family, friends", "Two\nlines", 'Say "hello"'],
  );
  assert.throws(() => parseCards("id,name\n1,a"));
  assert.throws(() => parseCards('text\n"Unclosed'));
});
test("CSV export escapes formula injection and preserves quotes", () => {
  assert.equal(
    csv([["=CMD()", 'a"b', "ordinary"]]),
    '\uFEFF"\'=CMD()","a""b","ordinary"',
  );
});
test("export includes unsorted and original labels", () => {
  const rows = membershipRows(cards, [r("1", { a: "x" })]);
  assert.equal(rows.length, 4);
  assert.equal(rows[1][8], "First");
  assert.equal(rows[2][7], "");
});
test("server validation rejects unknown piles, duplicate placement IDs, and unauthorized generation", () => {
  const a = r("1", { a: "missing" }).body;
  assert.throws(() => validateBody(study, "sort", a), /could not be found/);
  assert.throws(
    () =>
      validateBody(study, "sort", {
        ...emptyBody(),
        generated: [{ id: "new", text: "New" }],
      }),
    /provided cards only/,
  );
  assert.throws(
    () =>
      validateBody(study, "sort", {
        ...emptyBody(),
        piles: [
          { id: "x", name: "X", description: "" },
          { id: "x", name: "Y", description: "" },
        ],
      }),
    /unique/,
  );
  assert.doesNotThrow(() => validateBody(study, "sort", emptyBody()));
});

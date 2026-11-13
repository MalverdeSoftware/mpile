import { test } from "node:test";
import assert from "node:assert/strict";
import {
  pairwise,
  averageLinkage,
  csv,
  parseCards,
  membershipRows,
} from "../lib/analysis.ts";
import { validateBody, emptyBody, sameText } from "../lib/model.ts";
import type { SortResponse } from "../lib/model.ts";
const cards = [
  { id: "a", text: "Alpha" },
  { id: "b", text: "Beta" },
  { id: "c", text: "Gamma" },
];
const r = (
  id: string,
  assignments: Record<string, string | null>,
  status: "draft" | "submitted" = "submitted",
): SortResponse => ({
  id,
  status,
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
test("pair-specific denominators exclude unsorted cards and drafts", () => {
  const data = [
    r("1", { a: "x", b: "x", c: "y" }),
    r("2", { a: "x", b: null, c: "x" }),
    r("3", { a: "x", b: "y", c: "y" }),
    r("draft", { a: "x", b: "x", c: "x" }, "draft"),
  ];
  const p = pairwise(cards, data);
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
  const p = pairwise(cards, [r("1", { a: "x" })]);
  assert.ok(p.every((p) => p.similarity === null));
  assert.equal(averageLinkage(cards, p), null);
});
test("average linkage joins identical cards first and uses mean cross-cluster distance", () => {
  const tree = averageLinkage(
    cards,
    pairwise(cards, [r("1", { a: "x", b: "x", c: "y" })]),
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
  assert.deepEqual(pairwise(cards, [a]), pairwise(cards, [b]));
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
test("a participant's added cards are exported as theirs and stay out of the shared-card analysis", () => {
  const plain = r("1", { a: "x", b: "x", c: "y" });
  const withOwn: SortResponse = {
    ...plain,
    body: {
      ...plain.body,
      generated: [{ id: "g-1", text: "Mine" }],
      assignments: { ...plain.body.assignments, "g-1": "x" },
    },
  };
  assert.deepEqual(pairwise(cards, [withOwn]), pairwise(cards, [plain]));
  const rows = membershipRows(cards, [withOwn]);
  assert.equal(rows.length, 1 + 4);
  assert.deepEqual(rows[0].slice(0, 7), ["response_id", "revision", "stage", "status", "card_id", "card_text", "card_origin"]);
  assert.deepEqual(rows[1].slice(0, 7), ["1", 1, "sort", "submitted", "a", "Alpha", "shared"]);
  assert.deepEqual(rows[4].slice(4, 9), ["g-1", "Mine", "participant", "x", "First"]);
});
test("validation rejects unknown piles, duplicate pile IDs, and cards the activity does not allow", () => {
  const unknown = r("1", { a: "missing" }).body;
  assert.throws(() => validateBody(cards, 0, unknown), /could not be found/);
  const own = { ...emptyBody(), generated: [{ id: "new", text: "New" }] };
  assert.throws(() => validateBody(cards, 0, own), /provided cards only/);
  assert.doesNotThrow(() => validateBody(cards, 1, { ...own, assignments: { new: null } }));
  assert.throws(
    () => validateBody(cards, 1, { ...own, generated: [...own.generated, { id: "more", text: "More" }] }),
    /up to 1 added/,
  );
  assert.throws(() => validateBody(cards, 2, { ...emptyBody(), generated: [{ id: "a", text: "Clash" }] }), /distinct/);
  assert.throws(
    () =>
      validateBody(cards, 0, {
        ...emptyBody(),
        piles: [
          { id: "x", name: "X", description: "" },
          { id: "x", name: "Y", description: "" },
        ],
      }),
    /unique/,
  );
  assert.doesNotThrow(() => validateBody(cards, 0, emptyBody()));
});
test("card text is compared ignoring case and spacing", () => {
  assert.ok(sameText("  Family  time ", "family time"));
  assert.ok(!sameText("Family", "Families"));
});

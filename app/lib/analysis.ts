import type { Card, SortResponse } from "./model";
export type Pair = {
  a: string;
  b: string;
  together: number;
  compared: number;
  exposed: number;
  similarity: number | null;
};
export type Cluster = {
  id: string;
  members: number[];
  height: number;
  left?: Cluster;
  right?: Cluster;
};
// Co-sorting of the shared cards across submitted sorts. Cards a participant added are not part of it.
export function pairwise(cards: Card[], responses: SortResponse[]): Pair[] {
  const eligible = responses.filter((r) => r.status === "submitted");
  const pairs: Pair[] = [];
  for (let i = 0; i < cards.length; i++)
    for (let j = i + 1; j < cards.length; j++) {
      let together = 0,
        compared = 0;
      for (const r of eligible) {
        const a = r.body.assignments[cards[i].id],
          b = r.body.assignments[cards[j].id];
        if (a && b) {
          compared++;
          if (a === b) together++;
        }
      }
      pairs.push({
        a: cards[i].id,
        b: cards[j].id,
        together,
        compared,
        exposed: eligible.length,
        similarity: compared ? together / compared : null,
      });
    }
  return pairs;
}
export function averageLinkage(cards: Card[], pairs: Pair[]): Cluster | null {
  if (
    cards.length < 2 ||
    pairs.length !== (cards.length * (cards.length - 1)) / 2 ||
    pairs.some((p) => p.similarity === null)
  )
    return null;
  const index = new Map(cards.map((c, i) => [c.id, i]));
  const dist = cards.map(() => cards.map(() => 0));
  for (const p of pairs) {
    const i = index.get(p.a)!,
      j = index.get(p.b)!;
    dist[i][j] = dist[j][i] = 1 - p.similarity!;
  }
  const clusters: Cluster[] = cards.map((c, i) => ({
    id: c.id,
    members: [i],
    height: 0,
  }));
  let n = 0;
  while (clusters.length > 1) {
    let best = Infinity,
      ai = 0,
      bi = 1;
    for (let i = 0; i < clusters.length; i++)
      for (let j = i + 1; j < clusters.length; j++) {
        let d = 0;
        for (const a of clusters[i].members)
          for (const b of clusters[j].members) d += dist[a][b];
        d /= clusters[i].members.length * clusters[j].members.length;
        if (d < best) {
          best = d;
          ai = i;
          bi = j;
        }
      }
    const left = clusters[ai],
      right = clusters[bi];
    clusters.splice(bi, 1);
    clusters.splice(ai, 1);
    clusters.push({
      id: `merge-${n++}`,
      members: [...left.members, ...right.members],
      height: best,
      left,
      right,
    });
  }
  return clusters[0];
}
function safeCell(value: unknown) {
  let s = String(value ?? "");
  if (/^[\s]*[=+@-]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}
export function csv(rows: unknown[][]) {
  return "\uFEFF" + rows.map((row) => row.map(safeCell).join(",")).join("\r\n");
}
// One row per card per response. `revision` and `stage` are constant: they keep the columns of earlier exports.
export function membershipRows(cards: Card[], responses: SortResponse[]) {
  const rows: unknown[][] = [
    [
      "response_id",
      "revision",
      "stage",
      "status",
      "card_id",
      "card_text",
      "card_origin",
      "pile_id",
      "pile_name",
      "pile_explanation",
      "participant_notes",
      "updated_at",
    ],
  ];
  for (const r of responses) {
    const deck = [...cards, ...r.body.generated];
    for (const c of deck) {
      const pile = r.body.piles.find((p) => p.id === r.body.assignments[c.id]);
      rows.push([
        r.id,
        1,
        "sort",
        r.status,
        c.id,
        c.text,
        r.body.generated.some((g) => g.id === c.id) ? "participant" : "shared",
        pile?.id ?? "",
        pile?.name ?? "",
        pile?.description ?? "",
        r.body.notes,
        r.updatedAt,
      ]);
    }
  }
  return rows;
}
export function parseCards(text: string): string[] {
  // RFC 4180-style quoted fields, embedded newlines, CRLF, escaped quotes.
  const rows: string[][] = [];
  let row: string[] = [],
    field = "",
    quoted = false;
  const source = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (ch === '"') {
      if (quoted && source[i + 1] === '"') {
        field += '"';
        i++;
      } else if (!quoted && field.length) {
        throw new Error(
          "Unexpected quote in CSV. Wrap the whole field in quotes.",
        );
      } else quoted = !quoted;
    } else if (ch === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && source[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (quoted) throw new Error("A quoted CSV field is not closed.");
  row.push(field);
  if (row.some((x) => x.trim())) rows.push(row);
  if (!rows.length) return [];
  const header = rows[0].map((c) => c.trim().toLowerCase()),
    col = header.findIndex(
      (c) => c === "text" || c === "card" || c === "label",
    );
  if (col < 0 && rows.some((r) => r.length > 1))
    throw new Error(
      "For multiple columns, include a text, card, or label header.",
    );
  return (col >= 0 ? rows.slice(1) : rows)
    .map((r) => (r[col >= 0 ? col : 0] || "").trim())
    .filter(Boolean);
}

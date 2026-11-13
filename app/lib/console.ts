import { csv, membershipRows, pairwise } from "./analysis.ts";
import type { SortResponse } from "./model.ts";
import { UNKNOWN_LABEL, fileSlug, toResponses, type SortDefinition } from "./session.ts";

// Researcher console helpers. The console runs on the researcher's own computer; nothing here touches secrets.
export const PRODUCTION_RELAY = "https://mpile.app/relay";
export const CREATION_KEY_STORAGE = "mpile:creation-key";

// Participants open their links on the same site that serves the relay.
export function participantUrlFor(relayUrl: string) {
  if (!URL.canParse(relayUrl)) throw new Error(`Enter the relay address in full, such as ${PRODUCTION_RELAY}.`);
  return `${new URL(relayUrl).origin}/p`;
}

export const isProductionRelay = (relayUrl: string) => relayUrl.replace(/\/+$/, "") === PRODUCTION_RELAY;

export const keyFileName = (title: string) => `${fileSlug(title)}.malverdesoftware-session.md`;

type CollectedItem =
  | { label: string | null; kind: "SUBMITTED" | "DRAFT"; body: unknown; updatedAt: string }
  | { label: string | null; kind: "UNREADABLE"; problem: string; updatedAt: string };

export type Collection = {
  definition: SortDefinition;
  items: CollectedItem[];
  submitted: SortResponse[];
  drafts: SortResponse[];
  problems: { label: string; reason: string }[];
  collectedAt: string;
};

// Every collected item is accounted for: valid sorts are split into submitted and drafts, anything else is reported by label.
export function summarize(definition: SortDefinition, items: CollectedItem[], collectedAt = new Date().toISOString()): Collection {
  const readable = items.filter((i): i is Extract<CollectedItem, { body: unknown }> => i.kind !== "UNREADABLE");
  const { responses, problems } = toResponses(definition, readable);
  for (const item of items)
    if (item.kind === "UNREADABLE")
      problems.push({
        label: item.label ?? UNKNOWN_LABEL,
        reason: item.problem === "NO_KEY" ? "This key file has no key for it (an older copy of the file?)." : "It could not be opened.",
      });
  return {
    definition,
    items,
    submitted: responses.filter((r) => r.status === "submitted"),
    drafts: responses.filter((r) => r.status === "draft"),
    problems,
    collectedAt,
  };
}

// The existing membership export, with its first column named for what it now holds.
function memberships(c: Collection, responses: SortResponse[]) {
  const [header, ...rows] = membershipRows(c.definition.cards, responses);
  return csv([["participant_code", ...header!.slice(1)], ...rows]);
}

export function exportFiles(title: string, c: Collection) {
  const slug = fileSlug(title);
  return [
    {
      label: "Submitted sorts (CSV)",
      name: `${slug}-submitted-memberships.csv`,
      type: "text/csv;charset=utf-8",
      text: memberships(c, c.submitted),
    },
    {
      label: "Pairwise similarity (CSV)",
      name: `${slug}-pairwise-similarity.csv`,
      type: "text/csv;charset=utf-8",
      text: csv([
        ["card_a", "card_b", "together", "comparable_responses", "submitted_sorts", "similarity"],
        ...pairwise(c.definition.cards, c.submitted).map((p) => [p.a, p.b, p.together, p.compared, p.exposed, p.similarity]),
      ]),
    },
    {
      label: "Not submitted: drafts (CSV)",
      name: `${slug}-not-submitted.csv`,
      type: "text/csv;charset=utf-8",
      text: memberships(c, c.drafts),
    },
    {
      label: "Archive of everything collected (JSON)",
      name: `${slug}-archive.json`,
      type: "application/json",
      text: JSON.stringify(
        {
          format: "mpile-session-archive/v1",
          collectedAt: c.collectedAt,
          definition: c.definition,
          items: c.items,
          problems: c.problems,
        },
        null,
        2,
      ),
    },
  ];
}

import { z } from "zod";
import {
  bodySchema,
  cardSchema,
  MAX_CARDS,
  uniqueCards,
  validateBody,
  type Card,
  type ResponseBody,
  type Study,
  type StudyResponse,
} from "./model.ts";

// What a researcher shares with participants, sealed in the session (sort mode only in round 1).
export const SORT_SCHEMA = "mpile-sort/v1";
export const definitionSchema = z.object({
  schema: z.literal(SORT_SCHEMA),
  title: z.string().trim().min(1).max(160),
  instructions: z.string().trim().max(4000),
  help: z.string().trim().max(4000),
  participantInfo: z.string().trim().max(4000),
  randomize: z.boolean(),
  cards: z.array(cardSchema).min(1).max(MAX_CARDS),
});
export type SortDefinition = z.infer<typeof definitionSchema>;

// Baseline text for researchers to adapt. Consent and assent happen outside the app (for example in REDCap).
export const BASELINE = {
  instructions:
    "Group the cards in a way that makes sense to you. Create and name your own piles. You may leave any card unsorted.",
  help: "There is no right or wrong grouping. Start with two cards you think belong together, then give that pile a name. You can move cards or rename piles before submitting.",
  participantInfo:
    "You were invited to this activity by the study team. Your sort is saved under a participant code, not your name, and only the study team can read it. If you have questions, contact the person who sent you this link.",
};

export function buildDefinition(input: {
  title: string;
  instructions: string;
  help: string;
  participantInfo: string;
  randomize: boolean;
  cardTexts: string[];
}): SortDefinition {
  const texts = input.cardTexts.map((t) => t.trim()).filter(Boolean);
  if (!texts.length) throw new Error("Add at least one card.");
  if (texts.length > MAX_CARDS) throw new Error(`Use no more than ${MAX_CARDS} cards.`);
  const repeated = texts.find((t, i) => texts.indexOf(t) !== i);
  if (repeated) throw new Error(`Each card must be different: “${repeated}” appears more than once.`);
  const width = String(texts.length).length;
  const cards = texts.map((text, i) => ({ id: `c${String(i + 1).padStart(width, "0")}`, text }));
  const definition = {
    schema: SORT_SCHEMA,
    title: input.title,
    instructions: input.instructions,
    help: input.help,
    participantInfo: input.participantInfo,
    randomize: input.randomize,
    cards,
  };
  const parsed = definitionSchema.safeParse(definition);
  if (!parsed.success) throw new Error(firstIssue(parsed.error));
  return parsed.data;
}

export function readDefinition(value: unknown): SortDefinition {
  const parsed = definitionSchema.safeParse(value);
  if (!parsed.success || !uniqueCards(parsed.data.cards))
    throw new Error("This activity could not be read. Ask the study team for a new link.");
  return parsed.data;
}

// The existing analysis and export code works on Study and StudyResponse; these adapters feed it.
export function toStudy(definition: SortDefinition): Study {
  return {
    id: "session",
    title: definition.title,
    config: {
      mode: "sort",
      instructions: definition.instructions,
      generationPrompt: "",
      help: definition.help,
      participantInfo: definition.participantInfo,
      randomize: definition.randomize,
      maxNewCards: 1,
    },
    cards: definition.cards,
    phase: "sorting",
    revision: 1,
    createdAt: "",
  };
}

// Runs the same checks the server used to: piles, assignments and card IDs must be consistent.
export function checkResponse(definition: SortDefinition, value: unknown): ResponseBody {
  const parsed = bodySchema.safeParse(value);
  if (!parsed.success) throw new Error(firstIssue(parsed.error));
  validateBody(toStudy(definition), "sort", parsed.data);
  return parsed.data;
}

export type Collected = { label: string | null; kind: "SUBMITTED" | "DRAFT"; body: unknown; updatedAt: string };

export function toResponses(definition: SortDefinition, collected: Collected[]) {
  const responses: StudyResponse[] = [];
  const problems: { label: string; reason: string }[] = [];
  for (const item of collected) {
    const label = item.label ?? "(not in this key file)";
    try {
      responses.push({
        id: label,
        revision: 1,
        kind: "sort",
        body: checkResponse(definition, item.body),
        status: item.kind === "SUBMITTED" ? "submitted" : "draft",
        version: 0,
        updatedAt: item.updatedAt,
      });
    } catch (e) {
      problems.push({ label, reason: (e as Error).message });
    }
  }
  return { responses, problems };
}

// "Y01-Y12, Y20, Elder 1" → ["Y01", …, "Y12", "Y20", "Elder 1"]. Ranges keep the start's zero padding.
export function parseLabels(text: string): string[] {
  const labels: string[] = [];
  for (const part of text.split(/[,\n]/).map((p) => p.trim()).filter(Boolean)) {
    const range = /^([A-Za-z._ ]*?)(\d+)\s*[-–]\s*\1?(\d+)$/.exec(part);
    if (range) {
      const [, prefix, from, to] = range;
      const start = Number(from),
        end = Number(to);
      if (end < start || end - start >= 200) throw new Error(`The range ${part} is not valid.`);
      for (let n = start; n <= end; n++) labels.push(prefix + String(n).padStart(from!.length, "0"));
    } else labels.push(part);
  }
  for (const label of labels)
    if (!/^[A-Za-z0-9 _.-]{1,40}$/.test(label))
      throw new Error(`"${label}" can use only letters, digits, spaces, dots, dashes and underscores (up to 40).`);
  if (new Set(labels).size !== labels.length) throw new Error("Each participant code must be unique.");
  return labels;
}

export const fileSlug = (title: string) =>
  title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "session";

// Stable, participant-specific card order; never changes card identity.
export function orderCards(cards: Card[], randomize: boolean, seed: string): Card[] {
  if (!randomize) return cards;
  return [...cards].sort((a, b) => score(a.id + seed) - score(b.id + seed));
}
function score(text: string) {
  let n = 2166136261;
  for (const c of text) n = Math.imul(n ^ c.charCodeAt(0), 16777619);
  return n >>> 0;
}

function firstIssue(error: z.ZodError) {
  const issue = error.issues[0];
  return issue ? `${issue.path.join(".") || "value"}: ${issue.message}` : "Invalid data.";
}

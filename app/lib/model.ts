import { z } from "zod";
export const MAX_CARDS = 100;
export const cardSchema = z.object({
  id: z.string().min(1).max(80),
  text: z.string().trim().min(1).max(300),
  sources: z.array(z.string().max(180)).max(2000).optional(),
});
export type Card = z.infer<typeof cardSchema>;
export const configSchema = z.object({
  mode: z.enum(["sort", "generate_sort", "collect"]),
  instructions: z.string().trim().max(4000),
  generationPrompt: z.string().trim().max(2000),
  help: z.string().trim().max(4000),
  participantInfo: z.string().trim().max(4000),
  randomize: z.boolean(),
  maxNewCards: z.number().int().min(1).max(100),
});
export type Config = z.infer<typeof configSchema>;
export const bodySchema = z.object({
  generated: z.array(cardSchema).max(MAX_CARDS),
  piles: z
    .array(
      z.object({
        id: z.string().min(1).max(80),
        name: z.string().trim().min(1).max(120),
        description: z.string().max(1000),
      }),
    )
    .max(50),
  assignments: z.record(z.string().max(80), z.string().max(80).nullable()),
  notes: z.string().max(4000),
});
export type ResponseBody = z.infer<typeof bodySchema>;
export type Study = {
  id: string;
  title: string;
  config: Config;
  cards: Card[];
  phase: "collecting" | "sorting" | "closed";
  revision: number;
  createdAt: string;
};
export type StudyResponse = {
  id: string;
  revision: number;
  kind: "collect" | "sort";
  body: ResponseBody;
  status: "draft" | "submitted";
  version: number;
  updatedAt: string;
};
export const emptyBody = (): ResponseBody => ({
  generated: [],
  piles: [],
  assignments: {},
  notes: "",
});
export function uniqueCards(cards: Card[]) {
  return new Set(cards.map((c) => c.id)).size === cards.length;
}
export function validateBody(
  study: Study,
  kind: "collect" | "sort",
  body: ResponseBody,
) {
  if (!uniqueCards(body.generated))
    throw new Error("Generated cards must have unique IDs.");
  if (body.generated.length > study.config.maxNewCards)
    throw new Error("Too many generated cards.");
  if (study.config.mode === "sort" && body.generated.length)
    throw new Error("This activity uses the provided cards only.");
  if (
    study.config.mode === "collect" &&
    kind === "sort" &&
    body.generated.length
  )
    throw new Error("The shared card set is fixed for sorting.");
  const cards =
    kind === "collect" ? body.generated : [...study.cards, ...body.generated];
  if (cards.length > MAX_CARDS || !uniqueCards(cards))
    throw new Error("Use no more than 100 distinct cards.");
  if (
    kind === "collect" &&
    (body.piles.length || Object.keys(body.assignments).length)
  )
    throw new Error("Collection responses cannot contain piles.");
  const cardIds = new Set(cards.map((c) => c.id)),
    pileIds = new Set(body.piles.map((p) => p.id));
  if (pileIds.size !== body.piles.length)
    throw new Error("Pile IDs must be unique.");
  for (const [card, pile] of Object.entries(body.assignments)) {
    if (!cardIds.has(card) || (pile !== null && !pileIds.has(pile)))
      throw new Error("A card or pile could not be found.");
  }
}

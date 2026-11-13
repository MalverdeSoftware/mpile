import { z } from "zod";
export const MAX_CARDS = 100;
export const MAX_PILES = 50;
// The most cards one participant may add in a generate-and-sort activity.
export const MAX_NEW_CARDS = 30;
export const cardSchema = z.object({
  id: z.string().min(1).max(80),
  text: z.string().trim().min(1).max(300),
});
export type Card = z.infer<typeof cardSchema>;
const pileSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().trim().min(1).max(120),
  description: z.string().max(1000),
});
export const bodySchema = z.object({
  // Cards the participant added. Always empty unless the activity lets participants add their own.
  generated: z.array(cardSchema).max(MAX_NEW_CARDS),
  piles: z.array(pileSchema).max(MAX_PILES),
  assignments: z.record(z.string().max(80), z.string().max(80).nullable()),
  notes: z.string().max(4000),
});
export type ResponseBody = z.infer<typeof bodySchema>;
// Work in progress: the board lets a pile's name be empty while the participant is still sorting.
export const draftSchema = bodySchema.extend({
  piles: z.array(pileSchema.extend({ name: z.string().max(120) })).max(MAX_PILES),
});
// One participant's sort as the console holds it after collecting. `id` is the participant code.
export type SortResponse = {
  id: string;
  body: ResponseBody;
  status: "draft" | "submitted";
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
// Compared the way a participant would: ignoring case and extra spaces.
export const sameText = (a: string, b: string) => normalize(a) === normalize(b);
const normalize = (text: string) => text.trim().replace(/\s+/g, " ").toLowerCase();

// Checks a response against the activity: `cards` are the shared cards, `maxNewCards` is 0 for a plain sort.
export function validateBody(cards: Card[], maxNewCards: number, body: ResponseBody) {
  if (!maxNewCards && body.generated.length)
    throw new Error("This activity uses the provided cards only.");
  if (body.generated.length > maxNewCards)
    throw new Error(`This activity allows up to ${maxNewCards} added cards.`);
  const deck = [...cards, ...body.generated];
  if (deck.length > MAX_CARDS || !uniqueCards(deck))
    throw new Error(`Use no more than ${MAX_CARDS} distinct cards.`);
  const cardIds = new Set(deck.map((c) => c.id)),
    pileIds = new Set(body.piles.map((p) => p.id));
  if (pileIds.size !== body.piles.length)
    throw new Error("Pile IDs must be unique.");
  for (const [card, pile] of Object.entries(body.assignments)) {
    if (!cardIds.has(card) || (pile !== null && !pileIds.has(pile)))
      throw new Error("A card or pile could not be found.");
  }
}

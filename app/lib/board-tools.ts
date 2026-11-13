"use client";
import { useEffect, useLayoutEffect, useRef } from "react";
import { flushSync } from "react-dom";
import type { Card, ResponseBody } from "./model";
type Tool = {
  name: string;
  title: string;
  description: string;
  inputSchema: object;
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
  execute: (input: unknown) => unknown;
};
type Context = {
  registerTool: (
    tool: Tool,
    options: { signal: AbortSignal },
  ) => void | Promise<void>;
};
export function useBoardTools(
  cards: Card[],
  body: ResponseBody,
  editable: boolean,
  onMove: (cardId: string, pileId: string | null) => void,
) {
  const state = useRef({ cards, body, editable, onMove });
  useLayoutEffect(() => {
    state.current = { cards, body, editable, onMove };
  }, [cards, body, editable, onMove]);
  useEffect(() => {
    const context = (document as Document & { modelContext?: Context })
      .modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const tools: Tool[] = [
      {
        name: "get_current_sort",
        title: "Read the current card sort",
        description:
          "Read the visible participant card set, piles, and assignments. Does not read other participants, access keys, or facilitator results.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true, untrustedContentHint: true },
        execute(input) {
          if (!input || typeof input !== "object" || Object.keys(input).length)
            throw new Error("Expected an empty object.");
          const s = state.current;
          return {
            cards: s.cards,
            piles: s.body.piles,
            assignments: s.body.assignments,
            editable: s.editable,
          };
        },
      },
      {
        name: "move_card_to_pile",
        title: "Move a card in this response",
        description:
          "Move one visible card into an existing participant-created pile, or leave it unsorted using null. Updates the same board as the menu and autosaves a draft. Does not submit the response.",
        inputSchema: {
          type: "object",
          properties: {
            cardId: { type: "string" },
            pileId: { type: ["string", "null"] },
          },
          required: ["cardId", "pileId"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute(input) {
          if (!input || typeof input !== "object")
            throw new Error("Expected cardId and pileId.");
          const i = input as { cardId?: unknown; pileId?: unknown };
          if (
            Object.keys(i).some((k) => k !== "cardId" && k !== "pileId") ||
            typeof i.cardId !== "string" ||
            !(typeof i.pileId === "string" || i.pileId === null)
          )
            throw new Error("Expected cardId and a pileId or null.");
          const s = state.current;
          if (!s.editable)
            throw new Error("This response is not open for editing.");
          if (
            !s.cards.some((c) => c.id === i.cardId) ||
            !(i.pileId === null || s.body.piles.some((p) => p.id === i.pileId))
          )
            throw new Error("The card or pile is not on this board.");
          flushSync(() =>
            s.onMove(i.cardId as string, i.pileId as string | null),
          );
          return {
            cardId: i.cardId,
            pileId: i.pileId,
            saved: false,
            message: "Board updated; draft save is pending.",
          };
        },
      },
    ];
    for (const tool of tools) {
      try {
        void Promise.resolve(
          context.registerTool(tool, { signal: lifecycle.signal }),
        ).catch(() => {});
      } catch {}
    }
    return () => lifecycle.abort();
  }, []);
}

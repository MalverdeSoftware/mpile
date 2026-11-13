# Spec: generate and sort

Module id `mpile-generate-sort` · November 13, 2026 · **Status: draft. The author asked for the draft and the build on November 13; the decisions at the end are still theirs to confirm.** Builds on [SPEC-mpile-app](SPEC-mpile-app.md), which listed porting `generate_sort` under "ask first".

## Objective

Let a researcher run a sort in which each participant can also **add cards of their own**, in answer to a prompt, and sort them together with the shared cards. This is the free-list-then-sort activity in [methods](../METHODS.md): the shared cards stay comparable across people, and each person's additions are kept as their own words.

The collect-review-sort activity is **not** part of this. Its leftover types are removed here. If it is wanted later, it needs its own design, because a session's cards are fixed when it is published.

## What a researcher does

On the create screen, a new choice sits under the cards:

- **Let participants add their own cards** (off by default).
- When on: **the prompt participants read** (required, up to 2,000 characters) and **how many cards each person may add** (1 to 30, default 5).

Everything else about creating, publishing, collecting, closing and deleting is unchanged.

## What a participant does

Above the board, a section shows the prompt, a text box and an **Add card** button, with a count such as "2 of 5 added".

- A new card (up to 300 characters) goes to Unsorted, after the shared cards, marked **Yours**.
- It is sorted like any other card: dragged, or moved with its menu.
- It can be removed until the sort is submitted. Removing it takes it out of its pile.
- A card that repeats a shared card or one of the participant's own, ignoring case and spacing, is refused with a message.
- Added cards are part of the draft, so they autosave, survive patchy signal and follow the participant to another device.
- After submitting, the participant's own copy shows their cards in their piles.

Participants never see each other's cards.

## Data

**Activity definition** (sealed in the session). A plain sort is unchanged: `schema: "mpile-sort/v1"`. A generate-and-sort session uses `schema: "mpile-sort/v2"` and adds:

| Field | Meaning |
|---|---|
| `generationPrompt` | the prompt, 1 to 2,000 characters |
| `maxNewCards` | whole number, 1 to 30 |

The new schema name is deliberate. A site still running older code refuses a v2 session ("This activity could not be read") instead of opening it as a plain sort and then rejecting the participant's cards.

**Response body.** No change. `generated` has been in the body since release 0.1 and has always been an empty list. In a v2 session it holds up to `maxNewCards` cards, each `{ id, text }`, with ids the browser makes (`g-` and a random UUID). In a v1 session it must stay empty.

**Limits.** Shared and added cards together stay within 100, so the create screen refuses a limit that would let anyone pass it.

**Relay and shared packages.** No change. The relay never reads either object.

## Exports and analysis

- The membership files already have a `card_origin` column. Added cards appear there as `participant`, with their text, pile and the participant's code. Column names and order do not change.
- Pairwise similarity, the matrix, the connection map and clustering use **shared cards only**, as methods describes. Added cards are not matched across people by text.
- The results panel shows how many cards participants added.
- The `revision` and `stage` columns stay, for compatibility with files already exported. They always read `1` and `sort`.

## Removed

The collect-stage leftovers: the `collect` response kind, the `sources` field on cards, the study `phase`, and the settings type that carried all three modes. No screen used them.

## Boundaries

- **Always:** synthetic cards in tests; added cards sealed like the rest of a response.
- **Ask first:** deploying this; raising the limits; any analysis that compares added cards across participants.
- **Never:** show one participant's cards to another; send card text anywhere but inside the sealed response.

## Success criteria

- [ ] A v1 session created before this change still opens, sorts, collects and exports the same.
- [ ] In a v2 session a participant can add, sort, remove and submit their own cards on a phone-sized screen.
- [ ] A reload restores added cards and their piles from the draft.
- [ ] The membership export lists added cards with `card_origin` `participant`; pairwise output is the same as for the shared cards alone.
- [ ] Older site code refuses a v2 session.

## Decisions for the author

1. **Limit of 30 added cards, default 5.** Enough for a free list; keeps one response well inside the sealed size limit.
2. **Shared cards are still required** (at least one). An activity made only of participants' own cards is left out for now.
3. **Participants can remove their own cards but not edit them.** Editing is remove and add again.
4. **No cross-participant analysis of added cards.** They are exported for qualitative review.

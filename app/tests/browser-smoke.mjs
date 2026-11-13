// Drives the participant page in headless Chrome at phone size against a local dev server (synthetic data only):
// wrong passcode, passcode, create a pile, move a card, autosave, submit, reload.
//   npm run dev   (in another terminal)   then   npm run test:browser
import assert from "node:assert/strict";
import {
  openResearcherSession,
  prepareSession,
  publishSession,
} from "@malverdesoftware/session-client";
import { creationKey, origin, withChrome } from "./chrome.mjs";

const file = await prepareSession({
  app: "mpile",
  title: "Browser check (synthetic)",
  relayUrl: `${origin}/relay`,
  participantUrl: `${origin}/p`,
  definition: {
    schema: "mpile-sort/v1",
    title: "Browser check (synthetic)",
    instructions: "Group the cards in a way that makes sense to you.",
    help: "There is no right or wrong grouping.",
    participantInfo: "Synthetic test.",
    randomize: false,
    cards: [
      { id: "c1", text: "¿Vienes mañana? 🌵" },
      { id: "c2", text: "Te espero afuera" },
    ],
  },
  participantLabels: ["Y01", "Y02"],
});
await publishSession(file, { creationKey });
const researcher = openResearcherSession(file);
const [y01, y02] = file.participants;

try {
  await withChrome({ width: 390, height: 844, mobile: true }, async ({ send, evaluate, screenshot, waitFor, hasText, markPage, newPage, tap, tapElement, type, errors, shots }) => {
    // A wrong passcode is refused with a plain message.
    await send("Page.navigate", { url: y02.link });
    await waitFor(hasText("Enter your passcode"), "passcode screen");
    await type("#passcode", y02.passcode === "000000" ? "111111" : "000000");
    await tap('form button[type="submit"]');
    await waitFor(hasText("doesn't match this link"), "wrong-passcode message");

    // A second personal link in the same tab changes only the fragment; the page must start fresh for it.
    // The right passcode opens the workspace.
    await markPage();
    await send("Page.navigate", { url: y01.link });
    await waitFor(newPage(hasText("Enter your passcode")), "a fresh passcode screen for the second link");
    await screenshot("passcode");
    await type("#passcode", y01.passcode);
    await tap('form button[type="submit"]');
    await waitFor(hasText("Create pile"), "workspace");

    // Create a pile and move a card into it with the per-card menu.
    await type('input[aria-label="New pile name"]', "Familia");
    await tap("button", "Create pile");
    await waitFor(`document.querySelector(".pile-name")?.value === "Familia"`, "new pile");
    await tap('button[role="combobox"]', "Move ¿Vienes mañana? 🌵 to pile");
    await waitFor(`!!document.querySelector('[data-test~="ring-list-item-action"]')`, "pile menu");
    // Clicked in place: tap() scrolls the target into view first, and scrolling closes Ring's open menu.
    await evaluate(`[...document.querySelectorAll('[data-test~="ring-list-item-action"] .ring-list-label')].find((e) => e.innerText.includes("Familia")).click()`);
    await waitFor(`document.querySelector(".workspace__count")?.innerText === "1 of 2 cards placed · 1 pile"`, "card moved");
    await tap("button", "Piles 1");
    await waitFor(`document.querySelector(".pile-zone .sort-card")?.innerText.includes("Vienes")`, "card shown in its pile");
    await screenshot("workspace-piles");

    // The menu can also start a new pile, with the card already in it. Removing that pile returns the card.
    await tap("button", "Unsorted 1");
    await tap('button[role="combobox"]', "Move Te espero afuera to pile");
    await waitFor(`!!document.querySelector('[data-test~="ring-list-item-action"]')`, "pile menu");
    await evaluate(`[...document.querySelectorAll('[data-test~="ring-list-item-action"] .ring-list-label')].find((e) => e.innerText.includes("New pile")).click()`);
    await waitFor(hasText("Pile name"), "new pile dialog");
    await type('[role="dialog"] input', "Temporal");
    await tap('[role="dialog"] button', "Create pile");
    await waitFor(`document.querySelector(".workspace__count")?.innerText === "2 of 2 cards placed · 2 piles"`, "card moved into the new pile");
    await tap("button", "Piles 2");
    const removeLastPile = () =>
      tapElement(`[...[...document.querySelectorAll(".pile-zone")].pop().querySelectorAll("button")].find((b) => b.innerText.includes("Remove pile"))`, "remove the last pile");
    await removeLastPile();
    await waitFor(hasText("Remove Temporal?") + " && " + hasText("Its 1 card goes back to Unsorted."), "confirmation before removing a pile");
    await waitFor(`document.activeElement?.innerText === "Keep pile"`, "focus starts on the safe choice");
    await tap('[role="dialog"] button', "Keep pile");
    await waitFor(`!document.querySelector('[role="dialog"]') && document.querySelector(".workspace__count")?.innerText === "2 of 2 cards placed · 2 piles"`, "pile kept");
    await removeLastPile();
    await tap('[role="dialog"] button', "Remove pile");
    await waitFor(`document.querySelector(".workspace__count")?.innerText === "1 of 2 cards placed · 1 pile"`, "pile removed, card back in unsorted");
    // An empty pile has nothing to lose, so it goes without asking.
    await type('input[aria-label="New pile name"]', "Vacía");
    await tap("button", "Create pile");
    await waitFor(`document.querySelector(".workspace__count")?.innerText === "1 of 2 cards placed · 2 piles"`, "empty pile");
    await removeLastPile();
    await waitFor(`!document.querySelector('[role="dialog"]') && document.querySelector(".workspace__count")?.innerText === "1 of 2 cards placed · 1 pile"`, "empty pile removed without asking");
    await tap("button", "Unsorted 1");
    await waitFor(`document.querySelector('[role="status"]')?.innerText === "Saved"`, "autosave", 20_000);
    await waitFor(`document.querySelector(".workspace__count")?.innerText === "1 of 2 cards placed · 1 pile"`, "singular counts");
    await screenshot("workspace");

    const drafts = await researcher.collect({ includeDrafts: true });
    const draft = drafts.find((r) => r.label === "Y01" && r.kind === "DRAFT");
    assert.ok(draft, "the researcher can open the autosaved draft");
    assert.equal(draft.body.piles[0].name, "Familia");
    assert.equal(draft.body.assignments.c1, draft.body.piles[0].id);

    // Submit, then the device shows its own copy, including after a reload.
    await tap("button", "Review and submit");
    await waitFor(hasText("Submit your sort?") + " && " + hasText("1 card in 1 pile. 1 card will stay unsorted."), "confirmation dialog");
    await waitFor(`document.activeElement?.innerText === "Keep sorting"`, "submitting can't happen by pressing Enter");
    await tap("button", "Submit my sort");
    await waitFor(hasText("Your sort was sent to the study team."), "submitted screen");
    await waitFor(hasText("Familia"), "own copy");
    await screenshot("submitted");
    // The device forgets the passcode once the sort is submitted, so reopening asks for it; then the own copy shows.
    await markPage();
    await send("Page.reload");
    await waitFor(newPage(hasText("Enter your passcode")), "passcode screen after reload (forgotten on submit)");
    await type("#passcode", y01.passcode);
    await tap('form button[type="submit"]');
    await waitFor(hasText("Your sort was sent to the study team.") + " && " + hasText("Familia"), "own copy after reload");

    const submitted = (await researcher.collect()).filter((r) => r.kind === "SUBMITTED");
    assert.deepEqual(submitted.map((r) => r.label), ["Y01"]);
    assert.equal(submitted[0].body.piles[0].name, "Familia");
    assert.deepEqual(errors, [], "no errors in the browser console");

    console.log(`Browser check passed (phone size). Screenshots in ${shots}`);
  });
} finally {
  await researcher.close().catch(() => undefined);
  await researcher.destroy().catch(() => undefined);
}

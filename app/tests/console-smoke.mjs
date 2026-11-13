// Drives the researcher console in headless Chrome against a local console server (synthetic data only):
// create, save the key file, publish, reopen the saved file, add and remove a participant, collect, export,
// close, delete, then reopen the deleted session's file. Participants act through session-client in between.
//   npm run console   (in another terminal)   then   npm run test:console
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  joinSession,
  memoryStorage,
  openResearcherSession,
  parseParticipantLink,
  parseSessionFile,
} from "@malverdesoftware/session-client";
import { creationKey, origin, withChrome } from "./chrome.mjs";

const downloads = mkdtempSync(join(tmpdir(), "mpile-downloads-"));
const title = "Console check (synthetic)";
const keyFile = "console-check-synthetic.malverdesoftware-session.md";

try {
  await withChrome({ width: 1280, height: 900, mobile: false, downloads }, async (page) => {
    const { send, screenshot, waitFor, hasText, tap, tapElement, type, pickFile, download, evaluate, errors, shots } = page;
    const metrics = () => evaluate(`[...(document.querySelector(".metric-grid")?.querySelectorAll("strong") ?? [])].map((e) => e.innerText).join(" ")`);
    const inDialog = (label) => `[...document.querySelectorAll('[role="dialog"] button')].some((b) => b.innerText.includes(${JSON.stringify(label)}))`;
    const confirmDialog = async (label) => {
      await waitFor(inDialog(label), `dialog button ${label}`);
      await tap('[role="dialog"] button', label);
    };
    const enabled = (label) => `[...document.querySelectorAll("button")].some((b) => b.innerText.includes(${JSON.stringify(label)}) && !b.disabled)`;

    // Create: cards, participant codes and the local development relay.
    await send("Page.navigate", { url: origin });
    await waitFor(hasText("Run a sealed pile sort."), "console home");
    await tap("button", "Create a session");
    await waitFor(hasText("Participant codes"), "create form");
    await type('input[maxlength="160"]', title);
    await type("#cards", "¿Vienes mañana? 🌵\nTe espero afuera\n=Call me");
    await type('textarea[placeholder="Y01-Y12"]', "Y01-Y02");
    await evaluate(`[...document.querySelectorAll("details")].forEach((d) => (d.open = true))`);
    await evaluate(`document.querySelector('input[aria-label="Relay address"]').select()`);
    await type('input[aria-label="Relay address"]', `${origin}/relay`);
    await waitFor(hasText("Development relay"), "development relay warning");
    await tap("button", "Prepare session");
    await waitFor(hasText("not published yet"), "prepared session");
    assert.ok(await evaluate(`document.querySelector('form button[type="submit"]').disabled`), "publishing waits for the saved key file");

    // Save the key file and its second copy, then publish.
    await tap("button", "Download the key file");
    const savedKeyFile = await download(keyFile);
    const file = parseSessionFile(readFileSync(savedKeyFile, "utf8"));
    assert.deepEqual(file.participants.map((p) => p.label), ["Y01", "Y02"]);
    await tap("label", "saved a second copy");
    await type('input[type="password"]', creationKey);
    await screenshot("console-prepared");
    await tap("button", "Publish the session");
    await waitFor(hasText("Researcher console · session") + " && " + hasText("0 of 2 submitted"), "published session");
    assert.equal(await evaluate(`localStorage.getItem("mpile:creation-key")`), creationKey, "creation key remembered");
    assert.ok(!(await evaluate(`JSON.stringify(localStorage)`)).includes(file.researcherPrivateKey), "no session secrets in storage");

    // Participants: Y01 submits, Y02 saves a draft.
    const body = (pile) => ({ generated: [], piles: [{ id: "p1", name: pile, description: "" }], assignments: { c1: "p1", c2: "p1", c3: "p1" }, notes: "" });
    for (const [p, submit] of [[file.participants[0], true], [file.participants[1], false]]) {
      const session = await joinSession(parseParticipantLink(p.link), {
        app: "mpile",
        relayUrl: file.relayUrl,
        passcode: p.passcode,
        storage: memoryStorage(),
      });
      await session.saveDraft(body(submit ? "Familia 🌵" : "Amigos"));
      if (submit) await session.submit(body("Familia 🌵"));
    }

    // Reopen the saved key file: status, then add and remove a participant.
    await tap("button", "Done");
    await waitFor(hasText("Existing session"), "console home");
    await pickFile('input[type="file"]', savedKeyFile);
    await waitFor(hasText("1 of 2 submitted"), "status from the reopened key file");
    await type('input[aria-label="Participant codes to add"]', "Y03");
    await tap("button", "Add");
    await waitFor(hasText("The participant list changed") + " && " + hasText("1 of 3 submitted"), "added participant");
    await tap("button", "Save key file");
    const updated = parseSessionFile(readFileSync(await download(keyFile), "utf8"));
    assert.deepEqual(updated.participants.map((p) => p.label), ["Y01", "Y02", "Y03"]);
    await screenshot("console-session", true);
    await tapElement(`[...document.querySelectorAll("tr")].find((r) => r.innerText.includes("Y03"))?.querySelector("td:last-child button")`, "remove Y03");
    await waitFor(`document.activeElement?.innerText === "Keep Y03"`, "focus starts on the safe choice");
    await confirmDialog("Remove and delete their data");
    await waitFor(`!document.querySelector("tbody").innerText.includes("Y03") && ${hasText("1 of 2 submitted")}`, "removed participant");
    await tap("button", "Save key file");
    await download(keyFile);

    // Collect and export: drafts stay out of the submitted file and the analysis.
    await tap("button", "Collect responses");
    await waitFor(hasText("Could not be used"), "collected");
    assert.equal(await metrics(), "1 1 0", "1 submitted, 1 draft, no problems");
    for (const label of ["Submitted sorts", "Pairwise similarity", "Not submitted", "Archive"]) await tap(".export-grid button", label);
    const slug = "console-check-synthetic";
    const submittedCsv = readFileSync(await download(`${slug}-submitted-memberships.csv`), "utf8");
    const draftsCsv = readFileSync(await download(`${slug}-not-submitted.csv`), "utf8");
    await download(`${slug}-pairwise-similarity.csv`);
    const archive = JSON.parse(readFileSync(await download(`${slug}-archive.json`), "utf8"));
    assert.ok(submittedCsv.includes('"Y01"') && !submittedCsv.includes('"Y02"') && submittedCsv.includes('"Familia 🌵"'));
    assert.ok(draftsCsv.includes('"Y02"') && !draftsCsv.includes('"Y01"'));
    assert.ok(submittedCsv.includes(`"'=Call me"`), "formula-like card text is escaped");
    assert.deepEqual(archive.items.map((i) => [i.label, i.kind]), [["Y01", "SUBMITTED"], ["Y02", "DRAFT"]]);
    await screenshot("console-collected", true);

    // The other analysis views draw, and Ring's tabs switch between them.
    await tap("button", "Connection map");
    await waitFor(`!!document.querySelector('svg[role="img"] .chart-node')`, "connection map");
    await screenshot("console-map", true);
    await tap("button", "Clusters");
    await waitFor(`!!document.querySelector(".dendrogram .chart-line")`, "dendrogram");
    await screenshot("console-clusters", true);

    // Close, collect again, delete; the deleted session's key file still opens.
    await tap("button", "Close the session");
    await confirmDialog("Close the session");
    await waitFor(hasText("Closed ·"), "closed session");
    await tap("button", "Collect again");
    await waitFor(enabled("Delete from the relay"), "collecting finished");
    await tap("button", "Delete from the relay");
    await waitFor(`${hasText("Delete this session?")} && !${hasText("You haven't collected since closing")}`, "delete dialog after collecting");
    await tap('[role="dialog"] label', "I saved the exports");
    await confirmDialog("Delete the session");
    await waitFor(hasText("Session deleted") + " && " + hasText("up to 7 more days"), "deleted session");
    await assert.rejects(openResearcherSession(updated).status(), (e) => e.code === "NOT_FOUND", "the relay no longer has it");
    await tap("button", "Done");
    await pickFile('input[type="file"]', savedKeyFile);
    await waitFor(hasText("This session is not on the relay"), "deleted session's key file still opens");
    await screenshot("console-deleted");

    assert.deepEqual(errors, [], "no errors in the browser console");
    console.log(`Console check passed. Screenshots in ${shots}`);
  });
} finally {
  // The downloads include synthetic session key files; never leave them behind.
  rmSync(downloads, { recursive: true, force: true });
}

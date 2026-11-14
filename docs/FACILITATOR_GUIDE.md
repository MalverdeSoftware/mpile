# Researcher guide

How to run a mPile session, from preparing the cards to deleting the session. Each participant sorts the same cards into their own piles, on their own phone or computer. Participants never see one another's sorts.

You need:

- the researcher console, running on your own computer (`npm run console` in `app/`, then http://localhost:5173)
- the creation key from whoever runs the site
- the participants' codes, such as Y01–Y12. Never use names.

Consent and assent happen outside the app, for example in REDCap. Send links only to enrolled participants. Use synthetic cards until your study's readiness check has passed.

## 1. Create the session

1. In the console, choose **Create a session**.
2. Enter a **title**. Participants see it.
3. Add the **cards**: one per line, or import a CSV with a `text` column. At most 100 different cards, each up to 300 characters.
4. Add the **participant codes**, separated by commas or lines. Ranges such as `Y01-Y12` work.
5. Choose how many **days** until the session deletes itself: 14 by default, at most 30.
6. To let each participant add cards of their own, tick **Let participants add their own cards**. Write the **prompt** they read first, such as "What else comes to mind? Add a card for each one", and set how many cards each person may add (5 by default, at most 30). Their cards are sorted along with yours, and no participant sees another's.
7. Under **What participants read**, adapt the baseline instructions, help and participant information to your study.
8. Leave the **relay address** as it is for a real session. Any other address shows a development warning, and its links work only on your computer.
9. Choose **Prepare session**. Each participant gets a personal link and a six-digit passcode. This takes a few seconds and happens on your computer.

## 2. Save the key file, then publish

1. **Download the key file** (`<title>.malverdesoftware-session.md`). Then save a second copy in your study team's shared files and tick the box saying so.
   - The key file is the only way to read the responses. If every copy is lost, nobody can recover them.
   - Anyone who has it can read every response in the session. Keep it only on your computer and in your team's shared files. Do not email it, put it in a Git repository, or paste it into a chat or AI tool.
   - It also lists every link and passcode, and opens in any text editor.
2. Enter the **creation key** and choose **Publish the session**. The console can remember the creation key on your computer.

## 3. Send each person their link and passcode

The participant table has copy buttons for each link and passcode. Send each person only their own, through different channels if you can, such as the link by text message and the passcode in person or by email. If both travel in one message, one leak exposes both. Never post links publicly.

What participants see:

1. They open their link, then enter their passcode. On a shared computer they tick **This is a shared computer** so the passcode is not remembered.
2. They create and name piles, move cards by dragging or with each card's menu, and may leave cards unsorted.
3. Their work saves as they go. The page shows **Saved**, or **Saved on this device** when the connection drops; it syncs when they are back online.
4. They can continue on another phone or computer by opening the same link and entering the same passcode.
5. **Review and submit** sends the sort. Submitting is final. Reopening the link afterwards asks for the passcode again, then shows their own copy.

| A participant says | What it means |
|---|---|
| "My passcode doesn't match" | Check the six digits and that it is their own link. After 5 wrong tries they must wait before trying again. |
| "This link is incomplete" | The link was cut off. Send it again, in one piece. |
| "This activity has ended" | The session was deleted or expired, or they were removed from it. |
| "This activity is closed" | You closed the session. |
| "Changed on another device" | They edited on two devices at once. Reloading continues from the latest saved version. |

## 4. Follow progress

Open the console, choose **Open a key file**, and pick your saved key file. The participant table shows each code's status (Not started, In progress, Submitted) and its last update. Use **Refresh** to update it.

- **Add participants** by typing their codes and choosing **Add**. The key file changes, so save the updated key file and replace the shared copy. Older copies of the file cannot read new participants' drafts.
- **Remove** a participant only if they should not take part. Their link stops working, and their draft or submitted sort is deleted from the relay.

## 5. Collect and export

Choose **Collect responses**. The console opens the sealed responses on your computer and shows how many sorts were submitted, how many are drafts, and anything that could not be used, listed by participant code. Download:

- **Submitted sorts (CSV):** one row per card per submitted sort, with the participant code, pile name, pile explanation and notes. Unsorted cards are included with an empty pile.
- **Pairwise similarity (CSV):** for each pair of cards, how often they were put together among the sorts that placed both. Missing values are blank, not zero.
- **Not submitted: drafts (CSV):** the same layout, for drafts only. Drafts never appear in the submitted file or the analysis.
- **Archive (JSON):** the activity and everything collected, with codes, kinds and times. It keeps the original text exactly.

**The exports are not sealed.** Each one holds readable responses with participant codes. Store them only where your study has approved keeping participant data, with the same care as the key file, and don't email them or paste them into a chat or AI tool.

If participants could add their own cards, those cards are in the two sorts files, with `participant` in the `card_origin` column (your cards say `shared`). Pairwise similarity and the analysis views compare your cards only.

The CSV files open in spreadsheets, with accents and emoji intact. Cells that start like a formula are escaped. The console also shows the co-sorting matrix, connection map and clustering for the submitted sorts. See [Methods](METHODS.md).

## 6. Close, collect again, delete

1. **Close the session.** Nobody can save or submit any more. Closing cannot be undone.
2. **Collect again** and save the four exports, so you have the final versions.
3. **Delete from the relay.** The console asks you to confirm that the exports are saved. Every link stops working and the sealed responses are deleted. Tell your study team plainly: the session is **deleted from the live database when you delete the session; Cloudflare's recovery history keeps the sealed copy for up to 7 more days**. That copy stays sealed; only the key file can open it.

Your key file and exports stay on your computer. If you ever can't use this console while the session is still on the relay, the key file and Node 24 are enough to collect the responses as JSON: see [reading data without the app](https://github.com/MalverdeSoftware/malverdesoftware/blob/main/docs/DATA-VISIBILITY.md#reading-data-without-the-app). The key file still opens in the console afterwards, which then says the session is no longer on the relay. If you never delete the session, it deletes itself at its expiry date.

## Before the first real session

Rehearse with synthetic cards and at least one other person:

- iPhone Safari and Android Chrome
- links sent by text and by email, and passcodes entered
- airplane mode while sorting, then recovery
- starting on a phone and finishing on a laptop
- one wrong-passcode lockout
- submit, then collect, export, close and delete

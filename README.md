# mPile

mPile is a card-sorting tool for research and community activities. Each participant sorts the same set of cards into piles that make sense to them, on their own phone or computer, and the researcher gets the groupings back as data. I made it with an Indigenous-led approach to software in mind: practical tools, open methods, and software that communities and research partners can run themselves.

**Status: early release (0.1).** Open source under the [Apache License 2.0](LICENSE).

## What it does

- **Everyone sorts the same cards.** The researcher types in text cards or imports a CSV in the researcher console, which runs only on their own computer. Each participant gets a personal link and a six-digit passcode.
- **Sorting is private.** Each participant sorts on their own and never sees anyone else's piles. This first release doesn't include the card-generation or collect-review-sort activities described in [methods](docs/METHODS.md).
- **Participants make their own piles.** They create and name piles, explain their groupings if they want to, and put each card in one pile or leave it unsorted. Dragging, touch-friendly menus, and keyboard controls all work.
- **Work saves as people go.** It is sealed in the browser before it reaches the relay, and it continues on another device with the same link and passcode. Submitting is final.
- **Only the researcher can read the responses.** The researcher keeps the session's key file, which is the only way to open them. The console opens the sealed responses on the researcher's computer, shows progress, and adds or removes participants.
- **Results come out as data.** The console exports submitted sorts, pairwise similarity, and drafts as CSV, plus a full JSON archive. It also shows a co-sorting matrix, a connection map, and average-linkage clustering.

The app doesn't require participant accounts. A hosting provider may have its own sign-in rules. The first hosted review instance is private until its owner opens it to public participants.

## Start locally

You need Node.js **24** and npm (Node 26 isn't supported yet). No paid API or AI service is needed.

```sh
git clone https://github.com/MalverdeSoftware/mpile.git
cd mpile/app
npm ci
npm run console
```

Open http://localhost:5173 for the researcher console, which runs only on your computer. Create a session, save its key file, and publish. Each participant gets a personal link and passcode for the participant page at `/p`. A localhost link only works on your own computer, so deploy the app before you invite remote participants.

For next steps, see the [researcher guide](docs/FACILITATOR_GUIDE.md) for running a session, [self-hosting](docs/SELF_HOSTING.md) for deploying your own copy, and [methods](docs/METHODS.md) for how the analysis works.

## Development

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for the quick checks. The full set of tests, from `app/`:

```sh
npm test
npm run typecheck
npm run build
npm run check:build
# With a local server running (npm run dev or npm run console):
npm run test:integration
npm run test:browser
# With npm run console running:
npm run test:console
```

The integration check runs a whole synthetic session through `/relay` on the local server and its local database. It covers publishing, joining, saving, submitting, collecting, adding and removing participants, closing and deleting, and the hourly purge. It also checks the security headers, and it refuses to run against anything but your own computer. The browser checks drive the participant page and the researcher console in headless Chrome.

mPile is built with React, TypeScript, Vinext/Vite, and Cloudflare D1 (SQLite). The application code is in `app/components`, `app/lib`, and `app/app`. The Worker entry, `app/worker/index.ts`, serves the MalverdeSoftware relay at `/relay`. The relay's D1 database only holds data that was sealed in browsers. The shared packages come from npm as `@malverdesoftware/*`, pinned exactly, and the Sites build support is vendored with its upstream license.

## Scope and limits

This release supports **independent responses** with text cards, up to 100 cards per response, 50 piles, and 2,000 responses per activity. It doesn't support collaborative live sorting, images or audio, offline submission, translated interfaces, account recovery, or automatic matching of similar meanings. These limits are on purpose and out in the open. See the [roadmap](docs/ROADMAP.md).

mPile collects and supports research activities. Communities and their university partners govern the data. They decide how the software is run, who gets links, and how results are used. The software doesn't assign data ownership, and it doesn't replace the agreements for your study.

Please use synthetic data while you try out a new deployment. Then go over hosting and study requirements with your research partners before you collect real responses.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Bug reports, accessibility feedback, and methods review are welcome. Please don't post participant data or private management or response links in public issues.

## References

The research behind the method is listed in [references/README.md](references/README.md).

## License and citation

mPile is free, open-source software under the [Apache License 2.0](LICENSE). Copyright 2026 The Johns Hopkins University. Developed by Valentín Quiroz de la Sierra and Marissa Ledesma for MalverdeSoftware, with support from the National Institute on Drug Abuse of the National Institutes of Health under Award Number K99DA066943. The content is solely the responsibility of the authors and does not necessarily represent the official views of the National Institutes of Health. See [NOTICE](NOTICE).

To cite mPile, use the "Cite this repository" button on GitHub or [CITATION.cff](CITATION.cff):

> de la Sierra, V. Q., & Ledesma, M. (2026). *mPile* [Computer software]. MalverdeSoftware. https://doi.org/10.5281/zenodo.24184668

The DOI [10.5281/zenodo.24184668](https://doi.org/10.5281/zenodo.24184668) always resolves to the latest release; each release also has its own DOI on Zenodo.

The license covers the code only. The MalverdeSoftware, mVote and mPile names and the MalverdeSoftware logo are not licensed (Apache-2.0, Section 6). Research data collected with this software is not covered either. The communities and partners responsible for each activity govern it.

The licenses of the software mPile is built on are listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

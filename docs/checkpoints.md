# Checkpoints

## CP-2026-11-14-REVIEW-FOLLOWUP

**Goal.** Act on an outside code review of mPile 0.1 (a GitHub Copilot review, pasted into a Claude Code chat on November 14, 2026), after checking its claims against the code. The author approved doing every update and merging each PR once CI passed.

**Review findings checked against the code.** Several things the review called gaps were already in place: two saved key-file copies required before publishing, a prompt to re-save after participant changes, versioned formats (`mpile-sort/v1`, `/v2`, `envelope-v1`, `mpile-session-archive/v1`), decrypted CSV and JSON exports, documented retention, exact dependency pins, and offline autosave. Real gaps found: no check that the saved key file works, no warning that exports are plaintext, no list of what the host can see, no way to read data without the console, and `engines` disagreeing with `.node-version`. Recovery and rotation of a lost key are still not supported (see the roadmap).

**What changed, all merged to `main` by squash:**

| Repo | PR | Merge | Change |
|---|---|---|---|
| malverdesoftware | [#15](https://github.com/MalverdeSoftware/malverdesoftware/pull/15) | `8efb4ba` | session-client 0.2.0: `verifySessionFile`, the `malverdesoftware-session verify\|collect` command, and [`docs/DATA-VISIBILITY.md`](https://github.com/MalverdeSoftware/malverdesoftware/blob/main/docs/DATA-VISIBILITY.md) |
| mpile | [#18](https://github.com/MalverdeSoftware/mpile/pull/18) | `bb6e1fb` | Exports-are-readable warning in the console and [facilitator guide](FACILITATOR_GUIDE.md), host-visible metadata in [self-hosting](SELF_HOSTING.md), `engines` set to Node 24 |
| mpile | [#19](https://github.com/MalverdeSoftware/mpile/pull/19) | `b216509` | Uses session-client 0.2.0. The publish steps make the researcher open the saved key file, and publishing waits until it passes `verifySessionFile` |
| mpile | [#20](https://github.com/MalverdeSoftware/mpile/pull/20) | `a365f6b` | Scoped overrides: minimatch 11.0.8 under typescript-estree (GHSA-g3hv-75wg-m249, Dependabot alert 84) and fflate 0.7.5 under satori (GHSA-px8p-9vwx-vf98) |
| mvote | [#23](https://github.com/MalverdeSoftware/mvote/pull/23) | `956d6f3` | SECURITY.md no longer mentions key files and passcodes, which mVote doesn't have |

session-client 0.2.0 was published to npm by the release workflow, from tag `session-client-v0.2.0` at `8efb4ba`, with a provenance statement (Sigstore log index 3871901742). Commits and PRs carry no Claude attribution (MVS-6).

**Decisions made in this work.** The key-file check, the collect command and the data-visibility doc live in the shared malverdesoftware packages, because they depend on the shared key file, sealing and relay. The export warning and the Node version stay in mpile. mVote doesn't use the shared key file format: it stores plaintext in Firestore and depends only on `@malverdesoftware/ui`. `verifySessionFile` can't check passcodes, because only the relay holds what they derive. Overrides were chosen over code changes because mPile never calls minimatch or fflate, neither is in the built site, and each parent package pins the vulnerable version even in its latest release.

**Validation run.**
- malverdesoftware: all package tests pass (87, 22 and 40), plus typecheck, build, the release dry run, and the built command run through a symlink.
- mpile: `npm run verify` passes (environment, UI check, lint, 22 tests, typecheck, build, build check). `npm run test:console` against a local console passes, including the new check step. `npm audit` finds 0 vulnerabilities, and the repo has no open Dependabot alerts.
- CI passed on every PR before it merged.
- Not checked: the live mpile.app or mvote.app after deploy, and the collect command against the production relay.

**Remaining work.**
- Remove the two overrides once typescript-eslint allows minimatch 11 and satori allows fflate 0.7.5 or later.
- The usability and accessibility pilot (PILE-2), plus the recovery and rotation items on the roadmap.

**YouTrack.** Progress, PR and merge comments are on [PILE-5](https://malverdesoftware.youtrack.cloud/issue/PILE-5), which stays Open. No issue states changed.

**Research reconciliation.** This was software, security and documentation work, with no change to concepts, methods, analysis or evidence. So no research-hub reconciliation batch was needed. The cross-project handoff is hub record `mv-f342ddfa`.

**Open first next time.** [`app/components/console/publish-steps.tsx`](../app/components/console/publish-steps.tsx), [`app/package.json`](../app/package.json) (overrides), and the shared repo's `packages/session-client/src/verify.ts` and `cli.ts`.

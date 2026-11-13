# Third-party notices

mPile uses third-party software. Each package keeps its own license, and nothing in this repository changes those terms. This summary was generated from `app/package-lock.json` on 2026-11-11. The lockfile's `license` fields are the complete, per-package record.

## App (`app/`)

628 packages in the lockfile (direct and transitive, runtime and development).

| License | Packages |
|---|---|
| MIT | 500 |
| Apache-2.0 (including one written "Apache 2.0") | 45 |
| ISC | 19 |
| MPL-2.0 | 16 |
| BSD-2-Clause | 11 |
| LGPL-3.0-or-later (alone or combined with Apache-2.0/MIT) | 15 |
| BSD-3-Clause | 6 |
| MIT OR Apache-2.0 | 4 |
| CC0-1.0 | 2 |
| OFL-1.1, CC-BY-4.0, BlueOak-1.0.0, Python-2.0, 0BSD | 5 |
| No license field in the lockfile | 5 |

Items that need attribution or a note:

- **JetBrains Ring UI** (`@jetbrains/ring-ui-built`) and **JetBrains Icons** (`@jetbrains/icons`): Apache-2.0.
- **Mona Sans** (`@fontsource-variable/mona-sans`): SIL Open Font License 1.1. The font license text must stay with any redistributed font files.
- **libvips binaries** (`@img/sharp-libvips-*`, `@img/sharp-*`), installed as optional platform binaries by `sharp` (Apache-2.0): LGPL-3.0-or-later. They are separate libraries, and their source is available from the libvips project.
- **MPL-2.0 packages** (for example `lightningcss`, `satori`, `@resvg/resvg-wasm`, `@vercel/og`, `axe-core`): used by the build and test toolchain (development dependencies). MPL-2.0 applies at the file level.
- **caniuse-lite**: CC-BY-4.0 data.
- **combokeys**: Apache-2.0 (the package metadata writes it as "Apache 2.0").
- **scrollbar-width**: its npm metadata has no license field. Its GitHub repository (olmokramer/scrollbar-width.js) carries the MIT license, copyright 2014 Olmo Kramer.
- **Sites Vite plugin** (vendored): MIT, copyright 2026 OpenAI. The license is preserved in `app/build/sites-vite-plugin.LICENSE`.
- **`@malverdesoftware/relay`, `@malverdesoftware/sealed-envelope`, `@malverdesoftware/session-client`, `@malverdesoftware/ui`**: this project's own shared packages, installed from npm (relay 0.1.1, sealed-envelope 0.1.2, session-client 0.1.3, ui 0.1.1). They are licensed under Apache-2.0, copyright The Johns Hopkins University, and each carries its LICENSE and NOTICE.

## Review before release

- Re-run this inventory when dependencies change and before the first public release.
- This project's own code is Apache-2.0 (2026-11-12), which is compatible with the Apache-2.0 packages above.

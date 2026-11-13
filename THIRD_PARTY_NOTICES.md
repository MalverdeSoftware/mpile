# Third-party notices

mPile is free, open-source software under the [Apache License 2.0](LICENSE) (see also [NOTICE](NOTICE)). It is built on open-source software by others. Each of those packages keeps its own license, and nothing in this repository changes those terms.

This summary was generated from `app/package-lock.json` on 2026-11-13. The lockfile records each package's license, and each installed package carries its own license file.

## In the live site (mpile.app)

The app bundles these packages into the participant pages and the Cloudflare Worker that serves them and the relay.

| Package | Version | License | Copyright |
|---|---|---|---|
| React, React DOM (`react`, `react-dom`) | 19.3.1 | MIT | Meta Platforms, Inc. and affiliates |
| Next.js (`next`) | 16.4.6 | MIT | 2025 Vercel, Inc. |
| Vinext (`vinext`), which builds the app's Next.js routes with Vite for Cloudflare Workers; its runtime code is bundled although npm lists it as a development dependency | 1.4.5 | MIT | 2026 Cloudflare, Inc. |
| Zod (`zod`) | 4.6.7 | MIT | 2025 Colin McDonnell |
| JetBrains Ring UI (`@jetbrains/ring-ui-built`) | 7.0.133 | Apache-2.0 | 2000–2016 JetBrains s.r.o. |
| JetBrains Icons (`@jetbrains/icons`) | 5.24.0 | Apache-2.0 | 2010–2017 JetBrains s.r.o. |
| Mona Sans (`@fontsource-variable/mona-sans`) | 5.3.0 | SIL Open Font License 1.1 | 2022 The Mona Sans Project Authors, with Reserved Font Name "Mona" |
| `@malverdesoftware/relay`, `sealed-envelope`, `session-client`, `ui` | 0.1.1, 0.1.2, 0.1.4, 0.1.1 | Apache-2.0 | 2026 The Johns Hopkins University |

- **Mona Sans** is served to browsers as web font files under the [SIL Open Font License 1.1](https://openfontlicense.org/open-font-license-official-text/). The font is not modified.

All 99 runtime packages in the lockfile, including those the packages above depend on:

| License | Packages |
|---|---|
| MIT | 54 |
| Apache-2.0 | 23 |
| LGPL-3.0-or-later, alone or with Apache-2.0 or MIT | 14 |
| BSD-3-Clause | 2 |
| ISC | 2 |
| OFL-1.1 | 1 |
| CC-BY-4.0 | 1 |
| 0BSD | 1 |
| No license field in npm metadata | 1 |

- **LGPL-3.0-or-later:** these are the `@img/sharp-*` and `@img/sharp-libvips-*` platform binaries, which Next.js installs as optional dependencies for image processing on Node. They are not part of the deployed site, because mPile runs on Cloudflare Workers and its build doesn't include them. Their source is available from the [libvips](https://github.com/libvips/libvips) and [sharp](https://github.com/lovell/sharp) projects.
- **CC-BY-4.0:** `caniuse-lite`, browser-support data used when building. It isn't in the pages browsers download.
- **No license field:** **scrollbar-width** 3.1.1. Its own LICENSE file is MIT, copyright 2014 Olmo Kramer.

## Build and test tools (not in the live site)

543 development packages run only when building and testing, apart from Vinext's runtime code (listed above): MIT 454, Apache-2.0 32, ISC 17, MPL-2.0 16, BSD-2-Clause 11, MIT OR Apache-2.0 5, BSD-3-Clause 4, CC0-1.0 2, BlueOak-1.0.0 1, and Python-2.0 1. The MPL-2.0 packages (for example `lightningcss`, `satori`, `@resvg/resvg-wasm`, `@vercel/og` and `axe-core`) are build and test tools; MPL-2.0 applies at the file level.

## Keeping this current

This file is regenerated when dependencies change. If you find a missing or wrong attribution, please [open an issue](https://github.com/MalverdeSoftware/mpile/issues).

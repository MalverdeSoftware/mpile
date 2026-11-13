# mPile application

See the [project README](../README.md) and the [self-hosting guide](../docs/SELF_HOSTING.md).

```sh
npm ci
npm run console   # researcher console and participant page at http://localhost:5173
npm run dev       # the same without the console: the public landing page at /
```

Application source is in `app/`, `components/`, and `lib/`. The Worker entry, with the relay at `/relay`, is `worker/index.ts`. The shared MalverdeSoftware packages come from npm (`@malverdesoftware/*`), pinned exactly. Tests are in `tests/`.

## Interface

Screens follow the [UI spec](https://github.com/MalverdeSoftware/malverdesoftware/blob/main/docs/specs/SPEC-ui.md) through the bundled `@malverdesoftware/ui` package. Run `npm run check:ui` to check what a script can see. The participant page and the researcher console load in the browser only (`participant-entry.tsx`, `console-entry.tsx`), because the component library needs a browser. On phones, Unsorted and Piles swap in place with a switch in the pinned header, so a long deck never pushes the piles out of reach. The analysis charts use the library's colors through CSS classes (`components/console/console.css`). The open-source components, icons, and fonts the interface uses are listed in [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md).

The Sites-compatible build setup is kept for hosted delivery. The vendored plugin's license is at `build/sites-vite-plugin.LICENSE`. The application code is licensed under Apache-2.0 (see [LICENSE](../LICENSE)).

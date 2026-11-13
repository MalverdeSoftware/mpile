# Developing mPile

You need Node 24. The `.node-version` file records the version I tested, 24.19.0.

## Check that your changes work

From `app/`:

```sh
npm ci
npm run verify
```

`verify` checks your Node version, runs the tests and the TypeScript check, builds the app, and writes a checksum list of the build files to `.phase0/build-manifest.json`. That list describes your local build. It doesn't mean anything has been deployed. The GitHub workflow runs the same steps on every pull request.

## Try the app on your computer

Run `npm run build` first, then:

```sh
npm run demo
```

This starts a local app backed by a local D1 database on port 5173, using `.wrangler/phase0-state`. It keeps its data apart from any existing `.wrangler/state`, so it never touches your other local data.

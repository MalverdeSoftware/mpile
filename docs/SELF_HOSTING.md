# Self-hosting

mPile runs as one Cloudflare Worker with one D1 database:

- **`/p`**: the participant page. Each participant opens a personal link and enters a six-digit passcode.
- **`/`**: a short public page explaining the app.
- **`/relay`**: the session store. It holds only data sealed in browsers: the activity, participants' drafts and their submitted sorts. It cannot read any of it.

The **researcher console**, where sessions are created, collected, closed and deleted, runs only on the researcher's own computer. The only key that opens a session's responses is the session key file the console saves there.

No accounts, analytics, third-party scripts or fonts, or AI services are involved. Cloud usage may incur charges under your own Cloudflare plan.

## Run it on your computer

Use Node.js 24 (`.node-version` records the tested version; Node 26 is not supported). From `app/`:

```sh
npm ci
npm run console   # the researcher console and the participant page at http://localhost:5173
npm run dev       # the same server without the console, as the deployed site shows it
```

The local relay database is stored under `app/.wrangler/state/`, which Git ignores. Links made against `http://localhost:5173/relay` work only on this computer.

To publish sessions locally, the local relay needs the hash of a creation key. Run `npm run creation-key`, put the printed hash in `app/.dev.vars` as `RELAY_CREATION_KEY_HASHES=<hash>`, and use the printed key in the console's publish step. `.dev.vars` is ignored by Git. Use synthetic data only.

Checks, from `app/`:

```sh
npm run verify             # unit tests, typecheck, build and the build check
npm run test:integration   # with npm run dev or npm run console running
npm run test:browser       # the participant page, in headless Chrome
npm run test:console       # with npm run console running: the whole console
```

The integration and browser checks refuse anything but a local server, and use the development creation key `dev-creation-key-synthetic-data-only` unless `RELAY_DEV_CREATION_KEY` names another.

## Deploy to your own Cloudflare account

You need a Cloudflare account with your domain on it. The free plan is enough. The first use of Workers and D1 may ask you to turn them on in the dashboard. From `app/`:

1. **Sign in.** `npx wrangler login` opens a browser.
2. **Create the database.** `npx wrangler d1 create your-worker-relay`, naming it after the Worker you'll use in step 3, then copy the database UUID it prints.
3. **Write the deployment config.** `npm run deploy:prepare -- <UUID>`. This writes `wrangler.selfhost.json`, which Git ignores. Its defaults are the live deployment: Worker `mpile` with database `mpile-relay`, served at `mpile.app`. Use `--domain your.domain.example` (repeat it for more than one address) and `--name your-worker` for your own; the database name then defaults to `your-worker-relay`, or set it with `--database-name`.
4. **Build and check.** `npm run verify`. Never deploy a build made with `npm run console`; the build check fails on one.
5. **Deploy.** `npx wrangler deploy --config wrangler.selfhost.json`. Deploying before step 6 is safe: until the creation key's hash is set, the relay refuses to create sessions.
6. **Set the creation key.** Run `npm run creation-key`. Keep the key somewhere private, like a password; the console asks for it when you publish a session. Then run `npx wrangler secret put RELAY_CREATION_KEY_HASHES --config wrangler.selfhost.json` and paste the hash. Only the hash goes to Cloudflare.
7. **Check the deployment.**
   - `https://<domain>/relay/v1/health` answers `{"ok":true,…}`.
   - `curl -sI https://<domain>/p` shows `content-security-policy`, `referrer-policy: no-referrer` and `x-frame-options: DENY`.
   - From the console, create a synthetic session with the default relay address, open one link on a phone, sort, submit, then collect, close and delete it.

`wrangler.selfhost.json` sets:

- the Worker name
- the custom domain only, with no `workers.dev` address or preview URLs
- `RELAY_DB` as the only binding
- an hourly cron trigger that deletes expired sessions
- Workers observability turned off, so no request logs or traces are kept by that feature

The relay creates its tables itself on first use, so there are no migrations to apply.

### Creation keys

A creation key lets its holder create sessions on your relay. It does not open anyone's data: that takes a session's key file. To allow several keys, set the secret to their hashes separated by commas. To retire a key, set the secret again without its hash.

## Updates

Pull reviewed changes, run `npm ci` and `npm run verify`, then deploy again with the same `wrangler.selfhost.json`. Sessions can last up to 30 days. A change to how sessions, links or sealed data are stored needs a plan for the sessions already running.

## Data, deletion and limits

- **What the server holds.** Sealed activities, sealed drafts and sealed submissions, plus hashes of the access tokens. The server cannot open any of them. Each participant's device keeps its own copy of their sort (the draft, then what they submitted). Until they submit, it also remembers their passcode, unless they ticked "This is a shared computer".
- **Deletion.** A session is deleted when the researcher deletes it, or automatically at its expiry date (14 days by default, at most 30) by the hourly purge. D1's recovery history ("Time Travel") is always on. Say this plainly to study teams: the session is **deleted from the live database when you delete the session; Cloudflare's recovery history keeps the sealed copy for up to 7 more days** (30 days on paid plans). A recovered copy is still sealed; only the key file opens it.
- **Free plan limits** (checked October 25, 2026):
  - Workers allow 100,000 requests a day. D1 allows 100,000 rows written and 5 million read a day, and 5 GB of storage.
  - Since September 1, 2026, D1 queries on the free plan fail once a daily limit is exceeded, until it resets at 00:00 UTC.
  - A 20-person sort uses a few thousand writes in total. If saves do fail, participants' work stays on their device and syncs after the reset.
- **Logs.** The app turns off Workers observability and adds no logging. Cloudflare may keep its own operational logs under its policy.
- **Security headers.** Every page has a content security policy that lets it load and connect only to its own site, plus `Referrer-Policy: no-referrer` and `X-Frame-Options: DENY`.
- **Not included.** Accounts, CAPTCHA, and verified one-person-one-response. Each link and passcode is personal; whoever has both can open that participant's sort.
- **Your obligations.** Communities and their university partners govern the data and decide how the app is operated and who receives links. Review hosting with them before collecting real responses.

## Sites deployment

`.openai/hosting.json` and the vendored Sites build plugin are kept from release 0.1. They identify the original hosted review instance, which still runs release 0.1 with synthetic placeholder data, and do not grant access to it. The round 1 deployment above does not use them.

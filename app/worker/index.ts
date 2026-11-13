// Worker entry: /relay/* goes to the MalverdeSoftware relay (sealed data only); everything else to the app.
import app from "vinext/server/fetch-handler";
import {
  createRelay,
  d1Database,
  purgeExpired,
  schemaSql,
  sqlStore,
} from "@malverdesoftware/relay";
import type { D1DatabaseLike } from "@malverdesoftware/relay";

type Env = {
  RELAY_DB: D1DatabaseLike;
  // Comma-separated SHA-256 hashes of operator-issued creation keys (a Worker secret).
  RELAY_CREATION_KEY_HASHES?: string;
};

const appHandler = app as ExportedHandler<Env>;
let schemaReady: Promise<void> | undefined;

// Security headers for every page (the relay sets its own). Pages load nothing from other origins. Only the local
// researcher console, never the deployed site, may also call the production relay or a relay on this computer.
const localConsole = import.meta.env.VITE_MPILE_CONSOLE === "local";
const PAGE_HEADERS = {
  "Content-Security-Policy": [
    "default-src 'self'",
    // Vinext's hydration delivers the page's React Server Components payload in inline <script> tags.
    "script-src 'self' 'unsafe-inline'",
    // React style attributes (the analysis view's matrix shading and pile colors).
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    `connect-src 'self'${localConsole ? " https://mpile.app http://localhost:* http://127.0.0.1:*" : ""}`,
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join("; "),
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

async function page(request: Request, env: Env, ctx: ExecutionContext) {
  const response = await appHandler.fetch!(request as Parameters<NonNullable<typeof appHandler.fetch>>[0], env, ctx);
  const headed = new Response(response.body, response);
  for (const [name, value] of Object.entries(PAGE_HEADERS)) headed.headers.set(name, value);
  return headed;
}

// The schema uses CREATE ... IF NOT EXISTS, so applying it once per isolate is safe and keeps deploys to one step.
function relayStore(env: Env) {
  const db = d1Database(env.RELAY_DB);
  schemaReady ??= db
    .batch(
      schemaSql
        .split(";")
        .map((sql) => sql.trim())
        .filter(Boolean)
        .map((sql) => ({ sql, params: [] })),
    )
    .then(
      () => undefined,
      (error) => {
        schemaReady = undefined;
        throw error;
      },
    );
  return { store: sqlStore(db), ready: schemaReady };
}

export default {
  async fetch(request, env, ctx) {
    if (new URL(request.url).pathname.startsWith("/relay/")) {
      const { store, ready } = relayStore(env);
      await ready;
      const creationKeyHashes = (env.RELAY_CREATION_KEY_HASHES ?? "")
        .split(",")
        .map((h) => h.trim())
        .filter(Boolean);
      return createRelay({ store, creationKeyHashes })(request);
    }
    return page(request, env, ctx);
  },
  async scheduled(_controller, env, ctx) {
    const { store, ready } = relayStore(env);
    ctx.waitUntil(ready.then(() => purgeExpired(store)));
  },
} satisfies ExportedHandler<Env>;

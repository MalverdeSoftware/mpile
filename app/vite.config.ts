import vinext from "vinext";
import { defineConfig } from "vite";

// Local development only. A real deployment names its own database in wrangler.selfhost.json (npm run deploy:prepare).
const LOCAL_DATABASE_ID = "00000000-0000-4000-8000-000000000000";

const localBindingConfig = {
  // Serves /relay/* (MalverdeSoftware relay) and delegates everything else to vinext.
  main: "./worker/index.ts",
  compatibility_flags: ["nodejs_compat"],
  // The relay's sealed store is the only database.
  d1_databases: [
    {
      binding: "RELAY_DB",
      database_name: "mpile-relay",
      database_id: LOCAL_DATABASE_ID,
    },
  ],
};

export default defineConfig(async () => {
  // Wrangler snapshots its log path while the Cloudflare plugin is imported, so the settings come first.
  await import("./scripts/wrangler-env.mjs");
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    plugins: [
      vinext(),
      cloudflare({
        ...(process.env.PILE_LOCAL_DB_PATH
          ? { persistState: { path: process.env.PILE_LOCAL_DB_PATH } }
          : {}),
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        inspectorPort: false,
        config: localBindingConfig,
      }),
    ],
  };
});

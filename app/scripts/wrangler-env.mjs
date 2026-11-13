// Shared by vite.config.ts and `npm start`: keeps Wrangler and Miniflare quiet and their state inside this project.
// These are non-secret tool settings; application environment belongs in ignored `.env*` files.
process.env.CLOUDFLARE_CF_FETCH_ENABLED ??= "false"; // use Miniflare's local Request.cf placeholder
process.env.WRANGLER_SEND_METRICS ??= "false";
process.env.WRANGLER_WRITE_LOGS ??= "false";
process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
process.env.WRANGLER_REGISTRY_PATH ??= ".wrangler/dev-registry";
process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

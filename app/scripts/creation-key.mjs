// Prints a new relay creation key and its SHA-256 hash. The researcher keeps the key (the console asks for it when
// publishing a session); only the hash goes to Cloudflare, as the Worker secret RELAY_CREATION_KEY_HASHES.
import { hashToken, randomSecret } from "@malverdesoftware/sealed-envelope";

const key = randomSecret();
const hash = await hashToken(key);
console.log(`Creation key (keep it private, like a password; do not commit or email it):
  ${key}

Its hash (the only part that goes to Cloudflare):
  ${hash}

Set the hash on the deployed Worker, pasting it when asked:
  npx wrangler secret put RELAY_CREATION_KEY_HASHES --config wrangler.selfhost.json
To allow several keys, separate their hashes with commas. To retire a key, set the secret again without its hash.`);

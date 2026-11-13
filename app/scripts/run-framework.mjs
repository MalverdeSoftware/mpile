// Runs Vinext's dev server or build in this process, so the caller keeps its PID and signals.
import { fileURLToPath } from "node:url";

const [command, ...args] = process.argv.slice(2);
if (!["dev", "build"].includes(command)) throw new Error("Expected dev or build.");

const cli = new URL("../node_modules/vinext/dist/cli.js", import.meta.url);
process.argv = [process.execPath, fileURLToPath(cli), command, ...(command === "dev" ? ["--port", "5173"] : []), ...args];
await import(cli.href);

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("\x1b[36m%s\x1b[0m", "==========================================================");
console.log("\x1b[36m%s\x1b[0m", "  STUDIO PULSE 2.0 — STARTING SERVICES");
console.log("\x1b[36m%s\x1b[0m", "==========================================================");

// 1. Start Backend API Server
const server = spawn("node", ["server/index.js"], {
  cwd: __dirname,
  stdio: "inherit",
  shell: true,
});

// 2. Start Frontend Vite Dev Server
const frontend = spawn("npm", ["run", "dev"], {
  cwd: path.join(__dirname, "frontend"),
  stdio: "inherit",
  shell: true,
});

function cleanup() {
  console.log("\nShutting down Studio Pulse services...");
  server.kill();
  frontend.kill();
  process.exit();
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

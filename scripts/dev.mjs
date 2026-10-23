import { fork, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const api = fork(
  fileURLToPath(new URL("../server/index.ts", import.meta.url)),
  [],
  {
    cwd: root,
    stdio: ["inherit", "inherit", "inherit", "ipc"],
  },
);
let client;
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  client?.kill("SIGTERM");
  api.kill("SIGTERM");
  process.exitCode = code;
}
api.on("message", (message) => {
  if (message?.type !== "ready" || client || stopping) return;
  client = spawn(
    process.execPath,
    [
      fileURLToPath(
        new URL("../node_modules/vite/bin/vite.js", import.meta.url),
      ),
      "--host",
      "127.0.0.1",
    ],
    { cwd: root, stdio: "inherit" },
  );
  client.on("exit", (code) => stop(code ?? 0));
  client.on("error", (error) => {
    console.error(error);
    stop(1);
  });
});
api.on("exit", (code) => stop(code ?? 0));
api.on("error", (error) => {
  console.error(error);
  stop(1);
});
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());

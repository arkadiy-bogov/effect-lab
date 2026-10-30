import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const node = process.execPath;

function run(script) {
  const result = spawnSync(node, [path.join(root, "scripts", script)], {
    cwd: root,
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status || 1);
}

run("generate-config.mjs");
run("generate-seo.mjs");
run("check.mjs");
console.log("Build complete");

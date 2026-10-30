import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

export function loadEnv() {
  const fromExample = parseEnvFile(path.join(root, ".env.example"));
  const fromFile = parseEnvFile(path.join(root, ".env"));
  return { ...fromExample, ...fromFile, ...process.env, __root: root };
}

export function requireEnv(env, keys) {
  const missing = keys.filter((key) => !String(env[key] || "").trim());
  if (missing.length) {
    throw new Error(`Missing env: ${missing.join(", ")}. Copy .env.example to .env`);
  }
}

export function siteFromEnv(env) {
  requireEnv(env, ["SITE_ORIGIN", "SITE_NAME", "SITE_TITLE", "SITE_DESCRIPTION"]);
  const origin = String(env.SITE_ORIGIN).replace(/\/+$/, "");
  const imagePath = String(env.SITE_IMAGE || "/assets/preview-source.png");
  const image = imagePath.startsWith("http")
    ? imagePath
    : `${origin}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
  const extraPaths = String(env.SITE_EXTRA_PATHS || "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => (p.startsWith("/") ? p : `/${p}`));

  return {
    origin,
    name: env.SITE_NAME,
    title: env.SITE_TITLE,
    description: env.SITE_DESCRIPTION,
    locale: env.SITE_LOCALE || "ru_RU",
    image,
    imagePath: imagePath.startsWith("http") ? "/assets/preview-source.png" : imagePath,
    extraPaths,
    root: env.__root,
  };
}

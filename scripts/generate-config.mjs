import fs from "node:fs";
import path from "node:path";
import { loadEnv, siteFromEnv } from "./load-env.mjs";

const env = loadEnv();
const site = siteFromEnv(env);
const outPath = path.join(site.root, "js", "core", "site-config.js");

const source = `// Сгенерировано: npm run config
// Не редактируйте вручную - меняйте .env и пересоберите.

export const SITE = Object.freeze({
  origin: ${JSON.stringify(site.origin)},
  name: ${JSON.stringify(site.name)},
  title: ${JSON.stringify(site.title)},
  description: ${JSON.stringify(site.description)},
  locale: ${JSON.stringify(site.locale)},
  image: ${JSON.stringify(site.image)},
});
`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, source, "utf8");
console.log(`Wrote ${path.relative(site.root, outPath)}`);

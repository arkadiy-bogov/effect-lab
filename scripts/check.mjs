import fs from "node:fs";
import path from "node:path";
import { loadEnv, siteFromEnv } from "./load-env.mjs";

const env = loadEnv();
const site = siteFromEnv(env);
const errors = [];

const required = [
  "index.html",
  "js/main.js",
  "js/core/site-config.js",
  "js/core/seo.js",
  "css/app.css",
  "sitemap.xml",
  "robots.txt",
];

for (const rel of required) {
  const full = path.join(site.root, rel);
  if (!fs.existsSync(full)) errors.push(`Missing file: ${rel}`);
}

const config = fs.readFileSync(path.join(site.root, "js/core/site-config.js"), "utf8");
if (!config.includes(site.origin)) {
  errors.push("site-config.js does not contain SITE_ORIGIN from .env - run npm run config");
}

const sitemap = fs.readFileSync(path.join(site.root, "sitemap.xml"), "utf8");
if (!sitemap.includes(site.origin)) {
  errors.push("sitemap.xml does not contain SITE_ORIGIN - run npm run seo");
}
if (sitemap.includes("/#/photo/fisheye")) {
  errors.push("Hidden route fisheye is present in sitemap.xml");
}

const robots = fs.readFileSync(path.join(site.root, "robots.txt"), "utf8");
if (!robots.includes(`${site.origin}/sitemap.xml`)) {
  errors.push("robots.txt Sitemap URL mismatch - run npm run seo");
}

const indexHtml = fs.readFileSync(path.join(site.root, "index.html"), "utf8");
if (!indexHtml.includes("<!-- SEO:START -->") || !indexHtml.includes("<!-- SEO:END -->")) {
  errors.push("index.html missing SEO markers - run npm run seo");
}
if (!indexHtml.includes(site.origin)) {
  errors.push("index.html missing SITE_ORIGIN - run npm run seo");
}

if (errors.length) {
  console.error("Check failed:");
  for (const err of errors) console.error(`- ${err}`);
  process.exit(1);
}

console.log(`Check OK · ${site.origin}`);

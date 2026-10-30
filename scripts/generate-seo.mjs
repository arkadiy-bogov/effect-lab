import fs from "node:fs";
import path from "node:path";
import { loadEnv, siteFromEnv } from "./load-env.mjs";
import { APP_ROUTES } from "./seo-routes.mjs";

const env = loadEnv();
const site = siteFromEnv(env);

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function buildSitemap() {
  const urls = [
    ...APP_ROUTES.filter((route) => !route.hidden).map((route) => ({
      loc: `${site.origin}${route.path === "/" ? "/" : route.path}`,
      changefreq: route.changefreq,
      priority: route.priority,
    })),
    ...site.extraPaths.map((p) => ({
      loc: `${site.origin}${p}`,
      changefreq: "weekly",
      priority: "0.5",
    })),
  ];

  const body = urls
    .map(
      (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

function buildRobots() {
  return `User-agent: *
Allow: /

Sitemap: ${site.origin}/sitemap.xml
`;
}

function buildIndexHead() {
  const homeTitle = `${site.title} | ${site.name}`;
  const homeUrl = `${site.origin}/#/`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: site.origin,
    description: site.description,
    inLanguage: "ru",
  };

  return `  <title>${homeTitle}</title>
  <meta name="description" content="${site.description}">
  <meta name="robots" content="index, follow">
  <meta name="author" content="${site.name}">
  <meta name="theme-color" content="#0f1412">
  <meta name="color-scheme" content="dark">
  <link rel="canonical" href="${homeUrl}">
  <meta property="og:site_name" content="${site.name}">
  <meta property="og:locale" content="${site.locale}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${homeTitle}">
  <meta property="og:description" content="${site.description}">
  <meta property="og:url" content="${homeUrl}">
  <meta property="og:image" content="${site.image}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${homeTitle}">
  <meta name="twitter:description" content="${site.description}">
  <meta name="twitter:image" content="${site.image}">
  <script type="application/ld+json">
  ${JSON.stringify(jsonLd, null, 2).split("\n").join("\n  ")}
  </script>`;
}

function patchIndexHtml() {
  const indexPath = path.join(site.root, "index.html");
  let html = fs.readFileSync(indexPath, "utf8");
  const start = "<!-- SEO:START -->";
  const end = "<!-- SEO:END -->";
  const block = `${start}\n${buildIndexHead()}\n  ${end}`;

  if (html.includes(start) && html.includes(end)) {
    html = html.replace(new RegExp(`${start}[\\s\\S]*?${end}`), block);
  } else {
    html = html.replace(
      /<meta charset="UTF-8">\s*<meta name="viewport"[^>]*>/,
      (match) => `${match}\n  ${block}`
    );
  }
  fs.writeFileSync(indexPath, html, "utf8");
  return path.relative(site.root, indexPath);
}

const sitemapPath = path.join(site.root, "sitemap.xml");
const robotsPath = path.join(site.root, "robots.txt");
fs.writeFileSync(sitemapPath, buildSitemap(), "utf8");
fs.writeFileSync(robotsPath, buildRobots(), "utf8");
const indexRel = patchIndexHtml();

console.log(`Wrote ${path.relative(site.root, sitemapPath)}`);
console.log(`Wrote ${path.relative(site.root, robotsPath)}`);
console.log(`Updated ${indexRel}`);

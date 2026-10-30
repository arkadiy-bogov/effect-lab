// Каталог публичных URL для sitemap. hidden: true - не попадает в выдачу.

export const APP_ROUTES = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/#/photo", changefreq: "weekly", priority: "0.9" },
  { path: "/#/photo/degrade", changefreq: "monthly", priority: "0.7" },
  { path: "/#/photo/pixelate", changefreq: "monthly", priority: "0.7" },
  { path: "/#/photo/blur", changefreq: "monthly", priority: "0.7" },
  { path: "/#/photo/ig2016", changefreq: "monthly", priority: "0.7" },
  { path: "/#/photo/negative", changefreq: "monthly", priority: "0.6" },
  { path: "/#/photo/grayscale", changefreq: "monthly", priority: "0.6" },
  { path: "/#/photo/sepia", changefreq: "monthly", priority: "0.6" },
  { path: "/#/photo/mirror", changefreq: "monthly", priority: "0.6" },
  { path: "/#/photo/vignette", changefreq: "monthly", priority: "0.6" },
  { path: "/#/photo/fisheye", changefreq: "monthly", priority: "0.6", hidden: true },
  { path: "/#/utils", changefreq: "weekly", priority: "0.85" },
  { path: "/#/utils/password", changefreq: "monthly", priority: "0.7" },
  { path: "/#/utils/translit", changefreq: "monthly", priority: "0.7" },
  { path: "/#/utils/days", changefreq: "monthly", priority: "0.7" },
  { path: "/#/audio", changefreq: "weekly", priority: "0.8" },
  { path: "/#/audio/degrade", changefreq: "monthly", priority: "0.7" },
  { path: "/#/video", changefreq: "monthly", priority: "0.4" },
];

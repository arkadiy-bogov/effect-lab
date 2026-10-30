import { SITE } from "./site-config.js";

const SITE_ORIGIN = SITE.origin;
const SITE_NAME = SITE.name;
const DEFAULT_TITLE = SITE.title;
const DEFAULT_DESCRIPTION = SITE.description;
const DEFAULT_IMAGE = SITE.image;

const SECTION_SEO = {
  photo: {
    title: "Фото-эффекты онлайн",
    description:
      "Онлайн-эффекты для фото в браузере: негатив, ЧБ, сепия, pixelate, blur, Instagram 2016 и degrade. Файлы не уходят на сервер.",
  },
  utils: {
    title: "Онлайн-инструменты",
    description:
      "Генератор паролей, транслит для URL/кода/паспорта и калькулятор дней. Без отправки данных на сервер.",
  },
  audio: {
    title: "Звуковые эффекты онлайн",
    description:
      "Ухудшение качества звука в браузере: даунсемпл, bitcrush, soft-clip и шум. Результат скачивается как WAV.",
  },
  video: {
    title: "Видео-эффекты - скоро",
    description:
      "Раздел видео-эффектов FX Lab в разработке: trim, degrade, glitch и экспорт без переписывания ядра.",
  },
};

function ensureMeta(attr, key, content) {
  let node = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute(attr, key);
    document.head.appendChild(node);
  }
  node.setAttribute("content", content);
}

function ensureLink(rel, href) {
  let node = document.head.querySelector(`link[rel="${rel}"]`);
  if (!node) {
    node = document.createElement("link");
    node.setAttribute("rel", rel);
    document.head.appendChild(node);
  }
  node.setAttribute("href", href);
}

function ensureJsonLd(id, data) {
  let node = document.getElementById(id);
  if (!node) {
    node = document.createElement("script");
    node.type = "application/ld+json";
    node.id = id;
    document.head.appendChild(node);
  }
  node.textContent = JSON.stringify(data);
}

function buildPageMeta(route, section, tool) {
  if (!route.sectionId) {
    return {
      title: `${DEFAULT_TITLE} | ${SITE_NAME}`,
      description: DEFAULT_DESCRIPTION,
      path: "/#/",
      type: "website",
    };
  }

  if (!section) {
    return {
      title: `Страница не найдена | ${SITE_NAME}`,
      description: "Запрошенный раздел FX Lab не найден. Вернитесь на главную и выберите фото, звук или видео.",
      path: "/#/",
      type: "website",
    };
  }

  const sectionSeo = SECTION_SEO[section.id] || {
    title: section.title,
    description: section.description || DEFAULT_DESCRIPTION,
  };

  if (!route.toolId) {
    return {
      title: `${sectionSeo.title} | ${SITE_NAME}`,
      description: sectionSeo.description,
      path: `/#/${section.id}`,
      type: "website",
    };
  }

  if (!tool) {
    return {
      title: `Инструмент не найден | ${SITE_NAME}`,
      description: `Инструмент в разделе «${section.title}» не найден.`,
      path: `/#/${section.id}`,
      type: "website",
    };
  }

  return {
    title: `${tool.title} - ${section.title} | ${SITE_NAME}`,
    description: tool.description || sectionSeo.description,
    path: `/#/${section.id}/${tool.id}`,
    type: "article",
  };
}

export function applySeo({ route, section = null, tool = null }) {
  const page = buildPageMeta(route, section, tool);
  const url = `${SITE_ORIGIN}${page.path}`;

  document.title = page.title;
  ensureMeta("name", "description", page.description);
  ensureMeta("name", "robots", "index, follow");
  ensureMeta("name", "author", SITE_NAME);
  ensureMeta("property", "og:site_name", SITE_NAME);
  ensureMeta("property", "og:locale", SITE.locale || "ru_RU");
  ensureMeta("property", "og:type", page.type);
  ensureMeta("property", "og:title", page.title);
  ensureMeta("property", "og:description", page.description);
  ensureMeta("property", "og:url", url);
  ensureMeta("property", "og:image", DEFAULT_IMAGE);
  ensureMeta("name", "twitter:card", "summary_large_image");
  ensureMeta("name", "twitter:title", page.title);
  ensureMeta("name", "twitter:description", page.description);
  ensureMeta("name", "twitter:image", DEFAULT_IMAGE);
  ensureLink("canonical", url);

  ensureJsonLd("seo-website", {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_ORIGIN,
    description: DEFAULT_DESCRIPTION,
    inLanguage: "ru",
  });

  if (section) {
    ensureJsonLd("seo-webpage", {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: page.title,
      description: page.description,
      url,
      isPartOf: {
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_ORIGIN,
      },
    });
  } else {
    const node = document.getElementById("seo-webpage");
    if (node) node.remove();
  }
}

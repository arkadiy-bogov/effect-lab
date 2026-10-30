import { getSections, getSection, getTool, getTools } from "./registry.js";
import { applySeo } from "./seo.js";
import { clear, el } from "./ui.js";

function parseHash() {
  const raw = (location.hash || "#/").replace(/^#/, "") || "/";
  const parts = raw.split("/").filter(Boolean);
  return {
    sectionId: parts[0] || null,
    toolId: parts[1] || null,
    parts,
  };
}

function closeMobileNav() {
  const bar = document.getElementById("header-bar");
  const toggle = document.getElementById("nav-toggle");
  if (!bar) return;
  bar.classList.remove("is-nav-open");
  if (toggle) toggle.setAttribute("aria-expanded", "false");
}

function backLink(href, label) {
  return el("a", { className: "back-link", href, "data-link": true }, [
    el("span", { className: "link-arrow link-arrow--back", "aria-hidden": "true" }),
    el("span", { className: "back-link-text", text: label }),
  ]);
}

function openMeta() {
  return el("span", { className: "meta" }, [
    el("span", { text: "Открыть" }),
    el("span", { className: "link-arrow link-arrow--fwd", "aria-hidden": "true" }),
  ]);
}

function renderNav(activeSection) {
  const nav = document.getElementById("main-nav");
  clear(nav);
  nav.append(
    el("a", {
      href: "#/",
      "data-link": true,
      className: !activeSection ? "is-active" : "",
      text: "Главная",
    })
  );
  for (const section of getSections()) {
    nav.append(
      el("a", {
        href: `#/${section.id}`,
        "data-link": true,
        className: activeSection === section.id ? "is-active" : "",
        text: section.navLabel || section.title,
      })
    );
  }
  closeMobileNav();
}

function homeView() {
  const root = el("div");
  root.append(
    el("section", { className: "hero" }, [
      el("h1", { text: "Эффекты и онлайн-инструменты" }),
      el("p", {
        text: "Фото, звук, генератор паролей, транслит и календарные расчёты - прямо в браузере, без загрузки файлов на сервер.",
      }),
      el("div", { className: "badges" }, [
        el("span", { className: "badge badge-pink", text: "фото" }),
        el("span", { className: "badge badge-mint", text: "инструменты" }),
        el("span", { className: "badge badge-blue", text: "звук" }),
        el("span", { className: "badge badge-lav", text: "видео скоро" }),
      ]),
    ])
  );

  const grid = el("div", { className: "card-grid" });
  for (const section of getSections()) {
    const tools = getTools(section.id);
    const ready = section.status !== "soon";
    grid.append(
      el(
        "a",
        {
          className: ready ? "card" : "card is-disabled",
          href: ready ? `#/${section.id}` : "#/",
          "data-link": ready ? true : undefined,
        },
        [
          el("h2", { text: section.title }),
          el("p", { text: section.description }),
          el("span", {
            className: "meta",
            text: ready
              ? `${tools.length} инструмент(ов)`
              : section.statusLabel || "Скоро",
          }),
        ]
      )
    );
  }
  root.append(el("h2", { className: "section-title", text: "Разделы" }), grid);
  return root;
}

function sectionView(section) {
  const root = el("div");
  root.append(
    backLink("#/", "На главную"),
    el("section", { className: "hero" }, [
      el("h1", { text: section.title }),
      el("p", { text: section.description }),
    ])
  );

  if (section.status === "soon") {
    root.append(
      el("div", { className: "panel" }, [
        el("p", {
          className: "hint",
          text: section.soonText || "Этот раздел ещё собирается. Архитектура уже готова к подключению инструментов.",
        }),
      ])
    );
    return root;
  }

  root.append(el("h2", { className: "section-title", text: "Инструменты" }));

  if (typeof section.renderTools === "function") {
    const host = el("div", { className: "tools-host" });
    root.append(host);
    const api = section.renderTools(host, getTools(section.id));
    root._dispose = typeof api?.dispose === "function" ? api.dispose : null;
    return root;
  }

  const tools = getTools(section.id);
  const grid = el("div", { className: "card-grid" });
  for (const tool of tools) {
    grid.append(
      el(
        "a",
        {
          className: "card",
          href: `#/${section.id}/${tool.id}`,
          "data-link": true,
        },
        [
          el("h3", { text: tool.title }),
          el("p", { text: tool.description }),
          openMeta(),
        ]
      )
    );
  }
  root.append(grid);
  return root;
}

function toolView(section, tool) {
  const root = el("div");
  root.append(
    backLink(`#/${section.id}`, section.title),
    el("section", { className: "hero" }, [
      el("h1", { text: tool.title }),
      el("p", { text: tool.description }),
    ])
  );
  const mount = el("div", { className: "tool-mount" });
  root.append(mount);
  const api = tool.mount(mount);
  root._dispose = typeof api?.dispose === "function" ? api.dispose : null;
  return root;
}

function notFound() {
  return el("div", { className: "panel" }, [
    el("h1", { text: "Страница не найдена" }),
    el("p", { className: "hint", text: "Проверьте адрес или вернитесь на главную." }),
    el("p", {}, [
      el("a", { href: "#/", "data-link": true, text: "На главную" }),
    ]),
  ]);
}

let currentDispose = null;

export function renderApp() {
  const view = document.getElementById("view");
  const route = parseHash();

  if (typeof currentDispose === "function") {
    try {
      currentDispose();
    } catch (_) {}
    currentDispose = null;
  }

  clear(view);
  renderNav(route.sectionId);

  let node;
  let section = null;
  let tool = null;
  if (!route.sectionId) {
    node = homeView();
  } else {
    section = getSection(route.sectionId);
    if (!section) {
      node = notFound();
    } else if (!route.toolId) {
      node = sectionView(section);
    } else {
      tool = getTool(route.sectionId, route.toolId);
      node = tool ? toolView(section, tool) : notFound();
    }
  }

  applySeo({ route, section, tool });
  view.append(node);
  currentDispose = node._dispose || null;
  window.scrollTo({ top: 0, behavior: "auto" });
}

export function setupMobileNav() {
  const bar = document.getElementById("header-bar");
  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("main-nav");
  if (!bar || !toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const open = !bar.classList.contains("is-nav-open");
    bar.classList.toggle("is-nav-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  nav.addEventListener("click", (e) => {
    if (e.target.closest("a")) closeMobileNav();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 880) closeMobileNav();
  });
}

export function startRouter() {
  window.addEventListener("hashchange", renderApp);
  if (!location.hash) location.hash = "#/";
  renderApp();
}

export function setupScrollTop() {
  const btn = document.getElementById("scroll-top");
  if (!btn) return;
  const toggle = () => {
    btn.classList.toggle("is-visible", window.scrollY >= window.innerHeight);
  };
  window.addEventListener("scroll", toggle, { passive: true });
  window.addEventListener("resize", toggle);
  toggle();
  btn.addEventListener("click", () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  });
}

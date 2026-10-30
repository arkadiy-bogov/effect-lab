import { registerSection } from "../core/registry.js";
import { el } from "../core/ui.js";
import { mountPhotoTool } from "./photo-workspace.js";
import { applyPixelate } from "../effects/photo/pixelate.js";
import { applyBlur } from "../effects/photo/blur.js";
import { applyIg2016, listIgPresets } from "../effects/photo/ig2016.js";
import { applyDegrade } from "../effects/photo/degrade.js";
import {
  applyNegative,
  applyGrayscale,
  applySepia,
  applyFisheye,
  applyMirror,
  applyVignette,
} from "../effects/photo/basics.js";

const PREVIEW_SRC = "assets/preview-source.png";
const PREVIEW_MAX = 420;

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("preview image failed"));
    img.src = url;
  });
}

function downscale(source, maxSide) {
  const scale = Math.min(1, maxSide / Math.max(source.width, source.height));
  const w = Math.max(1, Math.round(source.width * scale));
  const h = Math.max(1, Math.round(source.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(source, 0, 0, w, h);
  return canvas;
}

async function paintPreview(canvas, apply, options, sourceSmall) {
  const ctx = canvas.getContext("2d");
  canvas.width = sourceSmall.width;
  canvas.height = sourceSmall.height;
  ctx.fillStyle = "#0a0d0b";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  try {
    const result = await apply(sourceSmall, options);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(result, 0, 0, canvas.width, canvas.height);
  } catch (err) {
    console.error(err);
    ctx.fillStyle = "#8fa094";
    ctx.font = "14px sans-serif";
    ctx.fillText("preview error", 12, 24);
  }
}

function renderPhotoTools(host, tools) {
  const grid = el("div", { className: "card-grid card-grid--preview" });
  host.append(grid);

  const cards = tools.map((tool) => {
    const canvas = el("canvas", { className: "card-preview-canvas" });
    const media = el("div", { className: "card-preview" }, [canvas]);
    const card = el(
      "a",
      {
        className: "card card--preview",
        href: `#/photo/${tool.id}`,
        "data-link": true,
      },
      [
        media,
        el("div", { className: "card-body" }, [
          el("h3", { text: tool.title }),
          el("p", { text: tool.description }),
          el("span", { className: "meta" }, [
            el("span", { text: "Открыть" }),
            el("span", { className: "link-arrow link-arrow--fwd", "aria-hidden": "true" }),
          ]),
        ]),
      ]
    );
    grid.append(card);
    return { tool, canvas };
  });

  let cancelled = false;
  (async () => {
    try {
      const full = await loadImage(PREVIEW_SRC);
      if (cancelled) return;
      const small = downscale(full, PREVIEW_MAX);
      for (const item of cards) {
        if (cancelled) return;
        const preview = item.tool.preview;
        if (!preview) continue;
        await paintPreview(item.canvas, preview.apply, preview.options, small);
      }
    } catch (err) {
      console.error(err);
    }
  })();

  return {
    dispose() {
      cancelled = true;
    },
  };
}

registerSection({
  id: "photo",
  order: 10,
  title: "Фото",
  navLabel: "Фото",
  description: "Базовые и продвинутые эффекты: цвет, геометрия, blur, Instagram 2016 и degrade.",
  renderTools: renderPhotoTools,
  tools: [
    {
      id: "negative",
      order: 50,
      title: "Негатив",
      description: "Инверсия цветов. Силу можно ослабить.",
      preview: { apply: applyNegative, options: { strength: 1 } },
      mount(root) {
        return mountPhotoTool(root, {
          slug: "negative",
          defaults: { strength: 1 },
          controls: [
            { type: "range", id: "ng-s", key: "strength", label: "Сила", min: 0, max: 1, step: 0.05, live: false },
          ],
          apply: (img, opts) => applyNegative(img, opts),
        });
      },
    },
    {
      id: "grayscale",
      order: 60,
      title: "Чёрно-белое",
      description: "Перевод в ЧБ с регулировкой контраста.",
      preview: { apply: applyGrayscale, options: { strength: 1, contrast: 0.15 } },
      mount(root) {
        return mountPhotoTool(root, {
          slug: "grayscale",
          defaults: { strength: 1, contrast: 0.1 },
          controls: [
            { type: "range", id: "bw-s", key: "strength", label: "Сила", min: 0, max: 1, step: 0.05, live: false },
            { type: "range", id: "bw-c", key: "contrast", label: "Контраст", min: -0.5, max: 1, step: 0.05, live: false },
          ],
          apply: (img, opts) => applyGrayscale(img, opts),
        });
      },
    },
    {
      id: "sepia",
      order: 70,
      title: "Сепия",
      description: "Тёплый винтажный тон.",
      preview: { apply: applySepia, options: { strength: 1 } },
      mount(root) {
        return mountPhotoTool(root, {
          slug: "sepia",
          defaults: { strength: 0.9 },
          controls: [
            { type: "range", id: "sp-s", key: "strength", label: "Сила", min: 0, max: 1, step: 0.05, live: false },
          ],
          apply: (img, opts) => applySepia(img, opts),
        });
      },
    },
    {
      id: "fisheye",
      order: 100,
      hidden: true,
      title: "Фишай",
      description: "Бочкообразная дисторсия, как у сверхширокого объектива.",
      preview: { apply: applyFisheye, options: { amount: 0.7, zoom: 1.05 } },
      mount(root) {
        return mountPhotoTool(root, {
          slug: "fisheye",
          hint: "Zoom чуть выше 1 обрезает пустые края после искажения.",
          defaults: { amount: 0.65, zoom: 1.05 },
          controls: [
            { type: "range", id: "fe-a", key: "amount", label: "Сила", min: 0, max: 1, step: 0.05, live: false },
            { type: "range", id: "fe-z", key: "zoom", label: "Zoom", min: 0.7, max: 1.3, step: 0.01, live: false },
          ],
          apply: (img, opts) => applyFisheye(img, opts),
        });
      },
    },
    {
      id: "mirror",
      order: 80,
      title: "Зеркало",
      description: "Отражение по горизонтали, вертикали или обеим осям.",
      preview: { apply: applyMirror, options: { mode: "horizontal" } },
      mount(root) {
        return mountPhotoTool(root, {
          slug: "mirror",
          defaults: { mode: "horizontal" },
          controls: [
            {
              type: "select",
              id: "mr-m",
              key: "mode",
              label: "Ось",
              options: [
                { value: "horizontal", label: "Горизонталь" },
                { value: "vertical", label: "Вертикаль" },
                { value: "both", label: "Обе оси" },
              ],
              live: false,
            },
          ],
          apply: (img, opts) => applyMirror(img, opts),
        });
      },
    },
    {
      id: "vignette",
      order: 90,
      title: "Виньетка",
      description: "Затемнение краёв кадра.",
      preview: { apply: applyVignette, options: { strength: 0.7, softness: 0.8 } },
      mount(root) {
        return mountPhotoTool(root, {
          slug: "vignette",
          defaults: { strength: 0.55, softness: 0.85 },
          controls: [
            { type: "range", id: "vg-s", key: "strength", label: "Сила", min: 0, max: 1, step: 0.05, live: false },
            { type: "range", id: "vg-f", key: "softness", label: "Мягкость", min: 0.3, max: 1.4, step: 0.05, live: false },
          ],
          apply: (img, opts) => applyVignette(img, opts),
        });
      },
    },
    {
      id: "pixelate",
      order: 20,
      title: "Advanced Pixelate",
      description: "Блочная пикселизация с квантованием цветов и лёгким jitter мозаики.",
      preview: {
        apply: applyPixelate,
        options: { blockSize: 12, colorLevels: 20, mosaicJitter: 3 },
      },
      mount(root) {
        return mountPhotoTool(root, {
          slug: "pixelate",
          hint: "Большой block size + мало уровней цвета даёт жёсткий ретро-пиксель.",
          defaults: { blockSize: 14, colorLevels: 24, mosaicJitter: 4 },
          controls: [
            { type: "range", id: "px-bs", key: "blockSize", label: "Размер блока", min: 2, max: 48, step: 1, live: false },
            { type: "range", id: "px-cl", key: "colorLevels", label: "Уровни цвета", min: 2, max: 64, step: 1, live: false },
            { type: "range", id: "px-jt", key: "mosaicJitter", label: "Jitter", min: 0, max: 30, step: 1, live: false },
          ],
          apply: (img, opts) => applyPixelate(img, opts),
        });
      },
    },
    {
      id: "blur",
      order: 30,
      title: "Advanced Blur",
      description: "Гауссово размытие через stack box-blur, с качеством и лёгким directional smear.",
      preview: {
        apply: applyBlur,
        options: { radius: 8, quality: 0.7, directional: 0.2 },
      },
      mount(root) {
        return mountPhotoTool(root, {
          slug: "blur",
          hint: "Quality ниже 1 ускоряет обработку больших фото за счёт даунскейла.",
          defaults: { radius: 10, quality: 0.85, directional: 0.15 },
          controls: [
            { type: "range", id: "bl-r", key: "radius", label: "Радиус", min: 0, max: 40, step: 0.5, live: false },
            { type: "range", id: "bl-q", key: "quality", label: "Quality", min: 0.25, max: 1, step: 0.05, live: false },
            { type: "range", id: "bl-d", key: "directional", label: "Directional", min: 0, max: 1, step: 0.05, live: false },
          ],
          apply: (img, opts) => applyBlur(img, opts),
        });
      },
    },
    {
      id: "ig2016",
      order: 40,
      title: "Instagram 2016 Filter",
      description: "Контраст, тепло, fade и виньетка в духе популярных пресетов середины 2010-х.",
      preview: {
        apply: applyIg2016,
        options: { preset: "juno", strength: 1 },
      },
      mount(root) {
        return mountPhotoTool(root, {
          slug: "ig2016",
          hint: "Это стилизация под эпоху, а не копия чужих LUT-файлов Instagram.",
          defaults: { preset: "juno", strength: 1 },
          controls: [
            {
              type: "select",
              id: "ig-p",
              key: "preset",
              label: "Пресет",
              options: listIgPresets(),
              live: false,
            },
            { type: "range", id: "ig-s", key: "strength", label: "Сила", min: 0, max: 1, step: 0.05, live: false },
          ],
          apply: (img, opts) => applyIg2016(img, opts),
        });
      },
    },
    {
      id: "degrade",
      order: 10,
      title: "Degrade Quality",
      description: "Повторное JPEG-сжатие, даунскейл, шум и chroma shift.",
      preview: {
        apply: applyDegrade,
        options: { quality: 0.14, generations: 3, noise: 14, chromaShift: 2, downscale: 0.65 },
      },
      mount(root) {
        return mountPhotoTool(root, {
          slug: "degrade",
          hint: "Больше generations - сильнее «усталость» файла.",
          defaults: { quality: 0.16, generations: 5, noise: 16, chromaShift: 3, downscale: 0.7 },
          controls: [
            { type: "range", id: "dg-q", key: "quality", label: "JPEG quality", min: 0.05, max: 0.6, step: 0.01, live: false },
            { type: "range", id: "dg-g", key: "generations", label: "Generations", min: 1, max: 10, step: 1, live: false },
            { type: "range", id: "dg-n", key: "noise", label: "Noise", min: 0, max: 40, step: 1, live: false },
            { type: "range", id: "dg-c", key: "chromaShift", label: "Chroma shift", min: 0, max: 8, step: 1, live: false },
            { type: "range", id: "dg-d", key: "downscale", label: "Downscale", min: 0.3, max: 1, step: 0.05, live: false },
          ],
          apply: (img, opts) => applyDegrade(img, opts),
        });
      },
    },
  ],
});

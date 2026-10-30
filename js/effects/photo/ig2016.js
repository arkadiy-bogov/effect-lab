function clamp(v) {
  return Math.max(0, Math.min(255, v));
}

function applyCurve(v, amount) {
  // S-curve contrast
  const x = v / 255;
  const y = x < 0.5
    ? Math.pow(x * 2, 1 + amount) / 2
    : 1 - Math.pow((1 - x) * 2, 1 + amount) / 2;
  return y * 255;
}

const PRESETS = {
  clarendon: {
    label: "Clarendon-ish",
    contrast: 0.35,
    saturation: 1.25,
    warmth: 8,
    fade: 12,
    vignette: 0.35,
    tealShadows: 10,
  },
  juno: {
    label: "Juno-ish",
    contrast: 0.2,
    saturation: 1.35,
    warmth: 22,
    fade: 18,
    vignette: 0.22,
    tealShadows: 0,
  },
  ludwig: {
    label: "Ludwig-ish",
    contrast: 0.15,
    saturation: 0.85,
    warmth: 6,
    fade: 28,
    vignette: 0.18,
    tealShadows: 0,
  },
  ginza: {
    label: "Ginza-ish",
    contrast: 0.28,
    saturation: 1.1,
    warmth: 16,
    fade: 10,
    vignette: 0.28,
    tealShadows: 6,
  },
};

export function listIgPresets() {
  return Object.entries(PRESETS).map(([id, p]) => ({ value: id, label: p.label }));
}

export function applyIg2016(source, options = {}) {
  const presetId = options.preset || "clarendon";
  const strength = Math.max(0, Math.min(1, options.strength ?? 0.85));
  const preset = PRESETS[presetId] || PRESETS.clarendon;

  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(source, 0, 0);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = img;
  const cx = (width - 1) / 2;
  const cy = (height - 1) / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy) || 1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Contrast curve
      r = applyCurve(r, preset.contrast);
      g = applyCurve(g, preset.contrast);
      b = applyCurve(b, preset.contrast);

      // Warmth
      r += preset.warmth;
      b -= preset.warmth * 0.55;

      // Teal shadows (Clarendon vibe)
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (preset.tealShadows && luma < 110) {
        const t = (110 - luma) / 110;
        g += preset.tealShadows * t;
        b += preset.tealShadows * t * 1.2;
        r -= preset.tealShadows * t * 0.35;
      }

      // Saturation
      const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      r = gray + (r - gray) * preset.saturation;
      g = gray + (g - gray) * preset.saturation;
      b = gray + (b - gray) * preset.saturation;

      // Fade toward soft cream
      r = r + (235 - r) * (preset.fade / 255);
      g = g + (228 - g) * (preset.fade / 255);
      b = b + (220 - b) * (preset.fade / 255);

      // Vignette
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) / maxDist;
      const vig = 1 - Math.pow(dist, 1.6) * preset.vignette;
      r *= vig;
      g *= vig;
      b *= vig;

      // Mix with original by strength
      data[i] = clamp(data[i] + (r - data[i]) * strength);
      data[i + 1] = clamp(data[i + 1] + (g - data[i + 1]) * strength);
      data[i + 2] = clamp(data[i + 2] + (b - data[i + 2]) * strength);
    }
  }

  ctx.putImageData(img, 0, 0);
  return canvas;
}

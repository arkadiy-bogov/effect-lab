function toCanvas(source) {
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(source, 0, 0);
  return { canvas, ctx };
}

function clamp(v) {
  return Math.max(0, Math.min(255, v));
}

function mixStrength(orig, next, strength) {
  const t = Math.max(0, Math.min(1, strength));
  return orig + (next - orig) * t;
}

export function applyNegative(source, options = {}) {
  const strength = options.strength ?? 1;
  const { canvas, ctx } = toCanvas(source);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    d[i] = mixStrength(d[i], 255 - d[i], strength);
    d[i + 1] = mixStrength(d[i + 1], 255 - d[i + 1], strength);
    d[i + 2] = mixStrength(d[i + 2], 255 - d[i + 2], strength);
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

export function applyGrayscale(source, options = {}) {
  const strength = options.strength ?? 1;
  const contrast = options.contrast ?? 0;
  const { canvas, ctx } = toCanvas(source);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    let g = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    if (contrast) {
      const c = 1 + contrast;
      g = (g - 128) * c + 128;
    }
    g = clamp(g);
    d[i] = mixStrength(d[i], g, strength);
    d[i + 1] = mixStrength(d[i + 1], g, strength);
    d[i + 2] = mixStrength(d[i + 2], g, strength);
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

export function applySepia(source, options = {}) {
  const strength = options.strength ?? 1;
  const { canvas, ctx } = toCanvas(source);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    const nr = clamp(0.393 * r + 0.769 * g + 0.189 * b);
    const ng = clamp(0.349 * r + 0.686 * g + 0.168 * b);
    const nb = clamp(0.272 * r + 0.534 * g + 0.131 * b);
    d[i] = mixStrength(r, nr, strength);
    d[i + 1] = mixStrength(g, ng, strength);
    d[i + 2] = mixStrength(b, nb, strength);
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

export function applyFisheye(source, options = {}) {
  const amount = Math.max(0, Math.min(1, options.amount ?? 0.65));
  const zoom = Math.max(0.6, Math.min(1.4, options.zoom ?? 1));
  const { canvas, ctx } = toCanvas(source);
  if (amount <= 0.01) return canvas;

  const src = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const out = ctx.createImageData(canvas.width, canvas.height);
  const w = canvas.width;
  const h = canvas.height;
  const cx = (w - 1) / 2;
  const cy = (h - 1) / 2;
  const maxR = Math.sqrt(cx * cx + cy * cy) || 1;
  const k = amount * 1.35;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (x - cx) / maxR;
      const dy = (y - cy) / maxR;
      const r = Math.sqrt(dx * dx + dy * dy);
      const r2 = r * r;
      // Barrel distortion, then slight zoom to crop empty edges
      const factor = r > 0 ? (1 + k * r2) / zoom : 1 / zoom;
      const sx = cx + dx * maxR * factor;
      const sy = cy + dy * maxR * factor;
      const i = (y * w + x) * 4;

      if (sx < 0 || sy < 0 || sx >= w - 1 || sy >= h - 1) {
        out.data[i + 3] = 0;
        continue;
      }

      const x0 = Math.floor(sx);
      const y0 = Math.floor(sy);
      const fx = sx - x0;
      const fy = sy - y0;
      const i00 = (y0 * w + x0) * 4;
      const i10 = i00 + 4;
      const i01 = i00 + w * 4;
      const i11 = i01 + 4;
      for (let c = 0; c < 4; c++) {
        const v00 = src.data[i00 + c];
        const v10 = src.data[i10 + c];
        const v01 = src.data[i01 + c];
        const v11 = src.data[i11 + c];
        const v0 = v00 * (1 - fx) + v10 * fx;
        const v1 = v01 * (1 - fx) + v11 * fx;
        out.data[i + c] = v0 * (1 - fy) + v1 * fy;
      }
    }
  }

  ctx.putImageData(out, 0, 0);
  return canvas;
}

export function applyMirror(source, options = {}) {
  const mode = options.mode || "horizontal";
  const { canvas, ctx } = toCanvas(source);
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (mode === "vertical") {
    ctx.translate(0, canvas.height);
    ctx.scale(1, -1);
  } else if (mode === "both") {
    ctx.translate(canvas.width, canvas.height);
    ctx.scale(-1, -1);
  } else {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(source, 0, 0);
  ctx.restore();
  return canvas;
}

export function applyVignette(source, options = {}) {
  const strength = Math.max(0, Math.min(1, options.strength ?? 0.55));
  const softness = Math.max(0.2, Math.min(1.5, options.softness ?? 0.85));
  const { canvas, ctx } = toCanvas(source);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  const cx = (canvas.width - 1) / 2;
  const cy = (canvas.height - 1) / 2;
  const maxR = Math.sqrt(cx * cx + cy * cy) || 1;

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      const dx = (x - cx) / maxR;
      const dy = (y - cy) / maxR;
      const dist = Math.pow(Math.sqrt(dx * dx + dy * dy), 1 / softness);
      const shade = 1 - Math.min(1, Math.max(0, dist)) * strength;
      d[i] *= shade;
      d[i + 1] *= shade;
      d[i + 2] *= shade;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function averageBlock(data, width, height, x0, y0, bw, bh) {
  let r = 0;
  let g = 0;
  let b = 0;
  let a = 0;
  let n = 0;
  const x1 = Math.min(width, x0 + bw);
  const y1 = Math.min(height, y0 + bh);
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * width + x) * 4;
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      a += data[i + 3];
      n++;
    }
  }
  if (!n) return [0, 0, 0, 0];
  return [r / n, g / n, b / n, a / n];
}

function quantize(v, levels) {
  if (levels >= 256) return v;
  const step = 255 / Math.max(1, levels - 1);
  return Math.round(v / step) * step;
}

export function applyPixelate(source, options = {}) {
  const {
    blockSize = 12,
    colorLevels = 32,
    mosaicJitter = 0,
    keepAlpha = true,
  } = options;

  const { canvas, ctx } = (() => {
    const canvas = document.createElement("canvas");
    canvas.width = source.width;
    canvas.height = source.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    return { canvas, ctx };
  })();

  ctx.drawImage(source, 0, 0);
  const src = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const out = ctx.createImageData(canvas.width, canvas.height);
  const sw = canvas.width;
  const sh = canvas.height;
  const bs = Math.max(1, Math.round(blockSize));

  for (let y = 0; y < sh; y += bs) {
    for (let x = 0; x < sw; x += bs) {
      let [r, g, b, a] = averageBlock(src.data, sw, sh, x, y, bs, bs);
      if (mosaicJitter > 0) {
        const j = mosaicJitter;
        r = clamp(r + (Math.random() * 2 - 1) * j, 0, 255);
        g = clamp(g + (Math.random() * 2 - 1) * j, 0, 255);
        b = clamp(b + (Math.random() * 2 - 1) * j, 0, 255);
      }
      r = quantize(r, colorLevels);
      g = quantize(g, colorLevels);
      b = quantize(b, colorLevels);
      const x1 = Math.min(sw, x + bs);
      const y1 = Math.min(sh, y + bs);
      for (let py = y; py < y1; py++) {
        for (let px = x; px < x1; px++) {
          const i = (py * sw + px) * 4;
          out.data[i] = r;
          out.data[i + 1] = g;
          out.data[i + 2] = b;
          out.data[i + 3] = keepAlpha ? src.data[i + 3] : a;
        }
      }
    }
  }

  ctx.putImageData(out, 0, 0);
  return canvas;
}

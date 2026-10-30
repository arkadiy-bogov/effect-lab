function boxesForGauss(sigma, n = 3) {
  const wIdeal = Math.sqrt((12 * sigma * sigma) / n + 1);
  let wl = Math.floor(wIdeal);
  if (wl % 2 === 0) wl--;
  const wu = wl + 2;
  const mIdeal = (12 * sigma * sigma - n * wl * wl - 4 * n * wl - 3 * n) / (-4 * wl - 4);
  const m = Math.round(mIdeal);
  const sizes = [];
  for (let i = 0; i < n; i++) sizes.push(i < m ? wl : wu);
  return sizes;
}

function boxBlurH(src, dest, w, h, r) {
  const iarr = 1 / (r + r + 1);
  for (let y = 0; y < h; y++) {
    let ti = y * w;
    let li = ti;
    let ri = ti + r;
    const fv = src[ti];
    const lv = src[ti + w - 1];
    let val = (r + 1) * fv;
    for (let j = 0; j < r; j++) val += src[ti + j];
    for (let j = 0; j <= r; j++) {
      val += src[ri++] - fv;
      dest[ti++] = val * iarr;
    }
    for (let j = r + 1; j < w - r; j++) {
      val += src[ri++] - src[li++];
      dest[ti++] = val * iarr;
    }
    for (let j = w - r; j < w; j++) {
      val += lv - src[li++];
      dest[ti++] = val * iarr;
    }
  }
}

function boxBlurT(src, dest, w, h, r) {
  const iarr = 1 / (r + r + 1);
  for (let x = 0; x < w; x++) {
    let ti = x;
    let li = ti;
    let ri = ti + r * w;
    const fv = src[ti];
    const lv = src[ti + w * (h - 1)];
    let val = (r + 1) * fv;
    for (let j = 0; j < r; j++) val += src[ti + j * w];
    for (let j = 0; j <= r; j++) {
      val += src[ri] - fv;
      dest[ti] = val * iarr;
      ri += w;
      ti += w;
    }
    for (let j = r + 1; j < h - r; j++) {
      val += src[ri] - src[li];
      dest[ti] = val * iarr;
      li += w;
      ri += w;
      ti += w;
    }
    for (let j = h - r; j < h; j++) {
      val += lv - src[li];
      dest[ti] = val * iarr;
      li += w;
      ti += w;
    }
  }
}

function boxBlurChannel(channel, w, h, r) {
  const tmp = new Float32Array(channel.length);
  const out = new Float32Array(channel.length);
  boxBlurH(channel, tmp, w, h, r);
  boxBlurT(tmp, out, w, h, r);
  return out;
}

function gaussBlurChannel(channel, w, h, radius) {
  const sigma = Math.max(0.5, radius);
  const boxes = boxesForGauss(sigma, 3);
  let current = Float32Array.from(channel);
  for (const size of boxes) {
    const r = Math.max(0, (size - 1) / 2);
    if (r < 1) continue;
    current = boxBlurChannel(current, w, h, r);
  }
  return current;
}

export function applyBlur(source, options = {}) {
  const {
    radius = 8,
    quality = 1,
    directional = 0,
  } = options;

  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(source, 0, 0);

  if (radius <= 0.2) return canvas;

  // Для больших радиусов сначала уменьшаем, потом размываем и апскейлим.
  const scale = quality >= 1 ? 1 : Math.max(0.25, quality);
  const w = Math.max(1, Math.round(canvas.width * scale));
  const h = Math.max(1, Math.round(canvas.height * scale));
  const small = document.createElement("canvas");
  small.width = w;
  small.height = h;
  const sctx = small.getContext("2d", { willReadFrequently: true });
  sctx.drawImage(canvas, 0, 0, w, h);

  const img = sctx.getImageData(0, 0, w, h);
  const rC = new Float32Array(w * h);
  const gC = new Float32Array(w * h);
  const bC = new Float32Array(w * h);
  const aC = new Float32Array(w * h);
  for (let i = 0, p = 0; i < img.data.length; i += 4, p++) {
    rC[p] = img.data[i];
    gC[p] = img.data[i + 1];
    bC[p] = img.data[i + 2];
    aC[p] = img.data[i + 3];
  }

  const rad = Math.max(0.5, radius * scale);
  let rr = gaussBlurChannel(rC, w, h, rad);
  let gg = gaussBlurChannel(gC, w, h, rad);
  let bb = gaussBlurChannel(bC, w, h, rad);
  const aa = aC;

  if (directional > 0) {
    const shift = Math.round(directional * rad);
    const tmpR = new Float32Array(rr.length);
    const tmpG = new Float32Array(gg.length);
    const tmpB = new Float32Array(bb.length);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const sx = Math.min(w - 1, Math.max(0, x + shift));
        const i = y * w + x;
        const j = y * w + sx;
        tmpR[i] = (rr[i] + rr[j]) * 0.5;
        tmpG[i] = (gg[i] + gg[j]) * 0.5;
        tmpB[i] = (bb[i] + bb[j]) * 0.5;
      }
    }
    rr = tmpR;
    gg = tmpG;
    bb = tmpB;
  }

  for (let i = 0, p = 0; i < img.data.length; i += 4, p++) {
    img.data[i] = rr[p];
    img.data[i + 1] = gg[p];
    img.data[i + 2] = bb[p];
    img.data[i + 3] = aa[p];
  }
  sctx.putImageData(img, 0, 0);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(small, 0, 0, canvas.width, canvas.height);
  return canvas;
}

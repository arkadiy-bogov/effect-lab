function clamp(v) {
  return Math.max(0, Math.min(255, v));
}

function canvasToJpegDataUrl(canvas, quality) {
  return canvas.toDataURL("image/jpeg", quality);
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export async function applyDegrade(source, options = {}) {
  const {
    quality = 0.18,
    generations = 4,
    noise = 18,
    chromaShift = 2,
    downscale = 0.72,
  } = options;

  let working = document.createElement("canvas");
  working.width = Math.max(1, Math.round(source.width * Math.min(1, Math.max(0.2, downscale))));
  working.height = Math.max(1, Math.round(source.height * Math.min(1, Math.max(0.2, downscale))));
  let ctx = working.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(source, 0, 0, working.width, working.height);

  const gens = Math.max(1, Math.round(generations));
  for (let g = 0; g < gens; g++) {
    const q = Math.max(0.05, quality - g * 0.02);
    const url = canvasToJpegDataUrl(working, q);
    const img = await loadImage(url);
    ctx.clearRect(0, 0, working.width, working.height);
    ctx.drawImage(img, 0, 0, working.width, working.height);
  }

  const data = ctx.getImageData(0, 0, working.width, working.height);
  const { width, height } = data;
  const shift = Math.round(chromaShift);
  const copy = new Uint8ClampedArray(data.data);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const sx = Math.min(width - 1, Math.max(0, x + shift));
      const si = (y * width + sx) * 4;
      let r = copy[i];
      let g = copy[i + 1];
      let b = copy[si + 2]; // chroma shift on blue
      if (noise > 0) {
        const n = (Math.random() * 2 - 1) * noise;
        r += n;
        g += n * 0.85;
        b += n * 0.7;
      }
      data.data[i] = clamp(r);
      data.data[i + 1] = clamp(g);
      data.data[i + 2] = clamp(b);
    }
  }
  ctx.putImageData(data, 0, 0);

  const out = document.createElement("canvas");
  out.width = source.width;
  out.height = source.height;
  const octx = out.getContext("2d");
  octx.imageSmoothingEnabled = true;
  octx.drawImage(working, 0, 0, out.width, out.height);
  return out;
}

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    if (key === "className") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key === "html") node.innerHTML = value;
    else if (key.startsWith("on") && typeof value === "function") {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === "dataset" && typeof value === "object") {
      Object.assign(node.dataset, value);
    } else {
      node.setAttribute(key, value === true ? "" : String(value));
    }
  }
  for (const child of [].concat(children)) {
    if (child == null || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

export function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = el("a", { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Cannot load image"));
    };
    img.src = url;
  });
}

export function createCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  return { canvas, ctx };
}

export function cloneImageData(imageData) {
  return new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  );
}

export function setupDropzone(zone, { accept, onFile, multiple = false }) {
  const input = el("input", {
    type: "file",
    accept,
    multiple: multiple ? true : undefined,
    style: "display:none",
  });
  zone.append(input);

  const pick = () => input.click();
  zone.addEventListener("click", pick);
  zone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pick();
    }
  });
  zone.tabIndex = 0;
  zone.setAttribute("role", "button");

  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (file) onFile(file);
    input.value = "";
  });

  ["dragenter", "dragover"].forEach((type) => {
    zone.addEventListener(type, (e) => {
      e.preventDefault();
      zone.classList.add("is-drag");
    });
  });
  ["dragleave", "drop"].forEach((type) => {
    zone.addEventListener(type, (e) => {
      e.preventDefault();
      zone.classList.remove("is-drag");
    });
  });
  zone.addEventListener("drop", (e) => {
    const file = e.dataTransfer?.files?.[0];
    if (file) onFile(file);
  });

  return { input, pick };
}

export function controlRange({ id, label, min, max, step, value, onInput }) {
  const valueEl = el("span", { text: String(value) });
  const input = el("input", {
    type: "range",
    id,
    min,
    max,
    step,
    value,
    oninput: (e) => {
      valueEl.textContent = e.target.value;
      onInput(Number(e.target.value));
    },
  });
  return el("div", { className: "control" }, [
    el("label", { for: id }, [label, valueEl]),
    input,
  ]);
}

export function controlSelect({ id, label, options, value, onChange }) {
  const select = el(
    "select",
    {
      id,
      onchange: (e) => onChange(e.target.value),
    },
    options.map((opt) =>
      el("option", {
        value: opt.value,
        selected: opt.value === value ? true : undefined,
        text: opt.label,
      })
    )
  );
  return el("div", { className: "control" }, [
    el("label", { for: id, text: label }),
    select,
  ]);
}

import {
  controlRange,
  controlSelect,
  createCanvas,
  downloadBlob,
  el,
  fileToImage,
  formatBytes,
  setupDropzone,
} from "../core/ui.js";

export function mountPhotoTool(root, config) {
  const state = {
    source: null,
    fileName: "image",
    options: { ...config.defaults },
    busy: false,
    pending: false,
  };

  let debounceTimer = 0;

  const status = el("div", { className: "status" });
  const previewHost = el("div", { className: "preview-box" });
  const canvas = el("canvas");
  previewHost.append(canvas);

  const controlsHost = el("div", { className: "controls" });
  const downloadBtn = el("button", {
    className: "btn",
    type: "button",
    text: "Скачать PNG",
    disabled: true,
  });
  const resetBtn = el("button", {
    className: "btn btn-ghost",
    type: "button",
    text: "Сбросить",
    disabled: true,
  });

  const drop = el("div", { className: "dropzone" }, [
    el("strong", { text: "Перетащите фото сюда" }),
    el("span", { text: "или нажмите, чтобы выбрать файл (JPG, PNG, WEBP)" }),
  ]);

  setupDropzone(drop, {
    accept: "image/*",
    onFile: async (file) => {
      try {
        status.textContent = "Загрузка...";
        state.source = await fileToImage(file);
        state.fileName = (file.name || "image").replace(/\.[^.]+$/, "");
        status.textContent = `${file.name || "image"} · ${formatBytes(file.size)} · ${state.source.width}x${state.source.height}`;
        resetBtn.disabled = false;
        drawSource();
        await run();
      } catch (err) {
        console.error(err);
        status.textContent = "Не удалось открыть изображение";
      }
    },
  });

  function drawSource() {
    if (!state.source) return;
    canvas.width = state.source.width;
    canvas.height = state.source.height;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(state.source, 0, 0);
    downloadBtn.disabled = false;
  }

  async function run() {
    if (!state.source) return;
    if (state.busy) {
      state.pending = true;
      return;
    }
    state.busy = true;
    status.textContent = "Считаем эффект...";
    try {
      const result = await config.apply(state.source, { ...state.options });
      const ctx = canvas.getContext("2d");
      canvas.width = result.width;
      canvas.height = result.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(result, 0, 0);
      downloadBtn.disabled = false;
      status.textContent = "Готово";
    } catch (err) {
      console.error(err);
      status.textContent = "Ошибка обработки";
    } finally {
      state.busy = false;
      if (state.pending) {
        state.pending = false;
        run();
      }
    }
  }

  function scheduleRun() {
    if (!state.source) return;
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      run();
    }, 120);
  }

  for (const ctrl of config.controls) {
    if (ctrl.type === "range") {
      controlsHost.append(
        controlRange({
          id: ctrl.id,
          label: ctrl.label,
          min: ctrl.min,
          max: ctrl.max,
          step: ctrl.step,
          value: state.options[ctrl.key],
          onInput: (v) => {
            state.options[ctrl.key] = v;
            scheduleRun();
          },
        })
      );
    } else if (ctrl.type === "select") {
      controlsHost.append(
        controlSelect({
          id: ctrl.id,
          label: ctrl.label,
          options: ctrl.options,
          value: state.options[ctrl.key],
          onChange: (v) => {
            state.options[ctrl.key] = v;
            scheduleRun();
          },
        })
      );
    }
  }

  resetBtn.addEventListener("click", () => {
    if (!state.source) return;
    drawSource();
    status.textContent = "Исходник восстановлен";
  });
  downloadBtn.addEventListener("click", () => {
    canvas.toBlob((blob) => {
      if (!blob) return;
      downloadBlob(blob, `${state.fileName}-${config.slug || "fx"}.png`);
    }, "image/png");
  });

  root.append(
    el("div", { className: "panel" }, [drop, status]),
    el("div", { className: "workspace" }, [
      el("div", { className: "panel" }, [previewHost]),
      el("div", { className: "panel" }, [
        controlsHost,
        el("div", { className: "toolbar" }, [resetBtn, downloadBtn]),
        el("p", { className: "hint", text: config.hint || "" }),
      ]),
    ])
  );

  return {
    dispose() {
      window.clearTimeout(debounceTimer);
      state.source = null;
    },
  };
}

export { createCanvas };

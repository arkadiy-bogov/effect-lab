import { registerSection } from "../core/registry.js";
import {
  controlRange,
  downloadBlob,
  el,
  formatBytes,
  setupDropzone,
} from "../core/ui.js";
import { degradeAudio, drawWaveform } from "../effects/audio/degrade.js";
import { mountTextToSpeech } from "./audio-tts.js";

const DEMO_SRC = "assets/demo-call.wav";
const DEMO_NAME = "demo-call.wav";

function mountAudioDegrade(root) {
  const state = {
    file: null,
    buffer: null,
    resultUrl: null,
    options: {
      targetRate: 11025,
      bitDepth: 8,
      lowpass: 3400,
      noise: 0.025,
      drive: 1.7,
    },
  };

  const status = el("div", { className: "status" });
  const wave = el("canvas", { className: "wave", width: 900, height: 88 });
  const audio = el("audio", { controls: true });
  const applyBtn = el("button", { className: "btn", type: "button", text: "Испортить звук", disabled: true });
  const downloadBtn = el("button", {
    className: "btn btn-ghost",
    type: "button",
    text: "Скачать WAV",
    disabled: true,
  });

  const drop = el("div", { className: "dropzone" }, [
    el("strong", { text: "Перетащите аудио сюда" }),
    el("span", { text: "Или оставьте демо-звонок. MP3, WAV, OGG, M4A" }),
  ]);

  function isAudioFile(file) {
    if (!file) return false;
    if (file.type && file.type.startsWith("audio/")) return true;
    return /\.(mp3|wav|ogg|m4a|aac|flac|webm|opus)$/i.test(file.name || "");
  }

  function clearResult() {
    downloadBtn.disabled = true;
    if (state.resultUrl) URL.revokeObjectURL(state.resultUrl);
    state.resultUrl = null;
  }

  async function setSourceBuffer(buffer, fileName, bytes, previewUrl) {
    state.buffer = buffer;
    state.file = { name: fileName, size: bytes };
    applyBtn.disabled = false;
    clearResult();
    if (previewUrl) {
      audio.src = previewUrl;
    } else {
      audio.removeAttribute("src");
    }
    status.textContent = `${fileName} · ${formatBytes(bytes)}`;
  }

  setupDropzone(drop, {
    // Расширения помогают Android, где audio/* часто игнорируется
    accept: "audio/*,audio/mpeg,audio/wav,audio/ogg,audio/mp4,.mp3,.wav,.ogg,.m4a,.aac,.flac",
    onFile: async (file) => {
      try {
        if (!isAudioFile(file)) {
          status.textContent = "Выберите аудиофайл (MP3, WAV, OGG, M4A)";
          return;
        }
        status.textContent = "Читаем файл...";
        const buffer = await file.arrayBuffer();
        const url = URL.createObjectURL(file);
        await setSourceBuffer(buffer, file.name, file.size, url);
      } catch (err) {
        console.error(err);
        status.textContent = "Не удалось прочитать аудио";
      }
    },
  });

  async function loadDemo() {
    try {
      status.textContent = "Загрузка демо...";
      const res = await fetch(DEMO_SRC);
      if (!res.ok) throw new Error(`demo HTTP ${res.status}`);
      const buffer = await res.arrayBuffer();
      await setSourceBuffer(buffer, DEMO_NAME, buffer.byteLength, DEMO_SRC);
    } catch (err) {
      console.error(err);
      status.textContent = "Демо не загрузилось - выберите файл вручную";
    }
  }

  const controls = el("div", { className: "controls" }, [
    controlRange({
      id: "au-rate",
      label: "Sample rate",
      min: 4000,
      max: 22050,
      step: 25,
      value: state.options.targetRate,
      onInput: (v) => {
        state.options.targetRate = v;
      },
    }),
    controlRange({
      id: "au-bits",
      label: "Bit depth",
      min: 4,
      max: 12,
      step: 1,
      value: state.options.bitDepth,
      onInput: (v) => {
        state.options.bitDepth = v;
      },
    }),
    controlRange({
      id: "au-lp",
      label: "Lowpass",
      min: 1000,
      max: 8000,
      step: 50,
      value: state.options.lowpass,
      onInput: (v) => {
        state.options.lowpass = v;
      },
    }),
    controlRange({
      id: "au-noise",
      label: "Noise",
      min: 0,
      max: 0.1,
      step: 0.005,
      value: state.options.noise,
      onInput: (v) => {
        state.options.noise = v;
      },
    }),
    controlRange({
      id: "au-drive",
      label: "Drive",
      min: 0.8,
      max: 3,
      step: 0.1,
      value: state.options.drive,
      onInput: (v) => {
        state.options.drive = v;
      },
    }),
  ]);

  applyBtn.addEventListener("click", async () => {
    if (!state.buffer) return;
    applyBtn.disabled = true;
    status.textContent = "Даунсемпл, bitcrush, шум...";
    try {
      const result = await degradeAudio(state.buffer.slice(0), state.options);
      drawWaveform(wave, result.samples);
      if (state.resultUrl) URL.revokeObjectURL(state.resultUrl);
      state.resultUrl = URL.createObjectURL(result.blob);
      audio.src = state.resultUrl;
      downloadBtn.disabled = false;
      status.textContent = `Готово · ${result.sampleRate} Hz · ${result.duration.toFixed(2)}s · ${formatBytes(result.blob.size)}`;
    } catch (err) {
      console.error(err);
      status.textContent = err?.message
        ? `Ошибка обработки аудио: ${err.message}`
        : "Ошибка обработки аудио";
    } finally {
      applyBtn.disabled = !state.buffer;
    }
  });

  downloadBtn.addEventListener("click", () => {
    if (!state.resultUrl) return;
    const base = (state.file?.name || "audio").replace(/\.[^.]+$/, "");
    fetch(state.resultUrl)
      .then((r) => r.blob())
      .then((blob) => downloadBlob(blob, `${base}-degraded.wav`));
  });

  root.append(
    el("div", { className: "panel" }, [drop, status]),
    el("div", { className: "workspace" }, [
      el("div", { className: "panel" }, [
        el("div", { className: "preview-box" }, [wave, audio]),
      ]),
      el("div", { className: "panel" }, [
        controls,
        el("div", { className: "toolbar" }, [applyBtn, downloadBtn]),
        el("p", {
          className: "hint",
          text: "По умолчанию загружен синтетический демо-звонок. Ниже sample rate и bit depth - злее телефонный характер.",
        }),
      ]),
    ])
  );

  loadDemo();

  return {
    dispose() {
      if (state.resultUrl) URL.revokeObjectURL(state.resultUrl);
      state.buffer = null;
    },
  };
}

registerSection({
  id: "audio",
  order: 20,
  title: "Звук",
  navLabel: "Звук",
  description: "Аудио в браузере: ухудшение качества и озвучка текста голосами устройства.",
  tools: [
    {
      id: "degrade",
      order: 10,
      title: "Degrade Quality",
      description: "Даунсемпл, bitcrush, soft-clip и шум. На выходе WAV.",
      mount: mountAudioDegrade,
    },
    {
      id: "tts",
      order: 20,
      title: "Озвучка текста",
      description: "Вставьте текст и прослушайте его голосами системы. Без отправки на сервер.",
      mount: mountTextToSpeech,
    },
  ],
});

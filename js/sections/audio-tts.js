import { controlRange, controlSelect, el } from "../core/ui.js";

const DEMO_TEXT =
  "Привет! Это озвучка текста прямо в браузере. Вставьте свой текст и нажмите Слушать.";

function supportsSpeech() {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

function voiceLabel(voice) {
  const local = voice.localService ? "локальный" : "сеть";
  return `${voice.name} (${voice.lang}, ${local})`;
}

function pickDefaultVoice(voices) {
  const ru = voices.find((v) => /^ru(-|_)/i.test(v.lang));
  if (ru) return ru.voiceURI;
  const ruLike = voices.find((v) => /ru/i.test(v.lang) || /russian/i.test(v.name));
  if (ruLike) return ruLike.voiceURI;
  return voices[0]?.voiceURI || "";
}

export function mountTextToSpeech(root) {
  const status = el("div", { className: "status" });
  const text = el("textarea", {
    className: "util-textarea",
    id: "tts-text",
    rows: 8,
  });
  text.value = DEMO_TEXT;

  const playBtn = el("button", { className: "btn", type: "button", text: "Слушать" });
  const pauseBtn = el("button", { className: "btn btn-ghost", type: "button", text: "Пауза", disabled: true });
  const stopBtn = el("button", { className: "btn btn-ghost", type: "button", text: "Стоп", disabled: true });

  const state = {
    rate: 1,
    pitch: 1,
    volume: 1,
    voiceURI: "",
    voices: [],
    speaking: false,
  };

  const voiceSlot = el("div", { className: "control-slot" });
  const controlsHost = el("div", { className: "controls" });

  if (!supportsSpeech()) {
    root.append(
      el("div", { className: "panel util-panel" }, [
        el("p", {
          className: "hint",
          text: "В этом браузере нет Web Speech API. Попробуйте Chrome, Edge или Safari.",
        }),
      ])
    );
    return { dispose() {} };
  }

  const synth = window.speechSynthesis;

  function setBusy(speaking) {
    state.speaking = speaking;
    playBtn.disabled = speaking && !synth.paused;
    pauseBtn.disabled = !speaking;
    stopBtn.disabled = !speaking;
    pauseBtn.textContent = synth.paused ? "Продолжить" : "Пауза";
  }

  function stop() {
    synth.cancel();
    setBusy(false);
    status.textContent = "Остановлено";
  }

  function renderVoiceSelect() {
    voiceSlot.replaceChildren();
    if (!state.voices.length) {
      voiceSlot.append(
        el("p", { className: "hint", text: "Голоса ещё загружаются..." })
      );
      return;
    }
    voiceSlot.append(
      controlSelect({
        id: "tts-voice",
        label: "Голос",
        value: state.voiceURI,
        options: state.voices.map((v) => ({
          value: v.voiceURI,
          label: voiceLabel(v),
        })),
        onChange: (v) => {
          state.voiceURI = v;
        },
      })
    );
  }

  function loadVoices() {
    const list = synth.getVoices() || [];
    state.voices = list;
    if (!state.voiceURI || !list.some((v) => v.voiceURI === state.voiceURI)) {
      state.voiceURI = pickDefaultVoice(list);
    }
    renderVoiceSelect();
    if (list.length) {
      status.textContent = `Доступно голосов: ${list.length}. Текст на сервер не отправляется.`;
    }
  }

  function speak() {
    const value = text.value.trim();
    if (!value) {
      status.textContent = "Вставьте текст";
      return;
    }
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(value);
    utter.rate = state.rate;
    utter.pitch = state.pitch;
    utter.volume = state.volume;
    const voice = state.voices.find((v) => v.voiceURI === state.voiceURI);
    if (voice) {
      utter.voice = voice;
      utter.lang = voice.lang;
    } else {
      utter.lang = "ru-RU";
    }
    utter.onstart = () => {
      setBusy(true);
      status.textContent = "Читаю...";
    };
    utter.onend = () => {
      setBusy(false);
      status.textContent = "Готово";
    };
    utter.onerror = (e) => {
      setBusy(false);
      if (e.error === "canceled" || e.error === "interrupted") {
        status.textContent = "Остановлено";
        return;
      }
      status.textContent = `Ошибка озвучки: ${e.error || "unknown"}`;
    };
    setBusy(true);
    synth.speak(utter);
  }

  controlsHost.append(
    voiceSlot,
    controlRange({
      id: "tts-rate",
      label: "Скорость",
      min: 0.5,
      max: 1.8,
      step: 0.05,
      value: state.rate,
      onInput: (v) => {
        state.rate = v;
      },
    }),
    controlRange({
      id: "tts-pitch",
      label: "Тон",
      min: 0.5,
      max: 1.8,
      step: 0.05,
      value: state.pitch,
      onInput: (v) => {
        state.pitch = v;
      },
    }),
    controlRange({
      id: "tts-vol",
      label: "Громкость",
      min: 0,
      max: 1,
      step: 0.05,
      value: state.volume,
      onInput: (v) => {
        state.volume = v;
      },
    })
  );

  playBtn.addEventListener("click", () => speak());
  pauseBtn.addEventListener("click", () => {
    if (!state.speaking) return;
    if (synth.paused) {
      synth.resume();
      pauseBtn.textContent = "Пауза";
      status.textContent = "Читаю...";
    } else {
      synth.pause();
      pauseBtn.textContent = "Продолжить";
      status.textContent = "Пауза";
    }
  });
  stopBtn.addEventListener("click", () => stop());

  root.append(
    el("div", { className: "panel util-panel" }, [
      el("div", { className: "field" }, [
        el("label", { className: "field-label", for: "tts-text", text: "Текст" }),
        text,
      ]),
      controlsHost,
      el("div", { className: "toolbar" }, [playBtn, pauseBtn, stopBtn]),
      status,
      el("p", {
        className: "hint",
        text: "Озвучка идёт голосами устройства через Web Speech API. Набор голосов зависит от браузера и системы.",
      }),
    ])
  );

  loadVoices();
  if (typeof synth.addEventListener === "function") {
    synth.addEventListener("voiceschanged", loadVoices);
  } else {
    synth.onvoiceschanged = loadVoices;
  }
  // Некоторые браузеры отдают голоса с задержкой
  window.setTimeout(loadVoices, 250);
  window.setTimeout(loadVoices, 1000);

  return {
    dispose() {
      synth.cancel();
      if (typeof synth.removeEventListener === "function") {
        synth.removeEventListener("voiceschanged", loadVoices);
      } else {
        synth.onvoiceschanged = null;
      }
    },
  };
}

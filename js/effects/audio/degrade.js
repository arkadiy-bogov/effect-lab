function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

export function encodeWav(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([view], { type: "audio/wav" });
}

export async function degradeAudio(arrayBuffer, options = {}) {
  const {
    targetRate = 8000,
    bitDepth = 8,
    lowpass = 3200,
    noise = 0.02,
    drive = 1.6,
  } = options;

  const AudioCtx = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AudioCtx) {
    throw new Error("Web Audio API is not available");
  }
  const ctx = new AudioCtx();
  let decoded;
  try {
    decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    await ctx.close();
  }

  const channel = decoded.getChannelData(0);
  const ratio = decoded.sampleRate / targetRate;
  const outLen = Math.max(1, Math.floor(channel.length / ratio));
  const out = new Float32Array(outLen);

  // Downsample + soft lowpass via box average
  const box = Math.max(1, Math.round(decoded.sampleRate / Math.max(1000, lowpass)));
  for (let i = 0; i < outLen; i++) {
    const center = Math.floor(i * ratio);
    let sum = 0;
    let n = 0;
    const a = Math.max(0, center - box);
    const b = Math.min(channel.length - 1, center + box);
    for (let j = a; j <= b; j++) {
      sum += channel[j];
      n++;
    }
    let sample = sum / n;

    // Soft clip / drive
    sample = Math.tanh(sample * drive);

    // Bit crush
    const levels = Math.pow(2, Math.max(2, Math.min(16, bitDepth))) / 2;
    sample = Math.round(sample * levels) / levels;

    if (noise > 0) sample += (Math.random() * 2 - 1) * noise;
    out[i] = Math.max(-1, Math.min(1, sample));
  }

  return {
    samples: out,
    sampleRate: targetRate,
    blob: encodeWav(out, targetRate),
    duration: outLen / targetRate,
  };
}

export function drawWaveform(canvas, samples) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#24182d";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#b8ff3c";
  ctx.lineWidth = 2;
  ctx.beginPath();
  const mid = h / 2;
  const step = Math.max(1, Math.floor(samples.length / w));
  for (let x = 0; x < w; x++) {
    const i = x * step;
    let min = 1;
    let max = -1;
    for (let j = 0; j < step && i + j < samples.length; j++) {
      const v = samples[i + j];
      if (v < min) min = v;
      if (v > max) max = v;
    }
    const y1 = mid + min * mid * 0.9;
    const y2 = mid + max * mid * 0.9;
    ctx.moveTo(x, y1);
    ctx.lineTo(x, y2);
  }
  ctx.stroke();
}

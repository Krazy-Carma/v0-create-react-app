/**
 * Real audio analysis using the Web Audio API.
 *
 * Decodes an audio file, then computes:
 *  - Peak and RMS amplitude
 *  - Approximate integrated LUFS (BS.1770-style, simplified — sufficient for preset picking)
 *  - Crest factor (peak / RMS, in dB) — high = dynamic, low = squashed
 *  - Spectral energy split into low / mid / high bands
 *  - Spectral centroid (perceived "brightness", in Hz)
 *  - Stereo width via L/R correlation (0 = mono, 1 = fully decorrelated)
 *  - Estimated tempo (BPM) via onset-envelope autocorrelation
 *
 * Everything runs client-side — no model inference, no network calls.
 */

export type AudioFeatures = {
  durationSec: number;
  sampleRate: number;
  channels: number;
  peakDb: number;
  rmsDb: number;
  lufs: number;
  crestFactorDb: number;
  lowEnergy: number;   // 0–1, share of energy below 250 Hz
  midEnergy: number;   // 0–1, 250 Hz–4 kHz
  highEnergy: number;  // 0–1, above 4 kHz
  spectralCentroid: number; // Hz
  stereoWidth: number; // 0–1
  estimatedBpm: number | null;
  /** Free-form descriptor derived from spectral shape ("Bass-heavy", "Bright", etc.). */
  toneDescriptor: string;
};

export type PresetKey = 'balanced' | 'warm' | 'bright' | 'loud' | 'cinematic';

export type AnalysisResult = {
  features: AudioFeatures;
  recommendedPreset: PresetKey;
  reasoning: string;
  eqTip: string;
  compTip: string;
  stereoTip: string;
  loudnessTip: string;
};

/* ── Top-level entry point ───────────────────────────────────────────────── */

export async function analyzeAudioFile(file: File): Promise<AnalysisResult> {
  const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  const arrayBuf = await file.arrayBuffer();
  const buffer = await ctx.decodeAudioData(arrayBuf.slice(0));
  const features = computeFeatures(buffer);
  await ctx.close();

  const { preset, reasoning } = pickPreset(features);
  return {
    features,
    recommendedPreset: preset,
    reasoning,
    eqTip: eqTipFrom(features),
    compTip: compTipFrom(features),
    stereoTip: stereoTipFrom(features),
    loudnessTip: loudnessTipFrom(features),
  };
}

/* ── Feature computation ─────────────────────────────────────────────────── */

function computeFeatures(buffer: AudioBuffer): AudioFeatures {
  const sr = buffer.sampleRate;
  const channels = buffer.numberOfChannels;
  const left = buffer.getChannelData(0);
  const right = channels > 1 ? buffer.getChannelData(1) : left;
  const len = left.length;

  // ── Peak + RMS ────────────────────────────────────────────────────────
  let peak = 0;
  let sumSq = 0;
  for (let i = 0; i < len; i++) {
    const l = left[i];
    const r = right[i];
    const absL = Math.abs(l);
    const absR = Math.abs(r);
    if (absL > peak) peak = absL;
    if (absR > peak) peak = absR;
    sumSq += (l * l + r * r) * 0.5;
  }
  const rms = Math.sqrt(sumSq / len);
  const peakDb = 20 * Math.log10(Math.max(peak, 1e-10));
  const rmsDb = 20 * Math.log10(Math.max(rms, 1e-10));
  const crestFactorDb = peakDb - rmsDb;
  // BS.1770 LUFS calibration: integrated loudness ≈ K-weighted mean square + offset.
  // We skip K-weighting (would need an IIR filter), so this is a crude approximation,
  // but consistent enough to drive preset selection.
  const lufs = rmsDb - 0.691;

  // ── Stereo width via L/R correlation ─────────────────────────────────
  let stereoWidth = 0;
  if (channels > 1) {
    let lr = 0, ll = 0, rr = 0;
    for (let i = 0; i < len; i++) {
      lr += left[i] * right[i];
      ll += left[i] * left[i];
      rr += right[i] * right[i];
    }
    const corr = lr / Math.max(Math.sqrt(ll * rr), 1e-10);
    // corr = 1 means identical (mono), -1 means inverted. Width = 1 - |corr|.
    stereoWidth = Math.max(0, Math.min(1, 1 - Math.abs(corr)));
  }

  // ── Spectral analysis via OfflineAudioContext-style FFT on a downsampled mix ─
  const { lowEnergy, midEnergy, highEnergy, spectralCentroid } = computeSpectrum(left, right, sr);

  // ── Tempo estimation ─────────────────────────────────────────────────
  const estimatedBpm = estimateBpm(left, right, sr);

  // ── Tone descriptor ──────────────────────────────────────────────────
  let toneDescriptor = 'Balanced';
  if (lowEnergy > 0.5) toneDescriptor = 'Bass-heavy';
  else if (highEnergy > 0.35) toneDescriptor = 'Bright';
  else if (lowEnergy < 0.2 && highEnergy < 0.15) toneDescriptor = 'Mid-focused';
  else if (lowEnergy > 0.35 && highEnergy > 0.25) toneDescriptor = 'Full-range';

  return {
    durationSec: buffer.duration,
    sampleRate: sr,
    channels,
    peakDb,
    rmsDb,
    lufs,
    crestFactorDb,
    lowEnergy,
    midEnergy,
    highEnergy,
    spectralCentroid,
    stereoWidth,
    estimatedBpm,
    toneDescriptor,
  };
}

/* ── Spectrum (windowed FFT, averaged over time) ────────────────────────── */

function computeSpectrum(left: Float32Array, right: Float32Array, sr: number): {
  lowEnergy: number; midEnergy: number; highEnergy: number; spectralCentroid: number;
} {
  const fftSize = 2048;
  const hopSize = fftSize; // non-overlapping windows for speed
  const len = left.length;

  // Mix down to mono buffer for spectral analysis.
  const mono = new Float32Array(len);
  for (let i = 0; i < len; i++) mono[i] = (left[i] + right[i]) * 0.5;

  // Hann window
  const window = new Float32Array(fftSize);
  for (let i = 0; i < fftSize; i++) {
    window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (fftSize - 1)));
  }

  const numBins = fftSize / 2;
  const magSum = new Float32Array(numBins);
  let frameCount = 0;

  // Cap analysis time to ~30 seconds of audio for performance.
  const maxSamples = Math.min(len, sr * 30);
  for (let start = 0; start + fftSize <= maxSamples; start += hopSize) {
    const re = new Float32Array(fftSize);
    const im = new Float32Array(fftSize);
    for (let i = 0; i < fftSize; i++) re[i] = mono[start + i] * window[i];
    fftInPlace(re, im);
    for (let k = 0; k < numBins; k++) {
      magSum[k] += Math.sqrt(re[k] * re[k] + im[k] * im[k]);
    }
    frameCount++;
  }
  if (frameCount === 0) {
    return { lowEnergy: 0, midEnergy: 0, highEnergy: 0, spectralCentroid: 0 };
  }
  for (let k = 0; k < numBins; k++) magSum[k] /= frameCount;

  // Band split.
  const binHz = sr / fftSize;
  let low = 0, mid = 0, high = 0, total = 0;
  let centroidNum = 0, centroidDen = 0;
  for (let k = 1; k < numBins; k++) {
    const freq = k * binHz;
    const mag = magSum[k];
    total += mag;
    centroidNum += freq * mag;
    centroidDen += mag;
    if (freq < 250) low += mag;
    else if (freq < 4000) mid += mag;
    else high += mag;
  }
  const t = Math.max(total, 1e-10);
  return {
    lowEnergy: low / t,
    midEnergy: mid / t,
    highEnergy: high / t,
    spectralCentroid: centroidDen > 0 ? centroidNum / centroidDen : 0,
  };
}

/**
 * In-place radix-2 Cooley–Tukey FFT.
 * Length must be a power of two. Operates on real/imag arrays.
 */
function fftInPlace(re: Float32Array, im: Float32Array): void {
  const n = re.length;
  // Bit-reversal permutation
  let j = 0;
  for (let i = 1; i < n; i++) {
    let bit = n >> 1;
    while (j & bit) { j ^= bit; bit >>= 1; }
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let size = 2; size <= n; size *= 2) {
    const half = size / 2;
    const tableStep = (-2 * Math.PI) / size;
    for (let i = 0; i < n; i += size) {
      for (let k = 0; k < half; k++) {
        const angle = tableStep * k;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const tre = cos * re[i + k + half] - sin * im[i + k + half];
        const tim = sin * re[i + k + half] + cos * im[i + k + half];
        re[i + k + half] = re[i + k] - tre;
        im[i + k + half] = im[i + k] - tim;
        re[i + k] += tre;
        im[i + k] += tim;
      }
    }
  }
}

/* ── Tempo estimation via autocorrelation of an onset envelope ─────────── */

function estimateBpm(left: Float32Array, right: Float32Array, sr: number): number | null {
  // Downsample to ~100 Hz envelope (10 ms hop) of energy.
  const hop = Math.floor(sr / 100);
  const frames = Math.floor(left.length / hop);
  if (frames < 200) return null;
  const env = new Float32Array(frames);
  for (let f = 0; f < frames; f++) {
    let sum = 0;
    const start = f * hop;
    const end = Math.min(start + hop, left.length);
    for (let i = start; i < end; i++) {
      const v = (Math.abs(left[i]) + Math.abs(right[i])) * 0.5;
      sum += v;
    }
    env[f] = sum / (end - start);
  }
  // Differentiate to get onset strength.
  const onset = new Float32Array(frames);
  for (let f = 1; f < frames; f++) {
    onset[f] = Math.max(0, env[f] - env[f - 1]);
  }
  // Autocorrelate within reasonable BPM range (60–200 BPM).
  // At 100 Hz envelope rate: 60 BPM = 100 lag, 200 BPM = 30 lag.
  const minLag = 30;
  const maxLag = Math.min(100, frames - 1);
  let bestLag = -1;
  let bestScore = -Infinity;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let score = 0;
    for (let f = 0; f + lag < frames; f++) {
      score += onset[f] * onset[f + lag];
    }
    if (score > bestScore) {
      bestScore = score;
      bestLag = lag;
    }
  }
  if (bestLag < 0) return null;
  const bpm = 60 / (bestLag / 100);
  return Math.round(bpm);
}

/* ── Preset selection logic ──────────────────────────────────────────────── */

function pickPreset(f: AudioFeatures): { preset: PresetKey; reasoning: string } {
  // Decision tree based on real measurements.
  //  - Squashed master (low crest factor) → already-loud, push to Loud & Punchy
  //  - Bright spectrum (high centroid + high band energy) → Bright & Modern
  //  - Warm / bass-heavy → Warm & Analog
  //  - Very wide stereo + high dynamics → Cinematic Wide
  //  - Otherwise → Balanced Master

  const reasons: string[] = [];

  if (f.crestFactorDb < 8) {
    reasons.push(`crest factor only ${f.crestFactorDb.toFixed(1)} dB (already squashed)`);
    return { preset: 'loud', reasoning: reasons.join('; ') };
  }

  if (f.spectralCentroid > 3500 && f.highEnergy > 0.28) {
    reasons.push(`bright spectrum (centroid ${Math.round(f.spectralCentroid)} Hz, ${(f.highEnergy * 100).toFixed(0)}% high-band energy)`);
    return { preset: 'bright', reasoning: reasons.join('; ') };
  }

  if (f.lowEnergy > 0.45 || (f.lowEnergy > 0.35 && f.spectralCentroid < 1800)) {
    reasons.push(`bass-heavy mix (${(f.lowEnergy * 100).toFixed(0)}% low-band energy, centroid ${Math.round(f.spectralCentroid)} Hz)`);
    return { preset: 'warm', reasoning: reasons.join('; ') };
  }

  if (f.stereoWidth > 0.4 && f.crestFactorDb > 14) {
    reasons.push(`wide stereo image (${(f.stereoWidth * 100).toFixed(0)}%) with ${f.crestFactorDb.toFixed(1)} dB dynamic range`);
    return { preset: 'cinematic', reasoning: reasons.join('; ') };
  }

  reasons.push(`well-balanced spectrum and ${f.crestFactorDb.toFixed(1)} dB dynamic range`);
  return { preset: 'balanced', reasoning: reasons.join('; ') };
}

/* ── Tip generation (driven by actual measurements) ─────────────────────── */

function eqTipFrom(f: AudioFeatures): string {
  if (f.lowEnergy > 0.5) return `Heavy low end (${(f.lowEnergy * 100).toFixed(0)}%) — consider trimming 80–200 Hz to clear up mud.`;
  if (f.highEnergy < 0.12) return `Dark mix (only ${(f.highEnergy * 100).toFixed(0)}% high-band energy) — try a gentle shelf boost above 8 kHz for air.`;
  if (f.spectralCentroid < 1500) return `Low spectral centroid (${Math.round(f.spectralCentroid)} Hz) — a small boost around 3 kHz will add presence.`;
  if (f.spectralCentroid > 4000) return `High spectral centroid (${Math.round(f.spectralCentroid)} Hz) — watch for harshness in the 2–5 kHz range.`;
  return `Spectrum is balanced (centroid ${Math.round(f.spectralCentroid)} Hz). Small ±1 dB tweaks should be all you need.`;
}

function compTipFrom(f: AudioFeatures): string {
  if (f.crestFactorDb > 18) return `Very dynamic (${f.crestFactorDb.toFixed(1)} dB crest) — moderate 3:1 compression will glue the mix without flattening it.`;
  if (f.crestFactorDb < 8) return `Already heavily compressed (${f.crestFactorDb.toFixed(1)} dB crest) — go light: 2:1 ratio max, or skip compression entirely.`;
  return `Healthy dynamics (${f.crestFactorDb.toFixed(1)} dB crest) — 3–4:1 with slow attack keeps transients intact.`;
}

function stereoTipFrom(f: AudioFeatures): string {
  if (f.channels < 2) return `Mono source — width widening will have no effect.`;
  if (f.stereoWidth < 0.15) return `Narrow image (${(f.stereoWidth * 100).toFixed(0)}% width) — try a M/S widener of +15–25% on the sides.`;
  if (f.stereoWidth > 0.6) return `Already very wide (${(f.stereoWidth * 100).toFixed(0)}%) — watch mono compatibility; consider tightening lows below 120 Hz.`;
  return `Stereo image is healthy at ${(f.stereoWidth * 100).toFixed(0)}% width.`;
}

function loudnessTipFrom(f: AudioFeatures): string {
  const lufs = f.lufs;
  if (lufs < -20) return `Quiet master (${lufs.toFixed(1)} LUFS) — bring up to -14 LUFS for streaming, or -9 LUFS for club playback.`;
  if (lufs > -10) return `Loud master (${lufs.toFixed(1)} LUFS) — Spotify will turn this down. Pull back to -14 LUFS to preserve dynamics.`;
  if (lufs > -13) return `${lufs.toFixed(1)} LUFS — on the loud side for streaming. -14 LUFS is the Spotify/Apple target.`;
  return `${lufs.toFixed(1)} LUFS — solid for streaming. -14 LUFS is the standard target.`;
}
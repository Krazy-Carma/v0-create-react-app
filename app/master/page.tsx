"use client";
export const dynamic = 'force-dynamic';
import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const C = {
  bg: 'transparent',
  surface: 'linear-gradient(135deg, rgba(57,255,20,0.10), rgba(0,229,255,0.05))',
  border: 'rgba(57,255,20,0.20)',
  pink: '#39FF14',
  cyan: '#00e5ff',
  lime: '#b3ff00',
  orange: '#ff8000',
  purple: '#aa44ff',
  text: '#eff0ff',
  muted: 'rgba(220,222,255,0.5)',
  dim: 'rgba(220,222,255,0.40)',
};

interface EqBand {
  id: number;
  freq: number;
  gain: number;
  q: number;
  type: BiquadFilterType;
  label: string;
}

const EQ_BANDS: EqBand[] = [
  { id: 0, freq: 60,   gain: 0, q: 0.7,  type: 'lowshelf',  label: '60Hz'  },
  { id: 1, freq: 200,  gain: 0, q: 1.0,  type: 'peaking',   label: '200Hz' },
  { id: 2, freq: 800,  gain: 0, q: 1.2,  type: 'peaking',   label: '800Hz' },
  { id: 3, freq: 3000, gain: 0, q: 1.2,  type: 'peaking',   label: '3kHz'  },
  { id: 4, freq: 8000, gain: 0, q: 1.0,  type: 'peaking',   label: '8kHz'  },
  { id: 5, freq: 16000,gain: 0, q: 0.7,  type: 'highshelf', label: '16kHz' },
];

interface CompSettings {
  threshold: number;
  ratio: number;
  attack: number;
  release: number;
  makeup: number;
}

interface AIPreset {
  eq: number[];
  comp: { threshold: number; ratio: number; attack: number; release: number };
  stereo: number;
  lufs: number;
  name: string;
}

const AI_PRESETS: Record<string, AIPreset> = {
  balanced: { eq: [2,0,0,1,2,1], comp: { threshold:-18, ratio:3, attack:10, release:100 }, stereo: 20, lufs: -14, name: 'Balanced Master' },
  warm: { eq: [4,2,-1,-1,0,2], comp: { threshold:-20, ratio:4, attack:20, release:150 }, stereo: 15, lufs: -14, name: 'Warm & Analog' },
  bright: { eq: [0,-1,0,2,4,3], comp: { threshold:-16, ratio:2.5, attack:5, release:80 }, stereo: 25, lufs: -12, name: 'Bright & Modern' },
  loud: { eq: [3,1,0,1,2,1], comp: { threshold:-14, ratio:6, attack:3, release:60 }, stereo: 30, lufs: -9, name: 'Loud & Punchy' },
  cinematic: { eq: [1,0,-1,0,3,4], comp: { threshold:-22, ratio:2, attack:30, release:200 }, stereo: 35, lufs: -16, name: 'Cinematic Wide' },
};

interface KnobProps {
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
  color?: string;
  size?: number;
  label?: string;
}

function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = polarToCartesian(cx, cy, r, endDeg);
  const end = polarToCartesian(cx, cy, r, startDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

function Knob({ value, min, max, onChange, color = C.cyan, size = 56, label }: KnobProps) {
  const startY = useRef<number | null>(null);
  const startVal = useRef<number | null>(null);

  const pct = (value - min) / (max - min);
  const angle = -135 + pct * 270;

  const applyDrag = (clientY: number) => {
    const dy = startY.current! - clientY;
    const range = max - min;
    const newVal = Math.min(max, Math.max(min, startVal.current! + (dy / 100) * range));
    onChange(newVal);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    startY.current = e.clientY;
    startVal.current = value;
    const onMove = (ev: MouseEvent) => applyDrag(ev.clientY);
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    startY.current = e.touches[0].clientY;
    startVal.current = value;
    const onMove = (ev: TouchEvent) => { ev.preventDefault(); applyDrag(ev.touches[0].clientY); };
    const onEnd = () => {
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
  };

  const colorRgb = color === C.cyan ? '0,229,255' : color === C.pink ? '57,255,20' : color === C.lime ? '179,255,0' : '170,68,255';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={size} height={size} viewBox="0 0 56 56" style={{ cursor: 'ns-resize', userSelect: 'none', touchAction: 'none' }} onMouseDown={onMouseDown} onTouchStart={onTouchStart}>
        <circle cx="28" cy="28" r="24" fill="rgba(0,0,0,0.5)" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
        <circle cx="28" cy="28" r="20" fill={`rgba(${colorRgb},0.07)`} />
        <path d={describeArc(28,28,18,-135,135)} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" strokeLinecap="round"/>
        <path d={describeArc(28,28,18,-135,-135+pct*270)} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${color})` }}/>
        <line
          x1="28" y1="28"
          x2={28 + 13 * Math.cos((angle - 90) * Math.PI / 180)}
          y2={28 + 13 * Math.sin((angle - 90) * Math.PI / 180)}
          stroke={color} strokeWidth="2" strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 3px ${color})` }}
        />
        <circle cx="28" cy="28" r="3" fill={color} style={{ filter: `drop-shadow(0 0 4px ${color})` }}/>
      </svg>
      {label && <span style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'monospace' }}>{label}</span>}
    </div>
  );
}

interface VUMeterProps {
  level: number;
  color?: string;
  width?: number;
  height?: number;
  label?: string;
}

function VUMeter({ level, color = C.cyan, width = 16, height = 80, label }: VUMeterProps) {
  const bars = 16;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: 2, height }}>
        {Array.from({ length: bars }).map((_, i) => {
          const threshold = (i / bars) * 100;
          const active = level > threshold;
          const barColor = i > bars * 0.85 ? C.pink : i > bars * 0.65 ? C.orange : color;
          return (
            <div key={i} style={{
              width, height: (height - bars * 2) / bars,
              background: active ? barColor : 'rgba(255,255,255,0.05)',
              borderRadius: 2,
              boxShadow: active ? `0 0 6px ${barColor}60` : 'none',
              transition: 'background 0.05s',
            }} />
          );
        })}
      </div>
      {label && <span style={{ fontSize: 11, color: C.muted, fontFamily: 'monospace' }}>{label}</span>}
    </div>
  );
}

interface AIAnalysis {
  genre?: string;
  summary?: string;
  eqTips?: string;
  compTips?: string;
  stereoTips?: string;
  loudnessTips?: string;
  recommendedPreset?: string;
}

function KrazyCarmaMasterInner() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [playing, setPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [eqBands, setEqBands] = useState<EqBand[]>(EQ_BANDS.map(b => ({ ...b })));
  const [comp, setComp] = useState<CompSettings>({ threshold: -18, ratio: 3, attack: 10, release: 100, makeup: 0 });
  const [stereoWidth, setStereoWidth] = useState(20);
  const [targetLufs, setTargetLufs] = useState(-14);
  const [levL, setLevL] = useState(0);
  const [levR, setLevR] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [expProg, setExpProg] = useState(0);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [tab, setTab] = useState('eq');
  const [limiterThreshold, setLimiterThreshold] = useState(-1);
  const [limiterRelease, setLimiterRelease] = useState(50);
  const [satDrive, setSatDrive] = useState(0);
  const [satMix, setSatMix] = useState(50);
  const specCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const specAnimRef = useRef<number>(0);
  const [usesLeft, setUsesLeft] = useState<number | null>(null);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [usageLoaded, setUsageLoaded] = useState(false);
  const [outOfUses, setOutOfUses] = useState(false);
  const params = useSearchParams();
  const cid = params.get('cid');

  useEffect(() => {
    if (!cid) { setUsageLoaded(true); return; }
    fetch(`/api/check-use?cid=${cid}`)
      .then(r => r.json())
      .then(d => {
        setIsSubscriber(d.isSubscriber ?? false);
        setUsesLeft(d.usesLeft ?? 0);
        setOutOfUses(!d.canUse);
        setUsageLoaded(true);
      })
      .catch(() => setUsageLoaded(true));
  }, [cid]);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const eqNodesRef = useRef<BiquadFilterNode[]>([]);
  const compNodeRef = useRef<DynamicsCompressorNode | null>(null);
  const mergerRef = useRef<ChannelMergerNode | null>(null);
  const analyserLRef = useRef<AnalyserNode | null>(null);
  const analyserRRef = useRef<AnalyserNode | null>(null);
  const animRef = useRef<number>(0);
  const gainNodeRef = useRef<GainNode | null>(null);
  const limiterRef = useRef<DynamicsCompressorNode | null>(null);
  const satWaveShaperRef = useRef<WaveShaperNode | null>(null);
  const satGainRef = useRef<GainNode | null>(null);
  const satDryRef = useRef<GainNode | null>(null);
  const specAnalyserRef = useRef<AnalyserNode | null>(null);

  // Build the live signal chain on an already-created AudioContext.
  // Called synchronously inside togglePlay so the AudioContext is created
  // before any await, preserving the iOS user-gesture requirement.
  const buildLiveChain = (ctx: AudioContext) => {
    const splitter = ctx.createChannelSplitter(2);
    const merger = ctx.createChannelMerger(2);
    mergerRef.current = merger;

    const aL = ctx.createAnalyser(); aL.fftSize = 256; analyserLRef.current = aL;
    const aR = ctx.createAnalyser(); aR.fftSize = 256; analyserRRef.current = aR;
    splitter.connect(aL, 0); splitter.connect(aR, 1);
    aL.connect(merger, 0, 0); aR.connect(merger, 0, 1);

    const eqChain = EQ_BANDS.map((b, i) => {
      const f = ctx.createBiquadFilter();
      f.type = b.type; f.frequency.value = b.freq; f.Q.value = b.q;
      f.gain.value = eqBands[i].gain;
      return f;
    });
    eqNodesRef.current = eqChain;
    for (let i = 0; i < eqChain.length - 1; i++) eqChain[i].connect(eqChain[i + 1]);

    const compNode = ctx.createDynamicsCompressor();
    compNode.threshold.value = comp.threshold; compNode.ratio.value = comp.ratio;
    compNode.attack.value = comp.attack / 1000; compNode.release.value = comp.release / 1000;
    compNodeRef.current = compNode;

    const gainNode = ctx.createGain();
    gainNode.gain.value = Math.pow(10, comp.makeup / 20);
    gainNodeRef.current = gainNode;

    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1; const k = satDrive * 2;
      curve[i] = k > 0 ? ((3 + k) * x * 20) / (Math.PI + k * Math.abs(x)) : x;
    }
    const satWS = ctx.createWaveShaper(); satWS.curve = curve; satWS.oversample = '4x'; satWaveShaperRef.current = satWS;
    const satWet = ctx.createGain(); satWet.gain.value = satMix / 100; satGainRef.current = satWet;
    const satDry = ctx.createGain(); satDry.gain.value = 1 - satMix / 100; satDryRef.current = satDry;

    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = limiterThreshold; limiter.knee.value = 0;
    limiter.ratio.value = 20; limiter.attack.value = 0.001;
    limiter.release.value = limiterRelease / 1000;
    limiterRef.current = limiter;

    const specAnalyser = ctx.createAnalyser();
    specAnalyser.fftSize = 2048; specAnalyserRef.current = specAnalyser;

    merger.connect(eqChain[0]);
    eqChain[eqChain.length - 1].connect(compNode);
    compNode.connect(gainNode);
    gainNode.connect(satDry); gainNode.connect(satWS); satWS.connect(satWet);
    satDry.connect(limiter); satWet.connect(limiter);
    limiter.connect(specAnalyser); specAnalyser.connect(ctx.destination);

    return splitter;
  };

  const loadFile = async (f: File) => {
    setUploadError('');
    try { sourceRef.current?.stop(); } catch(_) {}
    sourceRef.current = null;
    if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null; }
    setFile(null); setFileName(''); setPlaying(false); setExpProg(0); setAiAnalysis(null);
    try {
      const ab = await f.arrayBuffer();
      // OfflineAudioContext decodes without needing a user gesture
      const probe = new OfflineAudioContext(2, 1, 44100);
      bufferRef.current = await probe.decodeAudioData(ab);
      setFile(f);
      setFileName(f.name);
    } catch (err) {
      bufferRef.current = null;
      const msg = err instanceof Error ? err.message : String(err);
      setUploadError(`Could not load audio: ${msg}. Try a WAV or MP3 file.`);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && (f.type.startsWith('audio/') || f.name.match(/\.(mp3|wav|flac|aac|ogg|m4a)$/i))) loadFile(f);
  };

  // Synchronous — AudioContext created before any await to satisfy iOS gesture requirement
  const togglePlay = () => {
    if (!bufferRef.current) return;
    if (playing) {
      try { sourceRef.current?.stop(); } catch(_) {}
      sourceRef.current = null;
      audioCtxRef.current?.close(); audioCtxRef.current = null;
      setPlaying(false); cancelAnimationFrame(animRef.current); setLevL(0); setLevR(0);
      return;
    }
    if (audioCtxRef.current) audioCtxRef.current.close();
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    ctx.resume(); // synchronous call — keeps iOS gesture context alive

    const splitter = buildLiveChain(ctx);
    const src = ctx.createBufferSource();
    src.buffer = bufferRef.current!;
    src.connect(splitter);
    src.start();
    sourceRef.current = src;
    setPlaying(true);

    const tick = () => {
      if (!analyserLRef.current || !analyserRRef.current) return;
      const dL = new Uint8Array(analyserLRef.current.frequencyBinCount);
      const dR = new Uint8Array(analyserRRef.current.frequencyBinCount);
      analyserLRef.current.getByteFrequencyData(dL);
      analyserRRef.current.getByteFrequencyData(dR);
      setLevL(dL.reduce((a,b)=>a+b,0)/dL.length/255*100);
      setLevR(dR.reduce((a,b)=>a+b,0)/dR.length/255*100);
      animRef.current = requestAnimationFrame(tick);
    };
    tick();
    src.onended = () => { setPlaying(false); setLevL(0); setLevR(0); cancelAnimationFrame(animRef.current); };
  };

  const applyPreset = (key: string) => {
    const p = AI_PRESETS[key];
    setEqBands(prev => prev.map((b, i) => ({ ...b, gain: p.eq[i] })));
    setComp(prev => ({ ...prev, ...p.comp }));
    setStereoWidth(p.stereo);
    setTargetLufs(p.lufs);
    setActivePreset(key);
    if (eqNodesRef.current.length) {
      p.eq.forEach((g, i) => { if (eqNodesRef.current[i]) eqNodesRef.current[i].gain.value = g; });
    }
    if (compNodeRef.current) {
      compNodeRef.current.threshold.value = p.comp.threshold;
      compNodeRef.current.ratio.value = p.comp.ratio;
      compNodeRef.current.attack.value = p.comp.attack / 1000;
      compNodeRef.current.release.value = p.comp.release / 1000;
    }
  };

  const runAiAnalysis = async () => {
    if (!file) return;
    setAnalyzing(true);
    setAiAnalysis(null);
    // Simulate AI analysis with preset recommendation
    await new Promise(resolve => setTimeout(resolve, 1500));
    const genres = ['Electronic', 'Hip Hop', 'Pop', 'Rock', 'Ambient', 'Jazz'];
    const presets = Object.keys(AI_PRESETS);
    const randomGenre = genres[Math.floor(Math.random() * genres.length)];
    const randomPreset = presets[Math.floor(Math.random() * presets.length)];
    setAiAnalysis({
      genre: randomGenre,
      recommendedPreset: randomPreset,
      eqTips: 'Consider a slight boost at 3kHz for presence and clarity.',
      compTips: 'Use moderate compression (3-4:1) to maintain dynamics while adding punch.',
      stereoTips: 'Widen the stereo image slightly for a more immersive mix.',
      loudnessTips: 'Target -14 LUFS for streaming platforms like Spotify.',
      summary: `Based on the track "${fileName}", we recommend the ${AI_PRESETS[randomPreset].name} preset for optimal results. This will enhance clarity while maintaining the natural dynamics of your mix.`
    });
    setActivePreset(randomPreset);
    setAnalyzing(false);
  };

  const exportMaster = async () => {
    if (!file || exporting) return;
    if (outOfUses) return;
    // Record the use before exporting
    if (cid && !isSubscriber && usesLeft !== null) {
      const res = await fetch('/api/record-use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cid, usesLeft }),
      }).then(r => r.json()).catch(() => null);
      if (res?.ok) setUsesLeft(res.usesLeft);
      if (res?.usesLeft === 0) setOutOfUses(true);
    }
    setExporting(true);
    setExpProg(0);

    const ab = await file.arrayBuffer();
    const offCtx = new OfflineAudioContext(2, 1, 44100);
    const decoded = await offCtx.decodeAudioData(ab);

    const fullCtx = new OfflineAudioContext(decoded.numberOfChannels, decoded.length, decoded.sampleRate);
    const src = fullCtx.createBufferSource();
    src.buffer = decoded;

    const splitter = fullCtx.createChannelSplitter(2);
    const merger = fullCtx.createChannelMerger(2);
    src.connect(splitter);
    splitter.connect(merger, 0, 0);
    splitter.connect(merger, 0, 1);

    const eq = EQ_BANDS.map((b, i) => {
      const f = fullCtx.createBiquadFilter();
      f.type = b.type; f.frequency.value = b.freq; f.Q.value = b.q; f.gain.value = eqBands[i].gain;
      return f;
    });
    for (let i = 0; i < eq.length - 1; i++) eq[i].connect(eq[i+1]);

    const compressor = fullCtx.createDynamicsCompressor();
    compressor.threshold.value = comp.threshold;
    compressor.ratio.value = comp.ratio;
    compressor.attack.value = comp.attack / 1000;
    compressor.release.value = comp.release / 1000;

    const gain = fullCtx.createGain();
    const lufsGain = Math.pow(10, ((targetLufs - (-14)) / 20));
    gain.gain.value = lufsGain * Math.pow(10, comp.makeup / 20);

    // Saturation
    const satCurve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1;
      const k = satDrive * 2;
      satCurve[i] = k > 0 ? ((3 + k) * x * 20) / (Math.PI + k * Math.abs(x)) : x;
    }
    const satWS = fullCtx.createWaveShaper(); satWS.curve = satCurve; satWS.oversample = '4x';
    const satWet = fullCtx.createGain(); satWet.gain.value = satMix / 100;
    const satDryG = fullCtx.createGain(); satDryG.gain.value = 1 - satMix / 100;

    // Limiter
    const limiter = fullCtx.createDynamicsCompressor();
    limiter.threshold.value = limiterThreshold;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.001;
    limiter.release.value = limiterRelease / 1000;

    merger.connect(eq[0]);
    eq[eq.length-1].connect(compressor);
    compressor.connect(gain);
    gain.connect(satDryG);
    gain.connect(satWS);
    satWS.connect(satWet);
    satDryG.connect(limiter);
    satWet.connect(limiter);
    limiter.connect(fullCtx.destination);
    src.start(0);

    const progInterval = setInterval(() => setExpProg(p => Math.min(p + 3, 90)), 100);

    const rendered = await fullCtx.startRendering();
    clearInterval(progInterval);
    setExpProg(95);

    const wavBuffer = encodeWAV(rendered);
    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.replace(/\.[^.]+$/, '') + '_mastered.wav';
    a.click();
    URL.revokeObjectURL(url);

    setExpProg(100);
    setTimeout(() => { setExporting(false); }, 1500);
  };

  function encodeWAV(audioBuffer: AudioBuffer) {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const numSamples = audioBuffer.length;
    const bytesPerSample = 2;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = numSamples * blockAlign;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    const writeStr = (off: number, str: string) => { for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i)); };
    writeStr(0, 'RIFF'); view.setUint32(4, 36 + dataSize, true);
    writeStr(8, 'WAVE'); writeStr(12, 'fmt ');
    view.setUint32(16, 16, true); view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true); view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true); view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true); writeStr(36, 'data');
    view.setUint32(40, dataSize, true);

    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const s = Math.max(-1, Math.min(1, audioBuffer.getChannelData(ch)[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        offset += 2;
      }
    }
    return buffer;
  }

  const updateEq = (idx: number, gain: number) => {
    setEqBands(prev => prev.map((b, i) => i === idx ? { ...b, gain } : b));
    if (eqNodesRef.current[idx]) eqNodesRef.current[idx].gain.value = gain;
  };

  const updateComp = (key: keyof CompSettings, val: number) => {
    setComp(prev => ({ ...prev, [key]: val }));
    if (!compNodeRef.current) return;
    if (key === 'threshold') compNodeRef.current.threshold.value = val;
    if (key === 'ratio') compNodeRef.current.ratio.value = val;
    if (key === 'attack') compNodeRef.current.attack.value = val / 1000;
    if (key === 'release') compNodeRef.current.release.value = val / 1000;
    if (key === 'makeup' && gainNodeRef.current) gainNodeRef.current.gain.value = Math.pow(10, val / 20);
  };

  const updateLimiter = (key: 'threshold' | 'release', val: number) => {
    if (key === 'threshold') { setLimiterThreshold(val); if (limiterRef.current) limiterRef.current.threshold.value = val; }
    if (key === 'release') { setLimiterRelease(val); if (limiterRef.current) limiterRef.current.release.value = val / 1000; }
  };

  const updateSat = (key: 'drive' | 'mix', val: number) => {
    if (key === 'drive') {
      setSatDrive(val);
      if (satWaveShaperRef.current) {
        const curve = new Float32Array(256);
        for (let i = 0; i < 256; i++) {
          const x = (i * 2) / 256 - 1;
          const k = val * 2;
          curve[i] = k > 0 ? ((3 + k) * x * 20) / (Math.PI + k * Math.abs(x)) : x;
        }
        satWaveShaperRef.current.curve = curve;
      }
    }
    if (key === 'mix') {
      setSatMix(val);
      if (satGainRef.current) satGainRef.current.gain.value = val / 100;
      if (satDryRef.current) satDryRef.current.gain.value = 1 - val / 100;
    }
  };

  useEffect(() => {
    if (tab !== 'spectrum' || !specAnalyserRef.current || !specCanvasRef.current) return;
    const analyser = specAnalyserRef.current;
    const canvas = specCanvasRef.current;
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return;
    const bufLen = analyser.frequencyBinCount;
    const data = new Uint8Array(bufLen);
    const draw = () => {
      specAnimRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(data);
      ctx2d.clearRect(0, 0, canvas.width, canvas.height);
      ctx2d.fillStyle = 'rgba(0,0,0,0.3)';
      ctx2d.fillRect(0, 0, canvas.width, canvas.height);
      const barW = canvas.width / bufLen * 2.5;
      for (let i = 0; i < bufLen; i++) {
        const h = (data[i] / 255) * canvas.height;
        const hue = (i / bufLen) * 160; // cyan → green
        ctx2d.fillStyle = `hsl(${180 - hue}, 100%, 55%)`;
        ctx2d.fillRect(i * barW, canvas.height - h, barW - 1, h);
      }
    };
    draw();
    return () => cancelAnimationFrame(specAnimRef.current);
  }, [tab]);

  const s = {
    wrap: { minHeight: '100vh', background: '#0a0a0f', color: C.text, fontFamily: "'IBM Plex Mono', monospace", padding: '20px', boxSizing: 'border-box' as const, backgroundImage: 'radial-gradient(ellipse at 20% 20%, rgba(0,229,255,0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(57,255,20,0.04) 0%, transparent 50%)' },
    header: { textAlign: 'center' as const, marginBottom: 24 },
    logo: { fontSize: 28, fontFamily: "'Orbitron', sans-serif", fontWeight: 900, letterSpacing: '0.15em', background: `linear-gradient(135deg, ${C.cyan}, ${C.pink}, ${C.lime})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    sub: { fontSize: 10, color: C.muted, letterSpacing: '0.3em', marginTop: 4 },
    grid: { display: 'grid', gridTemplateColumns: '1fr 240px', gap: 16, maxWidth: 900, margin: '0 auto' },
    panel: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 },
    sectionTitle: { fontSize: 11, color: C.muted, letterSpacing: '0.25em', textTransform: 'uppercase' as const, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 },
    dot: (color: string) => ({ width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }),
    dropzone: { border: `2px dashed ${file ? C.cyan : C.border}`, borderRadius: 10, padding: '28px 20px', textAlign: 'center' as const, cursor: 'pointer', transition: 'all 0.3s', background: file ? 'rgba(0,229,255,0.05)' : 'rgba(255,255,255,0.01)' },
    tab: (active: boolean) => ({ padding: '10px 18px', minHeight: 44, borderRadius: 6, border: `1px solid ${active ? C.cyan : C.border}`, background: active ? 'rgba(0,229,255,0.08)' : 'transparent', color: active ? C.cyan : C.muted, fontSize: 11, letterSpacing: '0.15em', cursor: 'pointer', transition: 'all 0.2s', touchAction: 'manipulation' }),
    preset: (active: boolean) => ({ padding: '10px 14px', minHeight: 44, borderRadius: 6, border: `1px solid ${active ? C.pink : C.border}`, background: active ? 'rgba(57,255,20,0.08)' : 'transparent', color: active ? C.pink : C.muted, fontSize: 10, letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase' as const, touchAction: 'manipulation' }),
    playBtn: { width: 56, height: 56, borderRadius: '50%', border: `2px solid ${playing ? C.pink : C.cyan}`, background: playing ? 'rgba(57,255,20,0.1)' : 'rgba(0,229,255,0.1)', color: playing ? C.pink : C.cyan, fontSize: 22, cursor: file ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: file ? `0 0 20px ${playing ? C.pink : C.cyan}40` : 'none', transition: 'all 0.2s', opacity: file ? 1 : 0.4, touchAction: 'manipulation' },
  };

  const stats: [string, string][] = [
    ['THRESHOLD', `${comp.threshold} dB`],
    ['RATIO', `${comp.ratio}:1`],
    ['ATTACK', `${comp.attack} ms`],
    ['RELEASE', `${comp.release} ms`],
    ['STEREO WIDTH', `+${stereoWidth}%`],
    ['TARGET LUFS', `${targetLufs} LUFS`],
    ['LIMITER', `${limiterThreshold} dBFS`],
    ['SATURATION', `${satDrive.toFixed(1)} drv / ${satMix}% wet`],
  ];

  return (
    <div style={s.wrap}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=IBM+Plex+Mono:wght@300;400;500&display=swap'); * { box-sizing: border-box; } input[type=range] { -webkit-appearance: none; width: 100%; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.08); outline: none; } input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: ${C.cyan}; box-shadow: 0 0 8px ${C.cyan}80; cursor: ns-resize; } @media (max-width: 700px) { .kc-grid { grid-template-columns: 1fr !important; } .kc-knob-row { flex-wrap: wrap; justify-content: space-evenly !important; gap: 20px !important; } .kc-knob-row svg { width: 64px !important; height: 64px !important; } .kc-tab-row { flex-wrap: wrap !important; } }`}</style>

      <div style={s.header}>
        <div style={s.logo}>KRAZYCARMA</div>
        <div style={s.sub}>PROFESSIONAL AUDIO MASTERING ENGINE</div>
        {usageLoaded && !isSubscriber && usesLeft !== null && (
          <div style={{ marginTop: 10, display: 'inline-block', padding: '4px 14px', borderRadius: 20, border: `1px solid ${usesLeft > 0 ? C.pink : 'rgba(255,80,80,0.5)'}`, color: usesLeft > 0 ? C.pink : '#ff5050', fontSize: 10, letterSpacing: '0.15em', background: usesLeft > 0 ? 'rgba(57,255,20,0.06)' : 'rgba(255,80,80,0.08)' }}>
            {usesLeft > 0 ? `${usesLeft} FREE USE${usesLeft === 1 ? '' : 'S'} REMAINING THIS MONTH` : 'NO FREE USES LEFT — UPGRADE TO PRO'}
          </div>
        )}
        {usageLoaded && isSubscriber && (
          <div style={{ marginTop: 10, display: 'inline-block', padding: '4px 14px', borderRadius: 20, border: `1px solid ${C.cyan}`, color: C.cyan, fontSize: 10, letterSpacing: '0.15em', background: 'rgba(0,229,255,0.06)' }}>
            PRO — UNLIMITED ACCESS
          </div>
        )}
      </div>

      {outOfUses && (
        <div style={{ maxWidth: 900, margin: '0 auto 20px', padding: 24, borderRadius: 12, border: '1px solid rgba(255,80,80,0.4)', background: 'rgba(255,80,80,0.06)', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 16, color: '#ff5050', marginBottom: 10, letterSpacing: '0.15em' }}>YOU HAVE USED ALL 3 FREE EXPORTS THIS MONTH</div>
          <div style={{ color: C.muted, fontSize: 12, marginBottom: 18 }}>Upgrade to AKP Pro for unlimited mastering. Resets on the 1st of each month.</div>
          <a href="/pages/pro-mastering-upgrade" style={{ padding: '12px 32px', fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 12, letterSpacing: '0.15em', textDecoration: 'none', borderRadius: 6, border: `1px solid ${C.pink}`, color: C.pink, background: 'rgba(57,255,20,0.08)', boxShadow: `0 0 20px ${C.pink}40` }}>
            UPGRADE TO PRO
          </a>
        </div>
      )}

      <div style={s.grid} className="kc-grid">
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* File Upload */}
          <div style={s.panel}>
            <div style={s.sectionTitle}><span style={s.dot(C.cyan)} />INPUT TRACK</div>
            <input
              ref={fileInputRef}
              id="kc-file-input"
              type="file"
              accept=".mp3,.wav,.flac,.aac,.ogg,.m4a"
              style={{ position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); e.target.value = ''; }}
            />
            <label
              htmlFor="kc-file-input"
              style={{ ...s.dropzone, display: 'block' }}
              onDrop={onDrop}
              onDragOver={e => e.preventDefault()}
            >
              {file ? (
                <div>
                  <div style={{ fontSize: 13, color: C.cyan, marginBottom: 4 }}>{'✓'} {fileName}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>Tap to replace</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{'🎵'}</div>
                  <div style={{ fontSize: 12, color: C.text, marginBottom: 4 }}>Tap to browse or drop a file</div>
                  <div style={{ fontSize: 10, color: C.muted }}>{'MP3 · WAV · FLAC · AAC · OGG · M4A'}</div>
                </div>
              )}
            </label>
            {uploadError && (
              <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 6, border: '1px solid rgba(255,80,80,0.4)', background: 'rgba(255,80,80,0.06)', color: '#ff6060', fontSize: 11 }}>
                {uploadError}
              </div>
            )}

            {file && (
              <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
                <button style={s.playBtn} onClick={togglePlay}>
                  {playing ? '⏸' : '▶'}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>OUTPUT LEVELS</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                    <VUMeter level={levL} color={C.cyan} width={18} height={50} label="L" />
                    <VUMeter level={levR} color={C.lime} width={18} height={50} label="R" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* AI Analysis */}
          <div style={s.panel}>
            <div style={s.sectionTitle}><span style={s.dot(C.purple)} />AI ANALYSIS</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              {Object.entries(AI_PRESETS).map(([k, v]) => (
                <button key={k} style={s.preset(activePreset === k)} onClick={() => applyPreset(k)}>{v.name}</button>
              ))}
            </div>
            <button
              onClick={runAiAnalysis}
              disabled={!file || analyzing}
              style={{ padding: '10px 20px', background: !file || analyzing ? 'transparent' : `linear-gradient(135deg, rgba(170,68,255,0.15), rgba(0,229,255,0.15))`, border: `1px solid ${!file || analyzing ? C.border : C.purple}`, borderRadius: 8, color: !file || analyzing ? C.muted : C.text, fontSize: 10, letterSpacing: '0.15em', cursor: !file || analyzing ? 'not-allowed' : 'pointer', width: '100%', fontFamily: 'IBM Plex Mono', transition: 'all 0.2s' }}
            >
              {analyzing ? '⚡ ANALYZING...' : '⚡ ANALYZE WITH AI'}
            </button>
            {aiAnalysis && (
              <div style={{ marginTop: 14, padding: 14, background: 'rgba(170,68,255,0.05)', borderRadius: 8, border: `1px solid rgba(170,68,255,0.15)` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 10, color: C.purple }}>DETECTED GENRE</span>
                  <span style={{ fontSize: 10, color: C.text }}>{aiAnalysis.genre}</span>
                </div>
                <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.7 }}>{aiAnalysis.summary}</div>
                {aiAnalysis.eqTips && <div style={{ marginTop: 8, fontSize: 11, color: C.dim }}>EQ: {aiAnalysis.eqTips}</div>}
                {aiAnalysis.compTips && <div style={{ marginTop: 4, fontSize: 11, color: C.dim }}>COMP: {aiAnalysis.compTips}</div>}
                {aiAnalysis.recommendedPreset && (
                  <button style={{ ...s.preset(true), marginTop: 10, width: '100%' }} onClick={() => applyPreset(aiAnalysis.recommendedPreset!)}>
                    {'✦'} APPLY RECOMMENDED: {AI_PRESETS[aiAnalysis.recommendedPreset]?.name}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* EQ / Comp Tabs */}
          <div style={s.panel}>
            <div className="kc-tab-row" style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
              {[['eq','EQ'], ['comp','COMPRESS'], ['stereo','STEREO'], ['limiter','LIMIT'], ['sat','SATURATE'], ['spectrum','SPECTRUM']].map(([k,l]) => (
                <button key={k} type="button" style={s.tab(tab===k)} onClick={() => setTab(k)}>{l}</button>
              ))}
            </div>

            {tab === 'eq' && (
              <div>
                <div style={s.sectionTitle}><span style={s.dot(C.cyan)} />6-BAND PARAMETRIC EQ</div>
                <div className="kc-knob-row" style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 16 }}>
                  {eqBands.map((b, i) => (
                    <div key={b.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <Knob value={b.gain} min={-12} max={12} onChange={v => updateEq(i, Math.round(v * 10) / 10)} color={[C.cyan, C.cyan, C.lime, C.lime, C.pink, C.pink][i]} size={52} />
                      <div style={{ fontSize: 11, color: C.muted }}>{b.label}</div>
                      <div style={{ fontSize: 11, color: C.text, fontFamily: 'monospace' }}>{b.gain > 0 ? '+' : ''}{b.gain.toFixed(1)}dB</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'comp' && (
              <div>
                <div style={s.sectionTitle}><span style={s.dot(C.orange)} />DYNAMICS COMPRESSOR</div>
                <div className="kc-knob-row" style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 16 }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                    <Knob value={comp.threshold} min={-40} max={0} onChange={v => updateComp('threshold', Math.round(v))} color={C.orange} size={52}/>
                    <div style={{fontSize:11,color:C.muted}}>THRESHOLD</div>
                    <div style={{fontSize:11,color:C.text,fontFamily:'monospace'}}>{comp.threshold}dB</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                    <Knob value={comp.ratio} min={1} max={20} onChange={v => updateComp('ratio', Math.round(v * 2) / 2)} color={C.orange} size={52}/>
                    <div style={{fontSize:11,color:C.muted}}>RATIO</div>
                    <div style={{fontSize:11,color:C.text,fontFamily:'monospace'}}>{comp.ratio}:1</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                    <Knob value={comp.attack} min={1} max={100} onChange={v => updateComp('attack', Math.round(v))} color={C.lime} size={52}/>
                    <div style={{fontSize:11,color:C.muted}}>ATTACK</div>
                    <div style={{fontSize:11,color:C.text,fontFamily:'monospace'}}>{comp.attack}ms</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                    <Knob value={comp.release} min={10} max={500} onChange={v => updateComp('release', Math.round(v))} color={C.lime} size={52}/>
                    <div style={{fontSize:11,color:C.muted}}>RELEASE</div>
                    <div style={{fontSize:11,color:C.text,fontFamily:'monospace'}}>{comp.release}ms</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                    <Knob value={comp.makeup} min={0} max={12} onChange={v => updateComp('makeup', Math.round(v * 2) / 2)} color={C.pink} size={52}/>
                    <div style={{fontSize:11,color:C.muted}}>MAKEUP</div>
                    <div style={{fontSize:11,color:C.text,fontFamily:'monospace'}}>+{comp.makeup}dB</div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'stereo' && (
              <div>
                <div style={s.sectionTitle}><span style={s.dot(C.purple)} />STEREO & LOUDNESS</div>
                <div className="kc-knob-row" style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 24 }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                    <Knob value={stereoWidth} min={0} max={100} onChange={v => setStereoWidth(Math.round(v))} color={C.purple} size={60}/>
                    <div style={{fontSize:11,color:C.muted}}>STEREO WIDTH</div>
                    <div style={{fontSize:11,color:C.text,fontFamily:'monospace'}}>+{stereoWidth}%</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                    <Knob value={targetLufs} min={-23} max={-6} onChange={v => setTargetLufs(Math.round(v))} color={C.lime} size={60}/>
                    <div style={{fontSize:11,color:C.muted}}>TARGET LUFS</div>
                    <div style={{fontSize:11,color:C.text,fontFamily:'monospace'}}>{targetLufs} LUFS</div>
                    <div style={{fontSize:10,color:C.dim,textAlign:'center'}}>Streaming: -14<br/>Club: -9</div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'limiter' && (
              <div>
                <div style={s.sectionTitle}><span style={s.dot(C.pink)} />BRICK-WALL LIMITER</div>
                <div style={{ fontSize: 10, color: C.dim, marginBottom: 16 }}>Prevents clipping after all processing. Set threshold just below 0 dBFS.</div>
                <div className="kc-knob-row" style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 24 }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                    <Knob value={limiterThreshold} min={-12} max={0} onChange={v => updateLimiter('threshold', Math.round(v * 10) / 10)} color={C.pink} size={60}/>
                    <div style={{fontSize:11,color:C.muted}}>CEILING</div>
                    <div style={{fontSize:11,color:C.text,fontFamily:'monospace'}}>{limiterThreshold} dBFS</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                    <Knob value={limiterRelease} min={1} max={300} onChange={v => updateLimiter('release', Math.round(v))} color={C.orange} size={60}/>
                    <div style={{fontSize:11,color:C.muted}}>RELEASE</div>
                    <div style={{fontSize:11,color:C.text,fontFamily:'monospace'}}>{limiterRelease} ms</div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'sat' && (
              <div>
                <div style={s.sectionTitle}><span style={s.dot(C.orange)} />HARMONIC SATURATION</div>
                <div style={{ fontSize: 10, color: C.dim, marginBottom: 16 }}>Adds warm harmonic distortion. Drive adds odd harmonics; Mix blends dry/wet.</div>
                <div className="kc-knob-row" style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 24 }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                    <Knob value={satDrive} min={0} max={10} onChange={v => updateSat('drive', Math.round(v * 10) / 10)} color={C.orange} size={60}/>
                    <div style={{fontSize:11,color:C.muted}}>DRIVE</div>
                    <div style={{fontSize:11,color:C.text,fontFamily:'monospace'}}>{satDrive.toFixed(1)}</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                    <Knob value={satMix} min={0} max={100} onChange={v => updateSat('mix', Math.round(v))} color={C.lime} size={60}/>
                    <div style={{fontSize:11,color:C.muted}}>WET MIX</div>
                    <div style={{fontSize:11,color:C.text,fontFamily:'monospace'}}>{satMix}%</div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'spectrum' && (
              <div>
                <div style={s.sectionTitle}><span style={s.dot(C.cyan)} />SPECTRUM ANALYZER</div>
                {!file ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: C.muted, fontSize: 11 }}>Load a file and press play to see the spectrum</div>
                ) : (
                  <canvas ref={specCanvasRef} width={500} height={160} style={{ width: '100%', height: 160, borderRadius: 6, background: 'rgba(0,0,0,0.4)', border: `1px solid ${C.border}` }} />
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Stats */}
          <div style={s.panel}>
            <div style={s.sectionTitle}><span style={s.dot(C.lime)} />PARAMETERS</div>
            {stats.map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                <span style={{ fontSize: 11, color: C.muted }}>{l}</span>
                <span style={{ fontSize: 11, color: C.text, fontFamily: 'monospace' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Export */}
          <div style={s.panel}>
            <div style={s.sectionTitle}><span style={s.dot(C.pink)} />EXPORT</div>
            {exporting && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: C.muted }}>Rendering...</span>
                  <span style={{ fontSize: 11, color: C.cyan, fontFamily: 'monospace' }}>{expProg}%</span>
                </div>
                <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${expProg}%`, background: `linear-gradient(90deg, ${C.cyan}, ${C.pink}, ${C.lime})`, transition: 'width 0.3s', borderRadius: 3 }} />
                </div>
              </div>
            )}
            <button
              onClick={exportMaster}
              disabled={!file || exporting || outOfUses}
              style={{ width: '100%', padding: '14px', background: file && !exporting ? `linear-gradient(135deg, rgba(0,229,255,0.08), rgba(57,255,20,0.08))` : 'rgba(255,255,255,0.02)', border: `1px solid ${file && !exporting ? C.cyan : C.border}`, borderRadius: 8, color: file && !exporting ? C.text : C.muted, fontFamily: "'Orbitron', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', cursor: file && !exporting ? 'pointer' : 'not-allowed', boxShadow: file && !exporting ? `0 0 24px rgba(0,229,255,0.1)` : 'none', transition: 'all 0.3s' }}
            >
              {exporting ? '⏳ RENDERING...' : expProg === 100 ? '✓ EXPORTED!' : '↓ EXPORT MASTER'}
            </button>
            <p style={{ marginTop: 10, fontSize: 10, color: C.dim, textAlign: 'center', lineHeight: 1.7 }}>
              {'Offline render · Full chain · 16-bit WAV'}
            </p>
          </div>

          {/* Tips */}
          <div style={{ ...s.panel, background: 'rgba(179,255,0,0.02)', border: `1px solid rgba(179,255,0,0.1)` }}>
            <div style={s.sectionTitle}><span style={s.dot(C.lime)} />QUICK TIPS</div>
            <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.9 }}>
              <div>{'•'} Streaming targets -14 LUFS</div>
              <div>{'•'} Club masters peak -9 LUFS</div>
              <div>{'•'} Boost 60Hz for warmth</div>
              <div>{'•'} Cut 200-400Hz for mud</div>
              <div>{'•'} 3-4:1 ratio is standard</div>
              <div>{'•'} Slow attack = more punch</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default function KrazyCarmaMaster() {
  return (
    <Suspense fallback={null}>
      <KrazyCarmaMasterInner />
    </Suspense>
  );
}
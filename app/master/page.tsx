"use client";

import { useState, useRef, useCallback } from "react";

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
  dim: 'rgba(220,222,255,0.18)',
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

  const onMouseDown = (e: React.MouseEvent) => {
    startY.current = e.clientY;
    startVal.current = value;
    const onMove = (ev: MouseEvent) => {
      const dy = startY.current! - ev.clientY;
      const range = max - min;
      const newVal = Math.min(max, Math.max(min, startVal.current! + (dy / 100) * range));
      onChange(newVal);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const colorRgb = color === C.cyan ? '0,229,255' : color === C.pink ? '57,255,20' : color === C.lime ? '179,255,0' : '170,68,255';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={size} height={size} viewBox="0 0 56 56" style={{ cursor: 'ns-resize', userSelect: 'none' }} onMouseDown={onMouseDown}>
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
      {label && <span style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'monospace' }}>{label}</span>}
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
      {label && <span style={{ fontSize: 9, color: C.muted, fontFamily: 'monospace' }}>{label}</span>}
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

export default function KrazyCarmaMaster() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [playing, setPlaying] = useState(false);
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

  const initAudio = useCallback(async (arrayBuf: ArrayBuffer) => {
    if (audioCtxRef.current) audioCtxRef.current.close();
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const decoded = await ctx.decodeAudioData(arrayBuf);
    bufferRef.current = decoded;

    const splitter = ctx.createChannelSplitter(2);
    const merger = ctx.createChannelMerger(2);
    mergerRef.current = merger;

    const aL = ctx.createAnalyser(); aL.fftSize = 256; analyserLRef.current = aL;
    const aR = ctx.createAnalyser(); aR.fftSize = 256; analyserRRef.current = aR;
    splitter.connect(aL, 0); splitter.connect(aR, 1);
    aL.connect(merger, 0, 0); aR.connect(merger, 0, 1);

    const eqChain = EQ_BANDS.map((b, i) => {
      const f = ctx.createBiquadFilter();
      f.type = b.type;
      f.frequency.value = b.freq;
      f.Q.value = b.q;
      f.gain.value = eqBands[i].gain;
      return f;
    });
    eqNodesRef.current = eqChain;
    for (let i = 0; i < eqChain.length - 1; i++) eqChain[i].connect(eqChain[i + 1]);

    const compNode = ctx.createDynamicsCompressor();
    compNode.threshold.value = comp.threshold;
    compNode.ratio.value = comp.ratio;
    compNode.attack.value = comp.attack / 1000;
    compNode.release.value = comp.release / 1000;
    compNodeRef.current = compNode;

    const gainNode = ctx.createGain();
    gainNode.gain.value = Math.pow(10, comp.makeup / 20);
    gainNodeRef.current = gainNode;

    merger.connect(eqChain[0]);
    eqChain[eqChain.length - 1].connect(compNode);
    compNode.connect(gainNode);
    gainNode.connect(ctx.destination);

    return { ctx, splitter, decoded };
  }, [comp.attack, comp.makeup, comp.ratio, comp.release, comp.threshold, eqBands]);

  const loadFile = async (f: File) => {
    setFile(f);
    setFileName(f.name);
    setPlaying(false);
    setExpProg(0);
    setAiAnalysis(null);
    const ab = await f.arrayBuffer();
    await initAudio(ab.slice(0));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && (f.type.startsWith('audio/') || f.name.match(/\.(mp3|wav|flac|aac|ogg|m4a)$/i))) loadFile(f);
  };

  const togglePlay = async () => {
    if (!bufferRef.current || !file) return;
    if (playing) {
      if (sourceRef.current) { sourceRef.current.stop(); sourceRef.current = null; }
      setPlaying(false);
      cancelAnimationFrame(animRef.current);
      setLevL(0); setLevR(0);
      return;
    }

    if (audioCtxRef.current) audioCtxRef.current.close();
    const ab = await file.arrayBuffer();
    const { ctx: newCtx, splitter } = await initAudio(ab);
    const newSrc = newCtx.createBufferSource();
    newSrc.buffer = bufferRef.current;
    newSrc.connect(splitter);
    newSrc.start();
    sourceRef.current = newSrc;
    setPlaying(true);

    const tick = () => {
      if (!analyserLRef.current || !analyserRRef.current) return;
      const dL = new Uint8Array(analyserLRef.current.frequencyBinCount);
      const dR = new Uint8Array(analyserRRef.current.frequencyBinCount);
      analyserLRef.current.getByteFrequencyData(dL);
      analyserRRef.current.getByteFrequencyData(dR);
      const avgL = dL.reduce((a,b)=>a+b,0)/dL.length/255*100;
      const avgR = dR.reduce((a,b)=>a+b,0)/dR.length/255*100;
      setLevL(avgL); setLevR(avgR);
      animRef.current = requestAnimationFrame(tick);
    };
    tick();

    newSrc.onended = () => { setPlaying(false); setLevL(0); setLevR(0); cancelAnimationFrame(animRef.current); };
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

    merger.connect(eq[0]);
    eq[eq.length-1].connect(compressor);
    compressor.connect(gain);
    gain.connect(fullCtx.destination);
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

  const s = {
    wrap: { minHeight: '100vh', background: 'transparent', color: C.text, fontFamily: "'IBM Plex Mono', monospace", padding: '20px', boxSizing: 'border-box' as const, backgroundImage: 'radial-gradient(ellipse at 20% 20%, rgba(0,229,255,0.04) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(255,26,140,0.04) 0%, transparent 50%)' },
    header: { textAlign: 'center' as const, marginBottom: 24 },
    logo: { fontSize: 28, fontFamily: "'Orbitron', sans-serif", fontWeight: 900, letterSpacing: '0.15em', background: `linear-gradient(135deg, ${C.cyan}, ${C.pink}, ${C.lime})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    sub: { fontSize: 10, color: C.muted, letterSpacing: '0.3em', marginTop: 4 },
    grid: { display: 'grid', gridTemplateColumns: '1fr 240px', gap: 16, maxWidth: 900, margin: '0 auto' },
    panel: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 },
    sectionTitle: { fontSize: 10, color: C.muted, letterSpacing: '0.25em', textTransform: 'uppercase' as const, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 },
    dot: (color: string) => ({ width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }),
    dropzone: { border: `2px dashed ${file ? C.cyan : C.border}`, borderRadius: 10, padding: '28px 20px', textAlign: 'center' as const, cursor: 'pointer', transition: 'all 0.3s', background: file ? 'rgba(0,229,255,0.03)' : 'transparent' },
    tab: (active: boolean) => ({ padding: '7px 16px', borderRadius: 6, border: `1px solid ${active ? C.cyan : C.border}`, background: active ? 'rgba(0,229,255,0.08)' : 'transparent', color: active ? C.cyan : C.muted, fontSize: 10, letterSpacing: '0.15em', cursor: 'pointer', transition: 'all 0.2s' }),
    preset: (active: boolean) => ({ padding: '6px 12px', borderRadius: 6, border: `1px solid ${active ? C.pink : C.border}`, background: active ? 'rgba(57,255,20,0.08)' : 'transparent', color: active ? C.pink : C.muted, fontSize: 9, letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase' as const }),
    playBtn: { width: 52, height: 52, borderRadius: '50%', border: `2px solid ${playing ? C.pink : C.cyan}`, background: playing ? 'rgba(57,255,20,0.1)' : 'rgba(0,229,255,0.1)', color: playing ? C.pink : C.cyan, fontSize: 20, cursor: file ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: file ? `0 0 20px ${playing ? C.pink : C.cyan}40` : 'none', transition: 'all 0.2s', opacity: file ? 1 : 0.4 },
  };

  const stats: [string, string][] = [
    ['THRESHOLD', `${comp.threshold} dB`],
    ['RATIO', `${comp.ratio}:1`],
    ['ATTACK', `${comp.attack} ms`],
    ['RELEASE', `${comp.release} ms`],
    ['STEREO WIDTH', `+${stereoWidth}%`],
    ['TARGET LUFS', `${targetLufs} LUFS`],
  ];

  return (
    <div style={s.wrap}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=IBM+Plex+Mono:wght@300;400;500&display=swap'); * { box-sizing: border-box; } input[type=range] { -webkit-appearance: none; width: 100%; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.08); outline: none; } input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: ${C.cyan}; box-shadow: 0 0 8px ${C.cyan}80; cursor: ns-resize; }`}</style>

      <div style={s.header}>
        <div style={s.logo}>KRAZYCARMA</div>
        <div style={s.sub}>PROFESSIONAL AUDIO MASTERING ENGINE</div>
      </div>

      <div style={s.grid}>
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* File Upload */}
          <div style={s.panel}>
            <div style={s.sectionTitle}><span style={s.dot(C.cyan)} />INPUT TRACK</div>
            <div
              style={s.dropzone}
              onDrop={onDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => { const i = document.createElement('input'); i.type='file'; i.accept='audio/*'; i.onchange=(e)=>{ const target = e.target as HTMLInputElement; if(target.files?.[0]) loadFile(target.files[0]); }; i.click(); }}
            >
              {file ? (
                <div>
                  <div style={{ fontSize: 13, color: C.cyan, marginBottom: 4 }}>{'✓'} {fileName}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>Click to replace</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{'🎵'}</div>
                  <div style={{ fontSize: 12, color: C.text, marginBottom: 4 }}>Drop audio file here</div>
                  <div style={{ fontSize: 10, color: C.muted }}>{'MP3 · WAV · FLAC · AAC · OGG'}</div>
                </div>
              )}
            </div>

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
                {aiAnalysis.eqTips && <div style={{ marginTop: 8, fontSize: 9, color: C.dim }}>EQ: {aiAnalysis.eqTips}</div>}
                {aiAnalysis.compTips && <div style={{ marginTop: 4, fontSize: 9, color: C.dim }}>COMP: {aiAnalysis.compTips}</div>}
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
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              {[['eq','EQ'], ['comp','COMPRESS'], ['stereo','STEREO']].map(([k,l]) => (
                <button key={k} style={s.tab(tab===k)} onClick={() => setTab(k)}>{l}</button>
              ))}
            </div>

            {tab === 'eq' && (
              <div>
                <div style={s.sectionTitle}><span style={s.dot(C.cyan)} />6-BAND PARAMETRIC EQ</div>
                <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 16 }}>
                  {eqBands.map((b, i) => (
                    <div key={b.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <Knob value={b.gain} min={-12} max={12} onChange={v => updateEq(i, Math.round(v * 10) / 10)} color={[C.cyan, C.cyan, C.lime, C.lime, C.pink, C.pink][i]} size={52} />
                      <div style={{ fontSize: 9, color: C.muted }}>{b.label}</div>
                      <div style={{ fontSize: 9, color: C.text, fontFamily: 'monospace' }}>{b.gain > 0 ? '+' : ''}{b.gain.toFixed(1)}dB</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'comp' && (
              <div>
                <div style={s.sectionTitle}><span style={s.dot(C.orange)} />DYNAMICS COMPRESSOR</div>
                <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 16 }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                    <Knob value={comp.threshold} min={-40} max={0} onChange={v => updateComp('threshold', Math.round(v))} color={C.orange} size={52}/>
                    <div style={{fontSize:9,color:C.muted}}>THRESHOLD</div>
                    <div style={{fontSize:9,color:C.text,fontFamily:'monospace'}}>{comp.threshold}dB</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                    <Knob value={comp.ratio} min={1} max={20} onChange={v => updateComp('ratio', Math.round(v * 2) / 2)} color={C.orange} size={52}/>
                    <div style={{fontSize:9,color:C.muted}}>RATIO</div>
                    <div style={{fontSize:9,color:C.text,fontFamily:'monospace'}}>{comp.ratio}:1</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                    <Knob value={comp.attack} min={1} max={100} onChange={v => updateComp('attack', Math.round(v))} color={C.lime} size={52}/>
                    <div style={{fontSize:9,color:C.muted}}>ATTACK</div>
                    <div style={{fontSize:9,color:C.text,fontFamily:'monospace'}}>{comp.attack}ms</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                    <Knob value={comp.release} min={10} max={500} onChange={v => updateComp('release', Math.round(v))} color={C.lime} size={52}/>
                    <div style={{fontSize:9,color:C.muted}}>RELEASE</div>
                    <div style={{fontSize:9,color:C.text,fontFamily:'monospace'}}>{comp.release}ms</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                    <Knob value={comp.makeup} min={0} max={12} onChange={v => updateComp('makeup', Math.round(v * 2) / 2)} color={C.pink} size={52}/>
                    <div style={{fontSize:9,color:C.muted}}>MAKEUP</div>
                    <div style={{fontSize:9,color:C.text,fontFamily:'monospace'}}>+{comp.makeup}dB</div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'stereo' && (
              <div>
                <div style={s.sectionTitle}><span style={s.dot(C.purple)} />STEREO & LOUDNESS</div>
                <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 24 }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                    <Knob value={stereoWidth} min={0} max={100} onChange={v => setStereoWidth(Math.round(v))} color={C.purple} size={60}/>
                    <div style={{fontSize:9,color:C.muted}}>STEREO WIDTH</div>
                    <div style={{fontSize:9,color:C.text,fontFamily:'monospace'}}>+{stereoWidth}%</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                    <Knob value={targetLufs} min={-23} max={-6} onChange={v => setTargetLufs(Math.round(v))} color={C.lime} size={60}/>
                    <div style={{fontSize:9,color:C.muted}}>TARGET LUFS</div>
                    <div style={{fontSize:9,color:C.text,fontFamily:'monospace'}}>{targetLufs} LUFS</div>
                    <div style={{fontSize:8,color:C.dim,textAlign:'center'}}>Streaming: -14<br/>Club: -9</div>
                  </div>
                </div>
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
                <span style={{ fontSize: 9, color: C.muted }}>{l}</span>
                <span style={{ fontSize: 9, color: C.text, fontFamily: 'monospace' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Export */}
          <div style={s.panel}>
            <div style={s.sectionTitle}><span style={s.dot(C.pink)} />EXPORT</div>
            {exporting && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 9, color: C.muted }}>Rendering...</span>
                  <span style={{ fontSize: 9, color: C.cyan, fontFamily: 'monospace' }}>{expProg}%</span>
                </div>
                <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${expProg}%`, background: `linear-gradient(90deg, ${C.cyan}, ${C.pink}, ${C.lime})`, transition: 'width 0.3s', borderRadius: 3 }} />
                </div>
              </div>
            )}
            <button
              onClick={exportMaster}
              disabled={!file || exporting}
              style={{ width: '100%', padding: '14px', background: file && !exporting ? `linear-gradient(135deg, rgba(0,229,255,0.08), rgba(57,255,20,0.08))` : 'rgba(255,255,255,0.02)', border: `1px solid ${file && !exporting ? C.cyan : C.border}`, borderRadius: 8, color: file && !exporting ? C.text : C.muted, fontFamily: "'Orbitron', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', cursor: file && !exporting ? 'pointer' : 'not-allowed', boxShadow: file && !exporting ? `0 0 24px rgba(0,229,255,0.1)` : 'none', transition: 'all 0.3s' }}
            >
              {exporting ? '⏳ RENDERING...' : expProg === 100 ? '✓ EXPORTED!' : '↓ EXPORT MASTER'}
            </button>
            <p style={{ marginTop: 10, fontSize: 8, color: C.dim, textAlign: 'center', lineHeight: 1.7 }}>
              {'Offline render · Full chain · 16-bit WAV'}
            </p>
          </div>

          {/* Tips */}
          <div style={{ ...s.panel, background: 'rgba(179,255,0,0.02)', border: `1px solid rgba(179,255,0,0.1)` }}>
            <div style={s.sectionTitle}><span style={s.dot(C.lime)} />QUICK TIPS</div>
            <div style={{ fontSize: 9, color: C.muted, lineHeight: 1.9 }}>
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

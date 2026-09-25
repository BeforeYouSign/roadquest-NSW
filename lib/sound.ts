'use client';
// Tiny synthesised sound effects (Web Audio) — no audio files to download.
import { getState } from './store';

let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const s = getState().settings;
  if (!s.sound) return null;
  try {
    if (!ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function vol(): number {
  return Math.max(0, Math.min(1, getState().settings.volume)) * 0.35;
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', delay = 0, gain = 1, slideTo?: number) {
  const a = ac();
  if (!a) return;
  const t0 = a.currentTime + delay;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol() * gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(a.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

function noise(dur: number, delay = 0, gain = 1, filter = 2000) {
  const a = ac();
  if (!a) return;
  const t0 = a.currentTime + delay;
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = filter;
  const g = a.createGain();
  g.gain.value = vol() * gain;
  src.connect(f).connect(g).connect(a.destination);
  src.start(t0);
}

export const sfx = {
  tap: () => tone(660, 0.05, 'triangle', 0, 0.4),
  correct: () => {
    tone(660, 0.1, 'triangle');
    tone(990, 0.16, 'triangle', 0.08);
  },
  wrong: () => tone(180, 0.28, 'sawtooth', 0, 0.5, 110),
  coin: () => {
    tone(1318, 0.06, 'square', 0, 0.35);
    tone(1760, 0.12, 'square', 0.06, 0.35);
  },
  xp: () => tone(880, 0.18, 'sine', 0, 0.6, 1760),
  levelUp: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, 'triangle', i * 0.09)),
  achievement: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.22, 'square', i * 0.08, 0.35)),
  camera: () => {
    noise(0.08, 0, 1.2, 6000);
    tone(2400, 0.05, 'square', 0.02, 0.3);
  },
  horn: () => {
    tone(400, 0.35, 'square', 0, 0.45);
    tone(500, 0.35, 'square', 0, 0.35);
  },
  siren: () => {
    tone(700, 0.35, 'sine', 0, 0.5, 1100);
    tone(1100, 0.35, 'sine', 0.35, 0.5, 700);
  },
  skid: () => noise(0.45, 0, 0.8, 1200),
  indicator: () => tone(1500, 0.025, 'square', 0, 0.25),
  countdown: () => tone(880, 0.08, 'square', 0, 0.4),
  go: () => tone(1320, 0.25, 'square', 0, 0.4),
  whoosh: () => noise(0.25, 0, 0.35, 900),
};

/** A simple engine drone for the driving game. */
export function createEngine() {
  const a = ac();
  if (!a) return { set: (_speed: number) => void _speed, stop: () => undefined };
  const o = a.createOscillator();
  const o2 = a.createOscillator();
  const g = a.createGain();
  o.type = 'sawtooth';
  o2.type = 'triangle';
  g.gain.value = 0.0001;
  const f = a.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = 500;
  o.connect(f);
  o2.connect(f);
  f.connect(g).connect(a.destination);
  o.start();
  o2.start();
  return {
    set(speed: number) {
      const base = 42 + speed * 1.1;
      o.frequency.setTargetAtTime(base, a.currentTime, 0.1);
      o2.frequency.setTargetAtTime(base * 2.01, a.currentTime, 0.1);
      g.gain.setTargetAtTime(vol() * 0.18, a.currentTime, 0.2);
    },
    stop() {
      try {
        g.gain.setTargetAtTime(0.0001, a.currentTime, 0.05);
        o.stop(a.currentTime + 0.2);
        o2.stop(a.currentTime + 0.2);
      } catch {
        /* already stopped */
      }
    },
  };
}

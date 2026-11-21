/**
 * Tiny Web Audio sound kit. No audio files: every sound is synthesized.
 * Silent until the visitor interacts (browser autoplay rules) and toggleable from the nav.
 */
import { motion } from '../config/motion';

const KEY = 'sound';
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
let enabled = true;
try {
  enabled = localStorage.getItem(KEY) !== 'off';
} catch {}
const subs = new Set<(on: boolean) => void>();

function unlock() {
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = motion.sound.master;
    master.connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
}

for (const ev of ['pointerdown', 'keydown']) window.addEventListener(ev, unlock, { passive: true });

const ready = () => enabled && !!ctx && ctx.state === 'running' && !!master;

function blip(f0: number, f1: number, dur: number, gain: number, type: OscillatorType = 'sine') {
  if (!ready()) return;
  const t = ctx!.currentTime;
  const o = ctx!.createOscillator();
  const g = ctx!.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master!);
  o.start(t);
  o.stop(t + dur + 0.03);
}

let lastTick = 0;
/** Soft tick for hovering list rows. Throttled so fast sweeps do not buzz. */
export function tick() {
  const now = performance.now();
  if (now - lastTick < motion.sound.tickThrottle) return;
  lastTick = now;
  blip(1900, 1100, 0.045, 0.05, 'triangle');
}

/** Short click for toggles and buttons. */
export function click() {
  blip(720, 360, 0.08, 0.08, 'triangle');
}

/** Paper-like whoosh for opening folders and dialogs. */
export function whoosh() {
  if (!ready() || !noise) return;
  const t = ctx!.currentTime;
  const src = ctx!.createBufferSource();
  src.buffer = noise;
  const bp = ctx!.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 0.9;
  bp.frequency.setValueAtTime(500, t);
  bp.frequency.exponentialRampToValueAtTime(3200, t + 0.2);
  const g = ctx!.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.09, t + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
  src.connect(bp).connect(g).connect(master!);
  src.start(t);
  src.stop(t + 0.26);
}

export const soundOn = () => enabled;

export function setSound(on: boolean) {
  enabled = on;
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {}
  subs.forEach((fn) => fn(on));
  if (on) {
    unlock();
    setTimeout(click, 30);
  }
}

export function onSound(fn: (on: boolean) => void) {
  subs.add(fn);
  fn(enabled);
  return () => subs.delete(fn);
}

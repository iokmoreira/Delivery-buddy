import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Loader2, Volume2, VolumeX, X } from 'lucide-react';
import {
  BUDDY_CUTOUT_AVATARS,
  BUDDY_LAUNCH_REPLAY_EVENT,
  BUDDY_LAUNCH_SESSION_KEY,
  BUDDY_LAUNCH_VIDEO_SRC,
} from '../utils/buddyAvatars';

// =========================================================================
// BUDDY MULTI-PLATFORM JETPACK LAUNCH (native high-refresh, 7.0s)
// Everything (background, Buddy, 3 thermal bags, beams, shockwaves, HUD,
// plasma flames, particles) is painted on ONE <canvas>, so
// canvas.captureStream() + MediaRecorder captures 100% of the visuals.
//
// Stage 1 (0.0–2.2s): Slow hover + bags materialize (0.4s stagger) in orbit
// Stage 2 (2.2–4.8s): Tractor beams, 2.0s cubic-bezier absorption,
//                     0.6s charge-up pulse + HUD banner
// Stage 3 (4.8–7.0s): Thruster ignition, 0.9s vibrating hover, skyward launch
//
// The loop uses requestAnimationFrame + performance.now() delta-time with NO
// frame throttling, so it runs at the display's native rate (120Hz on
// high-refresh phones). Particle spawning is time-based, so density is the
// same at 60/90/120fps.
// Hybrid: plays /assets/buddy-launch.mp4 if present, else the code animation.
// =========================================================================

const TOTAL_MS = 7000;
const BAG_APPEAR_START_MS = 300;
const BAG_STAGGER_MS = 400;
const BAG_MATERIALIZE_MS = 520;
const BEAM_ON_MS = 2200;
const ABSORB_START_MS = 2400;
const ABSORB_STAGGER_MS = 150;
const ABSORB_DURATION_MS = 1700;
const CHARGE_START_MS = 4200;
const SHOCK_MS = 4400;
const IGNITION_MS = 4800;
const LIFTOFF_MS = 5700;
const FADE_OUT_MS = 6600;
const HUD_IN_MS = 4400;
const HUD_OUT_MS = 6300;

const MUTE_STORAGE_KEY = 'buddy_launch_muted_v1';
const VIDEO_BITRATE = 12_000_000;

type BagBrand = 'glovo' | 'uber' | 'bolt';

interface BagSpec {
  brand: BagBrand;
  angleDeg: number;
  tilt: number;
}

const BAGS: BagSpec[] = [
  { brand: 'glovo', angleDeg: -90, tilt: -8 },
  { brand: 'uber', angleDeg: 30, tilt: 6 },
  { brand: 'bolt', angleDeg: 150, tilt: -5 },
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  white: boolean;
}

interface Star {
  x: number;
  y: number;
  r: number;
  phase: number;
}

type Vec = { x: number; y: number };

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOutBack = (p: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
};
const easeInOutCubic = (p: number) =>
  p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
const easeInCubic = (p: number) => p * p * p;
const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);

const rotateVec = (x: number, y: number, deg: number): Vec => {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return { x: x * c - y * s, y: x * s + y * c };
};

const cubicBezier = (p0: Vec, p1: Vec, p2: Vec, p3: Vec, t: number): Vec => {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  };
};

/** Curved absorption path from a bag position into Buddy's jetpack. */
const bagPathControls = (from: Vec, to: Vec, idx: number) => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy) || 1;
  const side = idx % 2 === 0 ? 1 : -1;
  const nx = (-dy / dist) * side;
  const ny = (dx / dist) * side;
  return {
    c1: { x: from.x + dx * 0.15 + nx * dist * 0.45, y: from.y + dy * 0.15 + ny * dist * 0.45 },
    c2: { x: to.x - dx * 0.25 - nx * dist * 0.18, y: to.y - dy * 0.25 - ny * dist * 0.18 },
  };
};

// -------------------------------------------------------------------------
// Optional external .mp4 probe (cached per app session)
// -------------------------------------------------------------------------
const videoProbeCache = new Map<string, boolean>();

async function probeLaunchVideo(src: string): Promise<boolean> {
  if (videoProbeCache.has(src)) return videoProbeCache.get(src) as boolean;
  let ok = false;
  try {
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), 450);
    const res = await fetch(src, {
      method: 'HEAD',
      cache: 'no-store',
      signal: ctrl.signal,
    });
    window.clearTimeout(timer);
    const type = (res.headers.get('content-type') || '').toLowerCase();
    ok = res.ok && (type.includes('video') || type.includes('mp4'));
  } catch {
    ok = false;
  }
  videoProbeCache.set(src, ok);
  return ok;
}

// -------------------------------------------------------------------------
// Web Audio: synthesized charge-up, power-up + plasma whoosh (no files)
// -------------------------------------------------------------------------
function scheduleLaunchSounds(ctx: AudioContext, master: GainNode): void {
  const t0 = ctx.currentTime;

  // Charge-up hum (rising sine under the 0.6s energy pulse)
  const tCharge = t0 + CHARGE_START_MS / 1000;
  const hum = ctx.createOscillator();
  const hg = ctx.createGain();
  hum.type = 'sine';
  hum.frequency.setValueAtTime(90, tCharge);
  hum.frequency.exponentialRampToValueAtTime(320, tCharge + 0.6);
  hg.gain.setValueAtTime(0.0001, tCharge);
  hg.gain.exponentialRampToValueAtTime(0.06, tCharge + 0.4);
  hg.gain.exponentialRampToValueAtTime(0.0001, tCharge + 0.7);
  hum.connect(hg).connect(master);
  hum.start(tCharge);
  hum.stop(tCharge + 0.75);

  // Absorption power-up (saw sweep through opening low-pass)
  const tUp = t0 + SHOCK_MS / 1000 - 0.08;
  const osc = ctx.createOscillator();
  const lp = ctx.createBiquadFilter();
  const g = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(140, tUp);
  osc.frequency.exponentialRampToValueAtTime(760, tUp + 0.34);
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(900, tUp);
  lp.frequency.exponentialRampToValueAtTime(3200, tUp + 0.34);
  g.gain.setValueAtTime(0.0001, tUp);
  g.gain.exponentialRampToValueAtTime(0.085, tUp + 0.08);
  g.gain.exponentialRampToValueAtTime(0.0001, tUp + 0.46);
  osc.connect(lp).connect(g).connect(master);
  osc.start(tUp);
  osc.stop(tUp + 0.5);

  // Crisp confirmation ping
  const ping = ctx.createOscillator();
  const pg = ctx.createGain();
  ping.type = 'sine';
  ping.frequency.setValueAtTime(1320, tUp + 0.3);
  pg.gain.setValueAtTime(0.0001, tUp + 0.3);
  pg.gain.exponentialRampToValueAtTime(0.05, tUp + 0.32);
  pg.gain.exponentialRampToValueAtTime(0.0001, tUp + 0.48);
  ping.connect(pg).connect(master);
  ping.start(tUp + 0.3);
  ping.stop(tUp + 0.5);

  // Plasma thruster whoosh (filtered noise, ignition -> end of flight)
  const tIgn = t0 + IGNITION_MS / 1000;
  const dur = (TOTAL_MS - IGNITION_MS) / 1000;
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 0.7;
  bp.frequency.setValueAtTime(600, tIgn);
  bp.frequency.setValueAtTime(800, t0 + LIFTOFF_MS / 1000);
  bp.frequency.exponentialRampToValueAtTime(2600, tIgn + dur);
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.0001, tIgn);
  ng.gain.exponentialRampToValueAtTime(0.05, tIgn + 0.3);
  ng.gain.setValueAtTime(0.05, t0 + LIFTOFF_MS / 1000);
  ng.gain.exponentialRampToValueAtTime(0.085, t0 + LIFTOFF_MS / 1000 + 0.3);
  ng.gain.exponentialRampToValueAtTime(0.0001, tIgn + dur);
  noise.connect(bp).connect(ng).connect(master);
  noise.start(tIgn);
  noise.stop(tIgn + dur);
}

// -------------------------------------------------------------------------
// 3D-styled isometric thermal delivery bags (SVG -> Image for canvas)
// -------------------------------------------------------------------------
const BAG_THEME: Record<
  BagBrand,
  {
    front: [string, string];
    right: [string, string];
    top: [string, string];
    strap: string;
    seam: string;
  }
> = {
  glovo: {
    front: ['#FFD54F', '#FFC244'],
    right: ['#E8A90C', '#C98F00'],
    top: ['#FFE48A', '#FFD25C'],
    strap: '#00A082',
    seam: '#0F172A',
  },
  uber: {
    front: ['#1F2937', '#111827'],
    right: ['#0B1220', '#030712'],
    top: ['#374151', '#1F2937'],
    strap: '#06C167',
    seam: '#06C167',
  },
  bolt: {
    front: ['#4ADE9A', '#34D186'],
    right: ['#22B36F', '#1A9A5E'],
    top: ['#86EFC0', '#5FE3A6'],
    strap: '#FFFFFF',
    seam: '#0F172A',
  },
};

function buildBagSvg(brand: BagBrand): string {
  const th = BAG_THEME[brand];
  const id = `bl-${brand}`;
  const font = 'font-family="Inter, system-ui, Arial, sans-serif"';
  let panel = '';
  if (brand === 'glovo') {
    panel = `<rect x="4" y="38" width="34" height="5" rx="1.5" fill="${th.strap}"/>
      <text x="21" y="27" text-anchor="middle" ${font} font-weight="900" font-size="11" fill="#0F172A">Glovo</text>`;
  } else if (brand === 'uber') {
    panel = `<rect x="4" y="38" width="34" height="3.5" rx="1.5" fill="${th.strap}"/>
      <text x="21" y="21" text-anchor="middle" ${font} font-weight="800" font-size="10" fill="#FFFFFF">Uber</text>
      <text x="21" y="32" text-anchor="middle" ${font} font-weight="900" font-size="10" fill="${th.strap}">Eats</text>`;
  } else {
    panel = `<rect x="5" y="11" width="32" height="24" rx="3" fill="#FFFFFF"/>
      <text x="21" y="23" text-anchor="middle" ${font} font-weight="900" font-size="9.5" fill="#1A9A5E">Bolt</text>
      <text x="21" y="31.5" text-anchor="middle" ${font} font-weight="800" font-size="6.5" fill="#0F172A">FOOD</text>
      <rect x="4" y="40" width="34" height="3" rx="1" fill="#0F172A" opacity="0.55"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="240" height="240">
  <defs>
    <linearGradient id="${id}-f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${th.front[0]}"/><stop offset="1" stop-color="${th.front[1]}"/></linearGradient>
    <linearGradient id="${id}-r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${th.right[0]}"/><stop offset="1" stop-color="${th.right[1]}"/></linearGradient>
    <linearGradient id="${id}-t" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${th.top[0]}"/><stop offset="1" stop-color="${th.top[1]}"/></linearGradient>
  </defs>
  <path d="M44 31 Q60 8 76 31" fill="none" stroke="${th.strap}" stroke-width="4.5" stroke-linecap="round"/>
  <polygon points="18,34 60,17 102,34 60,51" fill="url(#${id}-t)"/>
  <polygon points="18,34 60,51 60,106 18,89" fill="url(#${id}-f)"/>
  <polygon points="60,51 102,34 102,89 60,106" fill="url(#${id}-r)"/>
  <polyline points="18,37 60,54 102,37" fill="none" stroke="${th.seam}" stroke-opacity="0.55" stroke-width="1.4" stroke-dasharray="2.5 2"/>
  <polyline points="18,34 60,17 102,34" fill="none" stroke="#FFFFFF" stroke-opacity="0.45" stroke-width="1.2"/>
  <line x1="60" y1="51" x2="60" y2="106" stroke="#FFFFFF" stroke-opacity="0.18" stroke-width="1"/>
  <g transform="matrix(1,-0.405,0,1,60,51)">
    <rect x="9" y="4" width="5" height="48" rx="1.5" fill="${th.strap}" opacity="0.92"/>
    <rect x="27" y="4" width="5" height="48" rx="1.5" fill="${th.strap}" opacity="0.92"/>
    <rect x="7" y="22" width="27" height="3" rx="1" fill="${th.seam}" opacity="0.35"/>
  </g>
  <g transform="matrix(1,0.405,0,1,18,34)">${panel}</g>
</svg>`;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function pickRecorderMime(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    'video/mp4;codecs=avc1.42E01E',
    'video/mp4;codecs=avc1',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  for (const c of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(c)) return c;
    } catch {
      // ignore
    }
  }
  return '';
}

// -------------------------------------------------------------------------
// Main component
// -------------------------------------------------------------------------
export interface BuddyLaunchAnimationProps {
  open: boolean;
  onClose: () => void;
  /** Optional external 3D .mp4 (defaults to /assets/buddy-launch.mp4 if present). */
  customVideoSrc?: string;
}

type LaunchMode = 'probe' | 'video' | 'code';
type RecordState = 'idle' | 'recording' | 'done' | 'unsupported';

interface LaunchAssets {
  buddyOnline: HTMLImageElement | null;
  buddyFlying: HTMLImageElement | null;
  bags: Array<HTMLImageElement | null>;
}

export const BuddyLaunchAnimation: React.FC<BuddyLaunchAnimationProps> = ({
  open,
  onClose,
  customVideoSrc,
}) => {
  const videoSrc = customVideoSrc || BUDDY_LAUNCH_VIDEO_SRC;
  const [mode, setMode] = useState<LaunchMode>('probe');
  const [recordState, setRecordState] = useState<RecordState>('idle');
  const [muted, setMuted] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(MUTE_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  const overlayRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const closedRef = useRef<boolean>(false);
  const mutedRef = useRef<boolean>(muted);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Timeline + scene state (mutated inside the rAF loop, never re-rendered)
  const startTimeRef = useRef<number | null>(null);
  const assetsRef = useRef<LaunchAssets>({ buddyOnline: null, buddyFlying: null, bags: [] });
  const particlesRef = useRef<Particle[]>([]);
  const trailRef = useRef<Array<{ x: number; y: number; t: number }>>([]);
  const spawnAccRef = useRef<{ thruster: number; ambient: number; charge: number }>({
    thruster: 0,
    ambient: 0,
    charge: 0,
  });

  // Recording state
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  const isRecordingRef = useRef<boolean>(false);
  const abortRecordingRef = useRef<boolean>(false);
  const recordStreamRef = useRef<MediaStream | null>(null);

  const finish = useCallback(() => {
    if (closedRef.current) return;
    closedRef.current = true;
    onCloseRef.current();
  }, []);

  const closeAudio = useCallback(() => {
    const ac = audioCtxRef.current;
    audioCtxRef.current = null;
    masterGainRef.current = null;
    if (ac) {
      window.setTimeout(() => {
        void ac.close().catch(() => undefined);
      }, 300);
    }
  }, []);

  /** (Re)builds the audio graph and schedules the whole soundtrack from t=0. */
  const startAudio = useCallback(
    (recordDest: boolean): MediaStreamAudioDestinationNode | null => {
      closeAudio();
      try {
        const AC =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!AC) return null;
        const ac = new AC();
        const master = ac.createGain();
        master.gain.value = mutedRef.current ? 0 : 1;
        master.connect(ac.destination);
        let dest: MediaStreamAudioDestinationNode | null = null;
        if (recordDest && typeof ac.createMediaStreamDestination === 'function') {
          dest = ac.createMediaStreamDestination();
          master.connect(dest);
        }
        audioCtxRef.current = ac;
        masterGainRef.current = master;
        void ac.resume().catch(() => undefined);
        scheduleLaunchSounds(ac, master);
        return dest;
      } catch {
        return null;
      }
    },
    [closeAudio]
  );

  /** Restarts the visual timeline from t=0. */
  const restartTimeline = useCallback(() => {
    particlesRef.current = [];
    trailRef.current = [];
    spawnAccRef.current = { thruster: 0, ambient: 0, charge: 0 };
    startTimeRef.current = performance.now();
  }, []);

  // Reset & probe for the optional .mp4 whenever the overlay opens
  useEffect(() => {
    if (!open) return;
    closedRef.current = false;
    setMode('probe');
    let cancelled = false;
    void probeLaunchVideo(videoSrc).then((hasVideo) => {
      if (!cancelled) setMode(hasVideo ? 'video' : 'code');
    });
    return () => {
      cancelled = true;
    };
  }, [open, videoSrc]);

  // Keep mute in sync with live audio graph / video element
  useEffect(() => {
    mutedRef.current = muted;
    try {
      window.localStorage.setItem(MUTE_STORAGE_KEY, muted ? '1' : '0');
    } catch {
      // ignore
    }
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setValueAtTime(
        muted ? 0 : 1,
        audioCtxRef.current.currentTime
      );
    }
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  // Video mode: attempt playback with sound, fall back to muted, then to code
  useEffect(() => {
    if (!open || mode !== 'video') return;
    const v = videoRef.current;
    if (!v) return;
    v.muted = muted;
    v.play().catch(() => {
      v.muted = true;
      v.play().catch(() => setMode('code'));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode]);

  // Native-refresh-rate code animation loop (single rAF, 100% canvas)
  useEffect(() => {
    if (!open || mode !== 'code') return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: true });
    if (!canvas || !ctx) return;

    let W = window.innerWidth;
    let H = window.innerHeight;
    let dpr = Math.min(2, window.devicePixelRatio || 1);
    const layout = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    };
    layout();
    window.addEventListener('resize', layout);

    const stars: Star[] = Array.from({ length: 80 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.4 + Math.random() * 1.2,
      phase: Math.random() * Math.PI * 2,
    }));

    // Preload assets, then start the timeline (max 900ms wait)
    let started = false;
    const startOnce = () => {
      if (started) return;
      started = true;
      if (!mutedRef.current) startAudio(false);
      restartTimeline();
    };
    startTimeRef.current = null;
    const fallbackTimer = window.setTimeout(startOnce, 900);
    void Promise.all([
      loadImage(BUDDY_CUTOUT_AVATARS.online),
      loadImage(BUDDY_CUTOUT_AVATARS.flying),
      ...BAGS.map((b) =>
        loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildBagSvg(b.brand))}`)
      ),
    ]).then(([online, flying, ...bags]) => {
      assetsRef.current = { buddyOnline: online, buddyFlying: flying, bags };
      window.clearTimeout(fallbackTimer);
      startOnce();
    });

    let last = performance.now();
    let raf = 0;
    let recorderStopRequested = false;

    const spawn = (p: Particle) => {
      const list = particlesRef.current;
      if (list.length < 900) list.push(p);
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      const st = startTimeRef.current;
      const t = st === null ? 0 : now - st;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, W, H);

      // ---------- Background (painted so the recorded video is complete) ----------
      const bgCy = H * 0.46;
      const bg = ctx.createRadialGradient(W / 2, bgCy, 0, W / 2, bgCy, Math.max(W, H) * 0.8);
      bg.addColorStop(0, 'rgba(8, 47, 73, 0.97)');
      bg.addColorStop(0.45, 'rgba(2, 6, 23, 0.97)');
      bg.addColorStop(1, 'rgba(0, 0, 0, 0.98)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Starfield (parallax drift downward during liftoff)
      const drift = t >= LIFTOFF_MS ? easeInCubic(clamp01((t - LIFTOFF_MS) / 1000)) * H * 0.35 : 0;
      for (const s of stars) {
        const tw = 0.35 + 0.35 * Math.sin(t / 600 + s.phase);
        const sy = (s.y * H + drift * (0.5 + s.r)) % H;
        ctx.fillStyle = `rgba(186, 230, 253, ${tw})`;
        ctx.beginPath();
        ctx.arc(s.x * W, sy, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (st === null) {
        raf = window.requestAnimationFrame(frame);
        return;
      }

      const S = Math.max(160, Math.min(300, Math.min(W, H) * 0.46));
      const cx = W / 2;
      const cy = H * 0.46;
      const R = S * 1.0;
      const B = S * 0.42;

      // ---------- Buddy transform ----------
      const entry = clamp01(t / 700);
      let bx = 0;
      let by =
        Math.sin(t / 520) * 7 * (t < LIFTOFF_MS ? 1 : 0) +
        (1 - easeOutCubic(entry)) * 40;
      let rot = 0;
      let scale = 0.82 + 0.18 * easeOutBack(entry);
      if (t >= CHARGE_START_MS && t < IGNITION_MS) {
        const cp = (t - CHARGE_START_MS) / (IGNITION_MS - CHARGE_START_MS);
        scale += Math.sin(cp * Math.PI * 6) * 0.02 * cp;
      }
      if (t >= SHOCK_MS && t < SHOCK_MS + 260) {
        scale += Math.sin(((t - SHOCK_MS) / 260) * Math.PI) * 0.06;
      }
      if (t >= IGNITION_MS) {
        rot = -12 * easeOutCubic(clamp01((t - IGNITION_MS) / 400));
      }
      if (t >= IGNITION_MS + 60 && t < LIFTOFF_MS) {
        bx += Math.sin(t * 0.9) * 2 + (Math.random() - 0.5) * 1.4;
        by += Math.cos(t * 1.1) * 1.5;
      }
      if (t >= LIFTOFF_MS) {
        const p = clamp01((t - LIFTOFF_MS) / 1000);
        by += -(H * 0.72 + S * 1.3) * easeInCubic(p);
        scale *= 1 - 0.18 * p;
      }
      const buddyX = cx + bx;
      const buddyY = cy + by;
      const toWorld = (lx: number, ly: number): Vec => {
        const v = rotateVec(lx * S * scale, ly * S * scale, rot);
        return { x: buddyX + v.x, y: buddyY + v.y };
      };
      const jet = toWorld(-0.2, -0.06);
      const nozzles = [toWorld(-0.26, 0.09), toWorld(-0.13, 0.07)];
      const flameDir = rotateVec(-0.25, 0.97, rot);

      // ---------- Bags (positions computed first, drawn after Buddy) ----------
      const bagStates = BAGS.map((bag, i) => {
        const appearAt = BAG_APPEAR_START_MS + i * BAG_STAGGER_MS;
        const mat = clamp01((t - appearAt) / BAG_MATERIALIZE_MS);
        const orbitDeg = bag.angleDeg + Math.min(t, ABSORB_START_MS + 1500) * 0.012;
        const rad = (orbitDeg * Math.PI) / 180;
        const base: Vec = {
          x: cx + Math.cos(rad) * Math.min(R * 1.05, W / 2 - B * 0.62),
          y: cy + Math.sin(rad) * R * 0.82 + Math.sin(t / 600 + i * 1.7) * 6,
        };
        let pos = base;
        let s = easeOutBack(mat);
        let o = mat;
        let r = bag.tilt + Math.sin(t / 700 + i) * 4;
        const absorbStart = ABSORB_START_MS + i * ABSORB_STAGGER_MS;
        const p = clamp01((t - absorbStart) / ABSORB_DURATION_MS);
        const e = easeInOutCubic(p);
        const ctrl = bagPathControls(base, jet, i);
        if (p > 0) {
          pos = cubicBezier(base, ctrl.c1, ctrl.c2, jet, e);
          s *= 1 - 0.85 * e;
          o = e < 0.85 ? o : o * ((1 - e) / 0.15);
          r += e * 300;
        }
        return { base, pos, s, o, r, p, ctrl, visible: o > 0.01 && p < 1 };
      });

      // ---------- Vapor trail (behind Buddy) ----------
      const trail = trailRef.current;
      while (trail.length && t - trail[0].t > 800) trail.shift();
      if (trail.length > 1) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (let i = 1; i < trail.length; i++) {
          const a = trail[i - 1];
          const b = trail[i];
          const age = clamp01((t - b.t) / 750);
          const alpha = (1 - age) * 0.7;
          if (alpha <= 0.01) continue;
          ctx.strokeStyle = `rgba(0,229,255,${alpha})`;
          ctx.lineWidth = S * 0.09 * (1 - age * 0.6);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
        ctx.restore();
      }

      ctx.globalCompositeOperation = 'lighter';

      // ---------- Pulsing cyan aura (+ charge-up boost) ----------
      const chargeBoost =
        t >= CHARGE_START_MS && t < IGNITION_MS + 200
          ? 0.28 * Math.sin(clamp01((t - CHARGE_START_MS) / 800) * Math.PI)
          : 0;
      const auraAlpha =
        (0.3 * clamp01(t / 500) + chargeBoost) * (1 - clamp01((t - LIFTOFF_MS) / 600));
      if (auraAlpha > 0.005) {
        const ar = S * (0.78 + 0.06 * Math.sin(t / 260) + chargeBoost * 0.4);
        const grad = ctx.createRadialGradient(buddyX, buddyY, S * 0.15, buddyX, buddyY, ar);
        grad.addColorStop(0, `rgba(0,229,255,${auraAlpha})`);
        grad.addColorStop(1, 'rgba(0,229,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(buddyX, buddyY, ar, 0, Math.PI * 2);
        ctx.fill();
      }

      // ---------- Tractor beams (jetpack -> bags, along the same bezier) ----------
      const beamIn = clamp01((t - BEAM_ON_MS) / 250);
      if (beamIn > 0 && t < SHOCK_MS) {
        bagStates.forEach((bs) => {
          if (!bs.visible) return;
          // remaining part of the curve: from current bag position into the jet
          const c1 = { x: (bs.pos.x * 2 + bs.ctrl.c2.x) / 3, y: (bs.pos.y * 2 + bs.ctrl.c2.y) / 3 };
          ctx.save();
          ctx.lineCap = 'round';
          ctx.strokeStyle = `rgba(0,229,255,${0.22 * beamIn})`;
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.moveTo(jet.x, jet.y);
          ctx.bezierCurveTo(bs.ctrl.c2.x, bs.ctrl.c2.y, c1.x, c1.y, bs.pos.x, bs.pos.y);
          ctx.stroke();
          ctx.strokeStyle = `rgba(180,250,255,${0.9 * beamIn})`;
          ctx.lineWidth = 2;
          ctx.setLineDash([10, 8]);
          ctx.lineDashOffset = -t * 0.22;
          ctx.beginPath();
          ctx.moveTo(jet.x, jet.y);
          ctx.bezierCurveTo(bs.ctrl.c2.x, bs.ctrl.c2.y, c1.x, c1.y, bs.pos.x, bs.pos.y);
          ctx.stroke();
          ctx.restore();
        });
      }

      // ---------- Plasma thrusters (behind Buddy) + time-based sparks ----------
      if (t >= IGNITION_MS && t < TOTAL_MS) {
        const intensity =
          easeOutCubic(clamp01((t - IGNITION_MS) / 300)) * (t >= LIFTOFF_MS ? 1.4 : 1);
        const nxp = -flameDir.y;
        const nyp = flameDir.x;
        nozzles.forEach((n, idx) => {
          const flicker = 0.85 + 0.15 * Math.sin(t / 28 + idx * 2.3) + 0.08 * Math.random();
          const len = S * 0.62 * intensity * flicker;
          const baseW = S * 0.034;
          const drawCone = (lenMul: number, widthMul: number, stops: Array<[number, string]>) => {
            const L = len * lenMul;
            const w = baseW * widthMul;
            const tx = n.x + flameDir.x * L;
            const ty = n.y + flameDir.y * L;
            const bulgeX = n.x + flameDir.x * L * 0.3;
            const bulgeY = n.y + flameDir.y * L * 0.3;
            const g = ctx.createLinearGradient(n.x, n.y, tx, ty);
            stops.forEach(([o, c]) => g.addColorStop(o, c));
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(n.x + nxp * w, n.y + nyp * w);
            ctx.quadraticCurveTo(bulgeX + nxp * w * 1.9, bulgeY + nyp * w * 1.9, tx, ty);
            ctx.quadraticCurveTo(bulgeX - nxp * w * 1.9, bulgeY - nyp * w * 1.9, n.x - nxp * w, n.y - nyp * w);
            ctx.closePath();
            ctx.fill();
          };
          drawCone(1.15, 2.2, [
            [0, 'rgba(0,180,255,0.45)'],
            [0.6, 'rgba(0,120,255,0.18)'],
            [1, 'rgba(0,90,255,0)'],
          ]);
          drawCone(1, 1.2, [
            [0, 'rgba(160,250,255,0.95)'],
            [0.35, 'rgba(0,229,255,0.85)'],
            [1, 'rgba(0,140,255,0)'],
          ]);
          drawCone(0.5, 0.55, [
            [0, 'rgba(255,255,255,1)'],
            [1, 'rgba(255,255,255,0)'],
          ]);
        });

        const rate = t < LIFTOFF_MS ? 260 : 420; // sparks per second (all nozzles)
        spawnAccRef.current.thruster += dt * rate;
        while (spawnAccRef.current.thruster >= 1) {
          spawnAccRef.current.thruster -= 1;
          const n = nozzles[Math.random() < 0.5 ? 0 : 1];
          const d = rotateVec(flameDir.x, flameDir.y, (Math.random() - 0.5) * 28);
          const speed = 220 + Math.random() * 260;
          spawn({
            x: n.x,
            y: n.y,
            vx: d.x * speed,
            vy: d.y * speed,
            life: 0,
            maxLife: 0.35 + Math.random() * 0.45,
            size: 1 + Math.random() * 2.2,
            white: Math.random() < 0.35,
          });
        }

        if (t >= LIFTOFF_MS) {
          trail.push({ x: (nozzles[0].x + nozzles[1].x) / 2, y: (nozzles[0].y + nozzles[1].y) / 2, t });
        }
      }

      // Charge-up: energy motes converging into the jetpack
      if (t >= CHARGE_START_MS && t < IGNITION_MS) {
        spawnAccRef.current.charge += dt * 90;
        while (spawnAccRef.current.charge >= 1) {
          spawnAccRef.current.charge -= 1;
          const a = Math.random() * Math.PI * 2;
          const rr = S * (0.7 + Math.random() * 0.4);
          const life = 0.35 + Math.random() * 0.2;
          spawn({
            x: jet.x + Math.cos(a) * rr,
            y: jet.y + Math.sin(a) * rr,
            vx: (-Math.cos(a) * rr) / life,
            vy: (-Math.sin(a) * rr) / life,
            life: 0,
            maxLife: life,
            size: 1 + Math.random() * 1.6,
            white: Math.random() < 0.5,
          });
        }
      }

      // Ambient rising sparkles (summon + hover)
      const ambientRate = t < IGNITION_MS ? 32 : t < LIFTOFF_MS ? 90 : 0;
      spawnAccRef.current.ambient += dt * ambientRate;
      while (spawnAccRef.current.ambient >= 1) {
        spawnAccRef.current.ambient -= 1;
        spawn({
          x: cx + (Math.random() - 0.5) * S * 1.7,
          y: cy + S * 0.65,
          vx: (Math.random() - 0.5) * 12,
          vy: -40 - Math.random() * 60,
          life: 0,
          maxLife: 0.9 + Math.random() * 0.7,
          size: 0.8 + Math.random() * 1.4,
          white: Math.random() < 0.3,
        });
      }

      // ---------- Buddy (crossfade walking -> flying pose at ignition) ----------
      ctx.globalCompositeOperation = 'source-over';
      const { buddyOnline, buddyFlying, bags } = assetsRef.current;
      const cf = clamp01((t - IGNITION_MS) / 250);
      ctx.save();
      ctx.translate(buddyX, buddyY);
      ctx.rotate((rot * Math.PI) / 180);
      ctx.scale(scale, scale);
      const baseAlpha = clamp01(t / 400);
      if (buddyOnline && cf < 1) {
        ctx.globalAlpha = baseAlpha * (1 - cf);
        ctx.drawImage(buddyOnline, -S / 2, -S / 2, S, S);
      }
      if (buddyFlying && cf > 0) {
        ctx.globalAlpha = baseAlpha * cf;
        ctx.drawImage(buddyFlying, -S / 2, -S / 2, S, S);
      }
      ctx.restore();
      ctx.globalAlpha = 1;

      // ---------- Bags (on top) ----------
      bagStates.forEach((bs, i) => {
        const img = bags[i];
        if (!img || !bs.visible) return;
        const size = B * Math.max(0.01, bs.s);
        ctx.save();
        ctx.globalAlpha = clamp01(bs.o);
        ctx.translate(bs.pos.x, bs.pos.y);
        ctx.rotate((bs.r * Math.PI) / 180);
        ctx.shadowColor = 'rgba(0,0,0,0.55)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 6;
        ctx.drawImage(img, -size / 2, -size / 2, size, size);
        ctx.restore();
      });

      ctx.globalCompositeOperation = 'lighter';

      // ---------- Absorption shockwave rings ----------
      [0, 120, 240].forEach((delay) => {
        const p = clamp01((t - SHOCK_MS - delay) / 600);
        if (p <= 0 || p >= 1) return;
        const e = easeOutCubic(p);
        ctx.strokeStyle = `rgba(0,229,255,${(1 - p) * 0.9})`;
        ctx.lineWidth = 4.5 * (1 - p) + 0.5;
        ctx.beginPath();
        ctx.arc(jet.x, jet.y, S * 0.2 + S * 1.3 * e, 0, Math.PI * 2);
        ctx.stroke();
      });

      // ---------- Particles ----------
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += dt;
        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const damp = Math.pow(0.97, dt * 60);
        p.vx *= damp;
        p.vy = p.vy * damp - 30 * dt;
        const a = 1 - p.life / p.maxLife;
        ctx.fillStyle = p.white ? `rgba(255,255,255,${a})` : `rgba(0,229,255,${a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';

      // ---------- HUD banner ----------
      const hIn = clamp01((t - HUD_IN_MS) / 300);
      const hOut = 1 - clamp01((t - HUD_OUT_MS) / 300);
      const hudAlpha = hIn * hOut;
      if (hudAlpha > 0.01) {
        const label = 'GLOVO • UBER EATS • BOLT — INTEGRADAS';
        let fs = Math.max(10.5, Math.min(14, W * 0.03));
        ctx.save();
        ctx.globalAlpha = hudAlpha;
        const ctxLs = ctx as unknown as { letterSpacing?: string };
        const applyHudFont = () => {
          ctx.font = `900 ${fs}px Inter, system-ui, Arial, sans-serif`;
          if ('letterSpacing' in ctx) ctxLs.letterSpacing = `${(fs * 0.16).toFixed(1)}px`;
        };
        applyHudFont();
        let tw = ctx.measureText(label).width;
        const maxTextW = W - 24 - 28;
        if (tw > maxTextW) {
          fs = Math.max(7, fs * (maxTextW / tw));
          applyHudFont();
          tw = ctx.measureText(label).width;
        }
        const bw = tw + 28;
        const bh = fs * 2.4;
        const hx = cx - bw / 2;
        const hy = Math.min(H - bh - 24, cy + S * 0.8) + (1 - hIn) * 10;
        ctx.shadowColor = 'rgba(0,229,255,0.45)';
        ctx.shadowBlur = 18;
        ctx.fillStyle = 'rgba(15,23,42,0.88)';
        ctx.strokeStyle = 'rgba(0,229,255,0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(hx, hy, bw, bh, 7);
        } else {
          ctx.rect(hx, hy, bw, bh);
        }
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.stroke();
        ctx.fillStyle = '#00E5FF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, cx, hy + bh / 2 + 0.5);
        ctx.restore();
      }

      // ---------- Fade in / fade out (baked into the canvas = into the video) ----------
      const fadeOut = clamp01((t - FADE_OUT_MS) / (TOTAL_MS - FADE_OUT_MS));
      const fadeIn = 1 - clamp01(t / 350);
      const veil = Math.max(fadeIn, fadeOut);
      if (veil > 0.001) {
        ctx.fillStyle = `rgba(0,0,0,${veil})`;
        ctx.fillRect(0, 0, W, H);
      }
      if (overlayRef.current && !isRecordingRef.current) {
        overlayRef.current.style.opacity = String(1 - clamp01((t - (TOTAL_MS - 220)) / 220));
      }

      if (t >= TOTAL_MS) {
        if (isRecordingRef.current) {
          if (!recorderStopRequested) {
            recorderStopRequested = true;
            try {
              recorderRef.current?.stop();
            } catch {
              // ignore
            }
          }
        } else {
          finish();
          return;
        }
      } else {
        recorderStopRequested = false;
      }
      raf = window.requestAnimationFrame(frame);
    };

    raf = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(fallbackTimer);
      window.removeEventListener('resize', layout);
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        abortRecordingRef.current = true;
        try {
          recorderRef.current.stop();
        } catch {
          // ignore
        }
      }
      closeAudio();
    };
  }, [open, mode, finish, startAudio, restartTimeline, closeAudio]);

  /** Restarts the animation from t=0 and records the full 7s canvas to a video file. */
  const handleSaveVideo = useCallback(() => {
    if (recordState === 'recording') return;
    const canvas = canvasRef.current;
    if (
      !canvas ||
      typeof MediaRecorder === 'undefined' ||
      typeof canvas.captureStream !== 'function'
    ) {
      setRecordState('unsupported');
      return;
    }
    let stream: MediaStream;
    try {
      stream = canvas.captureStream(120);
    } catch {
      try {
        stream = canvas.captureStream(60);
      } catch {
        setRecordState('unsupported');
        return;
      }
    }
    const audioDest = startAudio(true);
    audioDest?.stream.getAudioTracks().forEach((track) => stream.addTrack(track));

    const mime = pickRecorderMime();
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(
        stream,
        mime
          ? { mimeType: mime, videoBitsPerSecond: VIDEO_BITRATE }
          : { videoBitsPerSecond: VIDEO_BITRATE }
      );
    } catch {
      stream.getTracks().forEach((track) => track.stop());
      setRecordState('unsupported');
      return;
    }

    recordChunksRef.current = [];
    abortRecordingRef.current = false;
    recordStreamRef.current = stream;
    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) recordChunksRef.current.push(ev.data);
    };
    recorder.onstop = () => {
      isRecordingRef.current = false;
      recordStreamRef.current?.getTracks().forEach((track) => track.stop());
      recordStreamRef.current = null;
      if (abortRecordingRef.current) return;
      const type = recorder.mimeType || mime || 'video/webm';
      const blob = new Blob(recordChunksRef.current, { type });
      const ext = type.includes('mp4') ? 'mp4' : 'webm';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `buddy-launch-animation.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.setTimeout(() => URL.revokeObjectURL(url), 15000);
      setRecordState('done');
      window.setTimeout(finish, 900);
    };

    recorderRef.current = recorder;
    isRecordingRef.current = true;
    if (overlayRef.current) overlayRef.current.style.opacity = '1';
    setRecordState('recording');
    restartTimeline();
    recorder.start(250);
  }, [recordState, startAudio, restartTimeline, finish]);

  const handleSkip = useCallback(() => {
    if (isRecordingRef.current) {
      abortRecordingRef.current = true;
      isRecordingRef.current = false;
      try {
        recorderRef.current?.stop();
      } catch {
        // ignore
      }
    }
    finish();
  }, [finish]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-label="Animação de lançamento Delivery Buddy"
      style={{ opacity: 1, willChange: 'opacity' }}
      className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md overflow-hidden select-none touch-none"
    >
      {mode === 'video' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <video
            ref={videoRef}
            src={videoSrc}
            playsInline
            preload="auto"
            onEnded={finish}
            onError={() => setMode('code')}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      )}

      {mode === 'code' && (
        <canvas
          ref={canvasRef}
          style={{ transform: 'translate3d(0,0,0)', willChange: 'transform' }}
          className="absolute inset-0 pointer-events-none"
        />
      )}

      {/* Top-left: Guardar Vídeo (records the full 7s canvas animation) */}
      {mode === 'code' && (
        <button
          type="button"
          onClick={handleSaveVideo}
          disabled={recordState === 'recording'}
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
          className="absolute left-3 inline-flex items-center gap-1.5 rounded-full bg-slate-900/70 border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-200 hover:text-[#00E5FF] cursor-pointer disabled:cursor-default disabled:text-[#00E5FF]"
        >
          {recordState === 'recording' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          <span>
            {recordState === 'recording'
              ? 'A gravar vídeo…'
              : recordState === 'done'
                ? 'Vídeo guardado'
                : recordState === 'unsupported'
                  ? 'Gravação indisponível'
                  : 'Guardar Vídeo'}
          </span>
        </button>
      )}

      {/* Top-right: mute + Saltar */}
      <div
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
        className="absolute right-3 flex items-center gap-2"
      >
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-slate-900/70 border border-slate-700 text-slate-200 hover:text-[#00E5FF] cursor-pointer"
          aria-label={muted ? 'Ativar som' : 'Silenciar'}
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={handleSkip}
          className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/70 border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-200 hover:text-[#00E5FF] cursor-pointer"
        >
          <span>Saltar</span>
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

/**
 * Mount once inside the authenticated cockpit:
 * - auto-plays once per app session (sessionStorage 'buddy_launch_played')
 * - replays on demand via requestBuddyLaunchReplay() (header Buddy icon tap)
 */
export const BuddyLaunchController: React.FC<{
  disabled?: boolean;
  customVideoSrc?: string;
}> = ({ disabled = false, customVideoSrc }) => {
  const [open, setOpen] = useState<boolean>(false);
  const [runKey, setRunKey] = useState<number>(0);

  useEffect(() => {
    if (disabled) return;
    let alreadyPlayed = false;
    try {
      alreadyPlayed = window.sessionStorage.getItem(BUDDY_LAUNCH_SESSION_KEY) === '1';
      window.sessionStorage.setItem(BUDDY_LAUNCH_SESSION_KEY, '1');
    } catch {
      // ignore
    }
    if (!alreadyPlayed) {
      setRunKey((k) => k + 1);
      setOpen(true);
    }
  }, [disabled]);

  useEffect(() => {
    const handler = () => {
      setRunKey((k) => k + 1);
      setOpen(true);
    };
    window.addEventListener(BUDDY_LAUNCH_REPLAY_EVENT, handler);
    return () => window.removeEventListener(BUDDY_LAUNCH_REPLAY_EVENT, handler);
  }, []);

  if (!open) return null;
  return (
    <BuddyLaunchAnimation
      key={runKey}
      open={open}
      onClose={() => setOpen(false)}
      customVideoSrc={customVideoSrc}
    />
  );
};

export default BuddyLaunchAnimation;

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, X } from 'lucide-react';
import {
  BUDDY_AVATARS,
  BUDDY_LAUNCH_REPLAY_EVENT,
  BUDDY_LAUNCH_SESSION_KEY,
  BUDDY_LAUNCH_VIDEO_SRC,
} from '../utils/buddyAvatars';

// =========================================================================
// BUDDY MULTI-PLATFORM JETPACK LAUNCH (60fps 2.5D, 3.2s)
// Stage 1 (0.0–1.0s): Hover & Summon — Buddy + 3 thermal bags materialize
// Stage 2 (1.0–2.1s): Magnetic absorption — tractor beams + spiral into jetpack
// Stage 3 (2.1–3.2s): Plasma ignition — twin thrusters, sparks, skyward liftoff
// Hybrid: plays /assets/buddy-launch.mp4 if present, else the code animation.
// =========================================================================

const TOTAL_MS = 3200;
const SHOCK_MS = 2080;
const IGNITION_MS = 2100;
const LIFTOFF_MS = 2450;
const FADE_OUT_MS = 2950;
const MUTE_STORAGE_KEY = 'buddy_launch_muted_v1';

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

const rotateVec = (x: number, y: number, deg: number) => {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return { x: x * c - y * s, y: x * s + y * c };
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
// Web Audio: synthesized power-up + plasma whoosh (no external files)
// -------------------------------------------------------------------------
function scheduleLaunchSounds(ctx: AudioContext, master: GainNode): void {
  const t0 = ctx.currentTime;

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

  // Plasma thruster whoosh (filtered noise)
  const tIgn = t0 + IGNITION_MS / 1000;
  const dur = 1.1;
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 0.7;
  bp.frequency.setValueAtTime(700, tIgn);
  bp.frequency.exponentialRampToValueAtTime(2600, tIgn + dur);
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.0001, tIgn);
  ng.gain.exponentialRampToValueAtTime(0.07, tIgn + 0.25);
  ng.gain.exponentialRampToValueAtTime(0.0001, tIgn + dur);
  noise.connect(bp).connect(ng).connect(master);
  noise.start(tIgn);
  noise.stop(tIgn + dur);
}

// -------------------------------------------------------------------------
// 100% transparent 3D-styled isometric thermal delivery bags (SVG)
// -------------------------------------------------------------------------
const BAG_THEME: Record<
  BagBrand,
  {
    front: [string, string];
    right: [string, string];
    top: [string, string];
    strap: string;
    seam: string;
    label: string;
  }
> = {
  glovo: {
    front: ['#FFD54F', '#FFC244'],
    right: ['#E8A90C', '#C98F00'],
    top: ['#FFE48A', '#FFD25C'],
    strap: '#00A082',
    seam: '#0F172A',
    label: 'Glovo',
  },
  uber: {
    front: ['#1F2937', '#111827'],
    right: ['#0B1220', '#030712'],
    top: ['#374151', '#1F2937'],
    strap: '#06C167',
    seam: '#06C167',
    label: 'Uber Eats',
  },
  bolt: {
    front: ['#4ADE9A', '#34D186'],
    right: ['#22B36F', '#1A9A5E'],
    top: ['#86EFC0', '#5FE3A6'],
    strap: '#FFFFFF',
    seam: '#0F172A',
    label: 'Bolt Food',
  },
};

const ThermalBagSvg: React.FC<{ brand: BagBrand }> = ({ brand }) => {
  const th = BAG_THEME[brand];
  const id = `bl-${brand}`;
  return (
    <svg
      viewBox="0 0 120 120"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`Mochila térmica ${th.label}`}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={`${id}-f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={th.front[0]} />
          <stop offset="1" stopColor={th.front[1]} />
        </linearGradient>
        <linearGradient id={`${id}-r`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={th.right[0]} />
          <stop offset="1" stopColor={th.right[1]} />
        </linearGradient>
        <linearGradient id={`${id}-t`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={th.top[0]} />
          <stop offset="1" stopColor={th.top[1]} />
        </linearGradient>
      </defs>

      {/* Carry handle over the lid */}
      <path
        d="M44 31 Q60 8 76 31"
        fill="none"
        stroke={th.strap}
        strokeWidth="4.5"
        strokeLinecap="round"
      />

      {/* Lid (top face) */}
      <polygon points="18,34 60,17 102,34 60,51" fill={`url(#${id}-t)`} />
      {/* Front-left face */}
      <polygon points="18,34 60,51 60,106 18,89" fill={`url(#${id}-f)`} />
      {/* Right face */}
      <polygon points="60,51 102,34 102,89 60,106" fill={`url(#${id}-r)`} />

      {/* Zipper seam along the lid edges */}
      <polyline
        points="18,37 60,54 102,37"
        fill="none"
        stroke={th.seam}
        strokeOpacity="0.55"
        strokeWidth="1.4"
        strokeDasharray="2.5 2"
      />
      {/* Edge highlights */}
      <polyline
        points="18,34 60,17 102,34"
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity="0.45"
        strokeWidth="1.2"
      />
      <line x1="60" y1="51" x2="60" y2="106" stroke="#FFFFFF" strokeOpacity="0.18" strokeWidth="1" />

      {/* Shoulder straps on the right face */}
      <g transform="matrix(1,-0.405,0,1,60,51)">
        <rect x="9" y="4" width="5" height="48" rx="1.5" fill={th.strap} opacity="0.92" />
        <rect x="27" y="4" width="5" height="48" rx="1.5" fill={th.strap} opacity="0.92" />
        <rect x="7" y="22" width="27" height="3" rx="1" fill={th.seam} opacity="0.35" />
      </g>

      {/* Brand panel on the front face */}
      <g transform="matrix(1,0.405,0,1,18,34)">
        {brand === 'glovo' && (
          <>
            <rect x="4" y="38" width="34" height="5" rx="1.5" fill={th.strap} />
            <text
              x="21"
              y="27"
              textAnchor="middle"
              fontFamily="Inter, system-ui, sans-serif"
              fontWeight="900"
              fontSize="11"
              fill="#0F172A"
            >
              Glovo
            </text>
          </>
        )}
        {brand === 'uber' && (
          <>
            <rect x="4" y="38" width="34" height="3.5" rx="1.5" fill={th.strap} />
            <text
              x="21"
              y="21"
              textAnchor="middle"
              fontFamily="Inter, system-ui, sans-serif"
              fontWeight="800"
              fontSize="10"
              fill="#FFFFFF"
            >
              Uber
            </text>
            <text
              x="21"
              y="32"
              textAnchor="middle"
              fontFamily="Inter, system-ui, sans-serif"
              fontWeight="900"
              fontSize="10"
              fill={th.strap}
            >
              Eats
            </text>
          </>
        )}
        {brand === 'bolt' && (
          <>
            <rect x="5" y="11" width="32" height="24" rx="3" fill="#FFFFFF" />
            <text
              x="21"
              y="23"
              textAnchor="middle"
              fontFamily="Inter, system-ui, sans-serif"
              fontWeight="900"
              fontSize="9.5"
              fill="#1A9A5E"
            >
              Bolt
            </text>
            <text
              x="21"
              y="31.5"
              textAnchor="middle"
              fontFamily="Inter, system-ui, sans-serif"
              fontWeight="800"
              fontSize="6.5"
              fill="#0F172A"
            >
              FOOD
            </text>
            <rect x="4" y="40" width="34" height="3" rx="1" fill="#0F172A" opacity="0.55" />
          </>
        )}
      </g>
    </svg>
  );
};

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

export const BuddyLaunchAnimation: React.FC<BuddyLaunchAnimationProps> = ({
  open,
  onClose,
  customVideoSrc,
}) => {
  const videoSrc = customVideoSrc || BUDDY_LAUNCH_VIDEO_SRC;
  const [mode, setMode] = useState<LaunchMode>('probe');
  const [muted, setMuted] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(MUTE_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  const overlayRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const buddyRef = useRef<HTMLDivElement | null>(null);
  const bagRefs = useRef<Array<HTMLDivElement | null>>([]);
  const hudRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const closedRef = useRef<boolean>(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const finish = useCallback(() => {
    if (closedRef.current) return;
    closedRef.current = true;
    onCloseRef.current();
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

  // 60fps code animation loop (single rAF, direct DOM/canvas mutation)
  useEffect(() => {
    if (!open || mode !== 'code') return;
    const canvas = canvasRef.current;
    const ctx2d = canvas?.getContext('2d');
    if (!canvas || !ctx2d) return;

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
    };
    layout();
    window.addEventListener('resize', layout);

    // Sound graph
    if (!muted) {
      try {
        const AC =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (AC) {
          const ac = new AC();
          const master = ac.createGain();
          master.gain.value = 1;
          master.connect(ac.destination);
          audioCtxRef.current = ac;
          masterGainRef.current = master;
          void ac.resume().catch(() => undefined);
          scheduleLaunchSounds(ac, master);
        }
      } catch {
        // audio is optional
      }
    }

    const particles: Particle[] = [];
    const trail: Array<{ x: number; y: number; t: number }> = [];
    const start = performance.now();
    let last = start;
    let raf = 0;

    const frame = (now: number) => {
      const t = now - start;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const S = Math.max(150, Math.min(240, Math.min(W, H) * 0.42));
      const cx = W / 2;
      const cy = H * 0.46;
      const R = S * 0.98;
      const B = S * 0.44;

      // ---------- Buddy transform ----------
      const entry = clamp01(t / 520);
      let bx = 0;
      let by = Math.sin(t / 380) * 6 * (t < LIFTOFF_MS ? 1 : 0);
      let rot = 0;
      let scale = 0.86 + 0.14 * easeOutBack(entry);
      const absorbPulse = t >= SHOCK_MS && t < SHOCK_MS + 220
        ? Math.sin(((t - SHOCK_MS) / 220) * Math.PI) * 0.06
        : 0;
      scale += absorbPulse;
      if (t >= IGNITION_MS) {
        rot = -14 * easeOutCubic(clamp01((t - IGNITION_MS) / 300));
      }
      if (t >= IGNITION_MS + 50 && t < LIFTOFF_MS) {
        bx += Math.sin(t * 0.95) * 2.2 + (Math.random() - 0.5) * 1.2;
        by += Math.cos(t * 1.1) * 1.4;
      }
      if (t >= LIFTOFF_MS) {
        const p = clamp01((t - LIFTOFF_MS) / 600);
        by += -(H * 0.62 + S * 1.2) * easeInCubic(p);
        scale *= 1 - 0.15 * p;
      }
      const buddyX = cx + bx;
      const buddyY = cy + by;

      if (buddyRef.current) {
        buddyRef.current.style.width = `${S}px`;
        buddyRef.current.style.height = `${S}px`;
        buddyRef.current.style.opacity = String(clamp01(t / 300));
        buddyRef.current.style.transform = `translate3d(${buddyX - S / 2}px, ${buddyY - S / 2}px, 0) rotate(${rot}deg) scale(${scale})`;
      }

      // Jetpack anchor & twin nozzles relative to Buddy (rotated with him)
      const jetOff = rotateVec(-0.16 * S * scale, -0.15 * S * scale, rot);
      const jet = { x: buddyX + jetOff.x, y: buddyY + jetOff.y };
      const nozzles = [
        rotateVec(-0.26 * S * scale, 0.09 * S * scale, rot),
        rotateVec(-0.13 * S * scale, 0.07 * S * scale, rot),
      ].map((o) => ({ x: buddyX + o.x, y: buddyY + o.y }));
      const flameDir = rotateVec(-0.25, 0.97, rot);

      // ---------- Bags ----------
      const bagPositions: Array<{ x: number; y: number; visible: boolean }> = [];
      BAGS.forEach((bag, i) => {
        const el = bagRefs.current[i];
        const appearAt = 150 + i * 170;
        const mat = clamp01((t - appearAt) / 360);
        const rad = (bag.angleDeg * Math.PI) / 180;
        let x = cx + Math.cos(rad) * R;
        let y = cy + Math.sin(rad) * R + Math.sin(t / 400 + i * 1.7) * 4;
        let s = easeOutBack(mat);
        let o = mat;
        let r = bag.tilt;
        const absorbStart = 1150 + i * 90;
        const p = easeInOutCubic(clamp01((t - absorbStart) / 750));
        if (p > 0) {
          const vx = x - jet.x;
          const vy = y - jet.y;
          const sp = rotateVec(vx, vy, p * 225);
          x = jet.x + sp.x * (1 - p);
          y = jet.y + sp.y * (1 - p);
          s *= 1 - 0.85 * p;
          o = p < 0.85 ? o : o * ((1 - p) / 0.15);
          r += p * 360;
        }
        const visible = o > 0.01 && p < 1;
        bagPositions.push({ x, y, visible });
        if (el) {
          el.style.width = `${B}px`;
          el.style.height = `${B}px`;
          el.style.opacity = visible ? String(o) : '0';
          el.style.transform = `translate3d(${x - B / 2}px, ${y - B / 2}px, 0) rotate(${r}deg) scale(${Math.max(0.01, s)})`;
        }
      });

      // ---------- HUD ----------
      if (hudRef.current) {
        const hIn = clamp01((t - SHOCK_MS) / 220);
        const hOut = 1 - clamp01((t - 2900) / 250);
        hudRef.current.style.opacity = String(hIn * hOut);
        hudRef.current.style.transform = `translate3d(-50%, ${(1 - hIn) * 8}px, 0)`;
        hudRef.current.style.top = `${cy + S * 0.9}px`;
      }

      // ---------- Overlay fade ----------
      if (overlayRef.current) {
        const fadeIn = clamp01(t / 250);
        const fadeOut = 1 - clamp01((t - FADE_OUT_MS) / (TOTAL_MS - FADE_OUT_MS));
        overlayRef.current.style.opacity = String(fadeIn * fadeOut);
      }

      // ---------- Canvas FX ----------
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx2d.clearRect(0, 0, W, H);
      ctx2d.globalCompositeOperation = 'lighter';

      // Pulsing cyan aura (follows Buddy)
      const auraAlpha = 0.32 * clamp01(t / 400) * (1 - clamp01((t - LIFTOFF_MS) / 500));
      if (auraAlpha > 0.005) {
        const ar = S * (0.78 + 0.06 * Math.sin(t / 260));
        const grad = ctx2d.createRadialGradient(buddyX, buddyY, S * 0.2, buddyX, buddyY, ar);
        grad.addColorStop(0, `rgba(0,229,255,${auraAlpha})`);
        grad.addColorStop(1, 'rgba(0,229,255,0)');
        ctx2d.fillStyle = grad;
        ctx2d.beginPath();
        ctx2d.arc(buddyX, buddyY, ar, 0, Math.PI * 2);
        ctx2d.fill();
      }

      // Tractor beams (jetpack -> bags)
      const beamIn = clamp01((t - 1000) / 160);
      if (beamIn > 0 && t < SHOCK_MS) {
        bagPositions.forEach((bp, i) => {
          if (!bp.visible) return;
          const mx = (jet.x + bp.x) / 2;
          const my = (jet.y + bp.y) / 2;
          const nx = -(bp.y - jet.y) * 0.22 * (i % 2 === 0 ? 1 : -1);
          const ny = (bp.x - jet.x) * 0.22 * (i % 2 === 0 ? 1 : -1);
          ctx2d.save();
          ctx2d.shadowColor = '#00E5FF';
          ctx2d.shadowBlur = 14;
          ctx2d.lineCap = 'round';
          // soft outer beam
          ctx2d.strokeStyle = `rgba(0,229,255,${0.22 * beamIn})`;
          ctx2d.lineWidth = 7;
          ctx2d.beginPath();
          ctx2d.moveTo(jet.x, jet.y);
          ctx2d.quadraticCurveTo(mx + nx, my + ny, bp.x, bp.y);
          ctx2d.stroke();
          // bright animated core
          ctx2d.strokeStyle = `rgba(180,250,255,${0.9 * beamIn})`;
          ctx2d.lineWidth = 2;
          ctx2d.setLineDash([10, 8]);
          ctx2d.lineDashOffset = -t * 0.28;
          ctx2d.beginPath();
          ctx2d.moveTo(jet.x, jet.y);
          ctx2d.quadraticCurveTo(mx + nx, my + ny, bp.x, bp.y);
          ctx2d.stroke();
          ctx2d.restore();
        });
      }

      // Absorption shockwave rings
      [0, 90].forEach((delay) => {
        const p = clamp01((t - SHOCK_MS - delay) / 460);
        if (p <= 0 || p >= 1) return;
        const e = easeOutCubic(p);
        ctx2d.save();
        ctx2d.strokeStyle = `rgba(0,229,255,${(1 - p) * 0.9})`;
        ctx2d.shadowColor = '#00E5FF';
        ctx2d.shadowBlur = 18;
        ctx2d.lineWidth = 4.5 * (1 - p) + 0.5;
        ctx2d.beginPath();
        ctx2d.arc(jet.x, jet.y, S * 0.2 + S * 1.25 * e, 0, Math.PI * 2);
        ctx2d.stroke();
        ctx2d.restore();
      });

      // Plasma thrusters + spark particles
      if (t >= IGNITION_MS && t < TOTAL_MS) {
        const intensity = easeOutCubic(clamp01((t - IGNITION_MS) / 220)) *
          (t >= LIFTOFF_MS ? 1.35 : 1);
        nozzles.forEach((n, idx) => {
          const flicker = 0.85 + 0.15 * Math.sin(t / 28 + idx * 2.3) + 0.08 * Math.random();
          const len = S * 0.62 * intensity * flicker;
          const baseW = S * 0.034;
          const nx = -flameDir.y;
          const ny = flameDir.x;

          const drawCone = (lenMul: number, widthMul: number, stops: Array<[number, string]>) => {
            const L = len * lenMul;
            const w = baseW * widthMul;
            const tx = n.x + flameDir.x * L;
            const ty = n.y + flameDir.y * L;
            const bulgeX = n.x + flameDir.x * L * 0.3;
            const bulgeY = n.y + flameDir.y * L * 0.3;
            const g = ctx2d.createLinearGradient(n.x, n.y, tx, ty);
            stops.forEach(([o, c]) => g.addColorStop(o, c));
            ctx2d.fillStyle = g;
            ctx2d.beginPath();
            ctx2d.moveTo(n.x + nx * w, n.y + ny * w);
            ctx2d.quadraticCurveTo(bulgeX + nx * w * 1.9, bulgeY + ny * w * 1.9, tx, ty);
            ctx2d.quadraticCurveTo(bulgeX - nx * w * 1.9, bulgeY - ny * w * 1.9, n.x - nx * w, n.y - ny * w);
            ctx2d.closePath();
            ctx2d.fill();
          };

          // outer plasma glow
          drawCone(1.15, 2.2, [
            [0, 'rgba(0,180,255,0.45)'],
            [0.6, 'rgba(0,120,255,0.18)'],
            [1, 'rgba(0,90,255,0)'],
          ]);
          // cyan body
          drawCone(1, 1.2, [
            [0, 'rgba(160,250,255,0.95)'],
            [0.35, 'rgba(0,229,255,0.85)'],
            [1, 'rgba(0,140,255,0)'],
          ]);
          // white-hot core
          drawCone(0.5, 0.55, [
            [0, 'rgba(255,255,255,1)'],
            [1, 'rgba(255,255,255,0)'],
          ]);


          // spawn sparks (~3 per nozzle per frame -> hundreds total)
          const spawn = t < LIFTOFF_MS ? 2 : 3;
          for (let k = 0; k < spawn; k++) {
            const spread = (Math.random() - 0.5) * 0.7;
            const d = rotateVec(flameDir.x, flameDir.y, spread * 40);
            const speed = 220 + Math.random() * 260;
            particles.push({
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
        });

        // vapor trail anchor (between nozzles)
        if (t >= LIFTOFF_MS) {
          trail.push({
            x: (nozzles[0].x + nozzles[1].x) / 2,
            y: (nozzles[0].y + nozzles[1].y) / 2,
            t,
          });
        }
      }

      // Ambient rising sparkles during summon
      if (t < IGNITION_MS && Math.random() < 0.5) {
        particles.push({
          x: cx + (Math.random() - 0.5) * S * 1.6,
          y: cy + S * 0.6,
          vx: (Math.random() - 0.5) * 12,
          vy: -40 - Math.random() * 50,
          life: 0,
          maxLife: 0.9 + Math.random() * 0.6,
          size: 0.8 + Math.random() * 1.4,
          white: Math.random() < 0.3,
        });
      }

      // Neon vapor trail
      if (trail.length > 1) {
        ctx2d.save();
        ctx2d.lineCap = 'round';
        ctx2d.lineJoin = 'round';
        ctx2d.shadowColor = '#00E5FF';
        ctx2d.shadowBlur = 16;
        for (let i = 1; i < trail.length; i++) {
          const a = trail[i - 1];
          const b = trail[i];
          const age = clamp01((t - b.t) / 650);
          const alpha = (1 - age) * 0.75;
          if (alpha <= 0.01) continue;
          ctx2d.strokeStyle = `rgba(0,229,255,${alpha})`;
          ctx2d.lineWidth = S * 0.09 * (1 - age * 0.6);
          ctx2d.beginPath();
          ctx2d.moveTo(a.x, a.y);
          ctx2d.lineTo(b.x, b.y);
          ctx2d.stroke();
        }
        ctx2d.restore();
      }

      // Particles update & draw
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += dt;
        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.97;
        p.vy = p.vy * 0.97 - 30 * dt;
        const a = 1 - p.life / p.maxLife;
        ctx2d.fillStyle = p.white
          ? `rgba(255,255,255,${a})`
          : `rgba(0,229,255,${a})`;
        ctx2d.beginPath();
        ctx2d.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx2d.fill();
      }
      ctx2d.globalCompositeOperation = 'source-over';

      if (t >= TOTAL_MS) {
        finish();
        return;
      }
      raf = window.requestAnimationFrame(frame);
    };

    raf = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', layout);
      const ac = audioCtxRef.current;
      audioCtxRef.current = null;
      masterGainRef.current = null;
      if (ac) {
        window.setTimeout(() => {
          void ac.close().catch(() => undefined);
        }, 1200);
      }
    };
    // muted intentionally read once at start; live toggles go through master gain
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, finish]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-label="Animação de lançamento Delivery Buddy"
      style={{ opacity: mode === 'video' ? 1 : 0 }}
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
        <>
          <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none"
          />

          {/* Buddy centerpiece on a pure-black radial blend */}
          <div
            ref={buddyRef}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              opacity: 0,
              willChange: 'transform, opacity',
              transformOrigin: '50% 50%',
            }}
            className="pointer-events-none"
          >
            <div
              style={{
                position: 'absolute',
                inset: '-6%',
                borderRadius: '9999px',
                background:
                  'radial-gradient(circle at 50% 50%, #000000 0%, #000000 52%, rgba(0,0,0,0) 72%)',
              }}
            />
            <img
              src={BUDDY_AVATARS.flying}
              alt="Buddy"
              draggable={false}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                WebkitMaskImage:
                  'radial-gradient(circle at 50% 50%, #000 56%, rgba(0,0,0,0) 71%)',
                maskImage:
                  'radial-gradient(circle at 50% 50%, #000 56%, rgba(0,0,0,0) 71%)',
              }}
            />
          </div>

          {/* 3 transparent 3D thermal bags */}
          {BAGS.map((bag, i) => (
            <div
              key={bag.brand}
              ref={(el) => {
                bagRefs.current[i] = el;
              }}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                opacity: 0,
                willChange: 'transform, opacity',
                filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.55))',
              }}
              className="pointer-events-none"
            >
              <ThermalBagSvg brand={bag.brand} />
            </div>
          ))}

          {/* HUD counter */}
          <div
            ref={hudRef}
            style={{ position: 'absolute', left: '50%', top: 0, opacity: 0 }}
            className="pointer-events-none whitespace-nowrap rounded-md border border-[#00E5FF]/40 bg-slate-900/80 px-3 py-1.5 text-[10.5px] sm:text-xs font-black tracking-[0.18em] text-[#00E5FF] shadow-[0_0_18px_rgba(0,229,255,0.35)]"
          >
            GLOVO • UBER EATS • BOLT — INTEGRADAS
          </div>
        </>
      )}

      {/* Controls */}
      <button
        type="button"
        onClick={() => setMuted((m) => !m)}
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
        className="absolute left-3 inline-flex items-center justify-center h-9 w-9 rounded-full bg-slate-900/70 border border-slate-700 text-slate-200 hover:text-[#00E5FF] cursor-pointer"
        aria-label={muted ? 'Ativar som' : 'Silenciar'}
      >
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>
      <button
        type="button"
        onClick={finish}
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
        className="absolute right-3 inline-flex items-center gap-1.5 rounded-full bg-slate-900/70 border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-200 hover:text-[#00E5FF] cursor-pointer"
      >
        <span>Saltar</span>
        <X className="h-3.5 w-3.5" />
      </button>
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

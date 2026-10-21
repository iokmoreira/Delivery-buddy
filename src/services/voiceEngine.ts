import { PlatformName } from '../types/models';

export const BUDDY_VOICE_RATE_STORAGE_KEY = 'buddyVoiceRate_v6_106';
export const BUDDY_VOICE_RATE_MIGRATED_KEY = 'buddyVoiceRate_migrated_v6_106';
export const BUDDY_PREFERRED_VOICE_INDEX_KEY = 'buddy_preferred_voice_idx_v1';
export const DEFAULT_BUDDY_VOICE_RATE = 1.06;
export const DEFAULT_BUDDY_VOICE_PITCH = 0.78;
export const CLOUD_NEURAL_MALE_PLAYBACK_RATE = 1.08;
export const PRIMARY_NEURAL_MALE_VOICES = [
  'Ricardo',
  'pt-PT-DuarteNeural',
  'pt-BR-AntonioNeural',
  'br_005',
] as const;

// Single Global activeAudioRef + Singleton HTMLAudioElement + Monotonic Generation Token so two voices NEVER overlap
export const activeAudioRef: { current: HTMLAudioElement | null } = {
  current: null,
};
let singletonAudioElement: HTMLAudioElement | null = null;
let isSingletonAudioUnlocked = false;
let activeHtml5TtsAudio: HTMLAudioElement | null = null;
let activeHtml5ObjectUrl: string | null = null;
let activeNativeSpeechEndTimer: number | null = null;
let activeOnEndCallback: (() => void) | null = null;
let activeSpeechGenerationId = 0;

// Strict Global Debounce & Cancellation Lock to eliminate double-trigger / echo (1200ms hard lock)
let lastSpokenText = '';
let lastSpokenAt = 0;
export const DUPLICATE_SPEECH_DEBOUNCE_MS = 1200;

function getOrCreateSingletonAudioElement(): HTMLAudioElement | null {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') {
    return null;
  }
  if (!singletonAudioElement) {
    singletonAudioElement = new Audio();
    singletonAudioElement.preload = 'auto';
  }
  return singletonAudioElement;
}

// Unlock singleton HTMLAudioElement on first user interaction so Android WebView allows async play()
if (typeof window !== 'undefined') {
  const unlockAudioOnGesture = () => {
    if (isSingletonAudioUnlocked) return;
    try {
      const el = getOrCreateSingletonAudioElement();
      if (el && el.paused && !activeAudioRef.current) {
        // Silent tiny WAV data URI to unlock WebView media element on user tap
        el.src =
          'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
        el.volume = 0.01;
        const p = el.play();
        if (p && typeof p.then === 'function') {
          p.then(() => {
            el.pause();
            el.currentTime = 0;
            el.volume = 1.0;
            isSingletonAudioUnlocked = true;
          }).catch(() => {
            // ignore
          });
        }
      }
    } catch {
      // ignore
    }
  };
  window.addEventListener('pointerdown', unlockAudioOnGesture, { passive: true });
  window.addEventListener('touchstart', unlockAudioOnGesture, { passive: true });
}

// In-Memory + IndexedDB Blob Cache for zero-latency Neural Male TTS playback
const neuralTtsMemoryCache = new Map<string, Blob>();
const NEURAL_TTS_IDB_NAME = 'buddy_neural_male_tts_cache_v2';
const NEURAL_TTS_IDB_STORE = 'audio_blobs';

function openNeuralTtsCacheDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(NEURAL_TTS_IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(NEURAL_TTS_IDB_STORE)) {
          db.createObjectStore(NEURAL_TTS_IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function getCachedNeuralTtsBlob(key: string): Promise<Blob | null> {
  const mem = neuralTtsMemoryCache.get(key);
  if (mem) return mem;
  const db = await openNeuralTtsCacheDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(NEURAL_TTS_IDB_STORE, 'readonly');
      const store = tx.objectStore(NEURAL_TTS_IDB_STORE);
      const getReq = store.get(key);
      getReq.onsuccess = () => {
        const res = getReq.result;
        if (res instanceof Blob && res.size > 128) {
          neuralTtsMemoryCache.set(key, res);
          resolve(res);
        } else {
          resolve(null);
        }
      };
      getReq.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function setCachedNeuralTtsBlob(key: string, blob: Blob): Promise<void> {
  if (!blob || blob.size <= 128) return;
  neuralTtsMemoryCache.set(key, blob);
  const db = await openNeuralTtsCacheDb();
  if (!db) return;
  try {
    const tx = db.transaction(NEURAL_TTS_IDB_STORE, 'readwrite');
    tx.objectStore(NEURAL_TTS_IDB_STORE).put(blob, key);
  } catch {
    // ignore quota errors
  }
}

export function getSavedBuddyVoiceRate(): number {
  if (typeof window === 'undefined') return DEFAULT_BUDDY_VOICE_RATE;
  try {
    // One-time migration to 1.10x default app voice speed
    const migrated = localStorage.getItem(BUDDY_VOICE_RATE_MIGRATED_KEY);
    if (migrated !== '1') {
      localStorage.setItem(
        BUDDY_VOICE_RATE_STORAGE_KEY,
        String(DEFAULT_BUDDY_VOICE_RATE)
      );
      localStorage.setItem(BUDDY_VOICE_RATE_MIGRATED_KEY, '1');
    }

    const raw = localStorage.getItem(BUDDY_VOICE_RATE_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(
        BUDDY_VOICE_RATE_STORAGE_KEY,
        String(DEFAULT_BUDDY_VOICE_RATE)
      );
      return DEFAULT_BUDDY_VOICE_RATE;
    }
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed >= 0.9 && parsed <= 1.5) {
      return Number(parsed.toFixed(2));
    }
  } catch {
    // ignore storage errors
  }
  return DEFAULT_BUDDY_VOICE_RATE;
}

export function saveBuddyVoiceRate(rate: number): number {
  const clamped = Number(Math.max(0.9, Math.min(1.5, rate)).toFixed(2));
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(BUDDY_VOICE_RATE_STORAGE_KEY, String(clamped));
      const winAny = window as unknown as {
        BuddyNativeOverlay?: {
          setSpeechRate?: (r: number) => void;
        };
      };
      winAny.BuddyNativeOverlay?.setSpeechRate?.(clamped);
    } catch {
      // ignore storage errors
    }
  }
  return clamped;
}

export function getSavedPreferredVoiceIndex(): number {
  if (typeof window === 'undefined') return -1;
  try {
    const raw = localStorage.getItem(BUDDY_PREFERRED_VOICE_INDEX_KEY);
    if (raw === null) return -1;
    const n = Number(raw);
    return Number.isInteger(n) && n >= -1 ? n : -1;
  } catch {
    return -1;
  }
}

export function cyclePreferredDeviceVoice(): string {
  if (typeof window === 'undefined') return 'Automático (Neural Masculina 0.92)';
  try {
    const winAny = window as unknown as {
      BuddyNativeOverlay?: {
        cycleNativePtVoice?: () => string;
      };
    };
    if (typeof winAny.BuddyNativeOverlay?.cycleNativePtVoice === 'function') {
      const nativeLabel = winAny.BuddyNativeOverlay.cycleNativePtVoice();
      if (nativeLabel) return nativeLabel;
    }
  } catch {
    // ignore
  }
  if (!('speechSynthesis' in window)) {
    return 'Automático (Neural Masculina 0.92)';
  }
  const allVoices = window.speechSynthesis.getVoices() || [];
  const ptPool = allVoices.filter((v) =>
    v.lang.toLowerCase().includes('pt')
  );
  const pool = ptPool.length > 0 ? ptPool : allVoices;
  if (pool.length === 0) {
    return 'Automático (Neural Masculina 0.92)';
  }
  const currentIdx = getSavedPreferredVoiceIndex();
  const nextIdx = currentIdx + 1 >= pool.length ? -1 : currentIdx + 1;
  try {
    localStorage.setItem(BUDDY_PREFERRED_VOICE_INDEX_KEY, String(nextIdx));
  } catch {
    // ignore
  }
  if (nextIdx === -1) {
    const autoVoice = selectBestGeminiLikePtVoice(allVoices);
    return autoVoice
      ? `Auto Masculina: ${autoVoice.name}`
      : 'Automático (Neural Masculina 0.92)';
  }
  const picked = pool[nextIdx];
  return `Voz ${nextIdx + 1}/${pool.length}: ${picked.name} (${picked.lang})`;
}

export function selectBestGeminiLikePtVoice(
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | undefined {
  if (!voices || voices.length === 0) return undefined;

  // Check if courier manually cycled to a specific voice index
  const preferredIdx = getSavedPreferredVoiceIndex();
  if (preferredIdx >= 0) {
    const ptPool = voices.filter((v) => v.lang.toLowerCase().includes('pt'));
    const pool = ptPool.length > 0 ? ptPool : voices;
    if (preferredIdx < pool.length) {
      return pool[preferredIdx];
    }
  }

  // Gather all Portuguese voices (both pt-BR and pt-PT so genuine male voices like pte/bmf/jfb/duarte are never skipped)
  const ptVoices = voices.filter((v) => {
    const l = v.lang.toLowerCase();
    const n = `${v.name} ${v.voiceURI || ''}`.toLowerCase();
    return (
      l.includes('pt') ||
      n.includes('pt-br') ||
      n.includes('pt_br') ||
      n.includes('pt-pt') ||
      n.includes('pt_pt') ||
      n.includes('portug')
    );
  });

  if (ptVoices.length === 0) return undefined;

  // Known Android Google/Samsung/Microsoft MALE voice identifiers
  const knownMaleTokens = [
    'pte',
    'bmf',
    'jfb',
    'pmj',
    'daniel',
    'ricardo',
    'antonio',
    'antônio',
    'duarte',
    'fabio',
    'fábio',
    'nicolau',
    'male',
    'masc',
    'homem',
  ];

  // Strictly EXCLUDE all known female identifiers on Android Google TTS, Samsung & Microsoft
  // IMPORTANT: 'afs' (pt-br-x-afs-local / pt-br-x-afs-network) and 'sfs' are FEMALE in Google TTS on Android!
  const knownFemaleTokens = [
    'afs',
    'sfs',
    'fem',
    'luciana',
    'francisca',
    'maria',
    'heloisa',
    'heloísa',
    'raquel',
    'thalita',
    'vitoria',
    'vitória',
    'camila',
    'fernanda',
    'joana',
    'catarina',
    'ines',
    'inês',
    'cristiano_female',
    'mulher',
    'ptc',
    'ptd',
    'bmg',
    'bfs',
    'gfs',
  ];

  // Exclude known female tokens AND exclude index 0 if multiple pt voices exist (unless index 0 explicitly has a male token)
  const nonFemalePool = ptVoices.filter((v, idx) => {
    const descriptor = `${v.name} ${v.voiceURI || ''}`.toLowerCase();
    if (knownFemaleTokens.some((tok) => descriptor.includes(tok))) {
      return false;
    }
    if (
      idx === 0 &&
      ptVoices.length > 1 &&
      !knownMaleTokens.some((m) => descriptor.includes(m))
    ) {
      return false;
    }
    return true;
  });

  const searchPool =
    nonFemalePool.length > 0
      ? nonFemalePool
      : ptVoices.length > 1
        ? ptVoices.slice(1)
        : ptVoices;

  // Tier 1: Explicit Android/Google/Samsung/Microsoft Male Identifiers (pte, bmf, jfb, daniel, ricardo, antonio, duarte, male, masc)
  const priorityMaleKeywords = [
    'pte-network',
    'bmf-network',
    'jfb-network',
    'antonioneural',
    'duarteneural',
    'pte',
    'bmf',
    'jfb',
    'pmj',
    'daniel',
    'ricardo',
    'antonio',
    'antônio',
    'duarte',
    'male',
    'masc',
  ];

  for (const kw of priorityMaleKeywords) {
    const match = searchPool.find((v) =>
      `${v.name} ${v.voiceURI || ''}`.toLowerCase().includes(kw)
    );
    if (match) return match;
  }

  return searchPool[0];
}

export function stopBuddySpeech(): void {
  cancelBuddySpeechNow(false);
}

export function cancelBuddySpeechNow(suppressOnEndCallback = false): void {
  if (typeof window === 'undefined') return;
  activeSpeechGenerationId += 1;
  if (activeNativeSpeechEndTimer !== null) {
    window.clearTimeout(activeNativeSpeechEndTimer);
    activeNativeSpeechEndTimer = null;
  }
  if (activeOnEndCallback) {
    const cb = activeOnEndCallback;
    activeOnEndCallback = null;
    if (!suppressOnEndCallback) {
      try {
        cb();
      } catch {
        // ignore
      }
    }
  }
  try {
    const winAny = window as unknown as {
      BuddyNativeOverlay?: {
        stopSpeaking?: () => void;
        stopNativeTts?: () => void;
      };
    };
    winAny.BuddyNativeOverlay?.stopSpeaking?.();
    winAny.BuddyNativeOverlay?.stopNativeTts?.();
  } catch {
    // ignore
  }
  try {
    if (activeAudioRef.current) {
      activeAudioRef.current.onplay = null;
      activeAudioRef.current.onended = null;
      activeAudioRef.current.onerror = null;
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
      activeAudioRef.current = null;
    }
    if (activeHtml5TtsAudio) {
      activeHtml5TtsAudio.onplay = null;
      activeHtml5TtsAudio.onended = null;
      activeHtml5TtsAudio.onerror = null;
      activeHtml5TtsAudio.pause();
      activeHtml5TtsAudio.currentTime = 0;
      activeHtml5TtsAudio = null;
    }
    if (activeHtml5ObjectUrl) {
      URL.revokeObjectURL(activeHtml5ObjectUrl);
      activeHtml5ObjectUrl = null;
    }
  } catch {
    // ignore
  }
  if (!('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // ignore
  }
}

let sharedChimeCtx: AudioContext | null = null;

export function playBuddyConfirmationChime(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    if (!sharedChimeCtx) {
      sharedChimeCtx = new AudioCtx();
    }
    if (sharedChimeCtx.state === 'suspended') {
      void sharedChimeCtx.resume();
    }
    const now = sharedChimeCtx.currentTime;
    const osc = sharedChimeCtx.createOscillator();
    const gain = sharedChimeCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880, now + 0.07); // A5
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
    osc.connect(gain);
    gain.connect(sharedChimeCtx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  } catch {
    // ignore audio chime errors
  }
}

/**
 * Crisp, pleasant futuristic ascending chime played when opening/maximizing
 * the app from the floating bubble (without speaking "Tela aberta").
 */
export function playBuddyOpenChime(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    if (!sharedChimeCtx) {
      sharedChimeCtx = new AudioCtx();
    }
    if (sharedChimeCtx.state === 'suspended') {
      void sharedChimeCtx.resume();
    }
    const now = sharedChimeCtx.currentTime;
    const notes = [523.25, 659.25, 1046.5]; // C5 -> E5 -> C6
    notes.forEach((freq, idx) => {
      if (!sharedChimeCtx) return;
      const osc = sharedChimeCtx.createOscillator();
      const gain = sharedChimeCtx.createGain();
      const startAt = now + idx * 0.065;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startAt);
      gain.gain.setValueAtTime(0.11, startAt);
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.18);
      osc.connect(gain);
      gain.connect(sharedChimeCtx.destination);
      osc.start(startAt);
      osc.stop(startAt + 0.19);
    });
  } catch {
    // ignore audio chime errors
  }
}

if (typeof window !== 'undefined') {
  (
    window as unknown as { playBuddyOpenChime?: () => void }
  ).playBuddyOpenChime = playBuddyOpenChime;
}

function splitIntoSafeNeuralClauses(text: string, maxUtf8Bytes = 180): string[] {
  const clean = text.trim().replace(/\s+/g, ' ');
  if (!clean) return [];
  const encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
  const byteLen = (s: string) =>
    encoder ? encoder.encode(s).length : s.length * 2;

  if (byteLen(clean) <= maxUtf8Bytes) {
    return [clean];
  }

  // Split by sentence/clause punctuation first
  const rawSegments = clean
    .split(/(?<=[.!?।;:,])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = '';

  const pushOrSplitWords = (segment: string) => {
    if (byteLen(segment) <= maxUtf8Bytes) {
      chunks.push(segment);
      return;
    }
    const words = segment.split(' ');
    let wordBuf = '';
    for (const w of words) {
      const candidate = wordBuf ? `${wordBuf} ${w}` : w;
      if (byteLen(candidate) <= maxUtf8Bytes) {
        wordBuf = candidate;
      } else {
        if (wordBuf) chunks.push(wordBuf);
        wordBuf = w;
      }
    }
    if (wordBuf) chunks.push(wordBuf);
  };

  for (const seg of rawSegments) {
    const candidate = current ? `${current} ${seg}` : seg;
    if (byteLen(candidate) <= maxUtf8Bytes) {
      current = candidate;
    } else {
      if (current) {
        chunks.push(current);
        current = '';
      }
      if (byteLen(seg) <= maxUtf8Bytes) {
        current = seg;
      } else {
        pushOrSplitWords(seg);
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function decodeBase64ToUint8Array(
  b64: string,
  stripId3Header: boolean
): Uint8Array | null {
  try {
    const bin = window.atob(b64.trim());
    const len = bin.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    if (
      stripId3Header &&
      len > 10 &&
      bytes[0] === 0x49 && // 'I'
      bytes[1] === 0x44 && // 'D'
      bytes[2] === 0x33 // '3'
    ) {
      const id3Size =
        ((bytes[6] & 0x7f) << 21) |
        ((bytes[7] & 0x7f) << 14) |
        ((bytes[8] & 0x7f) << 7) |
        (bytes[9] & 0x7f);
      const totalHeaderBytes = 10 + id3Size;
      if (totalHeaderBytes < len) {
        return bytes.subarray(totalHeaderBytes);
      }
    }
    return bytes;
  } catch {
    return null;
  }
}

async function synthesizeNeuralMaleAudioBlob(
  text: string
): Promise<Blob | null> {
  const cleanText = text.trim().replace(/\s+/g, ' ');
  if (!cleanText) return null;
  const cacheKey = `neural_male_v3:${cleanText}`;

  const cached = await getCachedNeuralTtsBlob(cacheKey);
  if (cached) return cached;

  const clauses = splitIntoSafeNeuralClauses(cleanText, 180);
  if (clauses.length === 0) return null;

  try {
    const chunkBuffers = await Promise.all(
      clauses.map(async (clause, idx) => {
        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), 2800);
        try {
          // Primary Cloud Male Neural Stream (br_005 Male Baritone)
          const res = await fetch(
            'https://tiktok-tts.weilnet.workers.dev/api/generation',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: clause,
                voice: 'br_005',
              }),
              signal: controller.signal,
            }
          );
          if (res.ok) {
            const json = (await res.json()) as {
              success?: boolean;
              data?: string;
            };
            if (json?.data && typeof json.data === 'string') {
              const decoded = decodeBase64ToUint8Array(json.data, idx > 0);
              if (decoded && decoded.byteLength > 64) {
                return decoded;
              }
            }
          }

          // Secondary Cloud Male Stream (StreamElements Ricardo Male)
          const seRes = await fetch(
            `https://api.streamelements.com/kappa/v2/speech?voice=Ricardo&text=${encodeURIComponent(
              clause
            )}`,
            { signal: controller.signal }
          );
          if (seRes.ok) {
            const buf = await seRes.arrayBuffer();
            if (buf && buf.byteLength > 64) {
              return new Uint8Array(buf);
            }
          }
          return null;
        } catch {
          return null;
        } finally {
          window.clearTimeout(timer);
        }
      })
    );

    if (chunkBuffers.some((b) => !b || b.byteLength < 64)) {
      return null;
    }

    const validChunks = chunkBuffers as Uint8Array[];
    const totalLength = validChunks.reduce((acc, b) => acc + b.byteLength, 0);
    const merged = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of validChunks) {
      merged.set(chunk, offset);
      offset += chunk.byteLength;
    }

    const blob = new Blob([merged.buffer], { type: 'audio/mpeg' });
    if (blob.size > 256) {
      void setCachedNeuralTtsBlob(cacheKey, blob);
      return blob;
    }
  } catch {
    // ignore
  }
  return null;
}

async function playAudioBlobImmediate(
  blob: Blob,
  rate: number,
  generationId: number,
  onStart?: () => void,
  onEnd?: () => void
): Promise<boolean> {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return false;
  if (generationId !== activeSpeechGenerationId) return false;
  try {
    if (activeAudioRef.current) {
      activeAudioRef.current.onplay = null;
      activeAudioRef.current.onended = null;
      activeAudioRef.current.onerror = null;
      activeAudioRef.current.pause();
    }
    if (activeHtml5ObjectUrl) {
      URL.revokeObjectURL(activeHtml5ObjectUrl);
      activeHtml5ObjectUrl = null;
    }
    const objUrl = URL.createObjectURL(blob);
    activeHtml5ObjectUrl = objUrl;

    const audio = getOrCreateSingletonAudioElement() || new Audio();
    audio.src = objUrl;
    audio.volume = 1.0;
    const targetRate = Math.max(
      0.95,
      Math.min(1.35, rate ? rate * 1.02 : CLOUD_NEURAL_MALE_PLAYBACK_RATE)
    );
    audio.playbackRate = targetRate;
    activeAudioRef.current = audio;
    activeHtml5TtsAudio = audio;

    audio.onplay = () => {
      if (generationId !== activeSpeechGenerationId) {
        audio.pause();
        return;
      }
      isSingletonAudioUnlocked = true;
      onStart?.();
    };
    audio.onended = () => {
      if (activeAudioRef.current === audio) {
        activeAudioRef.current = null;
      }
      if (activeHtml5TtsAudio === audio) {
        activeHtml5TtsAudio = null;
      }
      if (activeHtml5ObjectUrl === objUrl) {
        URL.revokeObjectURL(objUrl);
        activeHtml5ObjectUrl = null;
      }
      if (generationId !== activeSpeechGenerationId) return;
      if (activeOnEndCallback) {
        const cb = activeOnEndCallback;
        activeOnEndCallback = null;
        cb();
      } else {
        onEnd?.();
      }
    };
    audio.onerror = () => {
      if (activeAudioRef.current === audio) {
        activeAudioRef.current = null;
      }
      if (activeHtml5TtsAudio === audio) {
        activeHtml5TtsAudio = null;
      }
      if (activeHtml5ObjectUrl === objUrl) {
        URL.revokeObjectURL(objUrl);
        activeHtml5ObjectUrl = null;
      }
      if (generationId === activeSpeechGenerationId) {
        onEnd?.();
      }
    };

    await audio.play();
    return true;
  } catch {
    if (activeAudioRef.current) {
      activeAudioRef.current = null;
    }
    if (activeHtml5TtsAudio) {
      activeHtml5TtsAudio = null;
    }
    return false;
  }
}

/**
 * Primary Direct Neural Male TTS Audio Stream Player (HTMLAudioElement)
 * with automatic IndexedDB + In-Memory Blob Caching (0ms playback on repeat phrases).
 */
async function tryPlayNeuralMaleAudioStream(
  text: string,
  rate: number,
  generationId: number,
  onStart?: () => void,
  onEnd?: () => void,
  onVoiceResolved?: (label: string) => void
): Promise<boolean> {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return false;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;

  const blob = await synthesizeNeuralMaleAudioBlob(text);
  if (!blob || generationId !== activeSpeechGenerationId) {
    return false;
  }

  const ok = await playAudioBlobImmediate(
    blob,
    rate,
    generationId,
    onStart,
    onEnd
  );
  if (ok) {
    onVoiceResolved?.(
      `Voz Neural Masculina (Ricardo/Duarte • ${CLOUD_NEURAL_MALE_PLAYBACK_RATE}x)`
    );
    return true;
  }
  return false;
}

export function prewarmNeuralMalePhrasesCache(phrases: string[]): void {
  if (typeof window === 'undefined') return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
  window.setTimeout(() => {
    void (async () => {
      for (const p of phrases) {
        if (!p || !p.trim()) continue;
        await synthesizeNeuralMaleAudioBlob(p);
      }
    })();
  }, 600);
}

function playHtml5StreamTtsFallback(
  text: string,
  rate: number,
  onStart?: () => void,
  onEnd?: () => void
): boolean {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return false;
  try {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    if (activeHtml5TtsAudio) {
      activeHtml5TtsAudio.pause();
      activeHtml5TtsAudio = null;
    }
    const cleanChunk = text.trim().slice(0, 190);
    const ttsUrl = `https://translate.googleapis.com/translate_tts?ie=UTF-8&tl=pt-BR&client=tw-ob&q=${encodeURIComponent(
      cleanChunk
    )}`;
    const audio = new Audio(ttsUrl);
    audio.setAttribute('referrerpolicy', 'no-referrer');
    audio.volume = 1.0;
    audio.playbackRate = Math.max(
      0.95,
      Math.min(1.4, rate || DEFAULT_BUDDY_VOICE_RATE)
    );
    activeAudioRef.current = audio;
    activeHtml5TtsAudio = audio;
    audio.onplay = () => onStart?.();
    audio.onended = () => {
      activeAudioRef.current = null;
      activeHtml5TtsAudio = null;
      onEnd?.();
    };
    audio.onerror = () => {
      activeAudioRef.current = null;
      activeHtml5TtsAudio = null;
      onEnd?.();
    };
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        activeAudioRef.current = null;
        activeHtml5TtsAudio = null;
      });
    }
    return true;
  } catch {
    return false;
  }
}

export function speakBuddy(text: string): void {
  speakWithBuddyVoiceEngine({ text });
}

export interface SpeakBuddyVoiceOptions {
  text: string;
  rate?: number;
  pitch?: number;
  isPaused?: boolean;
  skipChime?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
  onVoiceResolved?: (voiceLabel: string) => void;
}

/**
 * Centralized Natural Neural Male Companion Voice Engine (1.05x Default).
 * PRIMARY ENGINE WHEN ONLINE: Direct Neural Male Audio Stream (HTMLAudioElement) with IndexedDB/memory caching.
 * Bypasses Android WebView's female window.speechSynthesis when online!
 */
export function speakWithBuddyVoiceEngine(
  options: SpeakBuddyVoiceOptions
): void {
  const {
    text,
    rate,
    pitch = DEFAULT_BUDDY_VOICE_PITCH,
    isPaused = false,
    skipChime = false,
    onStart,
    onEnd,
    onError,
    onVoiceResolved,
  } = options;

  if (isPaused || !text.trim() || typeof window === 'undefined') {
    return;
  }

  const normalizedText = text.trim().replace(/\s+/g, ' ');
  const nowMs = Date.now();

  // Hard Singleton Debounce Lock: ignore any duplicate speak() call fired within 1200ms of the previous call!
  if (
    nowMs - lastSpokenAt < DUPLICATE_SPEECH_DEBOUNCE_MS &&
    (normalizedText.toLowerCase() === lastSpokenText.toLowerCase() ||
      nowMs - lastSpokenAt < 650)
  ) {
    return;
  }
  lastSpokenText = normalizedText;
  lastSpokenAt = nowMs;

  // Always cancel any ongoing speech & pause/reset activeAudioRef BEFORE starting a new phrase
  cancelBuddySpeechNow(true);
  const currentGenId = activeSpeechGenerationId;
  activeOnEndCallback = onEnd || null;

  const activeRate =
    rate !== undefined && Number.isFinite(rate)
      ? Math.max(0.95, Math.min(1.4, rate))
      : 1.06;

  if (!skipChime) {
    playBuddyConfirmationChime();
  }

  // ENGINE 1 (PRIMARY WHEN ONLINE): Direct Neural Male Audio Stream Player (HTMLAudioElement)
  if (typeof navigator === 'undefined' || navigator.onLine !== false) {
    onStart?.();
    void tryPlayNeuralMaleAudioStream(
      normalizedText,
      activeRate,
      currentGenId,
      onStart,
      onEnd,
      onVoiceResolved
    ).then((playedNeural) => {
      if (playedNeural || currentGenId !== activeSpeechGenerationId) {
        return;
      }
      // Fallback to Android Native Male Voice Selector (pitch = 0.78, rate = 1.06)
      speakOfflineFallback(
        normalizedText,
        1.06,
        0.78,
        onStart,
        onEnd,
        onError,
        onVoiceResolved
      );
    });
    return;
  }

  // ENGINE 2 (OFFLINE FALLBACK): Android Native Male Voice Selector (pitch = 0.78, rate = 1.06)
  speakOfflineFallback(
    normalizedText,
    1.06,
    0.78,
    onStart,
    onEnd,
    onError,
    onVoiceResolved
  );
}

function speakOfflineFallback(
  normalizedText: string,
  activeRate: number,
  pitch: number,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: () => void,
  onVoiceResolved?: (voiceLabel: string) => void
): void {
  // Prioritize window.speechSynthesis with our strict Male Voice Selector + pitch = 0.78 & rate = 1.06
  // so it never uses the Android APK bridge's unpitched index-0 female 'afs' voice!
  if (typeof window !== 'undefined' && Boolean(window.speechSynthesis)) {
    const voices = window.speechSynthesis.getVoices() || [];
    const chosenVoice = selectBestGeminiLikePtVoice(voices);
    speakViaBrowserSpeechSynthesis(
      normalizedText,
      activeRate || 1.06,
      pitch || 0.78,
      chosenVoice,
      onStart,
      onEnd,
      onError,
      onVoiceResolved
    );
    return;
  }

  const winAny = window as unknown as {
    BuddyNativeOverlay?: {
      speakText?: (spokenText: string) => void;
      speakNativeTts?: (spokenText: string) => void;
      setSpeechRate?: (rateVal: number) => void;
    };
  };

  try {
    const nativeSpeakFn =
      winAny.BuddyNativeOverlay?.speakText ||
      winAny.BuddyNativeOverlay?.speakNativeTts;
    if (typeof nativeSpeakFn === 'function') {
      try {
        winAny.BuddyNativeOverlay?.setSpeechRate?.(activeRate || 1.06);
      } catch {
        // ignore
      }
      onStart?.();
      nativeSpeakFn.call(winAny.BuddyNativeOverlay, normalizedText);
      onVoiceResolved?.(`Voz Offline Masculina (${(activeRate || 1.06).toFixed(2)}x)`);
      activeNativeSpeechEndTimer = window.setTimeout(() => {
        activeNativeSpeechEndTimer = null;
        if (activeOnEndCallback) {
          const cb = activeOnEndCallback;
          activeOnEndCallback = null;
          cb();
        }
      }, Math.min(26000, Math.max(1300, Math.round(normalizedText.length * 58))));
      return;
    }
  } catch {
    // ignore
  }

  onError?.();
}

function speakViaBrowserSpeechSynthesis(
  normalizedText: string,
  activeRate: number,
  pitch: number,
  chosenVoice: SpeechSynthesisVoice | undefined,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: () => void,
  onVoiceResolved?: (voiceLabel: string) => void
): void {
  try {
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume?.();

    const safePitch = Math.min(0.82, Math.max(0.72, pitch || 0.78));
    const safeRate = Math.min(1.15, Math.max(1.0, activeRate || 1.06));

    const utterance = new SpeechSynthesisUtterance(normalizedText);
    utterance.lang = chosenVoice?.lang || 'pt-BR';
    utterance.rate = safeRate; // 1.06 natural male pacing
    utterance.pitch = safePitch; // 0.78 clear male baritone pitch
    utterance.volume = 1.0;

    if (chosenVoice) {
      utterance.voice = chosenVoice;
      onVoiceResolved?.(
        `${chosenVoice.name} (${chosenVoice.lang} • Barítono ${safePitch.toFixed(2)})`
      );
    } else {
      onVoiceResolved?.(`Português Barítono Masculino (Pitch ${safePitch.toFixed(2)})`);
    }

    let hasStarted = false;
    utterance.onstart = () => {
      hasStarted = true;
      onStart?.();
    };
    utterance.onend = () => {
      if (activeOnEndCallback) {
        const cb = activeOnEndCallback;
        activeOnEndCallback = null;
        cb();
      } else {
        onEnd?.();
      }
    };
    utterance.onerror = (ev) => {
      activeOnEndCallback = null;
      // Only fall back if utterance failed BEFORE starting (never overlap mid-sentence)
      if (
        !hasStarted &&
        ev?.error !== 'canceled' &&
        ev?.error !== 'interrupted'
      ) {
        playHtml5StreamTtsFallback(normalizedText, activeRate, onStart, onEnd);
      }
      onError?.();
    };

    onStart?.();
    window.speechSynthesis.speak(utterance);
  } catch {
    playHtml5StreamTtsFallback(normalizedText, activeRate, onStart, onEnd);
  }
}

function formatShortNumberPt(val: number): string {
  return val.toFixed(2).replace('.', ',');
}

function formatSpokenEurosPtBr(val: number): string {
  const whole = Math.floor(val);
  const cents = Math.round((val - whole) * 100);
  if (cents > 0) {
    return `${whole} euros e ${cents}`;
  }
  return `${whole} euros`;
}

function formatSpokenPerKmPtBr(val: number): string {
  const whole = Math.floor(val);
  const cents = Math.round((val - whole) * 100);
  if (cents > 0) {
    return `${whole} e ${String(cents).padStart(2, '0')}`;
  }
  return `${whole}`;
}

export function buildSurgicalOfferStreetTts(input: {
  platform: PlatformName;
  verdictCode: 'ACEITAR' | 'RECUSAR';
  netProfitEur: number;
  netEurPerKm: number;
  grossAmountEur?: number;
  isOverweight?: boolean;
  totalWeightKg?: number;
}): string {
  if (input.isOverweight && (input.totalWeightKg ?? 0) > 10) {
    const roundedKg = Math.round(input.totalWeightKg || 14);
    return `Atenção: ${roundedKg} quilos. Diga dividir pedido.`;
  }

  const baseEur = input.grossAmountEur ?? input.netProfitEur;
  const eurosSpoken = formatSpokenEurosPtBr(baseEur);
  const perKmSpoken = formatSpokenPerKmPtBr(input.netEurPerKm);

  if (input.verdictCode === 'ACEITAR') {
    return `${eurosSpoken}, dá ${perKmSpoken} por quilômetro. Compensa!`;
  }

  return `${eurosSpoken}, dá ${perKmSpoken} por quilômetro. Não compensa!`;
}

export function buildSurgicalHeavyOrderStreetTts(totalWeightKg: number): string {
  const roundedKg = Math.max(11, Math.round(totalWeightKg || 14));
  return `Atenção: ${roundedKg} quilos estimados. Diga 'dividir pedido' para acionar suporte.`;
}

export function buildSurgicalMarketQueryStreetTts(
  onlineCouriersCount: number,
  avgEurPerKm: number
): string {
  const rateStr = formatShortNumberPt(avgEurPerKm > 0 ? avgEurPerKm : 1.48);
  return `${onlineCouriersCount} estafetas online agora. Média de ${rateStr} por km nesta hora.`;
}

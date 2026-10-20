import { PlatformName } from '../types/models';

export const BUDDY_VOICE_RATE_STORAGE_KEY = 'buddyVoiceRate';
export const DEFAULT_BUDDY_VOICE_RATE = 1.15;
export const DEFAULT_BUDDY_VOICE_PITCH = 1.0;

let activeHtml5TtsAudio: HTMLAudioElement | null = null;

export function getSavedBuddyVoiceRate(): number {
  if (typeof window === 'undefined') return DEFAULT_BUDDY_VOICE_RATE;
  try {
    const raw = localStorage.getItem(BUDDY_VOICE_RATE_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(
        BUDDY_VOICE_RATE_STORAGE_KEY,
        String(DEFAULT_BUDDY_VOICE_RATE)
      );
      return DEFAULT_BUDDY_VOICE_RATE;
    }
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed >= 1.0 && parsed <= 1.5) {
      return Number(parsed.toFixed(2));
    }
  } catch {
    // ignore storage errors
  }
  return DEFAULT_BUDDY_VOICE_RATE;
}

export function saveBuddyVoiceRate(rate: number): number {
  const clamped = Number(Math.max(1.0, Math.min(1.5, rate)).toFixed(2));
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(BUDDY_VOICE_RATE_STORAGE_KEY, String(clamped));
    } catch {
      // ignore storage errors
    }
  }
  return clamped;
}

export function selectBestGeminiLikePtVoice(
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | undefined {
  if (!voices || voices.length === 0) return undefined;

  const ptVoices = voices.filter((v) => {
    const l = v.lang.toLowerCase();
    return l.includes('pt-br') || l.includes('pt_br') || l.includes('pt');
  });

  if (ptVoices.length === 0) return undefined;

  const ptBrVoices = ptVoices.filter((v) => {
    const l = v.lang.toLowerCase();
    return l.includes('pt-br') || l.includes('pt_br');
  });

  const candidatePool = ptBrVoices.length > 0 ? ptBrVoices : ptVoices;

  const tier1Keywords = [
    'google português do brasil',
    'google portugues do brasil',
    'pt-br-neural',
    'neural',
    'natural',
    'francisca',
    'antonio',
    'thalita',
  ];

  for (const kw of tier1Keywords) {
    const match = candidatePool.find((v) => v.name.toLowerCase().includes(kw));
    if (match) return match;
  }

  const tier2Keywords = ['google', 'premium', 'enhanced', 'luciana', 'microsoft'];
  for (const kw of tier2Keywords) {
    const match = candidatePool.find((v) => v.name.toLowerCase().includes(kw));
    if (match) return match;
  }

  return candidatePool[0];
}

export function cancelBuddySpeechNow(): void {
  if (typeof window === 'undefined') return;
  try {
    const winAny = window as unknown as {
      BuddyNativeOverlay?: { stopNativeTts?: () => void };
    };
    winAny.BuddyNativeOverlay?.stopNativeTts?.();
  } catch {
    // ignore
  }
  try {
    if (activeHtml5TtsAudio) {
      activeHtml5TtsAudio.pause();
      activeHtml5TtsAudio.currentTime = 0;
      activeHtml5TtsAudio = null;
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

function playHtml5StreamTtsFallback(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): boolean {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return false;
  try {
    if (activeHtml5TtsAudio) {
      activeHtml5TtsAudio.pause();
      activeHtml5TtsAudio = null;
    }
    const cleanChunk = text.trim().slice(0, 190);
    const ttsUrl = `https://translate.googleapis.com/translate_tts?ie=UTF-8&tl=pt-PT&client=tw-ob&q=${encodeURIComponent(
      cleanChunk
    )}`;
    const audio = new Audio(ttsUrl);
    audio.setAttribute('referrerpolicy', 'no-referrer');
    audio.volume = 1.0;
    audio.playbackRate = 1.08;
    activeHtml5TtsAudio = audio;
    audio.onplay = () => onStart?.();
    audio.onended = () => {
      activeHtml5TtsAudio = null;
      onEnd?.();
    };
    audio.onerror = () => {
      activeHtml5TtsAudio = null;
      onEnd?.();
    };
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
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
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
  onVoiceResolved?: (voiceLabel: string) => void;
}

/**
 * Centralized Gemini-Style Natural Voice Engine (+15% Faster 1.15x Default).
 * 1. Uses Native Android TextToSpeech (`window.BuddyNativeOverlay.speakText`) when available.
 * 2. Guarantees spoken audio via HTML5 Audio TTS stream (`translate_tts`) on older OTA APK shells.
 * 3. Falls back to Web SpeechSynthesis in desktop browsers.
 */
export function speakWithBuddyVoiceEngine(
  options: SpeakBuddyVoiceOptions
): void {
  const {
    text,
    rate,
    pitch = DEFAULT_BUDDY_VOICE_PITCH,
    isPaused = false,
    onStart,
    onEnd,
    onError,
    onVoiceResolved,
  } = options;

  if (isPaused || !text.trim() || typeof window === 'undefined') {
    return;
  }

  playBuddyConfirmationChime();

  const winAny = window as unknown as {
    BuddyNativeOverlay?: {
      speakText?: (spokenText: string) => void;
      speakNativeTts?: (spokenText: string) => void;
    };
  };

  // 1. Native Android APK TextToSpeech Bridge (speakText / speakNativeTts)
  try {
    const nativeSpeakFn =
      winAny.BuddyNativeOverlay?.speakText ||
      winAny.BuddyNativeOverlay?.speakNativeTts;
    if (typeof nativeSpeakFn === 'function') {
      onStart?.();
      nativeSpeakFn.call(winAny.BuddyNativeOverlay, text.trim());
      onVoiceResolved?.('Voz Nativa Android PT');
      window.setTimeout(() => {
        onEnd?.();
      }, Math.min(8000, Math.max(1500, text.length * 60)));
      return;
    }
  } catch {
    // continue to HTML5 Audio / speechSynthesis fallback
  }

  // 2. Immediate OTA Guarantee for Android APK shells without native speakText:
  // Play HTML5 Audio TTS stream in European Portuguese
  const hasNativeOverlayShell = Boolean(winAny.BuddyNativeOverlay);
  if (hasNativeOverlayShell) {
    const startedStream = playHtml5StreamTtsFallback(text, onStart, onEnd);
    if (startedStream) {
      onVoiceResolved?.('Voz Audio Stream PT-PT (OTA)');
    }
  }

  // 3. Also trigger Web SpeechSynthesis (works on desktop browsers & fallback)
  if (!('speechSynthesis' in window)) {
    if (!hasNativeOverlayShell) {
      playHtml5StreamTtsFallback(text, onStart, onEnd);
    }
    return;
  }

  try {
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume?.();

    const activeRate =
      rate !== undefined && Number.isFinite(rate)
        ? Math.max(1.0, Math.min(1.5, rate))
        : getSavedBuddyVoiceRate();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-PT';
    utterance.rate = activeRate;
    utterance.pitch = pitch;
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const chosenVoice = selectBestGeminiLikePtVoice(voices);
    if (chosenVoice) {
      utterance.voice = chosenVoice;
      onVoiceResolved?.(`${chosenVoice.name} (${chosenVoice.lang})`);
    }

    if (onStart) utterance.onstart = onStart;
    if (onEnd) utterance.onend = onEnd;
    if (onError) {
      utterance.onerror = () => {
        if (!hasNativeOverlayShell) {
          playHtml5StreamTtsFallback(text, onStart, onEnd);
        }
        onError();
      };
    }

    window.speechSynthesis.speak(utterance);
  } catch {
    if (!hasNativeOverlayShell) {
      playHtml5StreamTtsFallback(text, onStart, onEnd);
    }
    onError?.();
  }
}

function formatShortNumberPt(val: number): string {
  return val.toFixed(2).replace('.', ',');
}

function shortPlatformLabel(platform: PlatformName): string {
  if (platform === 'Uber Eats') return 'Uber';
  if (platform === 'Bolt Food') return 'Bolt';
  return 'Glovo';
}

export function buildSurgicalOfferStreetTts(input: {
  platform: PlatformName;
  verdictCode: 'ACEITAR' | 'RECUSAR';
  netProfitEur: number;
  netEurPerKm: number;
  isOverweight?: boolean;
  totalWeightKg?: number;
}): string {
  if (input.isOverweight && (input.totalWeightKg ?? 0) > 10) {
    const roundedKg = Math.round(input.totalWeightKg || 14);
    return `Atenção: ${roundedKg} quilos estimados. Diga 'dividir pedido' para acionar suporte.`;
  }

  const plat = shortPlatformLabel(input.platform);
  const netStr = formatShortNumberPt(input.netProfitEur);
  const kmRateStr = formatShortNumberPt(input.netEurPerKm);

  if (input.verdictCode === 'ACEITAR') {
    return `${plat}: ${netStr} limpos, ${kmRateStr} por km. Vale a pena.`;
  }

  return `${plat}: ${kmRateStr} por km com retorno vazio. Não compensa.`;
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

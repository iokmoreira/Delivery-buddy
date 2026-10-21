import { playBuddyOpenChime } from './voiceEngine';

/**
 * Phonetic variants that Android STT (pt-PT / pt-BR) frequently produces
 * when a courier speaks the wake word "Buddy" on the street.
 */
export const PHONETIC_BUDDY_WAKE_VARIANTS: readonly string[] = [
  'buddy',
  'badi',
  'body',
  'buri',
  'bady',
  'bode',
  'bad',
  'barry',
  'pari',
  'budi',
  'bade',
  'bud',
  'bandi',
  'buney',
  'buni',
  'boni',
  'bunny',
  'bani',
  'bari',
  'pare',
];

export interface WakeWordMatchResult {
  hasWakeWord: boolean;
  matchedVariant: string | null;
  commandAfterWakeWord: string;
  isStandaloneWakeWord: boolean;
  isWakeWordOnly: boolean;
  normalizedTranscript: string;
}

export function normalizeSpeechTranscript(raw: string): string {
  if (!raw) return '';
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,!?;:"'«»()[\]]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes any phonetic variation of "Buddy" (or a custom user trigger word)
 * into the canonical token "buddy" and extracts any trailing command.
 */
export function matchPhoneticWakeWord(
  rawTranscript: string,
  customTriggerWord = 'Buddy'
): WakeWordMatchResult {
  const norm = normalizeSpeechTranscript(rawTranscript);
  if (!norm) {
    return {
      hasWakeWord: false,
      matchedVariant: null,
      commandAfterWakeWord: '',
      isStandaloneWakeWord: false,
      isWakeWordOnly: false,
      normalizedTranscript: '',
    };
  }

  const customNorm = normalizeSpeechTranscript(customTriggerWord);
  const allVariants = Array.from(
    new Set([
      ...(customNorm && customNorm.length >= 2 ? [customNorm] : []),
      ...PHONETIC_BUDDY_WAKE_VARIANTS,
    ])
  );

  // Strip optional greeting prefixes ("ei", "oi", "ola", "hey", "ok")
  const withoutGreeting = norm.replace(/^(ei|oi|ola|hey|ok)\s+/i, '').trim();
  const tokens = withoutGreeting.split(' ').filter(Boolean);

  let matchedVariant: string | null = null;
  let wakeWordTokenIndex = -1;

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (allVariants.includes(tok)) {
      matchedVariant = tok;
      wakeWordTokenIndex = i;
      break;
    }
  }

  if (!matchedVariant || wakeWordTokenIndex === -1) {
    return {
      hasWakeWord: false,
      matchedVariant: null,
      commandAfterWakeWord: withoutGreeting,
      isStandaloneWakeWord: false,
      isWakeWordOnly: false,
      normalizedTranscript: norm,
    };
  }

  // Collapse consecutive repeated wake words (e.g. "buddy buddy clima agora")
  let afterIdx = wakeWordTokenIndex + 1;
  while (afterIdx < tokens.length && allVariants.includes(tokens[afterIdx])) {
    afterIdx += 1;
  }

  const commandAfterWakeWord = tokens.slice(afterIdx).join(' ').trim();
  const isStandaloneWakeWord = commandAfterWakeWord.length === 0;

  const variantRegex = new RegExp(`\\b(${allVariants.join('|')})\\b`, 'gi');
  const normalizedTranscript = norm.replace(variantRegex, 'buddy');

  return {
    hasWakeWord: true,
    matchedVariant,
    commandAfterWakeWord,
    isStandaloneWakeWord,
    isWakeWordOnly: isStandaloneWakeWord,
    normalizedTranscript,
  };
}

export interface VoiceTriggerCallbacks {
  onTranscriptUpdate?: (transcript: string, isFinal: boolean) => void;
  onCommandDetected?: (commandPhrase: string, rawTranscript: string) => void;
  onWakeWindowChange?: (isAwake: boolean, remainingSeconds: number) => void;
  onListeningStateChange?: (isListening: boolean) => void;
  onErrorNotice?: (message: string) => void;
}

interface WebSpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives?: number;
  onstart: (() => void) | null;
  onresult:
    | ((event: {
        resultIndex?: number;
        results: ArrayLike<{
          isFinal?: boolean;
          0: { transcript: string };
        }>;
      }) => void)
    | null;
  onerror: ((event?: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort?: () => void;
}

/**
 * Always-On Phonetic Trigger Word Engine ("Buddy")
 * - Fixes Android WebSpeech microphone timeout & silent dropouts via a 120ms onend/onerror auto-restart
 *   plus a 4000ms watchdog interval that verifies recognition is actively running.
 * - Supports both Single-Breath Commands ("Buddy aceitar pedido") and Two-Step Wake Mode
 *   ("Buddy" -> neon chime + 6s "🎙️ Estou a ouvir..." pill -> next phrase executes directly).
 */
export class AlwaysOnVoiceTriggerEngine {
  private escutaAtiva = false;
  private isPausedByModalOrTts = false;
  private customTriggerWord = 'Buddy';
  private recognition: WebSpeechRecognitionInstance | null = null;
  private isRecognitionRunning = false;
  private restartTimerId: number | null = null;
  private watchdogIntervalId: number | null = null;
  private wakeWindowUntilMs = 0;
  private wakeWindowCountdownId: number | null = null;
  private lastExecutedSignature = '';
  private lastExecutedTimestampMs = 0;
  private lastActivityTimestampMs = 0;
  private callbacks: VoiceTriggerCallbacks = {};

  public configure(options: {
    customTriggerWord?: string;
    callbacks?: VoiceTriggerCallbacks;
  }): void {
    if (options.customTriggerWord !== undefined) {
      this.customTriggerWord = options.customTriggerWord.trim() || 'Buddy';
    }
    if (options.callbacks) {
      this.callbacks = { ...this.callbacks, ...options.callbacks };
    }
  }

  public isActive(): boolean {
    return this.escutaAtiva;
  }

  public isWakeWindowOpen(): boolean {
    return Date.now() < this.wakeWindowUntilMs;
  }

  public openTwoStepWakeWindow(durationMs = 6000): void {
    this.wakeWindowUntilMs = Date.now() + durationMs;
    playBuddyOpenChime();
    this.notifyWakeWindowTick();

    if (this.wakeWindowCountdownId !== null && typeof window !== 'undefined') {
      window.clearInterval(this.wakeWindowCountdownId);
    }
    if (typeof window !== 'undefined') {
      this.wakeWindowCountdownId = window.setInterval(() => {
        this.notifyWakeWindowTick();
      }, 250);
    }
  }

  public closeTwoStepWakeWindow(): void {
    this.wakeWindowUntilMs = 0;
    if (this.wakeWindowCountdownId !== null && typeof window !== 'undefined') {
      window.clearInterval(this.wakeWindowCountdownId);
      this.wakeWindowCountdownId = null;
    }
    this.callbacks.onWakeWindowChange?.(false, 0);
  }

  private notifyWakeWindowTick(): void {
    const remainingMs = Math.max(0, this.wakeWindowUntilMs - Date.now());
    if (remainingMs <= 0) {
      this.closeTwoStepWakeWindow();
      return;
    }
    const remainingSec = Number((remainingMs / 1000).toFixed(1));
    this.callbacks.onWakeWindowChange?.(true, remainingSec);
  }

  public setPaused(paused: boolean): void {
    this.isPausedByModalOrTts = paused;
    if (paused) {
      this.stopRecognitionInstanceOnly();
    } else if (this.escutaAtiva) {
      this.scheduleQuickRestart(120);
    }
  }

  public startAlwaysOnListening(): void {
    if (typeof window === 'undefined') return;
    this.escutaAtiva = true;
    this.callbacks.onListeningStateChange?.(true);
    this.startWatchdogLoop();
    this.bootRecognitionInstance();
  }

  public stopAlwaysOnListening(): void {
    this.escutaAtiva = false;
    this.closeTwoStepWakeWindow();
    if (this.restartTimerId !== null && typeof window !== 'undefined') {
      window.clearTimeout(this.restartTimerId);
      this.restartTimerId = null;
    }
    if (this.watchdogIntervalId !== null && typeof window !== 'undefined') {
      window.clearInterval(this.watchdogIntervalId);
      this.watchdogIntervalId = null;
    }
    this.stopRecognitionInstanceOnly();
    this.callbacks.onListeningStateChange?.(false);
  }

  private startWatchdogLoop(): void {
    if (typeof window === 'undefined') return;
    if (this.watchdogIntervalId !== null) {
      window.clearInterval(this.watchdogIntervalId);
    }
    // 4000ms watchdog: verifies recognition is actively running and revives it if Android paused it
    this.watchdogIntervalId = window.setInterval(() => {
      if (!this.escutaAtiva || this.isPausedByModalOrTts) return;

      const winAny = window as unknown as {
        BuddyNativeOverlay?: {
          startSingleShotVoice?: () => void;
        };
      };
      // If running inside Native Android APK bridge, let native bridge handle mic lock
      if (winAny.BuddyNativeOverlay) {
        return;
      }

      const idleMs = Date.now() - this.lastActivityTimestampMs;
      if (!this.isRecognitionRunning || !this.recognition || idleMs > 14000) {
        this.bootRecognitionInstance();
      }
    }, 4000);
  }

  private scheduleQuickRestart(delayMs = 120): void {
    if (typeof window === 'undefined') return;
    if (!this.escutaAtiva || this.isPausedByModalOrTts) return;
    if (this.restartTimerId !== null) {
      window.clearTimeout(this.restartTimerId);
    }
    this.restartTimerId = window.setTimeout(() => {
      this.restartTimerId = null;
      if (this.escutaAtiva && !this.isPausedByModalOrTts) {
        this.bootRecognitionInstance();
      }
    }, delayMs);
  }

  private stopRecognitionInstanceOnly(): void {
    this.isRecognitionRunning = false;
    if (this.recognition) {
      try {
        this.recognition.onend = null;
        this.recognition.onerror = null;
        this.recognition.onresult = null;
        this.recognition.stop();
      } catch {
        // ignore
      }
      this.recognition = null;
    }
  }

  private bootRecognitionInstance(): void {
    if (typeof window === 'undefined') return;
    if (!this.escutaAtiva || this.isPausedByModalOrTts) return;

    const winAny = window as unknown as {
      BuddyNativeOverlay?: {
        startSingleShotVoice?: () => void;
        startNativeVoice?: () => void;
      };
      SpeechRecognition?: new () => WebSpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => WebSpeechRecognitionInstance;
    };

    if (winAny.BuddyNativeOverlay) {
      return;
    }

    const SpeechRecCtor =
      winAny.SpeechRecognition || winAny.webkitSpeechRecognition;
    if (!SpeechRecCtor) {
      return;
    }

    this.stopRecognitionInstanceOnly();

    try {
      const rec = new SpeechRecCtor();
      rec.lang = 'pt-PT';
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 3;

      rec.onstart = () => {
        this.isRecognitionRunning = true;
        this.lastActivityTimestampMs = Date.now();
        this.callbacks.onListeningStateChange?.(true);
      };

      rec.onresult = (event) => {
        this.lastActivityTimestampMs = Date.now();
        if (this.isPausedByModalOrTts) return;
        const len = event?.results?.length || 0;
        if (len === 0) return;

        const latestResult = event.results[len - 1];
        const rawTranscript = (latestResult?.[0]?.transcript || '').trim();
        const isFinal = Boolean(latestResult?.isFinal);
        if (!rawTranscript) return;

        this.processTranscriptChunk(rawTranscript, isFinal);
      };

      rec.onerror = (errEvent) => {
        this.isRecognitionRunning = false;
        const code = errEvent?.error || '';
        if (code === 'not-allowed' || code === 'service-not-allowed') {
          this.escutaAtiva = false;
          this.callbacks.onListeningStateChange?.(false);
          this.callbacks.onErrorNotice?.(
            'Microfone bloqueado pelo navegador — permita o acesso ao microfone.'
          );
          return;
        }
        // Automatically restart within 120ms on 'no-speech', 'aborted', 'network', 'audio-capture'
        if (this.escutaAtiva && !this.isPausedByModalOrTts) {
          this.scheduleQuickRestart(120);
        }
      };

      rec.onend = () => {
        this.isRecognitionRunning = false;
        if (this.escutaAtiva && !this.isPausedByModalOrTts) {
          this.scheduleQuickRestart(120);
        }
      };

      this.recognition = rec;
      rec.start();
      this.isRecognitionRunning = true;
      this.lastActivityTimestampMs = Date.now();
    } catch {
      this.isRecognitionRunning = false;
      if (this.escutaAtiva && !this.isPausedByModalOrTts) {
        this.scheduleQuickRestart(250);
      }
    }
  }

  /**
   * Processes any transcript chunk (from Web SpeechRecognition OR Native Android SpeechRecognizer)
   * with phonetic "Buddy" wake-word tolerance, Single-Breath execution, and Two-Step Wake Mode.
   */
  public processTranscriptChunk(
    rawTranscript: string,
    isFinal: boolean
  ): boolean {
    const clean = rawTranscript.trim();
    if (!clean) return false;

    this.callbacks.onTranscriptUpdate?.(clean, isFinal);

    const match = matchPhoneticWakeWord(clean, this.customTriggerWord);
    const nowMs = Date.now();

    // Case 1: User just said "Buddy" (or a phonetic alias like "Badi" / "Body" / "Buri")
    if (match.hasWakeWord && match.isStandaloneWakeWord) {
      if (
        isFinal ||
        nowMs - this.lastExecutedTimestampMs > 1200
      ) {
        this.lastExecutedTimestampMs = nowMs;
        this.openTwoStepWakeWindow(6000);
      }
      return false;
    }

    // Case 2: Single-breath command with wake word (e.g. "Buddy aceitar pedido", "Badi clima agora")
    if (match.hasWakeWord && match.commandAfterWakeWord.length >= 3) {
      const cmdNorm = match.commandAfterWakeWord;
      if (this.shouldDispatchCommandNow(cmdNorm, isFinal)) {
        this.recordCommandExecution(cmdNorm);
        this.closeTwoStepWakeWindow();
        this.callbacks.onCommandDetected?.(
          `buddy ${match.commandAfterWakeWord}`,
          clean
        );
        return true;
      }
    }

    // Case 3: Two-Step Wake Window is open (user already said "Buddy" within the last 6 seconds)
    if (this.isWakeWindowOpen() && match.commandAfterWakeWord.length >= 3) {
      const cmdNorm = match.commandAfterWakeWord;
      if (this.shouldDispatchCommandNow(cmdNorm, isFinal)) {
        this.recordCommandExecution(cmdNorm);
        this.closeTwoStepWakeWindow();
        this.callbacks.onCommandDetected?.(
          `buddy ${match.commandAfterWakeWord}`,
          clean
        );
        return true;
      }
    }

    return false;
  }

  private shouldDispatchCommandNow(cmdNorm: string, isFinal: boolean): boolean {
    const nowMs = Date.now();
    if (
      this.lastExecutedSignature === cmdNorm &&
      nowMs - this.lastExecutedTimestampMs < 2200
    ) {
      return false;
    }

    const fastIntentRegex =
      /aceitar\s+pedido|recusar\s+pedido|rejeitar\s+pedido|clima\s+agora|como\s+esta\s+o\s+clima|abrir\s+mapa|minhas\s+estatisticas|ensinar\s+caminho|avisar\s+cliente|ativar\s+sos|dividir\s+pedido|minimizar|maximizar|modo\s+noturno|modo\s+claro|passadeira/;

    if (isFinal) return true;
    if (fastIntentRegex.test(cmdNorm) && cmdNorm.length >= 6) {
      return true;
    }
    return false;
  }

  private recordCommandExecution(cmdNorm: string): void {
    this.lastExecutedSignature = cmdNorm;
    this.lastExecutedTimestampMs = Date.now();
  }
}

export const voiceTriggerEngine = new AlwaysOnVoiceTriggerEngine();

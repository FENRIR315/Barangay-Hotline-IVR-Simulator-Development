// ============================================================================
// BROWSER TEXT-TO-SPEECH (web simulator)
// ============================================================================
// Speaks IVR prompts using the browser's built-in speechSynthesis engine.
// This mirrors the "voice reading" of a real hotline with zero external
// services. Prefers a Tagalog/Filipino voice and falls back to English.
//
// Note: voices load asynchronously in most browsers — call `loadVoices(cb)`
// (or rely on getVoices changing) before the user starts a call.
// ============================================================================

"use client";

let cachedVoices: SpeechSynthesisVoice[] = [];

export interface TtsController {
  muted: boolean;
  rate: number;
  pitch: number;
}

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function loadVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSupported()) return [];
  const voices = window.speechSynthesis.getVoices();
  if (voices.length) cachedVoices = voices;
  return cachedVoices;
}

/** Register a one-shot listener for when the engine's voice list is ready. */
export function onVoicesChanged(callback: () => void): () => void {
  if (!isSpeechSupported()) return () => {};
  const listener = () => {
    cachedVoices = window.speechSynthesis.getVoices();
    callback();
  };
  window.speechSynthesis.onvoiceschanged = listener;
  return () => {
    window.speechSynthesis.onvoiceschanged = null;
  };
}

function pickVoice(preferredLang?: string): SpeechSynthesisVoice | null {
  const voices = loadVoices();
  if (!voices.length) return null;

  const normalize = (lang?: string) => (lang ?? "").toLowerCase().replace("_", "-");

  // 1. Explicit preference (e.g. fil-PH, tl-PH, en-PH, en-US).
  if (preferredLang && preferredLang !== "auto") {
    const target = normalize(preferredLang);
    const exact = voices.find((v) => normalize(v.lang) === target) ?? null;
    if (exact) return exact;
  }

  // 2. Filipino / Tagalog first (matches the requested voice language).
  const filipino =
    voices.find((v) => normalize(v.lang).startsWith("fil")) ??
    voices.find((v) => normalize(v.lang).startsWith("tl")) ??
    null;
  if (filipino) return filipino;

  // 3. Philippine English, then any English.
  const philEnglish =
    voices.find((v) => normalize(v.lang) === "en-ph" || normalize(v.lang) === "en-phl") ?? null;
  if (philEnglish) return philEnglish;
  const anyEnglish =
    voices.find((v) => normalize(v.lang).startsWith("en") && v.localService) ??
    voices.find((v) => normalize(v.lang).startsWith("en")) ??
    null;
  if (anyEnglish) return anyEnglish;

  // 4. Whatever the engine default is.
  return voices[0] ?? null;
}

export function listAvailableVoices(): SpeechSynthesisVoice[] {
  return loadVoices().filter((v) =>
    /^(en|fil|tl)/i.test(v.lang)
  );
}

export function stopSpeech(): void {
  if (!isSpeechSupported()) return;
  window.speechSynthesis.cancel();
}

/**
 * Browsers (notably Chrome) only allow speechSynthesis.speak() after a user
 * gesture / activation. Call this synchronously inside a click handler so the
 * very first utterance of a new "call" is allowed to play.
 */
export function primeSpeech(): void {
  if (!isSpeechSupported()) return;
  const synth = window.speechSynthesis;
  const unlock = new SpeechSynthesisUtterance(" ");
  synth.speak(unlock);
  synth.cancel();
}

/**
 * Speak a prompt. Cancels anything currently playing first (real IVR
 * interrupts the previous message when the caller presses a key).
 *
 * `onEnd` fires once the utterance finishes (some engines fire it twice).
 */
export function speakText(
  text: string,
  opts: { voiceLang?: string; rate?: number; muted?: boolean; onEnd?: () => void } = {}
): void {
  if (!isSpeechSupported() || opts.muted) return;
  const synth = window.speechSynthesis;
  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const voice = pickVoice(opts.voiceLang);
  if (voice) utterance.voice = voice;
  utterance.lang = voice?.lang ?? (opts.voiceLang && opts.voiceLang !== "auto" ? opts.voiceLang : "en-US");
  utterance.rate = opts.rate ?? 1;
  utterance.volume = 1;

  let ended = false;
  utterance.onend = () => {
    if (!ended) opts.onEnd?.();
    ended = true;
  };
  utterance.onerror = () => {
    if (!ended) opts.onEnd?.();
    ended = true;
  };

  synth.speak(utterance);
}
// ============================================================================
// IVR <-> TWILIO (TwiML) BRIDGE
// ============================================================================
// Renders the shared IVR state machine as Twilio markup so the exact same
// menu logic drives the web simulator and a real phone call.
//
// Mapping:
//   - MENU state with options  -> <Say> prompt + <Gather numDigits="1">
//   - ROUTE_TO_OFFICIAL        -> <Say> + <Dial> to an official's phone
//   - RECORD_MESSAGE           -> <Say> + <Record> (voicemail)
//   - COMPLETE                 -> <Say> goodbye + <Hangup>
//
// Pure and side-effect free: this module never talks to the database.
// ============================================================================

import type { IvrSession, IvrAction } from "@/types/ivr";

export const TWILIO_VOICE = "Polly.Maja"; // fil-PH female voice
export const TWILIO_LANGUAGE = "fil-PH";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

interface TwiMLNode {
  tag: string;
  attrs?: Record<string, string>;
  body?: string;
  children?: TwiMLNode[];
}

function node(tag: string, attrs: Record<string, string> = {}, body = "", children: TwiMLNode[] = []): TwiMLNode {
  return { tag, attrs, body, children };
}

function render(n: TwiMLNode): string {
  const attrs = Object.entries(n.attrs ?? {})
    .map(([k, v]) => ` ${k}="${esc(v)}"`)
    .join("");
  if (n.body) return `<${n.tag}${attrs}>${n.body}</${n.tag}>`;
  if (n.children?.length) return `<${n.tag}${attrs}>${n.children.map(render).join("")}</${n.tag}>`;
  return `<${n.tag}${attrs} />`;
}

/** Say a prompt with TTS. Spoken number-in-prompt cleanup is done by the UI. */
function say(text: string): TwiMLNode {
  return node("Say", { voice: TWILIO_VOICE, language: TWILIO_LANGUAGE }, esc(text));
}

function hangup(): TwiMLNode {
  return node("Hangup");
}

export interface TwiMLResponse {
  xml: string;
}

function toResponse(...nodes: TwiMLNode[]): TwiMLResponse {
  return { xml: `<?xml version="1.0" encoding="UTF-8"?><Response>${nodes.map(render).join("")}</Response>` };
}

// ---------------------------------------------------------------------------
// Prompt rendering
// ---------------------------------------------------------------------------

function gatherMenu(promptText: string): TwiMLResponse {
  // Read the options, then collect a single DTMF digit.
  const gather = node(
    "Gather",
    { numDigits: "1", timeout: "8", action: "/api/telephony/handle", method: "POST" },
    "",
    [say(promptText)]
  );
  return toResponse(gather);
}

function routeToOfficial(promptText: string, targetPhone: string): TwiMLResponse {
  // Announce then dial the official; if unanswered, we stay in the flow.
  const dial = node("Dial", { timeout: "25", action: "/api/telephony/dial-status", method: "POST" }, targetPhone);
  return toResponse(say(promptText), dial);
}

function recordMessage(): TwiMLResponse {
  const record = node("Record", {
    action: "/api/telephony/recording",
    method: "POST",
    maxLength: "60",
    finishOnKey: "*",
    playBeep: "true",
  });
  return toResponse(record);
}

// ---------------------------------------------------------------------------
// Public builders
// ---------------------------------------------------------------------------

/** Welcome + main-menu read at call pickup (data-driven, matches simulator). */
export function welcomeTwiML(welcomeText: string, mainMenuText: string): TwiMLResponse {
  return gatherMenu(`${welcomeText} ${mainMenuText}`);
}

/**
 * Build TwiML for any session produced by the shared engine.
 * `targetPhone` is required when the action is ROUTE_TO_OFFICIAL.
 */
export function sessionToTwiML(
  session: IvrSession,
  opts: { targetPhone?: string } = {}
): TwiMLResponse {
  const action = session.action as IvrAction | undefined;
  const promptText = session.prompt?.text ?? "";
  const options = session.prompt?.options as Record<string, string> | undefined;

  if (!action) {
    // First render (welcome): emit the menu even though action may be absent.
    if (options) return gatherMenu(promptText);
    return toResponse(say(promptText), hangup());
  }

  switch (action.type) {
    case "TRANSITION":
      if (options && Object.keys(options).length > 0) return gatherMenu(promptText);
      return toResponse(say(promptText), hangup());
    case "ROUTE_TO_OFFICIAL":
      return routeToOfficial(promptText, opts.targetPhone ?? "");
    case "RECORD_MESSAGE":
      return recordMessage();
    case "COMPLETE":
      return toResponse(say(promptText), hangup());
    default:
      return toResponse(say(promptText), hangup());
  }
}

// ---------------------------------------------------------------------------
// Session persistence helpers (JSON-safe subset of IvrContext)
// ---------------------------------------------------------------------------

export function encodeIvrContext(context: Record<string, unknown>): string {
  return JSON.stringify(context ?? {});
}

export function decodeIvrContext(raw?: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}
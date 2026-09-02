// ============================================================================
// IVR STATE MACHINE ENGINE
// ============================================================================
// A pure, reusable state machine that powers the interactive voice response.
//
// It is intentionally free of any UI or telephony concerns so the exact same
// logic is used by:
//   - the web phone simulator   (button presses produce DtmfInput)
//   - the future telephony provider adapter (real DTMF events)
//   - automated tests
//
// spec §35: "Do not implement the IVR as one giant conditional statement."
// ============================================================================

import type {
  DtmfDigit,
  IvrAction,
  IvrContext,
  IvrPrompt,
  IvrSession,
  IvrStateName,
} from "@/types/ivr";
import {
  REPEAT_LIMIT,
  emergencyMenuPrompt,
  invalidPrompt,
  mainMenuPrompt,
  MENU,
  queueMenuPrompt,
  reportMenuPrompt,
  servicesMenuPrompt,
} from "./menu";

export interface IvrConfig {
  timeoutSec?: number;
  repeatLimit?: number;
}

export function createSession(overrides?: Partial<IvrSession>): IvrSession {
  const now = Date.now();
  return {
    sessionId:
      overrides?.sessionId ?? `ivr_${now}_${Math.random().toString(36).slice(2, 8)}`,
    state: "MAIN_MENU",
    context: {},
    startedAt: now,
    ...overrides,
  };
}

// digit -> target state for MAIN_MENU
const MAIN_MENU_ROUTES: Partial<Record<DtmfDigit, IvrStateName>> = {
  "1": "EMERGENCY_MENU",
  "2": "SERVICES_MENU",
  "3": "REPORT_MENU",
  "4": "ANNOUNCEMENT_MENU",
  "5": "OFFICIAL_MENU",
  "0": "MAIN_MENU", // repeat (0) is handled specially below
};

const EMERGENCY_ROUTES: Partial<Record<DtmfDigit, IvrStateName>> = {
  "1": "MEDICAL",
  "2": "FIRE",
  "3": "DISASTER",
  "4": "OTHER_EMERGENCY",
  "9": "MAIN_MENU",
};

const PROBLEMS: Record<string, string> = {
  "1": "NOISE",
  "2": "GARBAGE",
  "3": "STREETLIGHT",
  "4": "ROAD_DAMAGE",
  "5": "FLOODING",
  "6": "DISTURBANCE",
  "7": "OTHER",
};

const SERVICE_NAMES: Record<string, string> = {
  "1": "Barangay Clearance",
  "2": "Certificate of Residency",
  "3": "Certificate of Indigency",
  "4": "Business Clearance",
  "5": "Other Services",
};

const REPORT_NUMBERS: Record<string, string> = {
  NOISE: "BRGY-2026-000001",
  GARBAGE: "BRGY-2026-000002",
  STREETLIGHT: "BRGY-2026-000003",
  ROAD_DAMAGE: "BRGY-2026-000004",
  FLOODING: "BRGY-2026-000005",
  DISTURBANCE: "BRGY-2026-000006",
  OTHER: "BRGY-2026-000007",
};

const menuPrompt = (state: IvrStateName): IvrPrompt => {
  switch (state) {
    case "MAIN_MENU":
      return mainMenuPrompt();
    case "EMERGENCY_MENU":
      return emergencyMenuPrompt();
    case "SERVICES_MENU":
      return servicesMenuPrompt();
    case "REPORT_MENU":
      return reportMenuPrompt();
    case "QUEUE_MENU":
      return queueMenuPrompt();
    default:
      return { text: "" };
  }
};

const transition = (
  to: IvrStateName,
  prompt: IvrPrompt,
  context: IvrContext
): IvrAction => ({ type: "TRANSITION", to, prompt, context });

const complete = (prompt: IvrPrompt, context: IvrContext): IvrAction => ({
  type: "COMPLETE",
  prompt,
  context,
});

const routeToOfficial = (prompt: IvrPrompt, context: IvrContext): IvrAction => ({
  type: "ROUTE_TO_OFFICIAL",
  prompt,
  context,
});

const recordMessage = (prompt: IvrPrompt, context: IvrContext): IvrAction => ({
  type: "RECORD_MESSAGE",
  prompt,
  context,
});

/**
 * Core IVR reducer. Given the current state, a pressed digit, and the caller
 * context, returns a session describing where to go next plus the prompt to
 * speak/listen to next.
 *
 * Pure and side-effect free: all persistence happens in the caller layer
 * (e.g. the /api/ivr route or telephony adapter).
 */
export function stepIvr(
  state: IvrStateName,
  digit: DtmfDigit,
  context: IvrContext = {}
): IvrSession {
  const ctx: IvrContext = { ...context };
  const now = Date.now();
  const sessionId = `ivr_${now}_${Math.random().toString(36).slice(2, 8)}`;

  const make = (
    nextState: IvrStateName,
    nextContext: IvrContext,
    prompt: IvrPrompt,
    action?: IvrAction
  ): IvrSession => ({
    sessionId,
    state: nextState,
    context: nextContext,
    startedAt: now,
    lastInput: digit,
    action,
    prompt,
  });

  switch (state) {
    case "MAIN_MENU": {
      if (digit === "0") {
        const count = (ctx._repeatCount as number) ?? 0;
        const repeats = count + 1;
        if (repeats > REPEAT_LIMIT) {
          return make("MAIN_MENU", { ...ctx, _repeatCount: repeats }, {
            text: MENU.GOODBYE,
          }, complete({ text: MENU.GOODBYE, options: {} }, ctx));
        }
        return make("MAIN_MENU", { ...ctx, _repeatCount: repeats }, mainMenuPrompt(true), {
          type: "TRANSITION",
          to: "MAIN_MENU",
          prompt: mainMenuPrompt(true),
          context: ctx,
        });
      }
      const route = MAIN_MENU_ROUTES[digit];
      if (route) {
        const prompt = menuPrompt(route);
        return make(route, { ...ctx, _repeatCount: 0 }, prompt, transition(route, prompt, ctx));
      }
      return make("MAIN_MENU", ctx, invalidPrompt(), transition("MAIN_MENU", invalidPrompt(), ctx));
    }

    case "EMERGENCY_MENU": {
      const route = EMERGENCY_ROUTES[digit];
      if (route === "MAIN_MENU") {
        const prompt = menuPrompt("MAIN_MENU");
        return make("MAIN_MENU", { ...ctx, _repeatCount: 0 }, prompt, transition("MAIN_MENU", prompt, ctx));
      }
      if (route) {
        const ctx2: IvrContext = { ...ctx, selectedEmergency: route };
        const promptMap: Record<string, IvrPrompt> = {
          MEDICAL: { text: MENU.MEDICAL },
          FIRE: { text: MENU.FIRE },
          DISASTER: { text: MENU.DISASTER },
          OTHER_EMERGENCY: { text: MENU.OTHER_EMERGENCY },
        };
        const prompt = promptMap[route];
        // Emergency selections route immediately — no extra keypress needed.
        return make(route, ctx2, prompt, routeToOfficial(prompt, ctx2));
      }
      return make("EMERGENCY_MENU", ctx, {
        text: `${MENU.INVALID} ${MENU.EMERGENCY_MENU.text}`,
        options: MENU.EMERGENCY_MENU.options,
      }, transition("EMERGENCY_MENU", { text: MENU.INVALID }, ctx));
    }

    case "MEDICAL":
    case "FIRE":
    case "DISASTER":
    case "OTHER_EMERGENCY":
      // The caller is already being routed to an official. A keypress now
      // simulates the official answering and completing the interaction.
      return make(state, ctx, { text: MENU.GOODBYE }, complete({ text: MENU.GOODBYE }, ctx));

    case "SERVICES_MENU": {
      if (digit === "9") {
        const prompt = menuPrompt("MAIN_MENU");
        return make("MAIN_MENU", { ...ctx, _repeatCount: 0 }, prompt, transition("MAIN_MENU", prompt, ctx));
      }
      const name = SERVICE_NAMES[digit];
      if (name) {
        const ctx2 = { ...ctx, selectedService: name };
        return make("SERVICE_INFO", ctx2, { text: MENU.SERVICE_INFO(name) }, complete({ text: MENU.SERVICE_INFO(name) }, ctx2));
      }
      return make("SERVICES_MENU", ctx, {
        text: `${MENU.INVALID} ${MENU.SERVICES_MENU.text}`,
        options: MENU.SERVICES_MENU.options,
      }, transition("SERVICES_MENU", { text: MENU.INVALID }, ctx));
    }

    case "REPORT_MENU": {
      if (digit === "9") {
        const prompt = menuPrompt("MAIN_MENU");
        return make("MAIN_MENU", { ...ctx, _repeatCount: 0 }, prompt, transition("MAIN_MENU", prompt, ctx));
      }
      const problem = PROBLEMS[digit];
      if (problem) {
        const ctx2 = { ...ctx, selectedProblem: problem };
        return make("REPORT_LOCATION", ctx2, { text: MENU.REPORT_LOCATION }, transition("REPORT_LOCATION", { text: MENU.REPORT_LOCATION }, ctx2));
      }
      return make("REPORT_MENU", ctx, {
        text: `${MENU.INVALID} ${MENU.REPORT_MENU.text}`,
        options: MENU.REPORT_MENU.options,
      }, transition("REPORT_MENU", { text: MENU.INVALID }, ctx));
    }

    case "REPORT_LOCATION":
      // Accept a digit as confirmation of location, proceed to description.
      return make("REPORT_DESCRIPTION", ctx, { text: MENU.REPORT_DESCRIPTION }, transition("REPORT_DESCRIPTION", { text: MENU.REPORT_DESCRIPTION }, ctx));

    case "REPORT_DESCRIPTION": {
      const problem = (ctx.selectedProblem as string) ?? "OTHER";
      const reportNumber = REPORT_NUMBERS[problem] ?? "BRGY-2026-000000";
      const ctx2 = { ...ctx, reportNumber };
      return make("GOODBYE", ctx2, { text: MENU.RECORD_CONFIRMATION(reportNumber) }, complete({ text: MENU.RECORD_CONFIRMATION(reportNumber) }, ctx2));
    }

    case "ANNOUNCEMENT_MENU":
      // Announcements are injected by the application layer (reads active
      // announcements from DB). Any digit here ends the call.
      return make("GOODBYE", ctx, { text: MENU.ANNOUNCEMENT_END }, complete({ text: MENU.ANNOUNCEMENT_END }, ctx));

    case "OFFICIAL_MENU":
      // Availability check happens in the application layer. A digit
      // acknowledges and proceeds to the queue options.
      return make("QUEUE_MENU", ctx, queueMenuPrompt(), transition("QUEUE_MENU", queueMenuPrompt(), ctx));

    case "QUEUE_MENU": {
      if (digit === "1") {
        return make("QUEUE_MENU", ctx, queueMenuPrompt(), transition("QUEUE_MENU", queueMenuPrompt(), ctx));
      }
      if (digit === "2") {
        return make("VOICE_MESSAGE", ctx, { text: MENU.VOICE_MESSAGE }, recordMessage({ text: MENU.VOICE_MESSAGE }, ctx));
      }
      if (digit === "9") {
        const prompt = menuPrompt("MAIN_MENU");
        return make("MAIN_MENU", { ...ctx, _repeatCount: 0 }, prompt, transition("MAIN_MENU", prompt, ctx));
      }
      return make("QUEUE_MENU", ctx, {
        text: `${MENU.INVALID} ${MENU.QUEUE_MENU.text}`,
        options: MENU.QUEUE_MENU.options,
      }, transition("QUEUE_MENU", { text: MENU.INVALID }, ctx));
    }

    case "VOICE_MESSAGE":
      // Recording is handled by the application layer. Any key finishes.
      return make("MESSAGE_RECORDED", ctx, { text: MENU.MESSAGE_RECORDED }, complete({ text: MENU.MESSAGE_RECORDED }, ctx));

    case "MESSAGE_RECORDED":
      return make("GOODBYE", ctx, { text: MENU.GOODBYE }, complete({ text: MENU.GOODBYE }, ctx));

    case "GOODBYE":
      return make("GOODBYE", ctx, { text: MENU.GOODBYE }, complete({ text: MENU.GOODBYE }, ctx));

    default:
      return make("INVALID", ctx, invalidPrompt(), transition("INVALID", invalidPrompt(), ctx));
  }
}
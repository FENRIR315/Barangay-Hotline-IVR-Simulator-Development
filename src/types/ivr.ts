// ============================================================================
// IVR STATE MACHINE TYPES
// ============================================================================
// These types define the IVR state machine used by the web simulator, the
// future real telephony adapter, and automated tests (spec §35).
// The same engine runs everywhere — there is no separate simulator logic.
// ============================================================================

// Every IVR state has a unique identifier.
export type IvrStateName =
  | "MAIN_MENU"
  | "EMERGENCY_MENU"
  | "MEDICAL"
  | "FIRE"
  | "DISASTER"
  | "OTHER_EMERGENCY"
  | "SERVICES_MENU"
  | "SERVICE_INFO"
  | "REPORT_MENU"
  | "REPORT_LOCATION"
  | "REPORT_DESCRIPTION"
  | "ANNOUNCEMENT_MENU"
  | "OFFICIAL_MENU"
  | "QUEUE_MENU"
  | "VOICE_MESSAGE"
  | "MESSAGE_RECORDED"
  | "GOODBYE"
  | "INVALID";

// A keypad digit that the caller can press (DTMF).
export type DtmfDigit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

// Optional data carried along the IVR session (e.g. collected selection).
export interface IvrContext {
  selectedEmergency?: string;
  selectedService?: string;
  selectedProblem?: string;
  location?: string;
  description?: string;
  [key: string]: unknown;
}

// The value emitted when the caller presses a key — this is the event
// driving the state machine.
export type IvrInput = DtmfDigit;

// A rendered prompt: the spoken text plus optional sub-options shown in demo.
export interface IvrPrompt {
  text: string;
  options?: Partial<Record<DtmfDigit, string>>;
}

// The explicit, machine-readable result of stepping the IVR.
export type IvrAction =
  | { type: "TRANSITION"; to: IvrStateName; prompt: IvrPrompt; context: IvrContext }
  | { type: "COMPLETE"; prompt: IvrPrompt; context: IvrContext }
  | { type: "ROUTE_TO_OFFICIAL"; prompt: IvrPrompt; context: IvrContext }
  | { type: "RECORD_MESSAGE"; prompt: IvrPrompt; context: IvrContext };

// The full session state exposed to the UI.
export interface IvrSession {
  sessionId: string;
  state: IvrStateName;
  context: IvrContext;
  startedAt: number;
  lastInput?: DtmfDigit;
  /** The result of the latest step; undefined for a freshly created session. */
  action?: IvrAction;
  /** The prompt that should be spoken/displayed now. */
  prompt?: IvrPrompt;
  /** The number of times a menu has been repeated (used to detect loops). */
  repeatCount?: number;
}

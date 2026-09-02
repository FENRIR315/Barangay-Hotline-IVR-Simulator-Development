// ============================================================================
// SHARED DOMAIN TYPES
// ============================================================================

// Re-export enum-ish string unions used across the app.
export type Role = "CAPTAIN" | "SECRETARY" | "EMERGENCY_OFFICER" | "STAFF";

export type OfficialStatus = "AVAILABLE" | "BUSY" | "OFFLINE";

export type CallStatus =
  | "RINGING"
  | "IN_IVR"
  | "QUEUED"
  | "CONNECTED"
  | "MISSED"
  | "COMPLETED"
  | "ESCALATED"
  | "CANCELLED";

export type CallType =
  | "EMERGENCY"
  | "SERVICE"
  | "COMPLAINT"
  | "ANNOUNCEMENT"
  | "OFFICIAL"
  | "INFORMATION";

export type Priority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

export type EmergencyType = "MEDICAL" | "FIRE" | "DISASTER" | "OTHER";

export type ProblemType =
  | "NOISE"
  | "GARBAGE"
  | "STREETLIGHT"
  | "ROAD_DAMAGE"
  | "FLOODING"
  | "DISTURBANCE"
  | "OTHER";

// Role labels used for display in the dashboard.
export const ROLE_LABELS: Record<Role, string> = {
  CAPTAIN: "Barangay Captain",
  SECRETARY: "Barangay Secretary",
  EMERGENCY_OFFICER: "Emergency Officer",
  STAFF: "Staff",
};

export const STATUS_LABELS: Record<OfficialStatus, string> = {
  AVAILABLE: "Available",
  BUSY: "Busy",
  OFFLINE: "Offline",
};

export const CALL_STATUS_LABELS: Record<CallStatus, string> = {
  RINGING: "Ringing",
  IN_IVR: "In IVR",
  QUEUED: "Queued",
  CONNECTED: "Connected",
  MISSED: "Missed",
  COMPLETED: "Completed",
  ESCALATED: "Escalated",
  CANCELLED: "Cancelled",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
  CRITICAL: "Critical",
};

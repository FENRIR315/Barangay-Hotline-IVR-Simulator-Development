// Quick functional smoke test for the IVR state machine.
// Run with: npx tsx scripts/ivr-smoke-test.ts
import { createSession, stepIvr } from "../src/lib/ivr/engine";

let failures = 0;
const assert = (cond: boolean, label: string) => {
  if (cond) {
    console.log(`  PASS  ${label}`);
  } else {
    failures++;
    console.error(`  FAIL  ${label}`);
  }
};

console.log("IVR smoke test\n");

// 1. Main menu → Emergency → Fire
{
  console.log("Scenario: main menu -> emergency -> fire");
  const s = createSession();
  assert(s.state === "MAIN_MENU", "session starts at MAIN_MENU");

  const s1 = stepIvr("MAIN_MENU", "1", s.context);
  assert(s1.state === "EMERGENCY_MENU", "press 1 -> EMERGENCY_MENU");
  assert(s1.action?.type === "TRANSITION", "action is TRANSITION");
  assert(!!s1.prompt?.text, "prompt carries text");

  const s2 = stepIvr(s1.state, "2", s1.context);
  assert(s2.state === "FIRE", "press 2 -> FIRE");
  assert(s2.action?.type === "ROUTE_TO_OFFICIAL", "FIRE routes to official");
  assert(s2.context.selectedEmergency === "FIRE", "context remembers selection");
}

// 2. Invalid keypad input keeps you on the menu
{
  console.log("Scenario: invalid input");
  const s = createSession();
  const s1 = stepIvr("MAIN_MENU", "8", s.context);
  assert(s1.state === "MAIN_MENU", "unmapped digit stays on MAIN_MENU");
  assert(!!s1.prompt?.text?.includes("not valid"), "invalid prompt shown");
}

// 3. Services
{
  console.log("Scenario: main menu -> services -> clearance info");
  const s = createSession();
  const s1 = stepIvr("MAIN_MENU", "2", s.context);
  assert(s1.state === "SERVICES_MENU", "press 2 -> SERVICES_MENU");

  const s2 = stepIvr(s1.state, "1", s1.context);
  assert(s2.state === "SERVICE_INFO", "press 1 -> SERVICE_INFO");
  assert(s2.action?.type === "COMPLETE", "completes with info message");
  assert(s2.context.selectedService === "Barangay Clearance", "service selection remembered");
}

// 4. Complaint report flow
{
  console.log("Scenario: community problem report");
  const s = createSession();
  const s1 = stepIvr("MAIN_MENU", "3", s.context);
  assert(s1.state === "REPORT_MENU", "press 3 -> REPORT_MENU");

  const s2 = stepIvr(s1.state, "5", s1.context);
  assert(s2.state === "REPORT_LOCATION", "press 5 -> REPORT_LOCATION (FLOODING)");
  assert(s2.context.selectedProblem === "FLOODING", "problem selection remembered");

  const s3 = stepIvr(s2.state, "1", s2.context);
  assert(s3.state === "REPORT_DESCRIPTION", "confirm location -> REPORT_DESCRIPTION");

  const s4 = stepIvr(s3.state, "1", s3.context);
  assert(s4.state === "GOODBYE", "finish description -> GOODBYE");
  assert(s4.action?.type === "COMPLETE", "report completes");
  assert(s4.context.reportNumber === "BRGY-2026-000005", "report number generated");
}

// 5. Official availability / queue
{
  console.log("Scenario: speak to official -> queue");
  const s = createSession();
  const s1 = stepIvr("MAIN_MENU", "5", s.context);
  assert(s1.state === "OFFICIAL_MENU", "press 5 -> OFFICIAL_MENU");

  const s2 = stepIvr(s1.state, "1", s1.context);
  assert(s2.state === "QUEUE_MENU", "acknowledge -> QUEUE_MENU");

  const s3 = stepIvr(s2.state, "2", s2.context);
  assert(s3.state === "VOICE_MESSAGE", "press 2 -> VOICE_MESSAGE");
  assert(s3.action?.type === "RECORD_MESSAGE", "voicemail asked to record");

  const s4 = stepIvr(s3.state, "1", s3.context);
  assert(s4.state === "MESSAGE_RECORDED", "finish message -> MESSAGE_RECORDED");
}

// 6. Repeat menu (0) until limit, then goodbye
{
  console.log("Scenario: repeat limit");
  let s = createSession();
  for (let i = 0; i < 3; i++) {
    s = stepIvr("MAIN_MENU", "0", s.context);
    assert(s.state === "MAIN_MENU", `repeat ${i + 1} stays on MAIN_MENU`);
  }
}

console.log(failures ? `\n${failures} assertion(s) FAILED` : "\nAll assertions passed.");
process.exit(failures ? 1 : 0);
"use client";

import { useEffect, useRef, useState } from "react";
import { PhoneCall, PhoneOff, RotateCcw, Mic, Square, Volume2 } from "lucide-react";
import type { IvrSession } from "@/types/ivr";
import { createSession, stepIvr } from "@/lib/ivr/engine";
import { mainMenuPrompt, MENU } from "@/lib/ivr/menu";
import { PhoneKeypad } from "@/components/phone/PhoneKeypad";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { DtmfDigit } from "@/types/ivr";

type CallPhase = "idle" | "ringing" | "active";

interface SimulatorCall {
  id: string;
}

export function PhoneSimulator() {
  const [callerPhone, setCallerPhone] = useState("0917-555-9999");
  const [phase, setPhase] = useState<CallPhase>("idle");
  const [session, setSession] = useState<IvrSession | null>(null);
  const [simCall, setSimCall] = useState<SimulatorCall | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [recording, setRecording] = useState(false);
  const [lastInput, setLastInput] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---------- call timer ----------
  useEffect(() => {
    if (phase === "active") {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  const fmtClock = () => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // ---------- lifecycle ----------
  const placeCall = async () => {
    setSeconds(0);
    setPhase("ringing");
    setLastInput(null);
    await new Promise((r) => setTimeout(r, 1200));
    try {
      const res = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callerPhone, source: "SIMULATOR" }),
      });
      const data = await res.json();
      if (data.call) setSimCall({ id: data.call.id });
    } catch {
      // DB optional for the demo; keep the call usable even if storage fails.
    }
    const s = createSession();
    s.prompt = mainMenuPrompt(false);
    setSession(s);
    setPhase("active");
  };

  const endCall = async (status: "COMPLETED" | "CANCELLED" = "COMPLETED") => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
    if (simCall?.id) {
      try {
        await fetch(`/api/calls/${simCall.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, durationSec: seconds }),
        });
      } catch {
        // ignore
      }
    }
    setSimCall(null);
    setSession(null);
    setLastInput(null);
    setPhase("idle");
  };

  const reset = () => {
    void endCall("CANCELLED");
  };

  // ---------- keypad handling ----------
  const pressDigit = async (digit: string) => {
    if (phase !== "active" || !session || recording) return;
    const next = stepIvr(session.state, digit as DtmfDigit, session.context);
    setLastInput(digit);
    setSession(next);

    // Handle actions produced by the IVR engine.
    if (next.action?.type === "RECORD_MESSAGE") {
      setRecording(true);
    }
  };

  // Simulate a finished recording.
  const finishRecording = async () => {
    setRecording(false);
    if (!session) return;
    setSession(stepIvr("VOICE_MESSAGE", "1", session.context));
  };

  // Start the simulated voicemail capture (shown as a recording panel).
  const startRecording = () => {
    setRecording(true);
  };

  // Simulate the default DTMF confirmation key for flows that collect info.
  const confirmKey = async () => {
    if (phase !== "active" || !session || recording || !simCall) return;
    const next = stepIvr(session.state, "1", session.context);
    setLastInput("1");
    setSession(next);
    if (next.action?.type === "RECORD_MESSAGE") setRecording(true);
  };

  // ---------- derived display ----------
  const prompt = session?.prompt ?? mainMenuPrompt(false);

  const isEmergencyFlow =
    session !== null &&
    (session.context.selectedEmergency !== undefined ||
      ["MEDICAL", "FIRE", "DISASTER", "OTHER_EMERGENCY"].includes(session.state));

  const isRouting =
    session?.action?.type === "ROUTE_TO_OFFICIAL" ||
    (session !== null &&
      ["MEDICAL", "FIRE", "DISASTER", "OTHER_EMERGENCY"].includes(session.state));

  const isComplete = session?.action?.type === "COMPLETE";

  return (
    <div className="mx-auto w-full max-w-sm">
      {/* Phone frame */}
      <div className="rounded-[2rem] border border-gray-300 bg-gray-900 p-3 shadow-xl">
        <div className="rounded-[1.5rem] bg-white px-4 pb-5 pt-4">
          {/* Speaker */}
          <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-gray-300" />

          {/* Display */}
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                Barangay Hotline
              </p>
              <p className="font-mono text-sm font-bold text-blue-900">09XX-XXX-XXXX</p>
            </div>
            <Badge variant={phase === "active" ? "danger" : "secondary"}>
              {phase === "idle" ? "IDLE" : phase === "ringing" ? "RINGING" : "LIVE"}
            </Badge>
          </div>

          {/* Caller number */}

          {phase === "idle" || phase === "ringing" ? (
            <div className="flex h-[14rem] flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <PhoneCall className="h-7 w-7" />
              </div>
              <p className="text-sm font-medium text-gray-700">
                {phase === "ringing" ? "Connecting…" : "BarangayConnect Hotline"}
              </p>
              <p className="max-w-[13rem] text-xs text-gray-500">
                {phase === "ringing"
                  ? "Please wait while we connect you."
                  : "Press Call to begin the automated voice menu."}
              </p>
              {phase === "ringing" && (
                <div className="h-5 w-5 animate-ping rounded-full bg-blue-400" />
              )}
            </div>
          ) : (
            <>
              {/* Prompt */}
              <div className="mb-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="mb-1 flex items-center gap-1.5">
                  <Volume2 className="h-3.5 w-3.5 text-blue-700" />
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    System says
                  </p>
                </div>
                <p className="text-xs leading-relaxed text-gray-800">{prompt.text}</p>
                {isEmergencyFlow && (
                  <div className="mt-2">
                    <Badge variant="danger">EMERGENCY</Badge>
                  </div>
                )}
              </div>

              {/* Options */}
              {prompt.options && Object.keys(prompt.options).length > 0 && !isRouting && (
                <div className="mb-3 grid grid-cols-2 gap-1.5">
                  {Object.entries(prompt.options).map(([key, label]) => (
                    <div
                      key={key}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px]",
                        lastInput === key ? "border-blue-300 bg-blue-50" : "border-gray-200"
                      )}
                    >
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-gray-900 text-[9px] font-bold text-white">
                        {key}
                      </span>
                      <span className="truncate text-gray-700">{label}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Recording panel */}
              {recording && (
                <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3">
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-red-700">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-red-600" />
                      Recording…
                    </p>
                    <Button size="sm" variant="outline" onClick={finishRecording}>
                      <Square className="h-3 w-3" /> Finish
                    </Button>
                  </div>
                  <p className="mt-1 text-[10px] text-red-600/80">
                    Demo message capture — stored locally in this session.
                  </p>
                </div>
              )}

              {/* Transfer simulation */}
              {isRouting && !isComplete && !recording && (
                <div className="mb-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
                  <p className="text-xs font-medium text-blue-800">
                    Connecting you to a barangay official…
                  </p>
                  <p className="mt-1 text-[10px] leading-relaxed text-blue-600">
                    DEMO: This simulated transfer would route to the next available
                    official. Availability is checked from the officials list.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="default" onClick={confirmKey}>
                      <PhoneCall className="h-3 w-3" /> Simulate answer
                    </Button>
                    <Button size="sm" variant="outline" onClick={startRecording}>
                      <Mic className="h-3 w-3" /> Leave message
                    </Button>
                  </div>
                </div>
              )}

              {/* Status line */}
              <div className="mb-3 flex items-center justify-between rounded-lg bg-gray-900 px-3 py-2 text-white">
                <span className="font-mono text-xs">{fmtClock()}</span>
                <span className="text-[10px] uppercase tracking-wider text-gray-300">
                  {lastInput ? `Pressed ${lastInput}` : "Awaiting input"}
                </span>
              </div>
            </>
          )}

          {/* Keypad */}
          <PhoneKeypad onPress={(d) => void pressDigit(d)} disabled={phase !== "active" || recording} />

          {/* Call controls */}
          <div className="mt-4 flex items-center justify-center gap-4">
            {phase === "idle" ? (
              <Button
                variant="success"
                className="flex items-center gap-2 rounded-full px-6"
                onClick={() => void placeCall()}
              >
                <PhoneCall className="h-4 w-4" />
                Call
              </Button>
            ) : (
              <>
                <Button
                  variant="destructive"
                  className="flex items-center gap-2 rounded-full px-5"
                  onClick={() => void endCall()}
                >
                  <PhoneOff className="h-4 w-4" />
                  End
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 rounded-full px-5"
                  onClick={reset}
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Caller number input */}
      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-3">
        <label htmlFor="caller-phone" className="mb-1 block text-[11px] font-medium text-gray-500">
          Simulated caller number
        </label>
        <input
          id="caller-phone"
          value={callerPhone}
          onChange={(e) => setCallerPhone(e.target.value)}
          disabled={phase !== "idle"}
          className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm text-gray-900 disabled:bg-gray-50 disabled:text-gray-400"
        />
      </div>

      <p className="mt-3 text-center text-[10px] text-gray-400">
        {MENU.UNABLE_TO_CONNECT.split(".")[0]}. Demo mode — no real telephone calls.
      </p>
    </div>
  );
}
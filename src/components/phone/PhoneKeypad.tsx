"use client";

import type { DtmfDigit } from "@/types/ivr";
import { cn } from "@/lib/utils";

interface PhoneKeypadProps {
  onPress: (digit: DtmfDigit) => void;
  disabled?: boolean;
}

const ROWS: (DtmfDigit | "star" | "hash")[][] = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["star", "0", "hash"],
];

const LABELS: Record<DtmfDigit, string> = {
  "1": "",
  "2": "ABC",
  "3": "DEF",
  "4": "GHI",
  "5": "JKL",
  "6": "MNO",
  "7": "PQRS",
  "8": "TUV",
  "9": "WXYZ",
  "0": "+",
};

export function PhoneKeypad({ onPress, disabled }: PhoneKeypadProps) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {ROWS.flat().map((key) => {
        if (key === "star" || key === "hash") {
          return (
            <button
              key={key}
              type="button"
              disabled
              className="flex h-14 items-center justify-center rounded-xl bg-gray-100 text-gray-300"
              aria-label={key === "star" ? "Star" : "Hash"}
            >
              {key === "star" ? "*" : "#"}
            </button>
          );
        }
        return (
          <button
            key={key}
            type="button"
            onClick={() => onPress(key)}
            disabled={disabled}
            className={cn(
              "flex h-14 flex-col items-center justify-center rounded-xl bg-gray-100 text-lg font-semibold text-gray-900 transition-colors",
              "hover:bg-blue-100 active:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-40"
            )}
            aria-label={`Press ${key}`}
          >
            <span>{key}</span>
            {LABELS[key] && (
              <span className="text-[9px] font-normal uppercase tracking-wide text-gray-500">
                {LABELS[key]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
"use client";

import { cn } from "@repo/ui/lib/utils";
import {
  calculateRiskScore,
  riskLevelFromScore,
  type RiskLevel,
} from "@repo/schema";

interface RiskMatrixGridProps {
  likelihood: number;
  severity: number;
  onSelect?: (likelihood: number, severity: number) => void;
  /** When true the cell is purely informational. */
  readOnly?: boolean;
  caption?: string;
}

const LIKELIHOOD_LABELS = [
  "Rare (1)",
  "Unlikely (2)",
  "Possible (3)",
  "Likely (4)",
  "Almost Certain (5)",
];

const SEVERITY_LABELS = [
  "Negligible (1)",
  "Minor (2)",
  "Moderate (3)",
  "Major (4)",
  "Catastrophic (5)",
];

function levelClass(level: RiskLevel): string {
  switch (level) {
    case "Extreme":
      return "bg-red-600 text-white";
    case "High":
      return "bg-red-500 text-white";
    case "Moderate":
      return "bg-amber-500 text-white";
    case "Low":
      return "bg-emerald-700 text-white";
  }
}

export function RiskMatrixGrid({
  likelihood,
  severity,
  onSelect,
  readOnly,
  caption,
}: RiskMatrixGridProps) {
  return (
    <div className="space-y-2 w-full font-sans">
      {caption && (
        <p className="text-md font-bold text-slate-800">
          {caption}
        </p>
      )}
      <div className="rounded-xl border border-slate-200 bg-white p-2.5 sm:p-3 w-full overflow-x-auto">
        <div
          className="grid gap-1.5 w-full min-w-[360px]"
          style={{ gridTemplateColumns: "minmax(95px, 125px) repeat(5, minmax(0, 1fr))" }}
        >
          <div />
          {SEVERITY_LABELS.map((label, i) => {
            const [name, num] = label.split(" ");
            return (
              <div
                key={`s-${i}`}
                className="text-center font-semibold text-slate-700 text-md leading-tight px-0.5"
                title={label}
              >
                <span>{name}</span>
                {num && (
                  <span className="block text-slate-500 font-medium">{num}</span>
                )}
              </div>
            );
          })}
          {LIKELIHOOD_LABELS.map((rowLabel, rowIdx) => {
            // Render rows from top (5) to bottom (1) for natural risk-matrix orientation
            const l = 5 - rowIdx;
            return (
              <div key={`row-${l}`} className="contents">
                <div
                  className="self-center text-right pr-1.5 font-semibold text-slate-700 text-md leading-tight truncate"
                  title={LIKELIHOOD_LABELS[l - 1]}
                >
                  {LIKELIHOOD_LABELS[l - 1]}
                </div>
                {SEVERITY_LABELS.map((_, sevIdx) => {
                  const s = sevIdx + 1;
                  const score = calculateRiskScore(l, s);
                  const level = riskLevelFromScore(score);
                  const isSelected = l === likelihood && s === severity;
                  return (
                    <button
                      type="button"
                      key={`cell-${l}-${s}`}
                      disabled={readOnly}
                      onClick={() => onSelect?.(l, s)}
                      className={cn(
                        "h-8 sm:h-9 w-full rounded-lg font-bold text-md transition-all flex items-center justify-center",
                        levelClass(level),
                        readOnly ? "cursor-default" : "hover:scale-105 cursor-pointer",
                        isSelected
                          ? "ring-2 ring-offset-2 ring-slate-900 z-10"
                          : "opacity-90",
                      )}
                      aria-label={`Likelihood ${l}, Severity ${s}, score ${score}`}
                    >
                      {score}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

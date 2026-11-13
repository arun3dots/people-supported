import type { ReactNode } from "react";
import { PRE_ADMISSION_ADL_ACTIVITIES } from "@repo/schema";
import type { PartsState } from "../partsState";

export type SummaryRow = [label: string, value: ReactNode];

export const hasValue = (v: unknown): boolean =>
  Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined && v !== "";

const dash = (v: string | null | undefined) => (v && v.trim() ? v : null);

export const joinSummaryValues = (
  xs: Array<string | null | undefined>,
  sep = " · ",
) => xs.filter((x): x is string => !!x && !!x.trim()).join(sep);

export const summaryLines = (xs: string[]): ReactNode =>
  xs.length ? (
    <span className="flex flex-col">
      {xs.map((x, i) => (
        <span key={i}>{x}</span>
      ))}
    </span>
  ) : null;

export const DNACPR_LABELS: Record<string, string> = {
  NotDiscussed: "Not discussed yet",
  InPlace: "In place",
  NotInPlace: "Discussed, not in place",
  Declined: "Declined",
};

export const ADL_ACTIVITY_LABELS: Record<string, string> = Object.fromEntries(
  PRE_ADMISSION_ADL_ACTIVITIES.map(({ key, label }) => [key, label]),
);

export function buildAdlRows(
  d: PartsState["partD"],
  hasSavedAdls: boolean,
): SummaryRow[] {
  if (!hasSavedAdls) return [];
  return Object.entries(d.adlChecklist).flatMap(([key, activity]) => {
    const label = ADL_ACTIVITY_LABELS[key] ?? key;
    const value = joinSummaryValues([activity?.assistanceLevel, activity?.comments]);
    return value ? [[label, value] as SummaryRow] : [];
  });
}

export function buildCapacityRows(e: PartsState["partE"]): SummaryRow[] {
  const move = e.moveDecision;
  const dols = e.dolsScreen;

  return [
    [
      "Move decision",
      move
        ? joinSummaryValues(
            [
              move.hasCapacity === false
                ? "Lacks capacity for this decision"
                : move.hasCapacity
                  ? "Has capacity"
                  : null,
              move.assessedAt ? `assessed ${move.assessedAt}` : null,
              move.bestInterests?.decisionMaker
                ? `best-interests decision with ${move.bestInterests.decisionMaker}`
                : null,
            ],
            "; ",
          )
        : null,
    ],
    ["Wishes", dash(e.wishes)],
    [
      "DoLS screen",
      dols
        ? joinSummaryValues(
            [
              dols.outcome,
              dols.rationale,
              dols.rescreenTrigger ? `re-screen if ${dols.rescreenTrigger}` : null,
            ],
            "; ",
          )
        : null,
    ],
    [
      "Consents",
      dash(
        e.consents
          .map((x) => `${x.name}${x.given ? "" : " (not given)"}`)
          .join(", "),
      ),
    ],
  ];
}

export function buildAdvanceCareRows(f: PartsState["partF"]): SummaryRow[] {
  return [
    ["DNACPR", DNACPR_LABELS[f.dnacpr.status] ?? f.dnacpr.status],
    ["ReSPECT", f.respect.inPlace ? "In place" : "None"],
    ["Plan", joinSummaryValues([f.plan, f.planOwner, f.planTargetDate])],
  ];
}

export function buildAboutMeRows(g: PartsState["partG"]): SummaryRow[] {
  return [
    ["Loves", dash(g.loves)],
    [
      "Routine",
      joinSummaryValues(
        [
          g.routine?.wakeTime ? `up about ${g.routine.wakeTime}` : null,
          g.routine?.bedTime ? `bed about ${g.routine.bedTime}` : null,
          g.routine?.bedtimeNotes,
        ],
        ", ",
      ),
    ],
    [
      "Bathing",
      joinSummaryValues(
        [
          g.bathing?.preference,
          g.bathing?.days?.join(", "),
          g.bathing?.carerGender ? `${g.bathing.carerGender} carer` : null,
        ],
        "; ",
      ),
    ],
    [
      "Worries",
      joinSummaryValues(
        [g.worries, g.whatHelps ? `helps: ${g.whatHelps}` : null],
        "; ",
      ),
    ],
  ];
}

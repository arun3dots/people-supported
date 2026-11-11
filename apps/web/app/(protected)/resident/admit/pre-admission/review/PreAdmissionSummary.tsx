"use client";

import type { ReactNode } from "react";
import {
  CARE_AREAS,
  PRE_ADMISSION_ADL_ACTIVITIES,
  PRE_ADMISSION_NEED_AREAS,
} from "@repo/schema";
import { InfoField, Text } from "@repo/ui/components/ui";
import {
  useGetAssessmentQuery,
  useListNeedCarePlansQuery,
} from "../../../../../../lib/queries/care-journey";
import { useGetRiskAssessmentsQuery } from "../../../../../../lib/queries/risk";
import { SUPPORT_LEVEL_LABELS } from "../../../care-journey/shared";
import type { PartsState } from "../usePreAdmissionWizard";

type Row = [label: string, value: ReactNode];

const has = (v: unknown): boolean =>
  Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined && v !== "";
const dash = (v: string | null | undefined) => (v && v.trim() ? v : null);
const join = (xs: Array<string | null | undefined>, sep = " · ") =>
  xs.filter((x): x is string => !!x && !!x.trim()).join(sep);
const lines = (xs: string[]): ReactNode =>
  xs.length ? (
    <span className="flex flex-col">
      {xs.map((x, i) => (
        <span key={i}>{x}</span>
      ))}
    </span>
  ) : null;

const LEGACY_AREA_LABELS: Record<string, string> = {
  mobility: "Mobility",
  falls: "Falls",
  eating: "Eating",
  continence: "Continence",
  skin: "Skin",
  senses: "Senses",
};

const DNACPR_LABELS: Record<string, string> = {
  NotDiscussed: "Not discussed yet",
  InPlace: "In place",
  NotInPlace: "Discussed, not in place",
  Declined: "Declined",
};
const ADL_ACTIVITY_LABELS: Record<string, string> = Object.fromEntries(
  PRE_ADMISSION_ADL_ACTIVITIES.map(({ key, label }) => [key, label]),
);

function SummaryCard({ title, rows }: { title: string; rows: Row[] }) {
  const filled = rows.filter(([, v]) => has(v));
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3">
      <Text as="h3" size="md" weight="bold" className="text-slate-900">
        {title}
      </Text>
      {filled.length === 0 ? (
        <Text size="md" className="text-slate-500">
          Nothing recorded yet.
        </Text>
      ) : (
        <div className="space-y-2">
          {filled.map(([label, value], idx) => (
            <InfoField
              key={`${label}-${idx}`}
              label={label}
              value={value}
              multiline
              className="flex-row items-start gap-3"
              labelClassName="w-36 shrink-0 text-slate-500 font-medium text-md"
              valueClassName="flex-1 text-slate-900 text-md"
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function PreAdmissionSummary({
  parts,
  residentId,
  hasSavedAdls = false,
}: {
  parts: PartsState;
  residentId?: string | null;
  hasSavedAdls?: boolean;
}) {
  const { partA: a, partB: b, partC: c, partD: d, partE: e, partF: f, partG: g } = parts;
  const safeId = residentId ?? "";
  const { data: riskAssessments } = useGetRiskAssessmentsQuery(
    { residentId: safeId },
    { enabled: !!residentId },
  );
  const { data: assessment } = useGetAssessmentQuery(safeId);
  const { data: plans } = useListNeedCarePlansQuery(safeId);

  const activeAssessments = (riskAssessments ?? []).filter((ra) => ra.status !== "Archived");
  const planByArea = new Map((plans ?? []).map((p) => [p.areaKey, p]));

  const assessmentRows: Row[] = CARE_AREAS.map((area): Row => {
    const need = assessment?.needs.find((n) => n.areaKey === area.key);
    const plan = planByArea.get(area.key);
    const levelLabel = need?.supportLevel
      ? `${need.supportLevel} (${SUPPORT_LEVEL_LABELS[need.supportLevel]})`
      : null;
    return [
      area.label,
      join([
        need?.found,
        levelLabel,
        plan ? `Plan: ${plan.area}` : null,
      ]),
    ];
  }).filter(([, v]) => has(v));

  const legacyRows: Row[] = PRE_ADMISSION_NEED_AREAS.map((area): Row => {
    const x = d.areas[area];
    return [
      LEGACY_AREA_LABELS[area] ?? area,
      join([x?.summary, x?.supportLevel ? `support ${x.supportLevel}` : null], " · "),
    ];
  });
  const adlRows: Row[] = hasSavedAdls
    ? Object.entries(d.adlChecklist).flatMap(([key, activity]) => {
        const label = ADL_ACTIVITY_LABELS[key] ?? key;
        const value = join([
          activity?.assistanceLevel,
          activity?.comments,
        ]);
        return value ? [[label, value] as Row] : [];
      })
    : [];

  const lpaFor = (type: string) =>
    b.lpa
      .filter((l) => l.type === type)
      .map((l) =>
        join([
          l.holderName,
          l.registeredYear ? `registered ${l.registeredYear}` : null,
          l.copySeen ? "copy seen" : null,
        ]),
      );
  const move = e.moveDecision;
  const dols = e.dolsScreen;

  const cards: Array<{ title: string; rows: Row[] }> = [
    {
      title: "A · Admission and personal details",
      rows: [
        ["Full name", join([a.firstName, a.middleName, a.lastName], " ") || null],
        ["Preferred name", dash(a.preferredName)],
        ["Date of birth", dash(a.dob)],
        ["Gender", dash(a.gender)],
        ["Marital status", dash(a.maritalStatus)],
        ["NHS number", dash(a.nhsNumber)],
        ["Previous address", dash(a.previousAddress)],
        ["National ID / Passport", dash(a.nationalId)],
        ["Preferred language", dash(a.language)],
        ["Languages spoken", a.languagesSpoken?.length ? a.languagesSpoken.join(", ") : null],
        ["Interpreter required", a.interpreterRequired ? "Yes (Interpreter needed)" : "No"],
        ["Type of stay", dash(a.stayType)],
        ["Type of care", dash(a.typeOfCare)],
        ["Level of care", dash(a.careLevel)],
        ["Admitted from", join([a.admittedFrom, a.referringFacilityName], ", ")],
        ["Reason", dash(a.admissionReason)],
        ["Expected admission date", dash(a.expectedAdmissionDate)],
        ["Religion", dash(a.religion)],
        ["Former job", dash(a.formerOccupation)],
        ["Their view", a.residentView ? <em>“{a.residentView}”</em> : null],
      ],
    },
    {
      title: "B · Contacts and legal authority",
      rows: [
        [
          "Next of kin",
          lines(
            b.nextOfKin.map((n) =>
              join([`${n.name}${n.relationship ? ` (${n.relationship})` : ""}`, n.phone, n.availabilityNote], " "),
            ),
          ),
        ],
        ["LPA Health & Welfare", lines(lpaFor("Health & Welfare"))],
        ["LPA Property & Finance", lines(lpaFor("Property & Finance"))],
        ["Other authority", lines(b.otherLegalAuthority.map((o) => `${o.type}: ${o.holderName}`))],
        ["Social worker", join([b.socialWorker?.name, b.socialWorker?.organisation], ", ")],
        ["GP", join([b.gp?.name, b.gp?.practice], ", ")],
      ],
    },
    {
      title: "C · Health and medicines",
      rows: [
        ["Primary diagnosis", dash(c.primaryDiagnosis || c.diagnoses[0])],
        ...(c.secondaryDiagnoses?.length || c.diagnoses.length > 1
          ? [
              [
                "Secondary diagnoses",
                dash(
                  c.secondaryDiagnoses?.length
                    ? c.secondaryDiagnoses.join(", ")
                    : c.diagnoses.slice(1).join(", "),
                ),
              ] as Row,
            ]
          : []),
        ...(c.medicalHistory
          ? [["Medical history", dash(c.medicalHistory)] as Row]
          : []),
        [
          "Allergies",
          c.noKnownAllergies
            ? "No known allergies"
            : lines(c.allergies.map((x) => join([x.substance, x.reaction], " — "))),
        ],
        [
          "Medicines",
          lines(
            c.medicines.map((m) =>
              join(
                [
                  m.name,
                  m.dose,
                  m.form ?? m.route,
                  m.frequency,
                  m.scheduleType === "single"
                    ? m.scheduledTime
                    : m.times?.length
                      ? join(
                          [
                            `Daily at ${m.times.join(", ")}`,
                            m.startDate && m.endDate
                              ? `${m.startDate} to ${m.endDate}`
                              : null,
                          ],
                          " · ",
                        )
                      : null,
                  m.prn ? "when needed" : null,
                  m.prescriber ? `Prescriber: ${m.prescriber}` : null,
                  m.instructions,
                  m.mandatoryObservations?.length
                    ? `Observations: ${m.mandatoryObservations.join(", ")}`
                    : null,
                  m.imageUrls?.length
                    ? `${m.imageUrls.length} medication image(s)`
                    : null,
                  m.allowLateAdministration ? "Late administration allowed" : null,
                ],
                " ",
              ),
            ),
          ),
        ],
        ["Pain", join([c.pain?.summary, c.pain?.tool ? `uses ${c.pain.tool}` : null, c.pain?.score !== null && c.pain?.score !== undefined ? `score ${c.pain.score}/10` : null], "; ")],
        ...(c.heightCm || c.weightKg
          ? [
              [
                "Measurements",
                join(
                  [
                    c.heightCm ? `${c.heightCm} cm` : null,
                    c.weightKg ? `${c.weightKg} kg` : null,
                    c.heightCm && c.weightKg && c.heightCm > 0
                      ? `BMI ${(c.weightKg / Math.pow(c.heightCm / 100, 2)).toFixed(1)} kg/m²`
                      : null,
                  ],
                  " · ",
                ),
              ] as Row,
            ]
          : []),
      ],
    },
    {
      title: "D · Risk assessment",
      rows: activeAssessments.map((ra): Row => {
        const level = ra.residualLevel ?? ra.inherentLevel;
        const score = ra.residualScore ?? ra.inherentScore;
        return [
          ra.title,
          join([ra.tool, level, score !== null ? `Score ${score}` : null]),
        ];
      }),
    },
    {
      title: "E · Care needs assessment",
      rows: assessmentRows.length > 0 ? assessmentRows : legacyRows,
    },
    {
      title: "F · Activities of Daily Living (ADLs)",
      rows: adlRows,
    },
    {
      title: "G · Capacity, consent, DoLS",
      rows: [
        [
          "Move decision",
          move
            ? join(
                [
                  move.hasCapacity === false ? "Lacks capacity for this decision" : move.hasCapacity ? "Has capacity" : null,
                  move.assessedAt ? `assessed ${move.assessedAt}` : null,
                  move.bestInterests?.decisionMaker ? `best-interests decision with ${move.bestInterests.decisionMaker}` : null,
                ],
                "; ",
              )
            : null,
        ],
        ["Wishes", dash(e.wishes)],
        ["DoLS screen", dols ? join([dols.outcome, dols.rationale, dols.rescreenTrigger ? `re-screen if ${dols.rescreenTrigger}` : null], "; ") : null],
        ["Consents", dash(e.consents.map((x) => `${x.name}${x.given ? "" : " (not given)"}`).join(", "))],
      ],
    },
    {
      title: "H · Advance care planning",
      rows: [
        ["DNACPR", DNACPR_LABELS[f.dnacpr.status] ?? f.dnacpr.status],
        ["ReSPECT", f.respect.inPlace ? "In place" : "None"],
        ["Plan", join([f.plan, f.planOwner, f.planTargetDate], " · ")],
      ],
    },
    {
      title: "I · About me",
      rows: [
        ["Loves", dash(g.loves)],
        ["Routine", join([g.routine?.wakeTime ? `up about ${g.routine.wakeTime}` : null, g.routine?.bedTime ? `bed about ${g.routine.bedTime}` : null, g.routine?.bedtimeNotes], ", ")],
        ["Bathing", join([g.bathing?.preference, g.bathing?.days?.join(", "), g.bathing?.carerGender ? `${g.bathing.carerGender} carer` : null], "; ")],
        ["Worries", join([g.worries, g.whatHelps ? `helps: ${g.whatHelps}` : null], "; ")],
      ],
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      {cards.map((card) => (
        <SummaryCard key={card.title} title={card.title} rows={card.rows} />
      ))}
    </div>
  );
}

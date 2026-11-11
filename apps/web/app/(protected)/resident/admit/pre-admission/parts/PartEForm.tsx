"use client";

import type { PreAdmissionPartEDTO } from "@repo/schema";
import { DocumentUploadField } from "../../components/common/DocumentUploadField";
import { FieldGrid, PartCard } from "../shared/PartCard";
import { RepeatableList } from "../shared/RepeatableList";
import { useScrollToFirstError } from "../shared/useScrollToFirstError";
import { CheckField, DateField, SelectField, TextAreaField, TextField } from "../shared/fields";
import type { PartFormProps } from "../shared/types";

type Consent = PreAdmissionPartEDTO["consents"][number];
type MoveDecision = NonNullable<PreAdmissionPartEDTO["moveDecision"]>;
type Dols = NonNullable<PreAdmissionPartEDTO["dolsScreen"]>;

const CAPACITY = ["Has capacity", "Lacks capacity", "Not assessed"] as const;
const DOLS_OUTCOMES: Array<[NonNullable<Dols["outcome"]>, string]> = [
  ["NoApplication", "No application needed"],
  ["ApplicationNeeded", "Application needed"],
  ["Applied", "Applied"],
  ["Authorised", "Authorised"],
];

const capacityLabel = (v: boolean | null | undefined) =>
  v === true ? CAPACITY[0] : v === false ? CAPACITY[1] : v === null ? CAPACITY[2] : "";

/** Order in which errors are surfaced when scrolling to the first problem. */
const CAPACITY_FIELD_ORDER = [
  "moveDecision.hasCapacity",
  "moveDecision.assessedAt",
  "moveDecision.assessedByName",
  "moveDecision.summary",
  "moveDecision.bestInterests.decidedAt",
  "moveDecision.bestInterests.decisionMaker",
  "moveDecision.bestInterests.rationale",
] as const;

export function PartEForm({ value, onChange, errors }: PartFormProps<PreAdmissionPartEDTO>) {
  const move: MoveDecision = value.moveDecision ?? {};
  const bi: NonNullable<MoveDecision["bestInterests"]> = move.bestInterests ?? {
    consulted: [],
  };
  const dols: Dols = value.dolsScreen ?? {};
  const setMove = (patch: Partial<MoveDecision>) =>
    onChange({ moveDecision: { ...move, ...patch } });
  const setBi = (patch: Partial<NonNullable<MoveDecision["bestInterests"]>>) =>
    setMove({ bestInterests: { ...bi, ...patch } });
  const setDols = (patch: Partial<Dols>) =>
    onChange({ dolsScreen: { ...dols, ...patch } });

  useScrollToFirstError(errors, CAPACITY_FIELD_ORDER);

  // Clear a message as soon as its field has a value, without waiting for a re-save.
  const visibleErrors = { ...errors };
  if (typeof move.hasCapacity === "boolean") {
    delete visibleErrors["moveDecision.hasCapacity"];
  }
  if (move.assessedAt?.trim()) delete visibleErrors["moveDecision.assessedAt"];
  if (move.assessedByName?.trim()) {
    delete visibleErrors["moveDecision.assessedByName"];
  }
  if (move.summary?.trim()) delete visibleErrors["moveDecision.summary"];
  if (bi.decidedAt?.trim()) {
    delete visibleErrors["moveDecision.bestInterests.decidedAt"];
  }
  if (bi.decisionMaker?.trim()) {
    delete visibleErrors["moveDecision.bestInterests.decisionMaker"];
  }
  if (bi.rationale?.trim()) {
    delete visibleErrors["moveDecision.bestInterests.rationale"];
  }

  return (
    <div className="space-y-6 font-sans">
      <PartCard
        title="G · Capacity for the decision to move"
        description="Record the capacity assessment and, if they lack capacity, the best-interests decision."
      >
        <FieldGrid cols={3}>
          <div data-validation-field="moveDecision.hasCapacity">
            <SelectField
              label="Capacity for this decision"
              required
              options={CAPACITY}
              value={capacityLabel(move.hasCapacity)}
              errorMessage={visibleErrors?.["moveDecision.hasCapacity"]}
              onChange={(v) =>
                setMove({
                  hasCapacity: v === CAPACITY[0] ? true : v === CAPACITY[1] ? false : null,
                })
              }
            />
          </div>
          <div data-validation-field="moveDecision.assessedAt">
            <DateField
              label="Assessed on"
              required
              value={move.assessedAt}
              errorMessage={visibleErrors?.["moveDecision.assessedAt"]}
              onChange={(v) => setMove({ assessedAt: v })}
            />
          </div>
          <div data-validation-field="moveDecision.assessedByName">
            <TextField
              label="Assessed by"
              required
              value={move.assessedByName}
              errorMessage={visibleErrors?.["moveDecision.assessedByName"]}
              onChange={(v) => setMove({ assessedByName: v })}
            />
          </div>
        </FieldGrid>
        <div data-validation-field="moveDecision.summary">
          <TextAreaField
            label="Summary"
            required
            value={move.summary}
            errorMessage={visibleErrors?.["moveDecision.summary"]}
            onChange={(v) => setMove({ summary: v })}
          />
        </div>

        {move.hasCapacity === false && (
          <div className="space-y-1.5 pt-4 border-t border-slate-200/80">
            <FieldGrid cols={3}>
              <div data-validation-field="moveDecision.bestInterests.decidedAt">
                <DateField
                  label="Best-interests decision date"
                  required
                  value={bi.decidedAt}
                  errorMessage={visibleErrors?.["moveDecision.bestInterests.decidedAt"]}
                  onChange={(v) => setBi({ decidedAt: v })}
                />
              </div>
              <div data-validation-field="moveDecision.bestInterests.decisionMaker">
                <TextField
                  label="Decision maker"
                  required
                  placeholder="e.g. Susan Ellison, attorney"
                  value={bi.decisionMaker}
                  errorMessage={visibleErrors?.["moveDecision.bestInterests.decisionMaker"]}
                  onChange={(v) => setBi({ decisionMaker: v })}
                />
              </div>
            </FieldGrid>
            <div data-validation-field="moveDecision.bestInterests.rationale">
              <TextAreaField
                label="Rationale"
                required
                value={bi.rationale}
                errorMessage={visibleErrors?.["moveDecision.bestInterests.rationale"]}
                onChange={(v) => setBi({ rationale: v })}
              />
            </div>
          </div>
        )}
        <TextAreaField label="Their wishes" placeholder="e.g. Accepts the move; wants to be near family" value={value.wishes} onChange={(v) => onChange({ wishes: v })} />
      </PartCard>

      <PartCard title="G · Deprivation of Liberty (DoLS) screen">
        <FieldGrid cols={3}>
          <SelectField
            label="Outcome"
            options={DOLS_OUTCOMES.map(([, l]) => l)}
            value={DOLS_OUTCOMES.find(([k]) => k === dols.outcome)?.[1]}
            onChange={(v) => setDols({ outcome: DOLS_OUTCOMES.find(([, l]) => l === v)?.[0] })}
          />
          <DateField label="Screened on" value={dols.screenedAt} onChange={(v) => setDols({ screenedAt: v })} />
          <TextField label="Re-screen if" placeholder="e.g. She objects" value={dols.rescreenTrigger} onChange={(v) => setDols({ rescreenTrigger: v })} />
        </FieldGrid>
        <TextAreaField label="Rationale" value={dols.rationale} onChange={(v) => setDols({ rationale: v })} />
      </PartCard>

      <PartCard title="G · Consents">
        <RepeatableList<Consent>
          items={value.consents}
          onChange={(consents) => onChange({ consents })}
          newItem={() => ({ name: "", given: false })}
          addLabel="Add consent"
          emptyText="No consents recorded."
          renderItem={(c, update) => (
            <div className="space-y-1.5">
              <FieldGrid cols={3}>
                <TextField label="Consent" required placeholder="e.g. Photography" value={c.name} onChange={(v) => update({ name: v })} />
                <DateField label="Date signed" value={c.dateSigned} onChange={(v) => update({ dateSigned: v })} />
                <CheckField label="Consent given" checked={c.given} onChange={(v) => update({ given: v })} />
              </FieldGrid>
              <DocumentUploadField
                label="Signed form"
                value={c.document?.gcsPath ?? ""}
                onChange={(url) => update({ document: url ? { name: c.name || "Consent", gcsPath: url } : null })}
              />
            </div>
          )}
        />
      </PartCard>
    </div>
  );
}

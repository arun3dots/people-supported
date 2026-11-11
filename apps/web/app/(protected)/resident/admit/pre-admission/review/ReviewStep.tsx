"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Send } from "lucide-react";
import type {
  PreAdmissionManagerDecisionDTO,
  PreAdmissionRecordDTO,
  PreAdmissionSubmitIssue,
} from "@repo/schema";
import { Button, Text } from "@repo/ui/components/ui";
import { useAuth } from "../../../../../../lib/context/AuthContext";
import { FieldGrid, PartCard } from "../shared/PartCard";
import { SelectField, TextAreaField, TextField } from "../shared/fields";
import type { PartsState } from "../usePreAdmissionWizard";
import { STEP_PART } from "../steps";
import { PreAdmissionSummary } from "./PreAdmissionSummary";
import { ReviewCareTasksCard } from "./ReviewCareTasksCard";

const DECISIONS: Array<[PreAdmissionManagerDecisionDTO["decision"], string]> = [
  ["Accepted", "Accept: we can meet their needs"],
  ["NeedsMoreInformation", "Needs more information"],
  ["Declined", "Decline"],
];

interface ReviewStepProps {
  parts: PartsState;
  record: PreAdmissionRecordDTO | null;
  issues: PreAdmissionSubmitIssue[];
  residentId?: string | null;
  onGoToStep: (step: number) => void;
  onSubmit: () => void;
  onDecide: (data: PreAdmissionManagerDecisionDTO) => Promise<void>;
  onAdmit: () => void;
  isSubmitting: boolean;
  isDeciding: boolean;
  isAdmitting: boolean;
}

const stepForPart = (part: string): number => {
  return Number(Object.entries(STEP_PART).find(([, p]) => p === part)?.[0] ?? 1);
};

export function ReviewStep({
  parts,
  record,
  issues,
  residentId,
  onGoToStep,
  onSubmit,
  onDecide,
  onAdmit,
  isSubmitting,
  isDeciding,
  isAdmitting,
}: ReviewStepProps) {
  const { user } = useAuth();
  const [decision, setDecision] =
    useState<PreAdmissionManagerDecisionDTO["decision"]>("Accepted");
  const [rationale, setRationale] = useState("");
  const [signedByName, setSignedByName] = useState(user?.fullName ?? "");
  const [signedRole, setSignedRole] = useState(user?.roleName ?? "");

  const status = record?.status ?? "Draft";
  const decided = record?.managerDecision;
  const hasBed = Boolean(parts.roomAllocation.bedId);

  return (
    <div className="space-y-6 font-sans">
      <PreAdmissionSummary
        parts={parts}
        residentId={residentId}
        hasSavedAdls={Boolean(
          record?.partD?.adlChecklist &&
            Object.values(record.partD.adlChecklist).some(
              (activity) =>
                activity?.assistanceLevel != null ||
                Boolean(activity?.comments?.trim()),
            ),
        )}
      />

      <ReviewCareTasksCard
        residentId={residentId}
        onEditAssessment={() => onGoToStep(6)}
      />

      {status === "Draft" && issues.length > 0 && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <div className="space-y-1">
            <Text size="sm" weight="bold">
              Complete these before submitting
            </Text>
            <ul className="text-sm space-y-0.5">
              {issues.map((i) => (
                <li key={`${i.part}.${i.field}`}>
                  <button
                    type="button"
                    className="underline underline-offset-2 cursor-pointer"
                    onClick={() => onGoToStep(stepForPart(i.part))}
                  >
                    {i.message}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {decided && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-900 text-sm">
          <span className="font-bold">Manager decision: {decided.decision}. </span>
          {decided.rationale} Signed {decided.signedByName}, {decided.signedRole}
          {decided.signedAt ? `, ${decided.signedAt.slice(0, 10)}` : ""}.
        </div>
      )}

      {status === "Draft" && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="primary"
            size="lg"
            disabled={issues.length > 0 || isSubmitting}
            onClick={onSubmit}
            className="rounded-xl font-semibold shadow-none"
          >
            <Send className="size-4" />
            Submit for manager decision
          </Button>
        </div>
      )}

      {status === "Submitted" && (
        <PartCard
          title="Manager decision"
          description="Record whether the home can meet this person's needs."
        >
          <FieldGrid>
            <SelectField
              label="Decision"
              required
              options={DECISIONS.map(([, l]) => l)}
              value={DECISIONS.find(([k]) => k === decision)?.[1]}
              onChange={(v) => setDecision(DECISIONS.find(([, l]) => l === v)?.[0] ?? "Accepted")}
            />
            <div />
            <TextField label="Signed by" required value={signedByName} onChange={setSignedByName} />
            <TextField label="Role" required value={signedRole} onChange={setSignedRole} />
          </FieldGrid>
          <TextAreaField label="Rationale" required value={rationale} onChange={setRationale} />
          <div className="flex justify-end">
            <Button
              type="button"
              variant="primary"
              size="lg"
              disabled={isDeciding || !rationale.trim() || !signedByName.trim() || !signedRole.trim()}
              onClick={() => onDecide({ decision, rationale, signedByName, signedRole })}
              className="rounded-xl font-semibold shadow-none"
            >
              Record decision
            </Button>
          </div>
        </PartCard>
      )}

      {status === "Accepted" && (
        <div className="flex flex-col items-end gap-2">
          {!hasBed && (
            <Text size="sm" className="text-amber-700">
              Choose a room and bed in the Room step before admitting.
            </Text>
          )}
          <Button
            type="button"
            variant="primary"
            size="lg"
            disabled={!hasBed || isAdmitting}
            onClick={onAdmit}
            className="rounded-xl font-semibold shadow-none"
          >
            <CheckCircle2 className="size-4" />
            Admit resident
          </Button>
        </div>
      )}

      {status === "Declined" && (
        <Text size="sm" className="text-slate-700">
          This pre-admission was declined. Editing any step starts a new version.
        </Text>
      )}
    </div>
  );
}

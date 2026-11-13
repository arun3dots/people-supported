"use client";

import { CheckCircle2, Plus, X } from "lucide-react";
import type { NeedCarePlanRecordDTO } from "@repo/schema";
import { Button, Input, Label } from "@repo/ui/components/ui";
import { useAgreeNeedCarePlanMutation } from "../../../../../lib/queries/care-journey";
import { RatingPill } from "../shared";

export interface SignerPerson {
  name: string;
  role: string;
}

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-GB");

interface ModalAgreementSectionProps {
  residentId: string;
  existingPlan: NeedCarePlanRecordDTO | null;
  dirty: boolean;
  readyToAgree: boolean;
  people: SignerPerson[];
  onPeopleChange: (next: SignerPerson[]) => void;
}

export function ModalAgreementSection({
  residentId,
  existingPlan,
  dirty,
  readyToAgree,
  people,
  onPeopleChange,
}: ModalAgreementSectionProps) {
  const agree = useAgreeNeedCarePlanMutation(residentId);

  if (existingPlan?.status === "Agreed") {
    return (
      <div className="flex flex-wrap items-center gap-2 font-sans">
        <RatingPill rating="low">
          <CheckCircle2 className="size-3.5" />
          Agreed
          {existingPlan.agreement?.agreedAt
            ? ` ${formatDate(existingPlan.agreement.agreedAt)}`
            : ""}
        </RatingPill>
        {existingPlan.agreement?.agreedBy.length ? (
          <span className="text-md text-slate-700">
            {existingPlan.agreement.agreedBy
            .map((p) => `${p.name} (${p.role})`)
            .join(", ")}
          </span>
        ) : null}
      </div>
    );
  }

  const filled = people.filter((p) => p.name.trim() && p.role.trim());
  const setPerson = (index: number, patch: Partial<SignerPerson>) =>
    onPeopleChange(
      people.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    );

  return (
    <div className="space-y-3 font-sans">
      <p className="text-md text-slate-600">
        {existingPlan?.agreement
          ? "Changed since it was last agreed. Read it through again with the person."
          : "Record who read through and agreed this plan (optional now — can also be agreed later)."}
      </p>
      {people.map((person, index) => (
        <div
          key={index}
          className="grid grid-cols-[1fr_1fr_auto] gap-x-4 gap-y-1.5 items-end"
        >
          <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
            {index === 0 && <Label>Name</Label>}
            <Input
              value={person.name}
              placeholder="e.g. Margaret"
              onChange={(e) => setPerson(index, { name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
            {index === 0 && <Label>Relationship or role</Label>}
            <Input
              value={person.role}
              placeholder="e.g. Resident, daughter"
              onChange={(e) => setPerson(index, { role: e.target.value })}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Remove person"
            disabled={people.length === 1}
            onClick={() =>
              onPeopleChange(people.filter((_, i) => i !== index))
            }
            className="shadow-none cursor-pointer"
          >
            <X className="size-4" />
          </Button>
        </div>
      ))}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          onClick={() => onPeopleChange([...people, { name: "", role: "" }])}
          className="rounded-xl text-md font-semibold shadow-none cursor-pointer"
        >
          <Plus className="size-4" />
          Add person
        </Button>
        {filled.length > 0 && !readyToAgree && (
          <span className="text-md text-amber-800">
            Add the outcome and at least one support step to record agreement.
          </span>
        )}
        {existingPlan && !dirty && filled.length > 0 && readyToAgree && (
          <Button
            type="button"
            variant="outline"
            disabled={agree.isPending}
            onClick={() =>
              agree.mutate({
                planId: existingPlan.id,
                data: { agreedBy: filled },
              })
            }
            className="rounded-xl text-md font-semibold shadow-none cursor-pointer"
          >
            {agree.isPending ? "Recording…" : "Record agreement"}
          </Button>
        )}
      </div>
    </div>
  );
}

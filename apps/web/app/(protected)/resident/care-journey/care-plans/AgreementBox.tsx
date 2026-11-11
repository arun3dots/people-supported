"use client";

import { useState } from "react";
import { CheckCircle2, Plus, X } from "lucide-react";
import type { NeedCarePlanRecordDTO } from "@repo/schema";
import { Button, Input, Label } from "@repo/ui/components/ui";
import { useAgreeNeedCarePlanMutation } from "../../../../../lib/queries/care-journey";
import { RatingPill } from "../shared";

interface Person {
  name: string;
  role: string;
}

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-GB");

interface AgreementBoxProps {
  residentId: string;
  plan: NeedCarePlanRecordDTO;
  disabled: boolean;
  disabledReason?: string;
}

export function AgreementBox({
  residentId,
  plan,
  disabled,
  disabledReason,
}: AgreementBoxProps) {
  const agree = useAgreeNeedCarePlanMutation(residentId);
  const [people, setPeople] = useState<Person[]>([{ name: "", role: "" }]);

  if (plan.status === "Agreed") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <RatingPill rating="low">
          <CheckCircle2 className="size-3" />
          Agreed
          {plan.agreement?.agreedAt
            ? ` ${formatDate(plan.agreement.agreedAt)}`
            : ""}
        </RatingPill>
        {plan.agreement?.agreedBy.length ? (
          <span className="text-md text-slate-700">
            {plan.agreement.agreedBy.map((p) => `${p.name} (${p.role})`).join(", ")}
          </span>
        ) : null}
      </div>
    );
  }

  const filled = people.filter((p) => p.name.trim() && p.role.trim());

  const setPerson = (index: number, patch: Partial<Person>) =>
    setPeople((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));

  return (
    <div className="space-y-2">
      <p className="text-md text-slate-600">
        {plan.agreement
          ? "Changed since it was last agreed. Read it through again with the person."
          : "Not yet read through with the person and their family."}
      </p>
      {people.map((person, index) => (
        <div
          key={index}
          className="grid grid-cols-[1fr_1fr_auto] gap-x-4 gap-y-1.5 items-end"
        >
          <div className="space-y-1.5">
            {index === 0 && <Label>Name</Label>}
            <Input
              value={person.name}
              placeholder="e.g. Margaret"
              onChange={(e) => setPerson(index, { name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
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
            onClick={() => setPeople((prev) => prev.filter((_, i) => i !== index))}
            className="mb-[18px] shadow-none"
          >
            <X className="size-4" />
          </Button>
        </div>
      ))}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          onClick={() => setPeople((prev) => [...prev, { name: "", role: "" }])}
          className="rounded-xl shadow-none"
        >
          <Plus className="size-4" />
          Add person
        </Button>
        <div className="flex items-center gap-3">
          {disabledReason && (
            <span className="text-sm text-slate-600">{disabledReason}</span>
          )}
          <Button
            type="button"
            variant="primary"
            size="lg"
            disabled={disabled || filled.length === 0 || agree.isPending}
            onClick={() =>
              agree.mutate({ planId: plan.id, data: { agreedBy: filled } })
            }
            className="rounded-xl font-semibold px-5 shadow-none"
          >
            {agree.isPending ? "Recording…" : "Record agreement"}
          </Button>
        </div>
      </div>
    </div>
  );
}

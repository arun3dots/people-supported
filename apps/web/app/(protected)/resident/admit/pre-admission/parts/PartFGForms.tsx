"use client";

import type { PreAdmissionPartFDTO, PreAdmissionPartGDTO } from "@repo/schema";
import { DocumentUploadField } from "../../components/common/DocumentUploadField";
import { FieldGrid, PartCard } from "../shared/PartCard";
import { RepeatableList } from "../shared/RepeatableList";
import { CheckField, DateField, ListField, SelectField, TextAreaField, TextField, TimeField } from "../shared/fields";
import type { PartFormProps } from "../shared/types";

type Dnacpr = PreAdmissionPartFDTO["dnacpr"];

const DNACPR: Array<[Dnacpr["status"], string]> = [
  ["NotDiscussed", "Not discussed yet"],
  ["InPlace", "In place"],
  ["NotInPlace", "Discussed, not in place"],
  ["Declined", "Declined"],
];
const LIVING_WILL = ["Yes", "No", "Unknown"] as const;

export function PartFForm({ value, onChange }: PartFormProps<PreAdmissionPartFDTO>) {
  const setDnacpr = (patch: Partial<Dnacpr>) =>
    onChange({ dnacpr: { ...value.dnacpr, ...patch } });
  const respect = value.respect;

  return (
    <div className="space-y-6 font-sans">
      <PartCard title="F · Advance care planning">
        <FieldGrid cols={3}>
          <SelectField
            label="DNACPR"
            options={DNACPR.map(([, l]) => l)}
            value={DNACPR.find(([k]) => k === value.dnacpr.status)?.[1]}
            onChange={(v) => setDnacpr({ status: DNACPR.find(([, l]) => l === v)?.[0] ?? "NotDiscussed" })}
          />
          {value.dnacpr.status === "InPlace" && (
            <DateField label="Decided on" value={value.dnacpr.decidedAt} onChange={(v) => setDnacpr({ decidedAt: v })} />
          )}
          <SelectField
            label="Living will on file"
            options={LIVING_WILL}
            value={value.livingWill === true ? "Yes" : value.livingWill === false ? "No" : value.livingWill === null ? "Unknown" : ""}
            onChange={(v) => onChange({ livingWill: v === "Yes" ? true : v === "No" ? false : null })}
          />
        </FieldGrid>
        {value.dnacpr.status === "InPlace" && (
          <DocumentUploadField
            label="DNACPR form"
            value={value.dnacpr.document?.gcsPath ?? ""}
            onChange={(url) => setDnacpr({ document: url ? { name: "DNACPR", gcsPath: url } : null })}
          />
        )}
        <CheckField label="ReSPECT form in place" checked={respect.inPlace} onChange={(v) => onChange({ respect: { ...respect, inPlace: v } })} />
        {respect.inPlace && (
          <DocumentUploadField
            label="ReSPECT form"
            value={respect.document?.gcsPath ?? ""}
            onChange={(url) => onChange({ respect: { ...respect, document: url ? { name: "ReSPECT", gcsPath: url } : null } })}
          />
        )}
        <TextAreaField label="Plan" placeholder="e.g. GP to discuss within the first month" value={value.plan} onChange={(v) => onChange({ plan: v })} />
        <FieldGrid>
          <TextField label="Plan owner" value={value.planOwner} onChange={(v) => onChange({ planOwner: v })} />
          <DateField label="Target date" value={value.planTargetDate} onChange={(v) => onChange({ planTargetDate: v })} />
        </FieldGrid>
      </PartCard>
    </div>
  );
}

type Person = PreAdmissionPartGDTO["importantPeople"][number];

export function PartGForm({ value, onChange }: PartFormProps<PreAdmissionPartGDTO>) {
  const routine: NonNullable<PreAdmissionPartGDTO["routine"]> = value.routine ?? {};
  const bathing: NonNullable<PreAdmissionPartGDTO["bathing"]> = value.bathing ?? {
    days: [],
  };
  return (
    <div className="space-y-6 font-sans">
      <PartCard title="About me" description="In their own words where possible.">
        <TextAreaField label="Loves" placeholder="e.g. Gardening, Radio 4, crosswords" value={value.loves} onChange={(v) => onChange({ loves: v })} />
        <TextAreaField label="Dislikes" value={value.dislikes} onChange={(v) => onChange({ dislikes: v })} />
        <FieldGrid cols={3}>
          <TimeField label="Usually up about" placeholder="07:30" value={routine.wakeTime} onChange={(v) => onChange({ routine: { ...routine, wakeTime: v } })} />
          <TimeField label="Usually in bed about" placeholder="21:30" value={routine.bedTime} onChange={(v) => onChange({ routine: { ...routine, bedTime: v } })} />
          <TextField label="Bedtime notes" placeholder="e.g. Lamp on, door ajar" value={routine.bedtimeNotes} onChange={(v) => onChange({ routine: { ...routine, bedtimeNotes: v } })} />
        </FieldGrid>
        <FieldGrid cols={3}>
          <TextField label="Bathing preference" placeholder="e.g. Shower" value={bathing.preference} onChange={(v) => onChange({ bathing: { ...bathing, preference: v } })} />
          <ListField label="Bathing days" placeholder="e.g. Tuesday, Friday" value={bathing.days ?? []} onChange={(days) => onChange({ bathing: { ...bathing, days } })} />
          <TextField label="Carer gender preference" placeholder="e.g. Female" value={bathing.carerGender} onChange={(v) => onChange({ bathing: { ...bathing, carerGender: v } })} />
        </FieldGrid>
        <FieldGrid>
          <TextAreaField label="Worries" placeholder="e.g. Anxious late afternoon" value={value.worries} onChange={(v) => onChange({ worries: v })} />
          <TextAreaField label="What helps" placeholder="e.g. Talking about her garden" value={value.whatHelps} onChange={(v) => onChange({ whatHelps: v })} />
        </FieldGrid>
        <TextAreaField label="Personal care notes" value={value.personalCareNotes} onChange={(v) => onChange({ personalCareNotes: v })} />
      </PartCard>

      <PartCard title="Important people and pets">
        <RepeatableList<Person>
          items={value.importantPeople}
          onChange={(importantPeople) => onChange({ importantPeople })}
          newItem={() => ({ name: "" })}
          addLabel="Add person or pet"
          renderItem={(p, update) => (
            <FieldGrid>
              <TextField label="Name" value={p.name} onChange={(v) => update({ name: v })} />
              <TextField label="Note" placeholder="e.g. Cat, now with Susan" value={p.note} onChange={(v) => update({ note: v })} />
            </FieldGrid>
          )}
        />
      </PartCard>
    </div>
  );
}

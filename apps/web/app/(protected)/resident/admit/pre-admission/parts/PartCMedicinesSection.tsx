"use client";

import { Clock, Pencil, Pill, Trash2, User } from "lucide-react";
import { addDays, format } from "date-fns";
import type { PreAdmissionPartCDTO } from "@repo/schema";
import { Badge, Button } from "@repo/ui/components/ui";
import { CardRepeatableSection } from "../shared/CardRepeatableSection";
import { PartCard } from "../shared/PartCard";
import { PartCMedicineDialog } from "./PartCMedicineDialog";

type Medicine = PreAdmissionPartCDTO["medicines"][number];

interface PartCMedicinesSectionProps {
  medicines: Medicine[];
  onChange: (items: Medicine[]) => void;
  residentId?: string | null;
}

export function PartCMedicinesSection({
  medicines,
  onChange,
  residentId,
}: PartCMedicinesSectionProps) {
  const newMedicine = (): Medicine => {
    const now = new Date();
    const scheduled = new Date(now);
    scheduled.setHours(8, 0, 0, 0);

    return {
      name: "",
      prn: false,
      scheduleType: "recurring",
      startDate: format(now, "yyyy-MM-dd"),
      endDate: format(addDays(now, 30), "yyyy-MM-dd"),
      times: ["08:00"],
      scheduledTime: format(scheduled, "yyyy-MM-dd'T'HH:mm"),
      allowLateAdministration: true,
      mandatoryObservations: [],
      imageUrls: [],
    };
  };

  return (
    <PartCard
      title="C · Medicines"
      description="Record all current prescribed, over-the-counter, and as-needed (PRN) medications."
    >
      <CardRepeatableSection<Medicine>
        items={medicines}
        onChange={onChange}
        newItem={newMedicine}
        addLabel="Add medicine"
        emptyTitle="No medicines recorded"
        emptyDescription="Record all regular and PRN medications taken by the resident."
        icon={Pill}
        isItemBlank={(m) => !m.name?.trim()}
        validateSave={(m) =>
          Boolean(
            m.name.trim() &&
              m.dose?.trim() &&
              (m.form?.trim() || m.route?.trim()) &&
              (!m.scheduleType ||
                (m.scheduleType === "single"
                  ? m.scheduledTime
                  : m.startDate &&
                    m.endDate &&
                    m.startDate <= m.endDate &&
                    m.times?.length)),
          )
        }
        renderCard={(m, onEdit, onDelete) => (
          <div className="p-4 bg-white border border-slate-200/90 rounded-xl space-y-3 shadow-2xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-8 rounded-full bg-purple-50 text-purple-700 border border-purple-200/60 flex items-center justify-center shrink-0">
                  <Pill className="size-4" />
                </div>
                <p className="text-md font-bold text-slate-800 truncate">
                  {m.name}
                </p>
                {m.prn ? (
                  <Badge
                    variant="outline"
                    className="px-2.5 py-0.5 text-md bg-purple-50 text-purple-700 border-purple-200 font-bold"
                  >
                    PRN · When needed
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="px-2.5 py-0.5 text-md bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold"
                  >
                    Regular
                  </Badge>
                )}
                {(m.form || m.route) && (
                  <Badge
                    variant="secondary"
                    className="px-2.5 py-0.5 text-md bg-slate-100 text-slate-700 font-medium"
                  >
                    {m.form ?? m.route}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onEdit}
                  className="size-8 p-0 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                  title="Edit medicine"
                  aria-label="Edit medicine"
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="size-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  title="Delete medicine"
                  aria-label="Delete medicine"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-md text-slate-600 pt-1 border-t border-slate-100">
              {(m.dose || m.frequency) && (
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-700">
                    {[m.dose, m.frequency].filter(Boolean).join(" · ")}
                  </span>
                </div>
              )}
              {m.timing && (
                <div>
                  <span className="text-slate-500">Timing: </span>
                  <span className="font-medium text-slate-700">{m.timing}</span>
                </div>
              )}
              {m.prescriber && (
                <div className="flex items-center gap-1.5">
                  <User className="size-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-500">Prescriber: </span>
                  <span className="font-medium text-slate-700 truncate">{m.prescriber}</span>
                </div>
              )}
              {m.prn && m.prnMaxPerDay && (
                <div className="text-purple-700 font-medium">
                  Max {m.prnMaxPerDay} doses/day
                </div>
              )}
              {m.scheduleType === "single" && m.scheduledTime && (
                <div>
                  <span className="text-slate-500">Scheduled: </span>
                  <span className="font-medium text-slate-700">
                    {m.scheduledTime}
                  </span>
                </div>
              )}
              {m.scheduleType === "recurring" && m.times?.length && (
                <div>
                  <span className="text-slate-500">Daily at: </span>
                  <span className="font-medium text-slate-700">
                    {m.times.join(", ")}
                  </span>
                </div>
              )}
              {m.instructions && (
                <div className="sm:col-span-2 md:col-span-3">
                  <span className="text-slate-500">Instructions: </span>
                  <span className="font-medium text-slate-700">{m.instructions}</span>
                </div>
              )}
            </div>
          </div>
        )}
        renderForm={(medicine, onPatch, onSave, onCancel, isNew) => (
          <PartCMedicineDialog
            medicine={medicine}
            residentId={residentId ?? undefined}
            isNew={isNew}
            onPatch={onPatch}
            onSave={onSave}
            onCancel={onCancel}
          />
        )}
      />
    </PartCard>
  );
}

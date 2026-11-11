"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { ShieldAlert, Clock, FileText, Pill, Info, CheckCircle2 } from "lucide-react";
import {
  Text,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@repo/ui/components/ui";
import { MedicationNotesDialog } from "./MedicationNotesDialog";

interface RecentAdminItem {
  id: string;
  drugName: string;
  dose: string;
  administeredAt: string;
  administeredBy: string;
  status: string;
}

interface MarQuickActionsProps {
  residentId?: string;
  allergies: string[];
  recentAdministrations: RecentAdminItem[];
  specialRequirements?: string | null;
  onAddPrn?: () => void;
  onOpenPrn?: () => void;
}

export function MarQuickActions({
  residentId = "",
  allergies,
  recentAdministrations,
  specialRequirements,
  onAddPrn,
  onOpenPrn,
}: MarQuickActionsProps): React.JSX.Element {
  const [isAllergiesOpen, setIsAllergiesOpen] = useState(false);
  const [isRecentAdminOpen, setIsRecentAdminOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
        <div>
          <Text as="h3" size="base" weight="medium" className="text-slate-900 text-base font-medium mb-4">
            Quick Actions
          </Text>

          <div className="grid grid-cols-2 gap-3">
            {/* 1. Allergies & Contraindications */}
            <button
              type="button"
              onClick={() => setIsAllergiesOpen(true)}
              className="group p-3.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[96px]"
            >
              <div className="size-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <ShieldAlert className="size-4" />
              </div>
              <Text size="sm" weight="medium" className="text-slate-800 leading-snug">
                Allergies &amp; Contraindications
              </Text>
            </button>

            {/* 2. Recent Administrations */}
            <button
              type="button"
              onClick={() => setIsRecentAdminOpen(true)}
              className="group p-3.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[96px]"
            >
              <div className="size-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Clock className="size-4" />
              </div>
              <Text size="sm" weight="medium" className="text-slate-800 leading-snug">
                Recent Administrations
              </Text>
            </button>

            {/* 3. Medication Notes */}
            <button
              type="button"
              onClick={() => setIsNotesOpen(true)}
              className="group p-3.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[96px]"
            >
              <div className="size-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <FileText className="size-4" />
              </div>
              <Text size="sm" weight="medium" className="text-slate-800 leading-snug">
                Medication Notes
              </Text>
            </button>

            {/* 4. PRN Medications */}
            <button
              type="button"
              onClick={onOpenPrn || onAddPrn}
              className="group p-3.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[96px]"
            >
              <div className="size-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Pill className="size-4" />
              </div>
              <Text size="sm" weight="medium" className="text-slate-800 leading-snug">
                PRN Medications
              </Text>
            </button>
          </div>
        </div>

        {/* Bottom Audit Info */}
        <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-500 mt-4">
          <Info className="size-4 shrink-0 text-slate-400" />
          <span>All actions are logged and update the compliance checklist</span>
        </div>
      </div>

      {/* Modal 1: Allergies & Contraindications */}
      <Dialog open={isAllergiesOpen} onOpenChange={setIsAllergiesOpen}>
        <DialogContent size="md" className="max-w-md sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-slate-900">
              Allergies &amp; Contraindications
            </DialogTitle>
            <DialogDescription className="text-[12px] text-slate-500">
              Critical contraindications and recorded drug allergies for this resident.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            {allergies.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-2 text-[12px] text-slate-500">
                <Info className="size-4 text-slate-400 shrink-0" />
                <span>No known drug allergies recorded for this resident.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1">
                {allergies.map((allergy, idx) => (
                  <div
                    key={idx}
                    className="bg-red-50/70 border border-red-200/80 rounded-xl p-3 flex items-center gap-2.5"
                  >
                    <div className="size-6 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 font-bold text-sm">
                      !
                    </div>
                    <div className="min-w-0 flex-1">
                      <Text size="sm" weight="medium" className="text-slate-900 truncate block font-medium">
                        {allergy}
                      </Text>
                      <Text size="sm" variant="muted" className="text-red-600/90 text-[12px]">
                        Critical Allergy
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAllergiesOpen(false)}
              className="min-w-[110px] px-6 text-[12px] font-medium"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Recent Administrations (Enlarged size="3xl") */}
      <Dialog open={isRecentAdminOpen} onOpenChange={setIsRecentAdminOpen}>
        <DialogContent size="3xl" className="max-w-3xl sm:max-w-3xl min-h-[420px] sm:min-h-[460px] flex flex-col justify-between">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-slate-900">
              Recent Administrations
            </DialogTitle>
            <DialogDescription className="text-[12px] text-slate-500">
              Audit log of recently completed medication administration events.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 flex-1">
            {recentAdministrations.length === 0 ? (
              <div className="h-full min-h-[220px] flex items-center justify-center p-8 text-center text-[12px] text-slate-500 bg-slate-50 rounded-xl border border-slate-200/80">
                No recent administrations logged for this resident.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto pr-1">
                {recentAdministrations.map((admin) => (
                  <div key={admin.id} className="py-3 px-1 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <Text size="sm" weight="medium" className="text-slate-900 font-medium truncate">
                          {admin.drugName} {admin.dose}
                        </Text>
                        <Text size="sm" variant="muted" className="truncate text-slate-500 text-[12px]">
                          Administered by {admin.administeredBy}
                        </Text>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant="secondary" state="success" className="text-[12px] mb-0.5">
                        {admin.status}
                      </Badge>
                      <Text size="sm" variant="muted" className="block text-[12px]">
                        {format(new Date(admin.administeredAt), "dd MMM yyyy, HH:mm")}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRecentAdminOpen(false)}
              className="min-w-[110px] px-6 text-[12px] font-medium"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 3: Medication Notes & Guidelines (With Add Note Option & Larger size="2xl") */}
      <MedicationNotesDialog
        open={isNotesOpen}
        onOpenChange={setIsNotesOpen}
        residentId={residentId}
        specialRequirements={specialRequirements}
      />
    </>
  );
}

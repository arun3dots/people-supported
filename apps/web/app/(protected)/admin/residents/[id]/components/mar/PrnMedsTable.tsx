"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { Pill, Plus, CheckSquare, Trash2, HeartPulse, Info, Eye } from "lucide-react";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui/components/ui";

interface PrnMedsTableProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rounds: any[];
  onAddPrn: () => void;
  onAdministerRound: (round: any) => void;
  onDeleteRound: (roundId: string) => void;
  isEditable?: boolean;
}

export function PrnMedsTable({
  open,
  onOpenChange,
  rounds,
  onAddPrn,
  onAdministerRound,
  onDeleteRound,
  isEditable = true,
}: PrnMedsTableProps): React.JSX.Element {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent size="3xl" className="max-w-3xl sm:max-w-3xl min-h-[460px] max-h-[85vh] flex flex-col justify-between">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3 pr-6 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-800 shrink-0">
                  <Pill className="size-4" />
                </div>
                <div>
                  <DialogTitle className="text-base font-semibold text-slate-900">
                    PRN (As Needed) Medications
                  </DialogTitle>
                  <DialogDescription className="text-md text-slate-500">
                    Prescribed on-demand medications administered according to clinical protocols.
                  </DialogDescription>
                </div>
              </div>

              {isEditable && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={onAddPrn}
                  className="gap-1.5 text-md shrink-0"
                >
                  <Plus className="size-3.5" /> Prescribe PRN
                </Button>
              )}
            </div>
          </DialogHeader>

          {/* Modal Content */}
          <div className="py-2 flex-1 overflow-y-auto pr-1">
            {rounds.length === 0 ? (
              <div className="h-full min-h-[240px] flex flex-col items-center justify-center py-10 text-center space-y-3 rounded-xl bg-slate-50/50 border border-slate-200/80">
                <div className="size-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto">
                  <HeartPulse className="size-6 text-sky-700" />
                </div>
                <div className="space-y-1">
                  <Text size="md" weight="semibold" className="text-slate-800 text-md">
                    No PRN medications prescribed
                  </Text>
                  <Text size="md" variant="muted" className="max-w-sm mx-auto text-md text-slate-500">
                    Add PRN protocols (e.g. pain relief, inhalers, calming) to enable on-demand logging.
                  </Text>
                </div>
                {isEditable && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onAddPrn}
                    className="rounded-xl shadow-none gap-1 border-sky-200 text-sky-800 hover:bg-sky-50 cursor-pointer text-md"
                  >
                    <Plus className="size-3.5" /> Add First PRN Medication
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <Table>
                  <TableHeader className="bg-slate-50/80">
                    <TableRow className="border-b border-slate-200">
                      <TableHead className="text-md">Medication</TableHead>
                      <TableHead className="text-md">Dose</TableHead>
                      <TableHead className="text-md">Status</TableHead>
                      <TableHead className="text-md">Last Administered</TableHead>
                      <TableHead className="text-right text-md">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100 text-md">
                    {rounds.map((round: any) => {
                      const lastAdmin = round.administrations?.[0];
                      const isTaken = round.status === "Administered" || lastAdmin?.status === "Given";
                      const images = round.imageUrls || [];

                      return (
                        <TableRow key={round.id} className="hover:bg-slate-50/60 transition-colors">
                          <TableCell className="py-2.5 px-3">
                            <div className="flex items-start gap-2.5">
                              {images.length > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => setPreviewImage(images[0])}
                                  className="relative group size-8 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100 cursor-pointer"
                                  title="Click to view photo"
                                >
                                  <img src={images[0]} alt={round.drugName} className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Eye className="size-3 text-white" />
                                  </div>
                                </button>
                              ) : (
                                <div className="size-7 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center shrink-0">
                                  <Pill className="size-3.5" />
                                </div>
                              )}
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-slate-900 text-md">
                                    {round.drugName}
                                  </span>
                                  {images.length > 1 && (
                                    <Badge variant="secondary" state="info" className="px-1.5 py-0 text-md shadow-none">
                                      +{images.length - 1} photos
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-md text-slate-500">
                                  {round.form || "As Needed"}
                                </p>
                                {round.instructions && (
                                  <div className="flex items-center gap-1 text-md text-amber-800 bg-amber-50/80 px-1.5 py-0.5 rounded-md border border-amber-200/60 max-w-xs">
                                    <Info className="size-3 shrink-0 text-amber-700" />
                                    <span className="truncate">{round.instructions}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="py-2.5 px-3">
                            <span className="font-medium text-slate-900 text-md">
                              {round.dose}
                            </span>
                          </TableCell>

                          <TableCell className="py-2.5 px-3">
                            <Badge variant="secondary" state="info" className="px-2 py-0.5 text-md shadow-none">
                              Available on Demand
                            </Badge>
                          </TableCell>

                          <TableCell className="py-2.5 px-3">
                            {lastAdmin ? (
                              <div>
                                <p className="font-medium text-slate-900 text-md">
                                  {format(new Date(lastAdmin.administeredAt || lastAdmin.createdAt), "dd MMM yyyy")}
                                </p>
                                <p className="text-md text-slate-500">
                                  {lastAdmin.performedBy || "Staff Member"}
                                </p>
                              </div>
                            ) : (
                              <span className="text-md text-slate-400">Never administered</span>
                            )}
                          </TableCell>

                          <TableCell className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onAdministerRound(round)}
                                disabled={isTaken}
                                title={isTaken ? "Already administered" : "Log PRN dose"}
                                className="h-7 px-2.5 text-md font-medium rounded-lg border-sky-200 text-sky-800 hover:bg-sky-50 shadow-none gap-1 cursor-pointer"
                              >
                                <CheckSquare className="size-3" /> Log Dose
                              </Button>

                              {isEditable && (
                                <TooltipProvider delayDuration={150}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onDeleteRound(round.id)}
                                        className="h-7 size-7 p-0 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 shadow-none cursor-pointer"
                                        aria-label="Delete PRN medication"
                                      >
                                        <Trash2 className="size-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-md py-1 px-2.5 bg-slate-900 text-white font-medium rounded-lg shadow-md">
                                      Delete PRN Medication
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="min-w-[110px] px-6 text-md font-medium"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full image preview dialog */}
      {previewImage && (
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="max-w-2xl bg-white p-2 rounded-2xl overflow-hidden">
            <img src={previewImage} alt="Medication Preview" className="w-full max-h-[75vh] object-contain rounded-xl" />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export { PrnMedsTable as PrnMedsDialog };

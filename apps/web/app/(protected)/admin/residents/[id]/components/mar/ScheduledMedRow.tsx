"use client";

import React from "react";
import { format } from "date-fns";
import { Pill, CheckSquare, Trash2, Clock, Info, Eye } from "lucide-react";
import {
  Badge,
  Button,
  TableCell,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui/components/ui";
import type { MedicationRoundRow } from "../../../../../../../lib/queries/residents/useGetMedicationPrescriptionsQuery";
import { summarizeGroup, type MedGroup } from "./medGroups";

interface ScheduledMedRowProps {
  group: MedGroup;
  rowNumber: number;
  isEditable: boolean;
  onPreviewImage: (url: string) => void;
  onOpenDetail: (key: string) => void;
  onAdministerRound: (round: MedicationRoundRow) => void;
  onDeleteRound: (roundId: string) => void;
}

export function ScheduledMedRow({
  group,
  rowNumber,
  isEditable,
  onPreviewImage,
  onOpenDetail,
  onAdministerRound,
  onDeleteRound,
}: ScheduledMedRowProps): React.JSX.Element {
  const { rounds, total, takenCount, lastAdmin, pendingRound, isTaken, isMissed, dates } =
    summarizeGroup(group);
  const images = group.imageUrls;

  return (
    <TableRow
      className="hover:bg-slate-50/60 transition-colors cursor-pointer"
      onClick={() => onOpenDetail(group.key)}
    >
      <TableCell className="w-[5%] px-1 text-center font-medium text-slate-500 text-[12px] align-top pt-2.5">
        {rowNumber}
      </TableCell>

      <TableCell className="w-[27%] py-2.5 px-2 align-top">
        <div className="flex items-start gap-2 min-w-0">
          {images.length > 0 ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onPreviewImage(images[0]!);
              }}
              className="relative group size-7 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100 cursor-pointer"
              title="Click to view photo"
            >
              <img src={images[0]} alt={group.drugName} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Eye className="size-3 text-white" />
              </div>
            </button>
          ) : (
            <div className="size-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Pill className="size-3.5" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className="font-bold text-slate-900 text-[12px] line-clamp-2 break-words leading-tight"
                title={group.drugName}
              >
                {group.drugName}
              </span>
              {images.length > 1 && (
                <Badge variant="secondary" state="info" className="px-1.5 py-0 text-[12px] shadow-none shrink-0">
                  +{images.length - 1}
                </Badge>
              )}
              {group.isLegacy && (
                <Badge variant="secondary" state="info" className="px-1.5 py-0 text-[12px] shadow-none shrink-0">
                  Legacy
                </Badge>
              )}
            </div>
            <p className="text-[12px] text-slate-500 line-clamp-1 leading-tight mt-0.5">
              {group.form || "Tablet"}
            </p>
            {group.instructions && (
              <div
                className="flex items-start gap-1 text-[12px] text-amber-800 bg-amber-50/80 p-1 rounded border border-amber-200/60 mt-1"
                title={group.instructions}
              >
                <Info className="size-3 shrink-0 text-amber-700 mt-0.5" />
                <span className="line-clamp-2 break-words leading-tight">{group.instructions}</span>
              </div>
            )}
          </div>
        </div>
      </TableCell>

      <TableCell className="w-[17%] py-2.5 px-2 align-top">
        <p className="font-semibold text-slate-900 text-[12px] line-clamp-2 break-words leading-tight" title={group.dose}>
          {group.dose}
        </p>
        <p className="text-[12px] text-slate-500 line-clamp-1 leading-tight mt-0.5" title={group.route || "Oral"}>
          {group.route || "Oral"}
        </p>
      </TableCell>

      <TableCell className="w-[15%] py-2.5 px-2 align-top">
        <div className="flex items-center gap-1 text-slate-800 font-medium text-[12px]">
          <Clock className="size-3 text-slate-400 shrink-0" />
          <span className="line-clamp-1 leading-tight">
            {group.times.length > 0 ? group.times.join(", ") : "Daily"}
          </span>
        </div>
        {dates.length > 0 && (
          <p className="text-[12px] text-slate-500 line-clamp-1 leading-tight mt-0.5">
            {format(dates[0]!, "dd MMM yy")}
            {dates.length > 1 && ` – ${format(dates[dates.length - 1]!, "dd MMM yy")}`}
          </p>
        )}
      </TableCell>

      <TableCell className="w-[12%] py-2.5 px-1 text-center align-top">
        {isTaken ? (
          <Badge variant="secondary" state="success" className="px-2 py-0.5 text-[12px] shadow-none">
            {takenCount}/{total} Taken
          </Badge>
        ) : isMissed ? (
          <Badge variant="secondary" state="danger" className="px-2 py-0.5 text-[12px] shadow-none">
            Missed
          </Badge>
        ) : (
          <Badge variant="secondary" state="warning" className="px-2 py-0.5 text-[12px] shadow-none truncate max-w-full">
            {takenCount}/{total} Given
          </Badge>
        )}
      </TableCell>

      <TableCell className="w-[13%] py-2.5 px-2 align-top">
        {lastAdmin ? (
          <div>
            <p className="font-medium text-slate-900 text-[12px] line-clamp-1 leading-tight">
              {format(new Date(lastAdmin.administeredAt || lastAdmin.createdAt), "dd MMM yy")}
            </p>
            <p
              className="text-[12px] text-slate-500 line-clamp-1 leading-tight mt-0.5 truncate"
              title={lastAdmin.performedBy || "Staff Member"}
            >
              {lastAdmin.performedBy || "Staff Member"}
            </p>
          </div>
        ) : (
          <span className="text-[12px] text-slate-400">-</span>
        )}
      </TableCell>

      <TableCell className="w-[11%] py-2.5 pr-2 pl-1 text-right align-top">
        <TooltipProvider delayDuration={150}>
          <div className="flex items-center justify-end gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isTaken || !pendingRound}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (pendingRound) onAdministerRound(pendingRound);
                  }}
                  className="h-7 w-7 p-0 rounded-lg border-emerald-200 text-emerald-800 hover:bg-emerald-50 shadow-none shrink-0 cursor-pointer"
                  aria-label="Administer medication"
                >
                  <CheckSquare className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-sm py-1 px-2.5 bg-slate-900 text-white font-medium rounded-lg shadow-md">
                {isTaken ? "Already administered" : "Administer Medication"}
              </TooltipContent>
            </Tooltip>

            {isEditable && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteRound(rounds[0]!.id);
                    }}
                    className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 shadow-none shrink-0 cursor-pointer"
                    aria-label="Delete medication"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-sm py-1 px-2.5 bg-slate-900 text-white font-medium rounded-lg shadow-md">
                  Delete Medication
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
      </TableCell>
    </TableRow>
  );
}


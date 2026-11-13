"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Plus, Edit, Trash2, ShieldCheck, FileText } from "lucide-react";
import { useParams } from "next/navigation";
import { cn } from "@repo/ui/lib/utils";
import {
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from "@repo/ui/components/ui";
import type { ImmunisationRecord } from "../../../../../../../lib/queries/staff/useComplianceQueries";
import { DocumentViewerModal } from "../DocumentViewerModal";

interface ImmunisationCardProps {
  className?: string;
  immList: ImmunisationRecord[];
  complianceLoading: boolean;
  hasStaffFallback: boolean;
  onAdd: () => void;
  onEdit: (imm: ImmunisationRecord) => void;
  onDelete: (id: string) => void;
}

export function ImmunisationCard({
  className,
  immList,
  complianceLoading,
  hasStaffFallback,
  onAdd,
  onEdit,
  onDelete,
}: ImmunisationCardProps) {
  const { id: staffId } = useParams<{ id: string }>();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedDocUrl, setSelectedDocUrl] = useState<string | null>(null);

  return (
    <Card className={cn("p-6 flex flex-col gap-6 w-full font-sans", className)}>
      <DocumentViewerModal
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        title="Immunization Certificate / Document"
        documentPath={selectedDocUrl || undefined}
        staffId={staffId}
      />
      {/* Header Section */}
      <div className="w-full flex items-center justify-between h-[44px]">
        <h3 className="text-h7 font-medium text-[#141F1E]">
          Immunization Status
        </h3>

        <Button onClick={onAdd} variant="outline">
          <Plus className="w-4 h-4 mr-1.5" />
          Add Immunization
        </Button>
      </div>

      <div className="flex flex-col gap-5 w-full">
        {complianceLoading && !hasStaffFallback ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-[#4A706A] border-t-transparent rounded-full" />
          </div>
        ) : immList.length > 0 ? (
          <>
            {/* Table View using Table UI Components */}
            <div className="w-full overflow-x-auto [&_[data-slot='table-container']]:h-auto">
              <Table className="w-full border-collapse border-b border-[#BCD3CD]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Immunization</TableHead>
                    <TableHead>Date Administered</TableHead>
                    <TableHead>Next Due</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {immList.map((imm) => {
                    const rawStatus = imm.status || "Up to date";
                    const nextDueMatch = rawStatus.match(/\[NextDue:\s*(.+?)\]/) || imm.name?.match(/\[NextDue:\s*(.+?)\]/);
                    const effectiveNextDue = imm.nextDueDate || (nextDueMatch ? nextDueMatch[1] : undefined);
                    const cleanStatus = rawStatus.replace(/\[NextDue:\s*.+?\]/g, "").trim() || "Up to date";

                    return (
                      <TableRow key={imm.id}>
                        {/* Immunization Name */}
                        <TableCell className="font-medium text-[#141F1E]">
                          {imm.name.replace(/\[NextDue:\s*.+?\]/g, "").trim()}
                        </TableCell>

                        {/* Date Administered */}
                        <TableCell>
                          {imm.dateAdministered
                            ? format(new Date(imm.dateAdministered), "dd MMM yyyy")
                            : "-"}
                        </TableCell>

                        {/* Next Due */}
                        <TableCell>
                          {effectiveNextDue
                            ? isNaN(Date.parse(effectiveNextDue))
                              ? effectiveNextDue
                              : format(new Date(effectiveNextDue), "dd MMM yyyy")
                            : "-"}
                        </TableCell>

                        {/* Status Badge */}
                        <TableCell className="text-center">
                          <span
                            className={cn(
                              "inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-md font-medium border",
                              cleanStatus === "Up to date" || cleanStatus === "Up-to-Date"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                : "bg-amber-50 text-amber-800 border-amber-300"
                            )}
                          >
                            {cleanStatus}
                          </span>
                        </TableCell>

                        {/* Action Buttons */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {(imm.documentUrl || (imm as any).documentUrl) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6 rounded-full text-[#4A706A] hover:bg-[#4A706A]/10"
                                title="View uploaded file"
                                onClick={() => {
                                  setSelectedDocUrl(imm.documentUrl || (imm as any).documentUrl);
                                  setViewerOpen(true);
                                }}
                              >
                                <FileText className="w-3.5 h-3.5 text-[#4A706A]" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6 rounded-full text-[#4A706A]"
                              onClick={() => onEdit(imm)}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6 rounded-full text-red-600 hover:text-red-700"
                              onClick={() => {
                                if (confirm("Delete this immunization record?")) {
                                  onDelete(imm.id);
                                }
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Bottom Banner Status */}
            <div className="flex items-center gap-2.5 px-4 py-2.5 bg-[#F5F8F7] border border-[#BCD3CD] rounded-xl min-h-[42px] w-full">
              <div className="w-6 h-6 rounded-full bg-slate-200 shrink-0 flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-[#4A706A]" />
              </div>
              <Text size="md" weight="regular" className="text-slate-500">
                All required immunizations are up-to-date
              </Text>
            </div>
          </>
        ) : (
          <Text
            size="md"
            weight="regular"
            className="text-center py-8 text-slate-500 italic border border-dashed rounded-xl border-slate-200"
          >
            No immunization records found. Click &quot;Add Immunization&quot; to get started.
          </Text>
        )}
      </div>
    </Card>
  );
}

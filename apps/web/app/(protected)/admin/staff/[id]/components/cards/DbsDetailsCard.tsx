"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ShieldAlert, Edit, FileText } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { Button, Card, InfoField, Text } from "@repo/ui/components/ui";
import { useParams } from "next/navigation";
import { type DbsRecord } from "../../../../../../../lib/queries/staff/useComplianceQueries";
import { DocumentViewerModal } from "../DocumentViewerModal";

interface DbsDetailsCardProps {
  className?: string;
  dbs: DbsRecord | null | undefined;
  complianceLoading: boolean;
  hasStaffFallback: boolean;
  onEdit: () => void;
}

export function DbsDetailsCard({
  className,
  dbs,
  complianceLoading,
  hasStaffFallback,
  onEdit,
}: DbsDetailsCardProps) {
  const { id: staffId } = useParams<{ id: string }>();
  const [viewerOpen, setViewerOpen] = useState(false);

  const isDbsExpired = (dateString?: string | null) => {
    if (!dateString) return false;
    const expiry = new Date(dateString);
    return !isNaN(expiry.getTime()) && expiry.getTime() < Date.now();
  };

  const isDbsExpiring = (dateString?: string | null) => {
    if (!dateString) return false;
    const expiry = new Date(dateString);
    const diffDays = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  const getEffectiveStatus = (dbsRecord?: DbsRecord | null) => {
    if (!dbsRecord) return "Pending";
    if (dbsRecord.expiryDate && isDbsExpired(dbsRecord.expiryDate)) {
      return "Expired";
    }
    const s = dbsRecord.status;
    if (s === "Clear" || s === "Cleared" || s === "Valid") return "Cleared";
    return s || "Pending";
  };

  const effectiveStatus = getEffectiveStatus(dbs);

  return (
    <Card className={cn("p-6 flex flex-col gap-6 w-full font-sans", className)}>
      <DocumentViewerModal
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        title="DBS Certificate Document"
        documentPath={dbs?.documentUrl || undefined}
        staffId={staffId}
      />

      {/* Header Section */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 min-h-[44px]">
        <h3 className="text-h7 font-medium text-[#141F1E]">
          DBS Check Details
        </h3>

        <div className="flex items-center gap-2">
          {dbs?.documentUrl && (
            <Button
              onClick={() => setViewerOpen(true)}
              variant="outline"
              size="sm"
              className="gap-1.5 text-md text-primary"
            >
              <FileText className="w-3.5 h-3.5 text-primary" />
              View Certificate
            </Button>
          )}
          <Button onClick={onEdit} variant="ghost" size="icon" aria-label="Edit">
            <Edit className="w-4 h-4" />

          </Button>
        </div>
      </div>

      {/* Content Container */}
      <div className="flex flex-col gap-5 w-full flex-1 justify-between">
        {complianceLoading && !hasStaffFallback ? (
          <div className="flex items-center justify-center py-12 flex-1">
            <div className="animate-spin w-6 h-6 border-2 border-[#4A706A] border-t-transparent rounded-full" />
          </div>
        ) : dbs ? (
          <div className="flex flex-col gap-5 w-full">
            {/* ROW 1 */}
            <div className="grid grid-cols-2 gap-8 w-full">
              {/* Status */}
              <InfoField label="Status">
                <span
                  className={cn(
                    "inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-md font-medium border w-fit shrink-0",
                    effectiveStatus === "Cleared"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                      : effectiveStatus === "Expired" || effectiveStatus === "Action Required"
                        ? "bg-red-50 text-red-700 border-red-300"
                        : "bg-amber-50 text-amber-700 border-amber-300"
                  )}
                >
                  {effectiveStatus}
                </span>
              </InfoField>

              {/* Certificate Number */}
              <InfoField
                label="Certificate Number"
                value={dbs.certificateNumber || "Not set"}
              />
            </div>

            {/* ROW 2 */}
            <div className="grid grid-cols-2 gap-8 w-full">
              {/* DBS Type */}
              <InfoField
                label="DBS Type"
                value={dbs.type || "Enhanced"}
              />

              {/* Update Service */}
              <InfoField
                label="Update Service Registered"
                value={dbs.updateService ? "Yes" : "No"}
              />
            </div>

            {/* ROW 3 */}
            <div className="grid grid-cols-2 gap-8 w-full">
              {/* Issue Date */}
              <InfoField
                label="Issue Date"
                value={
                  dbs.issueDate
                    ? format(new Date(dbs.issueDate), "dd MMM yyyy")
                    : "Not set"
                }
              />

              {/* Expiry Date */}
              <InfoField
                label="Expiry Date"
                value={
                  dbs.expiryDate
                    ? format(new Date(dbs.expiryDate), "dd MMM yyyy")
                    : "Not set"
                }
                subValue={
                  dbs.expiryDate ? (
                    isDbsExpired(dbs.expiryDate) ? (
                      <Text as="span" size="md" weight="regular" className="text-red-600 text-md font-medium">
                        Expired
                      </Text>
                    ) : isDbsExpiring(dbs.expiryDate) ? (
                      <Text as="span" size="md" weight="regular" className="text-[#C38C0B] text-md font-medium">
                        Expiring Soon
                      </Text>
                    ) : null
                  ) : null
                }
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-3 border border-dashed rounded-xl border-slate-200 my-auto">
            <ShieldAlert className="w-8 h-8 text-slate-400" />
            <Text size="md" weight="regular" className="text-slate-500 italic">
              No DBS details recorded.
            </Text>
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
            >
              Add DBS Check
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
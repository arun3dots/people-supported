"use client";

import React, { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@repo/ui/components/ui/Dialog";
import { Button } from "@repo/ui/components/ui/Button";
import { Badge } from "@repo/ui/components/ui/Badge";
import { Briefcase, Calendar, FileText, Globe, Fingerprint, Eye, UserCheck, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { type RtwRecord } from "../../../../../../../lib/queries/staff/useComplianceQueries";
import { cn } from "@repo/ui/lib/utils";
import { DocumentViewerModal } from "../DocumentViewerModal";

interface RtwDetailsModalProps {
  staffName: string;
  data?: RtwRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getStatusColor = (status?: string) => {
  switch (status) {
    case "Verified": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Expired": return "bg-red-50 text-red-700 border-red-200";
    case "Requires Follow-up": return "bg-yellow-50 text-yellow-700 border-yellow-200";
    default: return "bg-gray-100 text-gray-600 border-gray-200";
  }
};

export function RtwDetailsModal({
  staffName,
  data,
  open,
  onOpenChange,
}: RtwDetailsModalProps) {
  const [viewerOpen, setViewerOpen] = useState(false);

  if (!data) return null;

  const DetailItem = ({ label, value, icon: Icon, mono = false }: { label: string; value?: string | null; icon?: any; mono?: boolean }) => {
    if (!value) return null;
    return (
      <div className="flex flex-col space-y-1 py-3 border-b border-border/50 last:border-0">
        <span className="text-md font-medium text-muted-foreground flex items-center gap-1.5">
          {Icon && <Icon className="w-3.5 h-3.5" />}
          {label}
        </span>
        <span className={cn("text-md font-semibold", mono && "font-mono bg-muted/30 px-1.5 py-0.5 rounded w-fit")}>
          {value}
        </span>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className={cn("font-bold", getStatusColor(data.rtwStatus))}>
              {data.rtwStatus}
            </Badge>
          </div>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Briefcase className="w-5 h-5 text-primary" />
            Right to Work Details
          </DialogTitle>
          <DialogDescription>
            Full verification records for {staffName}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 grid grid-cols-2 gap-x-6">
          <div className="col-span-2 bg-muted/20 p-3 rounded-lg mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white rounded-md shadow-sm border border-border">
                {data.verificationType === "Manual" && <FileText className="w-4 h-4 text-blue-600" />}
                {data.verificationType === "ShareCode" && <Globe className="w-4 h-4 text-emerald-600" />}
                {data.verificationType === "IDVT" && <Fingerprint className="w-4 h-4 text-purple-600" />}
              </div>
              <div>
                <p className="text-md text-muted-foreground leading-none">Verification Path</p>
                <p className="text-md font-bold">{data.verificationType}</p>
              </div>
            </div>
          </div>

          <DetailItem label="Document Type" value={data.documentType} icon={FileText} />
          <DetailItem label="Document Number" value={data.documentNumber} mono icon={FileText} />

          <DetailItem
            label="Issue Date"
            value={data.issueDate ? format(new Date(data.issueDate), "dd MMM yyyy") : null}
            icon={Calendar}
          />
          <DetailItem
            label="Expiry Date"
            value={data.expiryDate ? format(new Date(data.expiryDate), "dd MMM yyyy") : "N/A"}
            icon={Calendar}
          />

          {data.verificationType === "ShareCode" && (
            <div className="col-span-2">
              <DetailItem label="Share Code" value={data.shareCode} mono icon={Globe} />
            </div>
          )}

          {data.verificationType === "IDVT" && (
            <>
              <DetailItem label="IDVT Provider" value={data.idvtProvider} icon={Fingerprint} />
              <DetailItem label="Transaction Ref" value={data.transactionRef} mono icon={Fingerprint} />
            </>
          )}

          <div className="col-span-2 grid grid-cols-2 gap-x-6 bg-primary/5 rounded-lg p-3 mt-2">
            <DetailItem
              label="Verified By"
              value={data.verifierName}
              icon={UserCheck}
            />
            <DetailItem
              label="Verification Date"
              value={data.verificationDate ? format(new Date(data.verificationDate), "dd MMM yyyy") : null}
              icon={Calendar}
            />
          </div>

          {data.workRestrictions && (
            <div className="col-span-2">
              <DetailItem label="Work Restrictions" value={data.workRestrictions} icon={AlertCircle} />
            </div>
          )}
        </div>

        {data.documentUrl && (
          <div className="mt-6 p-4 border border-dashed border-border rounded-xl bg-muted/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border border-border shadow-sm">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-md font-semibold">Verification Document</p>
                  <p className="text-md text-muted-foreground ">Protected View</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => setViewerOpen(true)}
              >
                <Eye className="w-3.5 h-3.5" />
                View Document
              </Button>
            </div>
          </div>
        )}

        <DocumentViewerModal
          open={viewerOpen}
          onOpenChange={setViewerOpen}
          title="Right to Work Verification Document"
          documentPath={data.documentUrl}
          staffId={data.userId}
        />

        <DialogFooter className="mt-6">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Close Details
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

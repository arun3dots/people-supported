"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  CheckSquare,
  ClipboardCheck,
  RefreshCw,
  History,
  GitCompare,
  HeartPulse,
  Activity,
  AlertCircle,
  FileDown,
  Loader2,
} from "lucide-react";
import { Button, toast } from "@repo/ui/components/ui";
import { downloadCarePlanPdf } from "../../../../../../../lib/utils/download-pdf";

export interface ApprovalActionData {
  id: string;
  role: string;
  decision: string;
  comments?: string | null;
}

interface CarePlanClinicalActionsProps {
  planId?: string;
  residentName?: string;
  status: string;
  isEditable: boolean;
  isPendingApproval: boolean;
  isSubmitting?: boolean;
  onSubmitForApproval?: () => void;
  onOpenApprovalModal?: (approval: ApprovalActionData) => void;
  pendingApproval?: ApprovalActionData | null;
  onOpenReview?: () => void;
  onOpenRenew?: () => void;
  onOpenDiff?: () => void;
  onOpenTransferPack?: () => void;
  onOpenCalculators?: () => void;
  hasPreviousVersion?: boolean;
  restrictiveTasksWithoutMca?: boolean;
}

export function CarePlanClinicalActions({
  planId,
  residentName,
  status,
  isEditable,
  isPendingApproval,
  isSubmitting = false,
  onSubmitForApproval,
  onOpenApprovalModal,
  pendingApproval,
  onOpenReview,
  onOpenRenew,
  onOpenDiff,
  onOpenTransferPack,
  onOpenCalculators,
  hasPreviousVersion = false,
  restrictiveTasksWithoutMca = false,
}: CarePlanClinicalActionsProps) {
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);
  const isActive = status === "Active" || status === "active";
  const isExpired = status === "Expired" || status === "expired";

  const handleDownload = async () => {
    if (!planId) return;
    try {
      setIsDownloading(true);
      await downloadCarePlanPdf(planId, residentName);
      toast({
        title: "Download Started",
        description: "Your CQC Person-Centred PDF Care Plan is downloading.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Download failed";
      toast({
        title: "Download Failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap font-['Outfit',sans-serif]">
      {/* 0. Direct PDF Care Plan Download */}
      {planId && (
        <Button
          size="sm"
          variant="outline"
          disabled={isDownloading}
          onClick={handleDownload}
          className="h-8 gap-1.5 border-emerald-300 text-emerald-800 hover:bg-emerald-50 rounded-xl text-md font-semibold cursor-pointer shadow-2xs"
        >
          {isDownloading ? (
            <Loader2 className="size-3.5 animate-spin text-emerald-700" />
          ) : (
            <FileDown className="size-3.5 text-emerald-700" />
          )}
          Download PDF Plan
        </Button>
      )}
      {/* 1. Clinical Tools Modal Trigger */}
      {onOpenCalculators && (
        <Button
          size="sm"
          variant="outline"
          onClick={onOpenCalculators}
          className="h-8 gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-md font-semibold cursor-pointer"
        >
          <Activity className="size-3.5 text-indigo-600" /> Clinical Tools
        </Button>
      )}

      {/* 2. e-RedBag Transfer Pack Trigger */}
      {onOpenTransferPack && (
        <Button
          size="sm"
          variant="outline"
          onClick={onOpenTransferPack}
          className="h-8 gap-1.5 border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl text-md font-semibold cursor-pointer"
        >
          <HeartPulse className="size-3.5 text-rose-600" /> e-RedBag
        </Button>
      )}

      {/* 3. Version History Route Navigation */}
      {planId && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push(`/admin/care-plans/${planId}/history`)}
          className="h-8 gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-md font-semibold cursor-pointer"
        >
          <History className="size-3.5 text-slate-500" /> Version History
        </Button>
      )}

      {/* 3b. Version Diff Comparison Trigger */}
      {hasPreviousVersion && onOpenDiff && (
        <Button
          size="sm"
          variant="outline"
          onClick={onOpenDiff}
          className="h-8 gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-md font-semibold cursor-pointer"
        >
          <GitCompare className="size-3.5 text-slate-500" /> Compare Changes
        </Button>
      )}

      {/* 4. Submit for Approval (Draft / ChangesRequested) */}
      {isEditable && onSubmitForApproval && (
        <div className="flex items-center gap-1.5">
          {restrictiveTasksWithoutMca && (
            <span
              className="inline-flex items-center gap-1 text-md font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200"
              title="Warning: Restrictive interventions exist without documented MCA assessment"
            >
              <AlertCircle className="size-3 text-amber-600" /> MCA Review Advised
            </span>
          )}
          <Button
            size="sm"
            onClick={onSubmitForApproval}
            disabled={isSubmitting}
            className="h-8 gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-md font-semibold cursor-pointer"
          >
            <Send className="size-3.5" />
            {isSubmitting ? "Submitting..." : "Submit for Sign-off"}
          </Button>
        </div>
      )}

      {/* 5. Sign-off / Record Decision (Pending Approval) */}
      {isPendingApproval && pendingApproval && onOpenApprovalModal && (
        <Button
          size="sm"
          onClick={() => onOpenApprovalModal(pendingApproval)}
          className="h-8 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-md font-semibold cursor-pointer animate-pulse"
        >
          <CheckSquare className="size-3.5" /> Sign-off Care Plan
        </Button>
      )}

      {/* 6. Monthly Evaluation (CQC Reg 17) */}
      {isActive && onOpenReview && (
        <Button
          size="sm"
          onClick={onOpenReview}
          className="h-8 gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-md font-semibold cursor-pointer"
        >
          <ClipboardCheck className="size-3.5" /> Record Monthly Review
        </Button>
      )}

      {/* 7. Renew / Major Revision */}
      {(isActive || isExpired) && onOpenRenew && (
        <Button
          size="sm"
          variant="outline"
          onClick={onOpenRenew}
          className="h-8 gap-1.5 border-emerald-700 text-emerald-800 hover:bg-emerald-50 rounded-xl text-md font-semibold cursor-pointer"
        >
          <RefreshCw className="size-3.5 text-emerald-800" /> Renew Care Plan
        </Button>
      )}
    </div>
  );
}

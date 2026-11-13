"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Text, toast } from "@repo/ui/components/ui";
import { ArrowLeft, ClipboardCheck, Activity, HeartPulse, FileDown, Loader2, History } from "lucide-react";
import { downloadCarePlanPdf } from "../../../../../../lib/utils/download-pdf";

interface CarePlanTopBarProps {
  residentName: string;
  status: string;
  versions: Array<{ id: string; versionNumber: number }>;
  currentPlanId: string;
  onOpenReview: () => void;
  onOpenCalculators: () => void;
  onOpenTransferPack: () => void;
}

export function CarePlanTopBar({
  residentName,
  status,
  versions,
  currentPlanId,
  onOpenReview,
  onOpenCalculators,
  onOpenTransferPack,
}: CarePlanTopBarProps) {
  const router = useRouter();
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      await downloadCarePlanPdf(currentPlanId, residentName);
      toast({
        title: "Download Started",
        description: "Your CQC-compliant PDF Care Plan is downloading.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "PDF download failed";
      toast({
        title: "Download Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Link href="/admin/care-plans">
          <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-slate-600 rounded-xl">
            <ArrowLeft className="size-4" /> Back to Care Plans
          </Button>
        </Link>
        <span className="text-slate-300">/</span>
        <Text size="md" weight="semibold" className="text-slate-900">
          {residentName}
        </Text>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          variant="outline"
          disabled={isDownloadingPdf}
          onClick={handleDownloadPdf}
          className="h-8 gap-1.5 border-emerald-300 text-emerald-800 hover:bg-emerald-50 rounded-xl text-md font-semibold cursor-pointer shadow-2xs"
        >
          {isDownloadingPdf ? (
            <Loader2 className="size-3.5 animate-spin text-emerald-700" />
          ) : (
            <FileDown className="size-3.5 text-emerald-700" />
          )}
          Download PDF Plan
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={onOpenTransferPack}
          className="h-8 gap-1.5 border-red-200 text-red-700 hover:bg-red-50 rounded-xl text-md font-semibold cursor-pointer"
        >
          <HeartPulse className="size-3.5 text-red-600" /> e-RedBag Transfer
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push(`/admin/care-plans/${currentPlanId}/history`)}
          className="h-8 gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-md font-semibold cursor-pointer"
        >
          <History className="size-3.5 text-slate-600" /> Full History
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={onOpenCalculators}
          className="h-8 gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-md font-semibold cursor-pointer"
        >
          <Activity className="size-3.5 text-indigo-600" /> Clinical Tools
        </Button>

        {status === "Active" && (
          <Button
            size="sm"
            onClick={onOpenReview}
            className="h-8 gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-md font-semibold cursor-pointer"
          >
            <ClipboardCheck className="size-3.5" /> Monthly Evaluation
          </Button>
        )}

        {Array.isArray(versions) && versions.length > 1 ? (
          <div className="flex items-center gap-2">
            <Text size="md" weight="semibold" variant="muted">
              Switch Version:
            </Text>
            <div className="flex items-center gap-1.5 bg-surface-card-grey p-1 rounded-xl">
              {(() => {
                const seenNumbers = new Set<number>();
                const uniqueVersions = versions.filter((v) => {
                  if (v.id === currentPlanId) return true;
                  if (seenNumbers.has(v.versionNumber)) return false;
                  seenNumbers.add(v.versionNumber);
                  return true;
                });
                return uniqueVersions.map((v) => {
                  const isSelected = v.id === currentPlanId;
                  const vPill = `v${String(v.versionNumber).padStart(4, "0")}`;
                  return (
                    <button
                      key={v.id}
                      onClick={() => router.push(`/admin/care-plans/${v.id}`)}
                      className={`px-2.5 py-1 text-md font-mono rounded-lg transition-all cursor-pointer ${
                        isSelected
                          ? "bg-white text-slate-900 shadow-xs font-bold"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      {vPill}
                    </button>
                  );
                });
              })()}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

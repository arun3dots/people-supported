"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button, Card, EmptyState, Text } from "@repo/ui/components/ui";
import { useToast } from "@repo/ui/hooks";
import { useGetResidentQuery } from "../../../../../../lib/queries/residents";
import { useListNeedCarePlansQuery } from "../../../../../../lib/queries/care-journey";
import { useExportResidentSarMutation } from "../../../../../../lib/queries/data-rights/useDataRights";
import { useAuth } from "../../../../../../lib/context/AuthContext";
import { ResidentHeroBanner } from "./ResidentHeroBanner";
import { ResidentPageHeader } from "./ResidentPageHeader";
import { ResidentRecordOverview } from "./record";
import { SupportPlanTab } from "./SupportPlanTab";
import { ResidentAssessmentsTab } from "./ResidentAssessmentsTab";
import { ResidentMarTab } from "./ResidentMarTab";
import { ResidentIncidentsTab } from "./ResidentIncidentsTab";
import { ResidentDocumentsTab } from "./ResidentDocumentsTab";
import { ResidentHistoryTab } from "./ResidentHistoryTab";
import { DischargeResidentDialog } from "./DischargeResidentDialog";

interface ResidentProfileClientProps {
  residentId: string;
}

export function ResidentProfileClient({ residentId }: ResidentProfileClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const roleLower = user?.roleName?.toLowerCase();
  const isAdmin = roleLower === "admin" || roleLower === "manager";
  const roleBase = isAdmin ? "admin" : "carer";

  const plansQuery = useListNeedCarePlansQuery(residentId);
  const carePlanSummary = useMemo(() => {
    const plans = plansQuery.data ?? [];
    const reviewDates = plans
      .map((p) => p.reviewDate)
      .filter((d): d is string => Boolean(d))
      .sort();
    return {
      total: plans.length,
      agreed: plans.filter((p) => p.agreedAt != null).length,
      nextReviewDate: reviewDates[0] ?? null,
    };
  }, [plansQuery.data]);

  const exportSar = useExportResidentSarMutation();

  const rawTab = searchParams.get("tab")?.toLowerCase();
  const normalizedTab =
    rawTab === "medication" || rawTab === "medications" || rawTab === "mar"
      ? "mar"
      : rawTab === "care-plan" || rawTab === "careplans" || rawTab === "support-plan" || rawTab === "careplan"
        ? "careplan"
        : rawTab === "assessments" ||
            rawTab === "assessment" ||
            rawTab === "risk" ||
            rawTab === "riskassessment" ||
            rawTab === "observation" ||
            rawTab === "observations" ||
            rawTab === "body-map" ||
            rawTab === "bodymap" ||
            rawTab === "fluid-intake" ||
            rawTab === "fluid" ||
            rawTab === "hydration"
          ? "assessments"
          : rawTab === "incidents" || rawTab === "incident"
            ? "incidents"
            : rawTab === "documents" || rawTab === "document"
              ? "documents"
              : rawTab === "history" ||
                  rawTab === "timeline" ||
                  rawTab === "taskhistory" ||
                  rawTab === "tasks" ||
                  rawTab === "task" ||
                  rawTab === "notes"
                ? "timeline"
                : "overview";

  const [activeTab, setActiveTab] = useState(normalizedTab);
  const [dischargeOpen, setDischargeOpen] = useState(false);

  useEffect(() => {
    const onPop = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab")?.toLowerCase();
      if (tab) setActiveTab(tab);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("tab", newTab);
      window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
    }
  };

  const handleExportSar = async () => {
    try {
      await exportSar.mutateAsync({ residentId, format: "json" });
      toast({
        title: "SAR Dossier Exported",
        description:
          "UK GDPR Art 15 Subject Access Request dossier downloaded and logged in the audit trail.",
      });
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "SAR Export Failed",
        description:
          err instanceof Error ? err.message : "Could not export SAR dossier",
      });
    }
  };

  const { data: resident, isLoading, isError, refetch } = useGetResidentQuery(residentId);

  if (isLoading) {
    return (
      <Card
        variant="surface"
        className="min-h-96 flex flex-col items-center justify-center p-8 text-text-description font-sans"
      >
        <Loader2 className="size-8 animate-spin text-primary mb-3" />
        <Text size="md" weight="medium" variant="muted">
          Loading person supported details…
        </Text>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card variant="surface" className="p-8 font-sans">
        <EmptyState
          title="Unable to load record"
          description="There was an error communicating with the server while fetching this record."
          action={
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button variant="outline" onClick={() => refetch()}>
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/${roleBase}/residents`)}
              >
                <ArrowLeft className="size-4" />
                Back to People Supported
              </Button>
            </div>
          }
        />
      </Card>
    );
  }

  if (!resident) {
    return (
      <Card variant="surface" className="p-8 font-sans">
        <EmptyState
          title="Record not found"
          description="The requested person supported record could not be found or has been removed."
          action={
            <Button
              variant="outline"
              onClick={() => router.push(`/${roleBase}/residents`)}
            >
              <ArrowLeft className="size-4" />
              Back to People Supported
            </Button>
          }
        />
      </Card>
    );
  }

  const isReadOnlyResident = Boolean(
    resident.isDraft || String(resident.status || "").toLowerCase() === "discharged",
  );

  return (
    <div className="space-y-6 pb-12 font-sans">
      <ResidentPageHeader
        resident={resident}
        roleBase={roleBase}
        onEditClick={
          isAdmin ? () => router.push(`/admin/residents/admit?id=${residentId}&step=1`) : undefined
        }
        onDischargeClick={
          isAdmin ? () => router.push(`/admin/residents/${residentId}/discharge`) : undefined
        }
        onExportSarClick={isAdmin ? handleExportSar : undefined}
        isExportingSar={exportSar.isPending}
      />

      <ResidentHeroBanner
        resident={resident}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        carePlanSummary={carePlanSummary}
      />

      {/* 7 Consolidated Tabs */}
      {activeTab === "overview" && (
        <ResidentRecordOverview
          residentId={resident.id}
          canEdit={isAdmin}
          onNavigateTab={handleTabChange}
        />
      )}
      {activeTab === "careplan" && (
        <SupportPlanTab resident={resident} canEdit={isAdmin} />
      )}
      {activeTab === "assessments" && <ResidentAssessmentsTab resident={resident} />}
      {activeTab === "mar" && <ResidentMarTab resident={resident} />}
      {activeTab === "incidents" && <ResidentIncidentsTab resident={resident} />}
      {activeTab === "documents" && <ResidentDocumentsTab residentId={resident.id} />}
      {activeTab === "timeline" && (
        <ResidentHistoryTab
          resident={resident}
          isReadOnly={isReadOnlyResident}
          initialSubTab={
            rawTab === "notes" ? "notes" : rawTab === "tasks" ? "tasks" : "timeline"
          }
        />
      )}

      {isAdmin && (
        <DischargeResidentDialog
          resident={resident}
          open={dischargeOpen}
          onOpenChange={setDischargeOpen}
        />
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Text,
} from "@repo/ui/components/ui";
import {
  useGetResidentCapacityAssessmentsQuery,
  useGetResidentDolsQuery,
} from "../../../../../../lib/queries/mca-dols";
import { CreateCapacityAssessmentModal } from "./CreateCapacityAssessmentModal";
import { CreateDolsModal } from "./CreateDolsModal";
import { CapacityAssessmentsSection } from "./CapacityAssessmentsSection";
import { DolsAuthorizationsSection } from "./DolsAuthorizationsSection";
import {
  Brain,
  ShieldCheck,
  Plus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

interface MentalCapacityDolsTabProps {
  carePlanId: string;
  residentId: string;
  residentName: string;
}

export function MentalCapacityDolsTab({
  carePlanId,
  residentId,
  residentName,
}: MentalCapacityDolsTabProps) {
  const [isCapacityModalOpen, setIsCapacityModalOpen] = useState(false);
  const [isDolsModalOpen, setIsDolsModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<"assessments" | "dols">("assessments");

  const { data: assessments = [], isLoading: isLoadingAssessments } =
    useGetResidentCapacityAssessmentsQuery(residentId);
  const { data: dolsList = [], isLoading: isLoadingDols } =
    useGetResidentDolsQuery(residentId);

  // Active DoLS computation
  const activeDols = dolsList.find(
    (d) => d.status === "Authorized" || d.status === "UrgentApplied"
  );
  const isExpiringSoon =
    activeDols?.expiryDate &&
    new Date(activeDols.expiryDate).getTime() - Date.now() <
    30 * 24 * 60 * 60 * 1000;

  const getDaysLeft = (expiryDate?: string | Date | null) => {
    if (!expiryDate) return null;
    const diff = new Date(expiryDate).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6 font-['Outfit',sans-serif]">
      {/* Top Banner & Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* DoLS Status Overview Card */}
        <Card className="border border-slate-200/80 bg-white rounded-2xl shadow-none">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                DoLS Safeguard Status
              </span>
              <ShieldCheck className="size-4 text-emerald-800" />
            </div>
            <CardTitle className="text-base font-bold text-slate-900 pt-1">
              {activeDols ? activeDols.status : "No Active Authorisation"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-md">
            {activeDols ? (
              <div className="space-y-1">
                <div className="text-slate-600">
                  <span className="font-medium">Authority:</span> {activeDols.supervisoryBody}
                </div>
                {activeDols.expiryDate && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-3 text-slate-400" />
                    <span className={isExpiringSoon ? "text-amber-700 font-semibold" : "text-slate-600"}>
                      {getDaysLeft(activeDols.expiryDate)} days remaining
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <span className="text-slate-500">
                No restrictive interventions requiring statutory authorisation logged.
              </span>
            )}
          </CardContent>
        </Card>

        {/* Capacity Decisions Evaluated */}
        <Card className="border border-slate-200/80 bg-white rounded-2xl shadow-none">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                MCA 2005 Decisions
              </span>
              <Brain className="size-4 text-emerald-800" />
            </div>
            <CardTitle className="text-base font-bold text-slate-900 pt-1">
              {assessments.length} Decision{assessments.length === 1 ? "" : "s"} Evaluated
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-md text-slate-600">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <CheckCircle2 className="size-3.5" />
                {assessments.filter((a) => a.hasCapacity).length} with Capacity
              </span>
              <span className="flex items-center gap-1 text-amber-700 font-medium">
                <XCircle className="size-3.5" />
                {assessments.filter((a) => !a.hasCapacity).length} Best Interests
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Action CTA Card */}
        <Card className="border border-slate-200/80 bg-slate-50/70 rounded-2xl shadow-none flex flex-col justify-center p-4">
          <div className="space-y-2">
            <Button
              size="sm"
              onClick={() => setIsCapacityModalOpen(true)}
              className="w-full bg-emerald-800 hover:bg-emerald-900 text-white text-md gap-1.5 h-8 rounded-xl font-semibold cursor-pointer"
            >
              <Plus className="size-3.5" /> Record MCA 2005 Assessment
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsDolsModalOpen(true)}
              className="w-full border-slate-300 text-slate-700 hover:bg-white text-md gap-1.5 h-8 rounded-xl font-semibold cursor-pointer"
            >
              <Plus className="size-3.5" /> Log DoLS Authorisation
            </Button>
          </div>
        </Card>
      </div>

      {/* Expiring Alert Banner if within 30 days */}
      {isExpiringSoon && (
        <div className="p-3.5 bg-amber-50 border border-amber-300/80 rounded-2xl flex items-center justify-between text-md text-amber-900 gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-600 shrink-0" />
            <span>
              <strong>Statutory DoLS Expiry Warning:</strong> The DoLS authorisation for{" "}
              {activeDols?.supervisoryBody} expires in {getDaysLeft(activeDols?.expiryDate)} days.
              Standard renewal application required under CQC Regulation 13.
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsDolsModalOpen(true)}
            className="text-md h-7 border-amber-400 bg-white hover:bg-amber-100 shrink-0 rounded-xl font-semibold cursor-pointer"
          >
            Renew DoLS
          </Button>
        </div>
      )}

      {/* Sub-Section Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={activeSection === "assessments" ? "primary" : "ghost"}
            onClick={() => setActiveSection("assessments")}
            className="text-md gap-1.5 rounded-xl font-semibold cursor-pointer"
          >
            <Brain className="size-3.5" />
            Mental Capacity Assessments ({assessments.length})
          </Button>
          <Button
            size="sm"
            variant={activeSection === "dols" ? "primary" : "ghost"}
            onClick={() => setActiveSection("dols")}
            className="text-md gap-1.5 rounded-xl font-semibold cursor-pointer"
          >
            <ShieldCheck className="size-3.5" />
            DoLS Safeguard Records ({dolsList.length})
          </Button>
        </div>
      </div>

      {/* Section 1: MCA Assessments */}
      {activeSection === "assessments" && (
        <CapacityAssessmentsSection
          assessments={assessments}
          isLoading={isLoadingAssessments}
          onOpenCreateModal={() => setIsCapacityModalOpen(true)}
        />
      )}

      {/* Section 2: DoLS Authorizations */}
      {activeSection === "dols" && (
        <DolsAuthorizationsSection
          dolsList={dolsList}
          isLoading={isLoadingDols}
          onOpenCreateModal={() => setIsDolsModalOpen(true)}
        />
      )}

      {/* Modals */}
      <CreateCapacityAssessmentModal
        isOpen={isCapacityModalOpen}
        onClose={() => setIsCapacityModalOpen(false)}
        residentId={residentId}
        residentName={residentName}
        carePlanId={carePlanId}
      />

      <CreateDolsModal
        isOpen={isDolsModalOpen}
        onClose={() => setIsDolsModalOpen(false)}
        residentId={residentId}
        residentName={residentName}
      />
    </div>
  );
}

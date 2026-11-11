"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Badge,
  Text,
  Alert,
  AlertDescription,
  Textarea,
} from "@repo/ui/components/ui";
import {
  Activity,
  PhoneCall,
  Ambulance,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from "lucide-react";
import {
  ClinicalEscalationItemDTO,
  TriageActionDecision,
  calculateNEWS2Score,
} from "@repo/schema";
import { useTriageEscalationMutation } from "../../../../lib/queries/escalations";
import { SbarVitalsTab } from "./SbarVitalsTab";

interface SbarTriageModalProps {
  isOpen: boolean;
  onClose: () => void;
  escalation: ClinicalEscalationItemDTO | null;
  onSuccess?: () => void;
}

export function SbarTriageModal({
  isOpen,
  onClose,
  escalation,
  onSuccess,
}: SbarTriageModalProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<"sbar" | "vitals" | "decision">("sbar");
  const [decision, setDecision] = useState<TriageActionDecision>("ResolveOnSite");
  const [situation, setSituation] = useState("");
  const [background, setBackground] = useState("");
  const [assessment, setAssessment] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [nurseNotes, setNurseNotes] = useState("");

  // Vitals
  const [bpSystolic, setBpSystolic] = useState<number | undefined>(undefined);
  const [bpDiastolic, setBpDiastolic] = useState<number | undefined>(undefined);
  const [pulse, setPulse] = useState<number | undefined>(undefined);
  const [temp, setTemp] = useState<number | undefined>(undefined);
  const [spo2, setSpo2] = useState<number | undefined>(undefined);
  const [respiration, setRespiration] = useState<number | undefined>(undefined);
  const [consciousness, setConsciousness] = useState<string>("Alert");

  const triageMutation = useTriageEscalationMutation(escalation?.id || "");

  useEffect(() => {
    if (escalation && isOpen) {
      setSituation(escalation.sbarSituation || `Alert: ${escalation.reason}. ${escalation.initialNotes}`);
      setBackground(
        escalation.sbarBackground ||
          `Resident ${escalation.resident?.fullName || ""}. NHS: ${escalation.resident?.nhsNumber || "N/A"}. DNACPR: ${escalation.resident?.dnarStatus ? "Yes" : "No"}.`,
      );
      setAssessment(escalation.sbarAssessment || "");
      setRecommendation(escalation.sbarRecommendation || "");
      setNurseNotes("");
      setDecision("ResolveOnSite");
      setActiveTab("sbar");
    }
  }, [escalation, isOpen]);

  const liveNews2 = calculateNEWS2Score({
    bpSystolic,
    bpDiastolic,
    pulse,
    temp,
    spo2,
    respiration,
    consciousness,
    spo2Scale: 1,
  }).score;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!escalation) return;

    const hasVitals =
      bpSystolic !== undefined ||
      pulse !== undefined ||
      temp !== undefined ||
      spo2 !== undefined ||
      respiration !== undefined;

    await triageMutation.mutateAsync({
      decision,
      sbarSituation: situation.trim() || "Situation documented",
      sbarBackground: background.trim() || "Background documented",
      sbarAssessment: assessment.trim() || `Assessment performed. NEWS2: ${liveNews2}`,
      sbarRecommendation: recommendation.trim() || `Action decided: ${decision}`,
      nurseNotes: nurseNotes.trim() || undefined,
      vitals: hasVitals
        ? {
            bpSystolic,
            bpDiastolic,
            pulse,
            temp,
            spo2,
            respiration,
            consciousness,
            news2Score: liveNews2,
          }
        : undefined,
    });

    if (onSuccess) onSuccess();
    onClose();
  };

  if (!escalation) return <></>;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="2xl">
        <DialogHeader>
          <DialogTitle>
            SBAR Clinical Triage &amp; Decision Hub
          </DialogTitle>
          <DialogDescription>
            {escalation.resident?.fullName} {escalation.resident?.bed?.room?.roomNumber ? `• Room ${escalation.resident.bed.room.roomNumber}` : ""}
          </DialogDescription>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 pt-3 gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveTab("sbar")}
            className={`rounded-none border-b-2 ${
              activeTab === "sbar" ? "border-emerald-800 text-emerald-900" : "border-transparent text-slate-500"
            }`}
          >
            1. SBAR Clinical Overview
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveTab("vitals")}
            className={`rounded-none border-b-2 gap-1.5 ${
              activeTab === "vitals" ? "border-emerald-800 text-emerald-900" : "border-transparent text-slate-500"
            }`}
          >
            2. Vitals &amp; NEWS2
            {liveNews2 > 0 && (
              <Badge variant={liveNews2 >= 5 ? "destructive" : "default"}>
                Score {liveNews2}
              </Badge>
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveTab("decision")}
            className={`rounded-none border-b-2 ${
              activeTab === "decision" ? "border-emerald-800 text-emerald-900" : "border-transparent text-slate-500"
            }`}
          >
            3. Action Decision &amp; Handoff
          </Button>
        </div>

        <form noValidate onSubmit={handleSubmit} className="p-6 space-y-4">
          {activeTab === "sbar" && (
            <div className="space-y-3.5">
              <Alert>
                <AlertDescription>
                  <Text weight="bold">Initial Trigger:</Text> {escalation.reason} — {escalation.initialNotes}
                  <Text className="mt-1 text-slate-500">
                    Raised by {escalation.raisedBy?.fullName || "Carer"}
                  </Text>
                </AlertDescription>
              </Alert>

              <div className="space-y-1">
                <Text weight="semibold">S — Situation</Text>
                <Textarea
                  rows={2}
                  value={situation}
                  onChange={(e) => setSituation(e.target.value)}
                  placeholder="Immediate clinical situation..."
                />
              </div>

              <div className="space-y-1">
                <Text weight="semibold">B — Background</Text>
                <Textarea
                  rows={2}
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  placeholder="Medical history, baseline cognitive state, DNACPR..."
                />
              </div>

              <div className="space-y-1">
                <Text weight="semibold">A — Assessment Notes</Text>
                <Textarea
                  rows={2}
                  value={assessment}
                  onChange={(e) => setAssessment(e.target.value)}
                  placeholder="Nurse assessment, physical observations, symptoms..."
                />
              </div>
            </div>
          )}

          {activeTab === "vitals" && (
            <SbarVitalsTab
              bpSystolic={bpSystolic}
              onBpSystolicChange={setBpSystolic}
              bpDiastolic={bpDiastolic}
              onBpDiastolicChange={setBpDiastolic}
              pulse={pulse}
              onPulseChange={setPulse}
              temp={temp}
              onTempChange={setTemp}
              spo2={spo2}
              onSpo2Change={setSpo2}
              respiration={respiration}
              onRespirationChange={setRespiration}
              consciousness={consciousness}
              onConsciousnessChange={setConsciousness}
              liveNews2={liveNews2}
            />
          )}

          {activeTab === "decision" && (
            <div className="space-y-4">
              <Text weight="semibold">Select Clinical Action Decision</Text>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "ResolveOnSite", label: "Resolve on Site", desc: "Care advice / reassurance", icon: CheckCircle2 },
                  { id: "IncreaseMonitoring", label: "Increase Monitoring", desc: "Frequent obs checks", icon: Clock },
                  { id: "CallGP", label: "Contact GP / 111", desc: "Doctor consultation booked", icon: PhoneCall },
                  { id: "Call999", label: "Emergency 999", desc: "Immediate A&E ambulance", icon: Ambulance },
                  { id: "EscalateToManager", label: "Escalate to Manager", desc: "Safeguarding / CQC Reg 18", icon: ShieldAlert },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = decision === item.id;
                  return (
                    <Button
                      key={item.id}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => setDecision(item.id as TriageActionDecision)}
                      className="h-auto py-3 justify-start items-start gap-3"
                    >
                      <Icon className="size-4 shrink-0 mt-0.5" />
                      <div className="text-left">
                        <div>{item.label}</div>
                        <div className="text-slate-500 font-normal">{item.desc}</div>
                      </div>
                    </Button>
                  );
                })}
              </div>

              <div className="space-y-1">
                <Text weight="semibold">R — Recommendation &amp; Actions</Text>
                <Textarea
                  rows={2}
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                  placeholder="Recommendations for carer team and incoming shift..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <div className="flex gap-2">
              {activeTab !== "sbar" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab(activeTab === "decision" ? "vitals" : "sbar")}
                >
                  Previous
                </Button>
              )}
              {activeTab !== "decision" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab(activeTab === "sbar" ? "vitals" : "decision")}
                >
                  Next Step
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={triageMutation.isPending}
              >
                {triageMutation.isPending ? "Submitting..." : "Complete SBAR Triage"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

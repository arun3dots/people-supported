"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Badge,
  Checkbox,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
  Alert,
  AlertTitle,
  AlertDescription,
} from "@repo/ui/components/ui";
import { ShieldAlert, CheckCircle2 } from "lucide-react";
import { ClinicalEscalationItemDTO } from "@repo/schema";
import { useSignOffEscalationMutation } from "../../../../lib/queries/escalations";

interface ManagerSignOffModalProps {
  isOpen: boolean;
  onClose: () => void;
  escalation: ClinicalEscalationItemDTO | null;
  onSuccess?: () => void;
}

export function ManagerSignOffModal({
  isOpen,
  onClose,
  escalation,
  onSuccess,
}: ManagerSignOffModalProps): React.JSX.Element {
  const [managerNotes, setManagerNotes] = useState("");
  const [cqcReportable, setCqcReportable] = useState(false);
  const [cqcNotificationType, setCqcNotificationType] = useState("HospitalAdmission");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const signOffMutation = useSignOffEscalationMutation(escalation?.id || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!escalation) return;

    if (!managerNotes || managerNotes.trim().length < 3) {
      setErrorMsg("Please provide manager review notes (min 3 characters)");
      return;
    }

    try {
      await signOffMutation.mutateAsync({
        managerNotes: managerNotes.trim(),
        cqcReportable,
        cqcNotificationType: cqcReportable ? cqcNotificationType : undefined,
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign off";
      setErrorMsg(msg);
    }
  };

  if (!escalation) return <></>;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="2xl" >
        <DialogHeader >

          <DialogTitle >
            Manager Clinical Governance &amp; CQC Sign-off
          </DialogTitle>
          <DialogDescription >
            Statutory review of escalated clinical incident for {escalation.resident?.fullName}
          </DialogDescription>

        </DialogHeader>

        <form noValidate onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <Alert>
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {errorMsg}
              </AlertDescription>
            </Alert>
          )}

          {/* Clinical Case Summary */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-md">
            <div className="flex items-center justify-between">
              <Text weight={'semibold'}>Trigger: {escalation.reason}</Text>
              <Badge variant="outline" state="warning">
                Status: {escalation.status}
              </Badge>
            </div>
            <div className="text-slate-600">
              <Text weight={'semibold'}>Initial Concern:</Text> {escalation.initialNotes}
            </div>
            {escalation.sbarAssessment && (
              <div className="text-slate-600">
                <Text weight={'semibold'}>Nurse Assessment:</Text> {escalation.sbarAssessment}
              </div>
            )}
            {escalation.sbarRecommendation && (
              <div className="text-slate-600">
                <Text weight={'semibold'}>Action Decision:</Text> {escalation.sbarRecommendation}
              </div>
            )}
          </div>

          {/* CQC Statutory Notification Toggle */}
          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2.5">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <Checkbox
                checked={cqcReportable}
                onCheckedChange={(val) => setCqcReportable(val === true)}
                className="text-purple-600 focus:ring-purple-500"
              />
              <Text >
                CQC Regulation 18 Statutory Notification Required
              </Text>
            </label>

            {cqcReportable && (
              <div className="space-y-1.5 pl-6">
                <Text>Notification Category</Text>
                <Select
                  value={cqcNotificationType}
                  onValueChange={setCqcNotificationType}
                >
                  <SelectTrigger className="w-full h-10 px-3 text-md bg-white border border-amber-200 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HospitalAdmission">Emergency Hospital Admission (999 / A&amp;E)</SelectItem>
                    <SelectItem value="SeriousInjury">Serious Physical Injury / Fracture</SelectItem>
                    <SelectItem value="AbuseAllegation">Safeguarding / Abuse Allegation</SelectItem>
                    <SelectItem value="PoliceIncident">Police Incident / Missing Person</SelectItem>
                    <SelectItem value="Death">Death of Person using service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Manager Notes */}
          <div className="space-y-1.5">
            <Text weight={'semibold'}>
              Manager Governance &amp; Action Notes<span className="text-rose-500">*</span>
            </Text>
            <Textarea
              rows={3}
              value={managerNotes}
              onChange={(e) => setManagerNotes(e.target.value)}
              placeholder="Detail management investigation, safeguarding actions, family notifications, or GP follow-ups..."
              className="w-full p-3 text-md bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <DialogFooter >
            <Button type="button" variant="outline" size="sm" onClick={onClose} >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={signOffMutation.isPending}
            >
              <CheckCircle2 className="size-3.5" />
              {signOffMutation.isPending ? "Signing off..." : "Confirm Manager Sign-off"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

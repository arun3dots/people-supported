"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Label,
  Input,
  Textarea,
  Text,
  DatePicker,
} from "@repo/ui/components/ui";
import { useCreateCarePlanReviewMutation } from "../../../../../../lib/queries/care-plan";
import { CarePlanReviewDecision } from "@repo/schema";
import { Calendar, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";

interface MonthlyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  carePlanId: string;
  residentName: string;
}

const DOMAIN_OPTIONS = [
  "Mobility & Transfers",
  "Nutrition & Hydration",
  "Skin Integrity & Pressure Care",
  "Personal Care & Hygiene",
  "Medication & Health",
  "Mental Wellbeing & Cognition",
  "Continence & Elimination",
  "Sleep & Night Routines",
];

export function MonthlyReviewModal({
  isOpen,
  onClose,
  carePlanId,
  residentName,
}: MonthlyReviewModalProps) {
  const defaultNextDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [decision, setDecision] = useState<CarePlanReviewDecision>("MaintainedNoChanges");
  const [summaryNotes, setSummaryNotes] = useState("");
  const [residentFeedback, setResidentFeedback] = useState("");
  const [familyFeedback, setFamilyFeedback] = useState("");
  const [selectedDomains, setSelectedDomains] = useState<string[]>(DOMAIN_OPTIONS);
  const [nextScheduledReview, setNextScheduledReview] = useState(defaultNextDate);
  const [validationError, setValidationError] = useState<string | null>(null);

  const reviewMutation = useCreateCarePlanReviewMutation(carePlanId);

  const toggleDomain = (domain: string) => {
    setSelectedDomains((prev) =>
      prev.includes(domain) ? prev.filter((d) => d !== domain) : [...prev, domain]
    );
  };

  const handleSubmit = () => {
    setValidationError(null);
    if (!summaryNotes.trim()) {
      setValidationError("Clinical evaluation summary notes are required.");
      return;
    }

    reviewMutation.mutate(
      {
        decision,
        summaryNotes: summaryNotes.trim(),
        residentFeedback: residentFeedback.trim() || undefined,
        familyFeedback: familyFeedback.trim() || undefined,
        domainsEvaluated: selectedDomains,
        nextScheduledReview: nextScheduledReview || undefined,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl font-sans max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900">
            Monthly Care Plan Evaluation (CQC Reg 17)
          </DialogTitle>
          <Text size="sm" variant="muted">
            Evaluating active care plan for <span className="font-semibold text-slate-800">{residentName}</span>.
          </Text>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Review Decision Selector */}
          <div className="space-y-2">
            <Label>Evaluation Outcome</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setDecision("MaintainedNoChanges")}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${decision === "MaintainedNoChanges"
                  ? "border-emerald-600 bg-emerald-50/70 text-emerald-900"
                  : "border-slate-200 hover:border-slate-300 text-slate-700"
                  }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-md">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  Maintained
                </div>
                <span className="text-sm text-slate-500">Resident stable, no changes needed.</span>
              </button>

              <button
                type="button"
                onClick={() => setDecision("MinorAdjustments")}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${decision === "MinorAdjustments"
                  ? "border-amber-500 bg-amber-50/70 text-amber-900"
                  : "border-slate-200 hover:border-slate-300 text-slate-700"
                  }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-md">
                  <AlertTriangle className="size-4 text-amber-600" />
                  Minor Adjustments
                </div>
                <span className="text-sm text-slate-500">Routine tweak without new version.</span>
              </button>

              <button
                type="button"
                onClick={() => setDecision("MajorChangeTriggersRenewal")}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${decision === "MajorChangeTriggersRenewal"
                  ? "border-rose-500 bg-rose-50/70 text-rose-900"
                  : "border-slate-200 hover:border-slate-300 text-slate-700"
                  }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-md">
                  <RefreshCw className="size-4 text-rose-600" />
                  Significant Change
                </div>
                <span className="text-sm text-slate-500">Triggers full care plan renewal.</span>
              </button>
            </div>
          </div>

          {/* Domains Evaluated */}
          <div className="space-y-1.5">
            <Label>Care Domains Evaluated</Label>
            <div className="flex flex-wrap gap-1.5">
              {DOMAIN_OPTIONS.map((domain) => {
                const isSelected = selectedDomains.includes(domain);
                return (
                  <button
                    key={domain}
                    type="button"
                    onClick={() => toggleDomain(domain)}
                    className={`px-2.5 py-1 text-sm rounded-lg font-medium transition-all cursor-pointer border ${isSelected
                      ? "bg-emerald-800 text-white border-emerald-800"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                  >
                    {domain}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Summary Notes */}
          <div className="space-y-1.5">
            <Label required>
              Reviewer Evaluation Summary & Observations
            </Label>
            <Textarea
              rows={3}
              placeholder="Detail observations, progress against goals, mobility changes, and nutritional intake..."
              value={summaryNotes}
              onChange={(e) => setSummaryNotes(e.target.value)}
              className="text-md"
            />
          </div>

          {/* Resident & Family Feedback */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>
                Resident Views & Wishes (CQC Reg 9)
              </Label>
              <Textarea
                rows={2}
                placeholder="What did the resident express about their care?"
                value={residentFeedback}
                onChange={(e) => setResidentFeedback(e.target.value)}
                className="text-md"
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                Family / Advocate Consultation
              </Label>
              <Textarea
                rows={2}
                placeholder="Notes from discussions with family or representative..."
                value={familyFeedback}
                onChange={(e) => setFamilyFeedback(e.target.value)}
                className="text-md"
              />
            </div>
          </div>

          {/* Next Scheduled Review */}
          <div className="space-y-1.5">
            <Label>Next Scheduled Review Date</Label>
            <div className="max-w-xs">
              <DatePicker
                value={nextScheduledReview}
                onChange={(d) => setNextScheduledReview(d ? d.toISOString().split("T")[0] : "")}
                placeholder="Select review date"
              />
            </div>
          </div>

          {validationError && (
            <Text size="sm" variant="destructive" weight="medium">
              {validationError}
            </Text>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={reviewMutation.isPending}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={reviewMutation.isPending}
            className="bg-emerald-800 hover:bg-emerald-900 text-white"
          >
            {reviewMutation.isPending ? "Recording Review..." : "Confirm & Save Evaluation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

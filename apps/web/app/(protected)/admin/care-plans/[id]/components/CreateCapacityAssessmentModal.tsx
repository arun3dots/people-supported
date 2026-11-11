"use client";

import { useState, useEffect, useRef } from "react";
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
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  DatePicker,
} from "@repo/ui/components/ui";
import { useCreateCapacityAssessmentMutation } from "../../../../../../lib/queries/mca-dols";
import { CapacityDecisionType } from "@repo/schema";
import { Brain, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { McaBestInterestsSection, ConsultedParty } from "./McaBestInterestsSection";

interface CreateCapacityAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  residentId: string;
  residentName: string;
  carePlanId?: string;
}

const DECISION_TYPES: { value: CapacityDecisionType; label: string }[] = [
  { value: "BedRails", label: "Use of Bed Rails / Restrictive Sides" },
  { value: "SensorMat", label: "Bed / Chair Sensor Monitoring Mat" },
  { value: "CovertMedication", label: "Covert Administration of Medication" },
  { value: "KeypadDoorAccess", label: "Keypad Secured Exit / Door Access" },
  { value: "PersonalCareAssistance", label: "Personal Care & Hygiene Interventions" },
  { value: "FinancialManagement", label: "Financial & Fee Management" },
  { value: "MedicalTreatment", label: "Consent to Medical Procedure / Treatment" },
  { value: "Other", label: "Other Decision-Specific Intervention" },
];

export function CreateCapacityAssessmentModal({
  isOpen,
  onClose,
  residentId,
  residentName,
  carePlanId,
}: CreateCapacityAssessmentModalProps) {
  const [decisionType, setDecisionType] = useState<CapacityDecisionType | "">("");
  const [specificDecision, setSpecificDecision] = useState("");
  const [hasImpairment, setHasImpairment] = useState<boolean | null>(null);
  const [impairmentDetails, setImpairmentDetails] = useState("");

  // 4 Statutory Functional Test Questions (null = unselected/untested)
  const [canUnderstand, setCanUnderstand] = useState<boolean | null>(null);
  const [canRetain, setCanRetain] = useState<boolean | null>(null);
  const [canWeigh, setCanWeigh] = useState<boolean | null>(null);
  const [canCommunicate, setCanCommunicate] = useState<boolean | null>(null);

  // Section 4 Best Interests
  const [consultedList, setConsultedList] = useState<ConsultedParty[]>([]);
  const [leastRestrictive, setLeastRestrictive] = useState("");
  const [notes, setNotes] = useState("");
  const [reviewDate, setReviewDate] = useState(
    new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Element refs for smooth scrolling on validation failure
  const modalContentRef = useRef<HTMLDivElement | null>(null);
  const specificDecisionRef = useRef<HTMLInputElement | null>(null);
  const stage1Ref = useRef<HTMLDivElement | null>(null);
  const impairmentDetailsRef = useRef<HTMLTextAreaElement | null>(null);
  const stage2Ref = useRef<HTMLDivElement | null>(null);
  const q2aRef = useRef<HTMLDivElement | null>(null);
  const q2bRef = useRef<HTMLDivElement | null>(null);
  const q2cRef = useRef<HTMLDivElement | null>(null);
  const q2dRef = useRef<HTMLDivElement | null>(null);
  const leastRestrictiveRef = useRef<HTMLDivElement | null>(null);

  const scrollToTop = () => {
    if (modalContentRef.current) {
      modalContentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (isOpen) {
      setDecisionType("");
      setSpecificDecision("");
      setHasImpairment(null);
      setImpairmentDetails("");
      setCanUnderstand(null);
      setCanRetain(null);
      setCanWeigh(null);
      setCanCommunicate(null);
      setConsultedList([]);
      setLeastRestrictive("");
      setNotes("");
      setReviewDate(
        new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      );
      setErrorMsg(null);
    }
  }, [isOpen]);

  // MCA outcome: Has capacity ONLY if all 4 functional tests pass
  const allTestsEvaluated =
    canUnderstand !== null &&
    canRetain !== null &&
    canWeigh !== null &&
    canCommunicate !== null;

  const hasCapacity =
    canUnderstand === true &&
    canRetain === true &&
    canWeigh === true &&
    canCommunicate === true;

  const createMutation = useCreateCapacityAssessmentMutation(residentId);

  const handleSubmit = async () => {
    if (!decisionType) {
      setErrorMsg("Please select a decision category.");
      scrollToTop();
      return;
    }
    if (!specificDecision.trim()) {
      setErrorMsg("Please describe the specific decision being assessed.");
      scrollToTop();
      return;
    }
    if (hasImpairment === null) {
      setErrorMsg("Please answer whether the resident has an impairment or disturbance of mind/brain (Stage 1).");
      scrollToTop();
      return;
    }
    if (!impairmentDetails.trim()) {
      setErrorMsg("Please specify the impairment or disturbance details (Stage 1).");
      scrollToTop();
      return;
    }
    if (canUnderstand === null) {
      setErrorMsg("Please answer Stage 2a: Can Understand Information?");
      scrollToTop();
      return;
    }
    if (canRetain === null) {
      setErrorMsg("Please answer Stage 2b: Can Retain Information?");
      scrollToTop();
      return;
    }
    if (canWeigh === null) {
      setErrorMsg("Please answer Stage 2c: Can Weigh / Use Information?");
      scrollToTop();
      return;
    }
    if (canCommunicate === null) {
      setErrorMsg("Please answer Stage 2d: Can Communicate Decision?");
      scrollToTop();
      return;
    }
    if (!hasCapacity && !leastRestrictive.trim()) {
      setErrorMsg("Please document the least restrictive options considered for Best Interests.");
      scrollToTop();
      return;
    }

    try {
      setErrorMsg(null);
      await createMutation.mutateAsync({
        residentId,
        carePlanId,
        decisionType,
        specificDecision: specificDecision.trim(),
        hasImpairmentOrDisturbance: hasImpairment,
        impairmentDetails: impairmentDetails.trim(),
        canUnderstandInfo: canUnderstand,
        canRetainInfo: canRetain,
        canWeighOrUseInfo: canWeigh,
        canCommunicateDecision: canCommunicate,
        hasCapacity,
        bestInterestsRequired: !hasCapacity,
        consultedPersons: consultedList,
        leastRestrictiveOptionConsidered: leastRestrictive.trim() || undefined,
        notes: notes.trim() || undefined,
        reviewDate: reviewDate ? new Date(reviewDate) : undefined,
      });
      onClose();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Failed to record assessment");
    }
  };

  const FUNCTIONAL_QUESTIONS = [
    {
      stage: "Stage 2a",
      title: "Can Understand Information?",
      desc: "Can the resident understand relevant information regarding this decision?",
      state: canUnderstand,
      setter: setCanUnderstand,
    },
    {
      stage: "Stage 2b",
      title: "Can Retain Information?",
      desc: "Can the resident retain the information long enough to make a decision?",
      state: canRetain,
      setter: setCanRetain,
    },
    {
      stage: "Stage 2c",
      title: "Can Weigh / Use Information?",
      desc: "Can the resident use or weigh the information as part of decision-making?",
      state: canWeigh,
      setter: setCanWeigh,
    },
    {
      stage: "Stage 2d",
      title: "Can Communicate Decision?",
      desc: "Can the resident communicate the decision by talking, sign, or any other means?",
      state: canCommunicate,
      setter: setCanCommunicate,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent ref={modalContentRef} className="max-w-2xl max-h-[90vh] overflow-y-auto font-['Outfit',sans-serif]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Brain className="size-5 text-emerald-800" />
            Mental Capacity Assessment (MCA 2005)
          </DialogTitle>
          <Text size="md" variant="muted">
            Decision-specific statutory assessment for {residentName} (CQC Regulations 11 &amp; 13)
          </Text>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-md text-rose-700">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Decision Category */}
          <div className="space-y-1.5">
            <Label required>Decision Category</Label>
            <Select
              value={decisionType}
              onValueChange={(val) => setDecisionType(val as CapacityDecisionType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {DECISION_TYPES.map((dt) => (
                  <SelectItem key={dt.value} value={dt.value}>
                    {dt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Specific Decision */}
          <div className="space-y-1.5">
            <Label required>Specific Decision Description</Label>
            <Input
              ref={specificDecisionRef}
              placeholder="e.g., Installation of bilateral profiling bed rails with safety bumpers"
              value={specificDecision}
              onChange={(e) => setSpecificDecision(e.target.value)}
              className="text-md"
            />
          </div>

          {/* Diagnostic Stage 1 */}
          <div ref={stage1Ref} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <Text size="md" weight="semibold" className="text-slate-800 uppercase tracking-wider">
                Stage 1 Diagnostic Test (Mind/Brain Impairment)
              </Text>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={hasImpairment === true ? "primary" : "outline"}
                  onClick={() => setHasImpairment(true)}
                  className="h-6 px-2.5 text-md rounded-lg cursor-pointer"
                >
                  Yes
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={hasImpairment === false ? "primary" : "outline"}
                  onClick={() => setHasImpairment(false)}
                  className="h-6 px-2.5 text-md rounded-lg cursor-pointer"
                >
                  No
                </Button>
              </div>
            </div>
            <Textarea
              ref={impairmentDetailsRef}
              placeholder="Describe diagnosed medical condition causing impairment (e.g. Advanced Vascular Dementia with fluctuating confusion and loss of safety awareness)."
              value={impairmentDetails}
              onChange={(e) => setImpairmentDetails(e.target.value)}
              rows={2}
              className="text-md bg-white"
            />
          </div>

          {/* Functional Stage 2 */}
          <div ref={stage2Ref} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <Text size="md" weight="semibold" className="text-slate-800 uppercase tracking-wider">
              Stage 2 Functional Test (4 Statutory Elements)
            </Text>

            {FUNCTIONAL_QUESTIONS.map((q) => (
              <div
                key={q.stage}
                className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-100 text-md"
              >
                <div>
                  <span className="font-semibold text-slate-800">{q.stage}: {q.title}</span>
                  <p className="text-md text-slate-500">{q.desc}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    variant={q.state === true ? "primary" : "outline"}
                    onClick={() => q.setter(true)}
                    className="h-6 px-2.5 text-md rounded-lg cursor-pointer"
                  >
                    Pass
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={q.state === false ? "secondary" : "outline"}
                    onClick={() => q.setter(false)}
                    className="h-6 px-2.5 text-md rounded-lg cursor-pointer"
                  >
                    Fail
                  </Button>
                </div>
              </div>
            ))}

            {/* Outcome Determination */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-md font-medium text-slate-700">Determination:</span>
              <Badge
                variant="secondary"
                state={!allTestsEvaluated ? "inactive" : hasCapacity ? "success" : "warning"}
                className="gap-1 text-md py-1"
              >
                {!allTestsEvaluated ? (
                  <span>Pending Evaluation (All 4 Required)</span>
                ) : hasCapacity ? (
                  <>
                    <CheckCircle2 className="size-3" /> Has Capacity
                  </>
                ) : (
                  <>
                    <XCircle className="size-3" /> Lacks Capacity (Best Interests Required)
                  </>
                )}
              </Badge>
            </div>
          </div>

          {/* Section 4 Best Interests (if lacking capacity) */}
          {!hasCapacity && (
            <div ref={leastRestrictiveRef}>
              <McaBestInterestsSection
                leastRestrictive={leastRestrictive}
                setLeastRestrictive={setLeastRestrictive}
                consultedList={consultedList}
                setConsultedList={setConsultedList}
              />
            </div>
          )}

          {/* Review Date & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Statutory Review Date</Label>
              <DatePicker
                value={reviewDate}
                onChange={(d) => setReviewDate(d ? d.toISOString().split("T")[0] : "")}
                placeholder="Select date"
              />
            </div>
            <div className="space-y-1">
              <Label>Clinical Notes</Label>
              <Input
                placeholder="Additional contextual observations..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-md"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={createMutation.isPending} className="rounded-xl">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className="bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-semibold"
          >
            {createMutation.isPending ? "Saving..." : "Save Assessment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

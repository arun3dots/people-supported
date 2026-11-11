"use client";

import React, { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@repo/ui/components/ui";
import { useToast } from "@repo/ui/hooks";
import type {
  SupportedLivingDetailsDTO,
  SupportedLivingDomainItemDTO,
  SupportedLivingOutcomeDTO,
} from "@repo/schema";
import { useUpdateSupportedLivingMutation } from "../../../../../../lib/queries/residents";

interface DomainModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  residentId: string;
  currentDetails: SupportedLivingDetailsDTO;
  initialDomain?: SupportedLivingDomainItemDTO | null;
  allDomains: SupportedLivingDomainItemDTO[];
}

export function EditSupportDomainModal({
  open,
  onOpenChange,
  residentId,
  currentDetails,
  initialDomain,
  allDomains,
}: DomainModalProps): React.JSX.Element {
  const { toast } = useToast();
  const updateMutation = useUpdateSupportedLivingMutation();

  const [domainName, setDomainName] = useState("");
  const [outcomeSummary, setOutcomeSummary] = useState("");
  const [whatINeed, setWhatINeed] = useState("");
  const [howToSupportMe, setHowToSupportMe] = useState("");
  const [staffing, setStaffing] = useState("");

  useEffect(() => {
    if (!open) return;
    setDomainName(initialDomain?.domain ?? "");
    setOutcomeSummary(initialDomain?.outcomeSummary ?? "");
    setWhatINeed(initialDomain?.whatINeed ?? "");
    setHowToSupportMe(initialDomain?.howToSupportMe ?? "");
    setStaffing(initialDomain?.staffing ?? "");
  }, [open, initialDomain]);

  const handleSave = async () => {
    if (!domainName.trim()) return;
    const todayStr = new Date().toLocaleDateString("en-GB");
    const targetId = initialDomain?.id ?? `dom-${Date.now()}`;
    const updatedDomain: SupportedLivingDomainItemDTO = {
      id: targetId,
      domain: domainName.trim(),
      outcomeSummary: outcomeSummary.trim() || undefined,
      updatedAt: todayStr,
      whatINeed: whatINeed.trim() || undefined,
      howToSupportMe: howToSupportMe.trim() || undefined,
      staffing: staffing.trim() || undefined,
    };

    const exists = allDomains.some((d) => d.id === targetId);
    const nextDomains = exists
      ? allDomains.map((d) => (d.id === targetId ? updatedDomain : d))
      : [...allDomains, updatedDomain];

    try {
      await updateMutation.mutateAsync({
        residentId,
        data: {
          ...currentDetails,
          supportPlanDomains: nextDomains,
        },
      });
      toast({
        title: "Support Domain Saved",
        description: `${domainName.trim()} has been updated in the Support Plan.`,
      });
      onOpenChange(false);
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: err instanceof Error ? err.message : "Could not save support domain",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl font-sans">
        <DialogHeader>
          <DialogTitle>
            {initialDomain ? `Edit Domain — ${initialDomain.domain}` : "Add Support Domain"}
          </DialogTitle>
          <DialogDescription>
            Document person-centred needs, support strategies, and staffing allocation.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 py-2">
          <div className="space-y-1">
            <Label className="text-md font-bold text-slate-800">Domain Title</Label>
            <Input
              value={domainName}
              onChange={(e) => setDomainName(e.target.value)}
              placeholder="e.g. Finances & tenancy"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-md font-bold text-slate-800">Staffing Allocation</Label>
            <Input
              value={staffing}
              onChange={(e) => setStaffing(e.target.value)}
              placeholder="e.g. Key worker, 1h weekly"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-md font-bold text-slate-800">Target Outcome Summary</Label>
            <Input
              value={outcomeSummary}
              onChange={(e) => setOutcomeSummary(e.target.value)}
              placeholder="e.g. Pays bills on time and saves towards a holiday"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-md font-bold text-slate-800">What I Need</Label>
            <Textarea
              rows={3}
              value={whatINeed}
              onChange={(e) => setWhatINeed(e.target.value)}
              placeholder="Describe what the person needs support with..."
            />
          </div>
          <div className="space-y-1 sm:col-span-2 mt-2">
            <Label className="text-md font-bold text-slate-800">How To Support Me</Label>
            <Textarea
              rows={3}
              value={howToSupportMe}
              onChange={(e) => setHowToSupportMe(e.target.value)}
              placeholder="Step-by-step guidance for support workers..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="lg" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={handleSave}
            disabled={updateMutation.isPending || !domainName.trim()}
          >
            {updateMutation.isPending ? "Saving..." : "Save Domain"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface OutcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  residentId: string;
  currentDetails: SupportedLivingDetailsDTO;
  allGoals: SupportedLivingOutcomeDTO[];
}

export function AddSupportOutcomeModal({
  open,
  onOpenChange,
  residentId,
  currentDetails,
  allGoals,
}: OutcomeModalProps): React.JSX.Element {
  const { toast } = useToast();
  const updateMutation = useUpdateSupportedLivingMutation();

  const [title, setTitle] = useState("");
  const [progress, setProgress] = useState("50");
  const [status, setStatus] = useState<"On track" | "Needs focus" | "Achieved">("On track");

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setProgress("50");
    setStatus("On track");
  }, [open]);

  const handleSave = async () => {
    if (!title.trim()) return;
    const newGoal: SupportedLivingOutcomeDTO = {
      id: `goal-${Date.now()}`,
      title: title.trim(),
      progress: Math.min(100, Math.max(0, Number(progress) || 0)),
      status,
    };

    try {
      await updateMutation.mutateAsync({
        residentId,
        data: {
          ...currentDetails,
          outcomes: [...allGoals, newGoal],
        },
      });
      toast({
        title: "Outcome Added",
        description: "New person-centred outcome added to Outcomes Progress.",
      });
      onOpenChange(false);
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Failed to Add Outcome",
        description: err instanceof Error ? err.message : "Could not add outcome",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md font-sans">
        <DialogHeader>
          <DialogTitle>Add Support Outcome</DialogTitle>
          <DialogDescription>
            Track progress towards an independent living or wellbeing goal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label className="text-md font-bold text-slate-800">Outcome Goal</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Prepare meals independently"
            />
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div className="space-y-1">
              <Label className="text-md font-bold text-slate-800">Progress (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={progress}
                onChange={(e) => setProgress(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-md font-bold text-slate-800">Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as "On track" | "Needs focus" | "Achieved")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="On track">On track</SelectItem>
                  <SelectItem value="Needs focus">Needs focus</SelectItem>
                  <SelectItem value="Achieved">Achieved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="lg" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={handleSave}
            disabled={updateMutation.isPending || !title.trim()}
          >
            {updateMutation.isPending ? "Saving..." : "Add Outcome"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import React, { useState } from "react";
import {
  Button,
  Badge,
  Card,
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
  Text,
  Textarea,
} from "@repo/ui/components/ui";
import { useToast } from "@repo/ui/hooks";
import { ArrowLeftRight, Building2, Home } from "lucide-react";
import type { SchemeItem, PropertyItem } from "../../../../../../lib/types/facility";
import { useReassignStaffMutation } from "../../../../../../lib/queries/staff";

interface ReassignStaffModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: {
    id: string;
    fullName: string;
    roleName?: string;
    currentScheme?: string;
    currentProperty?: string;
  } | null;
  schemes: SchemeItem[];
  properties: PropertyItem[];
}

export function ReassignStaffModal({
  open,
  onOpenChange,
  staff,
  schemes,
  properties,
}: ReassignStaffModalProps): React.JSX.Element {
  const { toast } = useToast();
  const reassignMutation = useReassignStaffMutation();

  const [schemeId, setSchemeId] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [assignmentType, setAssignmentType] = useState<"Primary" | "Secondary">("Secondary");
  const [effectiveFrom, setEffectiveFrom] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("Covering staff leave");
  const [notes, setNotes] = useState("");

  if (!staff) return <></>;

  const filteredProperties = schemeId
    ? properties.filter((p) => p.schemeId === schemeId)
    : properties;

  const handleReassign = async () => {
    if (!schemeId || !propertyId) {
      toast({
        variant: "destructive",
        title: "Missing Required Fields",
        description: "Please select both a target scheme and property.",
      });
      return;
    }

    try {
      await reassignMutation.mutateAsync({
        staffId: staff.id,
        data: {
          staffId: staff.id,
          schemeId,
          propertyId,
          assignmentType,
          effectiveFrom,
          endDate: endDate || null,
          reason,
          notes: notes.trim() || null,
        },
      });

      toast({
        title: "Staff Reassigned",
        description: `${staff.fullName} reassigned to ${properties.find((p) => p.id === propertyId)?.name || "selected property"}.`,
      });
      onOpenChange(false);
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Reassignment Failed",
        description: err instanceof Error ? err.message : "Could not complete staff reassignment",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl font-sans max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <ArrowLeftRight className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-slate-900">
                Reassign Staff Work
              </DialogTitle>
              <DialogDescription className="text-md text-slate-500">
                Change the property, scheme, assignment type or working period for the selected staff member.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Current Staff Assignment Card */}
        <Card variant="white" border="secondary" className="bg-slate-50 p-4 gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-md">
                {staff.fullName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <Text size="md" weight="semibold">{staff.fullName}</Text>
                <Text size="md" variant="subdued">
                  STA-001 &middot; {staff.roleName || "Support Worker"}
                </Text>
              </div>
            </div>
            <Badge variant="success" className="border border-emerald-200 p-0 px-2.5 py-0.5 text-md font-medium">
              <span className="size-1.5 rounded-full bg-emerald-600" /> Currently Assigned
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-md">
            <div>
              <Text size="md" variant="subdued">Scheme:</Text>
              <Text size="md" weight="medium">
                {staff.currentScheme || "North Yorkshire Supported Living"}
              </Text>
            </div>
            <div>
              <Text size="md" variant="subdued">Property:</Text>
              <Text size="md" weight="medium">
                {staff.currentProperty || "Oak House"}
              </Text>
            </div>
            <div>
              <Text size="md" variant="subdued">Assignment:</Text>
              <Text size="md" weight="medium">Primary</Text>
            </div>
          </div>
        </Card>

        {/* New Assignment Form */}
        <div className="space-y-3.5 pt-2">
          <Text as="h2" size="md" weight="semibold" className="text-slate-800">
            New Assignment Details
          </Text>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
            <div className="space-y-1">
              <Label className="text-md font-medium text-slate-800">Scheme *</Label>
              <Select value={schemeId} onValueChange={(val) => { setSchemeId(val); setPropertyId(""); }}>
                <SelectTrigger className="h-10 rounded-xl border-slate-200">
                  <SelectValue placeholder="Select scheme" />
                </SelectTrigger>
                <SelectContent>
                  {schemes.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-md font-medium text-slate-800">Property *</Label>
              <Select value={propertyId} onValueChange={setPropertyId} disabled={!schemeId}>
                <SelectTrigger className="h-10 rounded-xl border-slate-200">
                  <SelectValue placeholder={schemeId ? "Select property" : "Select scheme first"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredProperties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 mt-2">
              <Label className="text-md font-medium text-slate-800">Assignment Type *</Label>
              <Select value={assignmentType} onValueChange={(v) => setAssignmentType(v as "Primary" | "Secondary")}>
                <SelectTrigger className="h-10 rounded-xl border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Primary">Primary</SelectItem>
                  <SelectItem value="Secondary">Secondary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 mt-2">
              <Label className="text-md font-medium text-slate-800">Effective From *</Label>
              <Input
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1 mt-2">
              <Label className="text-md font-medium text-slate-800">End Date (Optional)</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1 mt-2">
              <Label className="text-md font-medium text-slate-800">Reason for Reassignment *</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className="h-10 rounded-xl border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Covering staff leave">Covering staff leave</SelectItem>
                  <SelectItem value="Emergency cover">Emergency cover</SelectItem>
                  <SelectItem value="Shift rebalancing">Shift rebalancing</SelectItem>
                  <SelectItem value="Staff request">Staff request</SelectItem>
                  <SelectItem value="Permanent transfer">Permanent transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-md font-medium text-slate-800">Additional Notes (Optional)</Label>
              <Text as="span" size="md" variant="subdued">{notes.length}/250</Text>
            </div>
            <Textarea
              rows={2}
              maxLength={250}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reassigning to cover annual leave at Birch Lane for 2 weeks."
              className="rounded-xl border-slate-200 text-md"
            />
          </div>
        </div>

        <DialogFooter className="pt-2 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl h-10 px-4 text-md">
            Cancel
          </Button>
          <Button
            onClick={handleReassign}
            disabled={reassignMutation.isPending || !schemeId || !propertyId}
            variant="primary"
            size="lg"
            className="rounded-xl px-5"
          >
            <ArrowLeftRight className="size-4" />
            {reassignMutation.isPending ? "Reassigning..." : "Reassign Work"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

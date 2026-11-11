"use client";

import React, { useState } from "react";
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  InfoField,
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
import { ArrowLeftRight } from "lucide-react";
import type {
  SchemeItem,
  PropertyItem,
} from "../../../../../../lib/types/facility";
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
  const [assignmentType, setAssignmentType] = useState<"Primary" | "Secondary">(
    "Secondary",
  );
  const [effectiveFrom, setEffectiveFrom] = useState<string>(() =>
    new Date().toISOString().slice(0, 10),
  );
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
        description:
          err instanceof Error
            ? err.message
            : "Could not complete staff reassignment",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl font-sans max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-lg bg-surface-primary-light text-primary flex items-center justify-center shrink-0">
              <ArrowLeftRight className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-slate-900">
                Reassign Staff Work
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                Change the property, scheme, assignment type or working period for the selected staff member.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Current Staff Assignment Card */}
        <Card variant="surface" border="secondary" className="p-4 gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-surface-primary-light text-primary flex items-center justify-center font-medium text-sm shrink-0">
                {staff.fullName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <Text size="sm" weight="semibold" className="text-slate-900">
                  {staff.fullName}
                </Text>
                <Text size="xs" variant="muted">
                  STA-001 &middot; {staff.roleName || "Support Worker"}
                </Text>
              </div>
            </div>
            <Badge
              variant="secondary"
              state="success"
              className="border gap-1.5 shrink-0"
            >
              <span className="size-1.5 rounded-full bg-emerald-600" />
              Currently Assigned
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2.5 border-t border-slate-200/70">
            <InfoField
              label="Scheme"
              value={staff.currentScheme || "North Yorkshire Supported Living"}
              valueClassName="font-medium text-slate-900"
            />
            <InfoField
              label="Property"
              value={staff.currentProperty || "Oak House"}
              valueClassName="font-medium text-slate-900"
            />
            <InfoField
              label="Assignment"
              value="Primary"
              valueClassName="font-medium text-slate-900"
            />
          </div>
        </Card>

        {/* New Assignment Form */}
        <div className="space-y-3 pt-1">
          <Text as="h2" size="md" weight="semibold" className="text-slate-900">
            New Assignment Details
          </Text>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
            <div className="space-y-1">
              <Label required className="text-md font-medium text-slate-700">
                Scheme
              </Label>
              <Select
                value={schemeId}
                onValueChange={(val) => {
                  setSchemeId(val);
                  setPropertyId("");
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select scheme" />
                </SelectTrigger>
                <SelectContent>
                  {schemes.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label required className="text-md font-medium text-slate-700">
                Property
              </Label>
              <Select
                value={propertyId}
                onValueChange={setPropertyId}
                disabled={!schemeId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      schemeId ? "Select property" : "Select scheme first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredProperties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label required className="text-md font-medium text-slate-700">
                Assignment Type
              </Label>
              <Select
                value={assignmentType}
                onValueChange={(v) =>
                  setAssignmentType(v as "Primary" | "Secondary")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Primary">Primary</SelectItem>
                  <SelectItem value="Secondary">Secondary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label required className="text-md font-medium text-slate-700">
                Reason for Reassignment
              </Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Covering staff leave">
                    Covering staff leave
                  </SelectItem>
                  <SelectItem value="Emergency cover">
                    Emergency cover
                  </SelectItem>
                  <SelectItem value="Shift rebalancing">
                    Shift rebalancing
                  </SelectItem>
                  <SelectItem value="Staff request">Staff request</SelectItem>
                  <SelectItem value="Permanent transfer">
                    Permanent transfer
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label required className="text-md font-medium text-slate-700">
                Effective From
              </Label>
              <Input
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-md font-medium text-slate-700">
                End Date (Optional)
              </Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-md font-medium text-slate-700">
                Additional Notes (Optional)
              </Label>
              <Text as="span" size="xs" variant="muted">
                {notes.length}/250
              </Text>
            </div>
            <Textarea
              rows={2}
              maxLength={250}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reassigning to cover annual leave at Birch Lane for 2 weeks."
            />
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-slate-100 gap-2">
          <Button
            variant="outline"
            size="lg"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReassign}
            disabled={reassignMutation.isPending || !schemeId || !propertyId}
            variant="primary"
            size="lg"
          >
            <ArrowLeftRight className="size-4" />
            {reassignMutation.isPending ? "Reassigning..." : "Reassign Work"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import React, { useState } from "react";
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
} from "@repo/ui/components/ui";
import { useToast } from "@repo/ui/hooks";
import { UserPlus } from "lucide-react";
import type { SchemeItem, PropertyItem } from "../../../../../lib/types/facility";
import { useCreateStaffMutationQuery } from "../../../../../lib/queries/staff";

interface AddStaffMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schemes: SchemeItem[];
  properties: PropertyItem[];
  roles: { id: string; name: string }[];
}

export function AddStaffMemberModal({
  open,
  onOpenChange,
  schemes,
  properties,
  roles,
}: AddStaffMemberModalProps): React.JSX.Element {
  const { toast } = useToast();
  const createMutation = useCreateStaffMutationQuery();

  const [fullName, setFullName] = useState("");
  const [roleId, setRoleId] = useState("");
  const [contractType, setContractType] = useState("Full-time");
  const [schemeId, setSchemeId] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [contractedHours, setContractedHours] = useState("37.5");

  const filteredProperties = schemeId
    ? properties.filter((p) => p.schemeId === schemeId)
    : properties;

  const handleSubmit = async () => {
    if (!fullName.trim() || !email.trim() || !roleId) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Full name, role, and valid email are required.",
      });
      return;
    }

    try {
      await createMutation.mutateAsync({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: mobile.trim() || undefined,
        roleId,
        dob: "1990-01-01",
        startDate: new Date().toISOString(),
        contractType,
        contractedHoursPerWeek: Number(contractedHours) || 37.5,
        schemeId: schemeId || undefined,
        propertyId: propertyId || undefined,
        unitIds: propertyId ? [propertyId] : [],
      });

      toast({
        title: "Staff Member Added",
        description: `${fullName.trim()} has been registered. Pre-employment checks started.`,
      });
      onOpenChange(false);
      setFullName("");
      setEmail("");
      setMobile("");
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Failed to Add Staff",
        description: err instanceof Error ? err.message : "Could not create staff record",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl font-sans max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <UserPlus className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Add Staff Member
              </DialogTitle>
              <DialogDescription className="text-md text-slate-500">
                New profile will be created with pre-employment checks started automatically.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3.5 py-2">
          {/* Full Name */}
          <div className="space-y-1">
            <Label className="text-md font-bold text-slate-800">Full name *</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Amelia Hart"
              className="h-10 rounded-xl"
            />
          </div>

          {/* Role & Contract Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
            <div className="space-y-1">
              <Label className="text-md font-bold text-slate-800">Role *</Label>
              <Select value={roleId} onValueChange={setRoleId}>
                <SelectTrigger className="h-10 rounded-xl border-slate-200">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-md font-bold text-slate-800">Contract type</Label>
              <Select value={contractType} onValueChange={setContractType}>
                <SelectTrigger className="h-10 rounded-xl border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full-time">Full-time</SelectItem>
                  <SelectItem value="Part-time">Part-time</SelectItem>
                  <SelectItem value="Bank">Bank</SelectItem>
                  <SelectItem value="Agency">Agency</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Scheme & Property */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
            <div className="space-y-1">
              <Label className="text-md font-bold text-slate-800">Scheme *</Label>
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
              <Label className="text-md font-bold text-slate-800">Property *</Label>
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
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
            <div className="space-y-1">
              <Label className="text-md font-bold text-slate-800">Mobile *</Label>
              <Input
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+44 7700 000000"
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-md font-bold text-slate-800">Work email *</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@cantracare.co.uk"
                className="h-10 rounded-xl"
              />
            </div>
          </div>

          {/* Contracted Hours */}
          <div className="space-y-1">
            <Label className="text-md font-bold text-slate-800">Contracted hours / week</Label>
            <Input
              type="number"
              min={0}
              max={60}
              value={contractedHours}
              onChange={(e) => setContractedHours(e.target.value)}
              placeholder="37.5"
              className="h-10 rounded-xl"
            />
          </div>
        </div>

        <DialogFooter className="pt-2 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl h-10 px-4 text-md">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className="bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl h-10 px-5 text-md font-bold"
          >
            {createMutation.isPending ? "Adding..." : "Add staff member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

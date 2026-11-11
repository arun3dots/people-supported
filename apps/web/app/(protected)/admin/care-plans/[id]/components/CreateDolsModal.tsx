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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  DatePicker,
} from "@repo/ui/components/ui";
import { useCreateDolsMutation } from "../../../../../../lib/queries/mca-dols";
import { DolsAuthorizationStatus } from "@repo/schema";
import { ShieldCheck, AlertCircle } from "lucide-react";

interface CreateDolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  residentId: string;
  residentName: string;
}

const DOLS_STATUSES: { value: DolsAuthorizationStatus; label: string }[] = [
  { value: "UrgentApplied", label: "Urgent Authorisation Granted (7-14 Days)" },
  { value: "StandardApplied", label: "Standard Authorisation Application Pending" },
  { value: "Authorized", label: "Standard Authorisation Active / Granted" },
  { value: "Expired", label: "Authorisation Expired / Awaiting Renewal" },
  { value: "Refused", label: "Application Refused by Supervisory Body" },
  { value: "Withdrawn", label: "Application Withdrawn" },
];

export function CreateDolsModal({
  isOpen,
  onClose,
  residentId,
  residentName,
}: CreateDolsModalProps) {
  const [supervisoryBody, setSupervisoryBody] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [status, setStatus] = useState<DolsAuthorizationStatus | "">("");
  const [appliedDate, setAppliedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [authorizedDate, setAuthorizedDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [conditionInput, setConditionInput] = useState("");
  const [conditions, setConditions] = useState<string[]>([]);
  const [rprName, setRprName] = useState("");
  const [rprContact, setRprContact] = useState("");
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const createMutation = useCreateDolsMutation(residentId);

  const handleClose = () => {
    setSupervisoryBody("");
    setReferenceNumber("");
    setStatus("");
    setAppliedDate(new Date().toISOString().split("T")[0]);
    setAuthorizedDate("");
    setExpiryDate("");
    setConditionInput("");
    setConditions([]);
    setRprName("");
    setRprContact("");
    setNotes("");
    setErrorMsg(null);
    onClose();
  };

  const handleAddCondition = () => {
    if (!conditionInput.trim()) return;
    setConditions((prev) => [...prev, conditionInput.trim()]);
    setConditionInput("");
  };

  const handleRemoveCondition = (index: number) => {
    setConditions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!supervisoryBody.trim()) {
      setErrorMsg("Supervisory Body / Local Authority name is required.");
      return;
    }
    if (!status) {
      setErrorMsg("Authorisation Status is required.");
      return;
    }
    if (!appliedDate) {
      setErrorMsg("Application date is required.");
      return;
    }
    if (authorizedDate && authorizedDate < appliedDate) {
      setErrorMsg("Authorised Date cannot be earlier than Application Date.");
      return;
    }
    if (expiryDate && authorizedDate && expiryDate <= authorizedDate) {
      setErrorMsg("Expiry Date must be after Authorised Date.");
      return;
    }
    if (expiryDate && expiryDate <= appliedDate) {
      setErrorMsg("Expiry Date must be after Application Date.");
      return;
    }

    try {
      setErrorMsg(null);
      await createMutation.mutateAsync({
        residentId,
        supervisoryBody: supervisoryBody.trim(),
        referenceNumber: referenceNumber.trim() || undefined,
        status: status as DolsAuthorizationStatus,
        appliedDate: new Date(appliedDate),
        authorizedDate: authorizedDate ? new Date(authorizedDate) : undefined,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        conditions,
        relevantPersonsRepresentative: rprName.trim() || undefined,
        rprContact: rprContact.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      handleClose();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Failed to save DoLS authorisation");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            Deprivation of Liberty Safeguards (DoLS) Record
          </DialogTitle>
          <Text className="text-md text-slate-500">
            Statutory supervisory authorisation for {residentName} (CQC Reg 13 Safeguarding)
          </Text>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-md text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label required>
                Supervisory Body (Local Authority)
              </Label>
              <Input
                placeholder="e.g., Kent County Council"
                value={supervisoryBody}
                onChange={(e) => setSupervisoryBody(e.target.value)}
                className="text-md"
              />
            </div>
            <div className="space-y-1">
              <Label>
                Council Reference Number
              </Label>
              <Input
                placeholder="e.g., DOLS/2026/9012"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="text-md"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label required>Authorisation Status</Label>
            <Select
              value={status}
              onValueChange={(val) => setStatus(val as DolsAuthorizationStatus)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {DOLS_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label required>Application Date</Label>
              <DatePicker
                value={appliedDate}
                onChange={(d) => setAppliedDate(d ? d.toISOString().split("T")[0] : "")}
                placeholder="Select date"
              />
            </div>
            <div className="space-y-1">
              <Label>Authorised Date</Label>
              <DatePicker
                value={authorizedDate}
                minDate={appliedDate ? new Date(appliedDate) : undefined}
                onChange={(d) => setAuthorizedDate(d ? d.toISOString().split("T")[0] ?? "" : "")}
                placeholder="Select date"
              />
            </div>
            <div className="space-y-1">
              <Label>Expiry Date</Label>
              <DatePicker
                value={expiryDate}
                minDate={authorizedDate ? new Date(authorizedDate) : appliedDate ? new Date(appliedDate) : undefined}
                onChange={(d) => setExpiryDate(d ? d.toISOString().split("T")[0] ?? "" : "")}
                placeholder="Select date"
              />
            </div>
          </div>

          {/* RPR Information */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <Text className="text-md font-semibold text-slate-800 uppercase tracking-wider">
              Relevant Person&apos;s Representative (RPR) / Advocate
            </Text>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Input
                placeholder="RPR Full Name"
                value={rprName}
                onChange={(e) => setRprName(e.target.value)}
                className="text-md bg-white"
              />
              <Input
                placeholder="Contact Phone / Email"
                value={rprContact}
                onChange={(e) => setRprContact(e.target.value)}
                className="text-md bg-white"
              />
            </div>
          </div>

          {/* Conditions Attached */}
          <div className="space-y-2">
            <Label>
              Supervisory Body Conditions
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. Monthly review of sensor mat necessity..."
                value={conditionInput}
                onChange={(e) => setConditionInput(e.target.value)}
                className="text-md"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddCondition}
                className="text-md shrink-0"
              >
                Add Condition
              </Button>
            </div>
            {conditions.length > 0 && (
              <div className="space-y-1 pt-1">
                {conditions.map((cond, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-md p-2 bg-slate-50 border border-slate-200 rounded"
                  >
                    <span>• {cond}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCondition(i)}
                      className="text-red-500 hover:text-red-700 text-md ml-2"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label>Notes & File Reference</Label>
            <Textarea
              placeholder="Case worker notes or reference to uploaded DoLS Form 1 / Form 2..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="text-md"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={handleClose} disabled={createMutation.isPending}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {createMutation.isPending ? "Saving..." : "Save DoLS Record"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

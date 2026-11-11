"use client";

import { useState } from "react";
import {
  Input,
  Label,
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Checkbox,
  Text,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui";
import { ArrowRight, ArrowLeft, Plus, Trash2, Info } from "lucide-react";
import { AdmissionFormData, DocumentChecklistItem, DocumentChecklistStatus } from "../../types";
import { DocumentUploadButton } from "../common/DocumentUploadField";
import { ADMISSION_UPLOAD_LIMITS } from "../../data/admissionFormFields";

interface Step8DocumentsProps {
  formData: AdmissionFormData;
  updateFormData: (data: Partial<AdmissionFormData>) => void;
  onPrev: () => void;
  onNext: () => void;
  isSubmitting?: boolean;
}

export function Step8Documents({
  formData,
  updateFormData,
  onPrev,
  onNext,
  isSubmitting,
}: Step8DocumentsProps) {
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const [newDocCategory, setNewDocCategory] = useState("Custom");
  const [newDocRequired, setNewDocRequired] = useState(false);

  const verifiedCount = formData.documents.filter((d) => d.status === "Verified" || d.status === "Uploaded").length;
  const totalCount = formData.documents.length;
  const missingRequiredCount = formData.documents.filter((d) => d.required && d.status === "Missing").length;

  const handleDocumentUploaded = (id: string, fileUrl: string, meta?: { fileName: string }) => {
    const updated = formData.documents.map((doc: DocumentChecklistItem) => {
      if (doc.id === id) {
        return {
          ...doc,
          fileUrl,
          status: (fileUrl ? "Uploaded" : "Missing") as DocumentChecklistStatus,
          verifiedAt: fileUrl ? new Date().toISOString() : undefined,
        };
      }
      return doc;
    });
    updateFormData({ documents: updated });
  };

  const handleSetStatus = (id: string, status: DocumentChecklistStatus) => {
    const updated = formData.documents.map((doc: DocumentChecklistItem) => {
      if (doc.id === id) {
        return { ...doc, status };
      }
      return doc;
    });
    updateFormData({ documents: updated });
  };

  const handleRemoveDoc = (id: string) => {
    const updated = formData.documents.filter((d) => d.id !== id);
    updateFormData({ documents: updated });
  };

  const handleAddCustomDoc = () => {
    if (!newDocName.trim()) return;
    const newDoc: DocumentChecklistItem = {
      id: `custom-doc-${Date.now()}`,
      name: newDocName.trim(),
      category: newDocCategory,
      required: newDocRequired,
      status: "Missing",
    };
    updateFormData({ documents: [...formData.documents, newDoc] });
    setNewDocName("");
    setCustomModalOpen(false);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Document Checklist Items */}
      <div className="bg-surface-card-grey rounded-2xl p-6 lg:p-8 space-y-6 shadow-none border-none">
        <div className="pb-4 border-b border-slate-200/80 flex flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Text as="h3" size="md" weight="bold">
                Required &amp; Custom Documentation
              </Text>
              <Badge state="info">
                {verifiedCount} of {totalCount} uploaded
              </Badge>
            </div>
            <Text size="md" weight="regular" variant="subdued">
              Items marked with <span className="text-red-500 font-bold">*required</span> should be uploaded or verified prior to final admission.
            </Text>
            <div className="flex items-center gap-1.5 mt-2 text-md text-slate-500 bg-white/80 px-3 py-1.5 rounded-lg border border-slate-200/80 w-fit">
              <Info className="size-3.5 text-emerald-800 shrink-0" />
              <span>
                Supported formats: <strong className="font-medium text-slate-700">{ADMISSION_UPLOAD_LIMITS.DOCUMENT.formatsLabel}</strong> · Max size: <strong className="font-medium text-slate-700">{ADMISSION_UPLOAD_LIMITS.DOCUMENT.maxSizeMB}MB per file</strong>
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => setCustomModalOpen(true)}
            className="gap-1.5"
          >
            <Plus className="size-3.5 text-emerald-800" /> Add Custom Requirement
          </Button>
        </div>

        <div className="space-y-3">
          {formData.documents.map((doc: DocumentChecklistItem) => (
            <div
              key={doc.id}
              className="p-4 border border-slate-200/70 rounded-xl bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
            >
              <div>
                <Text as="h4" size="md" weight="bold">
                  {doc.name} {doc.required && <span className="text-red-500 font-bold">*required</span>}
                </Text>
                <Text size="md" variant="subdued" className="block mt-0.5">
                  {doc.category}
                </Text>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {/* Status selector */}
                <Select
                  value={doc.status}
                  onValueChange={(val) => handleSetStatus(doc.id, val as DocumentChecklistStatus)}
                >
                  <SelectTrigger size="sm" className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Missing">Missing</SelectItem>
                    <SelectItem value="Uploaded">Uploaded</SelectItem>
                    <SelectItem value="Verified">Verified</SelectItem>
                    <SelectItem value="N/A">Not Applicable</SelectItem>
                  </SelectContent>
                </Select>

                <DocumentUploadButton
                  value={doc.fileUrl}
                  onChange={(url, meta) => handleDocumentUploaded(doc.id, url, meta)}
                  buttonText="Upload File"
                />

                {doc.id.startsWith("custom-doc-") && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveDoc(doc.id)}
                    className="size-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    title="Remove custom requirement"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Custom Document Modal */}
      <Dialog open={customModalOpen} onOpenChange={setCustomModalOpen}>
        <DialogContent size="md">
          <DialogHeader className="pb-2">
            <DialogTitle>Add Custom Document Requirement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <Label required>Document Title</Label>
              <Input
                type="text"
                placeholder="e.g. COVID Booster Certificate, Specialist Referral"
                value={newDocName}
                onChange={(e) => setNewDocName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <Label>Category</Label>
              <Input
                type="text"
                placeholder="e.g. Clinical, Legal, Financial"
                value={newDocCategory}
                onChange={(e) => setNewDocCategory(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 pt-2 text-md text-slate-600">
              <Checkbox
                checked={newDocRequired}
                onCheckedChange={(checked: boolean | "indeterminate") =>
                  setNewDocRequired(checked === true)
                }
              />
              <Text size="md" variant="subdued">
                Mark as Mandatory Requirement for Admission Finalisation
              </Text>
            </div>
          </div>
          <DialogFooter className="gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCustomModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleAddCustomDoc}
            >
              Add Requirement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4">
        <Button
          variant="outline"
          type="button"
          onClick={onPrev}
          className="rounded-xl font-semibold px-5 shadow-none"
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={onNext}
          disabled={isSubmitting}
          className="rounded-xl font-semibold px-5 shadow-none"
        >
          Continue {missingRequiredCount > 0 && `(${missingRequiredCount} missing)`}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

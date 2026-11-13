"use client";

import React from "react";
import { Clock } from "lucide-react";
import {
  Card,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  DatePicker,
} from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import { HandoverDocumentsSection } from "./HandoverDocumentsSection";

export interface HandoverDoc {
  id?: string;
  name: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  updatedAt?: string;
}

export interface DischargeFormData {
  reason: string;
  dischargeType: string;
  dischargeDate: string;
  dischargeTime: string;
  carePlanReview: string;
  riskAssessment: string;
  medicationReview: string;
  familyNotified: boolean;
  gpNotified: boolean;
  handoverDocuments: HandoverDoc[];
}

interface DischargeFormSectionsProps {
  formData: DischargeFormData;
  setFormData: React.Dispatch<React.SetStateAction<DischargeFormData>>;
  onReviewClick: () => void;
  onCancel: () => void;
  onUploadFile?: (file: File) => Promise<void>;
  isUploading?: boolean;
  errors?: Record<string, string>;
  setErrors?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export function DischargeFormSections({
  formData,
  setFormData,
  onReviewClick,
  onCancel,
  onUploadFile,
  isUploading,
  errors = {},
  setErrors,
}: DischargeFormSectionsProps) {
  const clearError = (field: string) => {
    if (setErrors && errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleRemoveDocument = (docIdOrIndex: string | number) => {
    setFormData((prev) => ({
      ...prev,
      handoverDocuments: prev.handoverDocuments.filter((doc, idx) => {
        if (typeof docIdOrIndex === "string" && doc.id) {
          return doc.id !== docIdOrIndex;
        }
        return idx !== docIdOrIndex;
      }),
    }));
  };

  return (
    <Card className="p-6 md:p-8 bg-slate-50/60 border border-slate-200/80 rounded-2xl space-y-8 shadow-xs">
      {/* 1. Discharge Details */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          Discharge Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
          {/* Reason for Discharge */}
          <div className="sm:col-span-2 lg:col-span-5 space-y-1.5">
            <Label required>Reason for Discharge</Label>
            <Input
              placeholder="e.g. Moving to another supported living service"
              value={formData.reason}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, reason: e.target.value }));
                clearError("reason");
              }}
              errorMessage={errors.reason}
              className="h-11 bg-white border-slate-200 text-slate-900 rounded-xl text-md font-medium"
            />
          </div>

          {/* Discharge Type */}
          <div className="lg:col-span-3 space-y-1.5">
            <Label required>Discharge Type</Label>
            <Select
              value={formData.dischargeType}
              onValueChange={(val) => {
                setFormData((prev) => ({ ...prev, dischargeType: val }));
                clearError("dischargeType");
              }}
            >
              <SelectTrigger className={cn("h-11 bg-white border-slate-200 text-slate-900 rounded-xl text-md font-medium", errors.dischargeType && "border-red-500")}>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="Planned">Planned</SelectItem>
                <SelectItem value="Emergency">Emergency</SelectItem>
                <SelectItem value="Transfer">Transfer</SelectItem>
                <SelectItem value="Hospital">Hospitalization</SelectItem>
                <SelectItem value="Deceased">Deceased</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.dischargeType && (
              <p className="text-md text-text-error font-medium min-h-[18px] mt-1">
                {errors.dischargeType}
              </p>
            )}
          </div>

          {/* Date */}
          <div className="lg:col-span-2 space-y-1.5">
            <Label required>Date</Label>
            <DatePicker
              value={formData.dischargeDate}
              onChange={(d) => {
                setFormData((prev) => ({
                  ...prev,
                  dischargeDate: d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : "",
                }));
                clearError("dischargeDate");
              }}
              placeholder="Select date"
              errorMessage={errors.dischargeDate}
            />
          </div>

          {/* Time */}
          <div className="lg:col-span-2 space-y-1.5">
            <Label required>Time</Label>
            <div className="relative">
              <Input
                type="time"
                value={formData.dischargeTime}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    dischargeTime: e.target.value,
                  }));
                  clearError("dischargeTime");
                }}
                errorMessage={errors.dischargeTime}
                className="h-11 bg-white border-slate-200 text-slate-900 rounded-xl text-md font-medium pr-8"
              />
              <Clock className="size-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Care & Risk Review */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          Care & Risk Review
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Care Plan Review */}
          <div className="space-y-1.5">
            <Label required>Care Plan Review</Label>
            <Select
              value={formData.carePlanReview}
              onValueChange={(val) => {
                setFormData((prev) => ({ ...prev, carePlanReview: val }));
                clearError("carePlanReview");
              }}
            >
              <SelectTrigger className={cn("h-11 bg-white border-slate-200 text-slate-900 rounded-xl text-md font-medium", errors.carePlanReview && "border-red-500")}>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Not Applicable">Not Applicable</SelectItem>
              </SelectContent>
            </Select>
            {errors.carePlanReview && (
              <p className="text-md text-text-error font-medium min-h-[18px] mt-1">
                {errors.carePlanReview}
              </p>
            )}
          </div>

          {/* Risk Assessment */}
          <div className="space-y-1.5">
            <Label required>Risk Assessment</Label>
            <Select
              value={formData.riskAssessment}
              onValueChange={(val) => {
                setFormData((prev) => ({ ...prev, riskAssessment: val }));
                clearError("riskAssessment");
              }}
            >
              <SelectTrigger className={cn("h-11 bg-white border-slate-200 text-slate-900 rounded-xl text-md font-medium", errors.riskAssessment && "border-red-500")}>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="Low Risk">Low Risk</SelectItem>
                <SelectItem value="Medium Risk">Medium Risk</SelectItem>
                <SelectItem value="High Risk">High Risk</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            {errors.riskAssessment && (
              <p className="text-md text-text-error font-medium min-h-[18px] mt-1">
                {errors.riskAssessment}
              </p>
            )}
          </div>

          {/* Medication Review */}
          <div className="space-y-1.5">
            <Label required>Medication Review</Label>
            <Select
              value={formData.medicationReview}
              onValueChange={(val) => {
                setFormData((prev) => ({ ...prev, medicationReview: val }));
                clearError("medicationReview");
              }}
            >
              <SelectTrigger className={cn("h-11 bg-white border-slate-200 text-slate-900 rounded-xl text-md font-medium", errors.medicationReview && "border-red-500")}>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Reconciled">Reconciled</SelectItem>
              </SelectContent>
            </Select>
            {errors.medicationReview && (
              <p className="text-md text-text-error font-medium min-h-[18px] mt-1">
                {errors.medicationReview}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 3. Notifications */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          Notifications
        </h3>
        <div className="flex flex-wrap items-center gap-8">
          <div className="space-y-1.5">
            <p className="text-md font-medium text-slate-500">Care Plan Review</p>
            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  familyNotified: !prev.familyNotified,
                }))
              }
              className="flex items-center gap-2 cursor-pointer text-md font-medium text-slate-800"
            >
              <span className={cn("size-5 rounded border flex items-center justify-center transition-colors", formData.familyNotified ? "bg-emerald-800 border-emerald-800 text-white" : "border-slate-300 bg-white")}>
                {formData.familyNotified && "✓"}
              </span>
              Family Notified
            </button>
          </div>

          <div className="space-y-1.5">
            <p className="text-md font-medium text-slate-500">Risk Assessment</p>
            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  gpNotified: !prev.gpNotified,
                }))
              }
              className="flex items-center gap-2 cursor-pointer text-md font-medium text-slate-800"
            >
              <span className={cn("size-5 rounded border flex items-center justify-center transition-colors", formData.gpNotified ? "bg-emerald-800 border-emerald-800 text-white" : "border-slate-300 bg-white")}>
                {formData.gpNotified && "✓"}
              </span>
              GP Notified
            </button>
          </div>
        </div>
      </div>

      {/* 4. Handover Documents */}
      <HandoverDocumentsSection
        documents={formData.handoverDocuments}
        onRemoveDocument={handleRemoveDocument}
        onUploadFile={onUploadFile}
        isUploading={isUploading}
      />

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors text-md cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onReviewClick}
          className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold transition-colors text-md shadow-xs cursor-pointer"
        >
          Review Discharge
        </button>
      </div>
    </Card>
  );
}

"use client";

import React from "react";
import {
  FileText,
  Ruler,
  Droplets,
  Activity,
  Bandage,
  Camera,
  Layers,
  HelpCircle,
} from "lucide-react";
import { Badge, Text } from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";

interface FindingClinicalDetailsCardProps {
  description?: string;
  findingType?: string;
}

interface ParsedField {
  label: string;
  value: string;
  type: "classification" | "size" | "exudate" | "symptoms" | "treatment" | "photoRef" | "notes" | "general";
}

export function FindingClinicalDetailsCard({
  description,
  findingType,
}: FindingClinicalDetailsCardProps) {
  if (!description?.trim()) return null;

  // Check if description is formatted as segmented key-value pairs
  const isStructured = description.includes(" · ") || description.includes(": ");

  if (!isStructured) {
    return (
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
        <div className="flex items-center gap-2 text-slate-600">
          <FileText className="size-4 text-slate-500" />
          <p className="text-sm font-semibold text-slate-700">Clinical Description</p>
        </div>
        <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
          {description}
        </p>
      </div>
    );
  }

  const rawSegments = description.split(" · ");
  const fields: ParsedField[] = [];
  let notesValue = "";

  rawSegments.forEach((segment) => {
    const colonIdx = segment.indexOf(":");
    if (colonIdx === -1) {
      if (segment.trim()) {
        fields.push({ label: "Details", value: segment.trim(), type: "general" });
      }
      return;
    }

    const rawLabel = segment.substring(0, colonIdx).trim();
    const rawVal = segment.substring(colonIdx + 1).trim();

    if (!rawVal) return;

    const lowerLabel = rawLabel.toLowerCase();

    if (lowerLabel.includes("notes") || lowerLabel.includes("clinical notes")) {
      notesValue = rawVal;
    } else if (lowerLabel === "type" || lowerLabel.includes("subcategory") || lowerLabel.includes("category") || lowerLabel.includes("classification")) {
      // Clean up cases like "Rash (Maculopapular (Raised bumps))" -> "Maculopapular (Raised bumps)" if prefixed by type name
      let cleanedVal = rawVal;
      if (findingType && cleanedVal.toLowerCase().startsWith(findingType.toLowerCase())) {
        cleanedVal = cleanedVal.slice(findingType.length).trim();
        if (cleanedVal.startsWith("(") && cleanedVal.endsWith(")")) {
          cleanedVal = cleanedVal.slice(1, -1).trim();
        }
      }
      fields.push({ label: rawLabel, value: cleanedVal, type: "classification" });
    } else if (lowerLabel.includes("size") || lowerLabel.includes("distribution") || lowerLabel.includes("appearance") || lowerLabel.includes("area")) {
      fields.push({ label: rawLabel, value: rawVal, type: "size" });
    } else if (lowerLabel.includes("exudate")) {
      fields.push({ label: rawLabel, value: rawVal, type: "exudate" });
    } else if (lowerLabel.includes("sensation") || lowerLabel.includes("discomfort") || lowerLabel.includes("tenderness") || lowerLabel.includes("swelling") || lowerLabel.includes("symptom")) {
      fields.push({ label: rawLabel, value: rawVal, type: "symptoms" });
    } else if (lowerLabel.includes("treatment") || lowerLabel.includes("dressing") || lowerLabel.includes("cream") || lowerLabel.includes("applied") || lowerLabel.includes("cause") || lowerLabel.includes("mechanism")) {
      fields.push({ label: rawLabel, value: rawVal, type: "treatment" });
    } else if (lowerLabel.includes("photo ref") || lowerLabel.includes("photo reference")) {
      fields.push({ label: rawLabel, value: rawVal, type: "photoRef" });
    } else {
      fields.push({ label: rawLabel, value: rawVal, type: "general" });
    }
  });

  const classificationField = fields.find((f) => f.type === "classification");
  const gridFields = fields.filter((f) => f.type !== "classification");

  const getFieldIcon = (type: ParsedField["type"]) => {
    switch (type) {
      case "size":
        return <Ruler className="size-3.5 text-blue-600 shrink-0" />;
      case "exudate":
        return <Droplets className="size-3.5 text-amber-600 shrink-0" />;
      case "symptoms":
        return <Activity className="size-3.5 text-rose-600 shrink-0" />;
      case "treatment":
        return <Bandage className="size-3.5 text-emerald-600 shrink-0" />;
      case "photoRef":
        return <Camera className="size-3.5 text-indigo-600 shrink-0" />;
      default:
        return <FileText className="size-3.5 text-slate-500 shrink-0" />;
    }
  };

  return (
    <div className="space-y-3 p-4 rounded-xl bg-slate-50/80 border border-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-teal-800 shrink-0" />
          <Text size="sm" weight="bold" className="text-slate-900">
            Clinical Assessment Details
          </Text>
        </div>

        {classificationField && (
          <Badge
            variant="outline"
            className="bg-teal-50 text-teal-900 border-teal-200 text-sm font-semibold px-2.5 py-0.5 rounded-full"
          >
            {classificationField.value}
          </Badge>
        )}
      </div>

      {/* Grid of structured clinical fields */}
      {gridFields.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {gridFields.map((field, idx) => (
            <div
              key={`${field.label}-${idx}`}
              className="p-2.5 rounded-lg bg-white border border-slate-200/90 shadow-2xs space-y-1"
            >
              <div className="flex items-center gap-1.5 text-slate-500">
                {getFieldIcon(field.type)}
                <span className="text-[11px] font-semibold text-slate-600 truncate">
                  {field.label}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-900 leading-snug pl-5">
                {field.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Additional Clinical Notes */}
      {notesValue && (
        <div className="p-3 rounded-lg bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-slate-600">
            <FileText className="size-3.5 text-slate-500" />
            <span className="text-[11px] font-semibold text-slate-700">
              Additional Clinical Observations
            </span>
          </div>
          <p className="text-sm text-slate-800 leading-relaxed pl-5">
            {notesValue}
          </p>
        </div>
      )}
    </div>
  );
}

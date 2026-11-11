"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Textarea,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import {
  type BodyMapViewType,
  type BodyMapVariantType,
  type AnatomyNode,
  type ExactPointDTO,
  type Laterality,
  type BodyMapFindingTypeValue,
  type BodyMapSeverityValue,
  buildLocationLabel,
  DEFAULT_BODY_MAP_ASSET_VERSION,
} from "@repo/schema";
import { Crosshair, MapPin } from "lucide-react";
import { useAuth } from "../../../../lib/context/AuthContext";
import { FindingPhotoAttachmentSection } from "./FindingPhotoAttachmentSection";
import {
  PRIMARY_FINDING_TYPES,
  FINDING_TYPE_CONFIGS,
  type PrimaryFindingType,
  mapToSchemaFindingType,
  inferSeverity,
} from "./body-map-form-types";

// ─── Types ───────────────────────────────────────────────────

export interface PendingFinding {
  view: BodyMapViewType;
  bodyMapVariant: BodyMapVariantType;
  bodyMapAssetVersion: string;
  anatomyId: string;
  anatomicalRegion: string;
  bodyPart: string;
  subPart?: string;
  detail?: string;
  laterality?: Laterality;
  locationLabel: string;
  exactPoint?: ExactPointDTO;
  findingType: BodyMapFindingTypeValue;
  severity: BodyMapSeverityValue;
  onsetDate: string;
  description?: string;
  linkedIncidentId?: string;
  photos?: File[];
}

export interface IncidentSummary {
  id: string;
  incidentNumber: string;
  title: string;
}

interface AddFindingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  view: BodyMapViewType;
  variant: BodyMapVariantType;
  node: AnatomyNode;
  exactPoint?: ExactPointDTO | null;
  onAdd: (finding: PendingFinding) => void;
  incidents?: IncidentSummary[];
}

const EXUDATE_LEVELS = ["None", "Minimal", "Low", "Moderate", "High"] as const;

export function AddFindingDialog({
  open,
  onOpenChange,
  view,
  variant,
  node,
  exactPoint,
  onAdd,
  incidents = [],
}: AddFindingDialogProps) {
  const { user } = useAuth();

  const [primaryType, setPrimaryType] = useState<PrimaryFindingType>("Pressure ulcer");
  const currentConfig = FINDING_TYPE_CONFIGS[primaryType];

  const [subCategory, setSubCategory] = useState<string>(
    currentConfig.defaultSubCategory || currentConfig.subCategories?.[0] || "",
  );
  const [dateFound, setDateFound] = useState<string>(
    new Date().toISOString().split("T")[0]!,
  );
  const [sizeAppearance, setSizeAppearance] = useState("");
  const [exudate, setExudate] = useState<string>("None");
  const [symptomValue, setSymptomValue] = useState<string>("None");
  const [secondaryFieldValue, setSecondaryFieldValue] = useState("");
  const [photoReference, setPhotoReference] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [linkedIncidentId, setLinkedIncidentId] = useState<string>("");
  const [attachedPhotos, setAttachedPhotos] = useState<File[]>([]);
  const [errors, setErrors] = useState<{ dateFound?: string; sizeAppearance?: string }>({});

  const locationLabel = buildLocationLabel(node.id);

  const handleSelectPrimaryType = (type: PrimaryFindingType) => {
    setPrimaryType(type);
    const cfg = FINDING_TYPE_CONFIGS[type];
    setSubCategory(cfg.defaultSubCategory || cfg.subCategories?.[0] || "");
    setExudate("None");
    setSymptomValue(cfg.symptomOptions?.[0] || "None");
    setSizeAppearance("");
    setSecondaryFieldValue("");
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { dateFound?: string; sizeAppearance?: string } = {};
    if (!dateFound) {
      newErrors.dateFound = "Date found is required.";
    }
    if (!sizeAppearance.trim()) {
      newErrors.sizeAppearance = `${currentConfig.sizeLabel.replace(" *", "")} is required.`;
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    const noteSegments: string[] = [];
    noteSegments.push(`Subcategory: ${subCategory}`);
    if (sizeAppearance.trim()) {
      noteSegments.push(`${currentConfig.sizeLabel.replace(" *", "")}: ${sizeAppearance.trim()}`);
    }
    if (currentConfig.hasExudate) {
      noteSegments.push(`Exudate: ${exudate}`);
    }
    if (currentConfig.symptomOptions) {
      noteSegments.push(`${currentConfig.symptomLabel}: ${symptomValue}`);
    }
    if (secondaryFieldValue.trim()) {
      noteSegments.push(`${currentConfig.secondaryFieldLabel}: ${secondaryFieldValue.trim()}`);
    }
    if (photoReference.trim()) {
      noteSegments.push(`Photo Ref: ${photoReference.trim()}`);
    }
    if (additionalNotes.trim()) {
      noteSegments.push(`Notes: ${additionalNotes.trim()}`);
    }
    const consolidatedDescription = noteSegments.join(" · ");

    onAdd({
      view,
      bodyMapVariant: variant,
      bodyMapAssetVersion: DEFAULT_BODY_MAP_ASSET_VERSION,
      anatomyId: node.id,
      anatomicalRegion: node.anatomicalRegion || "general",
      bodyPart: node.bodyPart || "general",
      subPart: node.subPart,
      detail: node.detail,
      laterality: node.laterality,
      locationLabel,
      exactPoint: exactPoint || undefined,
      findingType: mapToSchemaFindingType(primaryType),
      severity: inferSeverity(primaryType, subCategory, currentConfig.hasExudate ? exudate : symptomValue),
      onsetDate: dateFound,
      description: consolidatedDescription,
      linkedIncidentId: linkedIncidentId || undefined,
      photos: attachedPhotos,
    });

    // Reset form
    setSizeAppearance("");
    setExudate("None");
    setSecondaryFieldValue("");
    setPhotoReference("");
    setAdditionalNotes("");
    setLinkedIncidentId("");
    setAttachedPhotos([]);
  };

  const signOffStaff = user?.fullName
    ? `${user.fullName} (${user.roleName || "Staff"})`
    : "Authorized Clinical Staff";
  const signOffDate = format(new Date(), "dd MMM yyyy HH:mm");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="sm:max-w-2xl max-h-[92vh] overflow-y-auto p-6 font-['Outfit',sans-serif]">
        <DialogHeader className="space-y-1.5 pb-1 border-b border-slate-100">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
            Document Clinical Finding
          </DialogTitle>
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <Badge variant="outline" className="text-md font-normal border-blue-200 bg-blue-50 text-blue-900 flex items-center gap-1">
              <MapPin className="size-3 text-blue-600" />
              {locationLabel}
            </Badge>
            <Badge variant="secondary" className="text-md">
              {view} View
            </Badge>
            {exactPoint && (
              <Badge className="text-md bg-emerald-600 text-white flex items-center gap-1">
                <Crosshair className="size-3" />
                Exact Coordinate Pin
              </Badge>
            )}
          </div>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit} className="space-y-4 pt-3">
          {/* Unified Type & Category Grid inside ONE container */}
          <div className="space-y-1.5">
            <label className="text-md font-bold text-slate-800 block">
              Type *
            </label>
            <div className="border border-slate-300 rounded-lg overflow-hidden bg-white text-md divide-y divide-slate-200">
              {/* Row 1: Primary Types */}
              <div className="grid grid-cols-2 sm:grid-cols-6 divide-x divide-y sm:divide-y-0 divide-slate-200">
                {PRIMARY_FINDING_TYPES.map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={primaryType === type ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => handleSelectPrimaryType(type)}
                    className={cn(
                      "h-auto rounded-none py-2 px-1.5 text-center text-md font-normal truncate shadow-none",
                      primaryType === type
                        ? "font-medium"
                        : "text-slate-700 hover:bg-slate-50 bg-white",
                    )}
                    title={type}
                  >
                    {type}
                  </Button>
                ))}
              </div>

              {/* Rows below in SAME box: Category / Sub-type specific options */}
              {primaryType === "Pressure ulcer" ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-x divide-slate-200">
                    {["Pressure ulcer — category 1", "Pressure ulcer — category 2"].map((cat) => (
                      <Button
                        key={cat}
                        type="button"
                        variant={subCategory === cat ? "primary" : "ghost"}
                        size="sm"
                        onClick={() => setSubCategory(cat)}
                        className={cn(
                          "h-auto rounded-none py-2 px-3 text-left justify-start text-md font-normal shadow-none",
                          subCategory === cat
                            ? "font-medium"
                            : "text-slate-700 hover:bg-slate-50 bg-white",
                        )}
                      >
                        {cat}
                      </Button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-x divide-slate-200">
                    {["Pressure ulcer — category 3", "Pressure ulcer — category 4"].map((cat) => (
                      <Button
                        key={cat}
                        type="button"
                        variant={subCategory === cat ? "primary" : "ghost"}
                        size="sm"
                        onClick={() => setSubCategory(cat)}
                        className={cn(
                          "h-auto rounded-none py-2 px-3 text-left justify-start text-md font-normal shadow-none",
                          subCategory === cat
                            ? "font-medium"
                            : "text-slate-700 hover:bg-slate-50 bg-white",
                        )}
                      >
                        {cat}
                      </Button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1">
                    <Button
                      type="button"
                      variant={subCategory === "Unstageable / deep tissue injury" ? "primary" : "ghost"}
                      size="sm"
                      onClick={() => setSubCategory("Unstageable / deep tissue injury")}
                      className={cn(
                        "h-auto rounded-none py-2 px-3 text-left justify-start sm:w-1/2 text-md font-normal shadow-none",
                        subCategory === "Unstageable / deep tissue injury"
                          ? "font-medium"
                          : "text-slate-700 hover:bg-slate-50 bg-white",
                      )}
                    >
                      Unstageable / deep tissue injury
                    </Button>
                  </div>
                </>
              ) : currentConfig.subCategories && currentConfig.subCategories.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-x divide-y sm:divide-y-0 divide-slate-200">
                  {currentConfig.subCategories.map((sub) => (
                    <Button
                      key={sub}
                      type="button"
                      variant={subCategory === sub ? "primary" : "ghost"}
                      size="sm"
                      onClick={() => setSubCategory(sub)}
                      className={cn(
                        "h-auto rounded-none py-2.5 px-3 text-left justify-start text-md font-normal shadow-none",
                        subCategory === sub
                          ? "font-medium"
                          : "text-slate-700 hover:bg-slate-50 bg-white",
                      )}
                    >
                      {sub}
                    </Button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {/* Date found & Size/Appearance Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label htmlFor="date-found" className="text-md font-bold text-slate-800 block">
                Date found *
              </label>
              <Input
                id="date-found"
                type="date"
                value={dateFound}
                onChange={(e) => {
                  setDateFound(e.target.value);
                  if (errors.dateFound) setErrors((prev) => ({ ...prev, dateFound: undefined }));
                }}
                className={cn(
                  "h-9 text-md rounded-lg border-slate-300",
                  errors.dateFound && "border-red-500 focus-visible:ring-red-400",
                )}
              />
              {errors.dateFound && (
                <p className="text-md text-red-500 font-medium mt-1">{errors.dateFound}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="size-appearance" className="text-md font-bold text-slate-800 block">
                {currentConfig.sizeLabel}
              </label>
              <Input
                id="size-appearance"
                value={sizeAppearance}
                onChange={(e) => {
                  setSizeAppearance(e.target.value);
                  if (errors.sizeAppearance) setErrors((prev) => ({ ...prev, sizeAppearance: undefined }));
                }}
                placeholder={currentConfig.sizePlaceholder}
                className={cn(
                  "h-9 text-md rounded-lg border-slate-300",
                  errors.sizeAppearance && "border-red-500 focus-visible:ring-red-400",
                )}
              />
              {errors.sizeAppearance && (
                <p className="text-md text-red-500 font-medium mt-1">{errors.sizeAppearance}</p>
              )}
            </div>
          </div>

          {/* Type-Specific Dynamic Attribute: Exudate OR Sensation/Symptoms */}
          {currentConfig.hasExudate ? (
            <div className="space-y-1.5">
              <label className="text-md font-bold text-slate-800 block">
                Exudate
              </label>
              <div className="grid grid-cols-5 border border-slate-300 rounded-lg overflow-hidden divide-x divide-slate-200 bg-white text-md">
                {EXUDATE_LEVELS.map((opt) => (
                  <Button
                    key={opt}
                    type="button"
                    variant={exudate === opt ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setExudate(opt)}
                    className={cn(
                      "h-auto rounded-none py-2 text-center text-md font-normal shadow-none",
                      exudate === opt
                        ? "font-medium"
                        : "text-slate-700 hover:bg-slate-50 bg-white",
                    )}
                  >
                    {opt}
                  </Button>
                ))}
              </div>
            </div>
          ) : currentConfig.symptomOptions ? (
            <div className="space-y-1.5">
              <label className="text-md font-bold text-slate-800 block">
                {currentConfig.symptomLabel}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 border border-slate-300 rounded-lg overflow-hidden divide-x divide-slate-200 bg-white text-md">
                {currentConfig.symptomOptions.map((opt) => (
                  <Button
                    key={opt}
                    type="button"
                    variant={symptomValue === opt ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setSymptomValue(opt)}
                    className={cn(
                      "h-auto rounded-none py-2 text-center text-md font-normal truncate px-1 shadow-none",
                      symptomValue === opt
                        ? "font-medium"
                        : "text-slate-700 hover:bg-slate-50 bg-white",
                    )}
                  >
                    {opt}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}

          {/* Secondary Field & Photo Reference Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label htmlFor="sec-field" className="text-md font-bold text-slate-800 block">
                {currentConfig.secondaryFieldLabel}
              </label>
              <Input
                id="sec-field"
                value={secondaryFieldValue}
                onChange={(e) => setSecondaryFieldValue(e.target.value)}
                placeholder={currentConfig.secondaryFieldPlaceholder}
                className="h-9 text-md rounded-lg border-slate-300"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="photo-ref" className="text-md font-bold text-slate-800 block">
                Photo reference (consent checked)
              </label>
              <Input
                id="photo-ref"
                value={photoReference}
                onChange={(e) => setPhotoReference(e.target.value)}
                placeholder="e.g. Consent checked, wound ref #01"
                className="h-9 text-md rounded-lg border-slate-300"
              />
            </div>
          </div>

          {/* Additional Notes & Optional Linked Incident */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label htmlFor="clinical-notes" className="text-md font-bold text-slate-800 block">
                Additional Clinical Description (Optional)
              </label>
              <Textarea
                id="clinical-notes"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="e.g. Surrounding erythema, clean wound base"
                rows={2}
                className="text-md rounded-lg border-slate-300 resize-none"
              />
            </div>

            {incidents.length > 0 ? (
              <div className="space-y-1">
                <label htmlFor="linked-incident" className="text-md font-bold text-slate-800 block">
                  Link Incident (Optional)
                </label>
                <Select
                  value={linkedIncidentId}
                  onValueChange={setLinkedIncidentId}
                >
                  <SelectTrigger id="linked-incident" className="h-9 text-md rounded-lg border-slate-300">
                    <SelectValue placeholder="Select incident..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="" className="text-md">None</SelectItem>
                    {incidents.map((inc) => (
                      <SelectItem key={inc.id} value={inc.id} className="text-md">
                        {inc.incidentNumber} — {inc.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>

          {/* Drag & Drop Photos with Thumbnails and Modal Preview */}
          <div className="pt-1">
            <FindingPhotoAttachmentSection
              files={attachedPhotos}
              onFilesChange={setAttachedPhotos}
            />
          </div>

          {/* Footer Bar with Sign-Off Audit Info and Action Buttons */}
          <div className="pt-4 border-t border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-md text-slate-500 leading-tight">
              Signed as <span className="font-semibold text-slate-700">{signOffStaff}</span> · {signOffDate} · entries cannot be edited after saving
            </p>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 text-md font-medium rounded-lg border-slate-300 text-slate-700 hover:bg-slate-50 px-4"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="h-8 text-md font-semibold rounded-lg shadow-xs px-5"
              >
                Save
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

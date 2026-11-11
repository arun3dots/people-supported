"use client";

import React, { useState } from "react";
import {
  Button,
  Text,
  Badge,
  Textarea,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@repo/ui/components/ui";
import { Edit3, CheckCircle2, BookOpen } from "lucide-react";
import type { CarePlanSectionDTO } from "@repo/schema";
import {
  useGetCarePlanSectionsQuery,
  useUpdateCarePlanSectionMutation,
} from "../../../../../../lib/queries/care-plan";
import { CarePlanRiskSummaryCard } from "./CarePlanRiskSummaryCard";
import { DOMAINS, DomainDef } from "./domainDefinitions";

interface CarePlanPersonCentredDomainsTabProps {
  carePlanId: string;
  residentId: string;
  isEditable: boolean;
}

export function CarePlanPersonCentredDomainsTab({
  carePlanId,
  residentId,
  isEditable,
}: CarePlanPersonCentredDomainsTabProps) {
  const { data: rawSections, isLoading } = useGetCarePlanSectionsQuery(carePlanId);
  const updateSectionMutation = useUpdateCarePlanSectionMutation(carePlanId);

  const [selectedDomain, setSelectedDomain] = useState<DomainDef>(DOMAINS[0]!);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingContent, setEditingContent] = useState("");

  const sections = (rawSections || []) as CarePlanSectionDTO[];
  const sectionMap = new Map<string, CarePlanSectionDTO>(
    sections.map((s: CarePlanSectionDTO) => [s.sectionName, s]),
  );
  const currentSection = sectionMap.get(selectedDomain.key);

  const handleOpenEdit = (domain: DomainDef) => {
    setSelectedDomain(domain);
    const existing = sectionMap.get(domain.key);
    setEditingContent(existing?.content || "");
    setIsEditDialogOpen(true);
  };

  const handleSaveDomain = () => {
    updateSectionMutation.mutate(
      {
        sectionName: selectedDomain.key,
        data: {
          content: editingContent,
        },
      },
      {
        onSuccess: () => setIsEditDialogOpen(false),
      },
    );
  };

  return (
    <div className="space-y-6 font-['Outfit',sans-serif]">
      {/* 1. Integrated CQC Clinical Risk Matrix */}
      <CarePlanRiskSummaryCard residentId={residentId} />

      {/* 2. Person-Centred PRSB Domains Layout */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="size-5 text-emerald-800" />
              <Text size="base" weight="bold" className="text-slate-900">
                Person-Centred Care Domains (PRSB &amp; CQC Standard)
              </Text>
            </div>
            <Text size="sm" variant="muted" className="mt-0.5">
              Comprehensive holistic care documentation structured across all 9 statutory domains
            </Text>
          </div>
          <Badge variant="secondary" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-md">
            {sections.length} of 9 Domains Documented
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5">
          {/* Domain Navigation List (Left Column) */}
          <div className="lg:col-span-4 space-y-1.5">
            {DOMAINS.map((domain) => {
              const sec = sectionMap.get(domain.key);
              const isDocumented = !!sec?.content && sec.content.trim().length > 0;
              const isSelected = selectedDomain.key === domain.key;
              const Icon = domain.icon;

              return (
                <button
                  key={domain.key}
                  onClick={() => setSelectedDomain(domain)}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 cursor-pointer ${isSelected
                    ? "bg-emerald-800 text-white shadow-xs"
                    : "bg-slate-50/70 hover:bg-slate-100/80 text-slate-700 border border-slate-200/50"
                    }`}
                >
                  <div
                    className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${isSelected ? "bg-emerald-700 text-white" : "bg-white text-slate-600"
                      }`}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <Text
                        size="sm"
                        weight="bold"
                        className={`truncate ${isSelected ? "text-white" : "text-slate-900"}`}
                      >
                        {domain.title}
                      </Text>
                      {isDocumented ? (
                        <CheckCircle2
                          className={`size-3.5 shrink-0 ${isSelected ? "text-emerald-200" : "text-emerald-600"
                            }`}
                        />
                      ) : (
                        <span
                          className={`text-sm font-mono shrink-0 ${isSelected ? "text-emerald-200" : "text-slate-400"
                            }`}
                        >
                          Draft
                        </span>
                      )}
                    </div>
                    <p
                      className={`truncate text-sm ${isSelected ? "text-emerald-100" : "text-slate-500"}`}
                    >
                      {domain.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Domain Narrative & Detail (Right Column) */}
          <div className="lg:col-span-8 bg-surface-card-grey/50 rounded-2xl border border-slate-200/70 p-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200/60">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Text size="sm" weight="bold" className="text-slate-900">
                      {selectedDomain.title}
                    </Text>
                    <span className="text-sm font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                      {selectedDomain.cqcKLOE}
                    </span>
                  </div>
                  <Text size="sm" variant="muted">
                    {selectedDomain.subtitle}
                  </Text>
                </div>

                {isEditable && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleOpenEdit(selectedDomain)}
                    className="h-8 gap-1.5 rounded-xl text-md font-semibold cursor-pointer shrink-0"
                  >
                    <Edit3 className="size-3.5" /> Edit Domain
                  </Button>
                )}
              </div>

              {isLoading ? (
                <div className="p-8 text-center text-md text-slate-500">Loading domain content...</div>
              ) : currentSection?.content ? (
                <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs">
                  <div className="text-md text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {currentSection.content}
                  </div>
                  {currentSection.updatedAt && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-sm text-slate-400">
                      <span>Last updated: {new Date(currentSection.updatedAt).toLocaleString("en-GB")}</span>
                      {currentSection.authorId && <span>Staff Ref: {currentSection.authorId}</span>}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-xl p-8 text-center border border-dashed border-slate-200 space-y-2">
                  <Text size="sm" weight="medium" className="text-slate-600">
                    No narrative recorded for this person-centred domain yet.
                  </Text>
                  <p className="text-sm text-slate-500 max-w-md mx-auto">
                    Click "Edit Domain" above to capture person-centred preferences, care routines, and clinical instructions.
                  </p>
                  {isEditable && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenEdit(selectedDomain)}
                      className="mt-2 text-md rounded-xl"
                    >
                      Document {selectedDomain.title.split(". ")[1]}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Domain Modal */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-xl font-['Outfit',sans-serif]">
          <DialogHeader>
            <DialogTitle className="text-md font-bold text-slate-900">
              Edit: {selectedDomain.title}
            </DialogTitle>
            <Text size="sm" variant="muted">
              {selectedDomain.subtitle}
            </Text>
          </DialogHeader>

          <div className="space-y-2 py-3">
            <Textarea
              rows={9}
              value={editingContent}
              onChange={(e) => setEditingContent(e.target.value)}
              placeholder={selectedDomain.placeholder}
              className="text-md leading-relaxed"
            />
            <p className="text-sm text-slate-500">
              Use clear, person-centred language (e.g. "Eleanor prefers...", "Staff must ensure...").
            </p>
          </div>

          <DialogFooter className="gap-2 border-t border-slate-100 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="rounded-xl text-md"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSaveDomain}
              disabled={updateSectionMutation.isPending}
              className="rounded-xl text-md font-semibold"
            >
              {updateSectionMutation.isPending ? "Saving..." : "Save Domain"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

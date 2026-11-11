"use client";

import React from "react";
import { type UseFormRegister, type Control, Controller } from "react-hook-form";
import { ArrowLeft, ArrowRight, Activity, UserCheck, FileText, ShieldAlert } from "lucide-react";
import {
  Button,
  Card,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Text,
} from "@repo/ui/components/ui";
import type { UpdateEnquiryAssessmentDTO } from "@repo/schema";
import { DEPENDENCY_LEVELS } from "../../types";

interface WizardStep2Props {
  register: UseFormRegister<UpdateEnquiryAssessmentDTO>;
  control: Control<UpdateEnquiryAssessmentDTO>;
  candidateName: string;
  careCategory: string;
  isLoading: boolean;
  onBack: () => void;
  onSaveAssessment: () => void;
  onNext: () => void;
}

export function WizardStep2({
  register,
  control,
  candidateName,
  careCategory,
  isLoading,
  onBack,
  onSaveAssessment,
  onNext,
}: WizardStep2Props) {
  return (
    <div className="space-y-4 pt-1">
      {/* Candidate Fit Overview Card */}
      <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200 shadow-none">
        <div className="flex items-center gap-2.5 text-emerald-950">
          <div className="size-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <Activity className="size-4" />
          </div>
          <div>
            <Text size="sm" weight="medium" className="text-emerald-950">
              Evaluating candidate fit for: <strong className="font-bold">{candidateName || "Prospective Resident"}</strong> ({careCategory || "Residential"})
            </Text>
            <Text size="sm" weight="regular" className="text-emerald-700">
              Complete pre-admission clinical, mobility, dietary and risk observations.
            </Text>
          </div>
        </div>
        <div className="w-full sm:w-48">
          <Controller
            name="dependencyLevel"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || "Medium"}>
                <SelectTrigger className="h-8 text-md bg-white border-emerald-200">
                  <SelectValue placeholder="Dependency Level" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  {DEPENDENCY_LEVELS.map((lvl) => (
                    <SelectItem key={lvl} value={lvl} className="text-md">
                      {lvl} Dependency
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </Card>

      {/* Accordion Questionnaire */}
      <Accordion type="single" collapsible defaultValue="section-1" className="w-full space-y-3">
        {/* Section 1: Clinical & Medical Needs */}
        <AccordionItem value="section-1" className="border border-slate-200 rounded-2xl px-4 bg-white shadow-xs">
          <AccordionTrigger className="hover:no-underline py-3.5">
            <div className="flex items-center gap-2.5 text-slate-900 font-semibold text-md">
              <Activity className="size-4 text-emerald-800" />
              <span>Section A: Clinical & Medical Needs Assessment</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="medicalNeeds">
                Primary Clinical & Medical Care Needs
              </Label>
              <Textarea
                id="medicalNeeds"
                placeholder="Detail existing medical diagnoses, medication support needed, nursing interventions required..."
                {...register("medicalNeeds")}
                className="text-md min-h-20"
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 2: Physical & Mobility Needs */}
        <AccordionItem value="section-2" className="border border-slate-200 rounded-2xl px-4 bg-white shadow-xs">
          <AccordionTrigger className="hover:no-underline py-3.5">
            <div className="flex items-center gap-2.5 text-slate-900 font-semibold text-md">
              <UserCheck className="size-4 text-teal-800" />
              <span>Section B: Physical Mobility & Transfer Assistance</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="mobilityNeeds">
                Mobility Status, Equipment & Transfer Requirements
              </Label>
              <Textarea
                id="mobilityNeeds"
                placeholder="Uses Zimmer frame, requires 2-carer assist for hoist transfer, wheelchair bound..."
                {...register("mobilityNeeds")}
                className="text-md min-h-20"
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 3: Dietary & Personal Care Requirements */}
        <AccordionItem value="section-3" className="border border-slate-200 rounded-2xl px-4 bg-white shadow-xs">
          <AccordionTrigger className="hover:no-underline py-3.5">
            <div className="flex items-center gap-2.5 text-slate-900 font-semibold text-md">
              <FileText className="size-4 text-amber-800" />
              <span>Section C: Dietary, Feeding & Daily Living Needs</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="dietaryRequirements">
                Dietary Requirements, Allergies & Feeding Assistance
              </Label>
              <Textarea
                id="dietaryRequirements"
                placeholder="Soft pureed diet (IDDSI Level 4), diabetic monitoring, assistance with meals..."
                {...register("dietaryRequirements")}
                className="text-md min-h-20"
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 4: Risk Factors & Safeguarding */}
        <AccordionItem value="section-4" className="border border-slate-200 rounded-2xl px-4 bg-white shadow-xs">
          <AccordionTrigger className="hover:no-underline py-3.5">
            <div className="flex items-center gap-2.5 text-slate-900 font-semibold text-md">
              <ShieldAlert className="size-4 text-rose-800" />
              <span>Section D: Risk Factors, Cognitive & Behavioural Factors</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="riskNotes">
                Risk Assessment, Cognitive Condition & Behavioural Notes
              </Label>
              <Textarea
                id="riskNotes"
                placeholder="High fall risk at night, mild dementia cognitive impairment, wandering tendencies..."
                {...register("riskNotes")}
                className="text-md min-h-20"
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Action Bar */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="h-10 px-4 rounded-xl flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="size-4" /> Back to Step 1
        </Button>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onSaveAssessment}
            disabled={isLoading}
            className="h-10 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-800 cursor-pointer"
          >
            Save Assessment
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onNext}
            disabled={isLoading}
            className="h-10 px-5 rounded-xl flex items-center gap-2 cursor-pointer"
          >
            Next: Admission Prep <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

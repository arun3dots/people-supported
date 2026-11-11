"use client";

import React, { useState } from "react";
import {
  Card,
  Badge,
  Button,
  Text,
  Label,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui";
import type {
  NeedsAssessmentDataDTO,
  AssessmentCustomQuestionDTO,
  AssessmentTemplateResponseDTO,
} from "@repo/schema";
import { AssessmentHeaderSection } from "./sections/AssessmentHeaderSection";
import { OutcomeSection } from "./sections/OutcomeSection";
import { PRESET_ASSESSMENT_TEMPLATES } from "./types";
import { useGetAssessmentTemplatesQuery } from "../../../../../../lib/queries/enquiries";
import { AssessmentQuestionStepper } from "./AssessmentQuestionStepper";
import { Activity, Layers } from "lucide-react";

interface AssessmentFormTabProps {
  formData: NeedsAssessmentDataDTO;
  onChange: (field: keyof NeedsAssessmentDataDTO, value: unknown) => void;
  readOnly?: boolean;
}

interface TemplateOption {
  id: string;
  name: string;
  category: string;
  description: string;
  isPreset: boolean;
  questions: AssessmentCustomQuestionDTO[];
}

export function AssessmentFormTab({
  formData,
  onChange,
  readOnly = false,
}: AssessmentFormTabProps) {
  const { data: dbTemplates = [] } = useGetAssessmentTemplatesQuery();

  // Combine preset built-in templates + custom DB templates
  const presetOptions: TemplateOption[] = PRESET_ASSESSMENT_TEMPLATES.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    description: p.description,
    isPreset: true,
    questions: p.questions,
  }));

  const dbOptions: TemplateOption[] = (dbTemplates || []).map(
    (t: AssessmentTemplateResponseDTO) => {
      const sections = Array.isArray(t.sections)
        ? (t.sections as { title?: string; questions?: AssessmentCustomQuestionDTO[] }[])
        : [];
      const questions = sections.flatMap((sec) =>
        (sec.questions || []).map((q) => ({
          ...q,
          section: q.section || sec.title || "Custom Section",
        }))
      );
      return {
        id: t.id,
        name: t.name,
        category: t.category,
        description: t.description || "Custom care home template",
        isPreset: false,
        questions,
      };
    }
  );

  const allTemplates: TemplateOption[] = [...presetOptions, ...dbOptions];

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    presetOptions[0]?.id || "preset-standard"
  );

  const selectedTemplate = allTemplates.find((t) => t.id === selectedTemplateId) || allTemplates[0];

  const handleLoadQuestions = () => {
    if (selectedTemplate && !readOnly) {
      onChange("customQuestions", selectedTemplate.questions);
    }
  };

  const handleAnswerChange = (
    questionId: string,
    newAnswer: unknown
  ) => {
    if (readOnly) return;
    const currentQuestions = formData.customQuestions || [];
    const updated = currentQuestions.map((q) =>
      q.id === questionId ? { ...q, answer: newAnswer } : q
    );
    onChange("customQuestions", updated);
  };

  const activeQuestions = formData.customQuestions || [];

  return (
    <div className="py-2 space-y-5">
      {/* 1. General Assessment Details Card */}
      <Card>
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5 text-left">
            <div className="size-8 rounded-lg bg-surface-neutral flex items-center justify-center text-surface-primary shrink-0">
              <Activity className="size-4" />
            </div>
            <div>
              <Text variant="base-medium" className="text-text-body font-semibold">
                General Assessment Details
              </Text>
              <Text variant="md-regular" className="text-text-description">
                Assessment date, assessor name, candidate details, location, and reason
              </Text>
            </div>
          </div>
          <Badge
            state={
              formData.finalAssessorDecision === "APPROVED"
                ? "success"
                : formData.finalAssessorDecision === "DECLINED"
                  ? "danger"
                  : "warning"
            }
          >
            {formData.finalAssessorDecision || "Pending Review"}
          </Badge>
        </div>
        <div className="p-5">
          <AssessmentHeaderSection
            formData={formData}
            onChange={onChange}
            readOnly={readOnly}
          />
        </div>
      </Card>

      {/* 2. Clinical Assessment Template Selector Card */}
      <Card>
        <div className="p-5">
          <div className="flex flex-col sm:flex-row items-end gap-3">
            <div>
              <Label required>Select Assessment Template</Label>
              <Select
                value={selectedTemplateId}
                onValueChange={(val) => setSelectedTemplateId(val)}
                disabled={readOnly}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Built-in Clinical Templates</SelectLabel>
                    {presetOptions.map((tmpl) => (
                      <SelectItem key={tmpl.id} value={tmpl.id}>
                        {tmpl.name} ({tmpl.category})
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  {dbOptions.length > 0 && (
                    <>
                      <SelectSeparator />
                      <SelectGroup>
                        <SelectLabel>Custom Care Home Templates</SelectLabel>
                        {dbOptions.map((tmpl) => (
                          <SelectItem key={tmpl.id} value={tmpl.id}>
                            {tmpl.name} ({tmpl.category})
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              variant="primary"
              onClick={handleLoadQuestions}
              disabled={readOnly || !selectedTemplateId}
            >
              <Layers className="size-4" />
              Load All Questions
            </Button>
          </div>
        </div>
      </Card>

      {/* 3. Step-by-Step Question Questionnaire Stepper */}
      <div className="space-y-5">
        <AssessmentQuestionStepper
          questions={activeQuestions}
          onAnswerChange={handleAnswerChange}
          readOnly={readOnly}
        />
      </div>

      {/* 4. Assessor Outcome & Clinical Sign-Off Card */}
      <Card id="assessor-outcome-section">
        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <Text variant="base-medium" className="text-text-body font-semibold">
              Assessor Outcome &amp; Clinical Sign-Off
            </Text>
            <Text variant="md-regular" className="text-text-description">
              Final admission recommendation, care level, room requirements, and signature
            </Text>
          </div>
          {formData.finalAssessorDecision && (
            <Badge
              state={formData.finalAssessorDecision === "APPROVED" ? "success" : "danger"}
            >
              {formData.finalAssessorDecision === "APPROVED" ? "Suitable for Admission" : "Declined"}
            </Badge>
          )}
        </div>

        <div className="p-5">
          <OutcomeSection
            formData={formData}
            onChange={onChange}
            readOnly={readOnly}
          />
        </div>
      </Card>
    </div>
  );
}

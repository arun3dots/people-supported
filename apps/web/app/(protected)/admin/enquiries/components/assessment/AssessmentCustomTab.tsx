"use client";

import React, { useState } from "react";
import {
  Button,
  Card,
  Input,
  Label,
  Badge,
  Text,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from "@repo/ui/components/ui";
import type {
  NeedsAssessmentDataDTO,
  AssessmentCustomQuestionDTO,
  AssessmentTemplateResponseDTO,
} from "@repo/schema";
import { useGetAssessmentTemplatesQuery } from "../../../../../../lib/queries/enquiries";
import { PRESET_ASSESSMENT_TEMPLATES } from "./types";
import { Plus, Trash2, Layers, Sparkles, FileText } from "lucide-react";

interface AssessmentCustomTabProps {
  formData: NeedsAssessmentDataDTO;
  onChange: (field: keyof NeedsAssessmentDataDTO, value: unknown) => void;
  readOnly?: boolean;
}

export function AssessmentCustomTab({
  formData,
  onChange,
  readOnly = false,
}: AssessmentCustomTabProps) {
  const { data: dbTemplates = [] } = useGetAssessmentTemplatesQuery();
  const [selectedTemplateId, setSelectedTemplateId] = useState("preset-standard");
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newSection, setNewSection] = useState("Lifestyle & Preferences");
  const [newType, setNewType] = useState<"text" | "radio" | "checkbox">("radio");
  const [newOptionInput, setNewOptionInput] = useState("");
  const [newOptionsList, setNewOptionsList] = useState<string[]>(["Option 1", "Option 2"]);

  const allTemplates = [
    ...dbTemplates.map((t: AssessmentTemplateResponseDTO) => ({
      id: t.id,
      name: `${t.name} (Custom)`,
      questions: Array.isArray(t.sections)
        ? t.sections.flatMap((s: { questions?: AssessmentCustomQuestionDTO[] }) => s.questions || [])
        : [],
    })),
    ...PRESET_ASSESSMENT_TEMPLATES,
  ];

  const handleApplyTemplate = () => {
    if (readOnly) return;
    const target = allTemplates.find((t) => t.id === selectedTemplateId);
    if (!target) return;

    const existing = formData.customQuestions || [];
    const newQuestions = target.questions.map((q, idx) => ({
      id: `q-${Date.now()}-${idx}`,
      section: q.section,
      questionText: q.questionText,
      type: q.type,
      options: q.options ? [...q.options] : undefined,
      answer: q.answer,
    }));

    onChange("customQuestions", [...existing, ...newQuestions]);
    toast({ title: "Template Loaded", description: `Loaded questions from ${target.name}` });
  };

  const handleAddOption = () => {
    if (!newOptionInput.trim()) return;
    setNewOptionsList([...newOptionsList, newOptionInput.trim()]);
    setNewOptionInput("");
  };

  const handleRemoveOption = (index: number) => {
    setNewOptionsList(newOptionsList.filter((_, i) => i !== index));
  };

  const handleAddCustomQuestion = () => {
    if (!newQuestionText.trim() || readOnly) return;

    const newQ: AssessmentCustomQuestionDTO = {
      id: `custom-q-${Date.now()}`,
      section: newSection.trim() || "Custom Assessment",
      questionText: newQuestionText.trim(),
      type: newType,
      options: newType !== "text" ? [...newOptionsList] : undefined,
      answer: newType === "checkbox" ? [] : "",
    };

    onChange("customQuestions", [...(formData.customQuestions || []), newQ]);
    setNewQuestionText("");
    setNewOptionsList(["Option 1", "Option 2"]);
    toast({ title: "Question Added", description: "Custom question added to this assessment." });
  };

  const handleRemoveQuestion = (id: string) => {
    if (readOnly) return;
    onChange("customQuestions", (formData.customQuestions || []).filter((q) => q.id !== id));
  };

  return (
    <div className="space-y-6 py-2 font-sans">
      {/* 1. Template Selector */}
      <Card variant="surface" className="space-y-4">
        <div className="flex items-center justify-between border-b border-border-secondary pb-3">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-surface-primary" />
            <Text variant="base-medium" className="text-text-body">
              Load Questions from Assessment Templates
            </Text>
          </div>
          <Badge variant="outline">{allTemplates.length} Available Templates</Badge>
        </div>

        <Text variant="md-regular" className="text-text-description">
          Quickly append structured questionnaires onto this prospective resident&apos;s assessment.
        </Text>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:flex-1">
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId} disabled={readOnly}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {allTemplates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} ({t.questions.length} questions)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            onClick={handleApplyTemplate}
            disabled={readOnly}
            variant="outline"
            className="w-full sm:w-auto gap-1.5"
          >
            <Sparkles className="size-3.5 text-surface-primary" />
            Load Questions
          </Button>
        </div>
      </Card>

      {/* 2. Custom Question Builder */}
      {!readOnly && (
        <Card variant="surface" className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border-secondary pb-3">
            <Plus className="size-4 text-surface-primary" />
            <Text variant="base-medium" className="text-text-body">
              Add Custom Question &amp; Answer Privileges
            </Text>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label required>Question Text</Label>
              <Input
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                placeholder="e.g. Does the prospect require specialised sensory lighting?"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Section Tag</Label>
              <Input
                value={newSection}
                onChange={(e) => setNewSection(e.target.value)}
                placeholder="e.g. Sensory / Routine"
              />
            </div>

            <div className="space-y-1.5">
              <Label required>Response Type</Label>
              <Select
                value={newType}
                onValueChange={(val: "text" | "radio" | "checkbox") => setNewType(val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="radio">Single Choice (Radio)</SelectItem>
                  <SelectItem value="checkbox">Multi-Select (Checkbox)</SelectItem>
                  <SelectItem value="text">Free Text Input</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newType !== "text" && (
              <div className="sm:col-span-2 space-y-2">
                <Label>Options List</Label>
                <div className="flex gap-2">
                  <Input
                    value={newOptionInput}
                    onChange={(e) => setNewOptionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddOption();
                      }
                    }}
                    placeholder="Type an option and click Add..."
                  />
                  <Button type="button" variant="outline" onClick={handleAddOption}>
                    Add
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {newOptionsList.map((opt, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-md bg-surface-neutral text-text-body border border-border-secondary"
                    >
                      {opt}
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(i)}
                        className="text-text-description hover:text-rose-600 cursor-pointer ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              onClick={handleAddCustomQuestion}
              disabled={!newQuestionText.trim()}
              variant="primary"
              className="gap-1.5"
            >
              <Plus className="size-3.5" /> Append Custom Question
            </Button>
          </div>
        </Card>
      )}

      {/* 3. Active Custom Questions Summary */}
      <Card variant="surface" className="space-y-4">
        <div className="flex items-center justify-between border-b border-border-secondary pb-3">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-text-description" />
            <Text variant="base-medium" className="text-text-body">
              Configured Custom Questions in this Assessment
            </Text>
          </div>
          <Badge variant="outline">{formData.customQuestions?.length || 0} questions</Badge>
        </div>

        {!formData.customQuestions || formData.customQuestions.length === 0 ? (
          <Text variant="md-regular" className="text-text-description italic py-4 text-center">
            No custom questions loaded yet. Use the template loader above or add specific questions.
          </Text>
        ) : (
          <div className="space-y-3">
            {formData.customQuestions.map((q: AssessmentCustomQuestionDTO, idx: number) => (
              <div
                key={q.id}
                className="flex items-start justify-between p-4 bg-white rounded-xl border border-border-secondary gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label>
                      {idx + 1}. {q.questionText}
                    </Label>
                    <Badge variant="outline" className="py-0 px-1.5">
                      {q.type}
                    </Badge>
                  </div>
                  {q.section && (
                    <Text size="md" variant="muted">
                      Section: {q.section}
                    </Text>
                  )}
                  {q.options && q.options.length > 0 && (
                    <Text size="md" variant="muted">
                      Options: {q.options.join(" • ")}
                    </Text>
                  )}
                </div>

                {!readOnly && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveQuestion(q.id)}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 w-8 p-0 rounded-lg"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import {
  Button,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
} from "@repo/ui/components/ui";
import { Plus, Trash2 } from "lucide-react";
import type { AssessmentCustomQuestionDTO } from "@repo/schema";

export interface TemplateFormState {
  name: string;
  category: string;
  description: string;
  questions: AssessmentCustomQuestionDTO[];
}

export interface TemplateFormProps {
  state: TemplateFormState;
  onChange: (s: TemplateFormState) => void;
}

export function TemplateForm({ state, onChange }: TemplateFormProps) {
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newSection, setNewSection] = useState("General Clinical");
  const [newType, setNewType] = useState<"text" | "radio" | "checkbox" | "">("");
  const [newOptionsList, setNewOptionsList] = useState<string[]>(["Yes", "No"]);
  const [newOptionInput, setNewOptionInput] = useState("");

  const handleAddOption = () => {
    if (!newOptionInput.trim()) return;
    setNewOptionsList([...newOptionsList, newOptionInput.trim()]);
    setNewOptionInput("");
  };

  const handleRemoveOption = (index: number) => {
    setNewOptionsList(newOptionsList.filter((_, i) => i !== index));
  };

  const handleAddQuestion = () => {
    if (!newQuestionText.trim() || !newType) return;
    const newQ: AssessmentCustomQuestionDTO = {
      id: `q-${Date.now()}`,
      section: newSection.trim() || "Clinical",
      questionText: newQuestionText.trim(),
      type: newType,
      options: newType !== "text" ? [...newOptionsList] : undefined,
      answer: newType === "checkbox" ? [] : "",
    };
    onChange({ ...state, questions: [...state.questions, newQ] });
    setNewQuestionText("");
    setNewType("");
  };

  const handleRemoveQuestion = (id: string) => {
    onChange({ ...state, questions: state.questions.filter((q) => q.id !== id) });
  };

  return (
    <div className="space-y-4 pt-2">
      {/* Name & Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label required>
            Template Name
          </Label>
          <Input
            value={state.name}
            onChange={(e) => onChange({ ...state, name: e.target.value })}
            placeholder="e.g., Dementia Unit Assessment"
            className="px-4 font-medium placeholder:text-slate-400"
          />
        </div>

        <div className="space-y-1.5">
          <Label required>Category</Label>
          <Select
            value={state.category}
            onValueChange={(v) => onChange({ ...state, category: v })}
          >
            <SelectTrigger className="font-medium">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pre-Admission">Pre-Admission</SelectItem>
              <SelectItem value="Dementia">Dementia &amp; Memory Care</SelectItem>
              <SelectItem value="Respite">Respite / Short Stay</SelectItem>
              <SelectItem value="Nursing">High-Dependency Nursing</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea
          value={state.description}
          onChange={(e) => onChange({ ...state, description: e.target.value })}
          placeholder="Brief summary of when to use this template..."
          className="text-md rounded-xl min-h-16 bg-white border-slate-200"
        />
      </div>

      {/* Questions List */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <Text as="h4" size="sm" weight="bold" className="text-slate-900">
            Questions in this Template
          </Text>
          <Text size="sm" className="font-mono text-slate-500">
            {state.questions.length} items
          </Text>
        </div>

        {state.questions.map((q, i) => (
          <div
            key={q.id}
            className="p-3 bg-white rounded-xl border border-slate-200 flex items-start justify-between gap-2"
          >
            <div className="space-y-1">
              <Text size="sm" weight="semibold" className="text-slate-800">
                {i + 1}. {q.questionText}
              </Text>
              <Text size="sm" className="text-slate-400">
                Section: {q.section} • Type: {q.type}
              </Text>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveQuestion(q.id)}
              className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 size-7 p-0 cursor-pointer"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}

        {/* Add Question Sub-form */}
        <div className="p-3 bg-white rounded-xl border border-dashed border-slate-300 space-y-3">
          <Text size="sm" weight="semibold" className="text-slate-700">
            + Add New Custom Question
          </Text>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input
              value={newSection}
              onChange={(e) => setNewSection(e.target.value)}
              placeholder="Section Name"
              className="px-3 text-md"
            />
            <Select
              value={newType}
              onValueChange={(v: "text" | "radio" | "checkbox") => setNewType(v)}
            >
              <SelectTrigger className="text-md">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="radio">Single Choice (Radio)</SelectItem>
                <SelectItem value="checkbox">Multi-Select (Checkbox)</SelectItem>
                <SelectItem value="text">Free Text</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input
            value={newQuestionText}
            onChange={(e) => setNewQuestionText(e.target.value)}
            placeholder="Question Text..."
            className="px-3 text-md"
          />

          {(newType === "radio" || newType === "checkbox") && (
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <Text size="sm" className="text-slate-500">
                Answer Options:
              </Text>
              <div className="flex flex-wrap gap-1.5">
                {newOptionsList.map((opt, optIdx) => (
                  <span
                    key={optIdx}
                    className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-md px-2 py-0.5 rounded-md"
                  >
                    {opt}
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(optIdx)}
                      className="text-slate-400 hover:text-rose-500 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
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
                  placeholder="Type option and click add..."
                  className="px-3 text-md flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddOption}
                  className="cursor-pointer"
                >
                  Add Option
                </Button>
              </div>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddQuestion}
            disabled={!newQuestionText.trim() || !newType}
            className="w-full font-semibold cursor-pointer"
          >
            <Plus className="size-3.5" />
            Append Question
          </Button>
        </div>
      </div>
    </div>
  );
}


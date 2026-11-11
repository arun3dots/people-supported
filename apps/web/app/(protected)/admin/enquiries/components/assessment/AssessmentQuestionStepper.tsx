"use client";

import React, { useState } from "react";
import {
  Button,
  Card,
  Input,
  Label,
  Textarea,
  RadioGroup,
  RadioGroupItem,
  Checkbox,
  Badge,
  Text,
} from "@repo/ui/components/ui";
import { ChevronLeft, ChevronRight, Sparkles, Check } from "lucide-react";
import type { AssessmentCustomQuestionDTO } from "@repo/schema";

export interface AssessmentQuestionStepperProps {
  questions: AssessmentCustomQuestionDTO[];
  onAnswerChange: (questionId: string, newAnswer: string | string[]) => void;
  readOnly?: boolean;
}

export function AssessmentQuestionStepper({
  questions,
  onAnswerChange,
  readOnly = false,
}: AssessmentQuestionStepperProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  if (questions.length === 0) {
    return (
      <Card variant="secondary" className="p-8 text-center">
        <Text size="sm" variant="muted">
          No questions defined for this assessment section yet.
        </Text>
      </Card>
    );
  }

  const safeIndex = Math.min(Math.max(currentQuestionIndex, 0), questions.length - 1);
  const currentQuestion = questions[safeIndex];
  if (!currentQuestion) return null;

  const totalAnswered = questions.filter((q) => {
    if (Array.isArray(q.answer)) return q.answer.length > 0;
    return typeof q.answer === "string" && q.answer.trim().length > 0;
  }).length;

  const progressPercentage = Math.round((totalAnswered / questions.length) * 100);

  const toggleCheckboxAnswer = (qId: string, opt: string) => {
    const currentList = Array.isArray(currentQuestion.answer)
      ? (currentQuestion.answer as string[])
      : [];
    const updated = currentList.includes(opt)
      ? currentList.filter((x) => x !== opt)
      : [...currentList, opt];
    onAnswerChange(qId, updated);
  };

  return (
    <div className="space-y-4">
      {/* Stepper Progress Bar & Meta */}
      <div className="flex items-center justify-between gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono">
            Question {safeIndex + 1} of {questions.length}
          </Badge>
          <Text size="sm" variant="muted">
            Section: {currentQuestion.section || "Clinical"}
          </Text>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-32 bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-800 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <Text size="sm" weight="medium" className="text-slate-600 font-mono">
            {progressPercentage}%
          </Text>
        </div>
      </div>

      {/* Interactive Question Pill Navigation */}
      <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50/50 rounded-xl border border-slate-200 max-h-28 overflow-y-auto">
        {questions.map((q, idx) => {
          const isAnswered = Array.isArray(q.answer)
            ? q.answer.length > 0
            : typeof q.answer === "string" && q.answer.trim().length > 0;
          const isCurrent = idx === safeIndex;

          return (
            <button
              key={q.id}
              type="button"
              onClick={() => setCurrentQuestionIndex(idx)}
              className={`size-7 rounded-lg text-md font-semibold flex items-center justify-center transition-all cursor-pointer ${isCurrent
                ? "bg-emerald-800 text-white shadow-sm ring-2 ring-emerald-600 ring-offset-1"
                : isAnswered
                  ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
            >
              {isAnswered && !isCurrent ? <Check className="size-3 text-emerald-800" /> : idx + 1}
            </button>
          );
        })}
      </div>

      {/* Active Question Display Card */}
      <Card variant="surface" className="p-5 space-y-4 border border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{currentQuestion.type}</Badge>
            {currentQuestion.section && (
              <Text size="sm" variant="muted">
                Category: {currentQuestion.section}
              </Text>
            )}
          </div>
          <Text size="sm" weight="semibold" className="text-slate-900 pt-1">
            {currentQuestion.questionText}
          </Text>
        </div>

        {/* Dynamic Answer Controls */}
        <div className="pt-2">
          {/* Single Choice (Radio) */}
          {currentQuestion.type === "radio" && currentQuestion.options && (
            <RadioGroup
              value={(currentQuestion.answer as string) || ""}
              onValueChange={(val: string) => onAnswerChange(currentQuestion.id, val)}
              disabled={readOnly}
              className="space-y-2"
            >
              {currentQuestion.options.map((opt: string) => (
                <div
                  key={opt}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => !readOnly && onAnswerChange(currentQuestion.id, opt)}
                >
                  <RadioGroupItem value={opt} id={`${currentQuestion.id}-${opt}`} />
                  <Label
                    htmlFor={`${currentQuestion.id}-${opt}`}
                    className="cursor-pointer text-md font-medium text-slate-800 flex-1"
                  >
                    {opt}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {/* Multi-Select (Checkbox) */}
          {currentQuestion.type === "checkbox" && currentQuestion.options && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {currentQuestion.options.map((opt: string) => {
                const ansList = Array.isArray(currentQuestion.answer)
                  ? (currentQuestion.answer as string[])
                  : [];
                const isChecked = ansList.includes(opt);
                return (
                  <div
                    key={opt}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => !readOnly && toggleCheckboxAnswer(currentQuestion.id, opt)}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() =>
                        !readOnly && toggleCheckboxAnswer(currentQuestion.id, opt)
                      }
                      disabled={readOnly}
                      id={`${currentQuestion.id}-${opt}`}
                    />
                    <Label
                      htmlFor={`${currentQuestion.id}-${opt}`}
                      className="cursor-pointer text-md font-medium text-slate-800 flex-1"
                    >
                      {opt}
                    </Label>
                  </div>
                );
              })}
            </div>
          )}

          {/* Text Input Response */}
          {currentQuestion.type === "text" && (
            <Textarea
              value={(currentQuestion.answer as string) || ""}
              onChange={(e) => onAnswerChange(currentQuestion.id, e.target.value)}
              placeholder="Enter clinical assessment notes or observations..."
              disabled={readOnly}
              className="text-md min-h-24 bg-white border-slate-200 rounded-xl p-3"
            />
          )}
        </div>

        {/* Stepper Navigation Buttons */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0))}
            disabled={safeIndex === 0}
            className="cursor-pointer"
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={() =>
              setCurrentQuestionIndex((prev) => Math.min(prev + 1, questions.length - 1))
            }
            disabled={safeIndex === questions.length - 1}
            className="cursor-pointer"
          >
            Next Question
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}


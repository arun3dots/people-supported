"use client";

import React from "react";
import {
  Button,
  Card,
  Badge,
  Text,
} from "@repo/ui/components/ui";
import {
  Trash2,
  Pencil,
  CheckCircle2,
} from "lucide-react";
import type {
  AssessmentTemplateResponseDTO,
} from "@repo/schema";
import type { PresetTemplate } from "../../components/assessment/types";

interface PresetTemplateCardProps {
  template: PresetTemplate;
}

export function PresetTemplateCard({ template }: PresetTemplateCardProps) {
  return (
    <Card
      variant="secondary"
      className="p-5 gap-3"
    >
      <div className="flex items-center justify-between">
        <Badge state="info">
          {template.category}
        </Badge>
        {template.isDefault && (
          <span className="text-md font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            Default
          </span>
        )}
      </div>
      <Text as="h3" size="md" weight="bold" className="text-slate-900">
        {template.name}
      </Text>
      <Text size="md" variant="muted">
        {template.description}
      </Text>
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between font-mono">
        <Text size="md" className="text-slate-500">{template.questions.length} Questions</Text>
        <Text size="md" weight="medium" className="text-emerald-700">Ready to Use</Text>
      </div>
    </Card>
  );
}

interface CustomTemplateCardProps {
  template: AssessmentTemplateResponseDTO;
  onEdit: (template: AssessmentTemplateResponseDTO) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export function CustomTemplateCard({
  template,
  onEdit,
  onDelete,
  isDeleting = false,
}: CustomTemplateCardProps) {
  return (
    <Card
      variant="secondary"
      className="p-5 gap-3"
    >
      <div className="flex items-center justify-between">
        <Badge state="info">
          {template.category}
        </Badge>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(template)}
            className="rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-2"
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(template.id)}
            disabled={isDeleting}
            className="rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
      <Text as="h3" size="md" weight="bold" className="text-slate-900">
        {template.name}
      </Text>
      {template.description && (
        <Text size="md" variant="muted">
          {template.description}
        </Text>
      )}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <Text size="md" className="text-slate-500">Custom Template</Text>
        <Text size="md" weight="semibold" className="text-emerald-700 flex items-center gap-1">
          <CheckCircle2 className="size-3.5" /> Active
        </Text>
      </div>
    </Card>
  );
}


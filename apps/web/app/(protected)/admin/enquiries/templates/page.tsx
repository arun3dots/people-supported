"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Text,
} from "@repo/ui/components/ui";
import {
  useGetAssessmentTemplatesQuery,
  useCreateAssessmentTemplateMutation,
  useUpdateAssessmentTemplateMutation,
  useDeleteAssessmentTemplateMutation,
} from "../../../../../lib/queries/enquiries";
import { PRESET_ASSESSMENT_TEMPLATES, type PresetTemplate } from "../components/assessment/types";
import {
  Layers,
  Plus,
  ArrowLeft,
  Sparkles,
  FileText,
} from "lucide-react";
import type {
  AssessmentCustomQuestionDTO,
  AssessmentTemplateResponseDTO,
} from "@repo/schema";
import { TemplateForm, type TemplateFormState } from "./components/TemplateForm";
import { PresetTemplateCard, CustomTemplateCard } from "./components/TemplateCard";

const EMPTY_FORM: TemplateFormState = {
  name: "",
  category: "",
  description: "",
  questions: [],
};

export default function AssessmentTemplatesPage() {
  const { data: dbTemplates = [], isLoading } = useGetAssessmentTemplatesQuery();
  const createMutation = useCreateAssessmentTemplateMutation();
  const updateMutation = useUpdateAssessmentTemplateMutation();
  const deleteMutation = useDeleteAssessmentTemplateMutation();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<TemplateFormState>(EMPTY_FORM);

  const [editTarget, setEditTarget] = useState<AssessmentTemplateResponseDTO | null>(null);
  const [editForm, setEditForm] = useState<TemplateFormState>(EMPTY_FORM);

  const openEdit = (t: AssessmentTemplateResponseDTO) => {
    const sections = Array.isArray(t.sections)
      ? (t.sections as { questions?: AssessmentCustomQuestionDTO[] }[])
      : [];
    const questions = sections.flatMap((sec) => sec.questions || []);
    setEditForm({
      name: t.name,
      category: t.category,
      description: t.description || "",
      questions,
    });
    setEditTarget(t);
  };

  const handleCreate = async () => {
    if (!createForm.name.trim() || !createForm.category) return;
    await createMutation.mutateAsync({
      name: createForm.name.trim(),
      category: createForm.category,
      description: createForm.description.trim() || undefined,
      sections: [
        {
          id: `sec-${Date.now()}`,
          title: createForm.category,
          questions: createForm.questions,
        },
      ],
      isDefault: false,
    });
    setIsCreateOpen(false);
    setCreateForm(EMPTY_FORM);
  };

  const handleUpdate = async () => {
    if (!editTarget || !editForm.name.trim() || !editForm.category) return;
    await updateMutation.mutateAsync({
      id: editTarget.id,
      name: editForm.name.trim(),
      category: editForm.category,
      description: editForm.description.trim() || undefined,
      sections: [
        {
          id: `sec-${Date.now()}`,
          title: editForm.category,
          questions: editForm.questions,
        },
      ],
    });
    setEditTarget(null);
  };

  return (
    <div className="space-y-6 pb-12 font-sans p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/admin/enquiries">
              <Button variant="ghost" size="sm" className="text-slate-600">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <Text as="h1" size="2xl" weight="bold" className="flex items-center gap-2">
              <Layers className="size-6 text-emerald-800" />
              Assessment Templates
            </Text>
          </div>
          <Text size="md" variant="muted" className="mt-1 ml-10">
            Create and maintain custom Pre-Admission clinical questionnaire templates for different
            care tiers.
          </Text>
        </div>

        <Button
          onClick={() => {
            setCreateForm(EMPTY_FORM);
            setIsCreateOpen(true);
          }}
          variant="primary"
          className="gap-1.5"
        >
          <Plus className="size-4" /> Create Assessment Template
        </Button>
      </div>

      {/* ── Preset Built-in Templates ───────────────────────────────────── */}
      <div className="space-y-3">
        <Text as="h2" size="md" weight="bold" className="flex items-center gap-2">
          <Sparkles className="size-4 text-emerald-700" />
          Standard Built-in Clinical Templates
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PRESET_ASSESSMENT_TEMPLATES.map((tmpl: PresetTemplate) => (
            <PresetTemplateCard key={tmpl.id} template={tmpl} />
          ))}
        </div>
      </div>

      {/* ── Custom Supported Living Templates ───────────────────────────── */}
      <div className="space-y-3 pt-4">
        <Text as="h2" size="md" weight="bold" className="flex items-center gap-2">
          <FileText className="size-4 text-slate-700" />
          Custom Supported Living Templates
        </Text>

        {isLoading ? (
          <Card variant="secondary" className="p-8 text-center animate-pulse gap-3">
            <Text size="md" variant="muted">Loading custom templates...</Text>
          </Card>
        ) : dbTemplates.length === 0 ? (
          <Card variant="secondary" className="p-8 text-center">
            <Text size="md" weight="semibold" className="text-slate-700">No custom templates created yet</Text>
            <Text size="md" variant="muted" className="mt-1">
              Click &quot;Create Assessment Template&quot; to build tailored question sets for your
              care categories.
            </Text>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dbTemplates.map((t: AssessmentTemplateResponseDTO) => (
              <CustomTemplateCard
                key={t.id}
                template={t}
                onEdit={openEdit}
                onDelete={(id) => deleteMutation.mutate(id)}
                isDeleting={deleteMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Create Template Dialog ─────────────────────────────────────── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent size="2xl" className="flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold">
              <Plus className="size-5 text-emerald-800" />
              Create Needs Assessment Template
            </DialogTitle>
            <DialogDescription>
              Build a custom clinical questionnaire template for a specific care category.
            </DialogDescription>
          </DialogHeader>

          <TemplateForm state={createForm} onChange={setCreateForm} />

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleCreate}
              disabled={createMutation.isPending || !createForm.name.trim() || !createForm.category}
            >
              {createMutation.isPending ? "Creating..." : "Save Template"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Template Dialog ───────────────────────────────────────── */}
      <Dialog open={Boolean(editTarget)} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent size="2xl" className="flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold">
              Edit Needs Assessment Template
            </DialogTitle>
            <DialogDescription>
              Modify template questions, answer options, and description.
            </DialogDescription>
          </DialogHeader>

          <TemplateForm state={editForm} onChange={setEditForm} />

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleUpdate}
              disabled={updateMutation.isPending || !editForm.name.trim() || !editForm.category}
            >
              {updateMutation.isPending ? "Saving..." : "Update Template"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

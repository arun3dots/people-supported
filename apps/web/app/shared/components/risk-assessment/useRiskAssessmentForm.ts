"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  calculateRiskScore,
  riskLevelFromScore,
  type RiskCategory,
} from "@repo/schema";
import {
  useGetRiskTemplatesQuery,
  useCreateRiskAssessmentMutation,
  useUpdateRiskAssessmentMutation,
  type RiskAssessmentResponse,
} from "../../../../lib/queries/risk";
import { riskKeys } from "../../../../lib/queries/risk/keys";
import { getRiskLevelStyle } from "./risk-utils";
import {
  blankState,
  parseAssessmentToFormState,
  validateRiskForm,
  buildRiskAssessmentDTO,
  type FormState,
  type FormValidationErrors,
} from "./risk-dialog.types";

interface UseRiskAssessmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  residentId: string;
  initialTitle?: string;
  initialTemplateName?: string;
  initialCategory?: RiskCategory | "";
  initialTool?: string;
  editingAssessment?: RiskAssessmentResponse | null;
}

export function useRiskAssessmentForm({
  open,
  onOpenChange,
  residentId,
  initialTitle,
  initialTemplateName,
  initialCategory,
  initialTool,
  editingAssessment,
}: UseRiskAssessmentFormProps) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<FormState>(blankState);
  const [savedAssessmentId, setSavedAssessmentId] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormValidationErrors>({});

  const { data: templates } = useGetRiskTemplatesQuery();
  const create = useCreateRiskAssessmentMutation();
  const update = useUpdateRiskAssessmentMutation();

  const templateDisplay =
    initialTemplateName ||
    initialTitle ||
    editingAssessment?.template?.name ||
    "General Risk";

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (editingAssessment) {
      setState(parseAssessmentToFormState(editingAssessment));
      setSavedAssessmentId(editingAssessment.id);
    } else {
      const match = (initialTemplateName || initialTitle)
        ? templates?.find(
            (t) =>
              (initialTemplateName &&
                t.name.toLowerCase() === initialTemplateName.toLowerCase()) ||
              t.name.toLowerCase() === initialTitle?.toLowerCase() ||
              (initialTemplateName &&
                t.name.toLowerCase().includes(initialTemplateName.toLowerCase())) ||
              (initialTitle &&
                t.name.toLowerCase().includes(initialTitle.toLowerCase()))
          )
        : null;

      const derivedCategory: RiskCategory =
        (match?.category as RiskCategory) ||
        (initialCategory as RiskCategory) ||
        (initialTitle?.includes("Behaviour") ? "Behavioral" : "Clinical");

      setState({
        ...blankState,
        templateId: match ? match.id : null,
        title: initialTitle || (match ? match.name : ""),
        category: derivedCategory,
        tool: match?.tool || initialTool || "",
        hazardDescription: initialTitle
          ? `Clinical and safety assessment for ${initialTitle.toLowerCase()}.`
          : "",
      });
      setSavedAssessmentId(null);
    }
  }, [
    open,
    initialTitle,
    initialTemplateName,
    initialCategory,
    initialTool,
    editingAssessment,
    templates,
  ]);

  const hasInherentRiskSelected = state.likelihood > 0 && state.severity > 0;
  const score = hasInherentRiskSelected
    ? calculateRiskScore(state.likelihood, state.severity)
    : 0;
  const level = hasInherentRiskSelected ? riskLevelFromScore(score) : null;
  const levelStyle = level ? getRiskLevelStyle(level) : null;

  const handleSave = () => {
    const errs = validateRiskForm(state);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const dto = buildRiskAssessmentDTO(residentId, state, "Active");

    const onFinish = () => {
      queryClient.invalidateQueries({ queryKey: riskKeys.all });
      onOpenChange(false);
    };

    const activeId = savedAssessmentId || editingAssessment?.id;
    if (activeId) {
      update.mutate(
        {
          id: activeId,
          dto: {
            category: dto.category,
            title: dto.title,
            hazardDescription: dto.hazardDescription,
            tool: dto.tool,
            likelihood: dto.likelihood,
            severity: dto.severity,
            status: "Active",
            reviewFrequency: dto.reviewFrequency,
            factors: dto.factors,
          },
        },
        { onSuccess: onFinish }
      );
    } else {
      create.mutate(dto, { onSuccess: onFinish });
    }
  };

  return {
    state,
    setState,
    errors,
    setErrors,
    templateDisplay,
    hasInherentRiskSelected,
    score,
    level,
    levelStyle,
    handleSave,
    isPending: create.isPending || update.isPending,
  };
}


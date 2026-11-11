"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  getPreAdmissionSubmitIssues,
  validateStepOnSave,
  MandatoryPreAdmissionPartASchema,
  normalizePreAdmissionTypeOfCare,
  type PreAdmissionManagerDecisionDTO,
  type PreAdmissionPartDataMap,
  type PreAdmissionPartKey,
  type PreAdmissionRecordDTO,
  type UpdatePreAdmissionMetaDTO,
} from "@repo/schema";
import { toast } from "@repo/ui/components/ui";
import { emptyParts, hydrateParts, type PartsState } from "./partsState";
import {
  useGetAssessmentQuery,
  useListNeedCarePlansQuery,
} from "../../../../../lib/queries/care-journey";
import {
  useCreatePreAdmissionMutation,
  useDecidePreAdmissionMutation,
  useGetPreAdmissionQuery,
  useSavePreAdmissionPartMutation,
  useSubmitPreAdmissionMutation,
  useUpdatePreAdmissionMetaMutation,
} from "../../../../../lib/queries/pre-admission";
import { useAdmitConfirmMutation } from "../../../../../lib/queries/residents";
import {
  useGetEnquiryQuery,
  useUpdateEnquiryMutation,
} from "../../../../../lib/queries/enquiries";
import { useGetRiskAssessmentsQuery } from "../../../../../lib/queries/risk";
import type { AdmissionStep } from "../types";
import { mapEnquiryToFormData } from "../utils/mapEnquiryToFormData";
import { STEP_PART } from "./steps";

export type { PartsState } from "./partsState";

export interface FinalizedAdmission {
  residentId: string;
  residentName: string;
  roomNumber: string;
  admissionDate: string;
}

export function usePreAdmissionWizard() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const residentIdParam = searchParams.get("id");
  const stepParam = Number(searchParams.get("step"));
  const enquiryId = searchParams.get("enquiryId");

  const [residentId, setResidentId] = useState<string | null>(residentIdParam);
  const [step, setStep] = useState<AdmissionStep>(
    stepParam >= 1 && stepParam <= 11 ? (stepParam as AdmissionStep) : 1,
  );
  const [parts, setParts] = useState<PartsState>(emptyParts);
  const [meta, setMeta] = useState<UpdatePreAdmissionMetaDTO>({});
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [finalized, setFinalized] = useState<FinalizedAdmission | null>(null);
  const hydratedFor = useRef<string | null>(null);
  const prefilled = useRef(false);
  const assessmentFlushRef = useRef<(() => Promise<void>) | null>(null);

  const recordQuery = useGetPreAdmissionQuery(residentId ?? "");
  const record = recordQuery.data ?? null;
  const enquiryQuery = useGetEnquiryQuery(enquiryId ?? "");
  const updateEnquiry = useUpdateEnquiryMutation(enquiryId ?? "", { silent: true });
  const riskAssessmentsQuery = useGetRiskAssessmentsQuery(
    { residentId: residentId ?? "" },
    { enabled: !!residentId },
  );
  const assessmentQuery = useGetAssessmentQuery(residentId ?? "");
  const plansQuery = useListNeedCarePlansQuery(residentId ?? "");

  const createMutation = useCreatePreAdmissionMutation();
  const saveMutation = useSavePreAdmissionPartMutation();
  const metaMutation = useUpdatePreAdmissionMetaMutation();
  const submitMutation = useSubmitPreAdmissionMutation();
  const decideMutation = useDecidePreAdmissionMutation();
  const confirmMutation = useAdmitConfirmMutation();

  useEffect(() => {
    if (!record || hydratedFor.current === record.id) return;
    hydratedFor.current = record.id;
    setParts((prev) => hydrateParts(record, prev));
    setMeta({
      assessedAt: record.assessedAt,
      assessedLocation: record.assessedLocation,
      assessedByName: record.assessedByName,
    });
  }, [record]);

  // Pre-fill a brand new pre-admission from the enquiry it was started from.
  useEffect(() => {
    const enquiry = enquiryQuery.data;
    if (residentId || prefilled.current || !enquiry) return;
    prefilled.current = true;
    const e = mapEnquiryToFormData(enquiry);
    setParts((prev) => ({
      ...prev,
      partA: {
        ...prev.partA,
        firstName: e.firstName,
        middleName: e.middleName,
        lastName: e.lastName,
        preferredName: e.preferredName,
        dob: e.dob,
        gender: e.gender,
        typeOfCare: normalizePreAdmissionTypeOfCare(enquiry.careCategory),
        religion: e.religion,
        admittedFrom: e.admittedFrom,
        referringFacilityName: e.referringFacilityName,
      },
      partB: e.primaryContact?.name
        ? {
            ...prev.partB,
            nextOfKin: [
              {
                name: e.primaryContact.name,
                relationship: e.primaryContact.relationship,
                phone: e.primaryContact.phone,
                email: e.primaryContact.emailAddress,
              },
            ],
          }
        : prev.partB,
      partC: e.primaryDiagnosis
        ? {
            ...prev.partC,
            primaryDiagnosis: e.primaryDiagnosis,
            diagnoses: [e.primaryDiagnosis],
          }
        : prev.partC,
    }));
  }, [residentId, enquiryQuery.data]);

  const goToStep = useCallback(
    (next: AdmissionStep, id: string | null = residentId) => {
      setStepErrors({});
      if (step === 6 && next !== 6) {
        void assessmentFlushRef.current?.();
      }
      setStep(next);
      const params = new URLSearchParams();
      if (id) params.set("id", id);
      params.set("step", String(next));
      if (enquiryId) params.set("enquiryId", enquiryId);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [step, residentId, enquiryId, pathname, router],
  );

  const setPart = useCallback(
    <K extends PreAdmissionPartKey>(key: K, patch: Partial<PreAdmissionPartDataMap[K]>) =>
      setParts((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } })),
    [],
  );

  const hasAssessmentNeeds = useMemo(() => {
    const recordedNeeds = (assessmentQuery.data?.needs ?? []).some(
      (n) => Boolean(n.found?.trim() || n.supportLevel),
    );
    return recordedNeeds || (plansQuery.data?.length ?? 0) > 0;
  }, [assessmentQuery.data?.needs, plansQuery.data?.length]);

  const completedSteps = useMemo(() => {
    const done = new Set<number>();
    Object.entries(STEP_PART).forEach(([num, part]) => {
      if (part === "partD") {
        if (
          record?.partD?.adlChecklist &&
          Object.values(record.partD.adlChecklist).some(
            (activity) =>
              activity?.assistanceLevel != null ||
              Boolean(activity?.comments?.trim()),
          )
        ) {
          done.add(Number(num));
        }
      } else if (part && record?.[part]) {
        done.add(Number(num));
      }
    });
    if ((riskAssessmentsQuery.data?.length ?? 0) > 0) done.add(5);
    if (hasAssessmentNeeds) done.add(6);
    if (record && record.status !== "Draft") done.add(10);
    return done;
  }, [record, riskAssessmentsQuery.data, hasAssessmentNeeds]);

  const metaChanged = (): boolean =>
    !!record &&
    (meta.assessedAt !== record.assessedAt ||
      meta.assessedLocation !== record.assessedLocation ||
      meta.assessedByName !== record.assessedByName);

  /** Validates mandatory fields for the current step and saves, then moves on. */
  const saveAndContinue = async (): Promise<boolean> => {
    const part = STEP_PART[step];
    const partData = part ? parts[part] : null;

    const validation = validateStepOnSave(step, partData, {
      riskAssessmentsCount: riskAssessmentsQuery.data?.length ?? 0,
      hasAssessmentNeeds,
    });

    if (!validation.success) {
      const errorMap: Record<string, string> = {};
      validation.issues.forEach((issue) => {
        if (!errorMap[issue.field]) {
          errorMap[issue.field] = issue.message;
        }
      });
      setStepErrors(errorMap);

      if (step !== 10) {
        toast({
          title: "Mandatory fields required",
          description:
            validation.firstError ||
            "Please complete all required fields before continuing.",
          variant: "destructive",
        });
      }
      return false;
    }

    setStepErrors({});

    if (step === 5) {
      goToStep(6);
      return true;
    }
    if (step === 6) {
      await assessmentFlushRef.current?.().catch(() => undefined);
      goToStep(7);
      return true;
    }
    if (!part) return false;

    try {
      if (!residentId) {
        const created = await createMutation.mutateAsync({
          assessedAt: meta.assessedAt ?? undefined,
          assessedLocation: meta.assessedLocation ?? undefined,
          partA: MandatoryPreAdmissionPartASchema.parse(parts.partA),
        });
        setResidentId(created.residentId);
        goToStep(2, created.residentId);
        return true;
      }
      if (step === 1 && metaChanged()) {
        await metaMutation.mutateAsync({ residentId, data: meta });
      }
      await saveMutation.mutateAsync({ residentId, part, data: parts[part] });
      goToStep((step + 1) as AdmissionStep);
      return true;
    } catch {
      // errors are surfaced by the mutations
      return false;
    }
  };

  const submit = async (): Promise<void> => {
    if (!residentId) return;
    try {
      await submitMutation.mutateAsync(residentId);
      toast({ title: "Submitted", description: "Waiting for the manager's decision." });
    } catch (error) {
      toast({
        title: "Cannot submit yet",
        description: error instanceof Error ? error.message : "Pre-admission is incomplete",
        variant: "destructive",
      });
    }
  };

  const decide = async (data: PreAdmissionManagerDecisionDTO): Promise<void> => {
    if (!residentId) return;
    await decideMutation.mutateAsync({ residentId, data }).catch(() => undefined);
  };

  /** Completes the admission once the pre-admission has been accepted. */
  const admit = async (notes?: string): Promise<void> => {
    if (!residentId || !record) return;
    try {
      await confirmMutation.mutateAsync({
        id: residentId,
        data: { bedId: parts.roomAllocation.bedId ?? "", notes: notes ?? "" },
      });
      const a = parts.partA;
      setFinalized({
        residentId,
        residentName: [a.firstName, a.lastName].filter(Boolean).join(" "),
        roomNumber: parts.roomAllocation.roomNumber ?? "",
        admissionDate: a.expectedAdmissionDate ?? new Date().toISOString().slice(0, 10),
      });
      if (enquiryId) {
        await updateEnquiry
          .mutateAsync({
            status: "Admitted",
            convertedResidentId: residentId,
            admittedAt: new Date().toISOString(),
          })
          .catch(() => undefined);
      }
    } catch {
      // error toast comes from the confirm mutation
    }
  };

  const issues = useMemo(
    () => getPreAdmissionSubmitIssues(parts, { hasAssessmentNeeds }),
    [parts, hasAssessmentNeeds],
  );

  return {
    step,
    goToStep,
    parts,
    setPart,
    meta,
    setMeta: (patch: UpdatePreAdmissionMetaDTO) => setMeta((m) => ({ ...m, ...patch })),
    record,
    residentId,
    assessmentFlushRef,
    isLoading: !!residentId && recordQuery.isLoading,
    completedSteps,
    issues,
    stepErrors,
    isSaving:
      createMutation.isPending || saveMutation.isPending || metaMutation.isPending,
    isSubmitting: submitMutation.isPending,
    isDeciding: decideMutation.isPending,
    isAdmitting: confirmMutation.isPending,
    finalized,
    enquiryData: enquiryQuery.data ?? null,
    enquiryId,
    saveAndContinue,
    submit,
    decide,
    admit,
  };
}

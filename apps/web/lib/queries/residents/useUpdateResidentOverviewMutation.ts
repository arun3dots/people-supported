"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import {
  UPDATE_RESIDENT_PERSONAL_INFO,
  UPDATE_RESIDENT_CARE_PROFILE,
  UPDATE_RESIDENT_FUNDING,
} from "@repo/endpoints";
import { residentKeys } from "./keys";
import { toast } from "@repo/ui/components/ui";

// ── Payload shapes (subset of the admit step schemas) ──────────────────────

export interface UpdateResidentPersonalPayload {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  addressLine1?: string;
  city?: string;
  country?: string;
  preferredLanguage?: string;
  religion?: string;
  nhsNumber?: string;
  // phone is stored on profile — included as a passthrough field the backend accepts
  communityNursePhone?: string;
}

export interface UpdateResidentNokPayload {
  nextOfKin?: Array<{
    firstName?: string;
    middleName?: string;
    lastName?: string;
    name?: string;
    relation?: string;
    phone?: string;
    email?: string;
  }>;
}

export interface UpdateResidentGpPayload {
  gpDetails?: {
    name?: string;
    practice?: string;
    phone?: string;
  };
  generalPractitioner?: {
    name?: string;
    clinic?: string;
    phone?: string;
  };
  otherProviders?: Array<{
    type: string;
    name: string;
    clinic?: string;
    phone?: string;
  }>;
}

export interface UpdateResidentFundingPayload {
  fundingType?: string;
  localAuthority?: string;
  payer?: string;
  secondaryCoverage?: string | null;
  insurancePolicyNumber?: string | null;
  benefitId?: string | null;
  billingResponsibleParty?: {
    name?: string;
    relationship?: string;
    phone?: string;
    address?: string;
  };
  agreedRoomRate?: number;
  agreedRoomRatePeriod?: string;
  depositAmount?: number;
  depositDate?: string | null;
  paymentSchedule?: string;
  directDebitDetails?: string | null;
  generalPractitioner?: {
    name?: string;
    clinic?: string;
    phone?: string;
  };
  otherProviders?: Array<{
    type: string;
    name: string;
    clinic?: string;
    phone?: string;
  }>;
}

export interface UpdateResidentAboutPayload {
  /** Maps to careProfile.specialRequirements on the backend */
  specialRequirements?: string;
}

// ── Hook ───────────────────────────────────────────────────────────────────

/**
 * Composite mutation hook for the resident Overview tab edit modals.
 * Persists edits to the resident's ongoing profile sections.
 *
 * - personal / nok / gp  → PATCH /residents/:id/personal-info
 * - funding              → PATCH /residents/:id/funding
 * - about (bio)          → PATCH /residents/:id/care-profile
 */
export function useUpdateResidentOverviewMutation() {
  const queryClient = useQueryClient();

  const invalidate = (residentId: string) => {
    queryClient.invalidateQueries({ queryKey: residentKeys.detail(residentId) });
  };

  const handleError = (error: unknown) => {
    const message =
      error instanceof Error ? error.message : "Failed to save changes.";
    toast({ title: "Error", description: message, variant: "destructive" });
  };

  const handleSuccess = (residentId: string) => {
    toast({ title: "Saved", description: "Changes saved successfully." });
    invalidate(residentId);
  };

  // personal / nok / GP profile fields
  const updateStep1 = useMutation({
    mutationFn: ({
      residentId,
      data,
    }: {
      residentId: string;
      data: UpdateResidentPersonalPayload &
        UpdateResidentNokPayload &
        UpdateResidentGpPayload;
    }) =>
      makeAPICall<{ id: string }>(
        UPDATE_RESIDENT_PERSONAL_INFO,
        data as Record<string, unknown>,
        {},
        { id: residentId },
      ),
    onSuccess: (_, { residentId }) => handleSuccess(residentId),
    onError: handleError,
  });

  // funding → step-2
  const updateStep2 = useMutation({
    mutationFn: ({
      residentId,
      data,
    }: {
      residentId: string;
      data: UpdateResidentFundingPayload;
    }) =>
      makeAPICall<{ id: string }>(
        UPDATE_RESIDENT_FUNDING,
        data as Record<string, unknown>,
        {},
        { id: residentId },
      ),
    onSuccess: (_, { residentId }) => handleSuccess(residentId),
    onError: handleError,
  });

  // Ongoing resident care profile fields
  const updateStep3 = useMutation({
    mutationFn: ({
      residentId,
      data,
    }: {
      residentId: string;
      data: UpdateResidentAboutPayload;
    }) =>
      makeAPICall<{ id: string }>(
        UPDATE_RESIDENT_CARE_PROFILE,
        data as Record<string, unknown>,
        {},
        { id: residentId },
      ),
    onSuccess: (_, { residentId }) => handleSuccess(residentId),
    onError: handleError,
  });

  return { updateStep1, updateStep2, updateStep3 };
}

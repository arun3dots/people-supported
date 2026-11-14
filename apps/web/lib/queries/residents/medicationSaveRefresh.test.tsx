import React from "react";
import { afterEach, describe, expect, it, vi, type Mock } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  ADMINISTER_MEDICATION,
  CREATE_MEDICATION_ROUND_BULK,
  GET_MEDICATION_PRESCRIPTIONS,
  GET_RESIDENT_ONBOARDING_MEDICINES,
  SAVE_PRE_ADMISSION_PART,
} from "@repo/endpoints";
import { makeAPICall } from "../../api";
import { useCreateMedicationRoundBulkMutation } from "./useMedicationRoundMutations";
import { useGetMedicationPrescriptionsQuery } from "./useGetMedicationPrescriptionsQuery";
import { useGetResidentOnboardingMedicinesQuery } from "./useGetResidentOnboardingMedicinesQuery";
import { useSavePreAdmissionPartMutation } from "../pre-admission/usePreAdmissionMutations";
import { useAdministerMedicationMutation } from "./useAdministerMedicationMutation";

vi.mock("../../api", () => ({ makeAPICall: vi.fn() }));
vi.mock("@repo/ui/components/ui", () => ({ toast: vi.fn() }));
const api = makeAPICall as Mock<(key: string) => Promise<unknown>>;
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function testClient() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    client,
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  };
}

describe("saved medication data refreshes the MAR", () => {
  it("waits for the prescription refetch and shows the newly saved record", async () => {
    const { client, wrapper } = testClient();
    let saved = false;
    let releaseRead: (() => void) | undefined;
    let readGate: Promise<void> | undefined;
    api.mockImplementation(async (key) => {
      if (key === CREATE_MEDICATION_ROUND_BULK) {
        saved = true;
        return { prescription: { id: "saved-rx" }, count: 1 };
      }
      if (key === GET_MEDICATION_PRESCRIPTIONS) {
        await readGate;
        return saved
          ? [{ id: "saved-rx", drugName: "Newly saved medicine" }]
          : [];
      }
      throw new Error(`Unexpected endpoint: ${key}`);
    });
    const { result } = renderHook(
      () => ({
        read: useGetMedicationPrescriptionsQuery("person"),
        save: useCreateMedicationRoundBulkMutation(),
      }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.read.isSuccess).toBe(true));
    readGate = new Promise<void>((resolve) => {
      releaseRead = resolve;
    });
    let pendingSave: Promise<unknown> | undefined;
    act(() => {
      pendingSave = result.current.save.mutateAsync({
        residentId: "person",
        data: {
          drugName: "Newly saved medicine",
          dose: "5 mg",
          form: "Tablet",
          startDate: "2026-11-13",
          endDate: "2026-11-14",
          times: ["10:00"],
        },
      });
    });
    await waitFor(() => expect(saved).toBe(true));
    expect(result.current.save.isPending).toBe(true);
    await act(async () => {
      releaseRead?.();
      await pendingSave;
    });
    await waitFor(() =>
      expect(result.current.read.data?.[0]?.drugName).toBe(
        "Newly saved medicine",
      ),
    );
    client.clear();
  });

  it("updates onboarding medicines in the MAR cache when Part C is saved", async () => {
    const { client, wrapper } = testClient();
    const medicines = [
      { name: "Saved during onboarding", dose: "10 mg", prn: false },
    ];
    let saved = false;
    api.mockImplementation(async (key) => {
      if (key === GET_RESIDENT_ONBOARDING_MEDICINES)
        return saved ? medicines : [];
      if (key === SAVE_PRE_ADMISSION_PART) {
        saved = true;
        return { residentId: "person", partC: { medicines } };
      }
      throw new Error(`Unexpected endpoint: ${key}`);
    });
    const { result } = renderHook(
      () => ({
        read: useGetResidentOnboardingMedicinesQuery("person"),
        save: useSavePreAdmissionPartMutation(),
      }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.read.isSuccess).toBe(true));
    expect(result.current.read.data).toEqual([]);
    await act(async () => {
      await result.current.save.mutateAsync({
        residentId: "person",
        part: "partC",
        data: { medicines },
      });
    });
    await waitFor(() =>
      expect(result.current.read.data?.[0]?.name).toBe(
        "Saved during onboarding",
      ),
    );
    client.clear();
  });

  it("saves the not-available outcome using the backend's Omitted status", async () => {
    const { client, wrapper } = testClient();
    api.mockResolvedValue({ id: "recorded-administration", status: "Omitted" });
    const { result } = renderHook(() => useAdministerMedicationMutation(), {
      wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync({
        residentId: "person",
        roundId: "round",
        status: "Not Available",
        reason: "Medication unavailable",
      });
    });
    expect(makeAPICall).toHaveBeenCalledWith(ADMINISTER_MEDICATION, {
      residentId: "person",
      roundId: "round",
      status: "Omitted",
      reason: "Medication unavailable",
    });
    client.clear();
  });
});

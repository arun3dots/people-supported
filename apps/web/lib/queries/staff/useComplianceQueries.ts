import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import {
  GET_STAFF,
  GET_STAFF_MEMBER,
  GET_STAFF_COMPLIANCE,
  UPSERT_STAFF_RTW,
  GET_STAFF_RTW,
  UPSERT_STAFF_DBS,
  GET_STAFF_DBS,
  CREATE_STAFF_CERTIFICATION,
  UPDATE_STAFF_CERTIFICATION,
  GET_STAFF_CERTIFICATIONS,
  DELETE_STAFF_CERTIFICATION,
  UPSERT_STAFF_HEALTH,
  GET_STAFF_HEALTH,
  CREATE_STAFF_IMMUNISATION,
  UPDATE_STAFF_IMMUNISATION,
  GET_STAFF_IMMUNISATIONS,
  DELETE_STAFF_IMMUNISATION,
  UPLOAD_COMPLIANCE_DOCUMENT,
  GET_COMPLIANCE_SIGNED_URL,
} from "@repo/endpoints";

export async function getComplianceSignedUrl(staffId: string, path: string): Promise<string> {
  const res = await makeAPICall<{ url: string }>(
    GET_COMPLIANCE_SIGNED_URL,
    {},
    { path },
    { id: staffId }
  );
  return res.url;
}

type MutationPayload = Record<string, any>;


// ──────────────── Types ────────────────

export interface RtwRecord {
  id: string;
  userId: string;
  verificationType: string;
  documentType?: string;
  documentNumber?: string;
  issueDate?: string;
  shareCode?: string;
  idvtProvider?: string;
  transactionRef?: string;
  rtwStatus: string;
  verificationDate?: string;
  verifierName?: string;
  expiryDate?: string;
  followUpDate?: string;
  workRestrictions?: string;
  documentUrl?: string;
}

export interface DbsRecord {
  id: string;
  userId: string;
  certificateNumber?: string;
  type: string;
  issueDate?: string;
  expiryDate?: string;
  updateService: boolean;
  status: string;
  documentUrl?: string;
}

export interface CertificationRecord {
  id: string;
  userId: string;
  name: string;
  skills?: string[];
  issueDate: string;
  expiryDate: string;
  status: string;
  certificateUrl?: string;
}

export interface HealthRecord {
  id: string;
  userId: string;
  clearanceDate?: string;
  nextAssessmentDate?: string;
  assessedBy?: string;
  outcome?: string;
  restrictions?: string;
  status: string;
  notes?: string;
  documentUrl?: string;
}

export interface ImmunisationRecord {
  id: string;
  userId: string;
  name: string;
  dateAdministered: string;
  nextDueDate?: string;
  status: string;
  documentUrl?: string;
}

export interface FullComplianceData {
  rtw: RtwRecord | null;
  dbs: DbsRecord | null;
  certifications: CertificationRecord[];
  health: HealthRecord | null;
  immunisations: ImmunisationRecord[];
}

// ──────────────── Queries ────────────────

export function useGetStaffComplianceQuery(
  staffId: string,
  options?: Partial<UseQueryOptions<FullComplianceData>>,
) {
  return useQuery({
    queryKey: [GET_STAFF_COMPLIANCE, staffId],
    queryFn: () =>
      makeAPICall<FullComplianceData>(GET_STAFF_COMPLIANCE, {}, {}, { id: staffId }),
    ...options,
  });
}

export function useGetStaffRtwQuery(
  staffId: string,
  options?: Partial<UseQueryOptions<RtwRecord | null>>,
) {
  return useQuery({
    queryKey: [GET_STAFF_RTW, staffId],
    queryFn: () =>
      makeAPICall<RtwRecord | null>(GET_STAFF_RTW, {}, {}, { id: staffId }),
    ...options,
  });
}

export function useGetStaffDbsQuery(
  staffId: string,
  options?: Partial<UseQueryOptions<DbsRecord | null>>,
) {
  return useQuery({
    queryKey: [GET_STAFF_DBS, staffId],
    queryFn: () =>
      makeAPICall<DbsRecord | null>(GET_STAFF_DBS, {}, {}, { id: staffId }),
    ...options,
  });
}

export function useGetStaffCertificationsQuery(
  staffId: string,
  options?: Partial<UseQueryOptions<CertificationRecord[]>>,
) {
  return useQuery({
    queryKey: [GET_STAFF_CERTIFICATIONS, staffId],
    queryFn: () =>
      makeAPICall<CertificationRecord[]>(GET_STAFF_CERTIFICATIONS, {}, {}, { id: staffId }),
    ...options,
  });
}

export function useGetStaffHealthQuery(
  staffId: string,
  options?: Partial<UseQueryOptions<HealthRecord | null>>,
) {
  return useQuery({
    queryKey: [GET_STAFF_HEALTH, staffId],
    queryFn: () =>
      makeAPICall<HealthRecord | null>(GET_STAFF_HEALTH, {}, {}, { id: staffId }),
    ...options,
  });
}

export function useGetStaffImmunisationsQuery(
  staffId: string,
  options?: Partial<UseQueryOptions<ImmunisationRecord[]>>,
) {
  return useQuery({
    queryKey: [GET_STAFF_IMMUNISATIONS, staffId],
    queryFn: () =>
      makeAPICall<ImmunisationRecord[]>(GET_STAFF_IMMUNISATIONS, {}, {}, { id: staffId }),
    ...options,
  });
}

// ──────────────── Mutations ────────────────

export function useUpsertRtwMutation(
  staffId: string,
  options?: UseMutationOptions<RtwRecord, Error, MutationPayload>,
) {
  const qc = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (payload: MutationPayload) =>
      makeAPICall<RtwRecord>(UPSERT_STAFF_RTW, payload, {}, { id: staffId }),
    onSuccess: (data, variables, context) => {
      qc.invalidateQueries({ queryKey: [GET_STAFF_RTW, staffId] });
      qc.invalidateQueries({ queryKey: [GET_STAFF_COMPLIANCE, staffId] });
      qc.invalidateQueries({ queryKey: [GET_STAFF_MEMBER, staffId] });
      qc.invalidateQueries({ queryKey: [GET_STAFF] });
      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

export function useUpsertDbsMutation(
  staffId: string,
  options?: UseMutationOptions<DbsRecord, Error, MutationPayload>,
) {
  const qc = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (payload: MutationPayload) =>
      makeAPICall<DbsRecord>(UPSERT_STAFF_DBS, payload, {}, { id: staffId }),
    onSuccess: (data, variables, context) => {
      qc.invalidateQueries({ queryKey: [GET_STAFF_DBS, staffId] });
      qc.invalidateQueries({ queryKey: [GET_STAFF_COMPLIANCE, staffId] });
      qc.invalidateQueries({ queryKey: [GET_STAFF_MEMBER, staffId] });
      qc.invalidateQueries({ queryKey: [GET_STAFF] });
      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

export function useCreateCertificationMutation(
  staffId: string,
  options?: UseMutationOptions<CertificationRecord, Error, MutationPayload>,
) {
  const qc = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (payload: MutationPayload) =>
      makeAPICall<CertificationRecord>(CREATE_STAFF_CERTIFICATION, payload, {}, { id: staffId }),
    onSuccess: (data, variables, context) => {
      qc.invalidateQueries({ queryKey: [GET_STAFF_CERTIFICATIONS, staffId] });
      qc.invalidateQueries({ queryKey: [GET_STAFF_COMPLIANCE, staffId] });
      qc.invalidateQueries({ queryKey: [GET_STAFF_MEMBER, staffId] });
      qc.invalidateQueries({ queryKey: [GET_STAFF] });
      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

export function useUpdateCertificationMutation(
  staffId: string,
  options?: UseMutationOptions<CertificationRecord, Error, { certId: string; data: MutationPayload }>,
) {
  const qc = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: ({ certId, data }: { certId: string; data: MutationPayload }) =>
      makeAPICall<CertificationRecord>(UPDATE_STAFF_CERTIFICATION, data, {}, { id: staffId, certId }),
    onSuccess: (data, variables, context) => {
      qc.invalidateQueries({ queryKey: [GET_STAFF_CERTIFICATIONS, staffId] });
      qc.invalidateQueries({ queryKey: [GET_STAFF_COMPLIANCE, staffId] });
      qc.invalidateQueries({ queryKey: [GET_STAFF_MEMBER, staffId] });
      qc.invalidateQueries({ queryKey: [GET_STAFF] });
      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

export function useDeleteCertificationMutation(
  staffId: string,
  options?: UseMutationOptions<void, Error, string>,
) {
  const qc = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (certId: string) =>
      makeAPICall<void>(DELETE_STAFF_CERTIFICATION, {}, {}, { id: staffId, certId }),
    onSuccess: (data, variables, context) => {
      qc.invalidateQueries({ queryKey: [GET_STAFF_CERTIFICATIONS, staffId] });
      qc.invalidateQueries({ queryKey: [GET_STAFF_COMPLIANCE, staffId] });
      qc.invalidateQueries({ queryKey: [GET_STAFF_MEMBER, staffId] });
      qc.invalidateQueries({ queryKey: [GET_STAFF] });
      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

export function useUpsertHealthMutation(
  staffId: string,
  options?: UseMutationOptions<HealthRecord, Error, MutationPayload>,
) {
  const qc = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (payload: MutationPayload) =>
      makeAPICall<HealthRecord>(UPSERT_STAFF_HEALTH, payload, {}, { id: staffId }),
    onSuccess: (data, variables, context) => {
      qc.invalidateQueries({ queryKey: [GET_STAFF_HEALTH, staffId] });
      qc.invalidateQueries({ queryKey: [GET_STAFF_COMPLIANCE, staffId] });
      qc.invalidateQueries({ queryKey: [GET_STAFF_MEMBER, staffId] });
      qc.invalidateQueries({ queryKey: [GET_STAFF] });
      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

export function useCreateImmunisationMutation(
  staffId: string,
  options?: UseMutationOptions<ImmunisationRecord, Error, MutationPayload>,
) {
  const qc = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (payload: MutationPayload) =>
      makeAPICall<ImmunisationRecord>(CREATE_STAFF_IMMUNISATION, payload, {}, { id: staffId }),
    onSuccess: (data, variables, context) => {
      qc.invalidateQueries({ queryKey: [GET_STAFF_IMMUNISATIONS, staffId] });
      qc.invalidateQueries({ queryKey: [GET_STAFF_COMPLIANCE, staffId] });
      qc.invalidateQueries({ queryKey: [GET_STAFF_MEMBER, staffId] });
      qc.invalidateQueries({ queryKey: [GET_STAFF] });
      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

export function useUpdateImmunisationMutation(
  staffId: string,
  options?: UseMutationOptions<ImmunisationRecord, Error, { immId: string; data: MutationPayload }>,
) {
  const qc = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: ({ immId, data }: { immId: string; data: MutationPayload }) =>
      makeAPICall<ImmunisationRecord>(UPDATE_STAFF_IMMUNISATION, data, {}, { id: staffId, immId }),
    onSuccess: (data, variables, context) => {
      qc.invalidateQueries({ queryKey: [GET_STAFF_IMMUNISATIONS, staffId] });
      qc.invalidateQueries({ queryKey: [GET_STAFF_COMPLIANCE, staffId] });
      qc.invalidateQueries({ queryKey: [GET_STAFF_MEMBER, staffId] });
      qc.invalidateQueries({ queryKey: [GET_STAFF] });
      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

export function useDeleteImmunisationMutation(
  staffId: string,
  options?: UseMutationOptions<void, Error, string>,
) {
  const qc = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (immId: string) =>
      makeAPICall<void>(DELETE_STAFF_IMMUNISATION, {}, {}, { id: staffId, immId }),
    onSuccess: (data, variables, context) => {
      qc.invalidateQueries({ queryKey: [GET_STAFF_IMMUNISATIONS, staffId] });
      qc.invalidateQueries({ queryKey: [GET_STAFF_COMPLIANCE, staffId] });
      qc.invalidateQueries({ queryKey: [GET_STAFF_MEMBER, staffId] });
      qc.invalidateQueries({ queryKey: [GET_STAFF] });
      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

// ──────────────── Document Upload ────────────────

interface UploadDocPayload {
  file: File;
  domain: "rtw" | "dbs" | "certification" | "health";
  certId?: string;
}

interface UploadDocResult {
  documentUrl: string;
  publicUrl: string;
}

export function useUploadComplianceDocumentMutation(
  staffId: string,
  options?: UseMutationOptions<UploadDocResult, Error, UploadDocPayload>,
) {
  const qc = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: ({ file, domain, certId }: UploadDocPayload) => {
      const formData = new FormData();
      formData.append("file", file);

      const params: Record<string, string | number | boolean> = { domain };
      if (certId) {
        params.certId = certId;
      }

      return makeAPICall<UploadDocResult>(
        UPLOAD_COMPLIANCE_DOCUMENT,
        formData,
        params,
        { id: staffId }
      );
    },
    onSuccess: (data, variables, context) => {
      qc.invalidateQueries({ queryKey: [GET_STAFF_RTW, staffId] });
      qc.invalidateQueries({ queryKey: [GET_STAFF_DBS, staffId] });
      qc.invalidateQueries({ queryKey: [GET_STAFF_CERTIFICATIONS, staffId] });
      qc.invalidateQueries({ queryKey: [GET_STAFF_HEALTH, staffId] });
      qc.invalidateQueries({ queryKey: [GET_STAFF_COMPLIANCE, staffId] });
      qc.invalidateQueries({ queryKey: [GET_STAFF_MEMBER, staffId] });
      qc.invalidateQueries({ queryKey: [GET_STAFF] });
      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

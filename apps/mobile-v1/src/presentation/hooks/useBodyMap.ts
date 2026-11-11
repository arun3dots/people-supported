import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GET_BODY_MAP_ASSESSMENTS,
  CREATE_BODY_MAP_ASSESSMENT,
  RESOLVE_BODY_MAP_FINDING,
  UPLOAD_BODY_MAP_PHOTO,
} from '@repo/endpoints';
import type {
  CreateBodyMapAssessmentDTO,
  ResolveBodyMapFindingDTO,
} from '@repo/schema';
import { makeMobileApiCall } from '../../data/api/client';
import { safeLogger } from '../../data/security/safeLogger';
import { appendFileToFormData, type PickedMobileFile } from '../../lib/fileUpload';

export interface BodyMapPhotoItem {
  id: string;
  gcsPath: string;
  fileType: string;
  fileSize: number;
}

export interface BodyMapFindingItem {
  id: string;
  assessmentId?: string;
  trackingId: string;
  view: 'Front' | 'Back';
  bodyMapVariant: 'male' | 'female' | 'neutral';
  anatomyId: string;
  anatomicalRegion?: string;
  bodyPart?: string;
  subPart?: string;
  detail?: string;
  laterality?: string;
  locationLabel: string;
  exactX: number | null;
  exactY: number | null;
  findingType: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
  description?: string | null;
  onsetDate: string;
  status: 'Open' | 'Resolved';
  resolutionNote?: string | null;
  resolvedAt?: string | null;
  resolvedById?: string | null;
  createdAt?: string;
  photos?: BodyMapPhotoItem[];
}

export interface BodyMapAssessmentItem {
  id: string;
  assessedAt: string;
  notes?: string | null;
  createdById: string;
  findings: BodyMapFindingItem[];
}

export function useBodyMap(residentId?: string) {
  const queryClient = useQueryClient();

  const assessmentsQuery = useQuery<BodyMapAssessmentItem[]>({
    queryKey: ['body-map-assessments', residentId],
    queryFn: async () => {
      if (!residentId) return [];
      try {
        const response = await makeMobileApiCall<BodyMapAssessmentItem[]>(
          GET_BODY_MAP_ASSESSMENTS,
          undefined,
          undefined,
          { residentId }
        );
        return Array.isArray(response) ? response : [];
      } catch (err) {
        safeLogger.error('Failed to fetch body map assessments', err);
        return [];
      }
    },
    enabled: Boolean(residentId),
  });

  const createAssessmentMutation = useMutation({
    mutationFn: async (payload: CreateBodyMapAssessmentDTO) => {
      if (!residentId) throw new Error('Resident ID is required');
      return makeMobileApiCall<{
        id?: string;
        findings?: Array<{ id: string }>;
        data?: { findings?: Array<{ id: string }> };
      }>(
        CREATE_BODY_MAP_ASSESSMENT,
        payload,
        {},
        { residentId }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['body-map-assessments', residentId],
      });
    },
  });

  const resolveFindingMutation = useMutation({
    mutationFn: async ({
      findingId,
      dto,
    }: {
      findingId: string;
      dto: ResolveBodyMapFindingDTO;
    }) => {
      return makeMobileApiCall(
        RESOLVE_BODY_MAP_FINDING,
        dto,
        {},
        { id: findingId }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['body-map-assessments', residentId],
      });
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async ({
      findingId,
      formData,
    }: {
      findingId: string;
      formData: FormData;
    }) => {
      return makeMobileApiCall(
        UPLOAD_BODY_MAP_PHOTO,
        formData,
        {},
        { id: findingId }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['body-map-assessments', residentId],
      });
    },
  });

  const uploadFindingPhoto = async (findingId: string, file: PickedMobileFile) => {
    const formData = new FormData();
    await appendFileToFormData(formData, 'file', file);
    const uploaded = await uploadPhotoMutation.mutateAsync({ findingId, formData });
    await assessmentsQuery.refetch();
    return uploaded;
  };

  const assessments: BodyMapAssessmentItem[] = assessmentsQuery.data ?? [];
  const allFindings: BodyMapFindingItem[] = assessments.flatMap((a) => a.findings || []);
  const openFindings: BodyMapFindingItem[] = allFindings.filter((f) => f.status === 'Open');
  const resolvedFindings: BodyMapFindingItem[] = allFindings.filter((f) => f.status === 'Resolved');

  return {
    assessments,
    allFindings,
    openFindings,
    resolvedFindings,
    isLoading: assessmentsQuery.isLoading,
    isRefetching: assessmentsQuery.isRefetching,
    refetch: assessmentsQuery.refetch,
    createAssessment: createAssessmentMutation.mutateAsync,
    isCreating: createAssessmentMutation.isPending,
    resolveFinding: resolveFindingMutation.mutateAsync,
    isResolving: resolveFindingMutation.isPending,
    uploadPhoto: uploadPhotoMutation.mutateAsync,
    uploadFindingPhoto,
    isUploadingPhoto: uploadPhotoMutation.isPending,
  };
}

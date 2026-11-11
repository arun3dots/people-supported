import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import {
  GET_RESIDENT_DOCUMENTS,
  GET_DOCUMENT_UPLOAD_URL,
  UPLOAD_RESIDENT_DOCUMENT,
  SAVE_RESIDENT_DOCUMENT,
  DELETE_RESIDENT_DOCUMENT,
  VERIFY_RESIDENT_DOCUMENT,
  ARCHIVE_RESIDENT_DOCUMENT,
} from "@repo/endpoints";
import { residentKeys } from "./keys";
import { toast } from "@repo/ui/components/ui";

export function useGetResidentDocumentsQuery(residentId: string) {
  return useQuery({
    queryKey: [...residentKeys.detail(residentId), "documents"],
    queryFn: () =>
      makeAPICall<any[]>(GET_RESIDENT_DOCUMENTS, {}, {}, { id: residentId }),
    enabled: !!residentId,
  });
}

export function useGetUploadUrlMutation() {
  return useMutation({
    mutationFn: ({
      residentId,
      fileName,
      contentType,
    }: {
      residentId: string;
      fileName: string;
      contentType: string;
    }) =>
      makeAPICall<{ url: string; fileUrl: string; gcsFileName: string }>(
        GET_DOCUMENT_UPLOAD_URL,
        {},
        { fileName, contentType },
        { id: residentId },
      ),
  });
}

export function useUploadDocumentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      residentId,
      file,
      category,
    }: {
      residentId: string;
      file: File;
      category: string;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);

      return makeAPICall(
        UPLOAD_RESIDENT_DOCUMENT,
        formData as any, // makeAPICall will handle FormData if configured, or we might need to adjust it
        {},
        { id: residentId },
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...residentKeys.detail(variables.residentId), "documents"],
      });
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    },
  });
}

export function useSaveDocumentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ residentId, data }: { residentId: string; data: any }) =>
      makeAPICall(SAVE_RESIDENT_DOCUMENT, data as any, {}, { id: residentId }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...residentKeys.detail(variables.residentId), "documents"],
      });
      toast({
        title: "Success",
        description: "Document saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save document",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteDocumentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      documentId,
      residentId,
    }: {
      documentId: string;
      residentId: string;
    }) => makeAPICall(DELETE_RESIDENT_DOCUMENT, {}, {}, { id: documentId }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...residentKeys.detail(variables.residentId), "documents"],
      });
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete document",
        variant: "destructive",
      });
    },
  });
}

export function useVerifyDocumentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      documentId,
      status = "Verified",
      notes,
    }: {
      documentId: string;
      residentId: string;
      status?: "Verified" | "Rejected" | "Uploaded" | "Archived";
      notes?: string;
    }) =>
      makeAPICall(
        VERIFY_RESIDENT_DOCUMENT,
        { status, notes },
        {},
        { id: documentId },
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...residentKeys.detail(variables.residentId), "documents"],
      });
      const actionLabel =
        variables.status === "Verified"
          ? "verified"
          : variables.status === "Rejected"
            ? "rejected / new document requested"
            : `marked as ${variables.status}`;
      toast({
        title: "Success",
        description: `Document ${actionLabel} successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update document status",
        variant: "destructive",
      });
    },
  });
}

export function useArchiveDocumentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      documentId,
      residentId,
    }: {
      documentId: string;
      residentId: string;
    }) =>
      makeAPICall(
        ARCHIVE_RESIDENT_DOCUMENT,
        {},
        {},
        { id: documentId },
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...residentKeys.detail(variables.residentId), "documents"],
      });
      toast({
        title: "Success",
        description: "Document archived successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to archive document",
        variant: "destructive",
      });
    },
  });
}

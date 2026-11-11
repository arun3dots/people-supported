import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  keepPreviousData,
} from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import {
  GET_FINANCE_STATS,
  GET_INVOICES,
  GET_INVOICE_BY_ID,
  CREATE_INVOICE,
  UPDATE_INVOICE,
  DELETE_INVOICE,
  GET_PAYMENTS,
  RECORD_PAYMENT,
  GET_EXPENSES,
  CREATE_EXPENSE,
} from "@repo/endpoints";
import type {
  CreateInvoiceDTO,
  UpdateInvoiceDTO,
  RecordPaymentDTO,
  CreateExpenseDTO,
  InvoiceListQueryInput,
  PaymentListQueryInput,
  ExpenseListQueryInput,
  PaginatedResponse,
} from "@repo/schema";
import { toQueryParams } from "../../utils/queryParams";
import { toast } from "@repo/ui/components/ui";
import type {
  InvoiceResponse,
  PaymentHistoryResponse,
  ExpenseResponse,
  FinanceStatsResponse,
} from "./types";

export const financeKeys = {
  all: ["finance"] as const,
  stats: () => [...financeKeys.all, "stats"] as const,
  invoices: () => [...financeKeys.all, "invoices"] as const,
  invoice: (id: string) => [...financeKeys.all, "invoices", id] as const,
  payments: () => [...financeKeys.all, "payments"] as const,
  expenses: () => [...financeKeys.all, "expenses"] as const,
};

export function useGetFinanceStatsQuery() {
  return useQuery<FinanceStatsResponse>({
    queryKey: financeKeys.stats(),
    queryFn: () => makeAPICall<FinanceStatsResponse>(GET_FINANCE_STATS),
  });
}

/**
 * Every invoice as a flat array. Sends `all=true`, so it is NOT affected by list pagination.
 * For the paginated directory table use {@link useGetPaginatedInvoicesQuery}.
 */
export function useGetInvoicesQuery(
  filters: InvoiceListQueryInput = { all: true },
  options?: Partial<UseQueryOptions<InvoiceResponse[]>>,
) {
  const params: InvoiceListQueryInput = { ...filters, all: true };
  return useQuery<InvoiceResponse[]>({
    queryKey: [...financeKeys.invoices(), params],
    queryFn: async () => {
      const res = await makeAPICall<
        PaginatedResponse<InvoiceResponse> | InvoiceResponse[]
      >(GET_INVOICES, {}, toQueryParams(params));
      return Array.isArray(res) ? res : res?.data ?? [];
    },
    ...options,
  });
}

/** One page of invoices plus the pagination envelope (total, totalPages, ...). */
export function useGetPaginatedInvoicesQuery(
  params: InvoiceListQueryInput = { page: 1, limit: 10 },
  options?: Partial<UseQueryOptions<PaginatedResponse<InvoiceResponse>>>,
) {
  return useQuery({
    queryKey: [...financeKeys.invoices(), "paginated", params],
    queryFn: async () =>
      makeAPICall<PaginatedResponse<InvoiceResponse>>(
        GET_INVOICES,
        {},
        toQueryParams(params),
      ),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useGetInvoiceByIdQuery(id?: string) {
  return useQuery<InvoiceResponse>({
    queryKey: financeKeys.invoice(id ?? ""),
    queryFn: () =>
      makeAPICall<InvoiceResponse>(GET_INVOICE_BY_ID, {}, {}, { id: id! }),
    enabled: !!id,
  });
}

export function useCreateInvoiceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateInvoiceDTO) =>
      makeAPICall<InvoiceResponse>(
        CREATE_INVOICE,
        dto as unknown as Record<string, unknown>,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: financeKeys.invoices() });
      qc.invalidateQueries({ queryKey: financeKeys.stats() });
      toast({
        title: "Success",
        description: "Invoice created successfully",
        variant: "success",
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message || "Failed to create invoice",
        variant: "error",
      });
    },
  });
}

export function useUpdateInvoiceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateInvoiceDTO }) =>
      makeAPICall<InvoiceResponse>(
        UPDATE_INVOICE,
        dto as unknown as Record<string, unknown>,
        {},
        { id },
      ),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: financeKeys.invoices() });
      qc.invalidateQueries({ queryKey: financeKeys.invoice(variables.id) });
      qc.invalidateQueries({ queryKey: financeKeys.stats() });
      toast({
        title: "Success",
        description: "Invoice updated successfully",
        variant: "success",
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message || "Failed to update invoice",
        variant: "error",
      });
    },
  });
}

export function useDeleteInvoiceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      makeAPICall<{ success: boolean }>(DELETE_INVOICE, {}, {}, { id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: financeKeys.invoices() });
      qc.invalidateQueries({ queryKey: financeKeys.stats() });
      toast({
        title: "Success",
        description: "Invoice deleted successfully",
        variant: "success",
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message || "Failed to delete invoice",
        variant: "error",
      });
    },
  });
}

/**
 * Every payment as a flat array. Sends `all=true`, so it is NOT affected by list pagination.
 * For the paginated directory table use {@link useGetPaginatedPaymentsQuery}.
 */
export function useGetPaymentsQuery(
  filters: PaymentListQueryInput = { all: true },
  options?: Partial<UseQueryOptions<PaymentHistoryResponse[]>>,
) {
  const params: PaymentListQueryInput = { ...filters, all: true };
  return useQuery<PaymentHistoryResponse[]>({
    queryKey: [...financeKeys.payments(), params],
    queryFn: async () => {
      const res = await makeAPICall<
        PaginatedResponse<PaymentHistoryResponse> | PaymentHistoryResponse[]
      >(GET_PAYMENTS, {}, toQueryParams(params));
      return Array.isArray(res) ? res : res?.data ?? [];
    },
    ...options,
  });
}

/** One page of payments plus the pagination envelope (total, totalPages, ...). */
export function useGetPaginatedPaymentsQuery(
  params: PaymentListQueryInput = { page: 1, limit: 10 },
  options?: Partial<UseQueryOptions<PaginatedResponse<PaymentHistoryResponse>>>,
) {
  return useQuery({
    queryKey: [...financeKeys.payments(), "paginated", params],
    queryFn: async () =>
      makeAPICall<PaginatedResponse<PaymentHistoryResponse>>(
        GET_PAYMENTS,
        {},
        toQueryParams(params),
      ),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useRecordPaymentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: RecordPaymentDTO) =>
      makeAPICall<PaymentHistoryResponse>(
        RECORD_PAYMENT,
        dto as unknown as Record<string, unknown>,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: financeKeys.payments() });
      qc.invalidateQueries({ queryKey: financeKeys.invoices() });
      qc.invalidateQueries({ queryKey: financeKeys.stats() });
      toast({
        title: "Success",
        description: "Payment recorded successfully",
        variant: "success",
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message || "Failed to record payment",
        variant: "error",
      });
    },
  });
}

/**
 * Every expense as a flat array. Sends `all=true`, so it is NOT affected by list pagination.
 * For the paginated directory table use {@link useGetPaginatedExpensesQuery}.
 */
export function useGetExpensesQuery(
  filters: ExpenseListQueryInput = { all: true },
  options?: Partial<UseQueryOptions<ExpenseResponse[]>>,
) {
  const params: ExpenseListQueryInput = { ...filters, all: true };
  return useQuery<ExpenseResponse[]>({
    queryKey: [...financeKeys.expenses(), params],
    queryFn: async () => {
      const res = await makeAPICall<
        PaginatedResponse<ExpenseResponse> | ExpenseResponse[]
      >(GET_EXPENSES, {}, toQueryParams(params));
      return Array.isArray(res) ? res : res?.data ?? [];
    },
    ...options,
  });
}

/** One page of expenses plus the pagination envelope (total, totalPages, ...). */
export function useGetPaginatedExpensesQuery(
  params: ExpenseListQueryInput = { page: 1, limit: 10 },
  options?: Partial<UseQueryOptions<PaginatedResponse<ExpenseResponse>>>,
) {
  return useQuery({
    queryKey: [...financeKeys.expenses(), "paginated", params],
    queryFn: async () =>
      makeAPICall<PaginatedResponse<ExpenseResponse>>(
        GET_EXPENSES,
        {},
        toQueryParams(params),
      ),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useCreateExpenseMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateExpenseDTO) =>
      makeAPICall<ExpenseResponse>(
        CREATE_EXPENSE,
        dto as unknown as Record<string, unknown>,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: financeKeys.expenses() });
      qc.invalidateQueries({ queryKey: financeKeys.stats() });
      toast({
        title: "Success",
        description: "Expense recorded successfully",
        variant: "success",
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message || "Failed to record expense",
        variant: "error",
      });
    },
  });
}

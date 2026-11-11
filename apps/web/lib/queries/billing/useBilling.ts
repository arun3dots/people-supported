import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import {
  GET_BILLING_STATUS,
  GET_PAYMENT_LINK,
  GET_BILLING_PAYMENTS,
  SELECT_PACKAGE,
  CREATE_ORDER,
  OPEN_ORDER,
} from "@repo/endpoints";
import type { OrderDetails } from "../../billing/useRazorpayCheckout";


export interface BillingStatus {
  subscriptionStatus: string;
  paymentUrl?: string;
  /** The tenant's currently-assigned package (null until one is chosen). */
  packageId?: string | null;
  packageName?: string | null;
}

export interface BillingPayment {
  id: string;
  amount: number;
  currency: string;
  status: "created" | "paid" | "failed" | "cancelled";
  isRenewal: boolean;
  failureReason: string | null;
  packageName: string | null;
  invoiceNumber: string;
  shortUrl: string | null;
  createdAt: string;
  paidAt: string | null;
}

export interface BillingHistory {
  tenantName: string | null;
  subscriptionStatus: string;
  nextRenewalAt: string | null;
  packageName: string | null;
  payments: BillingPayment[];
}

export function useBillingPaymentsQuery(
  options?: Partial<UseQueryOptions<BillingHistory>>,
) {
  return useQuery({
    queryKey: [GET_BILLING_PAYMENTS],
    queryFn: async () => makeAPICall<BillingHistory>(GET_BILLING_PAYMENTS),
    ...options,
  });
}

export function useBillingStatusQuery(
  options?: Partial<UseQueryOptions<BillingStatus>>,
) {
  return useQuery({
    queryKey: [GET_BILLING_STATUS],
    queryFn: async () => makeAPICall<BillingStatus>(GET_BILLING_STATUS),
    ...options,
  });
}

/** Fetches (or regenerates) the active payment link for the current tenant. */
export async function fetchPaymentLink(): Promise<{ paymentUrl?: string }> {
  return makeAPICall<{ paymentUrl?: string }>(GET_PAYMENT_LINK);
}

/**
 * Tenant Admin selects (or switches to) a public package. Returns a fresh
 * payment link for the chosen plan and refreshes the cached billing status.
 */
export function useSelectPackageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (packageId: string) =>
      makeAPICall<{ paymentUrl?: string }>(SELECT_PACKAGE, { packageId }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [GET_BILLING_STATUS] }),
  });
}

// ─── In-app Standard Checkout (NEW — additive) ───────────────────────────────

/**
 * Authenticated — creates/fetches a Razorpay Order for the current tenant.
 * Returns the order details needed to open the Razorpay.js modal.
 */
export async function fetchOrder(): Promise<OrderDetails> {
  return makeAPICall<OrderDetails>(CREATE_ORDER);
}

/**
 * Unauthenticated — fetches a Razorpay Order by our own Payment.token.
 * Used on the post-signup / post-onboarding success screen before the user
 * has logged in.
 */
export async function fetchOpenOrder(token: string): Promise<OrderDetails> {
  return makeAPICall<OrderDetails>(OPEN_ORDER, { token });
}

"use client";

import { useCallback, useRef, useState } from "react";
import { makeAPICall } from "../api";
import { VERIFY_PAYMENT } from "@repo/endpoints";
import type { VerifyRazorpayPaymentDTO } from "@repo/schema";

/** Shape returned by both create-order and open-order endpoints. */
export interface OrderDetails {
  orderId: string;
  amount: number; // major units (e.g. rupees)
  currency: string;
  /** Razorpay publishable key. Empty string when using the manual provider. */
  key: string;
  /** Our own Payment.token — needed for HMAC verification body. */
  paymentToken: string;
}

/** Loads the Razorpay.js checkout CDN script once; resolves when ready. */
function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return resolve();
    if (window.Razorpay) return resolve();

    const existing = document.getElementById("razorpay-checkout-js");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }

    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
    document.body.appendChild(script);
  });
}

/**
 * Shared hook for opening the Razorpay Standard Checkout modal.
 *
 * Usage:
 *   const { openCheckout, loading } = useRazorpayCheckout({
 *     onSuccess: () => refreshUser(),
 *     onError:   (msg) => setError(msg),
 *   });
 *
 * Then call openCheckout(orderDetails) when the user clicks "Pay now".
 * The hook verifies the payment server-side before calling onSuccess.
 *
 * Manual provider (dev): if order.key is empty, returns false — the caller
 * should fall back to the /pay/<token> page.
 */
export function useRazorpayCheckout({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  // Guard against stale closures calling handlers after unmount.
  const mountedRef = useRef(true);

  const openCheckout = useCallback(
    async (order: OrderDetails): Promise<boolean> => {
      // No Razorpay key = manual provider. Signal caller to use fallback.
      if (!order.key) return false;

      setLoading(true);
      try {
        await loadRazorpayScript();
      } catch {
        onError("Could not load payment SDK. Please try again.");
        setLoading(false);
        return false;
      }

      return new Promise<boolean>((resolve) => {
        const rzp = new window.Razorpay({
          key: order.key,
          // Razorpay expects smallest currency unit (paise for INR)
          amount: Math.round(order.amount * 100),
          currency: order.currency,
          order_id: order.orderId,
          name: "Cantra Care",
          description: "Subscription payment",
          handler: async (res) => {
            const dto: VerifyRazorpayPaymentDTO = {
              orderId: res.razorpay_order_id,
              paymentId: res.razorpay_payment_id,
              signature: res.razorpay_signature,
              paymentToken: order.paymentToken,
            };
            try {
              await makeAPICall<{ success: boolean }>(VERIFY_PAYMENT, dto as unknown as Record<string, unknown>);
              if (mountedRef.current) {
                setLoading(false);
                onSuccess();
              }
              resolve(true);
            } catch {
              if (mountedRef.current) {
                setLoading(false);
                onError("Payment could not be verified. Please contact support.");
              }
              resolve(false);
            }
          },
          modal: {
            ondismiss: () => {
              if (mountedRef.current) setLoading(false);
              resolve(false);
            },
          },
          theme: { color: "#2563eb" },
        });

        rzp.open();
      });
    },
    [onSuccess, onError],
  );

  return { openCheckout, loading };
}


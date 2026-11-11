/**
 * Global TypeScript declarations for the Razorpay.js Standard Checkout SDK
 * loaded from https://checkout.razorpay.com/v1/checkout.js
 */

interface RazorpayHandlerResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  /** Razorpay publishable key (rzp_live_... or rzp_test_...) */
  key: string;
  /** Amount in smallest currency unit (paise for INR). */
  amount: number;
  currency: string;
  /** Razorpay order_id from POST /v1/orders */
  order_id: string;
  name?: string;
  description?: string;
  /** Called by Razorpay on successful payment with signed response fields. */
  handler: (response: RazorpayHandlerResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  modal?: {
    /** Called when the user closes the Razorpay modal without paying. */
    ondismiss?: () => void;
  };
  theme?: {
    color?: string;
  };
}

declare class Razorpay {
  constructor(options: RazorpayOptions);
  open(): void;
}

declare global {
  interface Window {
    Razorpay: typeof Razorpay;
  }
}

export {};


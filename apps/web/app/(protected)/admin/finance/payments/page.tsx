"use client";
import { Suspense } from "react";
import { PaymentDirectoryClient } from "./components/PaymentDirectoryClient";

// Suspense required: PaymentDirectoryClient uses useSearchParams() via useListQueryState
export default function PaymentsPage() {
  return (
    <Suspense fallback={null}>
      <PaymentDirectoryClient />
    </Suspense>
  );
}

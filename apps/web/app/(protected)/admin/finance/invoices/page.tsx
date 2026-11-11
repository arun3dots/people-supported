"use client";
import { Suspense } from "react";
import { InvoiceDirectoryClient } from "./components/InvoiceDirectoryClient";

// Suspense required: InvoiceDirectoryClient uses useSearchParams() via useListQueryState
export default function InvoicesPage() {
  return (
    <Suspense fallback={null}>
      <InvoiceDirectoryClient />
    </Suspense>
  );
}

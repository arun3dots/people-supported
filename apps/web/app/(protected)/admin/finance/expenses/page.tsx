"use client";
import { Suspense } from "react";
import { ExpenseDirectoryClient } from "./components/ExpenseDirectoryClient";

// Suspense required: ExpenseDirectoryClient uses useSearchParams() via useListQueryState
export default function ExpensesPage() {
  return (
    <Suspense fallback={null}>
      <ExpenseDirectoryClient />
    </Suspense>
  );
}

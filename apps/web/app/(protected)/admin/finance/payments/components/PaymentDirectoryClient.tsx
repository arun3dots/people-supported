"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@repo/ui/components/ui";
import {
  useGetPaymentsQuery,
  useGetPaginatedPaymentsQuery,
  useGetFinanceStatsQuery,
} from "../../../../../../lib/queries/finance/useFinanceQueries";
import { EntityListView } from "../../../../../../lib/components/shared";
import { useListQueryState } from "../../../../../../lib/hooks";
import { PaymentsStatCards } from "./PaymentsStatCards";
import { PaymentsFilterSection } from "./PaymentsFilterSection";
import { usePaymentColumns } from "./usePaymentColumns";
import { PaymentCard } from "./PaymentCardGrid";
import type { PaymentItem } from "./types";

const PAYMENT_FILTERS = {
  method: "All Methods",
} as const;

export function PaymentDirectoryClient() {
  const {
    page,
    limit,
    search,
    searchInput,
    setSearchInput,
    filters,
    filterParams,
    setFilter,
    handlePageChange,
    handleLimitChange,
    resetFilters,
  } = useListQueryState({
    filters: PAYMENT_FILTERS,
    storageKey: "payments_page_size",
  });

  // Stat cards receive full dataset
  const { data: allPayments } = useGetPaymentsQuery();
  const { data: stats } = useGetFinanceStatsQuery();

  // Paginated directory records
  const {
    data: paginatedResponse,
    isLoading: isLoadingPayments,
    isError,
  } = useGetPaginatedPaymentsQuery({
    page,
    limit,
    search,
    paymentMethod: filterParams.method,
  });

  const payments = (paginatedResponse?.data ?? []) as PaymentItem[];
  const totalRecords = paginatedResponse?.total ?? 0;

  const columns = usePaymentColumns();

  return (
    <EntityListView<PaymentItem>
      title="Payment History"
      description="Complete transaction ledger for resident fees, council settlements, and adjustments."
      overviewTitle="Payment Overview"
      storageKey="payments_directory_view_mode"
      headerActions={
        <Link href="/admin/finance/invoices">
          <Button
            variant="outline"
            className="rounded-xl gap-2 text-md font-semibold cursor-pointer"
          >
            <ArrowLeft className="size-4" /> Back to Invoices
          </Button>
        </Link>
      }
      stats={<PaymentsStatCards payments={allPayments} stats={stats} />}
      filters={
        <PaymentsFilterSection
          searchTerm={searchInput}
          setSearchTerm={setSearchInput}
          methodFilter={filters.method ?? PAYMENT_FILTERS.method}
          setMethodFilter={(val) => setFilter("method", val)}
          onReset={resetFilters}
        />
      }
      columns={columns}
      data={payments}
      paginatedData={payments}
      renderCard={(payment: PaymentItem, idx: number) => (
        <PaymentCard
          key={payment.id}
          payment={payment}
          showRightDivider={
            idx % 3 !== 2 && idx !== payments.length - 1
          }
        />
      )}
      isLoading={isLoadingPayments}
      isError={isError}
      errorMessage="Error loading payment history. Please try again."
      emptyTitle="No payments found"
      emptyDescription="No payment records match your active search or filter criteria."
      pagination={{
        currentPage: page,
        pageSize: limit,
        totalRecords,
        onPageChange: handlePageChange,
        onLimitChange: handleLimitChange,
        entityName: "payments",
      }}
    />
  );
}


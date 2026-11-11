"use client";

import React, { useState } from "react";
import { usePagination } from "@repo/ui/hooks";
import {
  useBillingPaymentsQuery,
  type BillingPayment,
} from "../../../lib/queries/billing/useBilling";
import { EntityListView } from "../../../lib/components/shared";
import { SubscriptionDetailModal } from "./components/SubscriptionDetailModal";
import { BillingOverviewCard } from "./components/BillingOverviewCard";
import { BillingFilterSection, type BillingStatusFilter } from "./components/BillingFilterSection";
import { useBillingColumns } from "./components/useBillingColumns";
import { BillingPaymentCard } from "./components/BillingPaymentCardGrid";

function matchesStatusFilter(payment: BillingPayment, filter: BillingStatusFilter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "paid":
      return payment.status === "paid";
    case "failed":
      return payment.status === "failed";
    case "cancelled":
      return payment.status === "cancelled";
    case "pending":
      return payment.status === "created" && !payment.isRenewal;
    case "renewal":
      return payment.status === "created" && payment.isRenewal;
    default:
      return true;
  }
}

export default function SubscriptionsPage() {
  const { data, isLoading, isError } = useBillingPaymentsQuery();
  const [detail, setDetail] = useState<BillingPayment | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<BillingStatusFilter>("all");

  const payments = data?.payments ?? [];

  const filteredPayments = payments.filter((p) => {
    const searchLower = searchTerm.toLowerCase();
    const invNumber = p.invoiceNumber?.toLowerCase() || "";
    const pkgName = p.packageName?.toLowerCase() || "";

    const matchesSearch =
      !searchTerm ||
      invNumber.includes(searchLower) ||
      pkgName.includes(searchLower);

    const matchesStatus = matchesStatusFilter(p, statusFilter);

    return matchesSearch && matchesStatus;
  });

  const handleClearAll = () => {
    setStatusFilter("all");
    setSearchTerm("");
  };

  const [initialPageSize] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = parseInt(
        localStorage.getItem("subscriptions_billing_page_size") || "10",
        10
      );
      return isNaN(saved) ? 10 : saved;
    }
    return 10;
  });

  const {
    currentPage,
    pageSize,
    paginatedData,
    totalRecords,
    handlePageChange,
    handleLimitChange: _handleLimitChange,
  } = usePagination(filteredPayments, initialPageSize);

  const handleLimitChange = (limit: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("subscriptions_billing_page_size", limit);
    }
    _handleLimitChange(limit);
  };

  const columns = useBillingColumns({
    onViewDetail: setDetail,
  });

  return (
    <>
      <EntityListView<BillingPayment>
        title="Subscriptions & Billing"
        description="Manage your care home subscription plan, licence renewals, and billing history."
        overviewTitle="Billing History"
        storageKey="subscriptions_billing_view_mode"
        stats={<BillingOverviewCard data={data} isLoading={isLoading} />}
        filters={
          <BillingFilterSection
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            onReset={handleClearAll}
          />
        }
        columns={columns}
        data={filteredPayments}
        paginatedData={paginatedData}
        renderCard={(payment, idx) => (
          <BillingPaymentCard
            key={payment.id}
            payment={payment}
            showRightDivider={
              idx % 3 !== 2 && idx !== paginatedData.length - 1
            }
            onViewDetail={setDetail}
          />
        )}
        onRowClick={setDetail}
        isLoading={isLoading}
        isError={isError}
        errorMessage="Error loading billing history. Please try again."
        emptyTitle="No billing transactions found"
        emptyDescription="Your care home subscription invoices and renewal receipts will automatically appear here."
        pagination={{
          currentPage,
          pageSize,
          totalRecords,
          onPageChange: handlePageChange,
          onLimitChange: handleLimitChange,
          entityName: "transactions",
        }}
      />

      {/* Invoice / Payment Detail Modal */}
      <SubscriptionDetailModal
        detail={detail}
        onClose={() => setDetail(null)}
      />
    </>
  );
}

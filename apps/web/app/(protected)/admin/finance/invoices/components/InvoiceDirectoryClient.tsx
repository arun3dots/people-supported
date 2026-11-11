"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Download } from "lucide-react";
import { Button } from "@repo/ui/components/ui";
import {
  useGetPaginatedInvoicesQuery,
  useGetFinanceStatsQuery,
  useDeleteInvoiceMutation,
} from "../../../../../../lib/queries/finance/useFinanceQueries";
import type { InvoiceResponse } from "../../../../../../lib/queries/finance/types";
import { EntityListView } from "../../../../../../lib/components/shared";
import { useListQueryState } from "../../../../../../lib/hooks";
import { FinanceStatCards } from "../../components/FinanceStatCards";
import { InvoicesFilterSection } from "../../components/InvoicesFilterSection";
import { InvoiceDetailModal } from "../../components/InvoiceDetailModal";
import { RecordPaymentDialog } from "../../components/RecordPaymentDialog";
import { DeleteConfirmDialog } from "../../../../../../lib/components/shared/DeleteConfirmDialog";
import { useInvoiceColumns } from "./useInvoiceColumns";
import { InvoiceCard } from "./InvoiceCardGrid";

const INVOICE_FILTERS = {
  status: "All Status",
  type: "All Types",
} as const;

export function InvoiceDirectoryClient() {
  const router = useRouter();

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
    filters: INVOICE_FILTERS,
    storageKey: "invoices_page_size",
  });

  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceResponse | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<InvoiceResponse | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [deleteInvoice, setDeleteInvoice] = useState<InvoiceResponse | null>(null);

  const { data: stats, isLoading: isLoadingStats } = useGetFinanceStatsQuery();
  const {
    data: paginatedResponse,
    isLoading: isLoadingInvoices,
    isError,
  } = useGetPaginatedInvoicesQuery({
    page,
    limit,
    search,
    status: filterParams.status,
    invoiceType: filterParams.type,
  });

  const invoices = paginatedResponse?.data ?? [];
  const totalRecords = paginatedResponse?.total ?? 0;

  const deleteInvoiceMutation = useDeleteInvoiceMutation();

  const handleExport = () => {
    if (!invoices.length) return;
    const headers = [
      "Invoice No",
      "Resident",
      "Invoice Type",
      "Issue Date",
      "Due Date",
      "Amount",
      "Status",
    ];
    const rows = invoices.map((inv: InvoiceResponse) => [
      inv.invoiceNumber,
      `"${inv.resident?.fullName || ""}"`,
      `"${inv.invoiceType || ""}"`,
      inv.issuedDate ? new Date(inv.issuedDate).toLocaleDateString("en-GB") : "",
      inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-GB") : "",
      inv.amount,
      inv.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e: (string | number)[]) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `invoices-export-${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewInvoice = (invoice: InvoiceResponse) => {
    setSelectedInvoice(invoice);
    setIsDetailOpen(true);
  };

  const handleRecordPayment = (invoice: InvoiceResponse) => {
    setPaymentInvoice(invoice);
    setIsPaymentOpen(true);
  };

  const handleDeleteInvoice = (invoice: InvoiceResponse) => {
    setDeleteInvoice(invoice);
  };

  const columns = useInvoiceColumns({
    onViewInvoice: handleViewInvoice,
    onRecordPayment: handleRecordPayment,
    onDeleteInvoice: handleDeleteInvoice,
  });

  return (
    <>
      <EntityListView<InvoiceResponse>
        title="Invoice Management"
        description="Manage resident billing, fee invoices, funding allocation, and payment collections."
        overviewTitle="Invoice Overview"
        storageKey="invoices_directory_view_mode"
        headerActions={
          <Button
            variant="outline"
            onClick={handleExport}
            className="rounded-xl gap-2 text-md font-semibold cursor-pointer"
          >
            <Download className="size-4" /> Export CSV
          </Button>
        }
        onAdd={() => router.push("/admin/finance/new-invoice")}
        addLabel="New Invoice"
        addIcon={<Plus className="size-4" />}
        stats={<FinanceStatCards stats={stats} isLoading={isLoadingStats} />}
        filters={
          <InvoicesFilterSection
            searchTerm={searchInput}
            setSearchTerm={setSearchInput}
            statusFilter={filters.status ?? INVOICE_FILTERS.status}
            setStatusFilter={(val: string) => setFilter("status", val)}
            typeFilter={filters.type ?? INVOICE_FILTERS.type}
            setTypeFilter={(val: string) => setFilter("type", val)}
            onReset={resetFilters}
          />
        }
        columns={columns}
        data={invoices}
        paginatedData={invoices}
        renderCard={(invoice: InvoiceResponse, idx: number) => (
          <InvoiceCard
            key={invoice.id}
            invoice={invoice}
            showRightDivider={
              idx % 3 !== 2 && idx !== invoices.length - 1
            }
            onViewInvoice={handleViewInvoice}
            onRecordPayment={handleRecordPayment}
            onDeleteInvoice={handleDeleteInvoice}
          />
        )}
        onRowClick={handleViewInvoice}
        isLoading={isLoadingInvoices}
        isError={isError}
        errorMessage="Error loading invoices directory. Please try again."
        emptyTitle="No invoices found"
        emptyDescription="No invoice records match your active search or filter criteria."
        pagination={{
          currentPage: page,
          pageSize: limit,
          totalRecords,
          onPageChange: handlePageChange,
          onLimitChange: handleLimitChange,
          entityName: "invoices",
        }}
      />

      {/* Modals */}
      <InvoiceDetailModal
        invoice={selectedInvoice}
        isOpen={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onRecordPayment={(inv: InvoiceResponse) => {
          setPaymentInvoice(inv);
          setIsPaymentOpen(true);
        }}
      />

      <RecordPaymentDialog
        invoice={paymentInvoice}
        isOpen={isPaymentOpen}
        onOpenChange={setIsPaymentOpen}
      />

      <DeleteConfirmDialog
        isOpen={!!deleteInvoice}
        onOpenChange={(open: boolean) => !open && setDeleteInvoice(null)}
        title="Delete Invoice"
        description={`Are you sure you want to delete invoice "${deleteInvoice?.invoiceNumber}"? This action cannot be undone.`}
        onConfirm={async () => {
          if (deleteInvoice) {
            await deleteInvoiceMutation.mutateAsync(deleteInvoice.id);
            setDeleteInvoice(null);
          }
        }}
      />
    </>
  );
}


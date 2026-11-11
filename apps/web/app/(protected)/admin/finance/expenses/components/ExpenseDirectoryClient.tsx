"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@repo/ui/components/ui";
import {
  useGetExpensesQuery,
  useGetPaginatedExpensesQuery,
  useGetFinanceStatsQuery,
} from "../../../../../../lib/queries/finance/useFinanceQueries";
import { EntityListView } from "../../../../../../lib/components/shared";
import { useListQueryState } from "../../../../../../lib/hooks";
import { ExpensesStatCards } from "./ExpensesStatCards";
import { ExpensesFilterSection } from "./ExpensesFilterSection";
import { useExpenseColumns } from "./useExpenseColumns";
import { ExpenseCard } from "./ExpenseCardGrid";
import { ExpenseDialog } from "./ExpenseDialog";
import type { ExpenseItem } from "./types";

const EXPENSE_FILTERS = {
  category: "All Categories",
  status: "All Status",
} as const;

export function ExpenseDirectoryClient() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
    filters: EXPENSE_FILTERS,
    storageKey: "expenses_page_size",
  });

  // Stat cards receive full dataset
  const { data: allExpenses } = useGetExpensesQuery();
  const { data: stats } = useGetFinanceStatsQuery();

  // Paginated directory records
  const {
    data: paginatedResponse,
    isLoading,
    isError,
  } = useGetPaginatedExpensesQuery({
    page,
    limit,
    search,
    category: filterParams.category,
    status: filterParams.status,
  });

  const expenses = (paginatedResponse?.data ?? []) as ExpenseItem[];
  const totalRecords = paginatedResponse?.total ?? 0;

  const columns = useExpenseColumns();

  return (
    <>
      <EntityListView<ExpenseItem>
        title="Expense Management"
        description="Track operational care home costs, medical supplies, catering, utilities, and staffing."
        overviewTitle="Expense Overview"
        storageKey="expenses_directory_view_mode"
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
        onAdd={() => setIsDialogOpen(true)}
        addLabel="Record Expense"
        addIcon={<Plus className="size-4" />}
        stats={
          <ExpensesStatCards
            expenses={allExpenses}
            totalExpenses={stats?.totalExpenses}
          />
        }
        filters={
          <ExpensesFilterSection
            searchTerm={searchInput}
            setSearchTerm={setSearchInput}
            categoryFilter={filters.category ?? EXPENSE_FILTERS.category}
            setCategoryFilter={(val) => setFilter("category", val)}
            statusFilter={filters.status ?? EXPENSE_FILTERS.status}
            setStatusFilter={(val) => setFilter("status", val)}
            onReset={resetFilters}
          />
        }
        columns={columns}
        data={expenses}
        paginatedData={expenses}
        renderCard={(expense: ExpenseItem, idx: number) => (
          <ExpenseCard
            key={expense.id}
            expense={expense}
            showRightDivider={
              idx % 3 !== 2 && idx !== expenses.length - 1
            }
          />
        )}
        isLoading={isLoading}
        isError={isError}
        errorMessage="Error loading expenses. Please try again."
        emptyTitle="No expenses found"
        emptyDescription="No expense records match your active search or filter criteria."
        pagination={{
          currentPage: page,
          pageSize: limit,
          totalRecords,
          onPageChange: handlePageChange,
          onLimitChange: handleLimitChange,
          entityName: "expenses",
        }}
      />

      <ExpenseDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  );
}


"use client";

import { useMemo, Fragment, type ReactNode } from "react";
import { Plus, List, LayoutGrid } from "lucide-react";
import {
  Button,
  Text,
  Pagination,
  Skeleton,
  EmptyState,
} from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import { DataTable } from "./DataTable";
import { useViewMode, type ViewMode } from "../../hooks/useViewMode";
import { useColumnVisibility } from "../../hooks/useColumnVisibility";
import {
  ColumnVisibilityDropdown,
  type ColumnVisibilityItem,
} from "./ColumnVisibilityDropdown";
import { TableColumn } from "./tableColumns";

export interface EntityListViewProps<T> {
  // 1. Page Header Props
  title: string;
  description?: string;
  overviewTitle?: string;
  headerActions?: ReactNode;
  onAdd?: () => void;
  addLabel?: string;
  addIcon?: ReactNode;

  // 2. View Mode
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  showViewToggle?: boolean;
  storageKey?: string;
  overviewActions?: ReactNode | ((mode: ViewMode) => ReactNode);

  // 2b. Column Visibility
  enableColumnVisibility?: boolean;
  columnVisibilityStorageKey?: string;
  mandatoryColumnIds?: readonly string[];
  defaultHiddenColumnIds?: readonly string[];

  // 3. Stats Slot
  stats?: ReactNode;

  // 4. Filters Slot
  filters?: ReactNode;

  // 5. Data & Columns
  data?: T[];
  paginatedData?: T[];
  columns: TableColumn<T>[];
  renderCard?: (item: T, index: number) => ReactNode;
  cardGridClassName?: string;
  onRowClick?: (item: T) => void;

  // 6. Loading & Error
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;

  // 7. Empty State
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;

  // 8. Pagination Props
  pagination?: {
    currentPage: number;
    pageSize: number;
    totalRecords: number;
    onPageChange: (page: number) => void;
    onLimitChange?: (limit: string) => void;
    entityName?: string;
    showLimitSelector?: boolean;
  };

  className?: string;
}

export function EntityListView<T>({
  title,
  description,
  overviewTitle,
  headerActions,
  onAdd,
  addLabel = "Add Record",
  addIcon,
  viewMode: controlledViewMode,
  onViewModeChange: controlledOnViewModeChange,
  showViewToggle = true,
  storageKey,
  overviewActions,
  enableColumnVisibility = false,
  columnVisibilityStorageKey,
  mandatoryColumnIds,
  defaultHiddenColumnIds,
  stats,
  filters,
  data = [],
  paginatedData,
  columns,
  renderCard,
  cardGridClassName = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5",
  onRowClick,
  isLoading = false,
  isError = false,
  errorMessage = "Error loading records. Please try again.",
  emptyTitle,
  emptyDescription,
  emptyAction,
  pagination,
  className,
}: EntityListViewProps<T>) {
  const [internalViewMode, setInternalViewMode] = useViewMode(
    storageKey,
    "table"
  );
  const viewMode = controlledViewMode ?? internalViewMode;
  const setViewMode = controlledOnViewModeChange ?? setInternalViewMode;

  const displayData = paginatedData ?? data;

  const effectiveEmptyAction =
    emptyAction ??
    (onAdd && addLabel ? (
      <Button variant="primary" onClick={onAdd} className="gap-2 cursor-pointer">
        {addIcon ?? <Plus className="size-4" />}
        {addLabel}
      </Button>
    ) : undefined);

  const effectiveMandatoryColumnIds = useMemo(
    () => mandatoryColumnIds ?? ["resident", "actions"],
    [mandatoryColumnIds],
  );

  const effectiveHiddenColumnIds = useMemo(
    () => defaultHiddenColumnIds ?? [],
    [defaultHiddenColumnIds],
  );

  const columnVisibilityItems = useMemo<ColumnVisibilityItem[]>(() => {
    return columns
      .filter((col) => Boolean(col.id))
      .map((col) => {
        const id = col.id!;
        const label =
          typeof col.header === "string"
            ? col.header
            : id.charAt(0).toUpperCase() + id.slice(1);
        const isMandatory =
          effectiveMandatoryColumnIds.includes(id) ||
          id === "resident" ||
          id === "actions";
        return { id, label, isMandatory };
      });
  }, [columns, effectiveMandatoryColumnIds]);

  const allColumnIds = useMemo(
    () => columnVisibilityItems.map((c) => c.id),
    [columnVisibilityItems],
  );

  const {
    visibleColumnIds,
    defaultVisibleColumnIds: internalDefaultVisible,
    applyVisibleColumns,
    isColumnVisible,
  } = useColumnVisibility({
    storageKey:
      columnVisibilityStorageKey ??
      (storageKey ? `${storageKey}_visible_columns` : undefined),
    allColumnIds,
    mandatoryColumnIds: effectiveMandatoryColumnIds,
    defaultHiddenColumnIds: effectiveHiddenColumnIds,
  });

  const renderedColumns = useMemo(() => {
    if (!enableColumnVisibility) return columns;
    return columns.filter((col) => isColumnVisible(col.id));
  }, [columns, enableColumnVisibility, isColumnVisible]);

  return (
    <div className={cn("space-y-6 pb-12 font-sans", className)}>
      {/* 1. Page Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Text size="xl" weight="bold" className="tracking-tight">
            {title}
          </Text>
          {description && (
            <Text variant="subdued" size="xs" weight="regular">
              {description}
            </Text>
          )}
        </div>

        {/* Header Actions & Add Button */}
        <div className="flex items-center gap-3">
          {headerActions}

          {onAdd && (
            <Button variant="primary" onClick={onAdd} className="gap-2 cursor-pointer">
              {addIcon ?? <Plus className="size-4" />}
              {addLabel}
            </Button>
          )}
        </div>
      </div>

      {/* 2. Optional Stats Section */}
      {stats && <div>{stats}</div>}

      {/* 3. Search and Filters Section */}
      {filters && <div className="pt-3">{filters}</div>}

      {/* 4. Pack Design Container */}
      <div className="w-full bg-surface-card-grey rounded-2xl p-5 lg:p-6 shadow-none border-none font-sans flex flex-col justify-between">
        {/* Pack Header: Overview Title & List/Card Switcher */}
        <div className="flex items-center justify-between pb-4 border-b border-border-secondary/50 mb-4">
          <Text size="base" weight="bold" className="text-slate-900">
            {overviewTitle || `${title.replace(/ Management$/, "")} Overview`}
          </Text>

          <div className="flex items-center gap-2.5">
            {enableColumnVisibility && viewMode === "table" && (
              <ColumnVisibilityDropdown
                columns={columnVisibilityItems}
                visibleColumnIds={visibleColumnIds}
                defaultVisibleColumnIds={internalDefaultVisible}
                onApply={applyVisibleColumns}
              />
            )}

            {typeof overviewActions === "function"
              ? overviewActions(viewMode)
              : overviewActions}

            {showViewToggle && renderCard && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setViewMode(viewMode === "table" ? "card" : "table")
                }
                className="flex items-center gap-1.5 px-3 py-1.5 h-8 rounded-xl bg-white border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 text-xs font-semibold text-slate-700 transition-all cursor-pointer shadow-xs"
              >
                {viewMode === "table" ? (
                  <>
                    <LayoutGrid className="size-3.5 text-emerald-800" />
                    <Text variant="secondary" size="sm">Card View</Text>
                  </>
                ) : (
                  <>
                    <List className="size-3.5 text-emerald-800" />
                    <Text variant="secondary" size="sm">List View</Text>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Pack Body: Table or Card Grid */}
        {isLoading ? (
          <div className="space-y-4 py-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl bg-slate-200/60" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-12 text-center">
            <EmptyState
              title={emptyTitle ?? "No records found"}
              description={emptyDescription ?? "No records are available yet. Add your first record to get started."}
              action={effectiveEmptyAction}
            />
          </div>
        ) : viewMode === "table" || !renderCard ? (
          <DataTable<T>
            columns={renderedColumns}
            data={displayData}
            isLoading={isLoading}
            onRowClick={onRowClick}
            rowIndexOffset={
              pagination && pagination.pageSize > 0
                ? (pagination.currentPage - 1) * pagination.pageSize
                : 0
            }
            emptyTitle={emptyTitle}
            emptyDescription={emptyDescription}
            emptyAction={effectiveEmptyAction}
          />
        ) : displayData.length === 0 ? (
          <div className="p-12 text-center">
            <EmptyState
              title={emptyTitle ?? "No records found"}
              description={emptyDescription ?? "No items match your criteria."}
              action={effectiveEmptyAction}
            />
          </div>
        ) : (
          <div className={cardGridClassName}>
            {displayData.map((item, idx) => (
              <Fragment key={idx}>
                {renderCard(item, idx)}
              </Fragment>
            ))}
          </div>
        )}

        {/* Pack Footer: Integrated Pagination */}
        {pagination && (
          <div className="pt-4 border-t border-border-secondary/50 mt-4">
            <Pagination
              pageNumber={pagination.currentPage}
              pageSize={pagination.pageSize}
              totalRecords={pagination.totalRecords}
              limit={pagination.pageSize.toString()}
              onPageChange={pagination.onPageChange}
              onLimitChange={pagination.onLimitChange || (() => {})}
              disabled={isLoading}
              showLimitSelector={pagination.showLimitSelector ?? (Boolean(pagination.onLimitChange))}
              entityName={pagination.entityName || "records"}
            />
          </div>
        )}
      </div>
    </div>
  );
}

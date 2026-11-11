"use client";

import React, { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type OnChangeFn,
} from "@tanstack/react-table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Skeleton,
  EmptyState,
} from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import { TableColumn, normalizeColumns } from "./tableColumns";

type ColumnAlign = "left" | "center" | "right";

function getColumnAlign<T>(
  meta: ColumnDef<T, unknown>["meta"] | undefined,
): ColumnAlign | undefined {
  return (meta as { align?: ColumnAlign } | undefined)?.align;
}


export interface DataTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  onRowClick?: (item: T) => void;
  /** Starting index for the `#` column (row numbers), e.g. (page-1)*pageSize */
  rowIndexOffset?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  sorting: controlledSorting,
  onSortingChange: controlledOnSortingChange,
  onRowClick,
  rowIndexOffset = 0,
  emptyTitle = "No records found",
  emptyDescription = "No data available matching your criteria.",
  emptyAction,
  className,
}: DataTableProps<T>) {
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const sorting = controlledSorting ?? internalSorting;
  const setSorting = controlledOnSortingChange ?? setInternalSorting;

  const tableColumns = useMemo(
    () => normalizeColumns(columns, rowIndexOffset),
    [columns, rowIndexOffset]
  );

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className={cn("w-full overflow-x-auto font-sans", className)}>
      <Table className="w-full border-collapse">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className="border-b border-border-secondary/50 hover:bg-transparent"
            >
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sortDirection = header.column.getIsSorted();
                const isActions = header.column.id === "actions" || header.column.id === "quickAction";
                const align = getColumnAlign(header.column.columnDef.meta);
                const centerAlign = isActions || align === "center";

                return (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "py-3 whitespace-nowrap select-none",
                      canSort && "cursor-pointer hover:text-slate-900",
                      isActions && "text-right",
                      align === "center" && "text-center"
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={cn(
                          "inline-flex items-center gap-1.5",
                          centerAlign && "w-full justify-center",
                          align === "right" && "w-full justify-end"
                        )}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {canSort && (
                          <span className="shrink-0 text-slate-400">
                            {sortDirection === "asc" ? (
                              <ArrowUp className="size-3.5 text-emerald-800" />
                            ) : sortDirection === "desc" ? (
                              <ArrowDown className="size-3.5 text-emerald-800" />
                            ) : (
                              <ArrowUpDown className="size-3.5 hover:text-slate-600" />
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, rIdx) => (
              <TableRow
                key={rIdx}
                className="border-b border-slate-100 hover:bg-transparent"
              >
                {columns.map((_, cIdx) => (
                  <TableCell key={cIdx} className="py-4 px-3.5">
                    <Skeleton className="h-4 w-3/4 rounded-md bg-slate-200/60" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={columns.length}
                className="py-14 text-center"
              >
                <EmptyState
                  title={emptyTitle}
                  description={emptyDescription}
                  action={emptyAction}
                  className="py-2"
                />
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                onClick={() => onRowClick?.(row.original)}
                className={cn(
                  "transition-colors hover:bg-slate-50/70",
                  onRowClick && "cursor-pointer"
                )}
              >
                {row.getVisibleCells().map((cell) => {
                  const isActions = cell.column.id === "actions" || cell.column.id === "quickAction";
                  const colAlign = getColumnAlign(cell.column.columnDef.meta);
                  const centered = colAlign === "center" && !isActions;
                  const rendered = flexRender(
                    cell.column.columnDef.cell,
                    cell.getContext()
                  );
                  return (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "py-3.5 px-3.5",
                        isActions && "text-right",
                        colAlign === "right" && "text-right"
                      )}
                    >
                      {centered ? (
                        <div className="flex w-full justify-center">
                          {rendered}
                        </div>
                      ) : (
                        rendered
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

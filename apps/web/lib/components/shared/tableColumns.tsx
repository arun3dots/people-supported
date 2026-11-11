"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";
import type { ColumnDef, CellContext } from "@tanstack/react-table";
import {
  BadgeCell,
  CountCell,
  CurrencyCell,
  DateCell,
  IndexCell,
  PersonCell,
  ReferenceCell,
  TextCell,
} from "./tableCells";

/* ------------------------------------------------------------------ */
/* Declarative (kind-based) column schema                             */
/* ------------------------------------------------------------------ */

export type BadgeState = "success" | "info" | "warning" | "danger" | "inactive";
export type TextTone = "default" | "secondary" | "muted" | "clamped" | "strong";

export interface KindColumnBase<T> {
  id?: string;
  header?: string | (() => React.ReactNode);
  enableSorting?: boolean;
  /** Cell + header alignment. Defaults to left. */
  align?: "left" | "center" | "right";
  /** Resolve the raw value for the cell instead of reading accessorKey. */
  getValue?: (row: T) => unknown;
  meta?: Record<string, unknown>;
}

export type KindColumn<T> =
  | (KindColumnBase<T> & { kind: "index" })
  | (KindColumnBase<T> & {
      kind: "text";
      accessorKey: string;
      tone?: TextTone;
      fallback?: string;
      truncate?: boolean;
      className?: string;
    })
  | (KindColumnBase<T> & {
      kind: "date";
      accessorKey?: string;
      fallback?: string;
      /** date-fns format string, defaults to "dd MMM yyyy" */
      format?: string;
      /** Render larger primary text (sm/slate-700). */
      emphasized?: boolean;
    })
  | (KindColumnBase<T> & {
      kind: "currency";
      accessorKey?: string;
      currencyCode?: "GBP" | "USD";
      /** Resolve currency per-row (overrides currencyCode when set). */
      getCurrencyCode?: (row: T) => "GBP" | "USD";
      /** Render emerald income color. */
      accent?: boolean;
      fallback?: string;
    })
  | (KindColumnBase<T> & {
      kind: "reference";
      accessorKey?: string;
      fallback?: string;
      /** Transform the raw value before rendering (e.g. `v0001` pill). */
      getLabel?: (row: T) => string;
    })
  | (KindColumnBase<T> & {
      kind: "badge";
      accessorKey?: string;
      getState?: (row: T) => BadgeState;
      state?: BadgeState;
      getLabel?: (row: T) => string;
      fallback?: string;
    })
  | (KindColumnBase<T> & {
      kind: "count";
      accessorKey?: string;
      /** Optional leading icon (e.g. BedDouble). */
      icon?: LucideIcon;
      fallback?: string;
    })
  | (KindColumnBase<T> & {
      kind: "person";
      /** Accessor used only for sorting / row identity (e.g. "firstName") */
      accessorKey?: string;
      /** Renders an avatar when true (default). Set false for a two-line stack. */
      avatar?: boolean;
      /** Optional status dot colour class rendered before the title. */
      dotColor?: (row: T) => string;
      /** Primary line. Defaults to the accessor value when omitted. */
      getTitle?: (row: T) => string;
      /** Secondary subtitle line. Optional. */
      getSubtitle?: (row: T) => string | null | undefined;
      /** Avatar letter(s). Defaults to first character of the title. */
      getInitials?: (row: T) => string;
      /** Optional avatar image URL (e.g. resident photo). Falls back to initials. */
      getImageUrl?: (row: T) => string | null | undefined;
      /** Override avatar wrapper classes. */
      avatarClassName?: string;
      /** Override avatar fallback (letter) classes. */
      fallbackClassName?: string;
      maxWidthClassName?: string;
    });

/** A DataTable column is either a raw TanStack column (full custom control)
 * or a declarative kind column whose cell UI is rendered centrally. */
export type TableColumn<T> = ColumnDef<T, unknown> | KindColumn<T>;

export function isKindColumn<T>(col: TableColumn<T>): col is KindColumn<T> {
  return (
    typeof col === "object" &&
    col !== null &&
    "kind" in col &&
    (col as { kind?: string }).kind !== undefined
  );
}

function readValue<T>(col: KindColumn<T>, row: T): unknown {
  if (col.getValue) {
    return col.getValue(row);
  }
  if ("accessorKey" in col && col.accessorKey) {
    const key = col.accessorKey;
    const rec = row as unknown as Record<string, unknown>;
    return rec[key];
  }
  return undefined;
}

/* ------------------------------------------------------------------ */
/* Build a raw TanStack ColumnDef from a declarative kind column       */
/* ------------------------------------------------------------------ */

function buildColumn<T>(spec: KindColumn<T>, rowIndexOffset: number): ColumnDef<T, unknown> {
  const id = spec.id ?? ("accessorKey" in spec && spec.accessorKey ? spec.accessorKey : "col");
  const header = spec.header ?? (spec.kind === "index" ? "#" : "");
  const enableSorting = spec.enableSorting;
  const align = spec.align;
  const meta: Record<string, unknown> | undefined =
    align || (spec.meta && Object.keys(spec.meta).length > 0)
      ? { ...spec.meta, ...(align ? { align } : {}) }
      : undefined;

  const cell: (ctx: CellContext<T, unknown>) => React.ReactNode = (ctx) => {
    const row = ctx.row.original;
    const value = readValue(spec, row);
    switch (spec.kind) {
      case "index":
        return <IndexCell rowIndex={rowIndexOffset + ctx.row.index + 1} />;
      case "text":
        return (
          <TextCell
            value={value}
            tone={spec.tone}
            fallback={spec.fallback}
            truncate={spec.truncate}
            className={spec.className}
          />
        );
      case "date":
        return (
          <DateCell
            value={value}
            fallback={spec.fallback}
            format={spec.format}
            emphasized={spec.emphasized}
          />
        );
      case "currency": {
        const code =
          spec.getCurrencyCode?.(row) ?? spec.currencyCode ?? "GBP";
        return (
          <CurrencyCell
            value={value}
            currencyCode={code}
            accent={spec.accent}
            fallback={spec.fallback}
          />
        );
      }
      case "reference": {
        const label =
          spec.getLabel?.(row) ??
          (value == null || value === "" ? "" : String(value));
        return <ReferenceCell value={label} fallback={spec.fallback} />;
      }
      case "count":
        return <CountCell value={value} icon={spec.icon} fallback={spec.fallback} />;
      case "badge": {
        const rawLabel = spec.getValue ? (spec.getValue(row) as string) : value;
        const label =
          spec.getLabel?.(row) ??
          (rawLabel == null || rawLabel === ""
            ? spec.fallback ?? "—"
            : String(rawLabel));
        const state = spec.getState?.(row) ?? spec.state ?? "info";
        return <BadgeCell label={label} state={state} />;
      }
      case "person": {
        const title =
          spec.getTitle?.(row) ??
          (value == null || value === "" ? "—" : String(value));
        const subtitle = spec.getSubtitle?.(row);
        const initials = spec.getInitials?.(row);
        const imageUrl = spec.getImageUrl?.(row);
        return (
          <PersonCell
            title={title}
            subtitle={subtitle}
            initials={initials}
            avatar={spec.avatar}
            dotColor={spec.dotColor?.(row)}
            imageUrl={imageUrl}
            avatarClassName={spec.avatarClassName}
            fallbackClassName={spec.fallbackClassName}
            maxWidthClassName={spec.maxWidthClassName}
          />
        );
      }
      default:
        return null;
    }
  };

  if (spec.kind === "index") {
    return { id, header, cell, enableSorting: false, meta };
  }

  const accessorKey = "accessorKey" in spec ? spec.accessorKey : undefined;
  return {
    id,
    ...(accessorKey ? { accessorKey } : {}),
    header,
    enableSorting,
    cell,
    meta,
  };
}

/** Normalize a mixed array (raw ColumnDef + declarative kind columns)
 * into pure TanStack ColumnDefs so DataTable can render everything. */
export function normalizeColumns<T>(
  columns: TableColumn<T>[],
  rowIndexOffset = 0,
): ColumnDef<T, unknown>[] {
  return columns.map((col) => (isKindColumn(col) ? buildColumn(col, rowIndexOffset) : col));
}

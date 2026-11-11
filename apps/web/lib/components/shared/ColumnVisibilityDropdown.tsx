"use client";

import { useState } from "react";
import { SlidersHorizontal, Search, RotateCcw, Lock } from "lucide-react";
import {
  Button,
  Text,
  Checkbox,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";

export interface ColumnVisibilityItem {
  id: string;
  label: string;
  isMandatory?: boolean;
}

export interface ColumnVisibilityDropdownProps {
  columns: ColumnVisibilityItem[];
  visibleColumnIds: string[];
  defaultVisibleColumnIds?: string[];
  onApply: (selectedIds: string[]) => void;
  className?: string;
}

export function ColumnVisibilityDropdown({
  columns,
  visibleColumnIds,
  defaultVisibleColumnIds,
  onApply,
  className,
}: ColumnVisibilityDropdownProps) {
  const [open, setOpen] = useState(false);
  const [draftIds, setDraftIds] = useState<string[]>(visibleColumnIds);
  const [searchQuery, setSearchQuery] = useState("");

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setDraftIds(visibleColumnIds);
      setSearchQuery("");
    }
    setOpen(nextOpen);
  };

  const toggleDraft = (columnId: string, isMandatory?: boolean) => {
    if (isMandatory) return;

    setDraftIds((prev) => {
      if (prev.includes(columnId)) {
        if (prev.length <= 1) return prev;
        return prev.filter((id) => id !== columnId);
      }
      return [...prev, columnId];
    });
  };

  const handleReset = () => {
    const defaultIds =
      defaultVisibleColumnIds ?? columns.map((col) => col.id);
    setDraftIds(defaultIds);
  };

  const handleApply = () => {
    onApply(draftIds);
    setOpen(false);
  };

  const filteredColumns = columns.filter((col) =>
    col.label.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 h-8 rounded-xl bg-white border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 text-md font-semibold text-slate-700 transition-all cursor-pointer shadow-xs",
            className,
          )}
        >
          <SlidersHorizontal className="size-3.5 text-emerald-800" />
          <Text variant="secondary" size="md">Columns</Text>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={6}
        className="w-64 p-3 bg-white rounded-2xl shadow-xl border border-slate-200/90 z-50 animate-in fade-in-0 zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="pb-2 mb-2 border-b border-slate-100">
          <Text size="md" weight="bold" className="text-slate-900 leading-tight">
            Columns to Show
          </Text>
        </div>

        {/* Search Field */}
        <div className="relative mb-2">
          <Search className="size-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search columns..."
            className="h-8 w-full pl-8 pr-3 text-md bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-slate-300 transition-colors placeholder:text-slate-400 text-slate-900"
          />
        </div>

        {/* Checkbox List */}
        <div className="flex flex-col gap-1 max-h-56 overflow-y-auto py-1 pr-1">
          {filteredColumns.length > 0 ? (
            filteredColumns.map((col) => {
              const isChecked = draftIds.includes(col.id);
              const isMandatory = Boolean(col.isMandatory);

              return (
                <label
                  key={col.id}
                  className={cn(
                    "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-md font-medium transition-colors cursor-pointer select-none",
                    isMandatory
                      ? "text-slate-400 bg-slate-50/60 cursor-not-allowed"
                      : isChecked
                        ? "text-slate-900 hover:bg-slate-100/80"
                        : "text-slate-500 hover:bg-slate-50",
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Checkbox
                      id={`col-toggle-${col.id}`}
                      checked={isChecked}
                      disabled={isMandatory}
                      onCheckedChange={() => toggleDraft(col.id, isMandatory)}
                      className={cn(
                        "size-4 rounded-[4px]",
                        isMandatory && "opacity-50 cursor-not-allowed",
                      )}
                    />
                    <span>{col.label}</span>
                  </div>

                  {isMandatory && (
                    <div className="flex items-center gap-1 text-md text-slate-400 font-normal">
                      <Lock className="size-3" />
                      <span>Always</span>
                    </div>
                  )}
                </label>
              );
            })
          ) : (
            <div className="py-4 text-center text-md text-slate-400">
              No columns match &quot;{searchQuery}&quot;
            </div>
          )}
        </div>

        {/* Bottom Actions: Reset & OK */}
        <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="h-8 px-3 text-md rounded-xl hover:bg-slate-50 cursor-pointer"
          >
            <RotateCcw className="size-3 mr-1 text-slate-500" />
            Reset
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleApply}
            className="h-8 px-4 text-md rounded-xl cursor-pointer"
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

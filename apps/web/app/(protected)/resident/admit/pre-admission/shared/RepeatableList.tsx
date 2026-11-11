"use client";

import type { ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button, Text } from "@repo/ui/components/ui";

interface RepeatableListProps<T> {
  items: T[];
  onChange: (items: T[]) => void;
  newItem: () => T;
  addLabel: string;
  emptyText?: string;
  renderItem: (item: T, update: (patch: Partial<T>) => void, index: number) => ReactNode;
}

/** Add/remove rows editor shared by the contact, allergy, medicine and consent lists. */
export function RepeatableList<T>({
  items,
  onChange,
  newItem,
  addLabel,
  emptyText,
  renderItem,
}: RepeatableListProps<T>) {
  const update = (index: number, patch: Partial<T>) =>
    onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)));

  return (
    <div className="space-y-3">
      {items.length === 0 && emptyText && (
        <Text size="sm" className="text-slate-600">
          {emptyText}
        </Text>
      )}
      {items.map((item, index) => (
        <div
          key={index}
          className="relative rounded-xl bg-white p-4 pr-12 border border-slate-200/80"
        >
          {renderItem(item, (patch) => update(index, patch), index)}
          <button
            type="button"
            aria-label="Remove"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
            className="absolute right-3 top-3 p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => onChange([...items, newItem()])}
        className="rounded-xl font-semibold shadow-none"
      >
        <Plus className="size-4" />
        {addLabel}
      </Button>
    </div>
  );
}

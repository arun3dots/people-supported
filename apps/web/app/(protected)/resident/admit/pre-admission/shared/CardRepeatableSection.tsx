"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Plus } from "lucide-react";
import { Button, Text } from "@repo/ui/components/ui";

interface CardRepeatableSectionProps<T> {
  title?: string;
  description?: string;
  items: T[];
  onChange: (items: T[]) => void;
  addLabel: string;
  emptyTitle: string;
  emptyDescription?: string;
  icon: LucideIcon;
  renderCard: (
    item: T,
    onEdit: () => void,
    onDelete: () => void,
    index: number,
  ) => ReactNode;
  renderForm: (
    item: T,
    onPatch: (patch: Partial<T>) => void,
    onSave: () => void,
    onCancel: () => void,
    isNew: boolean,
  ) => ReactNode;
  newItem: () => T;
  validateSave?: (item: T) => boolean;
  isItemBlank?: (item: T) => boolean;
  errorMessage?: string;
}

export function CardRepeatableSection<T>({
  title,
  description,
  items,
  onChange,
  addLabel,
  emptyTitle,
  emptyDescription,
  icon: EmptyIcon,
  renderCard,
  renderForm,
  newItem,
  validateSave,
  isItemBlank,
  errorMessage,
}: CardRepeatableSectionProps<T>) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draftItem, setDraftItem] = useState<T | null>(null);

  // If there's an item that was initialized completely blank, automatically open it in edit mode
  useEffect(() => {
    if (editingIndex === null && !isAdding && isItemBlank) {
      const blankIdx = items.findIndex((it) => isItemBlank(it));
      if (blankIdx !== -1) {
        setEditingIndex(blankIdx);
        setDraftItem(items[blankIdx] ?? null);
      }
    }
  }, [items, editingIndex, isAdding, isItemBlank]);

  const handleStartAdd = () => {
    setEditingIndex(null);
    setDraftItem(newItem());
    setIsAdding(true);
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setDraftItem(null);
  };

  const handleSaveAdd = () => {
    if (!draftItem) return;
    if (validateSave && !validateSave(draftItem)) return;
    onChange([...items, draftItem]);
    setIsAdding(false);
    setDraftItem(null);
  };

  const handleStartEdit = (index: number) => {
    setIsAdding(false);
    setEditingIndex(index);
    setDraftItem(items[index] ?? null);
  };

  const handleCancelEdit = (index: number) => {
    // If the item was completely blank and cancelled, remove it so it doesn't linger as a broken card
    if (isItemBlank && items[index] && isItemBlank(items[index]!)) {
      onChange(items.filter((_, i) => i !== index));
    }
    setEditingIndex(null);
    setDraftItem(null);
  };

  const handleSaveEdit = (index: number) => {
    if (!draftItem) return;
    if (validateSave && !validateSave(draftItem)) return;
    const updated = items.map((it, i) => (i === index ? draftItem : it));
    onChange(updated);
    setEditingIndex(null);
    setDraftItem(null);
  };

  const handleDelete = (index: number) => {
    if (editingIndex === index) {
      setEditingIndex(null);
      setDraftItem(null);
    }
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3 font-sans">
      {(title || description || !isAdding) && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            {title && (
              <Text as="h4" size="md" weight="bold" className="text-slate-800">
                {title}
              </Text>
            )}
            {description && (
              <Text size="sm" className="text-slate-600 mt-0.5">
                {description}
              </Text>
            )}
          </div>
          {!isAdding && editingIndex === null && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleStartAdd}
              className="gap-1.5 rounded-xl font-semibold text-sm shadow-none"
            >
              <Plus className="size-4" />
              {addLabel}
            </Button>
          )}
        </div>
      )}

      {errorMessage && (
        <p className="text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
          {errorMessage}
        </p>
      )}

      {/* Adding Form */}
      {isAdding && draftItem && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
            <Text size="md" weight="bold" className="text-slate-800">
              {addLabel}
            </Text>
          </div>
          {renderForm(
            draftItem,
            (patch) => setDraftItem((prev) => (prev ? { ...prev, ...patch } : prev)),
            handleSaveAdd,
            handleCancelAdd,
            true,
          )}
        </div>
      )}

      {/* Cards List */}
      <div className="space-y-3">
        {items.map((item, index) => {
          if (editingIndex === index && draftItem) {
            return (
              <div
                key={index}
                className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3.5 animate-in fade-in duration-150"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                  <Text size="md" weight="bold" className="text-slate-800">
                    Edit {title ? title.replace(/^B ·\s*/, "") : "Record"}
                  </Text>
                </div>
                {renderForm(
                  draftItem,
                  (patch) => setDraftItem((prev) => (prev ? { ...prev, ...patch } : prev)),
                  () => handleSaveEdit(index),
                  () => handleCancelEdit(index),
                  false,
                )}
              </div>
            );
          }

          return (
            <div key={index}>
              {renderCard(
                item,
                () => handleStartEdit(index),
                () => handleDelete(index),
                index,
              )}
            </div>
          );
        })}

        {/* Empty state when not adding and no items */}
        {items.length === 0 && !isAdding && (
          <div className="py-6 px-4 text-center space-y-2 rounded-xl bg-slate-50/80 border border-dashed border-slate-200">
            <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <EmptyIcon className="size-5" />
            </div>
            <p className="text-md font-semibold text-slate-700">{emptyTitle}</p>
            {emptyDescription && (
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                {emptyDescription}
              </p>
            )}
            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleStartAdd}
                className="gap-1.5 rounded-xl font-semibold text-sm shadow-none"
              >
                <Plus className="size-4" />
                {addLabel}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


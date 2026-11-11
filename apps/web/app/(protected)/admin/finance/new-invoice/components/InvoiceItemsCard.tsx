"use client";

import React from "react";
import {
  Control,
  Controller,
  FieldArrayWithId,
  FieldErrors,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import {
  Button,
  Card,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui/components/ui";
import type { InvoiceItemForm, NewInvoiceFormValues } from "../types";

interface InvoiceItemsCardProps {
  register: UseFormRegister<NewInvoiceFormValues>;
  control: Control<NewInvoiceFormValues>;
  setValue: UseFormSetValue<NewInvoiceFormValues>;
  fields: FieldArrayWithId<NewInvoiceFormValues, "items", "id">[];
  append: UseFieldArrayAppend<NewInvoiceFormValues, "items">;
  remove: UseFieldArrayRemove;
  watchedItems: InvoiceItemForm[];
  errors?: FieldErrors<NewInvoiceFormValues>;
}

export function InvoiceItemsCard({
  register,
  control,
  setValue,
  fields,
  append,
  remove,
  watchedItems,
  errors,
}: InvoiceItemsCardProps) {
  const handleLineItemChange = (
    index: number,
    field: "quantity" | "unitPrice" | "vatRate",
    val: number
  ) => {
    const currentItem = watchedItems[index] || {
      quantity: 1,
      unitPrice: 0,
      vatRate: 0,
    };
    const qty = field === "quantity" ? val : Number(currentItem.quantity || 0);
    const rate = field === "unitPrice" ? val : Number(currentItem.unitPrice || 0);
    const vat = field === "vatRate" ? val : Number(currentItem.vatRate || 0);

    const lineTotal = qty * rate * (1 + vat / 100);

    setValue(`items.${index}.${field}`, val);
    setValue(`items.${index}.total`, Number(lineTotal.toFixed(2)));
  };

  const handleAddItem = () => {
    append({
      description: "",
      category: "",
      quantity: 1,
      unitPrice: 0,
      vatRate: "" as unknown as number,
      total: 0,
    });
  };

  return (
    <TooltipProvider delayDuration={0}>
      <Card className="p-6 flex flex-col gap-6 w-full font-['Outfit',sans-serif]">
      {/* Header matching Staff cards */}
      <div className="w-full flex items-center justify-between">
        <div>
          <Text as="h3" size="sm" weight="medium" className="text-slate-900">
            Invoice Items
          </Text>
          <Text size="sm" weight="regular" className="text-slate-500 mt-0.5">
            Add line items, quantities, and pricing for this invoice
          </Text>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleAddItem}
        >
          <Plus className="size-4 mr-1.5" /> Add Item
        </Button>
      </div>

      {/* Empty State */}
      {fields.length === 0 ? (
        <div className="py-8 px-4 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center gap-2 bg-slate-50/50">
          <Text size="sm" weight="medium" className="text-slate-700">No line items added yet</Text>
          <Text size="sm" weight="regular" className="text-slate-500 max-w-sm">
            Click "+ Add Item" above to add billable services, care fees, or additional items for this invoice.
          </Text>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-1"
            onClick={handleAddItem}
          >
            <Plus className="size-4 mr-1.5" /> Add Item
          </Button>
        </div>
      ) : (
        <div className="w-full overflow-x-auto [&_[data-slot='table-container']]:h-auto">
          <Table className="w-full min-w-[760px] table-fixed border-collapse border-b border-slate-200 [&_[data-slot=input-error]]:hidden">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[34%] px-2">Description</TableHead>
                <TableHead className="w-[20%] px-2">Category</TableHead>
                <TableHead className="w-[10%] px-2">Qty</TableHead>
                <TableHead className="w-[14%] px-2">Unit Price</TableHead>
                <TableHead className="w-[10%] px-2">VAT</TableHead>
                <TableHead className="w-[12%] px-2">Amount</TableHead>
                <TableHead className="w-12 px-1 text-center"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, idx) => {
                const item = watchedItems[idx] || {
                  quantity: 1,
                  unitPrice: 0,
                  vatRate: 0,
                  total: 0,
                };
                const totalCalculated =
                  (Number(item.quantity) || 0) *
                  (Number(item.unitPrice) || 0) *
                  (1 + Number(item.vatRate || 0) / 100);

                const itemError = errors?.items?.[idx];

                return (
                  <TableRow key={field.id} className="align-middle">
                    {/* Description */}
                    <TableCell className="p-2">
                      <Input
                        {...register(`items.${idx}.description` as const, {
                          required: "Description is required",
                        })}
                        placeholder="e.g. Residential Care fees"
                        className="h-10 w-full"
                      />
                      {itemError?.description && (
                        <Text variant="error" size="sm" className="mt-1">
                          {itemError.description.message || "Required"}
                        </Text>
                      )}
                    </TableCell>

                    {/* Category */}
                    <TableCell className="p-2">
                      <Controller
                        name={`items.${idx}.category` as const}
                        control={control}
                        render={({ field: catField }) => (
                          <Select value={catField.value || ""} onValueChange={catField.onChange}>
                            <SelectTrigger className="w-full h-10">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Care Fees">Care Fees</SelectItem>
                              <SelectItem value="Nursing Care">Nursing Care</SelectItem>
                              <SelectItem value="Respite Fees">Respite Fees</SelectItem>
                              <SelectItem value="Consumables">Consumables</SelectItem>
                              <SelectItem value="Equipment">Equipment</SelectItem>
                              <SelectItem value="Extras">Extras</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </TableCell>

                    {/* Quantity */}
                    <TableCell className="p-2">
                      <Input
                        type="number"
                        min="0.01"
                        step="1"
                        value={item.quantity ?? 1}
                        onChange={(e) =>
                          handleLineItemChange(idx, "quantity", Number(e.target.value))
                        }
                        className="h-10 w-full text-center"
                      />
                    </TableCell>

                    {/* Unit Price */}
                    <TableCell className="p-2">
                      <div className="relative h-10 w-full">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-md text-slate-400 font-medium select-none">£</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice ?? 0}
                          onChange={(e) =>
                            handleLineItemChange(idx, "unitPrice", Number(e.target.value))
                          }
                          className="h-10 w-full pl-7"
                        />
                      </div>
                    </TableCell>

                    {/* VAT (%) */}
                    <TableCell className="p-2">
                      <Controller
                        name={`items.${idx}.vatRate` as const}
                        control={control}
                        render={({ field: vatField }) => (
                          <Select
                            value={
                              vatField.value !== undefined &&
                              vatField.value !== null &&
                              String(vatField.value) !== ""
                                ? String(vatField.value)
                                : ""
                            }
                            onValueChange={(v) =>
                              handleLineItemChange(idx, "vatRate", Number(v))
                            }
                          >
                            <SelectTrigger className="w-full h-10">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">0%</SelectItem>
                              <SelectItem value="5">5%</SelectItem>
                              <SelectItem value="20">20%</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </TableCell>

                    {/* Amount */}
                    <TableCell className="p-2">
                      <div className="flex h-10 w-full items-center justify-between rounded-md border border-border-secondary bg-slate-50 px-3 text-sm font-medium text-slate-800">
                        <span className="text-slate-400 select-none mr-1">£</span>
                        <span>
                          {totalCalculated.toLocaleString("en-GB", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </TableCell>

                    {/* Delete */}
                    <TableCell className="p-1 text-center">
                      {fields.length > 1 ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => remove(idx)}
                              className="size-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer mx-auto"
                              aria-label="Delete item"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent
                            sideOffset={6}
                            className="bg-white border border-slate-200/80 text-slate-800 rounded-lg px-2.5 py-1 text-sm font-medium shadow-lg"
                          >
                            Delete item
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <div className="size-8 mx-auto" />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {errors?.items?.message && typeof errors.items.message === "string" && (
        <Text variant="error" size="sm">
          {errors.items.message}
        </Text>
      )}
    </Card>
  </TooltipProvider>
  );
}

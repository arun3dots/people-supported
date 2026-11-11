"use client";

import React, { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import {
  Button,
  Card,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
} from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import type { PropertyRoomDraftDTO } from "@repo/schema";

export const DEFAULT_FACILITY_OPTIONS = [
  "Communal Lounge",
  "Shared Kitchen",
  "Garden / Courtyard",
  "Sensory Room",
  "Staff Sleep-in Room",
  "On-site Parking",
  "Laundry Room",
];

export const DEFAULT_ACCESSIBILITY_OPTIONS = [
  "Wheelchair Accessible",
  "Ground Floor Access",
  "Level Access Wet Room",
  "Ceiling Track Hoist",
  "Wider Doorways",
  "Assistive Technology",
  "Visual / Hearing Alerts",
];

interface TagMultiSelectProps {
  label: string;
  presetOptions: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  customPlaceholder: string;
}

export function TagMultiSelect({
  label,
  presetOptions,
  selected,
  onChange,
  customPlaceholder,
}: TagMultiSelectProps) {
  const [customValue, setCustomValue] = useState("");

  const allOptions = Array.from(new Set([...presetOptions, ...selected]));

  const toggleItem = (item: string) => {
    if (selected.includes(item)) {
      onChange(selected.filter((x) => x !== item));
    } else {
      onChange([...selected, item]);
    }
  };

  const handleAddCustom = () => {
    const trimmed = customValue.trim();
    if (!trimmed) return;
    if (!selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
    }
    setCustomValue("");
  };

  return (
    <div className="space-y-2">
      <Label className="text-md font-medium text-slate-700 block">
        {label}
      </Label>
      <div className="flex flex-wrap gap-2">
        {allOptions.map((item) => {
          const isSelected = selected.includes(item);
          return (
            <button
              key={item}
              type="button"
              onClick={() => toggleItem(item)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-md font-medium border transition-all cursor-pointer",
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-surface-card-grey text-slate-700 border-slate-200 hover:bg-slate-100",
              )}
            >
              <span>{item}</span>
              {isSelected && <X className="size-3" />}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2 pt-1 [&_[data-slot=input-error]]:hidden">
        <Input
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddCustom();
            }
          }}
          placeholder={customPlaceholder}
          className="h-9 text-md bg-white"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddCustom}
          className="h-9 shrink-0 gap-1"
        >
          <Plus className="size-3.5" /> Add
        </Button>
      </div>
    </div>
  );
}

interface AddPropertyRoomsSectionProps {
  rooms: PropertyRoomDraftDTO[];
  onChangeRooms: (rooms: PropertyRoomDraftDTO[]) => void;
}

export function AddPropertyRoomsSection({
  rooms,
  onChangeRooms,
}: AddPropertyRoomsSectionProps) {
  const updateRoom = (
    index: number,
    patch: Partial<PropertyRoomDraftDTO>,
  ) => {
    const next = rooms.map((r, i) => (i === index ? { ...r, ...patch } : r));
    onChangeRooms(next);
  };

  const addRoomRow = () => {
    const idx = rooms.length + 1;
    onChangeRooms([
      ...rooms,
      {
        roomNumber: `Flat ${idx}`,
        name: `Flat ${idx}`,
        type: "Single",
        floor: idx <= 2 ? "Ground floor" : "First floor",
        weeklyRent: 158,
        isAccessible: idx === 1,
        bedsCount: 1,
      },
    ]);
  };

  const removeRoomRow = (index: number) => {
    if (rooms.length <= 1) return;
    onChangeRooms(rooms.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3 pt-2 border-t border-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <Text size="md" weight="semibold" className="text-slate-900">
            Rooms, Flats &amp; Bed Allocation ({rooms.length})
          </Text>
          <Text size="md" variant="muted">
            Each unit creates a Room and its corresponding Beds for tenancy
            assignment.
          </Text>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRoomRow}
          className="gap-1.5"
        >
          <Plus className="size-3.5" /> Add Room / Flat
        </Button>
      </div>

      <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
        {rooms.map((room, idx) => (
          <Card
            key={idx}
            variant="surface"
            border="secondary"
            className="grid grid-cols-12 gap-2 items-center p-3 rounded-xl [&_[data-slot=input-error]]:hidden"
          >
            <div className="col-span-3">
              <label className="text-md font-medium text-slate-600 block mb-0.5">
                Unit / Room Name
              </label>
              <Input
                value={room.roomNumber}
                onChange={(e) =>
                  updateRoom(idx, {
                    roomNumber: e.target.value,
                    name: e.target.value,
                  })
                }
                placeholder="e.g. Flat 1"
                className="h-9 bg-white text-md"
              />
            </div>

            <div className="col-span-3">
              <label className="text-md font-medium text-slate-600 block mb-0.5">
                Floor
              </label>
              <Select
                value={room.floor || "Ground floor"}
                onValueChange={(val) => updateRoom(idx, { floor: val })}
              >
                <SelectTrigger className="h-9 bg-white text-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="Ground floor">Ground floor</SelectItem>
                  <SelectItem value="First floor">First floor</SelectItem>
                  <SelectItem value="Second floor">Second floor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <label className="text-md font-medium text-slate-600 block mb-0.5">
                Rent (£/wk)
              </label>
              <Input
                type="number"
                min={0}
                step="0.5"
                value={room.weeklyRent ?? ""}
                onChange={(e) =>
                  updateRoom(idx, {
                    weeklyRent: e.target.value ? Number(e.target.value) : 0,
                  })
                }
                placeholder="158.00"
                className="h-9 bg-white text-md"
              />
            </div>

            <div className="col-span-2">
              <label className="text-md font-medium text-slate-600 block mb-0.5">
                Beds
              </label>
              <Input
                type="number"
                min={1}
                max={6}
                value={room.bedsCount ?? 1}
                onChange={(e) =>
                  updateRoom(idx, {
                    bedsCount: Math.max(1, Number(e.target.value) || 1),
                  })
                }
                className="h-9 bg-white text-md"
              />
            </div>

            <div className="col-span-2 flex items-center justify-between pt-4 pl-1">
              <label className="inline-flex items-center gap-1.5 text-md font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(room.isAccessible)}
                  onChange={(e) =>
                    updateRoom(idx, { isAccessible: e.target.checked })
                  }
                  className="rounded border-slate-300 text-primary focus:ring-primary"
                />
                Accessible
              </label>
              {rooms.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRoomRow(idx)}
                  className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                  title="Remove unit"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import {
  Label,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui";
import { RELATIONSHIP_OPTIONS } from "../../data/relationshipOptions";

interface RelationshipSelectProps {
  label?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function RelationshipSelect({
  label = "Relationship",
  required = false,
  value,
  onChange,
  placeholder = "Select",
  error,
  disabled = false,
  className = "space-y-1.5 [&_[data-slot=input-error]]:hidden",
}: RelationshipSelectProps) {
  const isStandardOption = (RELATIONSHIP_OPTIONS as readonly string[]).includes(value) && value !== "Other";

  const [isOtherSelected, setIsOtherSelected] = useState<boolean>(() => {
    return !isStandardOption && Boolean(value);
  });

  const [customValue, setCustomValue] = useState<string>(() => {
    return isStandardOption ? "" : value === "Other" ? "" : value;
  });

  useEffect(() => {
    if (isStandardOption) {
      setIsOtherSelected(false);
      setCustomValue("");
    } else if (value) {
      setIsOtherSelected(true);
      if (value !== "Other") {
        setCustomValue(value);
      }
    }
  }, [value, isStandardOption]);

  const handleSelectChange = (val: string) => {
    if (val === "Other") {
      setIsOtherSelected(true);
      onChange(customValue || "Other");
    } else {
      setIsOtherSelected(false);
      onChange(val);
    }
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomValue(val);
    onChange(val || "Other");
  };

  return (
    <div className={className}>
      {label && <Label required={required} >{label}</Label>}
      <Select
        value={isOtherSelected ? "Other" : value || ""}
        onValueChange={handleSelectChange}
        disabled={disabled}
      >
        <SelectTrigger >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {RELATIONSHIP_OPTIONS.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isOtherSelected && (
        <div className="pt-2">
          <Input
            type="text"
            placeholder="Please specify relationship..."
            value={customValue}
            onChange={handleCustomChange}
            disabled={disabled}
          />
        </div>
      )}

      {error && <p className="text-md text-red-600 mt-1 leading-tight">{error}</p>}
    </div>
  );
}

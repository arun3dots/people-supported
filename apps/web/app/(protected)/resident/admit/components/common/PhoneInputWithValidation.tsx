"use client";

import React, { useState } from "react";
import { Label, Input } from "@repo/ui/components/ui";
import { getPhoneValidationError } from "../../utils/phoneValidation";

interface PhoneInputWithValidationProps {
  label?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  helperText?: string;
}

export function PhoneInputWithValidation({
  label = "Phone Number",
  required = false,
  value,
  onChange,
  placeholder = "e.g. +44 7700 900077",
  error: externalError,
  disabled = false,
  className = "space-y-1.5 [&_[data-slot=input-error]]:hidden",
  helperText,
}: PhoneInputWithValidationProps) {
  const [touched, setTouched] = useState(false);

  const validationError = touched ? getPhoneValidationError(value, required, label) : null;
  const activeError = externalError || validationError;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleBlur = () => {
    setTouched(true);
  };

  return (
    <div className={className}>
      {label && <Label required={required} >{label}</Label>}
      <Input
        type="tel"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        className={` ${activeError ? "border-red-500 focus:ring-red-500" : "focus:ring-1 focus:ring-emerald-800"
          }`}
      />
      {activeError ? (
        <p className="text-sm text-red-600 mt-1 leading-tight">{activeError}</p>
      ) : helperText ? (
        <p className="text-sm text-slate-500 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
}

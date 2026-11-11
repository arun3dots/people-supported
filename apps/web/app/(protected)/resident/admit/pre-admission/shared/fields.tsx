"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { Clock, ChevronDown } from "lucide-react";
import {
  Checkbox,
  DatePicker,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";

type Maybe = string | null | undefined;
const WRAP = "space-y-1.5 [&_[data-slot=input-error]]:hidden";

interface BaseProps {
  label: string;
  required?: boolean;
  className?: string;
  errorMessage?: string;
}

const HOURS_24 = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES_5MIN = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

/**
 * Clean 24-Hour Time Selector (HH:mm)
 * Single unified trigger box bringing hour and minute together with a compact 24-hour picker popover.
 */
export function TimeField({
  label,
  required,
  className,
  disabled,
  value,
  onChange,
  placeholder = "Select time",
  errorMessage,
}: BaseProps & {
  value: Maybe;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const parts = (value || "").split(":");
  const currentHour = parts[0] && parts[0].length > 0 ? parts[0].padStart(2, "0") : "";
  const currentMin = parts[1] && parts[1].length > 0 ? parts[1].padStart(2, "0") : "";

  const minuteOptions = useMemo(() => {
    if (currentMin && !MINUTES_5MIN.includes(currentMin)) {
      return [...MINUTES_5MIN, currentMin].sort();
    }
    return MINUTES_5MIN;
  }, [currentMin]);

  const handleHourClick = (h: string) => onChange(`${h}:${currentMin || "00"}`);
  const handleMinClick = (m: string) => {
    onChange(`${currentHour || "07"}:${m}`);
    setOpen(false);
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label required={required}>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "h-10 w-full rounded-xl border border-border-secondary bg-white px-3 flex items-center justify-between text-left transition-colors cursor-pointer",
              "hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4A706A]/20 focus:border-[#4A706A]",
              disabled && "opacity-60 cursor-not-allowed",
              errorMessage && "border-border-error",
            )}
          >
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-slate-400 shrink-0" />
              <span className={cn("text-md", value ? "font-semibold text-slate-900" : "text-slate-400")}>
                {value || placeholder}
              </span>
            </div>
            <ChevronDown className="size-4 text-slate-400 shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-48 p-2 bg-white rounded-xl shadow-lg border border-slate-200 z-50">
          <div className="grid grid-cols-2 text-md font-semibold text-slate-500 pb-1.5 mb-1 border-b border-slate-100 text-center">
            <span>Hour</span>
            <span>Minute</span>
          </div>
          <div className="grid grid-cols-2 gap-1 h-44">
            <div className="overflow-y-auto pr-1 space-y-0.5">
              {HOURS_24.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => handleHourClick(h)}
                  className={cn(
                    "w-full text-center py-1 rounded-md text-md transition-colors cursor-pointer",
                    currentHour === h ? "bg-[#4A706A] text-white font-bold" : "text-slate-700 hover:bg-slate-100",
                  )}
                >
                  {h}
                </button>
              ))}
            </div>
            <div className="overflow-y-auto pr-1 space-y-0.5 border-l border-slate-100 pl-1">
              {minuteOptions.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleMinClick(m)}
                  className={cn(
                    "w-full text-center py-1 rounded-md text-md transition-colors cursor-pointer",
                    currentMin === m ? "bg-[#4A706A] text-white font-bold" : "text-slate-700 hover:bg-slate-100",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {errorMessage && <p className="text-md text-text-error font-normal leading-tight mt-1">{errorMessage}</p>}
    </div>
  );
}

export function TextField({
  label,
  required,
  className,
  disabled,
  value,
  onChange,
  placeholder,
  type = "text",
  errorMessage,
  step,
  min,
  max,
}: BaseProps & {
  value: Maybe;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "number" | "time";
  step?: string | number;
  min?: string | number;
  max?: string | number;
  disabled?: boolean;
}) {
  if (type === "time") {
    return (
      <TimeField
        label={label}
        required={required}
        className={className}
        disabled={disabled}
        value={value}
        onChange={onChange}
        placeholder={placeholder ?? "Select time"}
        errorMessage={errorMessage}
      />
    );
  }

  return (
    <div className={cn("space-y-1.5", !errorMessage && "[&_[data-slot=input-error]]:hidden", className)}>
      <Label required={required}>{label}</Label>
      <Input
        type={type}
        placeholder={placeholder}
        value={value ?? ""}
        errorMessage={errorMessage}
        step={step}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function TextAreaField({
  label,
  required,
  className,
  disabled,
  value,
  onChange,
  placeholder,
  errorMessage,
}: BaseProps & {
  value: Maybe;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label required={required}>{label}</Label>
      <Textarea
        placeholder={placeholder}
        value={value ?? ""}
        disabled={disabled}
        className={errorMessage ? "border-border-error" : ""}
        onChange={(e) => onChange(e.target.value)}
      />
      {errorMessage && <p className="text-md text-text-error font-normal leading-tight mt-1">{errorMessage}</p>}
    </div>
  );
}

export function SelectField({
  label,
  required,
  className,
  disabled,
  value,
  onChange,
  options,
  placeholder = "Select",
  errorMessage,
}: BaseProps & {
  value: Maybe;
  onChange: (v: string) => void;
  options: readonly string[];
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label required={required}>{label}</Label>
      <Select value={value ?? ""} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className={errorMessage ? "border-border-error" : ""}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>{o}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {errorMessage && <p className="text-md text-text-error font-normal leading-tight mt-1">{errorMessage}</p>}
    </div>
  );
}

export function DateField({
  label,
  required,
  className,
  disabled,
  value,
  onChange,
  dob,
  errorMessage,
}: BaseProps & {
  value: Maybe;
  onChange: (v: string) => void;
  dob?: boolean;
  disabled?: boolean;
}) {
  const handle = (date: Date | undefined) => onChange(date ? format(date, "yyyy-MM-dd") : "");
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label required={required}>{label}</Label>
      <DatePicker variant={dob ? "dob" : "date"} value={value ?? ""} onChange={handle} disabled={disabled} />
      {errorMessage && <p className="text-md text-text-error font-normal leading-tight mt-1">{errorMessage}</p>}
    </div>
  );
}

/** Comma separated list stored as string[]. Supports interactive comma typing without stripping. */
export function ListField({
  label,
  className,
  value,
  onChange,
  placeholder,
}: BaseProps & {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [text, setText] = useState(() => value.join(", "));

  useEffect(() => {
    const formatted = value.join(", ");
    const currentParsed = text.split(",").map((s) => s.trim()).filter(Boolean).join(", ");
    if (formatted !== currentParsed) {
      setText(formatted);
    }
  }, [value]);

  const handleChange = (newVal: string) => {
    setText(newVal);
    onChange(newVal.split(",").map((s) => s.trim()).filter(Boolean));
  };

  const handleBlur = () => {
    const parsed = text.split(",").map((s) => s.trim()).filter(Boolean);
    setText(parsed.join(", "));
  };

  return (
    <div className={cn(WRAP, className)}>
      <Label>{label}</Label>
      <Input
        type="text"
        placeholder={placeholder}
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
      />
    </div>
  );
}

export function CheckField({
  label,
  className,
  checked,
  onChange,
  disabled,
}: BaseProps & { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <Label className={cn("gap-2 cursor-pointer pt-6", disabled && "cursor-not-allowed opacity-60", className)}>
      <Checkbox checked={checked} disabled={disabled} onCheckedChange={(v) => onChange(v === true)} />
      <span>{label}</span>
    </Label>
  );
}

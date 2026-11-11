"use client";

import * as React from "react";
import { DateRange } from "react-day-picker";
import {
  DateOfBirthPicker,
  type DateOfBirthPickerProps,
} from "./DateOfBirthPicker";
import { DateTimePicker, type DateTimePickerProps } from "./DateTimePicker";
import { DateRangePicker, type DateRangePickerProps } from "./DateRangePicker";
import {
  StandardDatePicker,
  type SingleDatePickerProps,
} from "./StandardDatePicker";

export type DatePickerVariant =
  | "date"
  | "dob"
  | "date-of-birth"
  | "datetime"
  | "date-time"
  | "range"
  | "date-range";

export type DatePickerProps =
  | (SingleDatePickerProps & { variant?: "date" })
  | (DateOfBirthPickerProps & { variant: "dob" | "date-of-birth" })
  | (DateTimePickerProps & { variant: "datetime" | "date-time" })
  | (DateRangePickerProps & { variant: "range" | "date-range" });

export function DatePicker(props: DatePickerProps) {
  const { variant = "date" } = props;

  if (variant === "dob" || variant === "date-of-birth") {
    return <DateOfBirthPicker {...(props as DateOfBirthPickerProps)} />;
  }

  if (variant === "datetime" || variant === "date-time") {
    return <DateTimePicker {...(props as DateTimePickerProps)} />;
  }

  if (variant === "range" || variant === "date-range") {
    return <DateRangePicker {...(props as DateRangePickerProps)} />;
  }

  return <StandardDatePicker {...(props as SingleDatePickerProps)} />;
}

// Re-exports
export {
  StandardDatePicker,
  DateOfBirthPicker,
  DateTimePicker,
  DateRangePicker,
};
export type {
  SingleDatePickerProps,
  DateOfBirthPickerProps,
  DateTimePickerProps,
  DateRangePickerProps,
  DateRange,
};
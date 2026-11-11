"use client";

import { CalendarIcon } from "lucide-react";
import DatePicker, { DatePickerProps } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export function DateSelector(props: DatePickerProps) {
  return (
    <div className="mt-2 flex w-full justify-between rounded-md border border-primary-200 p-2">
      <div className="relative w-full">
        <DatePicker
          {...props}
          className="w-full outline-none"
          showIcon={false}
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <CalendarIcon className="text-primary-500" />
        </div>
      </div>
    </div>
  );
}

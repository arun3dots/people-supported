import React from "react";
import Select, { Props as SelectProps } from "react-select";

interface MultiSelectProps extends SelectProps {
  label?: string;
}

export function MultiSelect({ label, ...props }: MultiSelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-md font-medium text-slate-700">{label}</label>
      )}
      <Select
        isMulti
        className="basic-multi-select"
        classNamePrefix="select"
        styles={{
          control: (base) => ({
            ...base,
            borderRadius: '0.5rem',
            borderColor: '#e2e8f0',
            boxShadow: 'none',
            '&:hover': {
              borderColor: '#cbd5e1',
            },
          }),
          multiValue: (base) => ({
            ...base,
            backgroundColor: '#f1f5f9',
            borderRadius: '0.25rem',
          }),
          multiValueLabel: (base) => ({
            ...base,
            color: '#475569',
            fontWeight: '500',
          }),
        }}
        {...props}
      />
    </div>
  );
}

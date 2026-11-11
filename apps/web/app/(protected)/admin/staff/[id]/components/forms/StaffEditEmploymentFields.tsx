"use client";

import React from "react";
import {
  Controller,
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";
import { format } from "date-fns";
import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  DatePicker,
} from "@repo/ui/components/ui";
import { type UpdateStaffDTO } from "@repo/schema";

interface StaffEditEmploymentFieldsProps {
  control: Control<UpdateStaffDTO>;
  register: UseFormRegister<UpdateStaffDTO>;
  errors: FieldErrors<UpdateStaffDTO>;
  roles?: Array<{ id: string; name: string }>;
  departments?: Array<{ id: string; name: string }>;
  startDateValue?: string | Date | null;
  dbsExpiryDateValue?: string | Date | null;
  setValue: UseFormSetValue<UpdateStaffDTO>;
}

export function StaffEditEmploymentFields({
  control,
  register,
  errors,
  roles,
  departments,
  startDateValue,
  dbsExpiryDateValue,
  setValue,
}: StaffEditEmploymentFieldsProps) {
  const filteredRoles = React.useMemo(
    () =>
      (roles || []).filter(
        (role) =>
          role.name?.toLowerCase() !== "superadmin" &&
          role.name?.toLowerCase() !== "resident"
      ),
    [roles]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label>Role</Label>
        <Controller
          control={control}
          name="roleId"
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value || ""}>
              <SelectTrigger className="w-full border-[#BCD3CD] rounded-xl focus-visible:ring-[#4A706A]">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent className="bg-white rounded-xl">
                {filteredRoles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.roleId && (
          <p className="text-sm text-red-600 mt-1">{errors.roleId.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Department</Label>
        <Controller
          control={control}
          name="department"
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value || ""}>
              <SelectTrigger className="w-full border-[#BCD3CD] rounded-xl focus-visible:ring-[#4A706A]">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent className="bg-white rounded-xl">
                {!departments || departments.length === 0 ? (
                  <div className="px-3 py-2.5 text-center text-sm text-slate-500">
                    No departments found
                  </div>
                ) : (
                  departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}
        />
        {errors.department && (
          <p className="text-sm text-red-600 mt-1">
            {errors.department.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Start Date</Label>
        <DatePicker
          value={startDateValue}
          onChange={(d) => setValue("startDate", d ? format(d, "yyyy-MM-dd") : "")}
          maxDate={new Date()}
          placeholder="Select start date..."
          errorMessage={errors.startDate?.message}
        />
      </div>

      <div className="space-y-1.5">
        <Label>NI Number</Label>
        <Input
          {...register("niNumber")}
          placeholder="QQ123456C"
          errorMessage={errors.niNumber?.message}
          className="rounded-xl border-[#BCD3CD] focus-visible:ring-[#4A706A]"
        />
      </div>

      <div className="space-y-1.5">
        <Label>DBS Number</Label>
        <Input
          {...register("dbsNumber")}
          errorMessage={errors.dbsNumber?.message}
          className="rounded-xl border-[#BCD3CD] focus-visible:ring-[#4A706A]"
        />
      </div>

      <div className="space-y-1.5">
        <Label>DBS Expiry Date</Label>
        <DatePicker
          value={dbsExpiryDateValue}
          onChange={(d) => setValue("dbsExpiryDate", d ? format(d, "yyyy-MM-dd") : "")}
          minDate={new Date()}
          placeholder="Select DBS expiry date..."
          errorMessage={errors.dbsExpiryDate?.message}
        />
      </div>
    </div>
  );
}

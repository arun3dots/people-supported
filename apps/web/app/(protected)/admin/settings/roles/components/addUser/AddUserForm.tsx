"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { UseFormReturn, Controller } from "react-hook-form";
import { ArrowRight, Eye, EyeOff, Loader2, Plus } from "lucide-react";
import type { AddUserDTO } from "@repo/schema";
import { cn } from "@repo/ui/lib/utils";
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  DatePicker,
} from "@repo/ui/components/ui";
import type { StaffMember } from "../../../../../../../lib/types/staff";
import { addUserFormSections, type UserFormField } from "./data/addUserFields";
import { CreateDepartmentDialog } from "./CreateDepartmentDialog";
import { TopStepHeader } from "./TopStepHeader";
import { ReviewStepContent } from "./ReviewStepContent";

interface AddUserFormProps {
  form: UseFormReturn<AddUserDTO>;
  onSubmit: (data: AddUserDTO) => void;
  isEditing?: boolean;
  isPending?: boolean;
  roles?: Array<{ id: string; name: string }>;
  departments?: Array<{ id: string; name: string }>;
  staffList?: StaffMember[];
  locations?: Array<{ id?: string; name?: string; label?: string; value?: string }>;
  onCancel?: () => void;
}

export function AddUserForm({
  form,
  onSubmit,
  isEditing = false,
  isPending = false,
  roles = [],
  departments = [],
  staffList = [],
  locations = [],
  onCancel,
}: AddUserFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);

  const {
    register,
    control,
    trigger,
    getValues,
    handleSubmit,
    formState: { errors },
  } = form;

  const totalSteps = addUserFormSections.length;

  const customDataList: Record<string, Array<{ id?: string; name?: string; label?: string; value?: string }>> = {
    department: departments,
    roleId: roles,
    managerId: staffList.map((s) => ({ id: s.id, name: s.fullName })),
    location: locations,
  };

  const getStepFieldNames = (stepIdx: number): Array<keyof AddUserDTO> => {
    const fields = addUserFormSections[stepIdx]?.sectionFields || [];
    return fields
      .filter((f) => !isEditing || (f.name !== "password" && f.name !== "confirmPassword"))
      .map((f) => f.name as keyof AddUserDTO);
  };

  const validateEmail = (value: string, label: string) => {
    if (!value) return `${label} is required`;
    const atIndex = value.indexOf("@");
    const dotIndex = value.lastIndexOf(".");
    if (
      atIndex === -1 ||
      dotIndex === -1 ||
      dotIndex <= atIndex + 1 ||
      dotIndex === value.length - 1
    ) {
      return `${label} must be a valid email address`;
    }
    return true;
  };

  const handleNext = async () => {
    console.log('working')
    const currentFields = getStepFieldNames(currentStep);
    if (currentFields.length > 0) {
      const isValid = await trigger(currentFields);
      if (isValid && currentStep < totalSteps - 1) {
        setCurrentStep((prev) => prev + 1);
      }
    } else if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else if (onCancel) {
      onCancel();
    }
  };

  const handleStepJump = async (stepIdx: number) => {
    if (stepIdx <= currentStep) {
      setCurrentStep(stepIdx);
    } else {
      const currentFields = getStepFieldNames(currentStep);
      const isValid = await trigger(currentFields);
      if (isValid) {
        setCurrentStep(stepIdx);
      }
    }
  };

  const renderField = (field: UserFormField) => {
    if (field.visible === false) return null;
    if (isEditing && (field.name === "password" || field.name === "confirmPassword")) {
      return null;
    }

    const fieldName = field.name as keyof AddUserDTO;
    const fieldError = errors[fieldName];
    const isRequired = Boolean(field.validationRules?.required);
    const requiredMessage =
      typeof field.validationRules?.required === "string"
        ? field.validationRules.required
        : `${field.label} is required`;
    const optionsList = customDataList[field.name] || field.options || [];

    switch (field.type) {
      case "text": {
        const isDateInput = field.name === "dob";
        return (
          <div key={field.id} className="space-y-1.5 col-span-1">
            <Label required={isRequired}>{field.label}</Label>
            <Input
              type={isDateInput ? "date" : "text"}
              placeholder={field.placeholder}
              autoComplete="off"
              {...register(fieldName, {
                required: isRequired ? requiredMessage : false,
                validate: (val) => {
                  const str = String(val || "");
                  if (!str && isRequired) return requiredMessage;

                  if (["firstName", "middleName", "lastName"].includes(field.name)) {
                    if (str && /^[0-9]/.test(str.trim())) {
                      return `${field.label.replace(" (Optional)", "")} cannot start with a number`;
                    }
                  }

                  if (field.name === "username") {
                    if (/\s/.test(str)) {
                      return "Username cannot contain spaces";
                    }
                  }

                  if (field.name === "phone") {
                    const trimmed = str.trim();
                    if (trimmed) {
                      const cleanDigits = trimmed.replace(/[^0-9]/g, "");
                      if (
                        !/^\+?[0-9\s\-()]{7,15}$/.test(trimmed) ||
                        cleanDigits.length < 7 ||
                        cleanDigits.length > 15
                      ) {
                        return "Please enter a valid phone number";
                      }
                    }
                  }

                  if (field.name === "dob") {
                    const trimmed = str.trim();
                    if (trimmed && isNaN(Date.parse(trimmed))) {
                      return "Please enter a valid date of birth (YYYY-MM-DD)";
                    }
                    if (trimmed) {
                      const parsed = new Date(trimmed);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      if (parsed >= today) {
                        return "Date of birth cannot be today or a future date";
                      }
                    }
                  }

                  return true;
                },
              })}
              errorMessage={fieldError?.message as string}
            />
          </div>
        );
      }

      case "email":
        return (
          <div key={field.id} className="space-y-1.5 col-span-1">
            <Label required={isRequired}>{field.label}</Label>
            <Input
              type="email"
              placeholder={field.placeholder}
              autoComplete="off"
              {...register(fieldName, {
                required: isRequired ? requiredMessage : false,
                validate: (val) => {
                  const str = String(val || "");
                  if (!str && isRequired) return requiredMessage;
                  if (str) return validateEmail(str, field.label);
                  return true;
                },
              })}
              errorMessage={fieldError?.message as string}
            />
          </div>
        );

      case "password": {
        const isConfirm = field.name === "confirmPassword";
        const showCurr = isConfirm ? showConfirmPassword : showPassword;
        const toggleCurr = isConfirm
          ? () => setShowConfirmPassword((prev) => !prev)
          : () => setShowPassword((prev) => !prev);

        return (
          <div key={field.id} className="space-y-1.5 col-span-1">
            <Label required={isRequired}>{field.label}</Label>
            <div className="relative w-full">
              <Input
                type={showCurr ? "text" : "password"}
                placeholder={field.placeholder}
                autoComplete="new-password"
                className="pr-10"
                {...register(fieldName, {
                  required: isRequired ? requiredMessage : false,
                  validate: (val) => {
                    const str = String(val || "");
                    if (!str && isRequired) return requiredMessage;
                    if (str && field.name === "password" && str.length < 8) {
                      return "Password must be at least 8 characters";
                    }
                    return true;
                  },
                })}
                errorMessage={fieldError?.message as string}
              />
              <button
                type="button"
                onClick={toggleCurr}
                className="absolute right-3 top-2.5 text-text-description hover:text-text-heading cursor-pointer z-10"
                aria-label="Toggle password visibility"
              >
                {showCurr ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
        );
      }

      case "dropdown":
        return (
          <div key={field.id} className="space-y-1.5 col-span-1">
            <div className="flex items-center justify-between">
              <Label required={isRequired}>{field.label}</Label>
              {field.name === "department" && (
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(true)}
                  className="text-md font-semibold text-slate-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="size-3" /> New Dept
                </button>
              )}
            </div>
            <Controller
              control={control}
              name={fieldName}
              rules={{
                required: isRequired ? requiredMessage : false,
              }}
              render={({ field: selectField }) => (
                <Select
                  value={(selectField.value as string) || ""}
                  onValueChange={selectField.onChange}
                >
                  <SelectTrigger className={fieldError ? "border-red-500" : ""}>
                    <SelectValue placeholder={field.placeholder || "Select option"} />
                  </SelectTrigger>
                  <SelectContent>
                    {optionsList.length === 0 ? (
                      <div className="px-3 py-2.5 text-center text-sm text-slate-500">
                        {field.name === "department"
                          ? "No departments found"
                          : "No options found"}
                      </div>
                    ) : (
                      optionsList.map((item, idx) => {
                        const itemObj = item as Record<string, string | undefined>;
                        const val = String(itemObj.value ?? itemObj.id ?? idx);
                        const lbl = String(itemObj.label ?? itemObj.name ?? val);
                        return (
                          <SelectItem key={val} value={val}>
                            {lbl}
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            <p
              className={cn(
                "text-md text-red-600 font-medium min-h-[18px] leading-tight transition-opacity duration-200 mt-1",
                fieldError
                  ? "opacity-100 visible"
                  : "opacity-0 invisible pointer-events-none select-none"
              )}
            >
              {(fieldError?.message as string) || (isRequired ? requiredMessage : "") || "\u00A0"}
            </p>
          </div>
        );

      case "dob":
      case "date":
      case "datetime":
      case "daterange":
        return (
          <div key={field.id} className="space-y-1.5 col-span-1">
            <Label required={isRequired}>{field.label}</Label>
            <Controller
              control={control}
              name={fieldName}
              rules={{
                required: isRequired ? requiredMessage : false,
              }}
              render={({ field: dateField }) => {
                if (field.type === "dob" || field.type === "date") {
                  return (
                    <DatePicker
                      variant={field.type === "dob" ? "dob" : "date"}
                      value={(dateField.value as string) || ""}
                      onChange={(d: Date | undefined) => dateField.onChange(d ? format(d, "yyyy-MM-dd") : "")}
                      placeholder={field.placeholder || (field.type === "dob" ? "Select date of birth..." : "Select date...")}
                      errorMessage={fieldError?.message as string}
                    />
                  );
                }

                if (field.type === "datetime") {
                  return (
                    <DatePicker
                      variant="datetime"
                      value={(dateField.value as string) || ""}
                      onChange={(d: Date | undefined) => dateField.onChange(d ? d.toISOString() : "")}
                      placeholder={field.placeholder || "Select date & time..."}
                      errorMessage={fieldError?.message as string}
                    />
                  );
                }

                return (
                  <DatePicker
                    variant="range"
                    value={typeof dateField.value === "object" ? (dateField.value as any) : undefined}
                    onChange={(range) => dateField.onChange(range)}
                    placeholder={field.placeholder || "Select date range..."}
                    errorMessage={fieldError?.message as string}
                  />
                );
              }}
            />
          </div>
        );

      case "textarea":
        return (
          <div key={field.id} className="space-y-1.5 sm:col-span-2">
            <Label required={isRequired}>{field.label}</Label>
            <Textarea
              rows={4}
              placeholder={field.placeholder}
              {...register(fieldName, {
                required: isRequired ? requiredMessage : false,
              })}
              errorMessage={fieldError?.message as string}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const currentSection = addUserFormSections[currentStep];

  return (
    <div className="w-full space-y-6">
      {/* Step Header Banner */}
      <TopStepHeader
        sections={addUserFormSections}
        currentStep={currentStep}
        onSelectStep={handleStepJump}
      />

      <form noValidate
        onSubmit={(e) => {
          e.preventDefault();
        }}
        className="space-y-6 pt-2"
      >
        {currentSection && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {!currentSection.sectionFields || currentSection.sectionFields.length === 0 ? (
              <ReviewStepContent
                formData={getValues()}
                roles={roles}
                departments={departments}
                staffList={staffList}
                onGoToStep={setCurrentStep}
                sectionTitle={currentSection.sectionTitle}
                sectionSubtitle={currentSection.sectionSubtitle}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5">
                {currentSection.sectionFields.map(renderField)}
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-border-secondary">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={isPending}
          >
            {currentStep === 0 ? "Cancel" : "Back"}
          </Button>

          {currentStep < totalSteps - 1 ? (
            <Button
              key="continue-btn"
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2"
            >
              Continue
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button
              key="submit-btn"
              type="button"
              disabled={isPending}
              onClick={handleSubmit(onSubmit)}
              className="flex items-center gap-2"
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isEditing ? "Confirm & Update User" : "Confirm & Send Invitation"}
              {!isPending && <ArrowRight className="size-4" />}
            </Button>
          )}
        </div>
      </form>

      <CreateDepartmentDialog
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        onSuccess={(id) => {
          form.setValue("department", id);
          setIsDeptModalOpen(false);
        }}
      />
    </div>
  );
}

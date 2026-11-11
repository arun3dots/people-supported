"use client";

import React, { useEffect } from "react";
import { format } from "date-fns";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateStaffSchema,
  type UpdateStaffDTO,
  getStaffPhoneValidationError,
  isOptionalStaffPhoneValid,
} from "@repo/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Label,
  DatePicker,
} from "@repo/ui/components/ui";
import { User, Phone, Briefcase } from "lucide-react";

import { useToast } from "@repo/ui/hooks";
import { StaffMember } from "../../../../../../../lib/types/staff";
import { useUpdateStaffMutation } from "../../../../../../../lib/queries/staff/useUpdateStaffMutation";
import { useGetRolesListQuery } from "../../../../../../../lib/queries/role/useGetRolesListQuery";
import { useGetDepartmentsQuery } from "../../../../../../../lib/queries/department/useDepartments";
import { StaffEditKinFields } from "./StaffEditKinFields";
import { StaffEditEmploymentFields } from "./StaffEditEmploymentFields";

interface StaffEditFormProps {
  staff: StaffMember;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "contact" | "employment" | "all";
}

const parseNameParts = (fullName?: string) => {
  if (!fullName) return { firstName: "", middleName: "", lastName: "" };
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] || "";
  const lastName = parts.length > 1 ? parts[parts.length - 1] : "";
  const middleName = parts.length > 2 ? parts.slice(1, -1).join(" ") : "";
  return { firstName, middleName, lastName };
};

export function StaffEditForm({
  staff,
  open,
  onOpenChange,
  mode = "all",
}: StaffEditFormProps) {
  const { toast } = useToast();
  const mutation = useUpdateStaffMutation(staff.id);
  const { data: roles } = useGetRolesListQuery();
  const { data: departments } = useGetDepartmentsQuery();

  const availableRoles = React.useMemo(
    () =>
      (roles || []).filter(
        (r) =>
          r.name?.toLowerCase() !== "superadmin" &&
          r.name?.toLowerCase() !== "resident"
      ),
    [roles]
  );

  const initialNames = parseNameParts(staff.fullName);
  const initialKin = (staff.emergencyContacts?.[0] as Record<string, string | undefined>) || {};

  const [kinName, setKinName] = React.useState(initialKin.name || "");
  const [kinRelation, setKinRelation] = React.useState(initialKin.relation || "");
  const [kinPhone, setKinPhone] = React.useState(initialKin.phone || "");
  const [kinEmail, setKinEmail] = React.useState(initialKin.email || "");
  const [kinPhoneError, setKinPhoneError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpdateStaffDTO>({
    resolver: zodResolver(updateStaffSchema),
    defaultValues: {
      firstName: initialNames.firstName,
      middleName: initialNames.middleName,
      lastName: initialNames.lastName,
      fullName: staff.fullName,
      email: staff.email,
      phone: staff.phoneNumber || "",
      address: staff.address || "",
      startDate: staff.startDate?.substring(0, 10) || "",
      dob: staff.dob?.substring(0, 10) || "",
      niNumber: staff.niNumber || "",
      dbsNumber: staff.dbsNumber || "",
      dbsExpiryDate: staff.dbsExpiryDate?.substring(0, 10) || "",
      roleId: staff.role?.id || "",
      department: staff.department || "",
    },
  });

  const dobValue = watch("dob");
  const startDateValue = watch("startDate");
  const dbsExpiryDateValue = watch("dbsExpiryDate");

  useEffect(() => {
    if (open) {
      const parsed = parseNameParts(staff.fullName);
      const k = (staff.emergencyContacts?.[0] as Record<string, string | undefined>) || {};
      setKinName(k.name || "");
      setKinRelation(k.relation || "");
      setKinPhone(k.phone || "");
      setKinEmail(k.email || "");
      setKinPhoneError(null);

      reset({
        firstName: parsed.firstName,
        middleName: parsed.middleName,
        lastName: parsed.lastName,
        fullName: staff.fullName,
        email: staff.email,
        phone: staff.phoneNumber || "",
        address: staff.address || "",
        startDate: staff.startDate?.substring(0, 10) || "",
        dob: staff.dob?.substring(0, 10) || "",
        niNumber: staff.niNumber || "",
        dbsNumber: staff.dbsNumber || "",
        dbsExpiryDate: staff.dbsExpiryDate?.substring(0, 10) || "",
        roleId: staff.role?.id || "",
        department: staff.department || "",
      });
    }
  }, [staff, open, reset]);

  const onFormSubmit = (data: UpdateStaffDTO) => {
    const kinValidationError = getStaffPhoneValidationError(kinPhone, false, "Next of Kin phone number");
    if (kinValidationError) {
      setKinPhoneError(kinValidationError);
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: kinValidationError,
      });
      return;
    }
    setKinPhoneError(null);

    const constructedFullName = [data.firstName, data.middleName, data.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() || data.fullName || staff.fullName;

    const hasKinInfo = Boolean(kinName || kinRelation || kinPhone || kinEmail);
    const emergencyContacts = hasKinInfo
      ? [
        {
          name: kinName || undefined,
          relation: kinRelation || undefined,
          phone: kinPhone || undefined,
          email: kinEmail || undefined,
        },
      ]
      : undefined;

    const payload: UpdateStaffDTO = {
      fullName: constructedFullName,
      email: data.email || undefined,
      phone: data.phone || undefined,
      address: data.address || undefined,
      dob: data.dob || undefined,
      startDate: data.startDate || undefined,
      niNumber: data.niNumber || undefined,
      dbsNumber: data.dbsNumber || undefined,
      dbsExpiryDate: data.dbsExpiryDate || undefined,
      roleId: data.roleId || undefined,
      department: data.department || undefined,
      emergencyContacts,
    };

    mutation.mutate(payload, {
      onSuccess: () => {
        toast({ title: "Success", description: "Staff details updated successfully" });
        onOpenChange(false);
      },
      onError: (err: unknown) => {
        const message = err instanceof Error ? err.message : "Failed to update staff details";
        toast({ variant: "destructive", title: "Error", description: message });
      },
    });
  };

  const onFormError = (formErrors: FieldErrors<UpdateStaffDTO>) => {
    console.error("Staff edit form validation error:", formErrors);
    const keys = Object.keys(formErrors) as (keyof UpdateStaffDTO)[];
    const firstKey = keys[0];
    if (firstKey && formErrors[firstKey]) {
      const err = formErrors[firstKey];
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: err?.message || `Please check the ${firstKey} field.`,
      });
    }
  };

  const showContact = mode === "all" || mode === "contact";
  const showEmployment = mode === "all" || mode === "employment";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="2xl" className="flex flex-col">
        <DialogHeader className="pb-4 border-b border-gray-100 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-[#141F1E]">
            <User className="w-5 h-5 text-[#4A706A]" />
            Edit Staff Details — {staff.fullName}
          </DialogTitle>
          <DialogDescription className="text-md text-[#5D5D5D]">
            Update contact information and employment details for this staff member.
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit(onFormSubmit, onFormError)} className="flex-1 overflow-y-auto pr-2 py-4 space-y-6">
          {showContact && (
            <div className="space-y-4">
              <h3 className="text-md font-bold flex items-center gap-2 text-[#4A706A] border-b border-gray-100 pb-2">
                <Phone className="w-4 h-4" /> Personal & Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>First Name</Label>
                  <Input {...register("firstName")} placeholder="First name" className="rounded-xl border-[#BCD3CD] focus-visible:ring-[#4A706A]" />
                </div>
                <div className="space-y-1.5">
                  <Label>Middle Name</Label>
                  <Input {...register("middleName")} placeholder="Middle name (optional)" className="rounded-xl border-[#BCD3CD] focus-visible:ring-[#4A706A]" />
                </div>
                <div className="space-y-1.5">
                  <Label>Last Name</Label>
                  <Input {...register("lastName")} placeholder="Last name" className="rounded-xl border-[#BCD3CD] focus-visible:ring-[#4A706A]" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Email Address</Label>
                  <Input {...register("email")} errorMessage={errors.email?.message} className="rounded-xl border-[#BCD3CD] focus-visible:ring-[#4A706A]" />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone Number</Label>
                  <Input
                    type="tel"
                    {...register("phone")}
                    placeholder="e.g. +44 7700 900077"
                    errorMessage={errors.phone?.message}
                    className="rounded-xl border-[#BCD3CD] focus-visible:ring-[#4A706A]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Date of Birth</Label>
                  <DatePicker
                    variant="dob"
                    value={dobValue}
                    onChange={(d) => setValue("dob", d ? format(d, "yyyy-MM-dd") : "")}
                    placeholder="Select date of birth..."
                    errorMessage={errors.dob?.message}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Home Address</Label>
                  <Input {...register("address")} errorMessage={errors.address?.message} placeholder="House number, street, city, postcode" className="rounded-xl border-[#BCD3CD] focus-visible:ring-[#4A706A]" />
                </div>
              </div>

              <StaffEditKinFields
                kinName={kinName}
                setKinName={setKinName}
                kinRelation={kinRelation}
                setKinRelation={setKinRelation}
                kinPhone={kinPhone}
                setKinPhone={(v) => {
                  setKinPhone(v);
                  if (kinPhoneError && isOptionalStaffPhoneValid(v)) {
                    setKinPhoneError(null);
                  }
                }}
                kinEmail={kinEmail}
                setKinEmail={setKinEmail}
                kinPhoneError={kinPhoneError}
              />
            </div>
          )}

          {showEmployment && (
            <div className="space-y-4">
              <h3 className="text-md font-bold flex items-center gap-2 text-[#4A706A] border-b border-gray-100 pb-2">
                <Briefcase className="w-4 h-4" /> Employment Details
              </h3>
              <StaffEditEmploymentFields
                control={control}
                register={register}
                errors={errors}
                roles={availableRoles}
                departments={departments}
                startDateValue={startDateValue}
                dbsExpiryDateValue={dbsExpiryDateValue}
                setValue={setValue}
              />
            </div>
          )}

          <DialogFooter className="pt-4 border-t border-gray-100 shrink-0 gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending} className="bg-[#4A706A] hover:bg-[#3D5C57] text-white rounded-xl">
              {mutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

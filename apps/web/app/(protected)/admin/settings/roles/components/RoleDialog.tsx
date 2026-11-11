"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
} from "@repo/ui/components/ui";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { RoleMember } from "../../../../../../lib/types/role";

import { AddRoleStep1 } from "./roleWizard/AddRoleStep1";
import { AddRoleStep2, ALL_GRANULAR_ACTION_IDS, MODULE_CONFIG } from "./roleWizard/AddRoleStep2";
import { AddRoleStep3 } from "./roleWizard/AddRoleStep3";
import { AddRoleStep4 } from "./roleWizard/AddRoleStep4";
import { AddRoleSuccess } from "./roleWizard/AddRoleSuccess";

interface RoleDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: any) => Promise<unknown> | void;
  initialData?: RoleMember | null;
  title?: string;
  isLoading?: boolean;
}

export function RoleDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  initialData,
  title = "Add New Role",
  isLoading,
}: RoleDialogProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm({
    defaultValues: {
      name: "",
      accessType: "Custom Access",
      description: "",
      moduleLevels: {
        residents: "Custom Access",
        staff: "Custom Access",
        rota: "Custom Access",
        facilities: "Full Access",
        resources: "Full Access",
        reports: "Full Access",
        settings: "Full Access",
      },
      granularPermissions: Object.fromEntries(MODULE_CONFIG.map((m) => [m.id, [...ALL_GRANULAR_ACTION_IDS]])),
    },
  });

  const { handleSubmit, reset, watch } = form;
  const formData = watch();

  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setStep(1);
      if (initialData) {
        reset({
          name: initialData.name || "",
          accessType: "Custom Access",
          description: "",
          moduleLevels: {
            residents: "Custom Access",
            staff: "Custom Access",
            rota: "Custom Access",
            facilities: "Full Access",
            resources: "Full Access",
            reports: "Full Access",
            settings: "Full Access",
          },
          granularPermissions: Object.fromEntries(MODULE_CONFIG.map((m) => [m.id, [...ALL_GRANULAR_ACTION_IDS]])),
        });
      } else {
        reset({
          name: "",
          accessType: "Custom Access",
          description: "",
          moduleLevels: {
            residents: "Custom Access",
            staff: "Custom Access",
            rota: "Custom Access",
            facilities: "Full Access",
            resources: "Full Access",
            reports: "Full Access",
            settings: "Full Access",
          },
          granularPermissions: Object.fromEntries(MODULE_CONFIG.map((m) => [m.id, [...ALL_GRANULAR_ACTION_IDS]])),
        });
      }
    }
  }, [initialData, isOpen, reset]);

  const handleClose = () => {
    setIsSuccess(false);
    setStep(1);
    onOpenChange(false);
  };
  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (step === 1) {
      const roleName = String(form.getValues("name") ?? "").trim();
      if (!roleName) {
        form.setError("name", {
          type: "required",
          message: "Role name is required",
        });
        return;
      }
      form.clearErrors("name");
      form.setValue("name", roleName);
    }

    if (step === 3) {
      const data = form.getValues();
      const rotaActions = data.granularPermissions?.rota ?? [];
      const rotaLevel = data.moduleLevels?.rota;
      if (rotaLevel === "No Access" && rotaActions.length > 0) {
        form.setError("root.permissions", {
          type: "validate",
          message: "Rota Management has no access but permissions are selected.",
        });
        return;
      }
      if (rotaActions.length > 0 && !rotaActions.includes("view")) {
        form.setError("root.permissions", {
          type: "validate",
          message: "View permission is required for any selected Rota permission.",
        });
        return;
      }
      form.clearErrors("root.permissions");
    }

    setStep((prev) => (prev < 4 ? ((prev + 1) as 1 | 2 | 3 | 4) : prev));
  };
  const handleFinalSubmit = async (data: any) => {
    if (step !== 4) return;
    const roleName = String(data.name ?? "").trim();
    if (!roleName) {
      form.setError("name", {
        type: "required",
        message: "Role name is required",
      });
      setStep(1);
      return;
    }
    const rotaActions = data.granularPermissions?.rota ?? [];
    if (rotaActions.length > 0 && !rotaActions.includes("view")) {
      form.setError("root.permissions", {
        type: "validate",
        message: "View permission is required for any selected Rota permission.",
      });
      setStep(3);
      return;
    }
    const levels = data.moduleLevels || {};

    const computedPermissions = {
      dashboard: {
        read: levels.reports !== "No Access",
        write: levels.reports === "Full Access",
        delete: levels.reports === "Full Access",
      },
      residents: {
        read: levels.residents !== "No Access",
        write: levels.residents === "Full Access" || levels.residents === "Custom Access",
        delete: levels.residents === "Full Access",
      },
      staff: {
        read: levels.staff !== "No Access",
        write: levels.staff === "Full Access" || levels.staff === "Custom Access",
        delete: levels.staff === "Full Access",
      },
      facilities: {
        read: levels.facilities !== "No Access",
        write: levels.facilities === "Full Access" || levels.facilities === "Custom Access",
        delete: levels.facilities === "Full Access",
      },
      payments: {
        read: levels.resources !== "No Access",
        write: levels.resources === "Full Access",
        delete: levels.resources === "Full Access",
      },
      settings: {
        read: levels.settings !== "No Access",
        write: levels.settings === "Full Access",
        delete: levels.settings === "Full Access",
      },
      riskAssessments: {
        read: levels.residents !== "No Access",
        write: levels.residents !== "No Access",
        delete: levels.residents === "Full Access",
        approve: levels.residents === "Full Access",
        manageTemplates: levels.settings === "Full Access",
      },
    };

    try {
      await onSubmit({
        name: roleName,
        permissions: computedPermissions,
      });
      setIsSuccess(true);
    } catch {
      // API error toast is displayed; keep modal on current review step
    }
  };

  const stepsList = [
    { num: 1, label: "Basic Info" },
    { num: 2, label: "Permissions" },
    { num: 3, label: "Module Access" },
    { num: 4, label: "Review" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent size={isSuccess ? "md" : "xl"}>
        {!isSuccess ? (
          <>
            <DialogHeader className="pb-1">
              <DialogTitle className="text-[20px] font-semibold text-[#141F1E] text-left">
                {initialData ? `Edit Role: ${initialData.name}` : "Add New Role"}
              </DialogTitle>
              <p className="text-[12px] text-[#5D5D5D] text-left">
                Define the role details and module access permissions.
              </p>
            </DialogHeader>

            {/* Stepper Header */}
            <div className="py-3 mb-2">
              <div className="flex items-center justify-between relative px-6">
                {/* Horizontal Connector Line */}
                <div className="absolute top-[16px] left-[55px] right-[55px] h-[1px] bg-[#E5E7EB] -z-0" />

                {stepsList.map((s) => {
                  const isActive = step === s.num;
                  const isDone = step > s.num;
                  return (
                    <div
                      key={s.num}
                      onClick={() => {
                        if (s.num === 1) {
                          setStep(1);
                          return;
                        }
                        const roleName = String(form.getValues("name") ?? "").trim();
                        if (!roleName) {
                          form.setError("name", {
                            type: "required",
                            message: "Role name is required",
                          });
                          setStep(1);
                          return;
                        }
                        setStep(s.num as 1 | 2 | 3 | 4);
                      }}
                      className="flex flex-col items-center gap-2 z-10 cursor-pointer group"
                    >
                      <div
                        className={cn(
                          "size-[32px] rounded-full flex items-center justify-center text-[12px] font-semibold transition-all",
                          isDone
                            ? "bg-[#4A706A] text-white"
                            : isActive
                            ? "bg-[#4A706A] text-white ring-4 ring-[#4A706A]/15"
                            : "bg-[#F3F4F6] text-[#9CA3AF]"
                        )}
                      >
                        {s.num}
                      </div>
                      <span
                        className={cn(
                          "text-[12px] font-semibold transition-colors",
                          isActive || isDone ? "text-[#141F1E]" : "text-[#A0AEC0]"
                        )}
                      >
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <form noValidate
               onSubmit={(e) => {
                   e.preventDefault();
                   if (step === 4) {
                     handleSubmit(handleFinalSubmit)(e);
                   }
                 }}
                 className="space-y-6"
               >
              {step === 1 && <AddRoleStep1 form={form} />}
              {step === 2 && <AddRoleStep2 form={form} />}
              {step === 3 && <AddRoleStep3 form={form} />}
              {step === 4 && (
                <AddRoleStep4
                  formData={formData}
                  onGoToStep={(st) => setStep(st)}
                />
              )}

              {/* Footer Controls */}
              <DialogFooter className="flex flex-row items-center justify-between gap-3 pt-2">
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep((s) => (s - 1) as any)}
                    className="rounded-xl h-[44px] px-6 border-[#BCD3CD] text-[14px] font-medium text-[#141F1E] hover:bg-black/5"
                  >
                    <ArrowLeft className="size-4 mr-2" /> Back
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="rounded-xl h-[44px] px-6 border-[#BCD3CD] text-[14px] font-medium text-[#141F1E] hover:bg-black/5"
                  >
                    Cancel
                  </Button>
                )}

                {step < 4 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="rounded-xl h-[44px] px-7 bg-[#4A706A] hover:bg-[#3d5d58] text-white text-[14px] font-medium shadow-none ml-auto"
                  >
                    Next <ArrowRight className="size-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="rounded-xl h-[44px] px-8 bg-[#4A706A] hover:bg-[#3d5d58] text-white text-[14px] font-medium shadow-none ml-auto"
                  >
                    {isLoading ? "Saving..." : "Confirm"}{" "}
                    <ArrowRight className="size-4 ml-2" />
                  </Button>
                )}
              </DialogFooter>
            </form>
          </>
        ) : (
          <AddRoleSuccess
            roleName={formData.name}
            onClose={handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
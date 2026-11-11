"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { Button, Card, CardContent, Text } from "@repo/ui/components/ui";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createTenantSchema,
  type CreateTenantDTO,
  type SuperAdminCreateTenantDTO,
} from "@repo/schema";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@repo/ui/lib/utils";

import { useGetPackagesQuery } from "../../../lib/queries/packages";
import { useCreateTenantMutation } from "../../../lib/queries/tenants";
import type { CreatedTenant } from "../../../lib/types/tenant";
import { OnboardingStepHeader } from "./components/OnboardingStepHeader";
import { StepIdentity } from "./components/StepIdentity";
import { StepLocation } from "./components/StepLocation";
import { StepContact } from "./components/StepContact";
import {
  StepSubscription,
  type CustomPackageForm,
} from "./components/StepSubscription";
import { OnboardingSuccess } from "./components/OnboardingSuccess";

const STEP_FIELDS: Record<number, (keyof CreateTenantDTO)[]> = {
  1: ["name", "subdomain", "cqcNumber"],
  2: ["addressLine1", "city", "postcode"],
  3: [
    "primaryContactName",
    "primaryContactEmail",
    "primaryContactPhone",
    "password",
  ],
  4: ["packageId"],
};

const EMPTY_CUSTOM_FORM: CustomPackageForm = {
  name: "",
  priceMonthly: "",
  residentLimit: "",
  staffLimit: "",
  currency: "INR",
};

function errorMessage(e: unknown, fallback: string): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object" && "message" in e) {
    return String((e as { message: unknown }).message);
  }
  return fallback;
}

export default function CreateTenantPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [createdTenant, setCreatedTenant] = useState<CreatedTenant | null>(null);

  const { data: packages } = useGetPackagesQuery();
  const createMutation = useCreateTenantMutation();

  // Only active, public, non-custom packages are selectable here; a tenant can
  // alternatively be given a bespoke "custom" package via the form below.
  const selectablePackages = (packages ?? []).filter(
    (p) => p.isActive && p.isPublic && !p.isCustom,
  );

  const [useCustomPackage, setUseCustomPackage] = useState(false);
  const [customForm, setCustomForm] =
    useState<CustomPackageForm>(EMPTY_CUSTOM_FORM);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateTenantDTO>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      name: "",
      subdomain: "",
      cqcNumber: "",
      addressLine1: "",
      city: "",
      postcode: "",
      primaryContactName: "",
      primaryContactEmail: "",
      primaryContactPhone: "",
      password: "",
      packageId: "",
    },
  });

  const nextStep = async () => {
    const fields = STEP_FIELDS[step] ?? [];
    const isValid = await trigger(fields);
    if (isValid) setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const buildPayload = (
    data: CreateTenantDTO,
  ): SuperAdminCreateTenantDTO | null => {
    if (useCustomPackage) {
      const priceMonthly = Number(customForm.priceMonthly);
      const residentLimit = Number(customForm.residentLimit);
      const staffLimit = Number(customForm.staffLimit);
      if (
        !customForm.name.trim() ||
        Number.isNaN(priceMonthly) ||
        !Number.isInteger(residentLimit) ||
        residentLimit <= 0 ||
        !Number.isInteger(staffLimit) ||
        staffLimit <= 0
      ) {
        setError("Please complete the custom package details.");
        return null;
      }
      const { packageId: _ignored, ...rest } = data;
      return {
        ...rest,
        customPackage: {
          name: customForm.name.trim(),
          priceMonthly,
          residentLimit,
          staffLimit,
          currency: customForm.currency.trim() || "INR",
          featureFlags: {},
        },
      };
    }
    if (!data.packageId) {
      setError("Please select a subscription package.");
      return null;
    }
    return data;
  };

  const onSubmit = async (data: CreateTenantDTO) => {
    setError("");
    const payload = buildPayload(data);
    if (!payload) return;
    try {
      const tenant = await createMutation.mutateAsync(payload);
      setCreatedTenant(tenant);
      setSuccess(true);
    } catch (e: unknown) {
      setError(errorMessage(e, "Failed to onboard tenant"));
    }
  };

  if (success) {
    return (
      <OnboardingSuccess
        tenant={createdTenant}
        onBack={() => router.push("/tenants")}
        onCreateAnother={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6 font-sans">
      <Link
        href="/tenants"
        className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-800 transition-colors font-semibold text-xs"
      >
        <ArrowLeft className="size-3.5" />
        Back to Registered Tenants
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <Text as="h1" size="xl" weight="bold" className="text-slate-900 tracking-tight">
            Lifecycle Onboarding
          </Text>
          <Text size="xs" weight="regular" variant="subdued" className="mt-1">
            Step-by-step infrastructure provisioning for new care homes.
          </Text>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-center">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 w-8 rounded-full transition-all duration-300",
                step >= i
                  ? "bg-emerald-800"
                  : "bg-slate-300",
              )}
            />
          ))}
        </div>
      </div>

      <div className="bg-surface-card-grey rounded-2xl p-6 lg:p-8 space-y-6 shadow-none border-none">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <OnboardingStepHeader step={step} />

          {error && (
            <div className="p-3.5 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-100 flex items-center justify-center text-center">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {step === 1 && (
              <StepIdentity register={register} errors={errors} />
            )}
            {step === 2 && (
              <StepLocation register={register} errors={errors} />
            )}
            {step === 3 && (
              <StepContact register={register} errors={errors} />
            )}
            {step === 4 && (
              <StepSubscription
                selectablePackages={selectablePackages}
                useCustomPackage={useCustomPackage}
                selectedPackageId={watch("packageId")}
                onSelectPackage={(id) => {
                  setUseCustomPackage(false);
                  setValue("packageId", id, { shouldValidate: true });
                }}
                onSelectCustom={() => {
                  setUseCustomPackage(true);
                  setValue("packageId", "");
                }}
                customForm={customForm}
                onCustomFormChange={setCustomForm}
              />
            )}
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-slate-200/80">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={prevStep}
              >
                <ChevronLeft className="size-4" />
                Previous Phase
              </Button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <Button
                type="button"
                variant="primary"
                className="gap-2"
                onClick={nextStep}
              >
                Continue to Next Step
                <ChevronRight className="size-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                variant="primary"
                className="gap-2"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ShieldCheck className="size-4" />
                )}
                Deploy Infrastructure
              </Button>
            )}
          </div>
        </form>
      </div>

      <Text size="xs" variant="subdued" className="text-center px-4 leading-relaxed">
        Proceeding with onboarding will reserve the subdomain and provision an isolated database schema. A welcome email will be automatically dispatched upon successful deployment.
      </Text>
    </div>
  );
}

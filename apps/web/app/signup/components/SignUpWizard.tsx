"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, ChevronRight, CreditCard, Loader2 } from "lucide-react";
import { publicOnboardingSchema, type PublicOnboardingDTO } from "@repo/schema";
import { Button } from "@repo/ui/components/ui";

import { SignUpStepper } from "./SignUpStepper";
import { StepOrganisation } from "./StepOrganisation";
import { StepAdmin } from "./StepAdmin";
import { StepPlan } from "./StepPlan";
import { SignUpSuccess } from "./SignUpSuccess";

import {
  useGetPublicPackagesQuery,
  useOnboardMutation,
  type OnboardResult,
} from "../../../lib/queries/onboarding/useOnboarding";
import { useRazorpayCheckout } from "../../../lib/billing/useRazorpayCheckout";
import { fetchOpenOrder } from "../../../lib/queries/billing/useBilling";
import { useAuth } from "../../../lib/context/AuthContext";

export function SignUpWizard() {
  const router = useRouter();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [result, setResult] = useState<OnboardResult | null>(null);

  // Admin step state
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [termsError, setTermsError] = useState("");

  // Payment states
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paying, setPaying] = useState(false);

  const { data: packages } = useGetPublicPackagesQuery();
  const onboard = useOnboardMutation();

  const { openCheckout, loading: checkoutLoading } = useRazorpayCheckout({
    onSuccess: () => {
      setPaymentSuccess(true);
      setPaymentError("");
    },
    onError: (msg) => {
      setPaymentError(msg);
    },
  });

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    getValues,
    setError: setFormError,
    formState: { errors },
  } = useForm<PublicOnboardingDTO>({
    resolver: zodResolver(publicOnboardingSchema),
    defaultValues: {
      name: "",
      subdomain: "",
      cqcNumber: "",
      cqcProviderId: "",
      cqcLocationId: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      postcode: "",
      primaryContactName: "",
      primaryContactEmail: "",
      primaryContactPhone: "",
      password: "",
      packageId: "",
    },
  });

  const selectedPackageId = watch("packageId");

  const buildSubdomain = () => {
    const base = (getValues("name") || "care")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24);
    return `${base || "care"}-${Math.floor(1000 + Math.random() * 9000)}`;
  };

  const nextStep = async () => {
    if (step === 1) {
      const cqcFields = ["cqcNumber", "cqcProviderId", "cqcLocationId"] as const;
      const cqcPattern = /^1-\d+$/;
      let hasInvalidCqc = false;
      for (const field of cqcFields) {
        const value = getValues(field);
        if (value && !cqcPattern.test(value)) {
          hasInvalidCqc = true;
          setFormError(field, { type: "pattern", message: "Use the CQC format 1- followed by digits" });
        }
      }
      if (hasInvalidCqc) return;
    }

    const fields: (keyof PublicOnboardingDTO)[][] = [
      [],
      [
        "name",
        "cqcNumber",
        "cqcProviderId",
        "cqcLocationId",
        "addressLine1",
        "city",
        "postcode",
      ],
      ["primaryContactName", "primaryContactEmail", "primaryContactPhone", "password"],
    ];

    const currentFields = fields[step];
    if (currentFields && currentFields.length > 0) {
      const ok = await trigger(currentFields as (keyof PublicOnboardingDTO)[], {
        shouldFocus: true,
      });
      if (!ok) return;
    }

    if (step === 2) {
      const password = getValues("password") || "";
      if (!confirmPassword) {
        setConfirmError("Please confirm your password.");
        return;
      }
      if (password !== confirmPassword) {
        setConfirmError("Passwords do not match.");
        return;
      }
      setConfirmError("");
    }

    if (step === 1 && !getValues("subdomain")) {
      setValue("subdomain", buildSubdomain());
    }

    setStep((s) => Math.min(s + 1, 3));
  };

  const prevStep = () => {
    setStep((s) => Math.max(1, s - 1));
  };

  const onSubmit = async (data: PublicOnboardingDTO) => {
    if (!agreeTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }
    if (!data.packageId) {
      setError("Please select a subscription plan to continue.");
      return;
    }

    const subdomain = data.subdomain || buildSubdomain();
    setError("");

    try {
      const res = await onboard.mutateAsync({ ...data, subdomain, agreeTerms: true, dpaVersion: "v1.0-2026-10", privacyNoticeVersion: "v1.0-2026-10" });
      setResult(res);
    } catch (e: unknown) {
      const message =
        e instanceof Error
          ? e.message
          : (e as { message?: string })?.message ?? "Onboarding failed";
      setError(message);
    }
  };

  const handlePay = async () => {
    if (!result) return;
    setPaymentError("");
    setPaying(true);
    try {
      if (result.paymentToken) {
        const order = await fetchOpenOrder(result.paymentToken);
        if (!order.key) {
          if (result.paymentUrl) {
            window.open(result.paymentUrl, "_blank", "noopener,noreferrer");
          } else {
            router.push(`/pay/${result.paymentToken}`);
          }
          return;
        }
        await openCheckout(order);
      } else if (result.paymentUrl) {
        window.open(result.paymentUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err: unknown) {
      setPaymentError(
        (err as { message?: string })?.message ?? "Failed to initialize payment",
      );
    } finally {
      setPaying(false);
    }
  };

  useEffect(() => {
    if (paymentSuccess) {
      const email = getValues("primaryContactEmail");
      const password = getValues("password");
      if (email && password) {
        login({ email, password }).catch((err) => {
          console.warn("Background auto-login failed:", err);
        });
      }
    }
  }, [paymentSuccess, getValues, login]);

  const handleProceedToDashboard = async () => {
    const email = getValues("primaryContactEmail");
    const password = getValues("password");
    if (email && password) {
      try {
        await login({ email, password });
      } catch (err) {
        console.warn("Auto-login before dashboard navigation failed:", err);
      }
    }
    router.push("/admin/dashboard");
  };

  if (result) {
    return (
      <SignUpSuccess
        result={result}
        onPay={handlePay}
        isPaying={paying}
        checkoutLoading={checkoutLoading}
        paymentSuccess={paymentSuccess}
        paymentError={paymentError}
        onProceedToDashboard={handleProceedToDashboard}
      />
    );
  }

  const titles = [
    { title: "Set up your supported living service", subtitle: "Tell us a little about your supported living service." },
    { title: "Your admin account", subtitle: "Create the first administrator account." },
    { title: "Choose a plan", subtitle: "Pick the best plan to start managing your supported living service." },
  ];
  const activeHeader = titles[step - 1] || titles[0];

  return (
    <div className="w-full max-w-2xl bg-white rounded-2xl p-6 sm:p-10 shadow-xl border border-slate-100/80 space-y-6">
      {/* Header */}
      <div className="text-center space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          {activeHeader?.title}
        </h1>
        <p className="text-md font-medium text-slate-500">
          {activeHeader?.subtitle}
        </p>
      </div>

      {/* Stepper */}
      <SignUpStepper currentStep={step} />

      {/* General Error Alert */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 text-red-600 text-md font-medium border border-red-100">
          {error}
        </div>
      )}

      {/* Wizard Step Form */}
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {step === 1 && (
          <StepOrganisation register={register} errors={errors} />
        )}

        {step === 2 && (
          <StepAdmin
            register={register}
            errors={errors}
            confirmPassword={confirmPassword}
            onConfirmPasswordChange={(val) => {
              setConfirmPassword(val);
              setConfirmError("");
            }}
            confirmError={confirmError}
            agreeTerms={agreeTerms}
            onAgreeTermsChange={(agreed) => {
              setAgreeTerms(agreed);
              if (agreed) setTermsError("");
            }}
            termsError={termsError || undefined}
          />
        )}

        {step === 3 && (
          <StepPlan
            packages={packages}
            selectedPackageId={selectedPackageId}
            onSelectPackage={(id) => setValue("packageId", id, { shouldValidate: true })}
            errorMessage={errors.packageId?.message}
          />
        )}

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={prevStep}
              className="gap-2"
            >
              <ChevronLeft className="size-4" /> Back
            </Button>
          ) : (
            <Link href="/login">
              <Button type="button" variant="outline" size="lg">
                Sign in
              </Button>
            </Link>
          )}

          {step < 3 ? (
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={nextStep}
              className="gap-2"
            >
              Continue <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={onboard.isPending}
              className="gap-2"
            >
              {onboard.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CreditCard className="size-4" />
              )}
              Create account
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

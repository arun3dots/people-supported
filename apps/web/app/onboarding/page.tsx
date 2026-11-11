"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { publicOnboardingSchema, type PublicOnboardingDTO } from "@repo/schema";
import {
  Building2,
  MapPin,
  UserCircle,
  CreditCard,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Mail,
} from "lucide-react";
import { Button, Card, CardContent, Input } from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useGetPublicPackagesQuery,
  useOnboardMutation,
  type OnboardResult,
} from "../../lib/queries/onboarding/useOnboarding";
import { useRazorpayCheckout } from "../../lib/billing/useRazorpayCheckout";
import { fetchOpenOrder } from "../../lib/queries/billing/useBilling";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [result, setResult] = useState<OnboardResult | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paying, setPaying] = useState(false);

  const { openCheckout, loading: checkoutLoading } = useRazorpayCheckout({
    onSuccess: () => {
      setPaymentSuccess(true);
      setPaymentError("");
    },
    onError: (msg) => {
      setPaymentError(msg);
    },
  });

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
        (err as { message?: string })?.message ?? "Failed to initialise payment",
      );
    } finally {
      setPaying(false);
    }
  };

  const { data: packages } = useGetPublicPackagesQuery();
  const onboard = useOnboardMutation();

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PublicOnboardingDTO>({
    resolver: zodResolver(publicOnboardingSchema),
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
    const fields: (keyof PublicOnboardingDTO)[][] = [
      [],
      ["name", "subdomain"],
      ["addressLine1", "city", "postcode"],
      ["primaryContactName", "primaryContactEmail", "primaryContactPhone", "password"],
    ];
    const ok = await trigger(fields[step] as never);
    if (ok) setStep(step + 1);
  };

  const onSubmit = async (data: PublicOnboardingDTO) => {
    setError("");
    try {
      const res = await onboard.mutateAsync(data);
      setResult(res);
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? "Onboarding failed");
    }
  };

  if (result) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-surface-primary-light font-sans">
        <Card
          variant="white"
          className="max-w-lg w-full p-10 text-center space-y-6"
        >
          <div className="mx-auto size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center animate-bounce">
            <CheckCircle2 className="size-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Account created!
            </h2>
            <p className="text-md text-slate-500 leading-relaxed">
              We&apos;ve emailed a verification link and a payment link to your
              primary contact. Verify your email, then complete payment to
              unlock your dashboard.
            </p>
          </div>
          {paymentError && (
            <p className="text-md text-red-500 font-medium">{paymentError}</p>
          )}
          {paymentSuccess ? (
            <div className="p-3 bg-emerald-50 text-emerald-700 text-md font-medium rounded-xl border border-emerald-200">
              Payment completed successfully!
            </div>
          ) : (
            (result.paymentToken || result.paymentUrl) && (
              <Button
                size="lg"
                className="w-full gap-2"
                onClick={handlePay}
                disabled={paying || checkoutLoading}
              >
                {paying || checkoutLoading ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <CreditCard className="size-5" />
                )}
                Pay now
              </Button>
            )
          )}
          <Link href="/login" className="block">
            <Button variant="outline" size="lg" className="w-full">
              Go to login
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const stepIcons = [Building2, MapPin, UserCircle, CreditCard];
  const StepIcon = stepIcons[step - 1] ?? Building2;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Get started</h1>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn(
                  "h-2 w-10 rounded-full transition-all",
                  step >= i ? "bg-primary" : "bg-slate-200",
                )}
              />
            ))}
          </div>
        </div>

        <Card>
          <form noValidate onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <StepIcon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">
                    {step === 1 && "Care home details"}
                    {step === 2 && "Location"}
                    {step === 3 && "Administrator account"}
                    {step === 4 && "Choose a plan"}
                  </h2>
                  <p className="text-md text-muted-foreground">
                    {step === 1 && "Your brand and unique subdomain."}
                    {step === 2 && "Where your care home is located."}
                    {step === 3 && "The first admin who manages this account."}
                    {step === 4 && "Pick a subscription package."}
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-md font-medium">
                  {error}
                </div>
              )}

              {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Care home name" error={errors.name?.message}>
                    <Input placeholder="Willow Creek Manor" {...register("name")} />
                  </Field>
                  <Field label="Subdomain" error={errors.subdomain?.message}>
                    <Input placeholder="willow-creek" {...register("subdomain")} />
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="CQC number (optional)">
                      <Input placeholder="1-12345678" {...register("cqcNumber")} />
                    </Field>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <Field
                      label="Address line 1"
                      error={errors.addressLine1?.message}
                    >
                      <Input placeholder="High Street" {...register("addressLine1")} />
                    </Field>
                  </div>
                  <Field label="Address line 2 (optional)">
                    <Input placeholder="Building name" {...register("addressLine2")} />
                  </Field>
                  <Field label="City" error={errors.city?.message}>
                    <Input placeholder="London" {...register("city")} />
                  </Field>
                  <Field label="Postcode" error={errors.postcode?.message}>
                    <Input placeholder="W1 1AA" {...register("postcode")} />
                  </Field>
                </div>
              )}

              {step === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <Field
                      label="Full name"
                      error={errors.primaryContactName?.message}
                    >
                      <Input placeholder="Jane Doe" {...register("primaryContactName")} />
                    </Field>
                  </div>
                  <Field label="Email" error={errors.primaryContactEmail?.message}>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        type="email"
                        autoComplete="email"
                        placeholder="admin@home.co.uk"
                        {...register("primaryContactEmail")}
                      />
                    </div>
                  </Field>
                  <Field
                    label="Phone"
                    error={errors.primaryContactPhone?.message}
                  >
                    <Input
                      type="tel"
                      autoComplete="tel"
                      placeholder="+44 20 1234 5678"
                      {...register("primaryContactPhone")}
                    />
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="Password" error={errors.password?.message}>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...register("password")}
                      />
                    </Field>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  {(packages ?? []).length === 0 && (
                    <p className="text-md text-muted-foreground">
                      No plans are currently available. Please contact support.
                    </p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(packages ?? []).map((pkg) => (
                      <div
                        key={pkg.id}
                        className={cn(
                          "p-5 rounded-xl border-2 cursor-pointer transition-all",
                          watch("packageId") === pkg.id
                            ? "border-primary bg-primary/5 shadow"
                            : "border-slate-100 hover:border-slate-200",
                        )}
                        onClick={() =>
                          setValue("packageId", pkg.id, { shouldValidate: true })
                        }
                      >
                        <h4 className="font-bold">{pkg.name}</h4>
                        <p className="text-md text-muted-foreground mb-3">
                          Up to {pkg.residentLimit} residents · {pkg.staffLimit}{" "}
                          staff
                        </p>
                        <span className="text-xl font-bold">
                          {pkg.currency} {pkg.priceMonthly}
                          <span className="text-md font-medium text-muted-foreground">
                            /mo
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                  {errors.packageId && (
                    <p className="text-md text-red-500 font-medium">
                      {errors.packageId.message}
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" /> Back
                  </Button>
                ) : (
                  <Link href="/login" className="text-md text-muted-foreground hover:text-primary">
                    Already have an account?
                  </Link>
                )}

                {step < 4 ? (
                  <Button type="button" onClick={nextStep} className="gap-2">
                    Continue <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={onboard.isPending}
                    className="gap-2"
                  >
                    {onboard.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Create account
                  </Button>
                )}
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-md font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      {children}
      {error && <p className="text-md text-red-500 font-medium">{error}</p>}
    </div>
  );
}

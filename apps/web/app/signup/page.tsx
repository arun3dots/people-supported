"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { publicOnboardingSchema, type PublicOnboardingDTO } from "@repo/schema";
import {
  CreditCard,
  CheckCircle2,
  Check,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import {
  Button,
  Card,
  Input,
  Label,
  Text,
  Checkbox,
} from "@repo/ui/components/ui";
import {
  useGetPublicPackagesQuery,
  useOnboardMutation,
  type OnboardResult,
} from "../../lib/queries/onboarding/useOnboarding";
import { useRazorpayCheckout } from "../../lib/billing/useRazorpayCheckout";
import { fetchOpenOrder } from "../../lib/queries/billing/useBilling";
import { PolicyLinks } from "./components/PolicyLinks";

export default function SignUpPage() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [result, setResult] = useState<OnboardResult | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paying, setPaying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [termsError, setTermsError] = useState("");

  const router = useRouter();

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

  // Auto-generate a unique subdomain from the organisation name.
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
      ], // step 1: organisation
      ["primaryContactName", "primaryContactEmail", "primaryContactPhone", "password"], // step 2: admin
    ];
    const ok = await trigger(fields[step] as never, { shouldFocus: true });
    if (!ok) return;

    // Password + confirm-password must match before leaving the admin step.
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

      if (!agreeTerms) {
        setTermsError("You must agree to the Terms of Service and Privacy Policy.");
        return;
      }
    }

    // Set the auto-generated subdomain once, before the final full-form
    // validation runs on step 3 (subdomain is required by the schema).
    if (step === 1 && !getValues("subdomain")) {
      setValue("subdomain", buildSubdomain());
    }

    setStep((s) => Math.min(s + 1, 3));
  };

  const onSubmit = async (data: PublicOnboardingDTO) => {
    if (!agreeTerms) {
      setTermsError("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }
    // Subdomain is derived from the organisation name — set before submit.
    const subdomain = data.subdomain || buildSubdomain();

    setError("");
    try {
      const res = await onboard.mutateAsync({ ...data, subdomain });
      setResult(res);
    } catch (e: unknown) {
      const message =
        e instanceof Error
          ? e.message
          : (e as { message?: string })?.message ?? "Onboarding failed";
      setError(message);
    }
  };

  // Success screen after account creation.
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
            <Text as="h2" size="xl" weight="bold" className="tracking-tight">
              Account created! 2
            </Text>
            <Text size="md" weight="regular" className="text-slate-500 leading-relaxed">
              We&apos;ve emailed a verification link and a payment link to your
              primary contact. Verify your email, then complete payment to
              unlock your dashboard.
            </Text>
          </div>
          {paymentError && (
            <Text size="md" className="text-red-500 font-medium">
              {paymentError}
            </Text>
          )}
          {paymentSuccess ? (
            <div className="p-3 bg-emerald-50 text-emerald-700 text-md font-medium rounded-xl border border-emerald-200">
              Payment completed successfully!
            </div>
          ) : (
            (result.paymentToken || result.paymentUrl) && (
              <Button
                className="w-full"
                size="lg"
                variant="primary"
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
            <Button className="w-full" size="lg" variant="outline">
              Go to login
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const STEP_LABELS = ["Organisation", "Admin", "Plan"];

  const headTitle =
    step === 1
      ? "Set up your care home"
      : step === 2
        ? "Your admin account"
        : "Choose a plan";
  const headSubtitle =
    step === 1
      ? "Tell us a little about your care home."
      : step === 2
        ? "Create the first administrator account."
        : "Pick the best plan to start managing your care home.";

  return (
    <div className="flex min-h-screen w-full bg-[#F7FAF9] font-sans overflow-x-hidden">
      {/* Left side: Form Panel */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8 bg-surface-primary-light">
        <Card
          variant="white"
          className="w-full max-w-2xl rounded-2xl border border-slate-200/80 flex flex-col justify-between"
        >
          {/* Header + stepper + progress */}
          <div className="space-y-5">
            <div className="flex flex-col items-center gap-2.5 w-full text-center py-1">
              <Text as="h1" size="3xl" weight="medium" className="leading-tight">
                {headTitle}
              </Text>
              <Text as="p" size="base" weight="normal" className="leading-relaxed text-slate-500">
                {headSubtitle}
              </Text>
            </div>

            {/* Stepper: numbered circles + labels (matches WizardStepper style) */}
            <Card variant="wizard" className="p-5 flex flex-col gap-0 justify-center">
              <div className="flex items-center justify-center w-full max-w-xl mx-auto">
                {STEP_LABELS.map((label, idx) => {
                  const isActive = step === idx + 1;
                  const isCompleted = step > idx + 1;
                  return (
                    <div
                      key={label}
                      className="flex flex-col items-center justify-start relative flex-1 px-1"
                    >
                      {/* Connecting line between step nodes */}
                      {idx < STEP_LABELS.length - 1 && (
                        <div className="absolute top-4 left-[calc(50%+16px)] w-[calc(100%-32px)] h-[2px] bg-slate-200 z-0">
                          <div
                            className={cn(
                              "h-full transition-all duration-300 ease-in-out",
                              isCompleted ? "bg-emerald-800 w-full" : "w-0"
                            )}
                          />
                        </div>
                      )}

                      {/* Step Circle Indicator */}
                      <div
                        className={cn(
                          "cursor-default transition-all duration-200 z-10 size-9 rounded-full flex items-center justify-center font-bold text-md border",
                          isCompleted
                            ? "bg-emerald-800 text-white border-emerald-800"
                            : isActive
                              ? "bg-emerald-800 text-white border-emerald-800"
                              : "bg-white border-slate-300 text-slate-600"
                        )}
                      >
                        {isCompleted ? (
                          <Check className="size-4 stroke-[2.5]" />
                        ) : (
                          <Text as="span" size="md" weight="bold" className="leading-none text-inherit">
                            {idx + 1}
                          </Text>
                        )}
                      </div>

                      {/* Step Label */}
                      <Text
                        size="md"
                        weight={isActive ? "medium" : "regular"}
                        className={cn(
                          "mt-2 text-center font-medium leading-tight",
                          isActive ? "text-emerald-800 font-bold" : isCompleted ? "text-emerald-800 font-semibold" : "text-slate-500"
                        )}
                      >
                        {label}
                      </Text>
                    </div>
                  );
                })}
              </div>
            </Card>

          </div>

          {/* Form Content */}
          <form noValidate
            onSubmit={handleSubmit(onSubmit)}
            className="grow flex flex-col justify-center my-6"
          >
            {error && (
              <div className="p-3 mb-4 rounded-lg bg-red-50">
                <Text size="md" weight="medium" variant="destructive">{error}</Text>
              </div>
            )}

            {/* STEP 1: Organisation details */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2 flex flex-col gap-1.5">
                    <Label required>Care Home Name</Label>
                    <Input
                      type="text"
                      placeholder="Enter your care home name"
                      autoComplete="organization"
                      errorMessage={errors.name?.message}
                      {...register("name")}
                    />
                  </div>

                  <div className="md:col-span-2 flex flex-col gap-1.5">
                    <Label>CQC Number (Optional)</Label>
                    <Input
                      type="text"
                      placeholder="e.g. 1-12345678"
                      errorMessage={errors.cqcNumber?.message}
                      {...register("cqcNumber")}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label>CQC Provider ID (Optional)</Label>
                    <Input
                      type="text"
                      placeholder="e.g. 1-12345678"
                      errorMessage={errors.cqcProviderId?.message}
                      {...register("cqcProviderId")}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label>CQC Location ID (Optional)</Label>
                    <Input
                      type="text"
                      placeholder="e.g. 1-98765432"
                      errorMessage={errors.cqcLocationId?.message}
                      {...register("cqcLocationId")}
                    />
                  </div>

                  <div className="md:col-span-2 flex flex-col gap-1.5">
                    <Label required>Address</Label>
                    <Input
                      type="text"
                      placeholder="Enter your address"
                      autoComplete="address-line1"
                      errorMessage={errors.addressLine1?.message}
                      {...register("addressLine1")}
                    />
                  </div>

                  <div className="md:col-span-2 flex flex-col gap-1.5">
                    <Label>Address Line 2 (Optional)</Label>
                    <Input
                      type="text"
                      placeholder="e.g. Suite 4, Floor 2"
                      autoComplete="address-line2"
                      errorMessage={errors.addressLine2?.message}
                      {...register("addressLine2")}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label required>Town / City</Label>
                    <Input
                      type="text"
                      placeholder="Enter your town / city"
                      autoComplete="address-level2"
                      errorMessage={errors.city?.message}
                      {...register("city")}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label required>Postcode</Label>
                    <Input
                      type="text"
                      placeholder="Enter your postcode"
                      autoComplete="postal-code"
                      errorMessage={errors.postcode?.message}
                      {...register("postcode")}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Admin details */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <Label required>Full Name</Label>
                  <Input
                    type="text"
                    placeholder="e.g. Jane Doe"
                    autoComplete="name"
                    errorMessage={errors.primaryContactName?.message}
                    {...register("primaryContactName")}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <Label required>Email</Label>
                    <Input
                      type="email"
                      placeholder="admin@home.co.uk"
                      autoComplete="email"
                      errorMessage={errors.primaryContactEmail?.message}
                      {...register("primaryContactEmail")}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label required>Mobile Number</Label>
                    <Input
                      type="tel"
                      placeholder="+44 20 1234 5678"
                      autoComplete="tel"
                      errorMessage={errors.primaryContactPhone?.message}
                      {...register("primaryContactPhone")}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label required>Password</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pr-10"
                      autoComplete="new-password"
                      onCopy={(e) => e.preventDefault()}
                      errorMessage={errors.password?.message}
                      {...register("password")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-6 -translate-y-1/2 size-8 text-slate-400 hover:text-slate-600"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label required>Confirm Password</Label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pr-10"
                      autoComplete="new-password"
                      onPaste={(e) => e.preventDefault()}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setConfirmError("");
                      }}
                      errorMessage={confirmError || undefined}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-6 -translate-y-1/2 size-8 text-slate-400 hover:text-slate-600"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-1">
                  <Checkbox
                    id="terms"
                    checked={agreeTerms}
                    onCheckedChange={(c) => {
                      setAgreeTerms(c === true);
                      setTermsError("");
                    }}
                  />
                  <Text as="span" size="md">
                    <PolicyLinks
                      className="text-primary hover:underline"
                    />
                  </Text>
                </div>
                {termsError && <p className="text-md text-rose-600">{termsError}</p>}
              </div>
            )}



            {/* STEP 3: Choose a plan */}
            {step === 3 && (
              <div className="space-y-4">
                {(packages ?? []).length === 0 && (
                  <Text size="md" weight="regular" variant="muted" className="text-center">
                    No plans are currently available. Please contact support.
                  </Text>
                )}
                <div className="grid grid-cols-1  gap-4 max-h-[420px] overflow-y-auto pr-1">
                  {(packages ?? []).map((pkg) => {
                    const selected = selectedPackageId === pkg.id;
                    return (
                      <Card
                        key={pkg.id}
                        variant="surface"
                        role="button"
                        tabIndex={0}
                        onClick={() => setValue("packageId", pkg.id, { shouldValidate: true })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            setValue("packageId", pkg.id, { shouldValidate: true });
                          }
                        }}
                        className={cn(
                          "relative cursor-pointer gap-0 ",
                          selected
                            ? "border-primary bg-primary/5 "
                            : "border-slate-100 bg-white hover:border-slate-200"
                        )}
                      >
                        {selected && (
                          <span className="absolute right-4 top-4 text-primary">
                            <Check className="size-5" />
                          </span>
                        )}
                        <Text as="h4" size="base" weight="bold">{pkg.name}</Text>
                        <div className="mt-1">
                          <Text as="span" size="2xl" weight="bold">
                            {pkg.currency} {pkg.priceMonthly}
                            <Text as="span" size="md" weight="medium" variant="muted">/mo</Text>
                          </Text>
                        </div>
                        <Text size="md" weight="regular" variant="muted" className="mt-3 block">
                          Up to {pkg.residentLimit} residents · {pkg.staffLimit} staff
                        </Text>
                      </Card>
                    );
                  })}
                </div>
                {errors.packageId && (
                  <Text size="md" weight="semibold" variant="destructive">
                    {errors.packageId.message}
                  </Text>
                )}
              </div>
            )}
          </form>

          {/* Navigation Controls */}
          <div className="space-y-4">
            <div className="flex flex-row justify-between items-center w-full">
              {step > 1 ? (
                <Button variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))}>
                  <ChevronLeft className="size-4" /> Back
                </Button>
              ) : (
                <Link href="/login">
                  <Button variant="outline">Sign in</Button>
                </Link>
              )}

              {step < 3 ? (
                <Button variant="primary" onClick={nextStep}>
                  Continue <ChevronRight className="size-4" />
                </Button>
              ) : (
                <Button
                  variant="primary"
                  disabled={onboard.isPending}
                  onClick={handleSubmit(onSubmit)}
                >
                  {onboard.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <><CreditCard className="size-4" /> Create account</>
                  )}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Right side: Brand image */}
      <div className="hidden lg:block lg:w-1/2 relative bg-slate-100">
        <Image
          unoptimized
          src="/images/common/signin-right-image.png"
          alt="Sign up banner"
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CreditCard, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@repo/ui/components/ui";
import type { OnboardResult } from "../../../lib/queries/onboarding/useOnboarding";

interface SignUpSuccessProps {
  result: OnboardResult;
  onPay: () => void;
  isPaying: boolean;
  checkoutLoading: boolean;
  paymentSuccess: boolean;
  paymentError?: string;
  onProceedToDashboard?: () => void;
}

const REDIRECT_DURATION_MS = 5000;

export function SignUpSuccess({
  result,
  onPay,
  isPaying,
  checkoutLoading,
  paymentSuccess,
  paymentError,
  onProceedToDashboard,
}: SignUpSuccessProps) {
  const router = useRouter();
  const isPayLoading = isPaying || checkoutLoading;

  const [remainingMs, setRemainingMs] = useState(REDIRECT_DURATION_MS);
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (!paymentSuccess) return;

    const intervalTime = 50;
    const timer = setInterval(() => {
      setRemainingMs((prev) => {
        const next = prev - intervalTime;
        if (next <= 0) {
          clearInterval(timer);
          if (!redirectedRef.current) {
            redirectedRef.current = true;
            if (onProceedToDashboard) {
              onProceedToDashboard();
            } else {
              router.push("/admin/dashboard");
            }
          }
          return 0;
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [paymentSuccess, router, onProceedToDashboard]);

  const handleGoToLogin = () => {
    redirectedRef.current = true;
    router.push("/login");
  };

  const handleGoToDashboard = () => {
    redirectedRef.current = true;
    if (onProceedToDashboard) {
      onProceedToDashboard();
    } else {
      router.push("/admin/dashboard");
    }
  };

  const progressPercent = Math.min(
    100,
    Math.max(0, ((REDIRECT_DURATION_MS - remainingMs) / REDIRECT_DURATION_MS) * 100)
  );
  const secondsLeft = Math.max(1, Math.ceil(remainingMs / 1000));

  return (
    <div className="w-full max-w-lg bg-white rounded-2xl p-8 sm:p-10 shadow-xl border border-slate-100/80 text-center space-y-6">
      {/* Icon */}
      <div className="size-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-100 shadow-xs">
        <CheckCircle2 className="size-8 stroke-[2.5]" />
      </div>

      {paymentSuccess ? (
        <>
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Payment Successful!
            </h2>
            <p className="text-md text-slate-500 font-medium leading-relaxed">
              Your subscription is now active. We are setting up your supported living workspace.
            </p>
          </div>

          {/* Progress and Countdown Card */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3 text-left">
            <div className="flex items-center justify-between text-md font-semibold">
              <span className="text-slate-700">Auto-redirecting to dashboard</span>
              <span className="text-emerald-800 font-bold">{secondsLeft}s</span>
            </div>

            {/* Animated Progress Bar */}
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-800 h-full rounded-full transition-all duration-75 ease-linear"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <p className="text-md text-slate-500 font-medium leading-normal">
              Press <span className="font-semibold text-slate-700">Go to login</span> if you need to sign in manually, or wait to be automatically redirected to your admin dashboard.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              size="lg"
              variant="outline"
              className="flex-1"
              onClick={handleGoToLogin}
            >
              Go to login
            </Button>
            <Button
              size="lg"
              variant="primary"
              className="flex-1 gap-2"
              onClick={handleGoToDashboard}
            >
              Go to Dashboard now <ArrowRight className="size-4" />
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Account Created!
            </h2>
            <p className="text-md text-slate-500 font-medium leading-relaxed">
              We&apos;ve emailed a verification link and a payment link to your primary
              contact. Complete payment to activate your subscription and unlock your dashboard.
            </p>
          </div>

          {paymentError && (
            <div className="p-3.5 bg-red-50 text-red-600 text-md font-medium rounded-xl border border-red-200">
              {paymentError}
            </div>
          )}

          {(result.paymentToken || result.paymentUrl) && (
            <Button
              size="lg"
              variant="primary"
              className="w-full gap-2"
              onClick={onPay}
              disabled={isPayLoading}
            >
              {isPayLoading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <CreditCard className="size-5" />
              )}
              Pay now
            </Button>
          )}

          <Button
            size="lg"
            variant="outline"
            className="w-full"
            onClick={handleGoToLogin}
          >
            Go to login
          </Button>
        </>
      )}
    </div>
  );
}

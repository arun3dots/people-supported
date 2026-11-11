"use client";

import React, { useState, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, ShieldCheck, CheckCircle2, Lock, AlertCircle, Loader2 } from "lucide-react";
import { resetPasswordWithTokenSchema, type ResetPasswordWithTokenDTO } from "@repo/schema";
import { useResetPasswordMutation } from "../../lib/queries/auth/authMutations";
import { useToast } from "@repo/ui/hooks";
import {
  Button,
  Input,
  Label,
  Alert,
  AlertDescription,
  AlertTitle,
} from "@repo/ui/components/ui";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { toast } = useToast();
  const resetPasswordMutation = useResetPasswordMutation();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordWithTokenDTO>({
    resolver: zodResolver(resetPasswordWithTokenSchema),
    defaultValues: {
      resetToken: token,
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (token) {
      setValue("resetToken", token);
    }
  }, [token, setValue]);

  const onSubmit = async (data: ResetPasswordWithTokenDTO) => {
    if (!token) {
      toast({
        variant: "destructive",
        title: "Invalid Link",
        description: "Password reset token is missing from the URL.",
      });
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync(
        {
          resetToken: data.resetToken,
          newPassword: data.newPassword,
          confirmPassword: data.confirmPassword,
        },
        {
          onSuccess: () => {
            setIsSubmitted(true);
            toast({
              title: "Password Updated",
              description: "Your password has been successfully reset.",
              variant: "success",
            });
          },
          onError: (err) => {
            toast({
              variant: "destructive",
              title: "Reset Failed",
              description: err.message || "Failed to reset password. Link may be expired.",
            });
          },
        }
      );
    } catch (error) {
      // Error handled in onError callback
    }
  };

  if (!token) {
    return (
      <div className="w-full max-w-md bg-white rounded-2xl p-8 sm:p-10 shadow-xl border border-slate-100/80 text-center space-y-6">
        <div className="size-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
          <AlertCircle className="size-7 stroke-[2.5]" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Invalid Reset Link</h2>
          <p className="text-base text-slate-500 font-medium leading-relaxed">
            No reset token was found in the URL. Please check your email link or request a new password reset.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => router.push("/login")}
          className="w-full h-11 text-base font-semibold"
        >
          Go to Sign In
        </Button>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="w-full max-w-md bg-white rounded-2xl p-8 sm:p-10 shadow-xl border border-slate-100/80 text-center space-y-6">
        <div className="size-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
          <CheckCircle2 className="size-7 stroke-[2.5]" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Password Reset Complete</h2>
          <p className="text-base text-slate-500 font-medium leading-relaxed">
            Your password has been updated successfully. You can now log in using your new password.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => router.push("/login")}
          className="w-full h-11 text-base font-semibold"
        >
          Return to Sign In
        </Button>
      </div>
    );
  }

  const isPending = resetPasswordMutation.isPending || isSubmitting;

  return (
    <div className="w-full max-w-md bg-white rounded-2xl p-8 sm:p-10 shadow-xl border border-slate-100/80 space-y-1">
      <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
        <div className="size-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
          <Lock className="size-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Set New Password</h1>
          <p className="text-md text-slate-500 font-medium mt-0.5">
            Please enter your strong new password below.
          </p>
        </div>
      </div>

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-1">
        <div className="space-y-1.5">
          <Label htmlFor="new-password">New Password</Label>
          <div className="relative w-full">
            <Input
              id="new-password"
              type={showNewPassword ? "text" : "password"}
              {...register("newPassword")}
              placeholder="Enter new password"
              className="pr-10"
              errorMessage={errors.newPassword?.message}
            />
            <button
              type="button"
              className="absolute right-3 top-[11px] text-slate-400 hover:text-slate-600 focus:outline-none z-10 cursor-pointer"
              onClick={() => setShowNewPassword(!showNewPassword)}
              aria-label="Toggle password visibility"
            >
              {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm-password">Confirm New Password</Label>
          <div className="relative w-full">
            <Input
              id="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              {...register("confirmPassword")}
              placeholder="Confirm new password"
              className="pr-10"
              errorMessage={errors.confirmPassword?.message}
            />
            <button
              type="button"
              className="absolute right-3 top-[11px] text-slate-400 hover:text-slate-600 focus:outline-none z-10 cursor-pointer"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label="Toggle password visibility"
            >
              {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <Alert className="bg-slate-50 border-slate-200 shadow-none ">
          <ShieldCheck className="size-4 text-emerald-700" />
          <AlertTitle className="text-md font-semibold text-slate-800">Password Requirements</AlertTitle>
          <AlertDescription className="text-md text-slate-600 mt-1.5">
            <ul className="list-disc list-inside space-y-1">
              <li>At least 8 characters long</li>
              <li>At least one uppercase letter (A-Z)</li>
              <li>At least one numeric digit (0-9)</li>
            </ul>
          </AlertDescription>
        </Alert>

        <Button
          size={'lg'}
          type="submit"
          className="w-full mt-5"
          disabled={isPending}
        >
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {isPending ? "Updating Password..." : "Reset Password"}
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen w-full bg-[#F7FAF9] flex items-center justify-center p-4 sm:p-8 font-sans overflow-hidden">
      <Suspense
        fallback={
          <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-xl border border-slate-100 text-center text-slate-500 font-medium">
            Loading reset form...
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}

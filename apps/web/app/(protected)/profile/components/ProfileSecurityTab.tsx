"use client";

import React, { useEffect, useState } from "react";
import { Check, RefreshCw, KeyRound } from "lucide-react";
import { Card, Button, Text, Badge, toast } from "@repo/ui/components/ui";
import { useResendVerificationMutation } from "../../../../lib/queries/auth/authMutations";
import { ProfileSecurityDialog } from "./ProfileSecurityDialog";

interface ProfileSecurityTabProps {
  mfaEnabled?: boolean;
  emailVerified?: boolean;
  passwordChangedAt?: string | null;
  onChangePassword?: () => void;
}

interface SecurityItem {
  label: string;
  passed: boolean;
}

export function ProfileSecurityTab({
  mfaEnabled = false,
  emailVerified = false,
  passwordChangedAt,
  onChangePassword,
}: ProfileSecurityTabProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const resendVerificationMutation = useResendVerificationMutation({
    onSuccess: (data) => {
      if (data.alreadyVerified) {
        toast({
          title: "Already verified",
          description: "Your email is already verified.",
        });
      } else {
        toast({
          title: "Verification email sent",
          description:
            "Check your inbox and follow the link to verify your email.",
          variant: "success",
        });
      }
    },
    onError: (error) =>
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send verification email",
      }),
  });

  const isPasswordFresh = passwordChangedAt
    ? (Date.now() - new Date(passwordChangedAt).getTime()) /
        (1000 * 60 * 60 * 24) <=
      90
    : true;

  // Criteria backed by real profile data.
  const wireableItems: SecurityItem[] = [
    { label: "MFA Enabled", passed: mfaEnabled },
    { label: "Email Verified", passed: emailVerified },
    { label: "Password updated within 90 days", passed: isPasswordFresh },
  ];
  const unwireableItems: SecurityItem[] = [];
  const securityItems = [...wireableItems, ...unwireableItems];

  // Score from the wireable criteria only.
  const score = Math.round(
    (wireableItems.filter((i) => i.passed).length / wireableItems.length) *
    100,
  );
  const scoreLabel =
    score === 100
      ? "Very Strong"
      : score >= 50
        ? "Fair"
        : "Weak";

  // Trigger smooth radial chart animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(score);
    }, 150);
    return () => clearTimeout(timer);
  }, [score]);

  // SVG Radial Math Parameters
  const radius = 50;
  const circumference = 2 * Math.PI * radius; // ≈ 314.159
  const strokeDashoffset =
    circumference - (animatedProgress / 100) * circumference;

  return (
    <Card className="p-5 sm:p-6 flex flex-col items-center gap-4 border border-slate-200/80 shadow-none w-full font-sans">
      {/* Title */}
      <Text size={'base'} weight={'bold'} className="w-full text-center text-slate-900">
        Account Security
      </Text>

      {/* Radial Chart Container */}
      <div className="relative size-28 flex items-center justify-center my-1">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          {/* Background Ring */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="10"
          />
          {/* Animated Foreground Progress Ring */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#065f46"
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Text Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <Text size={'lg'} weight={'bold'} className="text-slate-900">
            {score}%
          </Text>
          <Text size={'xs'} weight={'semibold'} className="text-emerald-800">
            {scoreLabel}
          </Text>
        </div>
      </div>

      {/* Security Checklist */}
      <div className="w-full flex flex-col gap-2.5 my-1 divide-y divide-slate-100">
        {securityItems.map((item, idx) => {
          return (
            <div key={idx} className="flex items-center justify-between w-full pt-2 first:pt-0">
              {/* Left: Icon + Label */}
              <div className="flex items-center gap-2 min-w-0">
                {item.passed ? (
                  <div className="size-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <Check className="size-2.5 text-emerald-800 stroke-[3]" />
                  </div>
                ) : (
                  <div className="size-4 flex items-center justify-center shrink-0">
                    <RefreshCw className="size-3 text-amber-500 stroke-[2.5]" />
                  </div>
                )}
                <Text size="sm" weight="medium" className="text-slate-700 truncate">
                  {item.label}
                </Text>
              </div>

              {/* Right: Badge / Action */}
              {item.label === "Email Verified" && !emailVerified ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => resendVerificationMutation.mutate()}
                  disabled={resendVerificationMutation.isPending}
                  className="rounded-xl px-2.5 font-medium shrink-0 shadow-none border-slate-200 cursor-pointer"
                >
                  {resendVerificationMutation.isPending
                    ? "Sending…"
                    : "Resend"}
                </Button>
              ) : (
                <Badge variant="secondary" state={item.passed ? "success" : "inactive"} className="px-2.5 py-0.5 shadow-none">
                  {item.passed ? "Strong" : "Weak"}
                </Badge>
              )}
            </div>
          );
        })}
      </div>

      {/* Change Password Button */}
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          if (onChangePassword) {
            onChangePassword();
          } else {
            setPasswordDialogOpen(true);
          }
        }}
        className="w-full h-10 rounded-xl text-md font-regular text-slate-700 flex items-center justify-center gap-2 shadow-none border-slate-200 bg-white hover:bg-slate-50 mt-1"
      >
        <KeyRound className="size-4 text-emerald-800" />
        <span>Change Password</span>
      </Button>

      {/* Password Change Dialog */}
      <ProfileSecurityDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
      />
    </Card>
  );
}

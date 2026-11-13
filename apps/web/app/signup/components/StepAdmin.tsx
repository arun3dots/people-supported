"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { PublicOnboardingDTO } from "@repo/schema";
import {
  Input,
  Label,
  Checkbox,
} from "@repo/ui/components/ui";
import { PolicyLinks } from "./PolicyLinks";

interface StepAdminProps {
  register: UseFormRegister<PublicOnboardingDTO>;
  errors: FieldErrors<PublicOnboardingDTO>;
  confirmPassword: string;
  onConfirmPasswordChange: (value: string) => void;
  confirmError?: string;
  agreeTerms: boolean;
  onAgreeTermsChange: (agreed: boolean) => void;
  termsError?: string;
}

export function StepAdmin({
  register,
  errors,
  confirmPassword,
  onConfirmPasswordChange,
  confirmError,
  agreeTerms,
  onAgreeTermsChange,
  termsError,
}: StepAdminProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="space-y-4">
      {/* Full Name */}
      <div className="space-y-1.5">
        <Label htmlFor="admin-name" required>
          Full Name
        </Label>
        <Input
          id="admin-name"
          type="text"
          placeholder="e.g. Jane Doe"
          autoComplete="name"
          errorMessage={errors.primaryContactName?.message}
          {...register("primaryContactName")}
        />
      </div>

      {/* Email & Phone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
        <div className="space-y-1.5">
          <Label htmlFor="admin-email" required>
            Email Address
          </Label>
          <Input
            id="admin-email"
            type="email"
            placeholder="admin@example.com"
            autoComplete="email"
            errorMessage={errors.primaryContactEmail?.message}
            {...register("primaryContactEmail")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="admin-phone" required>
            Mobile Number
          </Label>
          <Input
            id="admin-phone"
            type="tel"
            placeholder="+44 7700 900888"
            autoComplete="tel"
            errorMessage={errors.primaryContactPhone?.message}
            {...register("primaryContactPhone")}
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <Label htmlFor="admin-password" required>
          Password
        </Label>
        <div className="relative w-full">
          <Input
            id="admin-password"
            type={showPassword ? "text" : "password"}
            placeholder="At least 8 characters"
            className="pr-10"
            autoComplete="new-password"
            errorMessage={errors.password?.message}
            {...register("password")}
          />
          <button
            type="button"
            className="absolute right-3 top-[11px] text-slate-400 hover:text-slate-600 focus:outline-none z-10 cursor-pointer"
            onClick={() => setShowPassword(!showPassword)}
            aria-label="Toggle password visibility"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      {/* Confirm Password */}
      <div className="space-y-1.5">
        <Label htmlFor="admin-confirm-password" required>
          Confirm Password
        </Label>
        <div className="relative w-full">
          <Input
            id="admin-confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm password"
            className="pr-10"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            errorMessage={confirmError}
          />
          <button
            type="button"
            className="absolute right-3 top-[11px] text-slate-400 hover:text-slate-600 focus:outline-none z-10 cursor-pointer"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label="Toggle confirm password visibility"
          >
            {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      {/* Terms and conditions */}
      <div className="flex items-center gap-2 pt-2">
        <Checkbox
          id="terms"
          checked={agreeTerms}
          onCheckedChange={(checked) => onAgreeTermsChange(checked === true)}
        />
        <label
          htmlFor="terms"
          className="text-md font-medium text-slate-600 cursor-pointer select-none"
        >
          <PolicyLinks
            className="font-semibold text-emerald-800 hover:underline"
          />
        </label>
      </div>
      {termsError && <p className="text-md text-rose-600">{termsError}</p>}

    </div>
  );
}

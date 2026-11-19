"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema, type ChangePasswordDTO } from "@repo/schema";
import { useChangePasswordMutation } from "../../../../../lib/queries/auth/authMutations";
import {
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import { useAuth } from "../../../../../lib/context/AuthContext";
import {
  Button,
  Input,
  toast,
} from "@repo/ui/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Label,
} from "@repo/ui/components/ui";
import { AccountSecuritySection } from "../components/AccountSecuritySection";
import { AuthenticationSecuritySection } from "../components/AuthenticationSecuritySection";
import { RecentActivitiesSection } from "../components/RecentActivitiesSection";

export function SecuritySettings() {
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* ═══ Page Title ═══ */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#141F1E]">
          Security
        </h1>
        <p className="text-[#5D5D5D] mt-1 text-md">
          Manage security settings and account protection
        </p>
      </div>

      {/* ═══ Top Row — Status + Score ═══ */}
      <AccountSecuritySection />

      {/* ═══ Middle Row — Authentication + Security Settings ═══ */}
      <AuthenticationSecuritySection />

      {/* ═══ Bottom Row — Active Sessions + Recent Security Activity ═══ */}
      <RecentActivitiesSection />

      {/* ═══ Change Password Dialog ═══ */}
      <ChangePasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */
/*  Change Password Dialog (self-contained)                */
/* ─────────────────────────────────────────────────────── */
function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { logout } = useAuth();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordDTO>({
    resolver: zodResolver(changePasswordSchema),
  });

  const mutation = useChangePasswordMutation({
    onSuccess: () => {
      reset();
      toast({
        title: "Password Updated",
        description: "Your password has been successfully changed. Redirecting to login...",
        variant: "success",
      });
      onOpenChange(false);
      setTimeout(() => {
        void logout();
      }, 1000);
    },
    onError: (error) =>
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "error",
      }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader className="pb-4 border-b border-gray-100 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-[#141F1E]">
            <KeyRound className="w-5 h-5 text-[#4A706A]" /> Change Password
          </DialogTitle>
          <DialogDescription className="text-md text-[#5D5D5D]">
            Use a strong, unique password to keep your account secure.
          </DialogDescription>
        </DialogHeader>

        <form noValidate
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          className="space-y-5 py-4"
        >
          <div className="space-y-1.5">
            <Label>
              Current Password
            </Label>
            <div className="relative w-full">
              <Input
                type={showCurrentPassword ? "text" : "password"}
                placeholder="Enter current password"
                {...register("currentPassword")}
                errorMessage={errors.currentPassword?.message}
                className="pr-10 rounded-xl border-[#BCD3CD] focus-visible:ring-[#4A706A]"
              />
              <button
                type="button"
                className="absolute right-3 top-[11px] text-slate-400 hover:text-slate-600 focus:outline-none z-10 cursor-pointer"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                aria-label="Toggle current password visibility"
              >
                {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>
              New Password
            </Label>
            <div className="relative w-full">
              <Input
                type={showNewPassword ? "text" : "password"}
                placeholder="Minimum 8 characters"
                {...register("newPassword")}
                errorMessage={errors.newPassword?.message}
                className="pr-10 rounded-xl border-[#BCD3CD] focus-visible:ring-[#4A706A]"
              />
              <button
                type="button"
                className="absolute right-3 top-[11px] text-slate-400 hover:text-slate-600 focus:outline-none z-10 cursor-pointer"
                onClick={() => setShowNewPassword(!showNewPassword)}
                aria-label="Toggle new password visibility"
              >
                {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>
              Confirm New Password
            </Label>
            <div className="relative w-full">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Repeat new password"
                {...register("confirmPassword")}
                errorMessage={errors.confirmPassword?.message}
                className="pr-10 rounded-xl border-[#BCD3CD] focus-visible:ring-[#4A706A]"
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

          <DialogFooter className="pt-4 border-t border-gray-100 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="gap-2 bg-[#4A706A] hover:bg-[#3D5C57] text-white rounded-xl"
            >
              {mutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCcw className="size-4" />
              )}
              Update Password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema, type ChangePasswordDTO } from "@repo/schema";
import { useChangePasswordMutation } from "../../../../../lib/queries/auth/authMutations";
import {
  KeyRound,
  Loader2,
  RefreshCcw,
} from "lucide-react";
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
        description: "Your password has been successfully changed.",
        variant: "success",
      });
      onOpenChange(false);
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
            <Input
              type="password"
              placeholder="Enter current password"
              {...register("currentPassword")}
              errorMessage={errors.currentPassword?.message}
              className="rounded-xl border-[#BCD3CD] focus-visible:ring-[#4A706A]"
            />
          </div>

          <div className="space-y-1.5">
            <Label>
              New Password
            </Label>
            <Input
              type="password"
              placeholder="Minimum 8 characters"
              {...register("newPassword")}
              errorMessage={errors.newPassword?.message}
              className="rounded-xl border-[#BCD3CD] focus-visible:ring-[#4A706A]"
            />
          </div>

          <div className="space-y-1.5">
            <Label>
              Confirm New Password
            </Label>
            <Input
              type="password"
              placeholder="Repeat new password"
              {...register("confirmPassword")}
              errorMessage={errors.confirmPassword?.message}
              className="rounded-xl border-[#BCD3CD] focus-visible:ring-[#4A706A]"
            />
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

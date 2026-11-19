"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema, type ChangePasswordDTO } from "@repo/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Label,
  toast,
} from "@repo/ui/components/ui";
import { useQueryClient } from "@tanstack/react-query";
import { GET_MY_PROFILE } from "@repo/endpoints";
import { Eye, EyeOff, KeyRound, Loader2, RefreshCcw } from "lucide-react";
import { useChangePasswordMutation } from "../../../../lib/queries/auth/authMutations";
import { useAuth } from "../../../../lib/context/AuthContext";

interface ProfileSecurityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileSecurityDialog({
  open,
  onOpenChange,
}: ProfileSecurityDialogProps) {
  const { logout } = useAuth();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const queryClient = useQueryClient();
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
      queryClient.invalidateQueries({ queryKey: [GET_MY_PROFILE] });
      queryClient.invalidateQueries({ queryKey: ["auditLogs"] });
      reset();
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully. Redirecting to login...",
        variant: "success",
      });
      onOpenChange(false);
      setTimeout(() => {
        void logout();
      }, 1000);
    },
    onError: (error) =>
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to change password",
      }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="font-sans">
        <DialogHeader className="pb-3 border-b border-slate-100 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <KeyRound className="size-5 text-emerald-800" /> Change Password
          </DialogTitle>
          <DialogDescription className="text-md text-slate-500">
            Use a strong, unique password to keep your account secure.
          </DialogDescription>
        </DialogHeader>

        <form noValidate
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          className="space-y-4 py-3"
        >
          <div className="space-y-1.5">
            <Label required htmlFor="currentPassword">
              Current Password
            </Label>
            <div className="relative w-full">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                placeholder="Enter current password"
                {...register("currentPassword")}
                errorMessage={errors.currentPassword?.message}
                className="pr-10 rounded-xl border-slate-200 text-md focus-visible:ring-emerald-800"
              />
              <button
                type="button"
                className="absolute right-3 top-[11px] text-slate-400 hover:text-slate-600 focus:outline-none z-10 cursor-pointer"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                aria-label="Toggle current password visibility"
              >
                {showCurrentPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label required htmlFor="newPassword">
              New Password
            </Label>
            <div className="relative w-full">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                placeholder="Minimum 8 characters (1 uppercase, 1 number)"
                {...register("newPassword")}
                errorMessage={errors.newPassword?.message}
                className="pr-10 rounded-xl border-slate-200 text-md focus-visible:ring-emerald-800"
              />
              <button
                type="button"
                className="absolute right-3 top-[11px] text-slate-400 hover:text-slate-600 focus:outline-none z-10 cursor-pointer"
                onClick={() => setShowNewPassword(!showNewPassword)}
                aria-label="Toggle new password visibility"
              >
                {showNewPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label required htmlFor="confirmPassword">
              Confirm New Password
            </Label>
            <div className="relative w-full">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Repeat new password"
                {...register("confirmPassword")}
                errorMessage={errors.confirmPassword?.message}
                className="pr-10 rounded-xl border-slate-200 text-md focus-visible:ring-emerald-800"
              />
              <button
                type="button"
                className="absolute right-3 top-[11px] text-slate-400 hover:text-slate-600 focus:outline-none z-10 cursor-pointer"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label="Toggle confirm password visibility"
              >
                {showConfirmPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
              className="rounded-xl text-md"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={mutation.isPending}
              className="rounded-xl text-md flex items-center gap-1.5"
            >
              {mutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCcw className="size-3.5" />
              )}
              <span>Update Password</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

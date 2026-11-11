"use client";

import React from "react";
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
import { KeyRound, Loader2, RefreshCcw } from "lucide-react";
import { useChangePasswordMutation } from "../../../../lib/queries/auth/authMutations";

interface ProfileSecurityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileSecurityDialog({
  open,
  onOpenChange,
}: ProfileSecurityDialogProps) {
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
        description: "Your password has been changed successfully.",
        variant: "success",
      });
      onOpenChange(false);
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
            <Input
              id="currentPassword"
              type="password"
              placeholder="Enter current password"
              {...register("currentPassword")}
              errorMessage={errors.currentPassword?.message}
              className="rounded-xl border-slate-200 text-md focus-visible:ring-emerald-800"
            />
          </div>

          <div className="space-y-1.5">
            <Label required htmlFor="newPassword">
              New Password
            </Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="Minimum 8 characters (1 , 1 number)"
              {...register("newPassword")}
              errorMessage={errors.newPassword?.message}
              className="rounded-xl border-slate-200 text-md focus-visible:ring-emerald-800"
            />
          </div>

          <div className="space-y-1.5">
            <Label required htmlFor="confirmPassword">
              Confirm New Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Repeat new password"
              {...register("confirmPassword")}
              errorMessage={errors.confirmPassword?.message}
              className="rounded-xl border-slate-200 text-md focus-visible:ring-emerald-800"
            />
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

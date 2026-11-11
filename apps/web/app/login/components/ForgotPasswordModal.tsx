"use client";

import React, { useState, useEffect } from "react";
import { Mail, CheckCircle2, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button
} from "@repo/ui/components/ui";
import { useForgotPasswordMutation } from "../../../lib/queries/auth/authMutations";
import { useToast } from "@repo/ui/hooks";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");

  const { toast } = useToast();
  const forgotPasswordMutation = useForgotPasswordMutation();

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setEmail("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: "Please enter a valid email address.",
      });
      return;
    }

    forgotPasswordMutation.mutate(
      { email },
      {
        onSuccess: () => {
          toast({
            title: "Reset Link Sent",
            description: `We've emailed a 5-minute reset link to ${email}`,
          });
          setStep(2);
        },
        onError: (err) => {
          toast({
            variant: "destructive",
            title: "Request Failed",
            description: err.message || "Failed to send password reset link",
          });
        },
      },
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="md">
        <DialogHeader className="border-b pb-4 border-slate-100 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-xl font-bold text-slate-900">
              {step === 1 ? "Forgot Password?" : "Check Your Email"}
            </DialogTitle>
            <p className="text-md text-slate-500 font-medium mt-0.5">
              {step === 1
                ? "Enter your registered email address to receive a reset link."
                : `Password reset link sent to ${email}`}
            </p>
          </div>
        </DialogHeader>

        <div className="py-2">
          {step === 1 ? (
            <form noValidate onSubmit={handleSendEmail} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-md font-bold text-slate-800" htmlFor="reset-email">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-md sm:text-md font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4A706A]/30 focus:border-[#4A706A] transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={forgotPasswordMutation.isPending}
                className="w-full h-11 rounded-xl bg-[#4A706A] hover:bg-[#3D5E59] text-white font-bold text-md sm:text-md shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                {forgotPasswordMutation.isPending ? "Sending Link..." : "Send Reset Link"}
              </button>
            </form>
          ) : (
            <div className="text-center py-4 space-y-5">
              <div className="size-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="size-8 stroke-[2.5]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">Reset Link Sent</h3>
                <p className="text-md text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                  We have sent a password reset link to <strong className="text-slate-800">{email}</strong>.
                  The link is valid for <strong className="text-[#4A706A]">5 minutes</strong>.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Button
                  type="button"
                  onClick={onClose}
                >
                  Return to Sign In
                </Button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full h-11 rounded-xl border border-slate-200 text-slate-700 font-bold text-md hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="size-4" /> Try another email
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

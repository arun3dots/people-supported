"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, KeyRound, RefreshCw, LogOut, QrCode } from "lucide-react";
import { makeAPICall } from "../../../lib/api";
import { useAuth } from "../../../lib/context/AuthContext";
import { useToast } from "@repo/ui/hooks";

interface GenerateMfaResponse {
  secret: string;
  qrCode: string;
}

function MfaVerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshUser, logout } = useAuth();
  const { toast } = useToast();

  const initialSetup = searchParams.get("setup") === "1";
  const [isSetupMode, setIsSetupMode] = useState(initialSetup);
  const [qrData, setQrData] = useState<GenerateMfaResponse | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);

  const [token, setToken] = useState("");
  const [verifying, setVerifying] = useState(false);

  // Recovery state
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState(user?.email || "");
  const [resetOtp, setResetOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    if (user?.email && !resetEmail) {
      setResetEmail(user.email);
    }
  }, [user?.email, resetEmail]);

  const handleGenerateQr = async () => {
    setLoadingQr(true);
    try {
      const data = await makeAPICall<GenerateMfaResponse>("GENERATE_MFA");
      setQrData(data);
      setIsSetupMode(true);
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "MFA Enrollment Error",
        description:
          err instanceof Error ? err.message : "Could not generate MFA secret",
      });
    } finally {
      setLoadingQr(false);
    }
  };

  useEffect(() => {
    if (initialSetup && !qrData && !loadingQr) {
      void handleGenerateQr();
    }
  }, [initialSetup]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim().length !== 6) {
      toast({
        variant: "destructive",
        title: "Invalid code",
        description: "Please enter a 6-digit authenticator code.",
      });
      return;
    }

    setVerifying(true);
    try {
      await makeAPICall("MFA_VERIFY", { token: token.trim() });
      await refreshUser();
      toast({
        title: "MFA Verified",
        description: "Two-factor authentication succeeded.",
      });
      router.push("/dashboard");
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Verification failed",
        description:
          err instanceof Error ? err.message : "Invalid authenticator code",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetLoading(true);
    try {
      await makeAPICall("REQUEST_MFA_RESET", { email: resetEmail });
      setOtpSent(true);
      toast({
        title: "Recovery code sent",
        description: "Check your registered email for a 6-digit recovery OTP.",
      });
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Reset request failed",
        description:
          err instanceof Error ? err.message : "Unable to send recovery OTP",
      });
    } finally {
      setResetLoading(false);
    }
  };

  const handleVerifyReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    try {
      await makeAPICall("VERIFY_MFA_RESET", {
        email: resetEmail,
        otp: resetOtp.trim(),
      });
      toast({
        title: "MFA Reset Complete",
        description: "Please scan the new QR code to enroll your authenticator.",
      });
      setShowReset(false);
      setOtpSent(false);
      setResetOtp("");
      await handleGenerateQr();
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "OTP verification failed",
        description:
          err instanceof Error ? err.message : "Invalid or expired OTP",
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="bg-white rounded-2xl p-6 sm:p-10 shadow-xl border border-slate-100/80 max-w-md w-full space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
              <ShieldCheck className="size-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Two-Factor Authentication
              </h1>
              <p className="text-md text-slate-500">
                UK GDPR & DSPT Clinical Data Protection
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            className="text-md font-semibold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 cursor-pointer"
          >
            <LogOut className="size-3.5" /> Sign out
          </button>
        </div>

        {!showReset ? (
          <>
            {isSetupMode && (
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
                <p className="text-md font-semibold text-slate-800">
                  Step 1: Scan this QR code with your Authenticator App (Google
                  Authenticator, Microsoft Authenticator, or Authy)
                </p>
                {loadingQr ? (
                  <div className="py-8 text-center text-md text-slate-500">
                    Generating secure TOTP secret...
                  </div>
                ) : qrData ? (
                  <div className="flex flex-col items-center space-y-2">
                    <img
                      src={qrData.qrCode}
                      alt="TOTP QR Code"
                      className="size-44 rounded-lg border border-slate-200 bg-white p-2"
                    />
                    <p className="text-md text-slate-500 break-all text-center">
                      Manual key:{" "}
                      <code className="font-mono font-bold text-slate-800">
                        {qrData.secret}
                      </code>
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleGenerateQr}
                    className="w-full py-2 px-3 rounded-lg bg-emerald-700 text-white text-md font-semibold hover:bg-emerald-800 cursor-pointer"
                  >
                    Generate QR Code
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="totp-code"
                  className="text-md font-bold text-slate-800 block"
                >
                  {isSetupMode
                    ? "Step 2: Enter 6-digit code to activate MFA"
                    : "Authenticator 6-Digit Code"}
                </label>
                <input
                  id="totp-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  value={token}
                  onChange={(e) =>
                    setToken(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-center tracking-widest text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-700"
                />
              </div>

              <button
                type="submit"
                disabled={verifying || token.length !== 6}
                className="w-full h-11 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-md shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                {verifying ? "Verifying..." : "Verify & Continue"}
              </button>
            </form>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-md">
              {!isSetupMode ? (
                <button
                  type="button"
                  onClick={handleGenerateQr}
                  className="text-emerald-800 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <QrCode className="size-3.5" /> First time setting up MFA?
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSetupMode(false)}
                  className="text-slate-600 font-medium hover:underline cursor-pointer"
                >
                  Already enrolled? Enter code
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowReset(true)}
                className="text-slate-600 hover:text-slate-900 font-medium hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <KeyRound className="size-3.5" /> Lost authenticator?
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <p className="text-md text-slate-600">
              Reset your authenticator device using a one-time recovery code sent
              to your registered work email.
            </p>
            {!otpSent ? (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-md font-bold text-slate-800 block">
                    Registered Email
                  </label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-md text-slate-800"
                  />
                </div>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full h-11 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-md cursor-pointer disabled:opacity-50"
                >
                  {resetLoading ? "Sending OTP..." : "Send Recovery OTP"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyReset} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-md font-bold text-slate-800 block">
                    6-Digit Email Recovery OTP
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={resetOtp}
                    onChange={(e) =>
                      setResetOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-center tracking-widest font-bold text-slate-900"
                  />
                </div>
                <button
                  type="submit"
                  disabled={resetLoading || resetOtp.length !== 6}
                  className="w-full h-11 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-md cursor-pointer disabled:opacity-50"
                >
                  {resetLoading ? "Resetting MFA..." : "Confirm MFA Reset"}
                </button>
              </form>
            )}
            <button
              type="button"
              onClick={() => {
                setShowReset(false);
                setOtpSent(false);
              }}
              className="w-full text-center text-md font-semibold text-slate-500 hover:text-slate-800 inline-flex items-center justify-center gap-1 cursor-pointer"
            >
              <RefreshCw className="size-3.5" /> Back to Authenticator Code
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MfaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-md text-slate-600">
          Loading security verification...
        </div>
      }
    >
      <MfaVerificationContent />
    </Suspense>
  );
}


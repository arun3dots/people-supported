"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@repo/ui/components/ui/Button";
import { Card, CardContent } from "@repo/ui/components/ui/Card";
import { makeAPICall } from "../../lib/api";
import { VERIFY_TENANT } from "@repo/endpoints";

import { Suspense } from "react";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("Verifying your account...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    const verify = async () => {
      try {
        await makeAPICall(VERIFY_TENANT, {}, { token });
        setStatus("success");
        setMessage(
          "Your email has been successfully verified! You can now log in to your dashboard.",
        );
      } catch (error: unknown) {
        setStatus("error");
        const err =
          error as { message?: string } | null;
        setMessage(
          err?.message ||
            "Failed to verify account. The link may be expired or invalid.",
        );
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card variant="white" className="max-w-md w-full border-border/50 shadow-2xl overflow-hidden rounded-2xl">
        <CardContent className="p-12 text-center space-y-6">
          {status === "loading" && (
            <div className="space-y-6 flex flex-col items-center">
              <div className="h-20 w-20 bg-primary/10 text-primary rounded-2xl flex items-center justify-center animate-pulse">
                <Loader2 className="h-10 w-10 animate-spin" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Verifying Account
                </h1>
                <p className="text-muted-foreground mt-2 font-medium">
                  {message}
                </p>
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-6 flex flex-col items-center animate-in zoom-in-95 duration-500">
              <div className="h-20 w-20 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-100/50">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Verified!
                </h1>
                <p className="text-muted-foreground mt-2 font-medium leading-relaxed">
                  {message}
                </p>
              </div>
              <Button
                onClick={() => router.push("/login")}
                className="w-full h-14 rounded-xl font-bold text-white shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group"
              >
                Go to Login
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-6 flex flex-col items-center animate-in zoom-in-95 duration-500">
              <div className="h-20 w-20 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-100/50">
                <XCircle className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Verification Failed
                </h1>
                <p className="text-muted-foreground mt-2 font-medium leading-relaxed">
                  {message}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push("/")}
                className="w-full h-14 rounded-xl font-bold border-slate-200"
              >
                Back to Home
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Background patterns */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden opacity-40">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-400/10 blur-[120px] rounded-full" />
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}

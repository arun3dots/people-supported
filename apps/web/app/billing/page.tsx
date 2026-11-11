"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock } from "lucide-react";
import { Button, Card, CardContent } from "@repo/ui/components/ui";
import { useAuth } from "../../lib/context/AuthContext";

function BillingResult() {
  const params = useSearchParams();
  const paid = params.get("paid") === "1";
  const { user, refreshUser } = useAuth();

  // Refresh the session so the gating overlay clears once we're back.
  useEffect(() => {
    if (paid) void refreshUser();
  }, [paid, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center space-y-6">
          <div
            className={`mx-auto h-16 w-16 rounded-2xl flex items-center justify-center ${paid
                ? "bg-green-100 text-green-600"
                : "bg-amber-100 text-amber-600"
              }`}
          >
            {paid ? (
              <CheckCircle2 className="h-8 w-8" />
            ) : (
              <Clock className="h-8 w-8" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {paid ? "Payment successful" : "Payment pending"}
            </h2>
            <p className="mt-2 text-md text-muted-foreground">
              {paid
                ? "Your subscription is now active. You have full access to the dashboard."
                : "We haven't confirmed your payment yet. If you completed it, it may take a moment — or try again from the dashboard."}
            </p>
          </div>
          <Link href={user ? "/dashboard" : "/login"}>
            <Button size="lg" className="w-full">
              {user ? "Go to dashboard" : "Go to login"}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={null}>
      <BillingResult />
    </Suspense>
  );
}

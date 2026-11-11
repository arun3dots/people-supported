"use client";

import { Lock, LogOut } from "lucide-react";
import { Button } from "@repo/ui/components/ui";

/**
 * Lock screen shown to non-Admin tenant users (Manager/Nurse/Carer/Resident)
 * when their organisation's subscription is not active. Payment is the Admin's
 * responsibility, so this is purely informational — no pay/choose actions, only
 * the ability to log out.
 */
export function SubscriptionInactiveNotice({
  onLogout,
}: {
  onLogout: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Lock className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Subscription inactive
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Your organisation&apos;s subscription is not active yet. Please contact
          your administrator to complete the subscription payment. Access will
          unlock automatically once it&apos;s done.
        </p>

        <div className="mt-8">
          <Button
            size="lg"
            variant="outline"
            className="w-full gap-2"
            onClick={onLogout}
          >
            <LogOut className="h-5 w-5" />
            Log out
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Lock, CreditCard, LogOut, Loader2, RefreshCcw } from "lucide-react";
import { Button } from "@repo/ui/components/ui";
import { useAuth } from "../context/AuthContext";
import {
  useBillingStatusQuery,
  useSelectPackageMutation,
  fetchPaymentLink,
  fetchOrder,
} from "../queries/billing/useBilling";
import { useGetPublicPackagesQuery } from "../queries/onboarding/useOnboarding";
import { PackageChooser } from "./PackageChooser";
import { SubscriptionInactiveNotice } from "./SubscriptionInactiveNotice";
import { useRazorpayCheckout } from "./useRazorpayCheckout";


/**
 * Routes where the gate must never show — the payment pages themselves (so the
 * user can actually complete payment) and public/auth routes.
 */
const OVERLAY_EXEMPT_PREFIXES = [
  "/pay",
  "/billing",
  "/onboarding",
  "/login",
  "/verify",
];

/**
 * Full-screen subscription gate for a logged-in tenant whose subscription is not
 * active. Behaviour depends on role:
 *  - Tenant **Admin**: can choose a package (if none assigned), switch package,
 *    and pay. Polls billing status so the gate lifts once payment is confirmed.
 *  - Any other tenant role: a non-actionable "contact your administrator" notice
 *    (payment is the Admin's responsibility).
 *  - SuperAdmin (no tenant): never gated.
 */
export function PaymentRequiredOverlay() {
  const { user, loading, logout, refreshUser } = useAuth();
  const pathname = usePathname();

  const isExemptRoute = OVERLAY_EXEMPT_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  // Gate only authenticated tenant users whose subscription isn't active/trial,
  // and never on the payment/auth routes themselves. Email verification takes
  // precedence — don't show this while the email is still unverified.
  const gated =
    !isExemptRoute &&
    !loading &&
    !!user?.tenantId &&
    user.emailVerified !== false &&
    user.subscriptionStatus !== undefined &&
    user.subscriptionStatus !== "active" &&
    user.subscriptionStatus !== "trial";

  const isAdmin = user?.roleName === "Admin";
  const adminGated = gated && isAdmin;

  const { data: billing } = useBillingStatusQuery({
    enabled: gated,
    refetchInterval: gated ? 10000 : false,
    refetchOnWindowFocus: true,
  });
  const { data: packages } = useGetPublicPackagesQuery({ enabled: adminGated });
  const selectMutation = useSelectPackageMutation();
  const { openCheckout, loading: checkoutLoading } = useRazorpayCheckout({
    onSuccess: useCallback(() => void refreshUser(), [refreshUser]),
    onError: useCallback(() => {
      // Silent — user can retry. Could surface a toast here if desired.
    }, []),
  });

  const [choosing, setChoosing] = useState(false);
  const [opening, setOpening] = useState(false);

  // Payment confirmed elsewhere -> refresh the user so the gate lifts.
  useEffect(() => {
    if (gated && billing?.subscriptionStatus === "active") {
      void refreshUser();
    }
  }, [gated, billing?.subscriptionStatus, refreshUser]);

  if (!gated) return null;

  // Sub-roles can't pay — just inform them and let them log out.
  if (!isAdmin) {
    return <SubscriptionInactiveNotice onLogout={() => void logout()} />;
  }

  const hasPackage = billing?.packageId != null;
  // Show the chooser when explicitly switching, or when no package is assigned
  // yet (once billing has loaded so we don't flash it prematurely).
  const showChooser = choosing || (billing !== undefined && !hasPackage);
  const paymentUrl = billing?.paymentUrl ?? user?.paymentUrl;

  const handleSelect = async (packageId: string) => {
    try {
      await selectMutation.mutateAsync(packageId);
      setChoosing(false);
      // Refetch billing (invalidated by the mutation) so the pay view reflects
      // the newly-chosen plan + fresh link.
      await refreshUser();
    } catch {
      // Errors surface via the disabled state; keep the chooser open to retry.
    }
  };

  /**
   * Opens the Razorpay in-app modal. Falls back to the external URL for
   * the manual provider (dev) or when the Razorpay key is not configured.
   */
  const handlePay = async () => {
    setOpening(true);
    try {
      const order = await fetchOrder();
      // Empty key = manual provider. Fall back to existing external link.
      if (!order.key) {
        let url = paymentUrl;
        if (!url) {
          const res = await fetchPaymentLink();
          url = res.paymentUrl;
        }
        if (url) window.open(url, "_blank", "noopener,noreferrer");
        return;
      }
      await openCheckout(order);
    } catch {
      // Silent — user can retry via the button.
    } finally {
      setOpening(false);
    }
  };

  const busyId = selectMutation.isPending
    ? (selectMutation.variables ?? null)
    : null;


  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Lock className="h-8 w-8" />
        </div>

        {showChooser ? (
          <>
            <h2 className="text-center text-2xl font-bold tracking-tight text-foreground">
              {hasPackage ? "Switch your plan" : "Choose your plan"}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-center text-sm text-muted-foreground">
              Select a subscription package to continue. You&apos;ll be taken to
              payment next — access unlocks automatically once it&apos;s
              completed.
            </p>

            <div className="mt-6">
              {packages === undefined ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <PackageChooser
                  packages={packages}
                  selectedId={billing?.packageId}
                  busyId={busyId}
                  onSelect={handleSelect}
                />
              )}
            </div>

            <div className="mt-8 flex flex-col gap-3">
              {hasPackage && (
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full"
                  onClick={() => setChoosing(false)}
                  disabled={selectMutation.isPending}
                >
                  Back
                </Button>
              )}
              <Button
                size="lg"
                variant="ghost"
                className="w-full gap-2"
                onClick={() => void logout()}
              >
                <LogOut className="h-5 w-5" />
                Log out
              </Button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-center text-2xl font-bold tracking-tight text-foreground">
              Subscription payment required
            </h2>
            <p className="mx-auto mt-3 max-w-md text-center text-sm text-muted-foreground">
              {billing?.packageName
                ? `Complete payment for the ${billing.packageName} plan to use the features.`
                : "Complete your subscription payment to use the features."}{" "}
              Once paid, this will unlock automatically.
            </p>

            <div className="mt-8 flex flex-col gap-3">
              <Button
                size="lg"
                className="w-full gap-2"
                onClick={handlePay}
                disabled={opening}
              >
                {opening ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <CreditCard className="h-5 w-5" />
                )}
                Make payment
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full gap-2"
                onClick={() => setChoosing(true)}
              >
                <RefreshCcw className="h-5 w-5" />
                Switch package
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="w-full gap-2"
                onClick={() => void logout()}
              >
                <LogOut className="h-5 w-5" />
                Log out
              </Button>
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Waiting for payment confirmation… this page updates automatically.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

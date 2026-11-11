"use client";

import { Button, Text } from "@repo/ui/components/ui";
import {
  CheckCircle2,
  Globe,
  UserCircle,
  ShieldCheck,
} from "lucide-react";
import type { CreatedTenant } from "../../../../lib/types/tenant";

interface OnboardingSuccessProps {
  tenant: CreatedTenant | null;
  onBack: () => void;
  onCreateAnother: () => void;
}

export function OnboardingSuccess({
  tenant,
  onBack,
  onCreateAnother,
}: OnboardingSuccessProps) {
  return (
    <div className="max-w-2xl mx-auto py-8 text-center space-y-6 animate-in zoom-in-95 duration-300 font-sans">
      <div className="size-20 bg-emerald-100 text-emerald-800 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
        <CheckCircle2 className="size-10" />
      </div>
      <div>
        <Text as="h1" size="xl" weight="bold" className="text-slate-900 tracking-tight">
          Tenant Successfully Onboarded!
        </Text>
        <Text size="sm" variant="subdued" className="mt-2">
          Infrastructure for{" "}
          <span className="text-emerald-800 font-bold">{tenant?.name}</span> is being provisioned.
        </Text>
      </div>

      <div className="bg-surface-card-grey rounded-2xl p-6 lg:p-8 space-y-5 shadow-none border-none">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div className="p-4 rounded-xl bg-white border border-slate-200/70 flex flex-col items-center text-center">
            <Globe className="size-5 text-emerald-800 mb-2" />
            <Text size="xs" variant="subdued" className="uppercase font-semibold tracking-wider block mb-0.5 text-2xs">
              Production URL
            </Text>
            <code className="text-xs font-semibold text-slate-800 font-mono">
              {tenant?.subdomain}.cantracare.com
            </code>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200/70 flex flex-col items-center text-center">
            <UserCircle className="size-5 text-emerald-800 mb-2" />
            <Text size="xs" variant="subdued" className="uppercase font-semibold tracking-wider block mb-0.5 text-2xs">
              Admin Account
            </Text>
            <Text size="xs" weight="semibold" className="text-slate-800 truncate w-full">
              {tenant?.primaryContactEmail}
            </Text>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/60 flex items-start gap-3.5 text-left">
          <div className="size-8 shrink-0 bg-white rounded-lg flex items-center justify-center text-amber-700 shadow-2xs">
            <ShieldCheck className="size-4" />
          </div>
          <div>
            <Text as="h4" size="xs" weight="bold" className="text-amber-900">
              Next Step: Verification &amp; Payment
            </Text>
            <Text size="xs" className="text-amber-800 leading-relaxed mt-0.5">
              A verification email and a subscription payment link have been sent to the primary contact. The tenant can log in, but the dashboard stays locked until payment is completed.
            </Text>
          </div>
        </div>

        {tenant?.paymentUrl && (
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/60 text-left space-y-2">
            <Text size="xs" weight="bold" className="uppercase text-emerald-900 tracking-wider block text-2xs">
              Payment Link
            </Text>
            <code className="text-xs break-all block text-slate-800 font-mono">
              {tenant.paymentUrl}
            </code>
            <a href={tenant.paymentUrl} target="_blank" rel="noreferrer">
              <Button size="sm" variant="primary" className="mt-1 text-xs">
                Open Payment Link
              </Button>
            </a>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 pt-2">
        <Button
          variant="outline"
          onClick={onBack}
        >
          Back to Dashboard
        </Button>
        <Button
          variant="primary"
          onClick={onCreateAnother}
        >
          Onboard Another
        </Button>
      </div>
    </div>
  );
}

"use client";

import { Text } from "@repo/ui/components/ui";
import {
  Building2,
  MapPin,
  UserCircle,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

interface StepMeta {
  icon: LucideIcon;
  title: string;
  description: string;
}

const STEP_META: Record<number, StepMeta> = {
  1: {
    icon: Building2,
    title: "Identity & Infrastructure",
    description: "Define the care home brand and unique access subdomain.",
  },
  2: {
    icon: MapPin,
    title: "Registered Location",
    description: "Configure the physical location of the care home.",
  },
  3: {
    icon: UserCircle,
    title: "Primary Administrator",
    description: "Specify the primary contact responsible for the environment.",
  },
  4: {
    icon: ShieldCheck,
    title: "Subscription & Security",
    description: "Select a subscription tier and finalize security settings.",
  },
};

export function OnboardingStepHeader({ step }: { step: number }) {
  const meta = STEP_META[step] ?? STEP_META[1]!;
  const Icon = meta.icon;

  return (
    <div className="flex items-center gap-4 pb-4 border-b border-slate-200/80">
      <div className="size-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-800 shrink-0">
        <Icon className="size-6" />
      </div>
      <div>
        <Text as="h2" size="md" weight="bold" className="text-slate-900">
          {meta.title}
        </Text>
        <Text size="xs" weight="regular" variant="subdued" className="mt-0.5">
          {meta.description}
        </Text>
      </div>
    </div>
  );
}

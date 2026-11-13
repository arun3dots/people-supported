"use client";

import React from "react";
import Link from "next/link";
import {
  Button,
  Badge,
  Text,
} from "@repo/ui/components/ui";
import { CheckCircle, CheckCircle2, ArrowRight, User } from "lucide-react";
import { useAuth } from "../../../../../lib/context/AuthContext";

interface AdmissionSuccessScreenProps {
  residentId: string;
  residentName: string;
  roomNumber?: string;
  admissionDate: string;
  carePlanId?: string;
}

export function AdmissionSuccessScreen({
  residentId,
  residentName,
  roomNumber = "104, Nursing Wing",
  admissionDate,
  carePlanId,
}: AdmissionSuccessScreenProps) {
  const { user } = useAuth();
  const roleLower = user?.roleName?.toLowerCase();
  const roleBase = roleLower === "carer" ? "carer" : "admin";

  const automatedActions = [
    "Tenant profile created and made visible across all modules",
    "Initial Master Support Plan (v0001) drafted from Medical History & ADL Assessment — pending clinical review",
    "Daily task suggestions pre-populated from ADL scores (e.g. bathing assistance, mobility support)",
    "MAR seeded with current medication list",
    "Supported workers notified: assigned team and key worker group",
    "21-day comprehensive support plan review reminder scheduled",
    "Billing record created and linked to Responsible Party",
    "Belongings inventory and document files archived to tenant record",
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
        <div>
          <Text as="h2" size="xl" weight="bold" className="text-slate-900 tracking-tight">
            Admission Confirmed
          </Text>
          <Text size="md" weight="regular" className="text-slate-500 mt-0.5">
            Tenant record activated and downstream tasks scheduled.
          </Text>
        </div>
        <Badge state="success" className="px-3 py-1 rounded-full">
          Tenant Active
        </Badge>
      </div>

      {/* Main Success Card */}
      <div className="p-8 bg-surface-card-grey rounded-2xl text-center space-y-2.5 shadow-none border-none">
        <div className="inline-flex size-14 rounded-full bg-emerald-50 items-center justify-center text-emerald-800 mb-1 border-2 border-emerald-100 shadow-xs">
          <CheckCircle className="size-8 stroke-[2.5]" />
        </div>
        <Text as="h3" size="2xl" weight="bold" className="text-slate-900">
          ✓ {residentName} has been admitted
        </Text>
        <Text size="md" weight="semibold" className="text-emerald-800">
          Tenant ID: {residentId} &nbsp;•&nbsp; Room {roomNumber} &nbsp;•&nbsp; Admitted {admissionDate}
        </Text>
      </div>

      {/* System Actions Checklist */}
      <div className="bg-surface-card-grey rounded-2xl p-6 lg:p-8 space-y-4 shadow-none border-none">
        <div className="pb-3 border-b border-slate-200/80">
          <Text as="h3" size="md" weight="bold" className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <CheckCircle2 className="size-4" />
            </div>
            System Actions Triggered Automatically
          </Text>
        </div>
        <div className="space-y-2.5 pt-2">
          {automatedActions.map((action, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl border border-slate-200/70 bg-white flex items-center justify-between shadow-xs gap-3"
            >
              <Text as="span" size="md" weight="medium" className="text-slate-800">
                {action}
              </Text>
              <Badge state="success" className="px-2.5 py-0.5 rounded-full shrink-0">
                Done
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
        <Link href={`/${roleBase}/residents`} className="w-full sm:w-auto">
          <Button variant="outline" className="w-full gap-2">
            <User className="size-4" /> View Tenants Directory
          </Button>
        </Link>

        {carePlanId ? (
          <Link href={`/${roleBase}/care-plans/${carePlanId}`} className="w-full sm:w-auto">
            <Button variant="primary" className="w-full gap-2">
              Go to Care Plan → Review &amp; Approve v0001 <ArrowRight className="size-4" />
            </Button>
          </Link>
        ) : (
          <Link
            href={`/${roleBase}/residents/${residentId}`}
            className="w-full sm:w-auto"
          >
            <Button variant="primary" className="w-full gap-2">
              Complete onboarding <ArrowRight className="size-4" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

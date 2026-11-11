"use client";

import React from "react";
import Link from "next/link";
import { Clock, Play } from "lucide-react";
import { Button, Card, Spinner, Text, toast } from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import { useAuth } from "../../../../lib/context/AuthContext";
import {
  useGetActiveShiftQuery,
  useStartShiftMutation,
} from "../../../../lib/queries/shifts";
import { Shift } from "../../../../lib/types/shifts";
import { getShiftClockInEligibility } from "../../../../lib/utils/shift-timing";

interface CarerShiftGateProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function CarerShiftGate({
  children,
  title = "Shift Not Started",
  description = "You must start your shift before accessing this section.",
}: CarerShiftGateProps) {
  const { user } = useAuth();
  const isCarer = user?.roleName?.toLowerCase() === "carer";
  const { data: shiftData, isLoading } = useGetActiveShiftQuery({
    enabled: isCarer,
  });
  const startShiftMutation = useStartShiftMutation();

  if (!isCarer) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <Spinner />
      </div>
    );
  }

  const currentShift = (shiftData?.active || shiftData?.next) as Shift | null;
  const isStarted = Boolean(shiftData?.active?.isStarted || shiftData?.next?.isStarted);

  if (isStarted) {
    return <>{children}</>;
  }

  const eligibility = getShiftClockInEligibility(currentShift);

  const handleStartShift = () => {
    if (!currentShift?.id || !eligibility.isToday) {
      toast({
        title: "No Scheduled Shift Found",
        description: "Please check your scheduled shifts or ask a manager.",
        variant: "destructive",
      });
      return;
    }
    if (eligibility.isDraft) {
      toast({
        title: "Draft Shift",
        description: "This shift is in draft status and has not been published yet.",
        variant: "destructive",
      });
      return;
    }
    if (!eligibility.isTimeReached) {
      toast({
        title: "Shift Not Started Yet",
        description: eligibility.reason || "You cannot clock in before your scheduled shift start time.",
        variant: "destructive",
      });
      return;
    }
    startShiftMutation.mutate(
      { shiftId: currentShift.id },
      {
        onSuccess: () => {
          toast({
            title: "Shift Started",
            description: "You have clocked in. Resident care routines are now unlocked.",
          });
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : "Failed to start shift";
          toast({
            title: "Clock In Failed",
            description: msg,
            variant: "destructive",
          });
        },
      },
    );
  };

  const gateDescription =
    !currentShift || !eligibility.isToday
      ? "No active shift is currently scheduled for today on your rota."
      : !eligibility.isTimeReached
        ? `Your shift starts at ${eligibility.formattedStartTime}. Please clock in once your shift begins.`
        : description;

  return (
    <div className="max-w-2xl mx-auto my-8 sm:my-14 font-sans">
      <Card className="p-8 sm:p-10 rounded-2xl border border-amber-200 bg-white text-center space-y-4 shadow-sm">
        <div className="size-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-800 shadow-2xs">
          <Clock className="size-7" />
        </div>

        <div className="space-y-1.5">
          <Text as="h2" size="lg" weight="bold" className="text-slate-900">
            {title}
          </Text>
          <Text size="md" className="text-slate-600 max-w-lg mx-auto">
            {gateDescription}
          </Text>
        </div>

        {currentShift && eligibility.isToday ? (
          <div className="pt-2">
            <Button
              type="button"
              variant="primary"
              size="lg"
              disabled={!eligibility.canClockIn || startShiftMutation.isPending}
              onClick={handleStartShift}
              title={eligibility.reason || "Start Shift"}
              className={cn(
                "rounded-xl font-semibold px-6 shadow-none",
                eligibility.canClockIn && !startShiftMutation.isPending
                  ? "cursor-pointer"
                  : "opacity-60 cursor-not-allowed",
              )}
            >
              <Play className="size-4 fill-current mr-2" />
              {startShiftMutation.isPending
                ? "Starting shift…"
                : !eligibility.isTimeReached && eligibility.formattedStartTime
                  ? `Clock in available at ${eligibility.formattedStartTime}`
                  : "Start Shift / Clock In"}
            </Button>
          </div>
        ) : (
          <div className="pt-2 space-y-2">
            <Text size="sm" className="text-amber-800 font-medium">
              No shift is currently scheduled for today on your rota.
            </Text>
            <div>
              <Button asChild variant="outline" size="lg" className="rounded-xl shadow-none">
                <Link href="/carer/shifts">View Your Shift Rota</Link>
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

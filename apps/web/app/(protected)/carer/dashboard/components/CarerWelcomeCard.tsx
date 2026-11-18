"use client";

import React from "react";
import { Heart, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { Card, Button, Badge } from "@repo/ui/components/ui";

interface CarerWelcomeCardProps {
  user: any;
  pendingTasksCount: number;
}

export function CarerWelcomeCard({
  user,
  pendingTasksCount,
}: CarerWelcomeCardProps) {
  const firstName = user?.fullName?.split(" ")[0] || "Carer";

  return (
    <Card className="relative overflow-hidden p-6 sm:p-8 md:p-10 rounded-2xl border-none shadow-sm bg-gradient-to-br from-[#2D4541] via-[#35524D] to-[#3D5C57] text-white">
      {/* Background Decorative Rings */}
      <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-white/5 blur-2xl pointer-events-none" />
      <div className="absolute right-10 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none hidden lg:block">
        <Heart className="size-64 stroke-[1.2]" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-4 max-w-2xl">
          {/* Shift Status Pill */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-md font-bold tracking-wider bg-white/15 text-emerald-200 backdrop-blur-md border border-white/10">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              Current Shift Active
            </span>
            <span className="inline-flex items-center gap-1 text-md text-white/70 font-medium">
              <ShieldCheck className="size-3.5 text-emerald-300" />
              Supported Worker
            </span>
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white">
              Welcome back, {firstName}
            </h2>
            <p className="text-white/80 text-md sm:text-base font-normal mt-1 leading-relaxed">
              You have{" "}
              <span className="font-bold text-white underline decoration-emerald-400 decoration-2 underline-offset-4">
                {pendingTasksCount} care tasks
              </span>{" "}
              scheduled for your assigned residents during this shift.
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="shrink-0 flex items-center gap-3">
          <Button
            size="lg"
            className="h-12 px-6 rounded-xl bg-white text-[#2D4541] hover:bg-white/90 font-bold text-md sm:text-md shadow-md transition-all duration-200 hover:scale-[1.02] cursor-pointer gap-2"
            onClick={() => {
              const el = document.getElementById("upcoming-tasks-section");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <Sparkles className="size-4 text-emerald-700" />
            Start Care Round
            <ArrowRight className="size-4 text-[#2D4541]" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

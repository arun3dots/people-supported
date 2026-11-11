"use client";

import React from "react";
import { TrendingUp, Activity } from "lucide-react";
import { Card } from "@repo/ui/components/ui";

interface AdminWelcomeCardProps {
  residentCount: number;
  staffCount: number;
  isLoading?: boolean;
}

export function AdminWelcomeCard({
  residentCount,
  staffCount,
  isLoading,
}: AdminWelcomeCardProps) {
  return (
    <Card
      variant="primary"
      className="xl:col-span-3 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between group min-h-[320px]"
    >
      <div className="flex-1 space-y-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
            <TrendingUp className="w-9 h-9" />
          </div>
          <div>
            <p className="text-white/60 text-md font-semibold  tracking-widest">
              Admin Control Centre
            </p>
            <h2 className="text-4xl font-semibold tracking-tight">
              Facility Overview
            </h2>
          </div>
        </div>

        <div className="flex gap-16 pt-4">
          <div>
            <p className="text-white/40 text-[10px] font-semibold  tracking-[0.3em]">
              Residents
            </p>
            <p className="font-semibold mt-1 leading-none tracking-tighter text-6xl xl:text-7xl">
              {isLoading ? "..." : residentCount}
            </p>
          </div>
          <div>
            <p className="text-white/40 text-[10px] font-semibold  tracking-[0.3em]">
              Staff
            </p>
            <p className="font-semibold mt-1 leading-none tracking-tighter text-6xl xl:text-7xl">
              {isLoading ? "..." : staffCount}
            </p>
          </div>
        </div>
      </div>

      <div className="hidden lg:block opacity-30 group-hover:opacity-50 transition-opacity">
        <Activity size={160} strokeWidth={1} />
      </div>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { useGetResidentQuery } from "../../../../../../lib/queries/residents";
import { ResidentProfileSidebar } from "../../../../../shared/components/ResidentProfileSidebar";
import { CarerResidentCareTabs } from "./CarerResidentCareTabs";
import { DateSelector } from "@repo/ui/components/ui";
import { Calendar } from "lucide-react";

interface CarerResidentProfileClientProps {
  id: string;
}

export function CarerResidentProfileClient({
  id,
}: CarerResidentProfileClientProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { data: resident, isLoading } = useGetResidentQuery(id);

  if (isLoading) {
    return (
      <div className="h-[500px] flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!resident) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold">Resident not found</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <ResidentProfileSidebar
          resident={resident}
          // Carers might not have discharge permissions, so we can hide or disable it
          onDischargeClick={() => { }}
        />

        <div className="w-full md:w-2/3 lg:w-3/4 space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Daily View</h3>
                <p className="text-md text-muted-foreground">
                  Showing records for selected date
                </p>
              </div>
            </div>
            <div className="w-48">
              <DateSelector
                selected={selectedDate}
                onChange={(date: unknown) => setSelectedDate(date as Date)}
                maxDate={new Date()}
              />
            </div>
          </div>

          <CarerResidentCareTabs
            resident={resident}
            selectedDate={selectedDate}
          />
        </div>
      </div>
    </div>
  );
}

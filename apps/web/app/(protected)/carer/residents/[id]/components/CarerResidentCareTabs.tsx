"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { Activity, Pill, ClipboardList, ShieldAlert, FileText, UserRound, Droplet } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui";
import { ObservationTab } from "../../../../../shared/components/ObservationTab";
import { TimelineTab } from "../../../../../shared/components/TimelineTab";
import { CarePlanTab } from "../../../../../shared/components/CarePlanTab";
import { MedicationTab } from "../../../../../shared/components/MedicationTab";
import { RiskAssessmentTab } from "../../../../../shared/components/risk-assessment/RiskAssessmentTab";
import { BodyMapTab } from "../../../../../shared/components/body-map";
import { FluidIntakeTab } from "../../../../../shared/components/FluidIntakeTab";

interface CarerResidentCareTabsProps {
  resident: any;
  selectedDate: Date;
}

export function CarerResidentCareTabs({
  resident,
  selectedDate,
}: CarerResidentCareTabsProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const initialTab = searchParams.get("tab")?.toLowerCase() || "tasks";
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("tab", newTab);
      window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
    }
  };

  useEffect(() => {
    const onPop = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab")?.toLowerCase();
      if (tab) setActiveTab(tab);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="w-full justify-start h-12 bg-white shadow-xs border border-slate-200/80 rounded-2xl p-1 gap-1 overflow-x-auto hide-scrollbar">
        <TabsTrigger
          value="tasks"
          className="data-[state=active]:bg-[#3D5C57] data-[state=active]:text-white data-[state=active]:shadow-xs h-10 px-4 rounded-xl font-bold text-md transition-all flex items-center gap-1.5"
        >
          <ClipboardList className="size-4" /> Tasks
        </TabsTrigger>
        <TabsTrigger
          value="medication"
          className="data-[state=active]:bg-[#3D5C57] data-[state=active]:text-white data-[state=active]:shadow-xs h-10 px-4 rounded-xl font-bold text-md transition-all flex items-center gap-1.5"
        >
          <Pill className="size-4" /> eMAR
        </TabsTrigger>
        <TabsTrigger
          value="observations"
          className="data-[state=active]:bg-[#3D5C57] data-[state=active]:text-white data-[state=active]:shadow-xs h-10 px-4 rounded-xl font-bold text-md transition-all flex items-center gap-1.5"
        >
          <Activity className="size-4" /> Observations
        </TabsTrigger>
        <TabsTrigger
          value="notes"
          className="data-[state=active]:bg-[#3D5C57] data-[state=active]:text-white data-[state=active]:shadow-xs h-10 px-4 rounded-xl font-bold text-md transition-all flex items-center gap-1.5"
        >
          <FileText className="size-4" /> Care Notes
        </TabsTrigger>
        <TabsTrigger
          value="risk"
          className="data-[state=active]:bg-[#3D5C57] data-[state=active]:text-white data-[state=active]:shadow-xs h-10 px-4 rounded-xl font-bold text-md transition-all flex items-center gap-1.5"
        >
          <ShieldAlert className="size-4" /> Risk Assessments
        </TabsTrigger>
        <TabsTrigger
          value="fluid-intake"
          className="data-[state=active]:bg-[#3D5C57] data-[state=active]:text-white data-[state=active]:shadow-xs h-10 px-4 rounded-xl font-bold text-md transition-all flex items-center gap-1.5"
        >
          <Droplet className="size-4" /> Fluid Intake
        </TabsTrigger>
        <TabsTrigger
          value="bodymap"
          className="data-[state=active]:bg-[#3D5C57] data-[state=active]:text-white data-[state=active]:shadow-xs h-10 px-4 rounded-xl font-bold text-sm transition-all flex items-center gap-1.5"
        >
          <UserRound className="size-4" /> Body Map
        </TabsTrigger>
      </TabsList>

      <div className="mt-6">
        <TabsContent value="tasks" className="m-0 focus-visible:outline-none">
          <CarePlanTab residentId={resident.id} selectedDate={selectedDate} resident={resident} />
        </TabsContent>

        <TabsContent value="medication" className="m-0 focus-visible:outline-none">
          <MedicationTab residentId={resident.id} selectedDate={selectedDate} />
        </TabsContent>

        <TabsContent value="observations" className="m-0 focus-visible:outline-none">
          <ObservationTab
            residentId={resident.id}
            selectedDate={selectedDate}
          />
        </TabsContent>

        <TabsContent value="notes" className="m-0 focus-visible:outline-none">
          <TimelineTab residentId={resident.id} selectedDate={selectedDate} />
        </TabsContent>

        <TabsContent value="risk" className="m-0 focus-visible:outline-none">
          <RiskAssessmentTab residentId={resident.id} />
        </TabsContent>

        <TabsContent value="fluid-intake" className="m-0 focus-visible:outline-none">
          <FluidIntakeTab
            residentId={resident.id}
            residentStatus={resident.status}
            isDraft={resident.isDraft}
            selectedDate={selectedDate}
          />
        </TabsContent>

        <TabsContent value="bodymap" className="m-0 focus-visible:outline-none">
          <BodyMapTab residentId={resident.id} resident={resident} />
        </TabsContent>
      </div>
    </Tabs>
  );
}

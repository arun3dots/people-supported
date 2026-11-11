"use client";

import React from "react";
import {
  Activity,
  Heart,
  AlertTriangle,
  Pill,
  ClipboardList,
  Phone,
  Mail,
  Plus,
  Clock,
  UserRound,
  Droplet,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Button,
} from "@repo/ui/components/ui";
import { ObservationTab } from "../../../../../shared/components/ObservationTab";
import { TimelineTab } from "../../../../../shared/components/TimelineTab";
import { CarePlanTab } from "../../../../../shared/components/CarePlanTab";
import { MedicationTab } from "../../../../../shared/components/MedicationTab";
import { RiskAssessmentTab } from "../../../../../shared/components/risk-assessment";
import { DocumentsTab } from "../../../../../shared/components/DocumentsTab";
import { BodyMapTab } from "../../../../../shared/components/body-map";
import { FluidIntakeTab } from "../../../../../shared/components/FluidIntakeTab";
import { format } from "date-fns";

interface ResidentCareTabsProps {
  resident: any;
  selectedDate: Date;
}

export function ResidentCareTabs({
  resident,
  selectedDate,
}: ResidentCareTabsProps) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="w-full justify-start h-14 bg-white shadow-sm border border-border p-1 overflow-x-auto hide-scrollbar">
        <TabsTrigger
          value="overview"
          className="data-[state=active]:bg-primary/5 data-[state=active]:text-primary h-11 px-6 rounded-lg transition-all"
        >
          <Activity className="w-4 h-4 mr-2" /> Overview
        </TabsTrigger>
        <TabsTrigger
          value="timeline"
          className="data-[state=active]:bg-primary/5 data-[state=active]:text-primary h-11 px-6 rounded-lg transition-all"
        >
          <Clock className="w-4 h-4 mr-2" /> Timeline
        </TabsTrigger>
        <TabsTrigger
          value="observations"
          className="data-[state=active]:bg-primary/5 data-[state=active]:text-primary h-11 px-6 rounded-lg transition-all"
        >
          <Activity className="w-4 h-4 mr-2" /> Observations
        </TabsTrigger>
        <TabsTrigger
          value="careplan"
          className="data-[state=active]:bg-primary/5 data-[state=active]:text-primary h-11 px-6 rounded-lg transition-all"
        >
          <Heart className="w-4 h-4 mr-2" /> Care Plan
        </TabsTrigger>
        <TabsTrigger
          value="risk"
          className="data-[state=active]:bg-primary/5 data-[state=active]:text-primary h-11 px-6 rounded-lg transition-all"
        >
          <AlertTriangle className="w-4 h-4 mr-2" /> Risk Assessment
        </TabsTrigger>
        <TabsTrigger
          value="medication"
          className="data-[state=active]:bg-primary/5 data-[state=active]:text-primary h-11 px-6 rounded-lg transition-all"
        >
          <Pill className="w-4 h-4 mr-2" /> eMAR
        </TabsTrigger>
        <TabsTrigger
          value="fluid-intake"
          className="data-[state=active]:bg-primary/5 data-[state=active]:text-primary h-11 px-6 rounded-lg transition-all"
        >
          <Droplet className="w-4 h-4 mr-2" /> Fluid Intake
        </TabsTrigger>
        <TabsTrigger
          value="bodymap"
          className="data-[state=active]:bg-primary/5 data-[state=active]:text-primary h-11 px-6 rounded-lg transition-all"
        >
          <UserRound className="w-4 h-4 mr-2" /> Body Map
        </TabsTrigger>
        <TabsTrigger
          value="documents"
          className="data-[state=active]:bg-primary/5 data-[state=active]:text-primary h-11 px-6 rounded-lg transition-all"
        >
          <ClipboardList className="w-4 h-4 mr-2" /> Documents
        </TabsTrigger>
      </TabsList>

      <div className="mt-6">
        <TabsContent
          value="overview"
          className="space-y-6 m-0 animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Next of Kin */}
            <Card className="shadow-md border-border">
              <CardHeader>
                <CardTitle className="text-lg">Next of Kin</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {resident.nextOfKin?.map((nok: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 bg-muted/20 rounded-xl border border-border"
                  >
                    <p className="font-semibold text-foreground flex items-center justify-between">
                      {nok.name} <Badge variant="outline">{nok.relation}</Badge>
                    </p>
                    <div className="mt-3 space-y-2 text-md text-muted-foreground">
                      <p className="flex items-center gap-2">
                        <Phone className="w-4 h-4" /> {nok.phone}
                      </p>
                      {nok.email && (
                        <p className="flex items-center gap-2">
                          <Mail className="w-4 h-4" /> {nok.email}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {!resident.nextOfKin?.length && (
                  <p className="text-md text-muted-foreground italic">
                    No next of kin recorded.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats or Care Summaries */}
            <Card className="shadow-md border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Recent Observations</CardTitle>
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Activity className="w-4 h-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                {resident.observations?.length > 0 ? (
                  <div className="space-y-4">
                    {resident.observations
                      .slice(0, 3)
                      .map((obs: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-muted/20 border border-border rounded-xl hover:bg-muted/30 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-md text-white ${obs.news2Score === 0
                                ? "bg-green-500"
                                : obs.news2Score <= 4
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                                }`}
                            >
                              {obs.news2Score}
                            </div>
                            <div>
                              <p className="text-md font-bold text-foreground">
                                NEWS2 Score
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {format(
                                  new Date(obs.timestamp),
                                  "MMM d, h:mm a",
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-md font-bold">
                              {obs.temp || "--"}°C
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {obs.pulse || "--"} bpm
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 justify-center h-full items-center text-muted-foreground/30 py-10">
                    <Activity className="w-12 h-12 mb-2" />
                    <p className="text-md font-medium">
                      No observations on this date
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent
          value="timeline"
          className="m-0 animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <TimelineTab residentId={resident.id} selectedDate={selectedDate} />
        </TabsContent>

        <TabsContent
          value="observations"
          className="m-0 animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <ObservationTab
            residentId={resident.id}
            selectedDate={selectedDate}
          />
        </TabsContent>

        <TabsContent
          value="careplan"
          className="m-0 animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <CarePlanTab residentId={resident.id} selectedDate={selectedDate} resident={resident} />
        </TabsContent>

        <TabsContent
          value="medication"
          className="m-0 animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <MedicationTab residentId={resident.id} selectedDate={selectedDate} residentStatus={resident.status} />
        </TabsContent>

        <TabsContent
          value="risk"
          className="m-0 animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <RiskAssessmentTab residentId={resident.id} residentStatus={resident.status} />
        </TabsContent>

        <TabsContent
          value="fluid-intake"
          className="m-0 animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <FluidIntakeTab
            residentId={resident.id}
            residentStatus={resident.status}
            isDraft={resident.isDraft}
            selectedDate={selectedDate}
          />
        </TabsContent>

        <TabsContent
          value="bodymap"
          className="m-0 animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <BodyMapTab residentId={resident.id} resident={resident} />
        </TabsContent>

        <TabsContent
          value="documents"
          className="m-0 animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <DocumentsTab residentId={resident.id} />
        </TabsContent>
      </div>
    </Tabs>
  );
}

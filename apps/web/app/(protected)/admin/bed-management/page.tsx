"use client";

import { useState } from "react";
import { useGetBedsQuery } from "../../../../lib/queries/facility/useGetBedsQuery";
import { useGetWingsQuery } from "../../../../lib/queries/facility/useGetWingsQuery";
import { useGetRoomsQuery } from "../../../../lib/queries/facility/useGetRoomsQuery";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/Tabs";
import { BedFilters } from "./components/BedFilters";
import { ListView } from "./components/views/ListView";
import { Spinner } from "@repo/ui/components/ui/Spinner";
import { SummaryDashboard } from "./components/views/SummaryDashboard";
import { CalendarView } from "./components/views/CalendarView";

export default function BedManagementPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [wingFilter, setWingFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");

  const { data: beds, isLoading: bedsLoading } = useGetBedsQuery();
  const { data: wings, isLoading: wingsLoading } = useGetWingsQuery();
  const { data: rooms, isLoading: roomsLoading } = useGetRoomsQuery();

  const isLoading = bedsLoading || wingsLoading || roomsLoading;

  const filteredBeds = beds?.filter((bed: any) => {
    if (statusFilter !== "all" && bed.status !== statusFilter) return false;
    if (wingFilter !== "all" && bed.wingId !== wingFilter) return false;
    if (roomFilter !== "all" && bed.roomId !== roomFilter) return false;
    return true;
  }) || [];

  return (
    <div className="flex flex-col h-full space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Bed Management</h1>
        <p className="text-muted-foreground mt-1">
          Monitor bed occupancy, availability, and resident assignments across the facility.
        </p>
      </div>

      <BedFilters
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        wingFilter={wingFilter}
        setWingFilter={setWingFilter}
        roomFilter={roomFilter}
        setRoomFilter={setRoomFilter}
        wings={wings || []}
        rooms={rooms || []}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner />
        </div>
      ) : (
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="dashboard">Summary Dashboard</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="m-0">
            <ListView beds={filteredBeds} />
          </TabsContent>

          <TabsContent value="dashboard" className="m-0">
            <SummaryDashboard beds={filteredBeds} allBeds={beds || []} />
          </TabsContent>

          <TabsContent value="calendar" className="m-0">
            <CalendarView beds={filteredBeds} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

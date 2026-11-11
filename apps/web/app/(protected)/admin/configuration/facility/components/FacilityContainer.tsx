"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/Tabs";
import { PropertiesTab } from "./tabs/PropertiesTab";
import { SchemesTab } from "./tabs/SchemesTab";
import { WingsTab } from "./tabs/WingsTab";
import { RoomsTab } from "./tabs/RoomsTab";
import { BedsTab } from "./tabs/BedsTab";
import { useGetWingsQuery } from "../../../../../../lib/queries/facility/useGetWingsQuery";
import { useGetRoomsQuery } from "../../../../../../lib/queries/facility/useGetRoomsQuery";
import { useGetPropertiesQuery } from "../../../../../../lib/queries/facility/useGetPropertiesQuery";
import { useGetSchemesQuery } from "../../../../../../lib/queries/facility/useGetSchemesQuery";
import { Wing, Room } from "../../../../../../lib/types/facility";
import {
  Building2,
  FolderKanban,
  DoorOpen,
  BedDouble,
  ChevronRight,
  X,
} from "lucide-react";
import { Button, Card, Text } from "@repo/ui/components/ui";

export function FacilityContainer() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const rawTab = searchParams.get("tab") || "properties";
  const currentTab = rawTab === "wings" ? "properties" : rawTab;
  const wingId = searchParams.get("wingId");
  const roomId = searchParams.get("roomId");

  const { data: wings } = useGetWingsQuery();
  const { data: rooms } = useGetRoomsQuery();
  const { data: properties } = useGetPropertiesQuery();
  const { data: schemes } = useGetSchemesQuery();

  const activeWing = wingId ? wings?.find((w: Wing) => w.id === wingId) : null;
  const activeRoom = roomId ? rooms?.find((r: Room) => r.id === roomId) : null;

  const navigate = (tab: string, extra?: Record<string, string>) => {
    const params = new URLSearchParams();
    params.set("tab", tab);
    if (extra) {
      Object.entries(extra).forEach(([k, v]) => params.set(k, v));
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleTabChange = (tab: string) => {
    navigate(tab);
  };

  const clearFilters = () => {
    navigate(currentTab);
  };

  const hasFilter = Boolean(wingId || roomId);

  return (
    <div className="w-full space-y-6 font-sans">
      <div className="flex flex-col gap-4">
        <Tabs
          value={currentTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <div className="border-b border-slate-200">
            <TabsList className="w-full justify-start bg-transparent p-0 h-auto rounded-none gap-6 flex-wrap">
              <TabsTrigger
                value="properties"
                className="flex items-center gap-1.5"
              >
                <Building2 className="size-4 text-primary" />
                Properties ({properties?.length ?? 0})
              </TabsTrigger>

              <TabsTrigger
                value="schemes"
                className="flex items-center gap-1.5"
              >
                <FolderKanban className="size-4 text-primary" />
                Schemes ({schemes?.length ?? 0})
              </TabsTrigger>

              <TabsTrigger
                value="rooms"
                className="flex items-center gap-1.5"
              >
                <DoorOpen className="size-4 text-primary" />
                Rooms
              </TabsTrigger>

              <TabsTrigger
                value="beds"
                className="flex items-center gap-1.5"
              >
                <BedDouble className="size-4 text-primary" />
                Beds
              </TabsTrigger>
            </TabsList>
          </div>

          {hasFilter && (
            <Card
              variant="secondary"
              border="secondary"
              className="mt-4 px-4 py-2.5 flex flex-row items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <Text size="md" weight="medium" className="text-emerald-800">
                  Filtered view:
                </Text>
                {activeWing && (
                  <button
                    type="button"
                    onClick={() => navigate("properties")}
                    className="hover:underline text-md font-medium cursor-pointer text-emerald-800"
                  >
                    Property: {activeWing.name}
                  </button>
                )}
                {activeRoom && (
                  <>
                    <ChevronRight className="size-3.5 text-emerald-500" />
                    <Text size="md" weight="medium" className="text-emerald-900">
                      Room: {activeRoom.roomNumber}
                    </Text>
                  </>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-7 text-emerald-800 hover:bg-emerald-100 hover:text-emerald-900 gap-1"
              >
                <X className="size-3.5" /> Clear Filter
              </Button>
            </Card>
          )}

          <TabsContent
            value="properties"
            className="mt-4 ring-offset-background focus-visible:outline-none"
          >
            <PropertiesTab onNavigate={navigate} />
          </TabsContent>

          <TabsContent
            value="schemes"
            className="mt-4 ring-offset-background focus-visible:outline-none"
          >
            <SchemesTab />
          </TabsContent>

          <TabsContent
            value="wings"
            className="mt-4 ring-offset-background focus-visible:outline-none"
          >
            <WingsTab onNavigate={navigate} />
          </TabsContent>

          <TabsContent
            value="rooms"
            className="mt-4 ring-offset-background focus-visible:outline-none"
          >
            <RoomsTab onNavigate={navigate} />
          </TabsContent>

          <TabsContent
            value="beds"
            className="mt-4 ring-offset-background focus-visible:outline-none"
          >
            <BedsTab onNavigate={navigate} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Layers, DoorOpen, Users, BedDouble, Plus } from "lucide-react";
import { format } from "date-fns";

import { GET_ROOMS } from "@repo/endpoints";
import {
  useGetRoomsQuery,
  useGetPaginatedRoomsQuery,
} from "../../../../../../../lib/queries/facility/useGetRoomsQuery";
import { useCreateRoomMutationQuery } from "../../../../../../../lib/queries/facility/useCreateRoomMutationQuery";
import { useUpdateRoomMutationQuery } from "../../../../../../../lib/queries/facility/useUpdateRoomMutationQuery";
import { useDeleteRoomMutationQuery } from "../../../../../../../lib/queries/facility/useDeleteRoomMutationQuery";
import { DeleteConfirmDialog } from "../../../../../../../lib/components/shared/DeleteConfirmDialog";
import { EntityListView } from "../../../../../../../lib/components/shared/EntityListView";
import { RoomDialog } from "../modals/RoomDialog";
import { FacilityStatCards } from "../shared/FacilityStatCards";
import { FacilityFilterBar } from "../shared/FacilityFilterBar";
import { Room } from "../../../../../../../lib/types/facility";
import { RoomCard } from "./rooms/RoomsCardGrid";
import { useRoomColumns } from "./rooms/useRoomColumns";
import { toast, Button } from "@repo/ui/components/ui";
import { useListQueryState } from "../../../../../../../lib/hooks";

interface RoomsTabProps {
  onNavigate: (tab: string, extra?: Record<string, string>) => void;
}

const ROOM_TYPES = ["Single", "Double", "Suite", "Shared", "Special"];

function getRoomType(type?: string): string {
  if (!type) return "Single";
  return (
    ROOM_TYPES.find((t) => type.toLowerCase().includes(t.toLowerCase())) ||
    type ||
    "Single"
  );
}

export function RoomsTab({ onNavigate }: RoomsTabProps) {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const wingId = searchParams.get("wingId");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(
    () => searchParams.get("openAddModal") === "true"
  );
  const [editRoom, setEditRoom] = useState<Room | null>(null);

  const {
    page,
    limit,
    search,
    searchInput,
    setSearchInput,
    filters,
    filterParams,
    setFilter,
    handlePageChange,
    handleLimitChange,
    resetFilters,
  } = useListQueryState({
    paramPrefix: "rooms",
    storageKey: "facility_rooms_page_size",
    filters: {
      type: "All Room Types",
      status: "All Statuses",
    },
  });
  const typeFilter = filters.type ?? "All Room Types";
  const statusFilter = filters.status ?? "All Statuses";

  const formatDateLabel = (d: unknown) => {
    if (!d) return "—";
    const date = new Date(d as string);
    return isNaN(date.getTime()) ? "—" : format(date, "MMM d, yyyy");
  };
  void formatDateLabel;

  useEffect(() => {
    if (searchParams.get("openAddModal") === "true") {
      setIsAddModalOpen(true);
    }
  }, [searchParams]);

  // Full set (scoped to the wing, if any) drives the KPI cards so they stay
  // wing-wide regardless of the current page or filters.
  const { data: allRooms } = useGetRoomsQuery(wingId);

  const {
    data: paginatedResponse,
    isLoading,
    isError,
  } = useGetPaginatedRoomsQuery({
    page,
    limit,
    search,
    wingId: wingId ?? undefined,
    type: filterParams.type,
    status: filterParams.status,
  });

  const rooms = paginatedResponse?.data ?? [];
  const totalRecords = paginatedResponse?.total ?? 0;

  const createMutation = useCreateRoomMutationQuery({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GET_ROOMS] });
      toast({ title: "Success", description: "Room created", className: "bg-white text-slate-900 border-slate-200 shadow-md" });
    },
    onError: (e) => {
      toast({ title: "Error", description: e.message || "Failed", className: "bg-white text-slate-900 border-slate-200 shadow-md" });
    },
  });

  const updateMutation = useUpdateRoomMutationQuery({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GET_ROOMS] });
      toast({ title: "Success", description: "Room updated", className: "bg-white text-slate-900 border-slate-200 shadow-md" });
      setEditRoom(null);
    },
    onError: (e) => {
      toast({ title: "Error", description: e.message || "Failed", className: "bg-white text-slate-900 border-slate-200 shadow-md" });
    },
  });

  const deleteMutation = useDeleteRoomMutationQuery({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GET_ROOMS] });
      setDeleteId(null);
      toast({ title: "Success", description: "Room deleted", className: "bg-white text-slate-900 border-slate-200 shadow-md" });
    },
    onError: (e) => {
      toast({ title: "Error", description: e.message || "Failed", className: "bg-white text-slate-900 border-slate-200 shadow-md" });
    },
  });

  const totalRooms = allRooms?.length || 0;
  const totalBeds = allRooms?.reduce((s, r) => s + (r.totalBeds || 0), 0) || 0;

  const columns = useRoomColumns({
    onEdit: setEditRoom,
    onDelete: (id: string) => setDeleteId(id),
    onNavigate,
  });

  return (
    <>
      <EntityListView<Room>
        title="Room Management"
        description="Create, configure and manage resident rooms across care wings."
        overviewTitle="Room Overview"
        onAdd={() => setIsAddModalOpen(true)}
        addLabel="Add Room"
        storageKey="facility_rooms"
        stats={
          <FacilityStatCards
            cards={[
              {
                title: "Total Rooms",
                value: String(totalRooms),
                subtitle: "Registered rooms",
                icon: <DoorOpen className="size-5 text-emerald-800" />,
                subtitleColor: "text-slate-500",
              },
              {
                title: "Total Bed Capacity",
                value: String(totalBeds),
                subtitle: "Configured beds",
                icon: <BedDouble className="size-5 text-emerald-800" />,
                subtitleColor: "text-emerald-800 font-medium",
              },
              {
                title: "Single / Suite Rooms",
                value: String(
                  rooms?.filter((r) =>
                    ["Single", "Suite"].includes(getRoomType(r.type))
                  ).length || 0
                ),
                subtitle: "Private occupancy",
                icon: <Users className="size-5 text-emerald-800" />,
                subtitleColor: "text-slate-500",
              },
              {
                title: "Associated Wings",
                value: wingId ? "1" : "All",
                subtitle: "Active scope",
                icon: <Layers className="size-5 text-emerald-800" />,
                subtitleColor: "text-slate-500",
              },
            ]}
          />
        }
        filters={
          <FacilityFilterBar
            filters={[
              {
                value: typeFilter,
                onChange: (val) => setFilter("type", val),
                placeholder: "All Room Types",
                options: [
                  { value: "All Room Types", label: "All Room Types" },
                  ...ROOM_TYPES.map((t) => ({ value: t, label: t })),
                ],
              },
              {
                value: statusFilter,
                onChange: (val) => setFilter("status", val),
                placeholder: "All Statuses",
                options: [
                  { value: "All Statuses", label: "All Statuses" },
                  { value: "Active", label: "Active" },
                  { value: "Maintenance", label: "Maintenance" },
                ],
              },
            ]}
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            searchPlaceholder="Search room by number or name..."
            onClearFilters={resetFilters}
          />
        }
        data={rooms}
        paginatedData={rooms}
        columns={columns}
        renderCard={(r) => (
          <RoomCard
            key={r.id}
            room={r}
            onEdit={setEditRoom}
            onDelete={setDeleteId}
            onViewBeds={(room) => onNavigate("beds", { roomId: room.id })}
          />
        )}
        isLoading={isLoading}
        isError={isError}
        emptyTitle="No rooms found"
        emptyDescription={
          totalRooms === 0
            ? "No rooms configured yet. Add your first room to configure resident beds."
            : "No rooms match your active search or filter criteria."
        }
        emptyAction={
          <Button
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            className="gap-2 cursor-pointer"
          >
            <Plus className="size-4" />
            Add Room
          </Button>
        }
        pagination={{
          currentPage: page,
          pageSize: limit,
          totalRecords,
          onPageChange: handlePageChange,
          onLimitChange: handleLimitChange,
          entityName: "rooms",
        }}
      />

      <RoomDialog
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSubmit={async (v) => {
          return createMutation.mutateAsync(v);
        }}
        defaultWingId={wingId}
        onAddBedNext={(createdRoomId, createdWingId) => {
          setIsAddModalOpen(false);
          const effectiveWingId = createdWingId || wingId;
          onNavigate("beds", {
            ...(createdRoomId ? { roomId: createdRoomId } : {}),
            ...(effectiveWingId ? { wingId: effectiveWingId } : {}),
            openAddModal: "true",
          });
        }}
        title="Add Room"
        isLoading={createMutation.isPending}
      />

      <RoomDialog
        isOpen={!!editRoom}
        onOpenChange={(o) => !o && setEditRoom(null)}
        initialData={editRoom}
        onSubmit={async (v) => {
          if (editRoom) {
            return updateMutation.mutateAsync({ id: editRoom.id, payload: v });
          }
        }}
        title="Edit Room"
        isLoading={updateMutation.isPending}
      />

      <DeleteConfirmDialog
        isOpen={!!deleteId}
        title="Delete Room"
        description="Are you sure you want to delete this room? All beds associated with it may be impacted."
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isDeleting={deleteMutation.isPending}
      />
    </>
  );
}

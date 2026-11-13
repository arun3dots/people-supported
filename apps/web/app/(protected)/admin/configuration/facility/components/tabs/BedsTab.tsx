"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { BedDouble, Users, Wrench, Plus } from "lucide-react";
import { format } from "date-fns";

import { GET_BEDS } from "@repo/endpoints";
import {
  useGetBedsQuery,
  useGetPaginatedBedsQuery,
} from "../../../../../../../lib/queries/facility/useGetBedsQuery";
import { useCreateBedMutationQuery } from "../../../../../../../lib/queries/facility/useCreateBedMutationQuery";
import { useUpdateBedMutationQuery } from "../../../../../../../lib/queries/facility/useUpdateBedMutationQuery";
import { useDeleteBedMutationQuery } from "../../../../../../../lib/queries/facility/useDeleteBedMutationQuery";
import { DeleteConfirmDialog } from "../../../../../../../lib/components/shared/DeleteConfirmDialog";
import { EntityListView } from "../../../../../../../lib/components/shared/EntityListView";
import { BedDialog } from "../modals/BedDialog";
import { AssignResidentDialog } from "../modals/AssignResidentDialog";
import { DischargeResidentDialog } from "../../../../residents/[id]/components/DischargeResidentDialog";
import { FacilityStatCards } from "../shared/FacilityStatCards";
import { FacilityFilterBar } from "../shared/FacilityFilterBar";
import { Bed } from "../../../../../../../lib/types/facility";
import { BedCard } from "./beds/BedsCardGrid";
import { useBedColumns } from "./beds/useBedColumns";
import { useListQueryState } from "../../../../../../../lib/hooks";
import { toast, Button } from "@repo/ui/components/ui";

interface BedsTabProps {
  onNavigate: (tab: string, extra?: Record<string, string>) => void;
}

export function BedsTab({ onNavigate }: BedsTabProps) {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const wingId = searchParams.get("wingId");
  const roomId = searchParams.get("roomId");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(
    () => searchParams.get("openAddModal") === "true"
  );
  const [editBed, setEditBed] = useState<Bed | null>(null);
  const [assignBed, setAssignBed] = useState<Bed | null>(null);
  const [dischargeResident, setDischargeResident] = useState<{
    id: string;
    fullName: string;
  } | null>(null);

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
    paramPrefix: "beds",
    storageKey: "facility_beds_page_size",
    filters: {
      dept: "All Departments",
      room: "All Rooms",
      status: "All Statuses",
    },
  });
  const deptFilter = filters.dept ?? "All Departments";
  const roomFilter = filters.room ?? "All Rooms";
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

  // Full set (scoped to the room, if any) drives the occupancy KPI cards so
  // they stay accurate regardless of the current page or filters.
  const { data: allBeds } = useGetBedsQuery(roomId);

  const {
    data: paginatedResponse,
    isLoading,
    isError,
  } = useGetPaginatedBedsQuery({
    page,
    limit,
    search,
    roomId: roomId ?? undefined,
    status: filterParams.status,
  });

  const beds = paginatedResponse?.data ?? [];
  const totalRecords = paginatedResponse?.total ?? 0;

  const createMutation = useCreateBedMutationQuery({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GET_BEDS] });
      setIsAddModalOpen(false);
      onNavigate("beds");
      toast({ title: "Success", description: "Bed created", className: "bg-white text-slate-900 border-slate-200 shadow-md" });
    },
    onError: (e) => {
      toast({ title: "Error", description: e.message || "Failed", className: "bg-white text-slate-900 border-slate-200 shadow-md" });
    },
  });

  const updateMutation = useUpdateBedMutationQuery({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GET_BEDS] });
      setEditBed(null);
      toast({ title: "Success", description: "Bed updated", className: "bg-white text-slate-900 border-slate-200 shadow-md" });
    },
    onError: (e) => {
      toast({ title: "Error", description: e.message || "Failed", className: "bg-white text-slate-900 border-slate-200 shadow-md" });
    },
  });

  const deleteMutation = useDeleteBedMutationQuery({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GET_BEDS] });
      setDeleteId(null);
      toast({ title: "Success", description: "Bed deleted", className: "bg-white text-slate-900 border-slate-200 shadow-md" });
    },
    onError: (e) => {
      toast({ title: "Error", description: e.message || "Failed", className: "bg-white text-slate-900 border-slate-200 shadow-md" });
    },
  });

  const totalBeds = allBeds?.length || 0;
  const occupiedBeds =
    allBeds?.filter(
      (b) => b.residentId || b.residentName || b.status === "Occupied"
    ).length || 0;
  const availableBeds =
    allBeds?.filter(
      (b) => !b.residentId && !b.residentName && b.status === "Available"
    ).length || 0;
  const maintenanceBeds =
    allBeds?.filter((b) => b.status === "Maintenance").length || 0;
  const occupancyRate =
    totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const columns = useBedColumns({
    onEdit: setEditBed,
    onDelete: (id: string) => setDeleteId(id),
    onAssignResident: setAssignBed,
    onDischargeResident: setDischargeResident,
  });

  return (
    <>
      <EntityListView<Bed>
        title="Bed Management"
        description="Create, configure and manage beds within your supported living service."
        overviewTitle="Bed Overview"
        onAdd={() => setIsAddModalOpen(true)}
        addLabel="Add Bed"
        storageKey="facility_beds"
        stats={
          <FacilityStatCards
            cards={[
              {
                title: "Total Beds",
                value: String(totalBeds),
                subtitle: "Total registered",
                icon: <BedDouble className="size-5 text-emerald-800" />,
                subtitleColor: "text-slate-500",
              },
              {
                title: "Occupied Beds",
                value: String(occupiedBeds),
                subtitle: `${occupancyRate}% occupancy`,
                icon: <Users className="size-5 text-emerald-800" />,
                subtitleColor: "text-emerald-800 font-medium",
              },
              {
                title: "Available Beds",
                value: String(availableBeds),
                subtitle: `${100 - occupancyRate}% ready for admission`,
                subtitleColor: "text-emerald-800 font-medium",
                icon: <BedDouble className="size-5 text-emerald-800" />,
              },
              {
                title: "Maintenance",
                value: String(maintenanceBeds),
                subtitle: "Under service",
                icon: <Wrench className="size-5 text-amber-700" />,
                subtitleColor: "text-amber-700 font-medium",
              },
            ]}
          />
        }
        filters={
          <FacilityFilterBar
            filters={[
              {
                value: deptFilter,
                onChange: (val) => setFilter("dept", val),
                placeholder: "All Departments",
                options: [{ value: "All Departments", label: "All Departments" }],
              },
              {
                value: roomFilter,
                onChange: (val) => setFilter("room", val),
                placeholder: "All Rooms",
                options: [{ value: "All Rooms", label: "All Rooms" }],
              },
              {
                value: statusFilter,
                onChange: (val) => setFilter("status", val),
                placeholder: "All Statuses",
                options: [
                  { value: "All Statuses", label: "All Statuses" },
                  { value: "Occupied", label: "Occupied" },
                  { value: "Available", label: "Available" },
                  { value: "Maintenance", label: "Maintenance" },
                ],
              },
            ]}
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            searchPlaceholder="Search beds or residents..."
            onClearFilters={resetFilters}
          />
        }
        data={beds}
        paginatedData={beds}
        columns={columns}
        renderCard={(b) => (
          <BedCard
            key={b.id}
            bed={b}
            onEdit={setEditBed}
            onDelete={setDeleteId}
            onAssignResident={setAssignBed}
            onDischargeResident={setDischargeResident}
          />
        )}
        isLoading={isLoading}
        isError={isError}
        emptyTitle="No beds found"
        emptyDescription={
          totalBeds === 0
            ? "No beds configured yet. Create a bed to assign residents."
            : "No beds match your active search or filter criteria."
        }
        emptyAction={
          <Button
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            className="gap-2 cursor-pointer"
          >
            <Plus className="size-4" />
            Add Bed
          </Button>
        }
        pagination={{
          currentPage: page,
          pageSize: limit,
          totalRecords,
          onPageChange: handlePageChange,
          onLimitChange: handleLimitChange,
          entityName: "beds",
        }}
      />

      <BedDialog
        isOpen={isAddModalOpen}
        onOpenChange={(open) => {
          setIsAddModalOpen(open);
          if (!open && (roomId || wingId || searchParams.get("openAddModal"))) {
            onNavigate("beds");
          }
        }}
        defaultWingId={wingId}
        defaultRoomId={roomId}
        onSubmit={async (v) => {
          return createMutation.mutateAsync(v);
        }}
        title="Add Bed"
        isLoading={createMutation.isPending}
      />
      <BedDialog
        isOpen={!!editBed}
        onOpenChange={(o) => !o && setEditBed(null)}
        initialData={editBed}
        onSubmit={async (v) => {
          if (editBed) {
            return updateMutation.mutateAsync({ id: editBed.id, payload: v });
          }
        }}
        title="Edit Bed"
        isLoading={updateMutation.isPending}
      />
      <AssignResidentDialog
        bed={assignBed}
        isOpen={!!assignBed}
        onOpenChange={(o) => !o && setAssignBed(null)}
      />
      {dischargeResident && (
        <DischargeResidentDialog
          resident={dischargeResident}
          open={!!dischargeResident}
          onOpenChange={(o) => !o && setDischargeResident(null)}
        />
      )}
      <DeleteConfirmDialog
        isOpen={!!deleteId}
        title="Delete Bed"
        description="Are you sure you want to delete this bed?"
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isDeleting={deleteMutation.isPending}
      />
    </>
  );
}

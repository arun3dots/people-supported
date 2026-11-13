"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Layers, DoorOpen, Users, Plus } from "lucide-react";
import { format } from "date-fns";

import { GET_WINGS } from "@repo/endpoints";
import {
  useGetWingsQuery,
  useGetPaginatedWingsQuery,
} from "../../../../../../../lib/queries/facility/useGetWingsQuery";
import { useCreateWingMutationQuery } from "../../../../../../../lib/queries/facility/useCreateWingMutationQuery";
import { useUpdateWingMutationQuery } from "../../../../../../../lib/queries/facility/useUpdateWingMutationQuery";
import { useDeleteWingMutationQuery } from "../../../../../../../lib/queries/facility/useDeleteWingMutationQuery";
import { DeleteConfirmDialog } from "../../../../../../../lib/components/shared/DeleteConfirmDialog";
import { EntityListView } from "../../../../../../../lib/components/shared/EntityListView";
import { WingDialog } from "../modals/WingDialog";
import { FacilityStatCards } from "../shared/FacilityStatCards";
import { FacilityFilterBar } from "../shared/FacilityFilterBar";
import { Wing } from "../../../../../../../lib/types/facility";
import { WingCard } from "./wings/WingsCardGrid";
import { useWingColumns } from "./wings/useWingColumns";
import { useListQueryState } from "../../../../../../../lib/hooks";
import { toast, Button } from "@repo/ui/components/ui";

interface WingsTabProps {
  onNavigate: (tab: string, extra?: Record<string, string>) => void;
}

export function WingsTab({ onNavigate }: WingsTabProps) {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(
    () => searchParams.get("openAddModal") === "true"
  );
  const [editWing, setEditWing] = useState<Wing | null>(null);

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
    paramPrefix: "wings",
    storageKey: "facility_wings_page_size",
    filters: { status: "All Statuses" },
  });
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

  // Full set drives the KPI cards, so they stay care-home-wide regardless of
  // the current page or filters.
  const { data: allWings } = useGetWingsQuery();

  const {
    data: paginatedResponse,
    isLoading,
    isError,
  } = useGetPaginatedWingsQuery({
    page,
    limit,
    search,
    status: filterParams.status,
  });

  const wings = paginatedResponse?.data ?? [];
  const totalRecords = paginatedResponse?.total ?? 0;

  const createMutation = useCreateWingMutationQuery({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GET_WINGS] });
      toast({ title: "Success", description: "Wing created", className: "bg-white text-slate-900 border-slate-200 shadow-md" });
    },
    onError: (e) => {
      toast({ title: "Error", description: e.message || "Failed", className: "bg-white text-slate-900 border-slate-200 shadow-md" });
    },
  });

  const updateMutation = useUpdateWingMutationQuery({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GET_WINGS] });
      toast({ title: "Success", description: "Wing updated", className: "bg-white text-slate-900 border-slate-200 shadow-md" });
      setEditWing(null);
    },
    onError: (e) => {
      toast({ title: "Error", description: e.message || "Failed", className: "bg-white text-slate-900 border-slate-200 shadow-md" });
    },
  });

  const deleteMutation = useDeleteWingMutationQuery({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GET_WINGS] });
      setDeleteId(null);
      toast({ title: "Success", description: "Wing deleted", className: "bg-white text-slate-900 border-slate-200 shadow-md" });
    },
    onError: (e) => {
      toast({ title: "Error", description: e.message || "Failed", className: "bg-white text-slate-900 border-slate-200 shadow-md" });
    },
  });

  const totalWings = allWings?.length || 0;
  const totalRooms = allWings?.reduce((s, w) => s + (w.totalRooms || 0), 0) || 0;
  const totalBeds = allWings?.reduce((s, w) => s + (w.totalBeds || 0), 0) || 0;

  const columns = useWingColumns({
    onEdit: setEditWing,
    onDelete: (id: string) => setDeleteId(id),
    onNavigate,
  });

  return (
    <>
      <EntityListView<Wing>
        title="Wing Management"
        description="Create, configure and manage wings within your supported living locations."
        overviewTitle="Wing Overview"
        onAdd={() => setIsAddModalOpen(true)}
        addLabel="Add Wing"
        storageKey="facility_wings"
        stats={
          <FacilityStatCards
            cards={[
              {
                title: "Total Wings",
                value: String(totalWings),
                subtitle: "Registered wings",
                icon: <Layers className="size-5 text-emerald-800" />,
                subtitleColor: "text-slate-500",
              },
              {
                title: "Total Rooms",
                value: String(totalRooms),
                subtitle: "Across all wings",
                icon: <DoorOpen className="size-5 text-emerald-800" />,
                subtitleColor: "text-slate-500",
              },
              {
                title: "Total Bed Capacity",
                value: String(totalBeds),
                subtitle: "Combined beds",
                icon: <Users className="size-5 text-emerald-800" />,
                subtitleColor: "text-emerald-800 font-medium",
              },
            ]}
          />
        }
        filters={
          <FacilityFilterBar
            filters={[
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
            searchPlaceholder="Search wing by name or code..."
            onClearFilters={resetFilters}
          />
        }
        data={wings}
        paginatedData={wings}
        columns={columns}
        renderCard={(w, idx) => (
          <WingCard
            key={w.id}
            wing={w}
            showRightDivider={idx % 3 !== 2 && idx !== wings.length - 1}
            onEdit={setEditWing}
            onDelete={setDeleteId}
            onViewRooms={(wing) => onNavigate("rooms", { wingId: wing.id })}
          />
        )}
        isLoading={isLoading}
        isError={isError}
        emptyTitle="No wings found"
        emptyDescription={
          totalWings === 0
            ? "No wings have been configured yet. Add your first wing to get started."
            : "No wings found matching your search and filter criteria."
        }
        emptyAction={
          <Button
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            className="gap-2 cursor-pointer"
          >
            <Plus className="size-4" />
            Add Wing
          </Button>
        }
        pagination={{
          currentPage: page,
          pageSize: limit,
          totalRecords,
          onPageChange: handlePageChange,
          onLimitChange: handleLimitChange,
          entityName: "wings",
        }}
      />

      {/* Dialogs */}
      <WingDialog
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSubmit={async (v) => {
          return createMutation.mutateAsync(v);
        }}
        onAddRoomNext={(createdWingId) => {
          setIsAddModalOpen(false);
          onNavigate("rooms", {
            ...(createdWingId ? { wingId: createdWingId } : {}),
            openAddModal: "true",
          });
        }}
        title="Add Wing"
        isLoading={createMutation.isPending}
      />

      <WingDialog
        isOpen={!!editWing}
        onOpenChange={(o) => !o && setEditWing(null)}
        initialData={editWing}
        onSubmit={async (v) => {
          if (editWing) {
            return updateMutation.mutateAsync({ id: editWing.id, payload: v });
          }
        }}
        title="Edit Wing"
        isLoading={updateMutation.isPending}
      />

      <DeleteConfirmDialog
        isOpen={!!deleteId}
        title="Delete Wing"
        description="Are you sure you want to delete this wing? All rooms and beds associated with it may be impacted."
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isDeleting={deleteMutation.isPending}
      />
    </>
  );
}

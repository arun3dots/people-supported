"use client";

import React, { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Building2, Clock, Users } from "lucide-react";
import { GET_SCHEMES, GET_PROPERTIES } from "@repo/endpoints";
import {
  useGetSchemesQuery,
  useCreateSchemeMutation,
  useUpdateSchemeMutation,
  useDeleteSchemeMutation,
  useGetPropertiesQuery,
} from "../../../../../../../lib/queries/facility";
import type { SchemeItem } from "../../../../../../../lib/types/facility";
import { EntityListView } from "../../../../../../../lib/components/shared/EntityListView";
import { EntityCard, RowActions } from "../../../../../../../lib/components/shared";
import { DeleteConfirmDialog } from "../../../../../../../lib/components/shared/DeleteConfirmDialog";
import { FacilityFilterBar } from "../shared/FacilityFilterBar";
import { PropertiesSchemeStats } from "../shared/PropertiesSchemeStats";
import { AddSchemeModal } from "../modals/AddSchemeModal";
import { SchemeDetailDrawer } from "../modals/SchemeDetailDrawer";
import { useSchemeColumns } from "./properties/useSchemeColumns";
import { Button, toast } from "@repo/ui/components/ui";

export function SchemesTab() {
  const queryClient = useQueryClient();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewScheme, setViewScheme] = useState<SchemeItem | null>(null);
  const [editScheme, setEditScheme] = useState<SchemeItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data: allSchemes = [], isLoading, isError } = useGetSchemesQuery();
  const { data: allProperties = [] } = useGetPropertiesQuery();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [GET_SCHEMES] });
    queryClient.invalidateQueries({ queryKey: [GET_PROPERTIES] });
  };

  const createMutation = useCreateSchemeMutation({
    onSuccess: () => {
      invalidate();
      toast({
        title: "Scheme created",
        description: "Supported living scheme has been registered.",
      });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err.message || "Failed to create scheme",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useUpdateSchemeMutation({
    onSuccess: () => {
      invalidate();
      setEditScheme(null);
      toast({
        title: "Scheme updated",
        description: "Changes saved successfully.",
      });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err.message || "Failed to update scheme",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useDeleteSchemeMutation({
    onSuccess: () => {
      invalidate();
      setDeleteId(null);
      toast({
        title: "Scheme deleted",
        description: "Scheme has been removed.",
      });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err.message || "Failed to delete scheme",
        variant: "destructive",
      });
    },
  });

  const filteredSchemes = useMemo(() => {
    return allSchemes.filter((s) => {
      if (statusFilter !== "All Status" && s.status !== statusFilter) {
        return false;
      }
      if (searchInput.trim()) {
        const q = searchInput.trim().toLowerCase();
        if (
          !s.name.toLowerCase().includes(q) &&
          !(s.referenceId ?? "").toLowerCase().includes(q) &&
          !(s.location ?? "").toLowerCase().includes(q) &&
          !(s.commissioningLa ?? "").toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [allSchemes, statusFilter, searchInput]);

  const paginatedSchemes = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredSchemes.slice(start, start + limit);
  }, [filteredSchemes, page, limit]);

  const columns = useSchemeColumns({
    onEdit: setEditScheme,
    onDelete: setDeleteId,
  });

  return (
    <>
      <EntityListView<SchemeItem>
        title="Supported Living Schemes"
        description="Manage housing association schemes, local authority commissioning hours, and linked supported living properties."
        overviewTitle="Schemes Directory"
        onAdd={() => setIsAddOpen(true)}
        addLabel="Add Scheme"
        storageKey="facility_schemes"
        stats={
          <PropertiesSchemeStats properties={allProperties} schemes={allSchemes} />
        }
        filters={
          <FacilityFilterBar
            filters={[
              {
                value: statusFilter,
                onChange: (val) => {
                  setStatusFilter(val);
                  setPage(1);
                },
                placeholder: "All Status",
                options: [
                  { value: "All Status", label: "All Status" },
                  { value: "Active", label: "Active" },
                  { value: "Inactive", label: "Inactive" },
                ],
              },
            ]}
            searchValue={searchInput}
            onSearchChange={(val) => {
              setSearchInput(val);
              setPage(1);
            }}
            searchPlaceholder="Search scheme by name, reference ID, location or LA..."
            onClearFilters={() => {
              setSearchInput("");
              setStatusFilter("All Status");
              setPage(1);
            }}
          />
        }
        data={filteredSchemes}
        paginatedData={paginatedSchemes}
        columns={columns}
        onRowClick={setViewScheme}
        renderCard={(s, idx) => (
          <EntityCard
            key={s.id}
            avatar={
              <div className="size-11 rounded-full bg-surface-primary-light flex items-center justify-center font-medium text-primary text-md shrink-0">
                {s.name.slice(0, 2).toUpperCase()}
              </div>
            }
            title={s.name}
            subtitle={s.commissioningLa || s.location || "Supported Living Scheme"}
            showRightDivider={
              idx % 3 !== 2 && idx !== paginatedSchemes.length - 1
            }
            meta={[
              {
                icon: <Building2 className="size-4 text-emerald-800" />,
                label: "Properties",
                value: `${s.totalProperties} homes`,
              },
              {
                icon: <Users className="size-4 text-emerald-800" />,
                label: "Occupancy",
                value: `${s.occupiedBeds}/${s.totalBeds} (${s.occupancyRate}%)`,
              },
              {
                icon: <Clock className="size-4 text-emerald-800" />,
                label: "Commissioned",
                value: s.commissionedHours ? `${s.commissionedHours}h/wk` : "—",
              },
            ]}
            statusText={s.status || "Active"}
            statusState={s.status === "Active" ? "success" : "inactive"}
            actions={
              <RowActions
                onEdit={() => setEditScheme(s)}
                editLabel={`Edit ${s.name}`}
                onDelete={() => setDeleteId(s.id)}
                deleteLabel={`Delete ${s.name}`}
              />
            }
          />
        )}
        isLoading={isLoading}
        isError={isError}
        emptyTitle="No schemes found"
        emptyDescription="Create your first supported living scheme to group properties and track commissioned hours."
        emptyAction={
          <Button
            variant="primary"
            onClick={() => setIsAddOpen(true)}
            className="gap-2 cursor-pointer"
          >
            <Plus className="size-4" /> Add Scheme
          </Button>
        }
        pagination={{
          currentPage: page,
          pageSize: limit,
          totalRecords: filteredSchemes.length,
          onPageChange: setPage,
          onLimitChange: (l) => {
            setLimit(Number(l));
            setPage(1);
          },
          entityName: "schemes",
        }}
      />

      <AddSchemeModal
        isOpen={isAddOpen}
        onOpenChange={setIsAddOpen}
        properties={allProperties}
        onCreate={(payload) => createMutation.mutateAsync(payload)}
        isSubmitting={createMutation.isPending}
      />

      <AddSchemeModal
        isOpen={Boolean(editScheme)}
        onOpenChange={(open) => !open && setEditScheme(null)}
        properties={allProperties}
        initialData={editScheme}
        onCreate={async () => {}}
        onUpdate={(id, data) => updateMutation.mutateAsync({ id, data })}
        isSubmitting={updateMutation.isPending}
      />

      <SchemeDetailDrawer
        scheme={viewScheme}
        properties={allProperties}
        onClose={() => setViewScheme(null)}
        onEditScheme={(s) => {
          setViewScheme(null);
          setEditScheme(s);
        }}
      />

      <DeleteConfirmDialog
        isOpen={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Scheme?"
        description="Properties linked to this scheme will be unlinked, not deleted."
        onConfirm={() => {
          if (deleteId) deleteMutation.mutate(deleteId);
        }}
        isDeleting={deleteMutation.isPending}
      />
    </>
  );
}

"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, DoorOpen, BedDouble, Eye, ShieldCheck } from "lucide-react";
import { GET_PROPERTIES, GET_WINGS, GET_ROOMS, GET_BEDS, GET_SCHEMES } from "@repo/endpoints";
import {
  useGetPropertiesQuery,
  useCreatePropertyWithRoomsMutation,
  useUpdatePropertyMutation,
  useGetSchemesQuery,
  useDeleteWingMutationQuery,
} from "../../../../../../../lib/queries/facility";
import type { PropertyItem } from "../../../../../../../lib/types/facility";
import { EntityListView } from "../../../../../../../lib/components/shared/EntityListView";
import { EntityCard, RowActions } from "../../../../../../../lib/components/shared";
import { DeleteConfirmDialog } from "../../../../../../../lib/components/shared/DeleteConfirmDialog";
import { FacilityFilterBar } from "../shared/FacilityFilterBar";
import { PropertiesSchemeStats } from "../shared/PropertiesSchemeStats";
import { AddPropertyModal } from "../modals/AddPropertyModal";
import { PropertyDetailDrawer } from "../modals/PropertyDetailDrawer";
import { usePropertyColumns } from "./properties/usePropertyColumns";
import { buildPropertyFilterDropdowns } from "./properties/propertyFilters";
import { Button, toast } from "@repo/ui/components/ui";

export function PropertiesTab() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [isAddOpen, setIsAddOpen] = useState(
    () => searchParams.get("openAddModal") === "true",
  );
  const [editProperty, setEditProperty] = useState<PropertyItem | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<PropertyItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [schemeFilter, setSchemeFilter] = useState("All Schemes");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [unitTypeFilter, setUnitTypeFilter] = useState("All Unit Types");
  const [safetyFilter, setSafetyFilter] = useState("All Safety Evidence");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data: allProperties = [], isLoading, isError } = useGetPropertiesQuery();
  const { data: allSchemes = [] } = useGetSchemesQuery();

  const urlPropertyId = searchParams.get("propertyId");
  useEffect(() => {
    if (urlPropertyId && allProperties.length > 0) {
      const found = allProperties.find((p) => p.id === urlPropertyId);
      if (found) setSelectedProperty(found);
    }
  }, [urlPropertyId, allProperties]);

  const invalidateAllFacility = () => {
    [GET_PROPERTIES, GET_WINGS, GET_ROOMS, GET_BEDS, GET_SCHEMES].forEach((k) =>
      queryClient.invalidateQueries({ queryKey: [k] }),
    );
  };

  const createMutation = useCreatePropertyWithRoomsMutation({
    onSuccess: () => {
      invalidateAllFacility();
      toast({ title: "Property created", description: "Property, rooms, and beds registered." });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err.message || "Failed to create property",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useUpdatePropertyMutation({
    onSuccess: () => {
      invalidateAllFacility();
      setEditProperty(null);
      toast({ title: "Property updated", description: "Changes saved successfully." });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err.message || "Failed to update property",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useDeleteWingMutationQuery({
    onSuccess: () => {
      invalidateAllFacility();
      setDeleteId(null);
      toast({ title: "Property deleted", description: "Property has been removed." });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err.message || "Cannot delete property with existing rooms",
        variant: "destructive",
      });
    },
  });

  const filteredProperties = useMemo(() => {
    return allProperties.filter((p) => {
      if (schemeFilter !== "All Schemes" && p.schemeId !== schemeFilter) return false;
      if (statusFilter !== "All Status" && p.status !== statusFilter) return false;
      const unitType =
        p.parsedPropertyDetails?.unitConfiguration ||
        p.parsedPropertyDetails?.propertyType ||
        "Self-contained flats";
      if (unitTypeFilter !== "All Unit Types" && unitType !== unitTypeFilter) return false;
      if (safetyFilter !== "All Safety Evidence" && p.safetyEvidenceStatus !== safetyFilter)
        return false;
      if (searchInput.trim()) {
        const q = searchInput.trim().toLowerCase();
        const addr = p.parsedPropertyDetails?.streetAddress?.toLowerCase() ?? "";
        const ref = p.parsedPropertyDetails?.referenceId?.toLowerCase() ?? "";
        const schemeName = p.scheme?.name?.toLowerCase() ?? "";
        if (
          !p.name.toLowerCase().includes(q) &&
          !(p.code ?? "").toLowerCase().includes(q) &&
          !addr.includes(q) &&
          !ref.includes(q) &&
          !schemeName.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [allProperties, schemeFilter, statusFilter, unitTypeFilter, safetyFilter, searchInput]);

  const paginatedProperties = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredProperties.slice(start, start + limit);
  }, [filteredProperties, page, limit]);

  const columns = usePropertyColumns({
    onSelectProperty: setSelectedProperty,
    onEdit: setEditProperty,
    onDelete: setDeleteId,
  });

  const resetFilters = () => {
    setSearchInput("");
    setSchemeFilter("All Schemes");
    setStatusFilter("All Status");
    setUnitTypeFilter("All Unit Types");
    setSafetyFilter("All Safety Evidence");
    setPage(1);
  };

  return (
    <>
      <EntityListView<PropertyItem>
        title="Properties & Schemes"
        description="Supported living homes, tenancies by unit, housing association schemes and landlord safety evidence."
        overviewTitle="Properties Directory"
        onAdd={() => setIsAddOpen(true)}
        addLabel="Add Property"
        storageKey="facility_properties"
        stats={<PropertiesSchemeStats properties={allProperties} schemes={allSchemes} />}
        filters={
          <FacilityFilterBar
            filters={buildPropertyFilterDropdowns({
              schemeFilter,
              setSchemeFilter,
              statusFilter,
              setStatusFilter,
              unitTypeFilter,
              setUnitTypeFilter,
              safetyFilter,
              setSafetyFilter,
              allSchemes,
              onResetPage: () => setPage(1),
            })}
            searchValue={searchInput}
            onSearchChange={(val) => {
              setSearchInput(val);
              setPage(1);
            }}
            searchPlaceholder="Search property by name, address, postcode or ID..."
            onClearFilters={resetFilters}
          />
        }
        data={filteredProperties}
        paginatedData={paginatedProperties}
        columns={columns}
        renderCard={(p, idx) => (
          <EntityCard
            key={p.id}
            avatar={
              <div className="size-11 rounded-full bg-surface-primary-light flex items-center justify-center font-medium text-primary text-md shrink-0">
                {p.name.slice(0, 2).toUpperCase()}
              </div>
            }
            title={p.name}
            subtitle={
              p.scheme?.name ||
              p.parsedPropertyDetails?.streetAddress ||
              "Supported Living Property"
            }
            showRightDivider={idx % 3 !== 2 && idx !== paginatedProperties.length - 1}
            meta={[
              {
                icon: <DoorOpen className="size-4 text-emerald-800" />,
                label: "Occupancy",
                value: `${p.occupiedBeds}/${p.totalBeds} (${p.occupancyRate}%)`,
              },
              {
                icon: <BedDouble className="size-4 text-emerald-800" />,
                label: "Units",
                value: `${p.totalRooms} rooms`,
              },
              {
                icon: <ShieldCheck className="size-4 text-emerald-800" />,
                label: "Safety",
                value: p.safetyEvidenceStatus,
              },
            ]}
            statusText={p.status || "Active"}
            statusState={p.status === "Active" ? "success" : "inactive"}
            actions={
              <RowActions
                onEdit={() => setEditProperty(p)}
                editLabel={`Edit ${p.name}`}
                onDelete={() => setDeleteId(p.id)}
                deleteLabel={`Delete ${p.name}`}
                extra={[
                  {
                    label: "View Tenancies & Safety",
                    icon: Eye,
                    onClick: () => setSelectedProperty(p),
                  },
                ]}
              />
            }
          />
        )}
        isLoading={isLoading}
        isError={isError}
        emptyTitle="No properties found"
        emptyDescription="Add your first supported living property to configure rooms, beds, and tenancies."
        emptyAction={
          <Button
            variant="primary"
            onClick={() => setIsAddOpen(true)}
            className="gap-2 cursor-pointer"
          >
            <Plus className="size-4" /> Add Property
          </Button>
        }
        pagination={{
          currentPage: page,
          pageSize: limit,
          totalRecords: filteredProperties.length,
          onPageChange: setPage,
          onLimitChange: (l) => {
            setLimit(Number(l));
            setPage(1);
          },
          entityName: "properties",
        }}
      />

      <AddPropertyModal
        isOpen={isAddOpen}
        onOpenChange={setIsAddOpen}
        schemes={allSchemes}
        onCreate={(payload) => createMutation.mutateAsync(payload)}
        isSubmitting={createMutation.isPending}
      />

      <AddPropertyModal
        isOpen={Boolean(editProperty)}
        onOpenChange={(open) => !open && setEditProperty(null)}
        schemes={allSchemes}
        initialData={editProperty}
        onCreate={async () => {}}
        onUpdate={(id, data) => updateMutation.mutateAsync({ id, data })}
        isSubmitting={updateMutation.isPending}
      />

      <PropertyDetailDrawer
        property={selectedProperty}
        onClose={() => setSelectedProperty(null)}
        onEditProperty={(p) => setEditProperty(p)}
      />

      <DeleteConfirmDialog
        isOpen={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Property?"
        description="This action cannot be undone if the property has no rooms."
        onConfirm={() => {
          if (deleteId) deleteMutation.mutate(deleteId);
        }}
        isDeleting={deleteMutation.isPending}
      />
    </>
  );
}

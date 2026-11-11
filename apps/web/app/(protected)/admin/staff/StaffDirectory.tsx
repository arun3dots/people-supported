"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Download } from "lucide-react";
import { GET_STAFF } from "@repo/endpoints";
import { Button } from "@repo/ui/components/ui/Button";
import { toast } from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import {
  useGetStaffQuery,
  useGetPaginatedStaffQuery,
} from "../../../../lib/queries/staff";
import { useUpdateStaffStatusMutationQuery } from "../../../../lib/queries/staff/useUpdateStaffStatusMutationQuery";
import { useDeleteStaffMutationQuery } from "../../../../lib/queries/staff/useDeleteStaffMutationQuery";
import { useGetRolesListQuery } from "../../../../lib/queries/role/useGetRolesListQuery";
import { useGetSchemesQuery } from "../../../../lib/queries/facility/useGetSchemesQuery";
import { useGetPropertiesQuery } from "../../../../lib/queries/facility/useGetPropertiesQuery";
import { DeleteConfirmDialog } from "../../../../lib/components/shared/DeleteConfirmDialog";
import { EntityListView } from "../../../../lib/components/shared";
import { useListQueryState } from "../../../../lib/hooks";
import type { StaffMember } from "../../../../lib/types/staff";

import { StaffStatCards } from "./components/StaffStatCards";
import { StaffFilterSection } from "./components/StaffFilterSection";
import { useStaffColumns } from "./components/useStaffColumns";
import { StaffCard } from "./components/StaffCardGrid";
import { AddStaffMemberModal } from "./components/AddStaffMemberModal";

const STAFF_FILTERS = {
  role: "All Roles",
  scheme: "All Schemes",
  property: "All Properties",
  status: "All Status",
} as const;

export function StaffDirectory() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");

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
    filters: STAFF_FILTERS,
    storageKey: "staff_page_size",
  });

  const { data: allStaff } = useGetStaffQuery();
  const { data: roles } = useGetRolesListQuery();
  const { data: schemesData } = useGetSchemesQuery();
  const { data: propertiesData } = useGetPropertiesQuery();

  const schemes = Array.isArray(schemesData) ? schemesData : [];
  const properties = Array.isArray(propertiesData) ? propertiesData : [];

  const {
    data: paginatedResponse,
    isLoading,
    isError,
  } = useGetPaginatedStaffQuery({
    page,
    limit,
    search,
    roleId: filterParams.role,
    status:
      filterParams.status === "Active" || filterParams.status === "Inactive"
        ? filterParams.status
        : undefined,
  });

  const rawStaffList = paginatedResponse?.data ?? [];
  const totalRecords = paginatedResponse?.total ?? 0;

  // Filter tabs calculation
  const counts = useMemo(() => {
    const list = allStaff ?? [];
    return {
      all: list.length,
      support: list.filter((s) => {
        const r = s.role?.name?.toLowerCase() || "";
        return (
          r.includes("support") ||
          r.includes("worker") ||
          r.includes("nurse") ||
          r.includes("carer")
        );
      }).length,
      managers: list.filter((s) =>
        (s.role?.name?.toLowerCase() || "").includes("manager"),
      ).length,
      admin: list.filter((s) =>
        (s.role?.name?.toLowerCase() || "").includes("admin"),
      ).length,
      other: list.filter((s) => {
        const r = s.role?.name?.toLowerCase() || "";
        return (
          !r.includes("support") &&
          !r.includes("worker") &&
          !r.includes("nurse") &&
          !r.includes("carer") &&
          !r.includes("manager") &&
          !r.includes("admin")
        );
      }).length,
    };
  }, [allStaff]);

  const displayStaffList = useMemo(() => {
    if (activeTab === "all") return rawStaffList;
    return rawStaffList.filter((m) => {
      const r = m.role?.name?.toLowerCase() || "";
      if (activeTab === "support") {
        return (
          r.includes("support") ||
          r.includes("worker") ||
          r.includes("nurse") ||
          r.includes("carer")
        );
      }
      if (activeTab === "managers") return r.includes("manager");
      if (activeTab === "admin") return r.includes("admin");
      if (activeTab === "other") {
        return (
          !r.includes("support") &&
          !r.includes("worker") &&
          !r.includes("nurse") &&
          !r.includes("carer") &&
          !r.includes("manager") &&
          !r.includes("admin")
        );
      }
      return true;
    });
  }, [rawStaffList, activeTab]);

  const statusMutation = useUpdateStaffStatusMutationQuery({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GET_STAFF] });
      toast({
        title: "Success",
        description: "Staff status updated successfully",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "error",
      });
    },
  });

  const deleteMutation = useDeleteStaffMutationQuery({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GET_STAFF] });
      setDeleteId(null);
      toast({
        title: "Success",
        description: "Staff member removed successfully",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove staff",
        variant: "error",
      });
    },
  });

  const toggleStatus = (id: string, currentStatus: boolean) => {
    statusMutation.mutate({
      id,
      payload: { status: currentStatus ? "Inactive" : "Active" },
    });
  };

  const columns = useStaffColumns({
    onToggleStatus: toggleStatus,
    onDelete: setDeleteId,
  });

  const roleTabs = [
    { key: "all", label: "All Staff", count: counts.all },
    { key: "support", label: "Support Workers", count: counts.support },
    { key: "managers", label: "Managers", count: counts.managers },
    { key: "admin", label: "Admin", count: counts.admin },
    { key: "other", label: "Other Roles", count: counts.other },
  ];

  return (
    <>
      <EntityListView<StaffMember>
        title="Staff Directory"
        description="Manage staff profiles, roles, qualifications, training and compliance records."
        overviewTitle="Staff Directory"
        storageKey="staff_directory_view_mode"
        headerActions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="h-10 px-3.5 rounded-xl border-slate-200 text-md font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-none"
          >
            <Download className="size-3.5" />
            Export
          </Button>
        }
        onAdd={() => setIsAddModalOpen(true)}
        addLabel="Add Staff"
        addIcon={<Plus className="size-4" />}
        stats={<StaffStatCards staff={allStaff} />}
        filters={
          <div className="space-y-4">
            <StaffFilterSection
              searchTerm={searchInput}
              setSearchTerm={setSearchInput}
              roleFilter={filters.role ?? STAFF_FILTERS.role}
              setRoleFilter={(value) => setFilter("role", value)}
              schemeFilter={filters.scheme ?? STAFF_FILTERS.scheme}
              setSchemeFilter={(value) => setFilter("scheme", value)}
              propertyFilter={filters.property ?? STAFF_FILTERS.property}
              setPropertyFilter={(value) => setFilter("property", value)}
              statusFilter={filters.status ?? STAFF_FILTERS.status}
              setStatusFilter={(value) => setFilter("status", value)}
              roles={roles}
              schemes={schemes}
              properties={properties}
              onReset={resetFilters}
            />

            <div className="flex items-center gap-6 border-b border-slate-200/80 text-md overflow-x-auto pb-px">
              {roleTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "pb-2.5 transition-colors whitespace-nowrap cursor-pointer",
                    activeTab === tab.key
                      ? "border-b-2 border-emerald-800 text-emerald-900 font-bold"
                      : "text-slate-500 hover:text-slate-800 font-medium",
                  )}
                >
                  {tab.label}{" "}
                  <span className="text-slate-400 font-normal">
                    ({tab.count})
                  </span>
                </button>
              ))}
            </div>
          </div>
        }
        columns={columns}
        data={displayStaffList}
        paginatedData={displayStaffList}
        renderCard={(member, idx) => (
          <StaffCard
            key={member.id}
            member={member}
            showRightDivider={
              idx % 3 !== 2 && idx !== displayStaffList.length - 1
            }
            onToggleStatus={toggleStatus}
            onDelete={setDeleteId}
          />
        )}
        onRowClick={(member) => router.push(`/admin/staff/${member.id}`)}
        isLoading={isLoading}
        isError={isError}
        errorMessage="Error loading staff directory. Please try again."
        emptyTitle="No staff members found"
        emptyDescription="No staff profiles match your active search or filter criteria."
        pagination={{
          currentPage: page,
          pageSize: limit,
          totalRecords,
          onPageChange: handlePageChange,
          onLimitChange: handleLimitChange,
          showLimitSelector: true,
          entityName: "staff",
        }}
      />

      {/* Add Staff Member Modal */}
      <AddStaffMemberModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        schemes={schemes}
        properties={properties}
        roles={roles ?? []}
      />

      <DeleteConfirmDialog
        isOpen={!!deleteId}
        title="Remove Staff Member"
        description="Are you sure you want to remove this staff member? This will deactivate their account and soft-delete their record per CQC guidelines."
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isDeleting={deleteMutation.isPending}
      />
    </>
  );
}

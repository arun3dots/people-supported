"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
  MoreVertical,
  Trash,
  CheckCircle2,
  XCircle,
  Eye,
  Edit,
  ArrowUp,
  User,
  AlertCircle,
  SlidersHorizontal,
  Clock,
  Filter,
} from "lucide-react";
import { GET_STAFF } from "@repo/endpoints";
import { useGetStaffQuery } from "../../../../../../lib/queries/staff/useGetStaffQuery";
import { useGetRolesListQuery } from "../../../../../../lib/queries/role/useGetRolesListQuery";
import { useUpdateStaffStatusMutationQuery } from "../../../../../../lib/queries/staff/useUpdateStaffStatusMutationQuery";
import { useDeleteStaffMutationQuery } from "../../../../../../lib/queries/staff/useDeleteStaffMutationQuery";
import { DeleteConfirmDialog } from "../../../../../../lib/components/shared/DeleteConfirmDialog";
import { AddUserDialog } from "./AddUserDialog";
import { UserDetailView } from "./UserDetailView";
import { StaffMember } from "../../../../../../lib/types/staff";
import { SecurityBanner } from "./SecurityBanner";

import { Button } from "@repo/ui/components/ui/Button";
import { Input } from "@repo/ui/components/ui/Input";
import { Card, CardContent } from "@repo/ui/components/ui/Card";
import { Badge } from "@repo/ui/components/ui/Badge";
import { Skeleton } from "@repo/ui/components/ui/Skeleton";
import { toast } from "@repo/ui/components/ui";
import { Pagination } from "@repo/ui/components/ui/Pagination";
import { usePagination } from "@repo/ui/hooks";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/DropdownMenu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/Select";

interface UsersTabProps {
  openAddUser?: boolean;
  onFilterClick?: () => void;
  setOpenAddUser?: (open: boolean) => void;
}

export function UsersTab({ openAddUser = false, onFilterClick, setOpenAddUser }: UsersTabProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [internalAddOpen, setInternalAddOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const { data: staff, isLoading, isError } = useGetStaffQuery();
  const { data: roles } = useGetRolesListQuery();

  const selectedUserForView = staff?.find((u) => u.id === selectedUserId) || null;
  const editingUser = staff?.find((u) => u.id === editingUserId) || null;

  const isAddUserOpen = openAddUser || internalAddOpen || !!editingUserId;
  const handleAddUserOpenChange = (open: boolean) => {
    setOpenAddUser?.(open);
    setInternalAddOpen(open);
    if (!open) setEditingUserId(null);
  };

  const updateStatusMutation = useUpdateStaffStatusMutationQuery({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GET_STAFF] });
      toast({
        title: "Success",
        description: "User status updated successfully",
        variant: "success",
      });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err.message || "Failed to update user status",
        variant: "error",
      });
    },
  });

  const deleteMutation = useDeleteStaffMutationQuery({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GET_STAFF] });
      setDeleteId(null);
      if (selectedUserId === deleteId) setSelectedUserId(null);
      toast({
        title: "Success",
        description: "User deleted successfully",
        variant: "success",
      });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err.message || "Failed to delete user",
        variant: "error",
      });
    },
  });

  const filteredStaff = staff?.filter((u) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      u.fullName.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.role?.name && u.role.name.toLowerCase().includes(term));

    const matchesRole =
      roleFilter === "All Roles" ||
      u.role?.id === roleFilter ||
      u.role?.name === roleFilter;

    const matchesStatus =
      statusFilter === "All Status" ||
      (statusFilter === "Active" && u.isActive) ||
      (statusFilter === "Inactive" && !u.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const {
    currentPage,
    pageSize,
    paginatedData: paginatedUsers,
    totalRecords,
    handlePageChange,
    handleLimitChange,
  } = usePagination(filteredStaff);

  const totalUsers = staff?.length || 0;
  const activeUsers = staff?.filter((u) => u.isActive).length || 0;
  const inactiveUsers = staff?.filter((u) => !u.isActive).length || 0;
  const totalRoles = roles?.length || 0;

  if (isError) {
    return (
      <div className="p-8 text-center text-red-500 font-semibold">
        Error loading users list. Please try again.
      </div>
    );
  }

  // If a user row is selected, render the detail page view
  if (selectedUserForView) {
    return (
      <>
        <UserDetailView
          user={selectedUserForView}
          roles={roles}
          onBack={() => setSelectedUserId(null)}
          onEdit={(u) => {
            setEditingUserId(u.id);
            handleAddUserOpenChange(true);
          }}
        />

        <AddUserDialog
          isOpen={isAddUserOpen}
          onOpenChange={handleAddUserOpenChange}
          initialUser={editingUser}
        />
      </>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {/* Total Users */}
        <Card className="bg-surface-card-grey border-none shadow-none rounded-2xl p-5">
          <CardContent className="p-0 flex items-start gap-2.5">
            <div className="size-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Users className="size-4" />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-base leading-5 font-semibold text-slate-900">
                {totalUsers}
              </span>
              <span className="text-md font-normal text-slate-700">
                Total Users
              </span>
              <div className="flex items-center text-emerald-700 text-md font-medium mt-0.5">
                <ArrowUp className="size-3 -ml-0.5 mr-0.5 shrink-0" />
                <span>4 new this month</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Users */}
        <Card className="bg-surface-card-grey border-none shadow-none rounded-2xl p-5">
          <CardContent className="p-0 flex items-start gap-2.5">
            <div className="size-8 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
              <User className="size-4" />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-base leading-5 font-semibold text-slate-900">
                {activeUsers}
              </span>
              <span className="text-md font-normal text-slate-700">
                Active Users
              </span>
              <div className="text-slate-500 text-md font-normal mt-0.5">
                90.5% of total
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inactive Users */}
        <Card className="bg-surface-card-grey border-none shadow-none rounded-2xl p-5">
          <CardContent className="p-0 flex items-start gap-2.5">
            <div className="size-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-200">
              <AlertCircle className="size-4" />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-base leading-5 font-semibold text-slate-900">
                {inactiveUsers}
              </span>
              <span className="text-md font-normal text-slate-700">
                Inactive Users
              </span>
              <div className="text-slate-500 text-md font-normal mt-0.5">
                10.5% of total
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Roles */}
        <Card className="bg-surface-card-grey border-none shadow-none rounded-2xl p-5">
          <CardContent className="p-0 flex items-start gap-2.5">
            <div className="size-8 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-200">
              <ShieldCheck className="size-4" />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-base leading-5 font-semibold text-slate-900">
                {totalRoles}
              </span>
              <span className="text-md font-normal text-slate-700">
                Roles
              </span>
              <div className="flex items-center text-emerald-700 text-md font-medium mt-0.5 cursor-pointer hover:underline">
                <ArrowUp className="size-3 -ml-0.5 mr-0.5 shrink-0" />
                <span>View all Roles</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 w-full">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[280px] max-w-[402px] h-10">
          <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Search by name, email, or role..."
            className="pl-10 pr-4 h-10 w-full bg-white border border-slate-200 rounded-xl text-md placeholder:text-slate-400 text-slate-900 shadow-2xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Dropdowns & Filter Button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Role Select */}
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-auto min-w-[133px] h-10 bg-white border border-slate-200 rounded-xl text-md text-slate-900 px-3 shadow-2xs">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent className="bg-white rounded-xl border-slate-200">
              <SelectItem value="All Roles" className="text-md">All Roles</SelectItem>
              {roles?.map((r) => (
                <SelectItem key={r.id} value={r.id} className="text-md">
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Select */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-auto min-w-[134px] h-10 bg-white border border-slate-200 rounded-xl text-md text-slate-900 px-3 shadow-2xs">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="bg-white rounded-xl border-slate-200">
              <SelectItem value="All Statuses" className="text-md">All Statuses</SelectItem>
              <SelectItem value="Active" className="text-md">Active</SelectItem>
              <SelectItem value="Inactive" className="text-md">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter Icon Button */}
          <Button
            variant="outline"
            onClick={onFilterClick}
            className="size-10 p-0 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-800 hover:bg-slate-50 shrink-0 shadow-2xs cursor-pointer"
          >
            <Filter className="size-4" />
          </Button>
        </div>
      </div>
      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="w-full bg-surface-card-grey rounded-2xl p-4 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EAEAEA] h-[52px]">
                {/* 1. User Column (Left Aligned) */}
                <th className="pl-6 pr-4 text-left text-md font-medium text-[#141F1E]">
                  User
                </th>

                {/* 2. Role Column */}
                <th className="px-4 text-center text-md font-medium text-[#141F1E]">
                  Role
                </th>

                {/* 3. Status Column */}
                <th className="px-4 text-center text-md font-medium text-[#141F1E]">
                  Status
                </th>

                {/* 4. Last Login Column */}
                <th className="px-4 text-center text-md font-medium text-[#141F1E]">
                  <div className="inline-flex items-center gap-1.5 justify-center">
                    <Clock className="w-4 h-4 text-[#141F1E]" />
                    <span>Last Login</span>
                  </div>
                </th>

                {/* 5. Joined On Column */}
                <th className="px-4 text-center text-md font-medium text-[#141F1E]">
                  <div className="inline-flex items-center gap-1.5 justify-center">
                    <Clock className="w-4 h-4 text-[#141F1E]" />
                    <span>Joined On</span>
                  </div>
                </th>

                {/* 6. Actions Header (Labeled 'User' as per reference image) */}
                <th className="pr-6 pl-4 text-center text-md font-medium text-[#141F1E]">
                  User
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#EAEAEA]/80">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8">
                    <Skeleton className="h-12 w-full rounded-xl bg-slate-200" />
                  </td>
                </tr>
              ) : filteredStaff?.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-12 text-center text-[#5D5D5D] font-normal text-md"
                  >
                    No users found matching your filters.
                  </td>
                </tr>
              ) : (
                paginatedUsers?.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => setSelectedUserId(u.id)}
                    className="hover:bg-black/[0.02] transition-colors cursor-pointer h-[64px] bg-[#F7F7F7]"
                  >
                    {/* 1. User Info (Avatar + Name + Email) */}
                    <td className="pl-6 pr-4 py-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#E3EBE8] text-[#141F1E] font-medium flex items-center justify-center text-md shrink-0 overflow-hidden">
                          {u.avatarUrl ? (
                            <img
                              src={u.avatarUrl}
                              alt={u.fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            u.fullName?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-[#141F1E] text-md leading-4">
                            {u.fullName}
                          </span>
                          <span className="text-[10px] text-[#7A7A7A] font-normal leading-3">
                            {u.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 2. Role Badge */}
                    <td className="px-4 py-2 text-center">
                      <span
                        className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-md font-medium border ${u.role?.name === "Administrator"
                          ? "bg-[#F7F2EF] border-[#E2D8CC] text-[#141F1E]"
                          : u.role?.name === "Finance Officer"
                            ? "bg-[#FFF2F1] border-[#FBDCDA] text-[#141F1E]"
                            : u.role?.name === "Manager"
                              ? "bg-[#F5F8F7] border-[#BCD3CD] text-[#141F1E]"
                              : u.role?.name === "Clinical Lead"
                                ? "bg-[#EBF7EE] border-[#C2E9CA] text-[#141F1E]"
                                : u.role?.name === "Care Co-ordinator"
                                  ? "bg-[#EEF8FF] border-[#D1E9FF] text-[#141F1E]"
                                  : "bg-[#FDFBE9] border-[#ECE7C6] text-[#141F1E]" /* Care Assistant & Default */
                          }`}
                      >
                        {u.role?.name || "Care Assistant"}
                      </span>
                    </td>

                    {/* 3. Status Badge */}
                    <td className="px-4 py-2 text-center">
                      {u.isActive ? (
                        <span className="inline-flex items-center justify-center gap-1.5 px-2.5 py-0.5 rounded-full text-md font-medium text-[#278642] bg-[#EBF7EE] border border-[#C2E9CA]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#30B752]" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-1.5 px-2.5 py-0.5 rounded-full text-md font-medium text-[#E5484D] bg-[#FFF2F1] border border-[#FBDCDA]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#E5484D]" />
                          In-active
                        </span>
                      )}
                    </td>

                    {/* 4. Last Login */}
                    <td className="px-4 py-2 text-center text-md font-normal text-[#141F1E]">
                      {"15 May 2020 8:00 am"}
                    </td>

                    {/* 5. Joined On */}
                    <td className="px-4 py-2 text-center text-md font-normal text-[#141F1E]">
                      {"24 May, 2020"}
                    </td>

                    {/* 6. Action Button */}
                    <td
                      className="pr-6 pl-4 py-2 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 rounded-lg text-[#141F1E] hover:bg-black/5"
                          >
                            <MoreVertical className="w-5 h-5 text-[#141F1E]" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white rounded-xl">
                          <DropdownMenuItem
                            onClick={() => setSelectedUserId(u.id)}
                            className="cursor-pointer font-medium text-md py-2"
                          >
                            <Eye className="w-3.5 h-3.5 mr-2 text-slate-600" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingUserId(u.id);
                              handleAddUserOpenChange(true);
                            }}
                            className="cursor-pointer font-medium text-md py-2"
                          >
                            <Edit className="w-3.5 h-3.5 mr-2 text-[#4A706A]" /> Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              updateStatusMutation.mutate({
                                id: u.id,
                                payload: { status: u.isActive ? "Inactive" : "Active" },
                              })
                            }
                            className="cursor-pointer font-medium text-md py-2"
                          >
                            {u.isActive ? (
                              <>
                                <UserX className="w-3.5 h-3.5 mr-2 text-amber-600" /> Deactivate User
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3.5 h-3.5 mr-2 text-emerald-600" /> Activate User
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteId(u.id)}
                            className="cursor-pointer font-medium text-md py-2 text-red-600 focus:text-red-600"
                          >
                            <Trash className="w-3.5 h-3.5 mr-2" /> Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div>
          <Pagination
            pageNumber={currentPage}
            pageSize={pageSize}
            totalRecords={totalRecords}
            limit={pageSize.toString()}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            disabled={isLoading}
          />
        </div>
      </div>
      <SecurityBanner />


      {/* Add / Edit User Dialog */}
      <AddUserDialog
        isOpen={isAddUserOpen}
        onOpenChange={handleAddUserOpenChange}
        initialUser={editingUser}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        isOpen={!!deleteId}
        title="Delete User"
        description="Are you sure you want to delete this user? This action will revoke their access to the platform."
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}

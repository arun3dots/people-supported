"use client";

import { ArrowLeft, Edit, User, Shield, Briefcase, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@repo/ui/components/ui/Button";
import { Badge } from "@repo/ui/components/ui/Badge";
import { StaffMember } from "../../../../../../lib/types/staff";
import { RoleMember } from "../../../../../../lib/types/role";

interface UserDetailViewProps {
  user: StaffMember;
  roles?: RoleMember[];
  onBack: () => void;
  onEdit: (user: StaffMember) => void;
}

export function UserDetailView({ user, roles, onBack, onEdit }: UserDetailViewProps) {
  const roleName = user.role?.name || "Unassigned";
  const matchedRole = roles?.find((r) => r.name === roleName || r.id === user.role?.id);

  const nameParts = user.fullName.split(" ");
  const firstName = nameParts[0] || user.fullName;
  const lastName = nameParts.slice(1).join(" ") || "";

  return (
    <div className="space-y-6 text-left font-sans animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="size-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 p-0 shrink-0 border border-slate-200"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
                {user.fullName}
              </h2>
              {user.isActive ? (
                <Badge variant="secondary" state="success" className="px-2.5 py-0.5 shadow-none flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="size-3 text-emerald-600" /> Active
                </Badge>
              ) : (
                <Badge variant="secondary" state="inactive" className="px-2.5 py-0.5 shadow-none flex items-center gap-1 shrink-0">
                  <XCircle className="size-3 text-slate-400" /> Inactive
                </Badge>
              )}
            </div>
            <p className="text-md text-slate-500 font-medium mt-0.5 truncate">{user.email}</p>
          </div>
        </div>

        <Button
          onClick={() => onEdit(user)}
          size="sm"
          className="rounded-xl gap-2 shrink-0 cursor-pointer"
        >
          <Edit className="size-4" /> Edit User
        </Button>
      </div>

      {/* Hero Header Card */}
      <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="size-16 rounded-full bg-surface-primary-light text-icon-primary font-bold text-2xl flex items-center justify-center border-2 border-white shadow-xs shrink-0">
            {user.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">{user.fullName}</h3>
              <Badge variant="secondary" state="info" className="px-2.5 py-0.5 shadow-none shrink-0">
                {roleName}
              </Badge>
            </div>
            <p className="text-md text-slate-500 font-medium mt-1 truncate">
              Department: <span className="font-semibold text-slate-900">{user.department || "Care & Clinical"}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Personal Information */}
        <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <User className="size-4 text-icon-primary shrink-0" />
            <h4 className="text-base font-bold text-slate-900">Personal Information</h4>
          </div>
          <div className="space-y-3 text-md sm:text-md">
            <div>
              <span className="text-slate-500 block text-md font-medium">First Name</span>
              <span className="font-semibold text-slate-900 text-md sm:text-md block truncate">{firstName}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-md font-medium">Last Name</span>
              <span className="font-semibold text-slate-900 text-md sm:text-md block truncate">{lastName || "—"}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-md font-medium">Email Address</span>
              <span className="font-semibold text-slate-900 text-md sm:text-md block break-all">{user.email}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-md font-medium">Phone Number</span>
              <span className="font-semibold text-slate-900 text-md sm:text-md block truncate">{user.phoneNumber || "—"}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-md font-medium">Date of Birth</span>
              <span className="font-semibold text-slate-900 text-md sm:text-md block truncate">{user.dob || "—"}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Role & Access */}
        <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <Shield className="size-4 text-icon-primary shrink-0" />
            <h4 className="text-base font-bold text-slate-900">Role &amp; Access</h4>
          </div>
          <div className="space-y-3 text-md sm:text-md">
            <div>
              <span className="text-slate-500 block text-md font-medium">Assigned Role</span>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span className="font-semibold text-slate-900 text-md sm:text-md">{roleName}</span>
                {matchedRole?.isSystem && (
                  <Badge variant="secondary" state="warning" className="px-2.5 py-0.5 shadow-none shrink-0">
                    System Role
                  </Badge>
                )}
              </div>
            </div>
            <div>
              <span className="text-slate-500 block text-md font-medium">Access Groups</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                <Badge variant="secondary" state="inactive" className="px-2.5 py-0.5 shadow-none">
                  Clinical Staff
                </Badge>
                <Badge variant="secondary" state="inactive" className="px-2.5 py-0.5 shadow-none">
                  Medication Management
                </Badge>
              </div>
            </div>
            <div>
              <span className="text-slate-500 block text-md font-medium">Account Status</span>
              <span className="font-semibold text-slate-900 text-md sm:text-md">{user.isActive ? "Active" : "Inactive"}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Additional Information */}
        <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5 space-y-4 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <Briefcase className="size-4 text-[#4A706A] shrink-0" />
            <h4 className="text-base font-bold text-slate-900">Additional Information</h4>
          </div>
          <div className="space-y-3 text-md sm:text-md">
            <div>
              <span className="text-slate-500 block text-md font-medium">Job Title</span>
              <span className="font-semibold text-slate-900 text-md sm:text-md block truncate">{user.department || roleName}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-md font-medium">Employee ID</span>
              <span className="font-semibold text-slate-900 text-md sm:text-md block truncate">EMP-CL-{user.id.slice(0, 4).toUpperCase()}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-md font-medium">Work Location</span>
              <span className="font-semibold text-slate-900 text-md sm:text-md block truncate">Main Supported Living Service</span>
            </div>
            <div>
              <span className="text-slate-500 block text-md font-medium">Time Zone</span>
              <span className="font-semibold text-slate-900 text-md sm:text-md block truncate">(GMT +00:00) London</span>
            </div>
            <div>
              <span className="text-slate-500 block text-md font-medium">Joined Date</span>
              <span className="font-semibold text-slate-900 text-md sm:text-md block truncate">
                {new Date(user.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

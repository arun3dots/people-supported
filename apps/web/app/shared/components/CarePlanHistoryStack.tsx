"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
} from "@repo/ui/components/ui";
import {
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Calendar,
  UserCheck,
  Stethoscope,
  Building2,
  Pill,
  ClipboardList,
  ArrowUpRight,
} from "lucide-react";
import { format } from "date-fns";

interface CarePlanHistoryStackProps {
  carePlans: any[];
  activeCarePlanId?: string;
  staffList: any[];
  onSelectCarePlan: (carePlan: any) => void;
}

export function CarePlanHistoryStack({
  carePlans,
  activeCarePlanId,
  staffList,
  onSelectCarePlan,
}: CarePlanHistoryStackProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!carePlans || carePlans.length === 0) {
    return null;
  }

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const formatDateString = (dateInput?: string | Date) => {
    if (!dateInput) return "Not Set";
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "Not Set";
    return format(d, "MMM do, yyyy");
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-500 hover:bg-green-600 text-white";
      case "Draft":
        return "bg-amber-500 hover:bg-amber-600 text-white";
      case "Expired":
        return "bg-slate-500 hover:bg-slate-600 text-white";
      default:
        return "bg-slate-500 hover:bg-slate-600 text-white";
    }
  };

  const historicalPlans = carePlans.filter((cp) => cp.id !== activeCarePlanId);

  return (
    <Card className="border border-border shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Care Plan Version History & Archive
            <Badge variant="secondary" className="ml-2 bg-slate-200 text-slate-800">
              {carePlans.length} Total {carePlans.length === 1 ? "Version" : "Versions"}
            </Badge>
          </CardTitle>
        </div>
        <p className="text-md text-muted-foreground mt-1">
          Strictly one care plan is active at a time (shown at top). Historical and previous versions are stacked below for auditing and reactivation.
        </p>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {carePlans.map((cp, idx) => {
          const isCurrentActive = cp.id === activeCarePlanId;
          const versionNum = carePlans.length - idx;
          const isExpanded = expandedId === cp.id;

          const primaryApprover = cp.approvedById
            ? staffList.find((s) => s.id === cp.approvedById)?.fullName || "Approved"
            : "Pending Approval";

          const secondaryApprover = cp.secondaryApprovedById
            ? staffList.find((s) => s.id === cp.secondaryApprovedById)?.fullName || "Approved"
            : "Pending Approval";

          return (
            <div
              key={cp.id}
              className={`rounded-2xl border transition-all duration-200 ${isCurrentActive
                ? "border-green-200 bg-green-50/20"
                : "border-slate-200 bg-white hover:border-slate-300"
                }`}
            >
              {/* Header Row */}
              <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-base text-foreground">
                      Version {versionNum}
                    </span>
                    <Badge className={getStatusBadgeVariant(cp.status)}>
                      {cp.status}
                    </Badge>
                    {isCurrentActive ? (
                      <Badge
                        variant="outline"
                        className="border-green-600 bg-green-50 text-green-700 text-md font-semibold flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3 text-green-600" /> Active Master (Top)
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-slate-300 text-slate-600 text-md">
                        Archived Version
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-md text-muted-foreground pt-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        <strong className="text-slate-700">Valid:</strong> {formatDateString(cp.validFrom)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        <strong className="text-slate-700">Review:</strong> {formatDateString(cp.nextReviewDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate" title={`Primary: ${primaryApprover}`}>
                        <strong className="text-slate-700">Approver:</strong> {primaryApprover}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        <strong className="text-slate-700">Doctors:</strong> {cp.doctorsInvolved?.join(", ") || "None"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {!isCurrentActive && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-md border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100"
                      onClick={() => onSelectCarePlan(cp)}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" /> Make Active
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1 text-md text-slate-600 hover:bg-slate-100"
                    onClick={() => toggleExpand(cp.id)}
                  >
                    {isExpanded ? (
                      <>
                        Hide Details <ChevronUp className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        View Config <ChevronDown className="w-3.5 h-3.5" />
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Collapsible Expanded Details */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-4 rounded-b-2xl animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Tasks in this version */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center gap-2 font-semibold text-md text-slate-700">
                        <ClipboardList className="w-4 h-4 text-primary" />
                        Configured Tasks ({cp.tasks?.length || 0})
                      </div>
                      {cp.tasks && cp.tasks.length > 0 ? (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                          {cp.tasks.map((task: any) => (
                            <div key={task.id} className="text-md p-2 bg-slate-50 rounded-lg flex justify-between items-center">
                              <div>
                                <p className="font-medium text-slate-800">{task.title}</p>
                                <p className="text-[10px] text-slate-500">{task.category} • {task.frequency}</p>
                              </div>
                              <Badge variant="outline" className="text-[10px]">
                                {task.priority}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-md text-slate-400 italic">No tasks configured in this version.</p>
                      )}
                    </div>

                    {/* Medications in this version */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center gap-2 font-semibold text-md text-slate-700">
                        <Pill className="w-4 h-4 text-indigo-500" />
                        Configured Medications ({cp.medications?.length || 0})
                      </div>
                      {cp.medications && cp.medications.length > 0 ? (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                          {cp.medications.map((med: any) => (
                            <div key={med.id} className="text-md p-2 bg-slate-50 rounded-lg flex justify-between items-center">
                              <div>
                                <p className="font-medium text-slate-800">{med.drugName} ({med.dose})</p>
                                <p className="text-[10px] text-slate-500">{med.form || "General"} • {med.frequency}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-md text-slate-400 italic">No medications configured in this version.</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-md text-slate-500 pt-1">
                    <span>
                      <strong>Departments:</strong> {cp.departments?.join(", ") || "None"}
                    </span>
                    <span>
                      <strong>Secondary Approver:</strong> {secondaryApprover}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

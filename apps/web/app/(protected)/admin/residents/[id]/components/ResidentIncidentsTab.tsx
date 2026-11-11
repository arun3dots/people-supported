"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ExternalLink, Loader2, Plus, ShieldAlert } from "lucide-react";
import { Button, Text } from "@repo/ui/components/ui";
import { useGetIncidentsQuery } from "../../../../../../lib/queries/incidents";
import { useAuth } from "../../../../../../lib/context/AuthContext";
import type { Resident } from "../../../../../../lib/types/resident";

interface ResidentIncidentsTabProps {
  resident: Resident;
}

export function ResidentIncidentsTab({
  resident,
}: ResidentIncidentsTabProps): React.JSX.Element {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin =
    user?.roleName?.toLowerCase() === "admin" ||
    user?.roleName?.toLowerCase() === "manager";
  const baseRoute = isAdmin ? "/admin/incidents" : "/carer/incidents";

  const { data: allIncidents, isLoading } = useGetIncidentsQuery();

  const residentIncidents = useMemo(() => {
    const list = (allIncidents ?? []).filter((inc) => inc.residentId === resident.id);
    return list.sort(
      (a, b) => new Date(b.incidentDate).getTime() - new Date(a.incidentDate).getTime(),
    );
  }, [allIncidents, resident.id]);

  const counts = useMemo(() => {
    const total = residentIncidents.length;
    const open = residentIncidents.filter(
      (i) => i.status === "Open" || i.status === "Under Review",
    ).length;
    const closed = residentIncidents.filter((i) => i.status === "Closed").length;
    return { total, open, closed };
  }, [residentIncidents]);

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center font-sans">
        <Loader2 className="size-8 animate-spin text-primary mb-3" />
        <Text size="sm" variant="muted">
          Loading incident records…
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* 3 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-1 shadow-2xs">
          <span className="text-md font-bold text-slate-600">Total incidents</span>
          <div className="text-2xl font-extrabold text-slate-900">{counts.total}</div>
          <p className="text-md text-slate-500">Recorded for this person</p>
        </div>

        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 space-y-1 shadow-2xs">
          <span className="text-md font-bold text-amber-900">Open / Under review</span>
          <div className="text-2xl font-extrabold text-amber-800">{counts.open}</div>
          <p className="text-md text-amber-700">Active safeguarding or follow-up</p>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-5 space-y-1 shadow-2xs">
          <span className="text-md font-bold text-emerald-900">Closed & resolved</span>
          <div className="text-2xl font-extrabold text-emerald-800">{counts.closed}</div>
          <p className="text-md text-emerald-700">Post-incident review completed</p>
        </div>
      </div>

      {/* Incidents Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-4 text-primary" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Incidents & Safeguarding Log
              </h3>
              <p className="text-md text-slate-500">
                All reported accidents, behavioural triggers, and safeguarding events
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            onClick={() => router.push(`${baseRoute}?residentId=${resident.id}`)}
            className="font-semibold text-md rounded-xl h-10 px-4 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="size-4" />
            Add Incident
          </Button>
        </div>

        {residentIncidents.length === 0 ? (
          <div className="py-12 text-center space-y-2 border border-dashed border-slate-200 rounded-2xl">
            <AlertTriangle className="size-7 text-slate-400 mx-auto" />
            <p className="text-md font-semibold text-slate-800">No incidents recorded</p>
            <p className="text-md text-slate-500">
              There are no open or historical incident reports for this person.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-md font-semibold text-slate-500">
                  <th className="py-3 px-3">Ref #</th>
                  <th className="py-3 px-3">Incident</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Severity</th>
                  <th className="py-3 px-3">Date & Reporter</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-md">
                {residentIncidents.map((inc) => {
                  const statusCls =
                    inc.status === "Closed"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : inc.status === "Open"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-amber-50 text-amber-800 border-amber-200";

                  const sevCls =
                    inc.priority === "High"
                      ? "bg-red-50 text-red-700 border-red-200"
                      : inc.priority === "Medium"
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-slate-100 text-slate-700 border-slate-200";

                  return (
                    <tr key={inc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-3 font-mono font-semibold text-slate-600">
                        {inc.incidentNumber}
                      </td>
                      <td className="py-4 px-3 font-bold text-slate-900">{inc.title}</td>
                      <td className="py-4 px-3 text-slate-700">{inc.category}</td>
                      <td className="py-4 px-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-md font-semibold border ${sevCls}`}
                        >
                          {inc.severity || inc.priority}
                        </span>
                      </td>
                      <td className="py-4 px-3">
                        <div className="font-semibold text-slate-800">
                          {new Date(inc.incidentDate).toLocaleDateString("en-GB")}
                        </div>
                        <div className="text-slate-400">
                          {inc.reportedBy?.fullName ?? "Support Staff"}
                        </div>
                      </td>
                      <td className="py-4 px-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-md font-semibold border ${statusCls}`}
                        >
                          {inc.status}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`${baseRoute}/${inc.id}`)}
                          className="border-slate-200 text-slate-700 rounded-xl h-8 px-3 text-md font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          View
                          <ExternalLink className="size-3" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

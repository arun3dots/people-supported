"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/Card";
import { Badge } from "@repo/ui/components/ui/Badge";
import {
  ShieldAlert,
  HeartPulse,
  ShieldCheck,
  Activity,
  Stethoscope,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@repo/ui/lib/utils";
import {
  DbsRecord,
  HealthRecord,
  ImmunisationRecord,
} from "../../../../lib/queries/staff/useComplianceQueries";

interface ProfileDbsHealthTabProps {
  dbs: DbsRecord | null;
  health: HealthRecord | null;
  immunisations: ImmunisationRecord[];
  loading: boolean;
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-center border-b border-border pb-3">
      <span className="text-md text-muted-foreground">{label}</span>
      <div className="font-medium">{children}</div>
    </div>
  );
}

export function ProfileDbsHealthTab({
  dbs,
  health,
  immunisations,
  loading,
}: ProfileDbsHealthTabProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-3 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* DBS */}
      <Card className="shadow-sm border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-primary" /> DBS Check
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {dbs ? (
            <>
              <Row label="Certificate Number">
                <span className="font-mono bg-muted/30 px-2 py-0.5 rounded">
                  {dbs.certificateNumber || "N/A"}
                </span>
              </Row>
              <Row label="Type">{dbs.type}</Row>
              {dbs.issueDate && (
                <Row label="Issue Date">
                  {format(new Date(dbs.issueDate), "dd MMM yyyy")}
                </Row>
              )}
              <Row label="Expiry Date">
                {dbs.expiryDate
                  ? format(new Date(dbs.expiryDate), "dd MMM yyyy")
                  : "N/A"}
              </Row>
              <Row label="Update Service">
                {dbs.updateService ? (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    <ShieldCheck className="w-3 h-3 mr-1" /> Registered
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                    Not registered
                  </Badge>
                )}
              </Row>
              <div className="flex justify-between items-center">
                <span className="text-md text-muted-foreground">Status</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "px-2.5 py-1 text-md font-semibold",
                    dbs.status === "Clear"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : dbs.status === "Action Required"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-gray-100 text-gray-700",
                  )}
                >
                  {dbs.status}
                </Badge>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
              <ShieldAlert className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-md text-muted-foreground italic">
                No DBS details recorded yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Occupational Health */}
      <Card className="shadow-sm border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" /> Occupational Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          {health && health.status === "Cleared" ? (
            <div className="flex items-start gap-4 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg shrink-0">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-emerald-800">Clearance Approved</h4>
                {health.clearanceDate && (
                  <p className="text-md text-emerald-700 font-medium mt-2 flex items-center gap-1.5">
                    <Activity className="w-3 h-3" />
                    {format(new Date(health.clearanceDate), "dd MMM yyyy")}
                  </p>
                )}
                {health.notes && (
                  <p className="text-md text-emerald-600 mt-1 italic">
                    {health.notes}
                  </p>
                )}
              </div>
            </div>
          ) : health && health.status === "Restricted" ? (
            <div className="flex items-start gap-4 p-4 bg-red-50/50 rounded-xl border border-red-100">
              <div className="p-2 bg-red-100 text-red-600 rounded-lg shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-red-800">Restricted Clearance</h4>
                {health.notes && (
                  <p className="text-md text-red-600 mt-1 italic">
                    {health.notes}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-4 p-4 bg-amber-50/50 rounded-xl border border-amber-100">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-lg shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-amber-800">Pending Clearance</h4>
                <p className="text-md text-amber-600 mt-1">
                  Occupational health clearance has not been recorded yet.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Immunisations */}
      <Card className="shadow-sm border-border lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-primary" /> Immunisation Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {immunisations.length > 0 ? (
              immunisations.map((imm) => (
                <div
                  key={imm.id}
                  className="p-4 rounded-xl border border-border bg-white shadow-sm flex flex-col justify-between h-full"
                >
                  <div>
                    <span className="font-bold text-foreground">{imm.name}</span>
                    <p className="text-md text-muted-foreground flex items-center gap-1.5 mt-2">
                      <Activity className="w-3.5 h-3.5" />
                      {format(new Date(imm.dateAdministered), "dd MMM yyyy")}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "mt-4 w-fit",
                      imm.status === "Up to date"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-yellow-50 text-yellow-700 border-yellow-200 animate-pulse",
                    )}
                  >
                    {imm.status}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-8 text-muted-foreground italic border border-dashed rounded-xl border-border">
                No immunisation records found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import {
  Building2,
  LogOut,
  Stethoscope,
  MapPin,
  Phone,
  ShieldAlert,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
} from "@repo/ui/components/ui";

import { useAuth } from "../../../lib/context/AuthContext";
import { useGetRiskAssessmentsQuery } from "../../../lib/queries/risk";
import { getRiskLevelStyle } from "./risk-assessment/risk-utils";
import { calculateAge, type RiskLevel } from "@repo/schema";
import { ResidentPhoto } from "./ResidentPhoto";

interface ResidentProfileSidebarProps {
  resident: any;
  onDischargeClick: () => void;
}

export function ResidentProfileSidebar({
  resident,
  onDischargeClick,
}: ResidentProfileSidebarProps) {
  const { user } = useAuth();
  const isAdmin = user?.roleName?.toLowerCase() === "admin";
  const canReadRisk = !!user?.permissions?.riskAssessments?.read;
  const { data: activeRisks } = useGetRiskAssessmentsQuery(
    { residentId: resident.id, status: "Active" },
    { enabled: canReadRisk },
  );

  const highestRiskLevel = useMemo<RiskLevel | null>(() => {
    if (!activeRisks?.length) return null;
    const LEVEL_RANK: Record<string, number> = {
      Extreme: 4, High: 3, Moderate: 2, Low: 1,
    };
    let maxRank = 0;
    let maxLevel: RiskLevel | null = null;
    for (const a of activeRisks) {
      const lvl = a.residualLevel ?? a.inherentLevel;
      const rank = LEVEL_RANK[lvl] ?? 0;
      if (rank > maxRank) { maxRank = rank; maxLevel = lvl as RiskLevel; }
    }
    return maxRank >= 3 ? maxLevel : null;
  }, [activeRisks]);

  const age = calculateAge(resident.dob) ?? "N/A";

  return (
    <div className="w-full md:w-1/3 lg:w-1/4 space-y-6">
      <Card className="border-none  overflow-hidden relative bg-white/50 ">
        <div className="relative h-56 w-full">
          <ResidentPhoto
            residentId={resident.id}
            photoUrl={resident.photoUrl}
            name={resident.fullName}
            canEdit={isAdmin}
            variant="cover"
          />
          {resident.status === "Discharged" && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex items-center justify-center pointer-events-none">
              <Badge
                variant="secondary"
                className="text-lg py-1 px-4 shadow-xl border border-border bg-white text-gray-800"
              >
                DISCHARGED
              </Badge>
            </div>
          )}
        </div>


        <div className="px-6 pb-6 pt-6 relative z-10">

          <div className="text-center mt-4 space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {resident.fullName}
            </h2>
            <p className="text-muted-foreground text-md flex items-center justify-center gap-1.5">
              <Building2 className="w-4 h-4" />
              {resident.bed?.room?.roomNumber
                ? `Room ${resident.bed.room.roomNumber}`
                : "Unassigned"}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {resident.dnarStatus && (
              <Badge
                variant={resident.dnarStatus ? "default" : "destructive"}
                className=" shadow-sm  text-md px-3 py-1"
              >
                {resident.dnarStatus ? "DNAR Active " : "No-DNAR"}
              </Badge>
            )}
            <Badge
              variant="outline"
              className={`border-${resident.fallRisk ? "red" : "green"}-500 text-${resident.fallRisk ? "red" : "green"}-600 bg-${resident.fallRisk ? "red" : "green"}-500/10`}
            >
              {resident.fallRisk ? "Fall Risk" : "No Fall Risk"}
            </Badge>
            {highestRiskLevel && (
              <Badge
                className={`${getRiskLevelStyle(highestRiskLevel).badge} shadow-sm text-md px-3 py-1`}
              >
                <ShieldAlert className="w-3 h-3 mr-1" />
                {highestRiskLevel} Risk
              </Badge>
            )}
          </div>

          <div className="mt-6 space-y-4 pt-6 border-t border-border">
            <div className="flex justify-between text-md">
              <span className="text-muted-foreground">Age / DOB</span>
              <span className="font-medium text-right">
                {age} years <br />
                <span className="text-md text-muted-foreground">
                  {resident.dob
                    ? new Date(resident.dob).toLocaleDateString()
                    : "N/A"}
                </span>
              </span>
            </div>
            <div className="flex justify-between text-md items-center">
              <span className="text-muted-foreground">NHS Number</span>
              <span className="font-mono font-medium">
                {resident.nhsNumber || "Not provided"}
              </span>
            </div>
            {isAdmin && (
              <div className="flex justify-between text-md items-center">
                <span className="text-muted-foreground">Funding</span>
                <Badge variant="secondary">{resident.fundingType}</Badge>
              </div>
            )}
          </div>

          {resident.status === "Active" && isAdmin && (
            <Button
              variant="outline"
              className="w-full mt-8 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 transition-colors"
              onClick={onDischargeClick}
            >
              <LogOut className="w-4 h-4 mr-2" /> Discharge Resident
            </Button>
          )}
        </div>
      </Card>

      <Card className="border-none">
        <CardHeader className="bg-muted/30 pb-4 border-b border-border">
          <CardTitle className="text-md font-semibold flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-primary" /> General
            Practitioner
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3 mt-2">
          {resident.gpDetails ? (
            <>
              <p className="font-semibold text-md">{resident.gpDetails.name}</p>
              <p className="text-md flex items-start gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />{" "}
                {resident.gpDetails.practice}
              </p>
              {resident.gpDetails.phone && (
                <p className="text-md flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4 shrink-0" />{" "}
                  {resident.gpDetails.phone}
                </p>
              )}
            </>
          ) : (
            <p className="text-md text-muted-foreground italic">
              No GP details recorded.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

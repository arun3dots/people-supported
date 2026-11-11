"use client";

import { useMemo, useState } from "react";
import { ShieldAlert, ArrowRight, UserCircle } from "lucide-react";
import { Card, Badge } from "@repo/ui/components/ui";
import { HighRiskResidentsModal } from "./HighRiskResidentsModal";
import Link from "next/link";
import { useGetRiskAssessmentsQuery } from "../../../../lib/queries/risk";
import { useAuth } from "../../../../lib/context/AuthContext";
import { getRiskLevelStyle } from "./risk-utils";
import type { RiskLevel } from "@repo/schema";

interface HighRiskResident {
  residentId: string;
  fullName: string;
  photoUrl: string | null;
  roomNumber: string | null;
  highestLevel: RiskLevel;
  assessmentCount: number;
}

const LEVEL_RANK: Record<string, number> = {
  Extreme: 4,
  High: 3,
  Moderate: 2,
  Low: 1,
};

export function HighRiskResidentsCard() {
  const { user } = useAuth();
  const canRead = !!user?.permissions?.riskAssessments?.read;
  const roleName = user?.roleName?.toLowerCase() ?? "carer";
  const roleBase =
    roleName === "admin" || roleName === "manager" ? "admin" : "carer";

  const { data: activeRisks, isLoading } = useGetRiskAssessmentsQuery(
    { status: "Active" },
    { enabled: canRead },
  );

  const highRiskResidents = useMemo<HighRiskResident[]>(() => {
    if (!activeRisks?.length) return [];
    const map = new Map<string, HighRiskResident>();

    for (const a of activeRisks) {
      const lvl = (a.residualLevel ?? a.inherentLevel) as RiskLevel;
      const rank = LEVEL_RANK[lvl] ?? 0;
      if (rank < 3) continue;

      const rid = a.residentId;
      const existing = map.get(rid);
      if (existing) {
        existing.assessmentCount += 1;
        if (rank > (LEVEL_RANK[existing.highestLevel] ?? 0)) {
          existing.highestLevel = lvl;
        }
      } else {
        map.set(rid, {
          residentId: rid,
          fullName: a.resident?.fullName ?? "Unknown",
          photoUrl: a.resident?.photoUrl ?? null,
          roomNumber: a.resident?.bed?.room?.roomNumber ?? null,
          highestLevel: lvl,
          assessmentCount: 1,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      const diff =
        (LEVEL_RANK[b.highestLevel] ?? 0) - (LEVEL_RANK[a.highestLevel] ?? 0);
      return diff !== 0 ? diff : a.fullName.localeCompare(b.fullName);
    });
  }, [activeRisks]);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<RiskLevel | null>(null);

  const levelCounts = useMemo(() => {
    const extreme = highRiskResidents.filter((r) => r.highestLevel === "Extreme").length;
    const high = highRiskResidents.filter((r) => r.highestLevel === "High").length;
    return { extreme, high };
  }, [highRiskResidents]);

  const handleLevelClick = (level: RiskLevel) => {
    setSelectedLevel(level);
    setModalOpen(true);
  };

  if (!canRead) return null;

  return (
    <Card className="p-8 border-red-500/10 bg-red-50/30 relative overflow-hidden min-h-[300px]">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-600">
            <ShieldAlert className="size-5" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground text-lg tracking-tight">
              High Risk Residents
            </h4>
            <p className="text-md text-muted-foreground font-medium uppercase tracking-wider">
              Active high &amp; extreme risk
            </p>
          </div>
        </div>
        {highRiskResidents.length > 0 && (
          <div className="flex items-center gap-2">
            {levelCounts.extreme > 0 && (
              <button type="button" onClick={() => handleLevelClick("Extreme")}>
                <Badge className="bg-red-700 text-white hover:bg-red-800 cursor-pointer transition-colors">
                  {levelCounts.extreme} Extreme
                </Badge>
              </button>
            )}
            {levelCounts.high > 0 && (
              <button type="button" onClick={() => handleLevelClick("High")}>
                <Badge className="bg-red-500 text-white hover:bg-red-600 cursor-pointer transition-colors">
                  {levelCounts.high} High
                </Badge>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse flex gap-4 p-3 rounded-xl bg-white/50 border border-border/50"
            >
              <div className="w-10 h-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-muted rounded w-3/4" />
                <div className="h-2 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))
        ) : highRiskResidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
            <div className="size-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <ShieldAlert className="size-8" />
            </div>
            <p className="text-md font-medium text-muted-foreground">
              No high-risk residents currently
            </p>
          </div>
        ) : (
          highRiskResidents.slice(0, 8).map((r) => (
            <Link
              key={r.residentId}
              href={`/${roleBase}/residents/${r.residentId}`}
              className="flex items-center gap-4 p-3 rounded-xl bg-white/50 border border-red-500/10 hover:border-red-500/30 transition-all group/item"
            >
              <div className="size-10 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                {r.photoUrl ? (
                  <img
                    src={r.photoUrl}
                    alt={r.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserCircle className="size-6 text-muted-foreground/40" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="text-md font-semibold text-foreground truncate">
                  {r.fullName}
                </h5>
                <p className="text-md text-muted-foreground">
                  {r.roomNumber ? `Room ${r.roomNumber}` : "Unassigned"}
                  {r.assessmentCount > 1 &&
                    ` \u00b7 ${r.assessmentCount} assessments`}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleLevelClick(r.highestLevel); }}
              >
                <Badge className={`${getRiskLevelStyle(r.highestLevel).badge} text-md px-2 py-0.5 hover:opacity-80 cursor-pointer`}>
                  {r.highestLevel}
                </Badge>
              </button>
              <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover/item:opacity-100 transition-opacity" />
            </Link>
          ))
        )}
      </div>

      <HighRiskResidentsModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        riskLevel={selectedLevel}
        residents={highRiskResidents}
      />
    </Card>
  );
}

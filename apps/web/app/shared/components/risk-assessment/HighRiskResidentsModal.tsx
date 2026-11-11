"use client";

import { UserCircle, ArrowRight, ShieldAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Badge,
} from "@repo/ui/components/ui";
import Link from "next/link";
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

interface HighRiskResidentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  riskLevel: RiskLevel | null;
  residents: HighRiskResident[];
}

export function HighRiskResidentsModal({
  open,
  onOpenChange,
  riskLevel,
  residents,
}: HighRiskResidentsModalProps) {
  const { user } = useAuth();
  const roleName = user?.roleName?.toLowerCase() ?? "carer";
  const roleBase =
    roleName === "admin" || roleName === "manager" ? "admin" : roleName === "nurse" ? "nurse" : "carer";

  const filtered = riskLevel
    ? residents.filter((r) => r.highestLevel === riskLevel)
    : residents;

  const levelStyle = riskLevel ? getRiskLevelStyle(riskLevel) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-600">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg">
                {riskLevel ? `${riskLevel} Risk Residents` : "High Risk Residents"}
              </DialogTitle>
              <DialogDescription>
                {filtered.length} resident{filtered.length !== 1 ? "s" : ""} with{" "}
                {riskLevel ? `${riskLevel.toLowerCase()} risk` : "high or extreme risk"} assessments
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-2 mt-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
              <div className="size-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <ShieldAlert className="size-7" />
              </div>
              <p className="text-md font-medium text-muted-foreground">
                No residents at this risk level
              </p>
            </div>
          ) : (
            filtered.map((r) => {
              const style = getRiskLevelStyle(r.highestLevel);
              return (
                <Link
                  key={r.residentId}
                  href={`/${roleBase}/residents/${r.residentId}`}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-4 p-3 rounded-xl bg-white/50 border border-border/50 hover:border-primary/30 hover:bg-accent/50 transition-all group/item"
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
                  <Badge
                    className={`${style.badge} text-md px-2 py-0.5`}
                  >
                    {r.highestLevel}
                  </Badge>
                  <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover/item:opacity-100 transition-opacity" />
                </Link>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

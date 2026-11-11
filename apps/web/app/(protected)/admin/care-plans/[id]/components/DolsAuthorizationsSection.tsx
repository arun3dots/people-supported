"use client";

import { Card, CardContent, Button, Badge, Text } from "@repo/ui/components/ui";
import { ShieldCheck, Calendar, Clock, CheckCircle2, AlertTriangle, Users } from "lucide-react";
import { DolsAuthorizationDTO } from "@repo/schema";
import { differenceInDays, isPast } from "date-fns";

interface DolsAuthorizationsSectionProps {
  dolsList: DolsAuthorizationDTO[];
  isLoading: boolean;
  onOpenCreateModal: () => void;
}

export function DolsAuthorizationsSection({
  dolsList,
  isLoading,
  onOpenCreateModal,
}: DolsAuthorizationsSectionProps) {
  const getDaysLeft = (expiryDate?: string | Date | null) => {
    if (!expiryDate) return null;
    const diff = new Date(expiryDate).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getDolsBadgeState = (st: string) => {
    switch (st) {
      case "Authorized":
        return "success";
      case "UrgentApplied":
      case "StandardApplied":
        return "warning";
      case "Expired":
      case "Refused":
        return "danger";
      default:
        return "inactive";
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-md text-slate-500 font-['Outfit',sans-serif]">
        Loading DoLS authorisations...
      </div>
    );
  }

  if (dolsList.length === 0) {
    return (
      <div className="text-center py-10 bg-white border border-dashed border-slate-200 rounded-2xl space-y-2 font-['Outfit',sans-serif]">
        <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto" />
        <Text size="sm" weight="semibold" className="text-slate-700">
          No DoLS Authorisations Recorded
        </Text>
        <Text size="sm" variant="muted" className="max-w-md mx-auto">
          Under CQC Regulation 13, any deprivation of liberty requires authorisation by the Supervisory Body.
        </Text>
        <Button
          size="sm"
          onClick={onOpenCreateModal}
          className="mt-2 text-md bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl"
        >
          + Log DoLS Authorisation
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 font-['Outfit',sans-serif]">
      {dolsList.map((d) => {
        const daysLeft = getDaysLeft(d.expiryDate);
        const isExpiring = daysLeft !== null && daysLeft <= 30 && daysLeft >= 0;
        const isExpired = daysLeft !== null && daysLeft < 0;

        return (
          <Card key={d.id} className="border border-slate-200/80 bg-white rounded-2xl shadow-none">
            <CardContent className="p-4 sm:p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-md font-bold text-slate-900">
                      {d.supervisoryBody}
                    </span>
                    {d.referenceNumber && (
                      <Badge variant="secondary" state="inactive" className="text-sm font-mono">
                        Ref: {d.referenceNumber}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-500 mt-1 flex-wrap">
                    <span>Applied: {new Date(d.appliedDate).toLocaleDateString("en-GB")}</span>
                    {d.authorizedDate && (
                      <span>
                        Authorised: {new Date(d.authorizedDate).toLocaleDateString("en-GB")}
                      </span>
                    )}
                    {d.expiryDate && (
                      <span
                        className={
                          isExpired
                            ? "text-rose-600 font-semibold"
                            : isExpiring
                              ? "text-amber-700 font-semibold"
                              : ""
                        }
                      >
                        Expires: {new Date(d.expiryDate).toLocaleDateString("en-GB")} (
                        {isExpired ? "Expired" : `${daysLeft}d left`})
                      </span>
                    )}
                  </div>
                </div>

                <Badge
                  variant="secondary"
                  state={getDolsBadgeState(d.status)}
                  className="text-sm font-semibold px-2.5 py-0.5"
                >
                  {d.status}
                </Badge>
              </div>

              {/* Conditions Attached to Authorisation */}
              {d.conditions && d.conditions.length > 0 && (
                <div className="text-sm text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                  <div className="font-semibold text-slate-800">
                    Statutory Conditions Attached ({d.conditions.length}):
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 pl-1">
                    {d.conditions.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Representative (RPR) Details */}
              {d.relevantPersonsRepresentative && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Users className="size-3 text-slate-400" />
                  <span>
                    RPR: <strong className="text-slate-700">{d.relevantPersonsRepresentative}</strong>
                    {d.rprContact ? ` (${d.rprContact})` : ""}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { User, PenSquare } from "lucide-react";
import { Card, Button, Text, InfoField } from "@repo/ui/components/ui";

interface OverviewAboutCardProps {
  resident: {
    id: string;
    fullName?: string;
    careProfile?: unknown;
    profile?: {
      formerOccupation?: string;
      hobbies?: string;
    };
    admission?: {
      admittedFrom?: string;
      referringFacilityName?: string;
    };
  };
  aboutBio: string;
  isAdmin: boolean;
  onEdit: () => void;
}

export function OverviewAboutCard({
  resident,
  aboutBio,
  isAdmin,
  onEdit,
}: OverviewAboutCardProps) {
  const formerOccupation = resident.profile?.formerOccupation;
  const hobbies = resident.profile?.hobbies;
  const admittedFrom = resident.admission?.admittedFrom;
  const referringFacility = resident.admission?.referringFacilityName;

  return (
    <Card className="bg-surface-card-grey border-none rounded-2xl p-6 lg:p-8 space-y-4 shadow-none font-sans">
      <div className="flex items-center justify-between border-b border-border-secondary/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl bg-surface-primary-light border border-emerald-100 flex items-center justify-center text-icon-primary shrink-0">
            <User className="size-4" />
          </div>
          <Text as="h3" size="base" weight="semibold" className="text-slate-900">
            About {resident.fullName}
          </Text>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-xl bg-white border border-slate-200 text-icon-primary hover:bg-slate-50 cursor-pointer shrink-0"
              title="Edit About Bio"
              onClick={onEdit}
            >
              <PenSquare className="size-4" />
            </Button>
            {!resident.careProfile && (
              <Link href={`/admin/residents/admit?id=${resident.id}&step=3`}>
                <Button variant="primary" size="sm" className="rounded-xl cursor-pointer">
                  Complete Profile
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>

      <Text size="md" weight="regular" className="text-slate-600 leading-relaxed">
        {aboutBio}
      </Text>

      {(formerOccupation || hobbies || admittedFrom || referringFacility) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border-secondary/60">
          {formerOccupation && (
            <InfoField label="Former Occupation" value={formerOccupation} />
          )}
          {hobbies && (
            <InfoField label="Hobbies &amp; Interests" value={hobbies} />
          )}
          {admittedFrom && (
            <InfoField label="Admitted From" value={admittedFrom} />
          )}
          {referringFacility && (
            <InfoField label="Referring Facility" value={referringFacility} />
          )}
        </div>
      )}
    </Card>
  );
}

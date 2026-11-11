"use client";

import React from "react";
import { Plus, PenSquare, PhoneCall } from "lucide-react";
import { Button, Text, InfoField, Badge } from "@repo/ui/components/ui";

interface CareProviderItem {
  type: string;
  name: string;
  clinic?: string;
  phone?: string;
}

interface OverviewCareProvidersCardProps {
  resident: {
    gpDetails?: {
      name?: string;
      gpName?: string;
      practice?: string;
      surgeryName?: string;
      phone?: string;
    };
    careProfile?: {
      otherProviders?: CareProviderItem[];
    };
    admission?: {
      otherProviders?: CareProviderItem[];
    };
  };
  data: {
    gpName?: string;
    gpPractice?: string;
    gpPhone?: string;
    otherProviders?: CareProviderItem[];
  };
  isAdmin: boolean;
  onEditGp: () => void;
}

export function OverviewCareProvidersCard({
  resident,
  data,
  isAdmin,
  onEditGp,
}: OverviewCareProvidersCardProps) {
  const gp = resident.gpDetails || {};
  const care = resident.careProfile || {};
  const admission = resident.admission || {};

  const gpName = data.gpName || gp.name || gp.gpName || "";
  const gpPractice = data.gpPractice || gp.practice || gp.surgeryName || "";
  const gpPhone = data.gpPhone || gp.phone || "";

  const otherProviders: CareProviderItem[] = Array.isArray(admission.otherProviders)
    ? admission.otherProviders
    : Array.isArray(care.otherProviders)
      ? care.otherProviders
      : Array.isArray(data.otherProviders)
        ? data.otherProviders
        : [];

  const hasGp = Boolean(gpName || gpPractice || gpPhone);

  return (
    <div className="bg-surface-card-grey rounded-2xl p-6 lg:p-8 space-y-6 shadow-none border-none font-sans">
      {/* Header */}
      <div className="pb-4 border-b border-border-secondary/80 flex flex-row items-center justify-between gap-4">
        <div>
          <Text as="h3" size="md" weight="bold" className="text-slate-900 tracking-wider">
            CARE PROVIDERS &amp; GP
          </Text>
          <Text size="sm" weight="regular" className="text-slate-500 mt-0.5">
            Primary care practitioner and specialist medical contacts.
          </Text>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={onEditGp}
              className="gap-1.5 rounded-xl border-slate-200 shadow-none hover:bg-white bg-white text-emerald-900 cursor-pointer"
            >
              <Plus className="size-3.5 text-emerald-800" /> Add Provider
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-9 rounded-xl bg-white border border-slate-200 text-icon-primary hover:bg-slate-50 cursor-pointer shrink-0"
              title="Edit Care Providers & GP"
              onClick={onEditGp}
            >
              <PenSquare className="size-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* General Practitioner (GP) */}
        <div className="space-y-3">
          <Text as="h4" size="sm" weight="bold" className="text-slate-900 tracking-wider">
            GENERAL PRACTITIONER (GP) <span className="text-red-500">*</span>
          </Text>

          {hasGp ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-border-secondary/60 shadow-xs">
              <InfoField
                label="Doctor Name *"
                value={gpName || "Not specified"}
              />
              <InfoField
                label="Clinic / Practice"
                value={gpPractice || "Not specified"}
              />
              <div className="flex flex-col gap-1">
                <Text size="sm" weight="medium" className="text-slate-500">
                  Phone *
                </Text>
                {gpPhone ? (
                  <a href={`tel:${gpPhone}`} className="inline-flex items-center gap-1.5 text-md font-semibold text-emerald-800 hover:underline">
                    <PhoneCall className="size-3.5 text-emerald-700" />
                    {gpPhone}
                  </a>
                ) : (
                  <Text size="sm" weight="regular" className="text-slate-400">
                    Not specified
                  </Text>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-white rounded-xl border border-border-secondary/60 text-center">
              <Text size="sm" weight="regular" className="text-slate-500 italic">
                No GP surgery details registered. Click &quot;Add Provider&quot; to add details.
              </Text>
            </div>
          )}
        </div>

        {/* Additional Healthcare Providers */}
        {otherProviders.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-border-secondary/80">
            <Text as="h4" size="sm" weight="bold" className="text-slate-900 tracking-wider">
              Additional Healthcare Providers
            </Text>
            <div className="grid grid-cols-1 gap-3">
              {otherProviders.map((provider: CareProviderItem, index: number) => (
                <div
                  key={index}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-white p-3.5 rounded-xl border border-border-secondary/60 shadow-xs"
                >
                  <div className="sm:col-span-3">
                    <Text size="sm" weight="medium" className="text-slate-500">
                      Provider Type
                    </Text>
                    <Badge variant="secondary" state="info" className="mt-0.5 px-2.5 py-0.5 shadow-none">
                      {provider.type || "Specialist"}
                    </Badge>
                  </div>

                  <div className="sm:col-span-3">
                    <Text size="sm" weight="medium" className="text-slate-500">
                      Provider Name
                    </Text>
                    <Text size="md" weight="bold" className="text-slate-900 truncate">
                      {provider.name || "N/A"}
                    </Text>
                  </div>

                  <div className="sm:col-span-3">
                    <Text size="sm" weight="medium" className="text-slate-500">
                      Clinic / Practice
                    </Text>
                    <Text size="md" weight="regular" className="text-slate-700 truncate">
                      {provider.clinic || "N/A"}
                    </Text>
                  </div>

                  <div className="sm:col-span-3">
                    <Text size="sm" weight="medium" className="text-slate-500">
                      Phone
                    </Text>
                    {provider.phone ? (
                      <a href={`tel:${provider.phone}`} className="text-md font-semibold text-emerald-800 hover:underline">
                        {provider.phone}
                      </a>
                    ) : (
                      <Text size="sm" weight="regular" className="text-slate-400">
                        N/A
                      </Text>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

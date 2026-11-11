"use client";

import React from "react";
import Link from "next/link";
import { PhoneCall, PenSquare, FileText } from "lucide-react";
import { Card, Button, Text } from "@repo/ui/components/ui";

interface NokContact {
  name?: string;
  relationship?: string;
  relation?: string;
  phone?: string;
  phoneNumber?: string;
  email?: string;
  emailAddress?: string;
}

interface OverviewContactsCardProps {
  resident: {
    id: string;
    nextOfKin?: NokContact[];
    admission?: {
      billingResponsibleParty?: {
        name?: string;
        relationship?: string;
        phone?: string;
        address?: string;
      };
    };
    consent?: {
      generalConsent?: {
        legalRep?: {
          type?: string;
          nameContact?: string;
        };
      };
      poaDocUrl?: string;
      poaDocumentUrl?: string;
    };
  };
  data: {
    nokName?: string;
    nokRelation?: string;
    nokPhone?: string;
  };
  isAdmin: boolean;
  onEditNok: () => void;
  onEditGp: () => void;
}

export function OverviewContactsCard({
  resident,
  data,
  isAdmin,
  onEditNok,
}: OverviewContactsCardProps) {
  const nextOfKinList = Array.isArray(resident.nextOfKin) ? resident.nextOfKin : [];
  const primaryNok = nextOfKinList[0] || {};
  const secondaryNok = nextOfKinList[1] || {};
  const responsibleParty = resident.admission?.billingResponsibleParty || {};
  const legalRep = resident.consent?.generalConsent?.legalRep || {};
  const poaDocUrl = resident.consent?.poaDocumentUrl || resident.consent?.poaDocUrl;

  const hasPrimaryNok = Boolean(data.nokName || primaryNok.name || primaryNok.phone);
  const hasSecondaryNok = Boolean(secondaryNok.name || secondaryNok.phone);
  const hasResponsibleParty = Boolean(responsibleParty.name);
  const hasLegalRep = Boolean(legalRep.type || legalRep.nameContact || poaDocUrl);

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Emergency Contacts Card */}
      <Card className="bg-surface-card-grey border-none rounded-2xl p-6 lg:p-8 space-y-4 shadow-none">
        <div className="flex items-center justify-between border-b border-border-secondary/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-xl bg-surface-primary-light border border-emerald-100 flex items-center justify-center text-icon-primary shrink-0">
              <PhoneCall className="size-4" />
            </div>
            <Text as="h3" size="base" weight="semibold" className="text-slate-900">
              Emergency Contacts &amp; Next of Kin
            </Text>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-xl bg-white border border-slate-200 text-icon-primary hover:bg-slate-50 cursor-pointer shrink-0"
                title="Edit Emergency Contact"
                onClick={onEditNok}
              >
                <PenSquare className="size-4" />
              </Button>
              {!hasPrimaryNok && (
                <Link href={`/admin/residents/admit?id=${resident.id}&step=2`}>
                  <Button variant="primary" size="sm" className="rounded-xl cursor-pointer">
                    Add Contact
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>

        {hasPrimaryNok ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Primary Contact */}
            <div className="bg-white border border-border-secondary/80 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-emerald-50 text-emerald-800 text-md font-semibold flex items-center justify-center border border-emerald-200 shrink-0">
                  {data.nokName ? data.nokName.slice(0, 2).toUpperCase() : "NOK"}
                </div>
                <div className="min-w-0 flex-1">
                  <Text size="md" weight="bold" className="text-emerald-800 tracking-wider">
                    Primary Contact
                  </Text>
                  <Text as="h4" size="md" weight="bold" className="text-slate-900 truncate">
                    {data.nokName || primaryNok.name || "Emergency Contact"}
                  </Text>
                  <Text size="md" weight="regular" className="text-slate-500">
                    {data.nokRelation || primaryNok.relationship || primaryNok.relation || "Next of Kin"}
                  </Text>
                </div>
              </div>

              <div className="space-y-1 text-md pt-2 border-t border-slate-100">
                {(data.nokPhone || primaryNok.phone || primaryNok.phoneNumber) && (
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <PhoneCall className="size-3.5 text-icon-primary shrink-0" />
                    <Text size="md">{data.nokPhone || primaryNok.phone || primaryNok.phoneNumber}</Text>
                  </div>
                )}
                {(primaryNok.email || primaryNok.emailAddress) && (
                  <Text size="md" weight="regular" className="text-slate-500 truncate">
                    Email: {primaryNok.email || primaryNok.emailAddress}
                  </Text>
                )}
              </div>

              {(data.nokPhone || primaryNok.phone) && (
                <a href={`tel:${data.nokPhone || primaryNok.phone}`} className="w-full">
                  <Button variant="primary" size="sm" className="w-full rounded-xl flex items-center justify-center gap-1.5 cursor-pointer">
                    <PhoneCall className="size-3.5 text-white" />
                    Call Primary Contact
                  </Button>
                </a>
              )}
            </div>

            {/* Secondary Contact */}
            {hasSecondaryNok && (
              <div className="bg-white border border-border-secondary/80 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-slate-100 text-slate-700 text-md font-semibold flex items-center justify-center border border-slate-200 shrink-0">
                    {secondaryNok.name ? secondaryNok.name.slice(0, 2).toUpperCase() : "2ND"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Text size="md" weight="bold" className="text-slate-500 tracking-wider">
                      Secondary Contact
                    </Text>
                    <Text as="h4" size="md" weight="bold" className="text-slate-900 truncate">
                      {secondaryNok.name}
                    </Text>
                    <Text size="md" weight="regular" className="text-slate-500">
                      {secondaryNok.relationship || secondaryNok.relation || "Secondary Contact"}
                    </Text>
                  </div>
                </div>

                <div className="space-y-1 text-md pt-2 border-t border-slate-100">
                  {secondaryNok.phone && (
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <PhoneCall className="size-3.5 text-icon-primary shrink-0" />
                      <Text size="md">{secondaryNok.phone}</Text>
                    </div>
                  )}
                  {secondaryNok.emailAddress && (
                    <Text size="md" weight="regular" className="text-slate-500 truncate">
                      Email: {secondaryNok.emailAddress}
                    </Text>
                  )}
                </div>

                {secondaryNok.phone && (
                  <a href={`tel:${secondaryNok.phone}`} className="w-full">
                    <Button variant="outline" size="sm" className="w-full rounded-xl flex items-center justify-center gap-1.5 cursor-pointer">
                      <PhoneCall className="size-3.5 text-slate-700" />
                      Call Secondary Contact
                    </Button>
                  </a>
                )}
              </div>
            )}
          </div>
        ) : (
          <Text size="md" weight="regular" className="text-slate-500 italic">
            No emergency contacts recorded yet.
          </Text>
        )}

        {/* Responsible Party & Power of Attorney details */}
        {(hasResponsibleParty || hasLegalRep) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border-secondary/60">
            {hasResponsibleParty && (
              <div className="space-y-1">
                <Text size="md" weight="bold" className="text-slate-500">
                  Responsible Party for Care
                </Text>
                <Text size="md" weight="bold" className="text-slate-900">
                  {responsibleParty.name} {responsibleParty.relationship ? `(${responsibleParty.relationship})` : ""}
                </Text>
                {responsibleParty.phone && (
                  <Text size="md" weight="regular" className="text-slate-500">
                    Phone: {responsibleParty.phone}
                  </Text>
                )}
                {responsibleParty.address && (
                  <Text size="md" weight="regular" className="text-slate-500">
                    Address: {responsibleParty.address}
                  </Text>
                )}
              </div>
            )}

            {hasLegalRep && (
              <div className="space-y-1">
                <Text size="md" weight="bold" className="text-slate-500">
                  Legal Representative / Power of Attorney
                </Text>
                <Text size="md" weight="bold" className="text-slate-900">
                  {legalRep.type || "Power of Attorney"}: {legalRep.nameContact || "Named on File"}
                </Text>
                {poaDocUrl && (
                  <a
                    href={poaDocUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-md text-emerald-800 hover:underline font-semibold mt-1"
                  >
                    <FileText className="size-3.5" /> View POA Document
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

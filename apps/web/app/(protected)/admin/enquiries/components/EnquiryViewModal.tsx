"use client";

import type { ReactNode } from "react";
import type { EnquiryResponseDTO } from "@repo/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  InfoField,
  Text,
  Spinner,
} from "@repo/ui/components/ui";
import { useGetEnquiryQuery } from "../../../../../lib/queries/enquiries";

interface PreviewField {
  label: string;
  value: ReactNode;
}

interface PreviewSectionConfig {
  id: string;
  title: string;
  description: string;
  fields: PreviewField[];
}

/**
 * Factory function to transform EnquiryResponseDTO into structured section configurations.
 * Adheres to SRP (Data Transformation) and DRY principles.
 */
function createEnquiryPreviewSections(enquiry: EnquiryResponseDTO): PreviewSectionConfig[] {
  return [
    {
      id: "enquirer-contact",
      title: "Enquirer Contact Details",
      description: "Person contacting the care home on behalf of the resident",
      fields: [
        { label: "Full Name", value: enquiry.enquirerName || "—" },
        { label: "Relationship to Resident", value: enquiry.enquirerRelationship || "—" },
        { label: "Phone Number", value: enquiry.enquirerPhone || "—" },
        { label: "Email Address", value: enquiry.enquirerEmail || "—" },
      ],
    },
    {
      id: "resident-details",
      title: "Prospective Resident Details",
      description: "Core background information for pre-admission assessment",
      fields: [
        { label: "First Name", value: enquiry.firstName || "—" },
        { label: "Middle Name", value: enquiry.middleName || "—" },
        { label: "Last Name", value: enquiry.lastName || "—" },
        { label: "Current Location", value: enquiry.currentLocation || "—" },
        { label: "Care Category Requested", value: enquiry.careCategory || "General" },
      ],
    },
  ];
}

interface PreviewSectionCardProps {
  section: PreviewSectionConfig;
}

/**
 * Presentational component for rendering a single preview card section.
 * Reuses @repo/ui InfoField primitive with custom design tokens.
 */
function PreviewSectionCard({ section }: PreviewSectionCardProps) {
  return (
    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100/80">
      <Text size="sm" weight="semibold" className="text-slate-900 leading-tight">
        {section.title}
      </Text>
      <Text size="sm" variant="subdued" className="text-slate-500 mt-0.5 mb-4 block">
        {section.description}
      </Text>

      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        {section.fields.map((field) => (
          <InfoField
            key={field.label}
            label={field.label}
            value={field.value}
            labelClassName="text-md text-slate-400 font-medium tracking-normal"
            valueClassName="text-md font-semibold text-slate-900 mt-0.5 truncate"
          />
        ))}
      </div>
    </div>
  );
}

export interface EnquiryViewModalProps {
  enquiryId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * EnquiryViewModal: Clean, read-only preview modal for prospective resident enquiries.
 * Built with @repo/ui primitives and strictly adheres to AGENTS.md and PROJECT.md guidelines.
 */
export function EnquiryViewModal({
  enquiryId,
  open,
  onOpenChange,
}: EnquiryViewModalProps) {
  const { data: enquiry, isLoading } = useGetEnquiryQuery(
    open && enquiryId ? enquiryId : undefined
  );

  const sections = enquiry ? createEnquiryPreviewSections(enquiry) : [];
  const displayName = enquiry
    ? enquiry.enquirerName?.trim() ||
    `${enquiry.firstName} ${enquiry.lastName}`.trim() ||
    "Enquiry Details"
    : "Enquiry Details";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="xl"
        className="font-['Outfit',sans-serif] bg-white rounded-2xl p-6 border border-slate-200 shadow-2xl gap-5"
      >
        <DialogHeader className="text-left gap-1">
          <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">
            {displayName}
          </DialogTitle>
          <DialogDescription className="text-md text-slate-500">
            Record enquirer contact, prospective resident details, and care category.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        ) : enquiry ? (
          <div className="space-y-4">
            {sections.map((section) => (
              <PreviewSectionCard key={section.id} section={section} />
            ))}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

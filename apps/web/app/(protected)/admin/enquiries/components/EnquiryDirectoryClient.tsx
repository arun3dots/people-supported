"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, Layers } from "lucide-react";
import { Button } from "@repo/ui/components/ui";
import type { EnquiryResponseDTO } from "@repo/schema";
import {
  useGetPaginatedEnquiriesQuery,
  useGetEnquiryMetricsQuery,
} from "../../../../../lib/queries/enquiries";
import { EntityListView } from "../../../../../lib/components/shared";
import { useListQueryState } from "../../../../../lib/hooks";
import { EnquiryStatCards } from "./EnquiryStatCards";
import { EnquiryFilterSection } from "./EnquiryFilterSection";
import { useEnquiryColumns } from "./useEnquiryColumns";
import { EnquiryCard } from "./EnquiryCardGrid";
import { EnquiryWizardModal } from "./EnquiryWizardModal";
import { NeedsAssessmentModal } from "./assessment/NeedsAssessmentModal";

const ENQUIRY_FILTERS = {
  status: "ALL",
  careCategory: "ALL",
} as const;

export function EnquiryDirectoryClient() {
  const router = useRouter();

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] =
    useState<EnquiryResponseDTO | null>(null);

  // Needs Assessment Modal State
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [assessmentEnquiry, setAssessmentEnquiry] =
    useState<EnquiryResponseDTO | null>(null);
  const [isAssessmentReadOnly, setIsAssessmentReadOnly] = useState(false);

  const {
    page,
    limit,
    search,
    searchInput,
    setSearchInput,
    filters,
    filterParams,
    setFilter,
    handlePageChange,
    handleLimitChange,
    resetFilters,
  } = useListQueryState({
    filters: ENQUIRY_FILTERS,
    storageKey: "enquiry_page_size",
  });

  // 1. Persistent tenant KPI metrics (unaffected by table search/filter/page)
  const { data: metrics } = useGetEnquiryMetricsQuery();

  // 2. Current page of enquiries, filtered server-side
  const { data: paginatedResponse, isLoading } = useGetPaginatedEnquiriesQuery({
    page,
    limit,
    search,
    status: filterParams.status,
    careCategory: filterParams.careCategory,
  });

  const enquiries = paginatedResponse?.data ?? [];
  const totalRecords = paginatedResponse?.total ?? 0;

  const handleCreateNew = () => {
    setSelectedEnquiry(null);
    setIsWizardOpen(true);
  };

  const handleEdit = (enquiry: EnquiryResponseDTO) => {
    setSelectedEnquiry(enquiry);
    setIsWizardOpen(true);
  };

  const handleEnquiryCreated = () => {
    // Clear all filters so the newly created enquiry is always visible
    resetFilters();
  };

  const handleRowClick = (enquiry: EnquiryResponseDTO) => {
    setSelectedEnquiry(enquiry);
    setIsWizardOpen(true);
  };

  const handleAdmitDirect = (e: React.MouseEvent, enquiryId: string) => {
    e.stopPropagation();
    const item = enquiries.find((enq) => enq.id === enquiryId);
    if (item?.convertedResidentId) {
      router.push(`/admin/residents/admit?enquiryId=${enquiryId}&id=${item.convertedResidentId}`);
    } else {
      router.push(`/admin/residents/admit?enquiryId=${enquiryId}`);
    }
  };

  const handleOpenAssessment = (
    enquiry: EnquiryResponseDTO,
    readOnly = false,
  ) => {
    setAssessmentEnquiry(enquiry);
    setIsAssessmentReadOnly(readOnly);
    setIsAssessmentModalOpen(true);
  };

  const columns = useEnquiryColumns({
    onAdmitDirect: handleAdmitDirect,
    onOpenAssessment: handleOpenAssessment,
    onEdit: handleEdit,
  });

  return (
    <>
      <EntityListView<EnquiryResponseDTO>
        title="Enquiry Directory"
        description="Track prospective resident leads, pre-admission fit assessments, and bed allocation workflow."
        overviewTitle="Enquiry Overview"
        storageKey="enquiry_directory_view"
        headerActions={
          <Link href="/admin/enquiries/templates">
            <Button variant="outline" className="gap-2 cursor-pointer">
              <Layers className="size-4 text-emerald-800" />
              Assessment Templates
            </Button>
          </Link>
        }
        onAdd={handleCreateNew}
        addLabel="Create New Enquiry"
        addIcon={<UserPlus className="size-4" />}
        stats={
          <EnquiryStatCards
            totalEnquiries={metrics?.totalEnquiries ?? 0}
            pendingAssessments={metrics?.pendingAssessments ?? 0}
            readyForAdmission={metrics?.readyForAdmission ?? 0}
            admittedCount={metrics?.admittedCount ?? 0}
          />
        }
        filters={
          <EnquiryFilterSection
            search={searchInput}
            setSearch={setSearchInput}
            statusFilter={filters.status ?? ENQUIRY_FILTERS.status}
            setStatusFilter={(value) => setFilter("status", value)}
            categoryFilter={
              filters.careCategory ?? ENQUIRY_FILTERS.careCategory
            }
            setCategoryFilter={(value) => setFilter("careCategory", value)}
            onReset={resetFilters}
          />
        }
        columns={columns}
        data={enquiries}
        paginatedData={enquiries}
        renderCard={(enquiry, idx) => (
          <EnquiryCard
            key={enquiry.id}
            enquiry={enquiry}
            showRightDivider={idx % 3 !== 2 && idx !== enquiries.length - 1}
            onRowClick={handleRowClick}
            onAdmitDirect={handleAdmitDirect}
            onOpenAssessment={handleOpenAssessment}
            onEdit={handleEdit}
          />
        )}
        onRowClick={handleRowClick}
        isLoading={isLoading}
        emptyTitle="No enquiries matching your criteria"
        emptyDescription="Try adjusting your search keywords or status filter, or create a new enquiry lead."
        pagination={{
          currentPage: page,
          pageSize: limit,
          totalRecords,
          onPageChange: handlePageChange,
          onLimitChange: handleLimitChange,
          showLimitSelector: true,
          entityName: "enquiries",
        }}
      />

      {/* Enquiry 3-Step Wizard Modal */}
      <EnquiryWizardModal
        open={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        enquiry={selectedEnquiry}
        onCreated={handleEnquiryCreated}
      />

      {/* Pre-Admission Needs Assessment Modal */}
      <NeedsAssessmentModal
        isOpen={isAssessmentModalOpen}
        onClose={() => {
          setIsAssessmentModalOpen(false);
          setAssessmentEnquiry(null);
        }}
        enquiry={assessmentEnquiry}
        readOnly={isAssessmentReadOnly}
      />
    </>
  );
}

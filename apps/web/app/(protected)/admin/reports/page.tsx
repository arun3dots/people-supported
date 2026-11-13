"use client";

import React, { useState } from "react";
import {
  Search,
  X,
  FileSpreadsheet,
  ShieldCheck,
  Clock,
  CalendarCheck,
} from "lucide-react";
import { Text, Button, Input } from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/Select";
import {
  SummaryCardsGrid,
  type SummaryCardItem,
} from "@repo/ui/components/ui/SummaryCard";
import { usePagination } from "@repo/ui/hooks";
import {
  REPORT_DEFINITIONS,
  ReportCardsGrid,
  ReportDefinition,
} from "./components/ReportCardsGrid";
import {
  RecentReportsTable,
  GeneratedReportLog,
} from "./components/RecentReportsTable";
import {
  triggerCsvDownload,
  useExportIncidentsReportMutation,
  useExportResidentsReportMutation,
  useExportEscalationsReportMutation,
  useExportOccupancyReportMutation,
  useExportMedicationsReportMutation,
  useExportCarePlansReportMutation,
  useExportShiftsReportMutation,
  useExportCqcComplianceReportMutation,
  useExportInvoicesReportMutation,
} from "../../../../lib/queries/reports";
import { toast } from "@repo/ui/components/ui";

export default function ReportsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [reportLogs, setReportLogs] = useState<GeneratedReportLog[]>([]);

  const filteredReports = REPORT_DEFINITIONS.filter((rep) => {
    const matchesSearch =
      !searchTerm ||
      rep.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rep.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === "All Categories" || rep.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const hasActiveFilters =
    categoryFilter !== "All Categories" || searchTerm.trim() !== "";

  const handleResetFilters = () => {
    setCategoryFilter("All Categories");
    setSearchTerm("");
  };

  const exportIncidentsMutation = useExportIncidentsReportMutation();
  const exportResidentsMutation = useExportResidentsReportMutation();
  const exportEscalationsMutation = useExportEscalationsReportMutation();
  const exportOccupancyMutation = useExportOccupancyReportMutation();
  const exportMedicationsMutation = useExportMedicationsReportMutation();
  const exportCarePlansMutation = useExportCarePlansReportMutation();
  const exportShiftsMutation = useExportShiftsReportMutation();
  const exportCqcComplianceMutation = useExportCqcComplianceReportMutation();
  const exportInvoicesMutation = useExportInvoicesReportMutation();

  const handleGenerateReport = async (
    report: ReportDefinition,
    format: "PDF" | "Excel" | "CSV"
  ) => {
    try {
      const runners: Record<
        string,
        () => Promise<{ filename: string; content: string; rowCount: number } | undefined>
      > = {
        "incidents-safeguarding": () => exportIncidentsMutation.mutateAsync({}),
        "resident-clinical-risk": () => exportResidentsMutation.mutateAsync(),
        "clinical-escalations": () => exportEscalationsMutation.mutateAsync(),
        "resident-occupancy": () => exportOccupancyMutation.mutateAsync(),
        "medication-mar": () => exportMedicationsMutation.mutateAsync(),
        "care-plan-reviews": () => exportCarePlansMutation.mutateAsync(),
        "staff-rota-attendance": () => exportShiftsMutation.mutateAsync(),
        "cqc-compliance": () => exportCqcComplianceMutation.mutateAsync(),
        "finance-invoicing": () => exportInvoicesMutation.mutateAsync(),
      };

      const run = runners[report.id];
      const res = run ? await run() : undefined;
      const rowCount = res?.rowCount ?? 0;

      const newLog: GeneratedReportLog = {
        id: `rep-${Date.now().toString().slice(-4)}`,
        name: `${report.title} - ${new Date().toLocaleDateString("en-GB", { month: "short", year: "numeric" })}`,
        category: report.category,
        generatedDate: "Just now",
        generatedBy: "Admin User",
        format,
        status: "Ready",
        fileSize: `${rowCount} records`,
        filename: res?.filename,
        content: res?.content,
        detailHref: report.detailHref,
      };
      setReportLogs((prev) => [newLog, ...prev]);

      toast({
        title: "Report Generated",
        description: `${report.title} (${rowCount} records) exported successfully`,
      });
    } catch {
      toast({
        title: "Export Failed",
        description: `Failed to generate ${report.title}`,
        variant: "destructive",
      });
    }
  };

  const handleDownload = (log: GeneratedReportLog) => {
    if (log.content && log.filename) {
      triggerCsvDownload(log.filename, log.content);
      return;
    }
    toast({
      title: "Re-generate Report",
      description: "Please click Generate on the report card above to fetch fresh CSV data.",
    });
  };

  const {
    currentPage,
    pageSize,
    paginatedData: paginatedLogs,
    totalRecords,
    handlePageChange,
    handleLimitChange,
  } = usePagination(reportLogs);

  const statCards: SummaryCardItem[] = [
    {
      title: "Available Templates",
      value: `${REPORT_DEFINITIONS.length} Reports`,
      subtitle: "Clinical, CQC & operational",
      icon: <FileSpreadsheet className="size-5 text-emerald-800" />,
      subtitleColor: "text-slate-500",
    },
    {
      title: "Regulatory Compliance",
      value: "100% Ready",
      subtitle: "CQC standards aligned",
      icon: <ShieldCheck className="size-5 text-emerald-800" />,
      subtitleColor: "text-emerald-800 font-medium",
    },
    {
      title: "Recent Exports",
      value: `${reportLogs.length} Generated`,
      subtitle: "Real-time CSV data exports",
      icon: <Clock className="size-5 text-blue-700" />,
      subtitleColor: "text-blue-700 font-medium",
    },
    {
      title: "Scheduled Runs",
      value: "4 Active",
      subtitle: "Daily & weekly automation",
      icon: <CalendarCheck className="size-5 text-amber-700" />,
      subtitleColor: "text-amber-700 font-medium",
    },
  ];

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div>
        <Text size="xl" weight="bold">
          Reports &amp; Analytics Hub
        </Text>
        <Text size="md" weight="regular" className="text-slate-500 mt-0.5">
          Generate, schedule, and export statutory compliance, care quality, financial, and operational reports.
        </Text>
      </div>

      {/* Summary Cards */}
      <SummaryCardsGrid
        cards={statCards}
        className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 font-sans"
      />

      {/* Search & Filter Bar */}
      <div className="w-full flex flex-col gap-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-start gap-3 lg:gap-4 justify-between w-full">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px] [&_[data-slot=input-error]]:hidden">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4 pointer-events-none z-10" />
            <Input
              type="text"
              placeholder="Search reports by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-white border-slate-200 rounded-xl text-md text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-emerald-800 shadow-none"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px] sm:w-[210px] h-11 bg-white border-slate-200 rounded-xl text-md font-regular text-slate-800">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 rounded-xl shadow-md w-auto min-w-[var(--radix-select-trigger-width)]">
                  <SelectItem value="All Categories" className="text-md">All Categories</SelectItem>
                  <SelectItem value="Compliance & CQC" className="text-md">Compliance & CQC</SelectItem>
                  <SelectItem value="Clinical & Care" className="text-md">Clinical & Care</SelectItem>
                  <SelectItem value="Finance & Billing" className="text-md">Finance & Billing</SelectItem>
                  <SelectItem value="Staffing & HR" className="text-md">Staffing & HR</SelectItem>
                  <SelectItem value="Operations" className="text-md">Operations</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear All — sits under the last filter, like a field error line */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              tabIndex={hasActiveFilters ? 0 : -1}
              aria-hidden={!hasActiveFilters}
              className={cn(
                "inline-flex items-center gap-1 text-md font-medium text-slate-400 hover:text-red-600 transition-opacity duration-200 cursor-pointer px-1 h-6 min-h-[20px]",
                hasActiveFilters
                  ? "opacity-100 visible"
                  : "opacity-0 invisible pointer-events-none select-none"
              )}
            >
              <X className="size-3" />
              Clear all
            </Button>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <ReportCardsGrid
        reports={filteredReports}
        onGenerateReport={handleGenerateReport}
      />

      {/* Recently Generated Reports Table */}
      <RecentReportsTable
        logs={paginatedLogs}
        currentPage={currentPage}
        pageSize={pageSize}
        totalRecords={totalRecords}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        onDownload={handleDownload}
      />
    </div>
  );
}

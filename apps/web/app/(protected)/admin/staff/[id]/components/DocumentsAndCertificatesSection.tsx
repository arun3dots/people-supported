"use client";

import React, { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/Table";
import { Button } from "@repo/ui/components/ui/Button";
import { Pagination } from "@repo/ui/components/ui/Pagination";
import { usePagination } from "@repo/ui/hooks";
import { PDFicon } from "@repo/ui/icons";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { format } from "date-fns";
import { useGetStaffComplianceQuery } from "../../../../../../lib/queries/staff/useComplianceQueries";
import { CertificationStatus } from "./StaffComplianceWidgets";
import { Card } from "@repo/ui/components/ui";
import { DocumentViewerModal } from "./DocumentViewerModal";

interface DocumentItem {
  id: string;
  name: string;
  skills?: string[];
  category: string;
  linkedType: string;
  completedDate: string;
  expiryDate: string;
  dueDays?: number;
  status: string;
  certificateUrl?: string;
}

export function DocumentsAndCertificatesSection() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id: staffId } = useParams<{ id: string }>();

  const [activeDocUrl, setActiveDocUrl] = useState<string | null>(null);
  const [activeDocName, setActiveDocName] = useState<string>("Document Preview");
  const [viewerOpen, setViewerOpen] = useState(false);

  const { data: complianceData, isLoading } =
    useGetStaffComplianceQuery(staffId);
  const apiCerts = complianceData?.certifications;

  const documentItems = useMemo<DocumentItem[]>(() => {
    if (!apiCerts || apiCerts.length === 0) {
      return [];
    }
    return apiCerts.map((cert) => ({
      id: cert.id,
      name: cert.name,
      skills: cert.skills || [],
      category: "Mandatory Training",
      linkedType: "Certification",
      completedDate: cert.issueDate
        ? format(new Date(cert.issueDate), "dd MMM yyyy")
        : "-",
      expiryDate: cert.expiryDate
        ? format(new Date(cert.expiryDate), "dd MMM yyyy")
        : "-",
      status: cert.status || "Valid",
      certificateUrl: cert.certificateUrl,
    }));
  }, [apiCerts]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const {
    currentPage,
    pageSize,
    paginatedData,
    totalRecords,
    handlePageChange,
    handleLimitChange,
  } = usePagination(documentItems);

  const isAllSelected =
    paginatedData.length > 0 &&
    paginatedData.every((item) => selectedIds.includes(item.id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      const pageItemIds = new Set(paginatedData.map((item) => item.id));
      setSelectedIds((prev) => prev.filter((id) => !pageItemIds.has(id)));
    } else {
      const pageItemIds = paginatedData.map((item) => item.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageItemIds])));
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleOpenCertificate = (url?: string, certName?: string) => {
    if (!url) {
      alert("No certificate document file attached to this record.");
      return;
    }
    setActiveDocUrl(url);
    setActiveDocName(certName || "Certificate Document");
    setViewerOpen(true);
  };

  const openModal = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("isCertificateModalOpen", "true");
    router.replace(pathname + "?" + params.toString());
  };

  return (
    <Card >
      <div className="w-full flex items-center justify-between h-[44px]">
        <h2 className="text-[16px] font-medium leading-[20px] text-[#141F1E]">
          Documents & Certificates
        </h2>

        <Button onClick={openModal} variant="outline">
          <Plus className="w-4 h-4" />
          Add Certification
        </Button>
      </div>

      {/* Table Content Area */}
      <div className="w-full flex flex-col items-center gap-[20px]">
        <div className="w-full overflow-x-auto [&_[data-slot='table-container']]:h-auto">
          <Table className="w-full border-collapse border-b border-[#BCD3CD]">
            <TableHeader >
              <TableRow className="">

                <TableHead>#</TableHead>
                <TableHead>Training Module</TableHead>
                <TableHead>Skills</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Linked Type</TableHead>
                <TableHead>Completed Date</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-12 text-[#5D5D5D] italic"
                  >
                    No documents or certificates found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((doc, idx) => (
                  <TableRow
                    key={doc.id || idx}
                  >

                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{doc.name}</TableCell>
                    <TableCell>
                      {doc.skills && doc.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {doc.skills.map((skill, sIdx) => (
                            <span
                              key={sIdx}
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-md font-medium bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>{doc.category}</TableCell>
                    <TableCell>{doc.linkedType}</TableCell>
                    <TableCell>{doc.completedDate}</TableCell>
                    <TableCell>
                      <div className="flex flex-col justify-center">
                        <span className="">{doc.expiryDate}</span>
                        {doc.dueDays !== undefined && (
                          <span className="">Due in {doc.dueDays} days</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <CertificationStatus status={doc.status} />
                    </TableCell>
                    <TableCell className="">
                      <Button
                        variant="ghost"
                        onClick={() =>
                          handleOpenCertificate(doc.certificateUrl, doc.name)
                        }
                        title={
                          doc.certificateUrl
                            ? "View Certificate Document"
                            : "No document attached"
                        }
                        className="p-0"
                      >
                        <PDFicon />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Protected Document Viewer Modal */}
        <DocumentViewerModal
          open={viewerOpen}
          onOpenChange={setViewerOpen}
          title={activeDocName}
          documentPath={activeDocUrl}
          staffId={staffId}
        />

        {/* Pagination Section */}
        <div className="w-full pt-2">
          <Pagination
            pageNumber={currentPage}
            pageSize={pageSize}
            totalRecords={totalRecords}
            limit={pageSize.toString()}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            disabled={isLoading}
            entityName="staff"
          />
        </div>
      </div>
    </Card>
  );
}

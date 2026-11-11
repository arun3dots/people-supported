"use client";


import { useParams } from "next/navigation";


import { useGetStaffMemberQuery } from "../../../../../../../lib/queries/staff/useGetStaffMemberQuery";
import { useGetStaffComplianceQuery } from "../../../../../../../lib/queries/staff/useComplianceQueries";
import { DocumentsAndCertificatesSection } from "../DocumentsAndCertificatesSection";

export function CertificationTab() {

  const { id: staffId } = useParams<{ id: string }>();
  const { data: staff, isLoading: staffLoading } = useGetStaffMemberQuery(staffId);






  const { data: complianceData, isLoading: complianceLoading } = useGetStaffComplianceQuery(staffId);
  const apiCerts = complianceData?.certifications;

  if (staffLoading || !staff) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-3 border-[#4A706A] border-t-transparent rounded-full" />
      </div>
    );
  }




  return (
    /* items-stretch forces column 1 and column 2 to equal heights */
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full  font-['Outfit',sans-serif] items-stretch">


      <div className="lg:col-span-12">
        <DocumentsAndCertificatesSection />
      </div>
    </div>
  );
}
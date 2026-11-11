"use client";

import { Suspense } from "react";
import { useGetStaffMemberQuery } from "../../../../../../lib/queries/staff/useGetStaffMemberQuery";
import { StaffTabs } from "./StaffTabs";
import { Button } from "@repo/ui/components/ui/Button";
import { ArrowLeft } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useGetStaffComplianceQuery } from "../../../../../../lib/queries/staff/useComplianceQueries";
import { Text } from "@repo/ui/components/ui";
import { AddCertificateModal } from "../_modals/AddCertificateModal";

export function StaffProfileClient() {
  const router = useRouter();
  const { id: staffId } = useParams<{ id: string }>();
  const { data: staff, isLoading } = useGetStaffMemberQuery(staffId);

  // Prefetch compliance data to avoid individual loaders in tabs
  useGetStaffComplianceQuery(staffId);

  if (isLoading) {
    return (
      <div className="h-[500px] flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold">Staff member not found</h2>
        <Button onClick={() => router.push("/admin/staff")}>
          Return to Directory
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/staff")}
            className="text-muted-foreground hover:text-foreground p-0 h-auto"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Text>Back to Directory</Text>
        </div>

      </div>

      {/* Tabs Layout */}
      <Suspense
        fallback={
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        }
      >
        <StaffTabs staff={staff} />
      </Suspense>
      <AddCertificateModal />
    </div>
  );
} 
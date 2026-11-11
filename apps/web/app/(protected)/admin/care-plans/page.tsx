"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGetResidentsQuery } from "../../../../lib/queries/residents";
import { CarePlanDirectoryClient } from "./components/CarePlanDirectoryClient";

function CarePlansRedirectOrFallback() {
  const router = useRouter();
  const { data: residents = [], isLoading } = useGetResidentsQuery();

  useEffect(() => {
    if (!isLoading) {
      const firstResident = Array.isArray(residents) && residents.length > 0 ? residents[0] : null;
      const residentId = firstResident?.id || "7d14010b-7f9b-4329-af4e-4bd106412b82";
      router.replace(`/admin/residents/${residentId}?tab=careplan`);
    }
  }, [residents, isLoading, router]);

  return <CarePlanDirectoryClient />;
}

export default function CarePlansDirectoryPage() {
  return (
    <Suspense fallback={null}>
      <CarePlansRedirectOrFallback />
    </Suspense>
  );
}

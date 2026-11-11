import React from "react";
import { ResidentProfileClient } from "../../../admin/residents/[id]/components/ResidentProfileClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CarerResidentProfilePage({ params }: PageProps) {
  const { id } = await params;
  return <ResidentProfileClient residentId={id} />;
}

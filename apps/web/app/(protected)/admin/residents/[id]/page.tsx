import React from "react";
import { ResidentProfileClient } from "./components/ResidentProfileClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ResidentProfilePage({ params }: PageProps) {
  const { id } = await params;
  return <ResidentProfileClient residentId={id} />;
}

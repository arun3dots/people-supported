"use client";

import { JSX, use } from "react";
import CarePlanDetailPage from "../page";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CarePlanViewPageRoute({ params }: PageProps): JSX.Element {
  return <CarePlanDetailPage params={params} />;
}

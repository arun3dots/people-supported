import { IncidentReviewClient } from "../review/components";

interface IncidentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function IncidentDetailPage({ params }: IncidentDetailPageProps) {
  const { id } = await params;
  return <IncidentReviewClient incidentId={id} />;
}

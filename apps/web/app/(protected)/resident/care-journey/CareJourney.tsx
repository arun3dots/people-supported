"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button, Text } from "@repo/ui/components/ui";
import { useAuth } from "../../../../lib/context/AuthContext";
import { CareJourneyView, isJourneyView } from "./CareJourneyView";

export function CareJourney() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();
  const residentId = params.get("id") ?? "";
  const viewParam = params.get("view");
  const view = isJourneyView(viewParam) ? viewParam : "assessment";
  const roleBase = user?.roleName?.toLowerCase() === "admin" ? "admin" : "carer";

  if (!residentId) {
    return (
      <div className="space-y-3">
        <Text size="lg" weight="bold" className="text-slate-900">
          Choose a resident first
        </Text>
        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={() => router.push(`/${roleBase}/residents`)}
          className="rounded-xl font-semibold px-5 shadow-none"
        >
          Go to residents
        </Button>
      </div>
    );
  }

  return (
    <CareJourneyView
      residentId={residentId}
      view={view}
      onViewChange={(next) =>
        router.replace(`/${roleBase}/resident/care-journey?id=${residentId}&view=${next}`)
      }
    />
  );
}

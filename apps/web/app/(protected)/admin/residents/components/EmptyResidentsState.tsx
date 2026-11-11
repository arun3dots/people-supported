"use client";

import React from "react";
import Link from "next/link";
import { Button, Text } from "@repo/ui/components/ui";
import { Users, Plus } from "lucide-react";

export function EmptyResidentsState() {
  return (
    <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl bg-surface-card-grey font-sans">
      <Users className="size-12 mx-auto text-slate-300 mb-3" />
      <Text as="h3" size="base" weight="semibold">
        No residents found
      </Text>
      <Text size="sm" weight="regular" variant="muted" className="mt-1 max-w-sm mx-auto">
        Try adjusting your search or admit a new resident.
      </Text>
      <Link
        href="/admin/residents/admit"
        onClick={() => {
          if (typeof window !== "undefined") {
            window.sessionStorage.removeItem("lcm_admission_draft_new");
          }
        }}
      >
        <Button variant="primary" size="sm" className="mt-5 gap-1.5 font-semibold rounded-xl cursor-pointer">
          <Plus className="size-4" /> Admit Resident
        </Button>
      </Link>
    </div>
  );
}

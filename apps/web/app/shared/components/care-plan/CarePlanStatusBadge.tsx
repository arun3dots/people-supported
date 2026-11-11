"use client";

import React from "react";
import { Badge } from "@repo/ui/components/ui";

interface CarePlanStatusBadgeProps {
  status?: string;
  className?: string;
}

export function CarePlanStatusBadge({
  status = "Draft",
  className = "",
}: CarePlanStatusBadgeProps) {
  const normalized = status.toLowerCase().replace(/_/g, "");

  let state: "success" | "warning" | "info" | "danger" | "inactive" = "inactive";
  let label = status;

  switch (normalized) {
    case "active":
      state = "success";
      label = "Active";
      break;
    case "draft":
      state = "warning";
      label = "Draft";
      break;
    case "pendingprimaryapproval":
      state = "info";
      label = "Pending Primary";
      break;
    case "pendingsecondaryapproval":
      state = "info";
      label = "Pending Secondary";
      break;
    case "changesrequested":
      state = "warning";
      label = "Changes Requested";
      break;
    case "rejected":
      state = "danger";
      label = "Rejected";
      break;
    case "expired":
      state = "danger";
      label = "Expired";
      break;
    case "superseded":
      state = "inactive";
      label = "Superseded";
      break;
    default:
      state = "inactive";
      label = status;
  }

  return (
    <Badge
      variant="secondary"
      state={state}
      className={`text-md font-semibold shadow-none ${className}`}
    >
      {label}
    </Badge>
  );
}

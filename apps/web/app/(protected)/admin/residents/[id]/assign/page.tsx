"use client";

import React from "react";
import { useParams } from "next/navigation";
import { AssignResidentClient } from "./components/AssignResidentClient";

export default function AssignResidentPage() {
  const { id } = useParams<{ id: string }>();
  return <AssignResidentClient residentId={id} />;
}

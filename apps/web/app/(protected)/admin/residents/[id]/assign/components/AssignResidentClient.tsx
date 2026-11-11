"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  toast,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui";
import { useAssignBedMutation, useAssignCarerMutation, useSuggestCarersQuery } from "../../../../../../../lib/queries/residents";

interface AssignResidentClientProps {
  residentId: string;
}

interface CarerSuggestion {
  id: string;
  fullName: string;
  matchPercentage: number;
}

const AssignBedSchema = z.object({
  bedId: z.string().trim().min(1, "Please select a bed to allocate"),
});

export function AssignResidentClient({ residentId }: AssignResidentClientProps) {
  const router = useRouter();

  // Note: For a fully complete UI, we'd fetch Wings/Rooms/Beds to populate the assign-bed dropdown.
  // For demonstration, we'll keep the bed assignment simple or mock a few beds.
  const [beds] = useState([
    { id: "bed-1", label: "Room 101 - Bed A" },
    { id: "bed-2", label: "Room 101 - Bed B" },
  ]);
  const [selectedBed, setSelectedBed] = useState<string>("");
  const [bedError, setBedError] = useState<string | null>(null);

  const { data: carers = [], isLoading: loadingCarers } = useSuggestCarersQuery(residentId);
  const assignCarerMutation = useAssignCarerMutation();
  const assignBedMutation = useAssignBedMutation();

  const handleAssignCarer = (carerId: string) => {
    assignCarerMutation.mutate(
      { residentId, carerId },
      {
        onSuccess: () =>
          toast({
            title: "Success",
            description: "Carer assigned successfully",
          }),
        onError: () =>
          toast({
            title: "Error",
            description: "Failed to assign carer",
            variant: "destructive",
          }),
      }
    );
  };

  const handleAssignBed = () => {
    const result = AssignBedSchema.safeParse({ bedId: selectedBed });
    if (!result.success) {
      setBedError(result.error.issues[0]?.message || "Please select a bed to allocate");
      return;
    }
    setBedError(null);

    assignBedMutation.mutate(
      { residentId, bedId: selectedBed },
      {
        onSuccess: () =>
          toast({
            title: "Success",
            description: "Bed assigned successfully",
          }),
        onError: () =>
          toast({
            title: "Error",
            description: "Failed to assign bed",
            variant: "destructive",
          }),
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Assign Care & Accommodation</h1>
        <Button variant="outline" onClick={() => router.back()}>Back to Profile</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Suggested Carers</CardTitle>
            <CardDescription>Based on resident's required certifications</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCarers ? (
              <p>Loading...</p>
            ) : carers.length === 0 ? (
              <p>No active staff found.</p>
            ) : (
              <ul className="space-y-4">
                {(carers as CarerSuggestion[]).map((carer) => (
                  <li key={carer.id} className="flex justify-between items-center p-4 border rounded-lg shadow-sm">
                    <div>
                      <p className="font-semibold">{carer.fullName}</p>
                      <p className="text-md text-gray-500">
                        Match: <span className="font-bold text-primary">{carer.matchPercentage}%</span>
                      </p>
                    </div>
                    <Button size="sm" onClick={() => handleAssignCarer(carer.id)}>Assign</Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Allocate Bed</CardTitle>
            <CardDescription>Assign resident to a specific bed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-md font-medium">Select Bed</label>
              <Select
                onValueChange={(val) => {
                  setSelectedBed(val);
                  if (bedError) setBedError(null);
                }}
                value={selectedBed}
              >
                <SelectTrigger className={bedError ? "border-border-error" : ""}>
                  <SelectValue placeholder="Choose a bed..." />
                </SelectTrigger>
                <SelectContent>
                  {beds.map((bed) => (
                    <SelectItem key={bed.id} value={bed.id}>{bed.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {bedError && (
                <p className="text-sm text-text-error font-medium min-h-[18px] mt-1">
                  {bedError}
                </p>
              )}
            </div>
            <Button onClick={handleAssignBed} className="w-full">Confirm Bed Assignment</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

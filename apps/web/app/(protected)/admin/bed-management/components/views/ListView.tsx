"use client";

import { Bed } from "../../../../../../lib/types/facility";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/ui/Table";
import { Badge } from "@repo/ui/components/ui/Badge";
import { differenceInDays, parseISO } from "date-fns";
import { Edit2 } from "lucide-react";
import { Button } from "@repo/ui/components/ui/Button";
import { useState } from "react";
import { BedDialog } from "../../../configuration/facility/components/modals/BedDialog";
import { useUpdateBedMutationQuery } from "../../../../../../lib/queries/facility/useUpdateBedMutationQuery";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@repo/ui/components/ui";

interface ListViewProps {
  beds: Bed[];
}

export function ListView({ beds }: ListViewProps) {
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const queryClient = useQueryClient();

  const updateBedMutation = useUpdateBedMutationQuery({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beds"] });
      toast({ title: "Bed updated successfully", className: "bg-white text-slate-900 border-slate-200 shadow-md" });
      setSelectedBed(null);
    },
    onError: () => {
      toast({ title: "Failed to update bed", className: "bg-white text-slate-900 border-slate-200 shadow-md" });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-green-100 text-green-800 border-green-200";
      case "Occupied":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Maintenance":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const calculateStayDuration = (admissionDate?: string) => {
    if (!admissionDate) return "N/A";
    const days = differenceInDays(new Date(), parseISO(admissionDate));
    if (days === 0) return "Today";
    if (days === 1) return "1 day";
    return `${days} days`;
  };

  return (
    <>
      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bed Number</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Floor / Wing</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Resident</TableHead>
              <TableHead>Stay Duration</TableHead>
              <TableHead>Expected Discharge</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {beds.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No beds found matching the current filters.
                </TableCell>
              </TableRow>
            ) : (
              beds.map((bed) => (
                <TableRow key={bed.id} className="group">
                  <TableCell className="font-medium">
                    {bed.number || "Unassigned"}
                    {bed.code && <span className="block text-md text-muted-foreground">{bed.code}</span>}
                  </TableCell>
                  <TableCell>{bed.roomNumber}</TableCell>
                  <TableCell>{bed.wingName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(bed.status)}>
                      {bed.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {bed.status === "Occupied" ? (
                      <span className="font-medium text-foreground">{bed.residentName || "Unknown"}</span>
                    ) : (
                      <span className="text-muted-foreground italic">Empty</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {bed.status === "Occupied" ? calculateStayDuration(bed.residentAdmissionDate) : "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {bed.status === "Occupied" ? "N/A" : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setSelectedBed(bed)}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedBed && (
        <BedDialog
          isOpen={!!selectedBed}
          onOpenChange={(open) => !open && setSelectedBed(null)}
          onSubmit={(values) => {
            updateBedMutation.mutate({
              id: selectedBed.id,
              payload: values, // CreateBedDTO/UpdateBedDTO overlap; roomId is now persisted on update
            });
          }}
          initialData={selectedBed}
          title={`Manage Bed ${selectedBed.number || ""}`}
          isLoading={updateBedMutation.isPending}
        />
      )}
    </>
  );
}

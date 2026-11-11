"use client";

import { Bed } from "../../../../../../lib/types/facility";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/Card";
import { BedIcon, Activity, CheckCircle2, AlertTriangle } from "lucide-react";

interface SummaryDashboardProps {
  beds: Bed[];
  allBeds: Bed[]; // To show overall metrics ignoring filters
}

export function SummaryDashboard({ beds, allBeds }: SummaryDashboardProps) {
  const totalBeds = allBeds.length;
  const occupiedBeds = allBeds.filter((b) => b.status === "Occupied").length;
  const availableBeds = allBeds.filter((b) => b.status === "Available").length;
  const maintenanceBeds = allBeds.filter((b) => b.status === "Maintenance").length;

  const occupancyRate = totalBeds === 0 ? 0 : Math.round((occupiedBeds / totalBeds) * 100);

  // Group filtered beds by wing
  const wingsMap = beds.reduce((acc, bed) => {
    if (!acc[bed.wingName || "Unknown"]) {
      acc[bed.wingName || "Unknown"] = { total: 0, occupied: 0, available: 0, maintenance: 0 };
    }
    acc[bed.wingName || "Unknown"]!.total += 1;
    if (bed.status === "Occupied") acc[bed.wingName || "Unknown"]!.occupied += 1;
    if (bed.status === "Available") acc[bed.wingName || "Unknown"]!.available += 1;
    if (bed.status === "Maintenance") acc[bed.wingName || "Unknown"]!.maintenance += 1;
    return acc;
  }, {} as Record<string, { total: number; occupied: number; available: number; maintenance: number }>);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-md font-medium">Total Beds</CardTitle>
            <BedIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBeds}</div>
            <p className="text-md text-muted-foreground mt-1">Across all floors</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-md font-medium">Occupancy Rate</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupancyRate}%</div>
            <p className="text-md text-muted-foreground mt-1">{occupiedBeds} beds occupied</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-md font-medium">Available Beds</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableBeds}</div>
            <p className="text-md text-muted-foreground mt-1">Ready for admission</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-md font-medium">Under Maintenance</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maintenanceBeds}</div>
            <p className="text-md text-muted-foreground mt-1">Unavailable for use</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Floor & Wing Breakdown (Filtered)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(wingsMap).length === 0 ? (
                <p className="text-md text-muted-foreground">No data to display.</p>
              ) : (
                (Object.entries(wingsMap) as [string, { total: number; occupied: number; available: number; maintenance: number }][]).map(([wingName, stats]) => (
                  <div key={wingName} className="flex flex-col gap-2">
                    <div className="flex justify-between text-md font-medium">
                      <span>{wingName}</span>
                      <span>{stats.occupied} / {stats.total} Occupied</span>
                    </div>
                    <div className="h-3 w-full bg-secondary rounded-full overflow-hidden flex">
                      <div
                        className="bg-blue-500 h-full"
                        style={{ width: `${(stats.occupied / stats.total) * 100}%` }}
                        title={`Occupied: ${stats.occupied}`}
                      />
                      <div
                        className="bg-green-400 h-full"
                        style={{ width: `${(stats.available / stats.total) * 100}%` }}
                        title={`Available: ${stats.available}`}
                      />
                      <div
                        className="bg-orange-400 h-full"
                        style={{ width: `${(stats.maintenance / stats.total) * 100}%` }}
                        title={`Maintenance: ${stats.maintenance}`}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

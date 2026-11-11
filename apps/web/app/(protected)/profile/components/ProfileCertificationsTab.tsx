"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@repo/ui/components/ui/Card";
import { Badge } from "@repo/ui/components/ui/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/Table";
import {
  Award,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@repo/ui/lib/utils";
import { CertificationRecord } from "../../../../lib/queries/staff/useComplianceQueries";

const getStatusIcon = (status: string) => {
  switch (status) {
    case "Valid":
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    case "Expiring Soon":
      return <Clock className="w-4 h-4 text-yellow-500" />;
    case "Expired":
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    default:
      return null;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Valid":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Expiring Soon":
      return "bg-yellow-50 text-yellow-700 border-yellow-200 animate-pulse";
    case "Expired":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

interface ProfileCertificationsTabProps {
  certifications: CertificationRecord[];
  loading: boolean;
}

export function ProfileCertificationsTab({
  certifications,
  loading,
}: ProfileCertificationsTabProps) {
  return (
    <Card className="shadow-sm border-border">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" /> Training &amp; Certifications
        </CardTitle>
        <CardDescription className="mt-1.5">
          Your mandatory NHS / CQC training records. These are maintained by your
          administrator.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-3 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="font-semibold py-4 pl-6">
                    Training Module
                  </TableHead>
                  <TableHead className="font-semibold">Issue Date</TableHead>
                  <TableHead className="font-semibold">Expiry Date</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right pr-6">
                    Document
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certifications.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-12 text-muted-foreground italic"
                    >
                      No training records found.
                    </TableCell>
                  </TableRow>
                )}
                {certifications.map((cert) => (
                  <TableRow key={cert.id} className="hover:bg-gray-50/50">
                    <TableCell className="py-4 pl-6 font-medium text-foreground">
                      {cert.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-md">
                      {format(new Date(cert.issueDate), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell className="font-medium text-md">
                      {format(new Date(cert.expiryDate), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "px-2.5 py-1 gap-1.5",
                          getStatusBadge(cert.status),
                        )}
                      >
                        {getStatusIcon(cert.status)}
                        {cert.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      {cert.certificateUrl ? (
                        <a
                          href={cert.certificateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-md text-primary hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> View
                        </a>
                      ) : (
                        <span className="text-md text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

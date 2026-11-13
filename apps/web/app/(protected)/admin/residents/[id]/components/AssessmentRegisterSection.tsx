"use client";

import React from "react";
import { CheckCircle2, ClipboardList } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from "@repo/ui/components/ui";

export interface UnifiedAssessmentRow {
  id: string;
  title: string;
  category: "Risk" | "Health" | "Functional" | "Capacity" | "Nutrition";
  result: string;
  completedDate: string;
  assessor: string;
  nextDueDate: string;
  status: "In date" | "Due soon" | "Overdue";
}

export const DEFAULT_ASSESSMENT_ROWS: UnifiedAssessmentRow[] = [
  {
    id: "def-1",
    title: "Falls risk assessment",
    category: "Risk",
    result: "Low risk",
    completedDate: "12/08/2026",
    assessor: "Tom Reilly",
    nextDueDate: "12/02/2027",
    status: "In date",
  },
  {
    id: "def-2",
    title: "MUST nutrition screening",
    category: "Nutrition",
    result: "Score 0 — low risk",
    completedDate: "03/10/2026",
    assessor: "Sarah Jane (Nurse)",
    nextDueDate: "03/01/2027",
    status: "In date",
  },
  {
    id: "def-3",
    title: "Mental Capacity Assessment — finances",
    category: "Capacity",
    result: "Lacks capacity — best interests decision recorded",
    completedDate: "18/05/2026",
    assessor: "Ben Cannon",
    nextDueDate: "18/05/2027",
    status: "In date",
  },
  {
    id: "def-4",
    title: "Waterlow pressure area assessment",
    category: "Health",
    result: "Score 8 — not at risk",
    completedDate: "15/09/2026",
    assessor: "Sarah Jane (Nurse)",
    nextDueDate: "15/11/2026",
    status: "Due soon",
  },
  {
    id: "def-5",
    title: "Independent living skills (functional)",
    category: "Functional",
    result: "12 of 20 skills independent",
    completedDate: "01/07/2026",
    assessor: "Tom Reilly",
    nextDueDate: "01/01/2027",
    status: "In date",
  },
  {
    id: "def-6",
    title: "Behaviour & environmental risk",
    category: "Risk",
    result: "Medium — strategies in place",
    completedDate: "21/10/2026",
    assessor: "Hannah Clarke",
    nextDueDate: "21/01/2027",
    status: "In date",
  },
];

const CATEGORY_STATE_MAP: Record<
  UnifiedAssessmentRow["category"],
  "warning" | "inactive" | "success" | "info"
> = {
  Risk: "warning",
  Nutrition: "warning",
  Capacity: "inactive",
  Health: "success",
  Functional: "info",
};

interface AssessmentRegisterSectionProps {
  rows: UnifiedAssessmentRow[];
  onOpenRiskMatrix: () => void;
}

export function AssessmentRegisterSection({
  rows,
  onOpenRiskMatrix,
}: AssessmentRegisterSectionProps) {
  return (
    <Card variant="white" border="secondary" className="overflow-hidden p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-4">Assessment</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Result</TableHead>
            <TableHead>Completed</TableHead>
            <TableHead>Next due</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="px-4 text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const isDueOrOverdue = row.status !== "In date";
            const statusState =
              row.status === "Overdue"
                ? "danger"
                : row.status === "Due soon"
                  ? "warning"
                  : "success";

            return (
              <TableRow key={row.id}>
                <TableCell className="px-4">
                  <div className="flex items-center gap-2.5">
                    <ClipboardList className="size-4 text-slate-500 shrink-0" />
                    <Text size="md" weight="medium" className="text-slate-900">
                      {row.title}
                    </Text>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    state={CATEGORY_STATE_MAP[row.category]}
                    className="border"
                  >
                    {row.category}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Text size="md" weight="normal" className="text-slate-700">
                    {row.result}
                  </Text>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <Text size="md" weight="medium" className="text-slate-800">
                      {row.completedDate}
                    </Text>
                    <Text size="md" variant="muted">
                      {row.assessor}
                    </Text>
                  </div>
                </TableCell>
                <TableCell>
                  <Text
                    size="md"
                    weight="medium"
                    className={isDueOrOverdue ? "text-amber-700" : "text-slate-800"}
                  >
                    {row.nextDueDate}
                  </Text>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" state={statusState} className="border">
                    {row.status}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 text-right">
                  {isDueOrOverdue ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={onOpenRiskMatrix}
                      className="gap-1"
                    >
                      <CheckCircle2 className="size-3.5" />
                      Complete
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={onOpenRiskMatrix}>
                      View
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

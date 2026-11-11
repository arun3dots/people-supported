"use client";

import {
  CARE_AREAS,
  type AssessmentNeedDTO,
  type AssessmentNeedPatchDTO,
  type AssessmentAreaKey,
  type AssessmentToolResultDTO,
  type NeedCarePlanRecordDTO,
} from "@repo/schema";
import { Check, FileText, Plus } from "lucide-react";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import type { RiskAssessmentResponse } from "../../../../../lib/queries/risk";
import { buildAreaRiskChips, matchRiskToArea } from "./riskAreaMapping";
import { CustomNeedForm, CustomNeedRows } from "./CustomNeedsSection";
import {
  isRiskChipLinked,
  selectRiskAssessmentFinding,
  toggleRiskChipFinding,
  toggleSavedRiskAssessmentFinding,
} from "./assessmentNeedRiskActions";
import { FOUND_EXAMPLES } from "./NeedsTable.constants";

interface NeedsTableProps {
  needs: AssessmentNeedDTO[];
  tools?: AssessmentToolResultDTO[];
  riskAssessments?: RiskAssessmentResponse[];
  plans?: NeedCarePlanRecordDTO[];
  onChange: (areaKey: string, patch: AssessmentNeedPatchDTO) => void;
  onAddCustomNeed: (label: string) => void;
  onRemoveCustomNeed: (areaKey: string) => void;
  onOpenCarePlan: (areaKey: AssessmentAreaKey) => void;
}

const CHIP_TONE = {
  high: "bg-red-50 text-red-800 border-red-200 hover:bg-red-100",
  med: "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100",
  low: "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100",
  none: "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200",
} as const;

export function NeedsTable({
  needs,
  tools = [],
  riskAssessments = [],
  plans = [],
  onChange,
  onAddCustomNeed,
  onRemoveCustomNeed,
  onOpenCarePlan,
}: NeedsTableProps) {
  const chipsByArea = buildAreaRiskChips(riskAssessments, tools);
  const planByArea = new Map(plans.map((p) => [p.areaKey, p]));
  const activeAssessments = riskAssessments.filter((r) => r.status !== "Archived");

  return (
    <div className="space-y-3 font-sans">
      <CustomNeedForm count={needs.length} onAdd={onAddCustomNeed} />
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-56 text-sm font-bold text-slate-800">
                Area of need
              </TableHead>
              <TableHead className="min-w-[320px] text-sm font-bold text-slate-800">
                What the assessment found
                <span className="block text-sm font-normal text-slate-500">
                  Facts and findings from risk assessments
                </span>
              </TableHead>
              <TableHead className="w-56 text-sm font-bold text-slate-800">
                Becomes care plan
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {CARE_AREAS.map((area) => {
              const need = needs.find((n) => n.areaKey === area.key);
              if (!need) return null;
              const chips = chipsByArea[area.key] ?? [];
              const existingPlan = planByArea.get(area.key);

              const suggested = activeAssessments.filter(
                (r) => matchRiskToArea(r)?.areaKey === area.key,
              );
              const others = activeAssessments.filter(
                (r) => matchRiskToArea(r)?.areaKey !== area.key,
              );
              const selectedOthers = others.filter((ra) => {
                const score = ra.residualScore ?? ra.inherentScore;
                const level = ra.residualLevel ?? ra.inherentLevel;
                const toolPart = ra.tool ? ` (${ra.tool})` : "";
                const valuePart = [
                  score !== null ? `Score ${score}` : null,
                  level,
                ]
                  .filter(Boolean)
                  .join(" · ");
                const segment = `${ra.title}${toolPart}: ${valuePart}`;
                return (need.found ?? "")
                  .toLowerCase()
                  .includes(segment.toLowerCase());
              });

              return (
                <TableRow key={area.key} className="align-top">
                  <TableCell className="py-3.5">
                    <Text size="md" weight="bold" className="text-slate-800">
                      {area.label}
                    </Text>
                    <Text size="sm" className="text-slate-600">
                      {area.source}
                    </Text>
                  </TableCell>

                  <TableCell className="py-3.5">
                    <div className="space-y-2">
                      {activeAssessments.length > 0 && (
                        <Select
                          value=""
                          onValueChange={(riskId) => {
                            const selected = activeAssessments.find(
                              (risk) => risk.id === riskId,
                            );
                            const selectedNeed = needs.find(
                              (item) => item.areaKey === area.key,
                            );
                            if (!selected || !selectedNeed) return;
                            const patch = selectRiskAssessmentFinding(
                              selectedNeed,
                              selected,
                            );
                            if (patch) onChange(area.key, patch);
                          }}
                        >
                          <SelectTrigger
                            aria-label={`Select saved risk assessment for ${area.label}`}
                            className="h-8 text-sm text-slate-700 bg-slate-50 hover:bg-slate-100 border-slate-200 rounded-lg shadow-none font-medium flex items-center justify-between"
                          >
                            <SelectValue placeholder="▾ Select saved risk assessment..." />
                          </SelectTrigger>
                          <SelectContent>
                            {suggested.length > 0 && (
                              <SelectGroup>
                                <SelectLabel className="text-sm font-bold text-emerald-800">
                                  Suggested for {area.label}
                                </SelectLabel>
                                {suggested.map((ra) => {
                                  const score = ra.residualScore ?? ra.inherentScore;
                                  const level = ra.residualLevel ?? ra.inherentLevel;
                                  return (
                                    <SelectItem
                                      key={ra.id}
                                      value={ra.id}
                                      className="text-sm cursor-pointer"
                                    >
                                      {ra.title} {ra.tool ? `(${ra.tool})` : ""} · Score {score} ({level})
                                    </SelectItem>
                                  );
                                })}
                              </SelectGroup>
                            )}
                            {others.length > 0 && (
                              <SelectGroup>
                                <SelectLabel className="text-sm font-bold text-slate-500">
                                  All saved risk assessments
                                </SelectLabel>
                                {others.map((ra) => {
                                  const score = ra.residualScore ?? ra.inherentScore;
                                  const level = ra.residualLevel ?? ra.inherentLevel;
                                  return (
                                    <SelectItem
                                      key={ra.id}
                                      value={ra.id}
                                      className="text-sm cursor-pointer"
                                    >
                                      {ra.title} {ra.tool ? `(${ra.tool})` : ""} · Score {score} ({level})
                                    </SelectItem>
                                  );
                                })}
                              </SelectGroup>
                            )}
                          </SelectContent>
                        </Select>
                      )}

                      <Input
                        aria-label={`${area.label} finding`}
                        placeholder={`e.g. ${FOUND_EXAMPLES[area.key]}`}
                        value={need.found ?? ""}
                        onChange={(e) => onChange(area.key, { found: e.target.value })}
                      />

                      {chips.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {chips.map((chip) => {
                            const linked = isRiskChipLinked(need, chip);
                            return (
                              <Button
                                key={chip.id}
                                type="button"
                                variant="ghost"
                                size="sm"
                                aria-pressed={linked}
                                onClick={() =>
                                  onChange(
                                    area.key,
                                    toggleRiskChipFinding(need, chip),
                                  )
                                }
                                className={cn(
                                  "h-auto min-h-0 rounded-full border px-2.5 py-1 text-sm font-medium",
                                  linked
                                    ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                                    : CHIP_TONE[chip.rating],
                                )}
                              >
                                {linked ? (
                                  <Check className="size-3.5 shrink-0" />
                                ) : (
                                  <Plus className="size-3.5 shrink-0" />
                                )}
                                {chip.label}
                              </Button>
                            );
                          })}
                        </div>
                      )}

                      {selectedOthers.length > 0 && (
                        <div className="space-y-1.5">
                          <Text size="sm" weight="medium" className="text-slate-600">
                            Selected saved risk assessments
                          </Text>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {selectedOthers.map((ra) => {
                              const score = ra.residualScore ?? ra.inherentScore;
                              const level = ra.residualLevel ?? ra.inherentLevel;
                              const toolPart = ra.tool ? ` (${ra.tool})` : "";
                              const valuePart = [
                                score !== null ? `Score ${score}` : null,
                                level,
                              ]
                                .filter(Boolean)
                                .join(" · ");

                              return (
                              <Button
                                  key={ra.id}
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  aria-pressed
                                  onClick={() =>
                                    onChange(
                                      area.key,
                                      toggleSavedRiskAssessmentFinding(
                                        need,
                                        ra,
                                      ),
                                    )
                                  }
                                  className={cn(
                                    "h-auto min-h-0 rounded-full border px-2.5 py-1 text-sm font-medium bg-emerald-50 text-emerald-900 border-emerald-300",
                                  )}
                                >
                                  <Check className="size-3.5 shrink-0" />
                                  {ra.title}
                                  {ra.tool ? ` (${ra.tool})` : ""}
                                  {valuePart ? ` · ${valuePart}` : ""}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="py-3.5">
                    {existingPlan ? (
                      <div className="space-y-1">
                        <Button
                          type="button"
                          variant="link"
                          onClick={() => onOpenCarePlan(area.key)}
                          className="h-auto justify-start whitespace-normal p-0 text-left text-md font-semibold text-emerald-800 underline underline-offset-4 hover:text-emerald-950"
                        >
                          <FileText className="size-4 shrink-0" />
                          {existingPlan.area}
                        </Button>
                        <Text size="sm" className="text-slate-600">
                          {existingPlan.status} · {existingPlan.taskCount} task
                          {existingPlan.taskCount === 1 ? "" : "s"}
                        </Text>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenCarePlan(area.key)}
                        className="rounded-xl text-sm font-semibold shadow-none cursor-pointer"
                      >
                        <Plus className="size-4" />
                        Add care plan
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            <CustomNeedRows
              needs={needs}
              plans={plans}
              onChange={onChange}
              onRemove={onRemoveCustomNeed}
              onOpenCarePlan={onOpenCarePlan}
            />
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

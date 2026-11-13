"use client";

import type { ReactNode } from "react";
import {
  ASSESSMENT_RISK_OPTIONS,
  type AssessmentNeedPatchDTO,
  type CareAreaKey,
} from "@repo/schema";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  ClipboardList,
  Droplet,
  FileText,
  HeartHandshake,
  Moon,
  PersonStanding,
  Pill,
  Plus,
  Scale,
  ShieldCheck,
  Trash2,
  Users,
  Utensils,
} from "lucide-react";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
  Textarea,
} from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import type { TrackedNeedCardData } from "./trackedRiskNeeds.utils";

const AREA_ICONS: Record<CareAreaKey, ReactNode> = {
  mobility: <PersonStanding className="size-5" />,
  skin: <ShieldCheck className="size-5" />,
  nutrition: <Utensils className="size-5" />,
  continence: <Droplet className="size-5" />,
  personalCare: <HeartHandshake className="size-5" />,
  medicines: <Pill className="size-5" />,
  cognition: <Brain className="size-5" />,
  sleep: <Moon className="size-5" />,
  social: <Users className="size-5" />,
  capacity: <Scale className="size-5" />,
};

interface TrackedRiskAssessmentCardsProps {
  cards: TrackedNeedCardData[];
  onChangeCard: (
    card: TrackedNeedCardData,
    patch: AssessmentNeedPatchDTO,
  ) => void;
  onOpenCarePlan: (card: TrackedNeedCardData) => void;
  onGoToRiskStep?: () => void;
  onAddCustomNeed?: () => void;
  onRemoveCard?: (card: TrackedNeedCardData) => void;
  addDisabled?: boolean;
}

export function TrackedRiskAssessmentCards({
  cards,
  onChangeCard,
  onOpenCarePlan,
  onGoToRiskStep,
  onAddCustomNeed,
  onRemoveCard,
  addDisabled = false,
}: TrackedRiskAssessmentCardsProps) {
  return (
    <div className="space-y-4 font-sans">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-4">
        <div className="size-10 rounded-full bg-surface-primary-light border border-primary/20 flex items-center justify-center text-primary shrink-0">
          <ClipboardList className="size-5" />
        </div>
        <div className="space-y-0.5">
          <Text as="h3" size="md" weight="bold" className="text-slate-900">
            Support Needs Assessment
          </Text>
          <Text size="md" className="text-slate-600">
            Review the assessment findings and create a support plan for each area of need.
          </Text>
        </div>
        </div>
        {onAddCustomNeed && (
          <Button
            type="button"
            variant="outline"
            disabled={addDisabled}
            onClick={onAddCustomNeed}
            className="rounded-full font-semibold shadow-none cursor-pointer gap-2 bg-white"
          >
            <Plus className="size-4" />
            <span>Add custom support need</span>
          </Button>
        )}
      </div>

      {cards.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-3 shadow-xs">
          <Text size="md" weight="semibold" className="text-slate-900">
            No risks have been tracked in Step 5 yet
          </Text>
          <Text size="md" className="text-slate-600">
            Record risk assessments in the previous Risk step to review findings and create support plans for each tracked area of need.
          </Text>
          {onGoToRiskStep && (
            <div className="pt-1">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={onGoToRiskStep}
                className="rounded-xl font-semibold shadow-none cursor-pointer"
              >
                Go to Risk Step
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {cards.map((card) => {
            const icon = !card.areaKey.startsWith("custom:")
              ? (AREA_ICONS[card.areaKey as CareAreaKey] ?? (
                  <ClipboardList className="size-5" />
                ))
              : <ClipboardList className="size-5" />;

            const isNoRisk = card.selectedRisk === "No associated risk";
            const hasActiveRisk = Boolean(card.selectedRisk) && !isNoRisk;
            const selectTone = isNoRisk
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/70"
              : hasActiveRisk
                ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100/70"
                : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/70";

            return (
              <div
                key={card.areaKey}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col justify-between gap-3 shadow-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-9 rounded-full bg-surface-primary-light border border-primary/20 flex items-center justify-center text-primary shrink-0">
                      {icon}
                    </div>
                    <Text
                      as="h4"
                      size="md"
                      weight="bold"
                      className="text-slate-900 leading-snug"
                    >
                      {card.label}
                    </Text>
                  </div>

                  <div className="flex items-center gap-2">
                  {card.isManual && onRemoveCard && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove custom need ${card.label}`}
                      disabled={Boolean(card.existingPlan)}
                      onClick={() => onRemoveCard(card)}
                      className="size-8 shrink-0 text-slate-500 hover:text-red-700 cursor-pointer"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                  <Select
                    value={card.selectedRisk || undefined}
                    onValueChange={(val) =>
                      onChangeCard(card, {
                        associatedRisk: val,
                        toolKey: card.toolKey,
                        source: card.need?.source ?? card.source,
                      })
                    }
                  >
                    <SelectTrigger
                      aria-label={`Associated risk for ${card.label}`}
                      className={cn(
                        "w-auto h-8 shrink-0 rounded-full px-3 py-0 text-md font-semibold shadow-none border gap-2 cursor-pointer",
                        selectTone,
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        {hasActiveRisk && (
                          <AlertTriangle className="size-4 text-red-600 shrink-0" />
                        )}
                        {isNoRisk && (
                          <CheckCircle2 className="size-4 text-emerald-700 shrink-0" />
                        )}
                        <SelectValue placeholder="Select Risk" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {ASSESSMENT_RISK_OPTIONS.map((opt) => (
                        <SelectItem
                          key={opt}
                          value={opt}
                          className="text-md cursor-pointer"
                        >
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Text size="md" weight="bold" className="text-slate-800">
                    What the assessment found
                  </Text>
                  <Textarea
                    aria-label={`${card.label} finding`}
                    rows={2}
                    value={card.displayedFound}
                    placeholder="Record assessment findings..."
                    onChange={(e) =>
                      onChangeCard(card, {
                        found: e.target.value,
                        associatedRisk: card.selectedRisk || null,
                        toolKey: card.toolKey,
                        source: card.need?.source ?? card.source,
                      })
                    }
                    className="bg-slate-50 border-slate-200/80 rounded-xl px-3 py-2 text-md text-slate-800 placeholder:text-slate-400 resize-none focus-visible:bg-white shadow-none"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  {card.existingPlan ? (
                    <>
                      <Text size="md" className="text-slate-600">
                        {card.existingPlan.status} · {card.existingPlan.taskCount}{" "}
                        {card.existingPlan.taskCount === 1 ? "task" : "tasks"}
                      </Text>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenCarePlan(card)}
                        className="ml-auto rounded-full font-semibold shadow-none cursor-pointer gap-2"
                      >
                        <FileText className="size-4" />
                        <span>{card.existingPlan.area}</span>
                        <ArrowRight className="size-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => onOpenCarePlan(card)}
                      className="ml-auto rounded-full font-semibold shadow-none cursor-pointer gap-2"
                    >
                      {/* <Plus className="size-4" /> */}
                      <span>Create Support Plan</span>
                      <ArrowRight className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

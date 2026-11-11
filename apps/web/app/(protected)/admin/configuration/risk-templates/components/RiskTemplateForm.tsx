"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  Text,
} from "@repo/ui/components/ui";
import { ShieldAlert } from "lucide-react";
import {
  type CreateRiskTemplateDTO,
  type RiskCategory,
} from "@repo/schema";
import {
  useCreateRiskTemplateMutation,
  useUpdateRiskTemplateMutation,
  type RiskTemplateResponse,
} from "../../../../../../lib/queries/risk";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: RiskTemplateResponse | null;
  isDuplicate?: boolean;
}

interface RiskTemplateFormState {
  name: string;
  category: RiskCategory | "";
  hazardDescription: string;
  tool: string;
  defaultLikelihood: number | null;
  defaultSeverity: number | null;
  defaultControls: string[];
  isActive: boolean;
}

const CATEGORIES: RiskCategory[] = [
  "Clinical",
  "Environmental",
  "Behavioral",
  "Building",
  "Individual",
];

export function RiskTemplateForm({
  open,
  onOpenChange,
  initial,
  isDuplicate = false,
}: Props) {
  const create = useCreateRiskTemplateMutation();
  const update = useUpdateRiskTemplateMutation();

  const [state, setState] = useState<RiskTemplateFormState>({
    name: "",
    category: "",
    hazardDescription: "",
    tool: "",
    defaultLikelihood: null,
    defaultSeverity: null,
    defaultControls: [],
    isActive: true,
  });
  const [controlsText, setControlsText] = useState("");

  useEffect(() => {
    if (initial) {
      setState({
        name: isDuplicate ? `${initial.name} (Custom)` : initial.name,
        category: initial.category,
        hazardDescription: initial.hazardDescription,
        tool: initial.tool ?? "",
        defaultLikelihood: initial.defaultLikelihood,
        defaultSeverity: initial.defaultSeverity,
        defaultControls: initial.defaultControls ?? [],
        isActive: initial.isActive,
      });
      setControlsText((initial.defaultControls ?? []).join("\n"));
    } else if (open) {
      setState({
        name: "",
        category: "",
        hazardDescription: "",
        tool: "",
        defaultLikelihood: null,
        defaultSeverity: null,
        defaultControls: [],
        isActive: true,
      });
      setControlsText("");
    }
  }, [initial, isDuplicate, open]);

  const isEditMode = !isDuplicate && !!initial;

  const handleSubmit = () => {
    if (
      !state.category ||
      state.defaultLikelihood === null ||
      state.defaultSeverity === null
    ) {
      return;
    }

    const defaultControls = controlsText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const dto: CreateRiskTemplateDTO = {
      ...state,
      category: state.category,
      defaultLikelihood: state.defaultLikelihood,
      defaultSeverity: state.defaultSeverity,
      tool: state.tool ? state.tool : undefined,
      defaultControls,
    };

    if (isEditMode && initial) {
      update.mutate(
        { id: initial.id, dto },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      create.mutate(dto, { onSuccess: () => onOpenChange(false) });
    }
  };

  const isPending = create.isPending || update.isPending;
  const isValid =
    state.name.trim().length >= 2 &&
    state.category !== "" &&
    state.hazardDescription.trim().length >= 5 &&
    state.defaultLikelihood !== null &&
    state.defaultSeverity !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl" className="max-h-[85vh] overflow-y-auto font-sans">
        <DialogHeader className="pb-4 border-b border-slate-100">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <ShieldAlert className="size-5 text-emerald-800" />
            <span>
              {isEditMode
                ? "Edit Risk Template"
                : isDuplicate
                  ? "Customise Risk Template"
                  : "New Risk Template"}
            </span>
          </DialogTitle>
          <DialogDescription className="text-md text-slate-500">
            Configure hazard description, scoring, and standardised controls for this template.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Name & Category */}
          <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="t-name" required>
                Template Name
              </Label>
              <Input
                id="t-name"
                placeholder="e.g. Falls & Mobility Assessment"
                value={state.name}
                onChange={(e) =>
                  setState((s) => ({ ...s, name: e.target.value }))
                }
                className="rounded-xl border-slate-200 text-md h-10 focus-visible:ring-emerald-800"
              />
            </div>

            <div className="space-y-1.5">
              <Label required>
                Category
              </Label>
              <Select
                value={state.category}
                onValueChange={(v) =>
                  setState((s) => ({ ...s, category: v as RiskCategory }))
                }
              >
                <SelectTrigger className="w-full h-10 bg-white border-slate-200 rounded-xl text-md font-regular text-slate-800 shadow-none">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="text-md">
                      {c === "Behavioral" ? "Behavioural" : c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Hazard description */}
          <div className="space-y-1.5">
            <Label htmlFor="t-hazard" required>
              Hazard / Risk Description
            </Label>
            <Textarea
              id="t-hazard"
              rows={3}
              placeholder="Describe the clinical or environmental hazard..."
              value={state.hazardDescription}
              onChange={(e) =>
                setState((s) => ({ ...s, hazardDescription: e.target.value }))
              }
              className="rounded-xl border-slate-200 text-md focus-visible:ring-emerald-800 p-3"
            />
          </div>

          {/* Tool, Likelihood, Severity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1">
            <div className="space-y-1.5">
              <Label
                htmlFor="t-tool"
                className="flex min-h-6 items-center whitespace-nowrap text-md font-medium text-slate-700"
              >
                <span>Assessment Tool</span>
                <span className="ml-2 text-sm font-normal text-slate-400">(Optional)</span>
              </Label>
              <Input
                id="t-tool"
                placeholder="e.g. Waterlow / Morse"
                value={state.tool ?? ""}
                onChange={(e) => setState((s) => ({ ...s, tool: e.target.value }))}
                className="h-10 rounded-xl border-slate-200 text-sm focus-visible:ring-emerald-800"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="t-l"
                className="flex min-h-6 items-center whitespace-nowrap text-md font-medium text-slate-700"
              >
                Likelihood (1–5)
              </Label>
              <Input
                id="t-l"
                type="number"
                min={1}
                max={5}
                placeholder="1–5"
                value={state.defaultLikelihood ?? ""}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    defaultLikelihood: e.target.value === ""
                      ? null
                      : Math.min(5, Math.max(1, Number(e.target.value))),
                  }))
                }
                className="rounded-xl border-slate-200 text-md h-10 focus-visible:ring-emerald-800"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="t-s"
                className="flex min-h-6 items-center whitespace-nowrap text-md font-medium text-slate-700"
              >
                Severity (1–5)
              </Label>
              <Input
                id="t-s"
                type="number"
                min={1}
                max={5}
                placeholder="1–5"
                value={state.defaultSeverity ?? ""}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    defaultSeverity: e.target.value === ""
                      ? null
                      : Math.min(5, Math.max(1, Number(e.target.value))),
                  }))
                }
                className="rounded-xl border-slate-200 text-md h-10 focus-visible:ring-emerald-800"
              />
            </div>
          </div>

          {/* Default controls */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="t-controls">
                Default Controls
              </Label>
              <Text size="sm" weight="regular" className="text-slate-400">
                One item per line
              </Text>
            </div>
            <Textarea
              id="t-controls"
              rows={4}
              placeholder="Enter recommended mitigation measures, one per line..."
              value={controlsText}
              onChange={(e) => setControlsText(e.target.value)}
              className="rounded-xl border-slate-200 text-md focus-visible:ring-emerald-800 p-3"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-md font-regular"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            disabled={!isValid || isPending}
            className="rounded-xl text-md font-semibold"
          >
            {isPending
              ? "Saving…"
              : isEditMode
                ? "Save Changes"
                : isDuplicate
                  ? "Create Custom Template"
                  : "Create Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

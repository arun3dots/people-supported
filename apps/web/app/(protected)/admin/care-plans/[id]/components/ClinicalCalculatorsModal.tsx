"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Label,
  Input,
  Badge,
  Text,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui";
import {
  calculateMustScore,
  IDDSIFoodLevel,
  IDDSIFluidLevel,
} from "@repo/schema";
import { Activity, Apple, ShieldAlert, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { WaterlowCalculatorTab } from "./WaterlowCalculatorTab";

interface ClinicalCalculatorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  residentName: string;
}

export function ClinicalCalculatorsModal({
  isOpen,
  onClose,
  residentName,
}: ClinicalCalculatorsModalProps) {
  const [activeTab, setActiveTab] = useState<"must" | "waterlow">("must");

  // --- MUST Calculator State ---
  const [heightCm, setHeightCm] = useState(165);
  const [weightKg, setWeightKg] = useState(62);
  const [weightLossPercent, setWeightLossPercent] = useState(0);
  const [acuteDisease, setAcuteDisease] = useState(false);
  const [foodTexture, setFoodTexture] = useState<IDDSIFoodLevel>("Regular_Level7");
  const [fluidLevel, setFluidLevel] = useState<IDDSIFluidLevel>("Thin_Level0");

  const mustResult = calculateMustScore(heightCm, weightKg, weightLossPercent, acuteDisease);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto font-['Outfit',sans-serif]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Activity className="size-5 text-emerald-800" />
            NHS &amp; NICE Clinical Screening Calculators
          </DialogTitle>
          <Text size="md" variant="muted">
            Validated assessment tools for {residentName} (CQC Reg 12 Safe Care)
          </Text>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "must" | "waterlow")}
          className="space-y-4 pt-2"
        >
          <TabsList className="grid grid-cols-2 w-full bg-slate-100 p-1 rounded-xl">
            <TabsTrigger value="must" className="text-md font-semibold gap-1.5 rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900">
              <Apple className="size-3.5 text-emerald-800" /> BAPEN MUST (Nutrition)
            </TabsTrigger>
            <TabsTrigger value="waterlow" className="text-md font-semibold gap-1.5 rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900">
              <ShieldAlert className="size-3.5 text-rose-600" /> Waterlow (Pressure Ulcers)
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: BAPEN MUST NUTRITION CALCULATOR */}
          <TabsContent value="must" className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-md">
              <div className="space-y-1">
                <Label>Height (cm)</Label>
                <Input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="text-md"
                />
              </div>

              <div className="space-y-1">
                <Label>Weight (kg)</Label>
                <Input
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="text-md"
                />
              </div>

              <div className="space-y-1">
                <Label>Unplanned Weight Loss (%)</Label>
                <Select
                  value={String(weightLossPercent)}
                  onValueChange={(val) => setWeightLossPercent(Number(val))}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">&lt; 5% weight loss (Score 0)</SelectItem>
                    <SelectItem value="5">5% - 10% weight loss (Score 1)</SelectItem>
                    <SelectItem value="10">&gt; 10% weight loss (Score 2)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Acute Disease Effect */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <label className="flex items-center gap-2 text-md font-medium text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acuteDisease}
                  onChange={(e) => setAcuteDisease(e.target.checked)}
                  className="rounded text-emerald-800 size-4"
                />
                <span>Acute Disease Effect (+2 Score)</span>
              </label>
              <p className="text-md text-slate-500 pl-6">
                Check if the resident is acutely ill and there has been or is likely to be no nutritional intake for &gt; 5 days.
              </p>
            </div>

            {/* IDDSI Food & Fluid Textures */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-md pt-1">
              <div>
                <Label>IDDSI Food Consistency</Label>
                <Select
                  value={foodTexture}
                  onValueChange={(val) => setFoodTexture(val as IDDSIFoodLevel)}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Regular_Level7">Level 7 - Regular / Normal Diet</SelectItem>
                    <SelectItem value="SoftAndBiteSized_Level6">Level 6 - Soft &amp; Bite-Sized</SelectItem>
                    <SelectItem value="MincedAndMoist_Level5">Level 5 - Minced &amp; Moist</SelectItem>
                    <SelectItem value="Pureed_Level4">Level 4 - Pureed</SelectItem>
                    <SelectItem value="Liquidised_Level3">Level 3 - Liquidised</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>IDDSI Drink Consistency</Label>
                <Select
                  value={fluidLevel}
                  onValueChange={(val) => setFluidLevel(val as IDDSIFluidLevel)}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Thin_Level0">Level 0 - Thin (Standard drinks)</SelectItem>
                    <SelectItem value="SlightlyThick_Level1">Level 1 - Slightly Thick</SelectItem>
                    <SelectItem value="MildlyThick_Level2">Level 2 - Mildly Thick</SelectItem>
                    <SelectItem value="ModeratelyThick_Level3">Level 3 - Moderately Thick</SelectItem>
                    <SelectItem value="ExtremelyThick_Level4">Level 4 - Extremely Thick</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* MUST Result & Guidance Banner */}
            <div
              className={`p-3.5 rounded-2xl border text-md space-y-1.5 ${mustResult.riskCategory === "High"
                ? "bg-rose-50 border-rose-200 text-rose-900"
                : mustResult.riskCategory === "Medium"
                  ? "bg-amber-50 border-amber-200 text-amber-900"
                  : "bg-emerald-50 border-emerald-200 text-emerald-900"
                }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-md">
                  MUST Total Score: {mustResult.totalScore}
                </span>
                <Badge
                  variant="secondary"
                  state={mustResult.riskCategory === "High" ? "danger" : mustResult.riskCategory === "Medium" ? "warning" : "success"}
                  className="font-semibold text-md"
                >
                  {mustResult.riskCategory} Malnutrition Risk
                </Badge>
              </div>
              <p className="text-md">
                {mustResult.riskCategory === "High"
                  ? "Action Required: Refer to Dietitian / GP. Initiate daily food intake charting and fluid balance monitoring. Consider fortified meals and prescribed supplements."
                  : mustResult.riskCategory === "Medium"
                    ? "Action Required: Monitor food & fluid intake for 3 days. Re-weigh weekly and re-screen monthly."
                    : "Action Required: Low Risk. Repeat screening monthly for people receiving supported living support."}
              </p>
            </div>
          </TabsContent>

          {/* TAB 2: WATERLOW PRESSURE ULCER CALCULATOR */}
          <TabsContent value="waterlow" className="space-y-3">
            <WaterlowCalculatorTab />
          </TabsContent>
        </Tabs>

        <DialogFooter className="pt-2">
          <Button size="sm" onClick={onClose} className="bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-semibold">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

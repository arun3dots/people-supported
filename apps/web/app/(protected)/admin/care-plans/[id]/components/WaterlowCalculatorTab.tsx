"use client";

import { useState } from "react";
import {
  Label,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui";

export function WaterlowCalculatorTab() {
  const [buildScore, setBuildScore] = useState(0);
  const [skinType, setSkinType] = useState("0:healthy");
  const [skinScore, setSkinScore] = useState(0);
  const [sexAgeScore, setSexAgeScore] = useState(3); // e.g. 65-74
  const [continenceScore, setContinenceScore] = useState(0);
  const [mobilityScore, setMobilityScore] = useState(0);
  const [tissueMalnutrition, setTissueMalnutrition] = useState(0);
  const [neuroDeficit, setNeuroDeficit] = useState(0);

  const waterlowTotal =
    buildScore +
    skinScore +
    sexAgeScore +
    continenceScore +
    mobilityScore +
    tissueMalnutrition +
    neuroDeficit;

  const handleSkinChange = (val: string) => {
    setSkinType(val);
    setSkinScore(Number(val.split(":")[0]));
  };

  return (
    <div className="space-y-3 font-['Outfit',sans-serif]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-md">
        <div>
          <Label>Build / Weight for Height</Label>
          <Select
            value={String(buildScore)}
            onValueChange={(val) => setBuildScore(Number(val))}
          >
            <SelectTrigger className="w-full mt-1">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Average (BMI 20-24.9) (0)</SelectItem>
              <SelectItem value="1">Above Average (BMI 25-29.9) (1)</SelectItem>
              <SelectItem value="2">Obese (BMI 30+) (2)</SelectItem>
              <SelectItem value="3">Below Average (BMI &lt; 20) (3)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Skin Type / Vulnerability</Label>
          <Select
            value={skinType}
            onValueChange={handleSkinChange}
          >
            <SelectTrigger className="w-full mt-1">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0:healthy">Healthy (0)</SelectItem>
              <SelectItem value="1:thin">Tissue Paper / Very Thin (1)</SelectItem>
              <SelectItem value="1:dry">Dry / Dehydrated (1)</SelectItem>
              <SelectItem value="1:oedematous">Oedematous (1)</SelectItem>
              <SelectItem value="2:discoloured">Discoloured / Non-blanching Grade 1 (2)</SelectItem>
              <SelectItem value="3:broken">Broken Skin / Grade 2-4 Cavity (3)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Sex &amp; Age Category</Label>
          <Select
            value={String(sexAgeScore)}
            onValueChange={(val) => setSexAgeScore(Number(val))}
          >
            <SelectTrigger className="w-full mt-1">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Male 14-49 (1)</SelectItem>
              <SelectItem value="2">Female 14-49 / 50-64 (2)</SelectItem>
              <SelectItem value="3">65-74 Years (3)</SelectItem>
              <SelectItem value="4">75-80 Years (4)</SelectItem>
              <SelectItem value="5">81+ Years (5)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Continence</Label>
          <Select
            value={String(continenceScore)}
            onValueChange={(val) => setContinenceScore(Number(val))}
          >
            <SelectTrigger className="w-full mt-1">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Complete / Catheterised (0)</SelectItem>
              <SelectItem value="1">Occasional Incontinence (1)</SelectItem>
              <SelectItem value="2">Catheterised / Incontinent of Faeces (2)</SelectItem>
              <SelectItem value="3">Doubly Incontinent (3)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Mobility</Label>
          <Select
            value={String(mobilityScore)}
            onValueChange={(val) => setMobilityScore(Number(val))}
          >
            <SelectTrigger className="w-full mt-1">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Fully Mobile (0)</SelectItem>
              <SelectItem value="1">Restless / Fidgety (1)</SelectItem>
              <SelectItem value="2">Apathetic (2)</SelectItem>
              <SelectItem value="3">Restricted Mobility (3)</SelectItem>
              <SelectItem value="4">Bedbound / Traction (4)</SelectItem>
              <SelectItem value="5">Chairbound (5)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Special Risks</Label>
          <div className="space-y-1.5 mt-1">
            <label className="flex items-center gap-1.5 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={tissueMalnutrition > 0}
                onChange={(e) => setTissueMalnutrition(e.target.checked ? 5 : 0)}
                className="rounded text-emerald-800"
              />
              <span>Tissue Malnutrition (Cardiac/Vascular/Smoking)</span>
            </label>
            <label className="flex items-center gap-1.5 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={neuroDeficit > 0}
                onChange={(e) => setNeuroDeficit(e.target.checked ? 4 : 0)}
                className="rounded text-emerald-800"
              />
              <span>Neurological Deficit (Diabetes/MS/CVA/Paralysis)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Waterlow Result Banner */}
      <div
        className={`p-3.5 rounded-2xl border text-md space-y-1.5 ${waterlowTotal >= 20
          ? "bg-purple-50 border-purple-200 text-purple-900"
          : waterlowTotal >= 15
            ? "bg-rose-50 border-rose-200 text-rose-900"
            : waterlowTotal >= 10
              ? "bg-amber-50 border-amber-200 text-amber-900"
              : "bg-emerald-50 border-emerald-200 text-emerald-900"
          }`}
      >
        <div className="flex items-center justify-between">
          <span className="font-bold text-md">
            Waterlow Total Score: {waterlowTotal}
          </span>
          <Badge
            variant="secondary"
            state={waterlowTotal >= 15 ? "danger" : waterlowTotal >= 10 ? "warning" : "success"}
            className="text-sm font-semibold"
          >
            {waterlowTotal >= 20
              ? "Very High Risk (20+)"
              : waterlowTotal >= 15
                ? "High Risk (15-19)"
                : waterlowTotal >= 10
                  ? "At Risk (10-14)"
                  : "Low Risk (<10)"}
          </Badge>
        </div>
        <p className="text-sm">
          {waterlowTotal >= 15
            ? "Action Required: Dynamic alternating air mattress, 2-hourly repositioning chart, heel elevation boots, barrier cream applied with each pad change, weekly photographic tissue inspection."
            : waterlowTotal >= 10
              ? "Action Required: High-specification foam mattress, 4-hourly posture alteration, daily skin integrity inspection, encourage active mobility."
              : "Action Required: Standard preventative care, routine monthly skin re-assessment."}
        </p>
      </div>
    </div>
  );
}

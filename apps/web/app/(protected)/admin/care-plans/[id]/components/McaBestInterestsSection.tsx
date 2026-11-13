"use client";

import { useState } from "react";
import { Scale, Users } from "lucide-react";
import { Button, Input, Label, Text, Textarea } from "@repo/ui/components/ui";

export interface ConsultedParty {
  name: string;
  relationship: string;
  viewsExpressed: string;
}

interface McaBestInterestsSectionProps {
  leastRestrictive: string;
  setLeastRestrictive: (val: string) => void;
  consultedList: ConsultedParty[];
  setConsultedList: React.Dispatch<React.SetStateAction<ConsultedParty[]>>;
}

export function McaBestInterestsSection({
  leastRestrictive,
  setLeastRestrictive,
  consultedList,
  setConsultedList,
}: McaBestInterestsSectionProps) {
  const [consultedName, setConsultedName] = useState("");
  const [consultedRelation, setConsultedRelation] = useState("");
  const [consultedViews, setConsultedViews] = useState("");

  const handleAddConsulted = () => {
    if (!consultedName.trim() || !consultedRelation.trim() || !consultedViews.trim()) return;
    setConsultedList((prev) => [
      ...prev,
      {
        name: consultedName.trim(),
        relationship: consultedRelation.trim(),
        viewsExpressed: consultedViews.trim(),
      },
    ]);
    setConsultedName("");
    setConsultedRelation("");
    setConsultedViews("");
  };

  return (
    <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3 font-['Outfit',sans-serif]">
      <div className="flex items-center gap-2">
        <Scale className="size-4 text-amber-700" />
        <Text size="md" weight="semibold" className="text-amber-900 uppercase tracking-wider">
          Section 4 Best Interests Documentation
        </Text>
      </div>

      <div className="space-y-1">
        <Label required className="text-md font-medium text-amber-900">
          Least Restrictive Alternative Considered
        </Label>
        <Textarea
          placeholder="e.g., Lowered floor bed and soft fall-mat trialled for 2 weeks but resident continued attempting to stand unaided; bed rails with padded bumpers deemed the least restrictive safe option."
          value={leastRestrictive}
          onChange={(e) => setLeastRestrictive(e.target.value)}
          rows={2}
          className="text-md bg-white"
        />
      </div>

      {/* Consulted Persons */}
      <div className="space-y-2">
        <div className="flex items-center gap-1 text-md font-medium text-amber-900">
          <Users className="size-3.5 text-amber-700" />
          <span>Consulted Family, Advocates &amp; LPA Representatives</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Input
            placeholder="Name"
            value={consultedName}
            onChange={(e) => setConsultedName(e.target.value)}
            className="text-md bg-white"
          />
          <Input
            placeholder="Relationship (e.g. Son, LPA)"
            value={consultedRelation}
            onChange={(e) => setConsultedRelation(e.target.value)}
            className="text-md bg-white"
          />
          <Input
            placeholder="Views expressed"
            value={consultedViews}
            onChange={(e) => setConsultedViews(e.target.value)}
            className="text-md bg-white"
          />
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleAddConsulted}
          className="text-md h-7 rounded-xl font-semibold cursor-pointer"
        >
          + Add Consulted Party
        </Button>

        {consultedList.length > 0 && (
          <div className="space-y-1 pt-1">
            {consultedList.map((c, i) => (
              <div key={i} className="text-md p-2 bg-white rounded-xl border border-amber-200 text-slate-700">
                <strong>{c.name}</strong> ({c.relationship}): &quot;{c.viewsExpressed}&quot;
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

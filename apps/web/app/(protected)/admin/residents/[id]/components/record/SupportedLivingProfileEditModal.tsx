"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Label,
  Input,
  Textarea,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui";
import type {
  SupportedLivingDetailsDTO,
  SupportedLivingOutcomeDTO,
} from "@repo/schema";

export type ProfileEditSection =
  | "tenancy"
  | "needs"
  | "goals"
  | "compatibility"
  | null;

interface SupportedLivingProfileEditModalProps {
  section: ProfileEditSection;
  onClose: () => void;
  details: SupportedLivingDetailsDTO;
  onSave: (patch: Partial<SupportedLivingDetailsDTO>) => Promise<unknown>;
  isSaving?: boolean;
}

export function SupportedLivingProfileEditModal({
  section,
  onClose,
  details,
  onSave,
  isSaving,
}: SupportedLivingProfileEditModalProps) {
  // Tenancy state
  const [tenancyStartDate, setTenancyStartDate] = useState("");
  const [landlord, setLandlord] = useState("");
  const [tenancyType, setTenancyType] = useState("");
  const [housingBenefit, setHousingBenefit] = useState("Yes");
  const [weeklyRent, setWeeklyRent] = useState("142.50");
  const [address, setAddress] = useState("");

  // Support needs state
  const [needsText, setNeedsText] = useState("");
  const [primaryNeed, setPrimaryNeed] = useState("");
  const [supportHours, setSupportHours] = useState("28");
  const [oneToOneHours, setOneToOneHours] = useState("6");
  const [riskLevel, setRiskLevel] = useState<"Low" | "Medium" | "High">(
    "Medium",
  );

  // Goals state
  const [outcomes, setOutcomes] = useState<SupportedLivingOutcomeDTO[]>([]);

  // Compatibility state
  const [housematesCount, setHousematesCount] = useState("2");
  const [preferredEnvironment, setPreferredEnvironment] = useState("");
  const [knownTriggers, setKnownTriggers] = useState("");
  const [likesAndInterests, setLikesAndInterests] = useState("");

  useEffect(() => {
    if (!section) return;
    setTenancyStartDate(details.tenancy?.tenancyStartDate || "2023-01-01");
    setLandlord(
      details.tenancy?.landlord || "Yorkshire Housing Association",
    );
    setTenancyType(
      details.tenancy?.tenancyType || "Assured Shorthold Tenancy",
    );
    setHousingBenefit(details.tenancy?.housingBenefit || "Yes");
    setWeeklyRent(
      details.tenancy?.weeklyRent !== undefined &&
        details.tenancy?.weeklyRent !== null
        ? String(details.tenancy.weeklyRent)
        : "142.50",
    );
    setAddress(
      details.tenancy?.address || "Flat 1, 12 Oak Street, York, YO31 7EH",
    );

    const defaultNeeds = details.supportNeeds?.length
      ? details.supportNeeds
      : [
          "Learning disability",
          "Support with daily living skills",
          "Help with medication",
          "Prompting with personal care",
        ];
    setNeedsText(defaultNeeds.join("\n"));
    setPrimaryNeed(details.primaryNeed || "Learning disability");
    setSupportHours(String(details.supportHoursPerWeek ?? 28));
    setOneToOneHours(String(details.oneToOneHoursPerWeek ?? 6));
    setRiskLevel(details.riskLevel || "Medium");

    setOutcomes(
      details.outcomes?.length
        ? details.outcomes
        : [
            {
              id: "out-1",
              title: "Prepare meals independently",
              progress: 70,
              status: "On track",
            },
            {
              id: "out-2",
              title: "Use public transport",
              progress: 45,
              status: "On track",
            },
            {
              id: "out-3",
              title: "Build confidence in community activities",
              progress: 30,
              status: "Needs focus",
            },
          ],
    );

    setHousematesCount(
      String(details.compatibility?.housematesCount ?? 2),
    );
    setPreferredEnvironment(
      details.compatibility?.preferredEnvironment || "Quiet, supportive home",
    );
    setKnownTriggers(
      details.compatibility?.knownTriggers || "Loud noise, change in routine",
    );
    setLikesAndInterests(
      details.compatibility?.likesAndInterests ||
        "Football, cooking shows, dog walking",
    );
  }, [section, details]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (section === "tenancy") {
      await onSave({
        tenancy: {
          tenancyStartDate,
          landlord,
          tenancyType,
          housingBenefit,
          weeklyRent: Number(weeklyRent) || 0,
          address,
        },
      });
    } else if (section === "needs") {
      const list = needsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      await onSave({
        primaryNeed,
        supportHoursPerWeek: Number(supportHours) || 0,
        oneToOneHoursPerWeek: Number(oneToOneHours) || 0,
        riskLevel,
        supportNeeds: list,
      });
    } else if (section === "goals") {
      await onSave({
        outcomes: outcomes.filter((o) => o.title.trim().length > 0),
      });
    } else if (section === "compatibility") {
      await onSave({
        compatibility: {
          housematesCount: Number(housematesCount) || 0,
          preferredEnvironment,
          knownTriggers,
          likesAndInterests,
        },
      });
    }
    onClose();
  };

  const titleMap: Record<NonNullable<ProfileEditSection>, string> = {
    tenancy: "Edit Tenancy Information",
    needs: "Edit Support Needs & Hours",
    goals: "Edit Support Goals & Outcomes",
    compatibility: "Edit Compatibility & Preferences",
  };

  return (
    <Dialog open={Boolean(section)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="2xl" className="p-0 max-h-[90vh] overflow-y-auto">
        {section && (
          <div className="p-6">
            <DialogHeader className="pb-4 border-b border-slate-100">
              <DialogTitle className="text-lg font-bold text-slate-900">
                {titleMap[section]}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              {section === "tenancy" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-md font-bold text-slate-800">
                      Tenancy Address
                    </Label>
                    <Input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-md font-bold text-slate-800">
                      Tenancy Start Date
                    </Label>
                    <Input
                      type="date"
                      value={tenancyStartDate}
                      onChange={(e) => setTenancyStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-md font-bold text-slate-800">
                      Landlord
                    </Label>
                    <Input
                      value={landlord}
                      onChange={(e) => setLandlord(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-md font-bold text-slate-800">
                      Tenancy Type
                    </Label>
                    <Input
                      value={tenancyType}
                      onChange={(e) => setTenancyType(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-md font-bold text-slate-800">
                      Housing Benefit
                    </Label>
                    <Select
                      value={housingBenefit}
                      onValueChange={setHousingBenefit}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-md font-bold text-slate-800">
                      Weekly Rent (£)
                    </Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={weeklyRent}
                      onChange={(e) => setWeeklyRent(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {section === "needs" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                    <div className="space-y-1">
                      <Label className="text-md font-bold text-slate-800">
                        Primary Need
                      </Label>
                      <Input
                        value={primaryNeed}
                        onChange={(e) => setPrimaryNeed(e.target.value)}
                        placeholder="e.g. Learning disability"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-md font-bold text-slate-800">
                        Risk Level
                      </Label>
                      <Select
                        value={riskLevel}
                        onValueChange={(v) =>
                          setRiskLevel(v as "Low" | "Medium" | "High")
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-md font-bold text-slate-800">
                        Support Hours / Week
                      </Label>
                      <Input
                        type="number"
                        value={supportHours}
                        onChange={(e) => setSupportHours(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-md font-bold text-slate-800">
                        1:1 Hours / Week
                      </Label>
                      <Input
                        type="number"
                        value={oneToOneHours}
                        onChange={(e) => setOneToOneHours(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-md font-bold text-slate-800">
                      Support Needs (one per line)
                    </Label>
                    <Textarea
                      rows={5}
                      value={needsText}
                      onChange={(e) => setNeedsText(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {section === "goals" && (
                <div className="space-y-3">
                  {outcomes.map((o, idx) => (
                    <div
                      key={o.id}
                      className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200 [&_[data-slot=input-error]]:hidden"
                    >
                      <div className="col-span-6">
                        <Input
                          value={o.title}
                          onChange={(e) =>
                            setOutcomes(
                              outcomes.map((item, i) =>
                                i === idx
                                  ? { ...item, title: e.target.value }
                                  : item,
                              ),
                            )
                          }
                          placeholder="Outcome title"
                          className="h-9 bg-white text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={o.progress}
                          onChange={(e) =>
                            setOutcomes(
                              outcomes.map((item, i) =>
                                i === idx
                                  ? {
                                      ...item,
                                      progress: Math.min(
                                        100,
                                        Math.max(0, Number(e.target.value) || 0),
                                      ),
                                    }
                                  : item,
                              ),
                            )
                          }
                          className="h-9 bg-white text-sm"
                        />
                      </div>
                      <div className="col-span-3">
                        <Select
                          value={o.status}
                          onValueChange={(val) =>
                            setOutcomes(
                              outcomes.map((item, i) =>
                                i === idx
                                  ? {
                                      ...item,
                                      status:
                                        val as SupportedLivingOutcomeDTO["status"],
                                    }
                                  : item,
                              ),
                            )
                          }
                        >
                          <SelectTrigger className="h-9 bg-white text-md">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            <SelectItem value="On track">On track</SelectItem>
                            <SelectItem value="Needs focus">
                              Needs focus
                            </SelectItem>
                            <SelectItem value="Achieved">Achieved</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            setOutcomes(outcomes.filter((_, i) => i !== idx))
                          }
                          className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setOutcomes([
                        ...outcomes,
                        {
                          id: `out-${Date.now()}`,
                          title: "",
                          progress: 25,
                          status: "On track",
                        },
                      ])
                    }
                    className="gap-1.5"
                  >
                    <Plus className="size-3.5" /> Add Goal / Outcome
                  </Button>
                </div>
              )}

              {section === "compatibility" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                  <div className="space-y-1">
                    <Label className="text-md font-bold text-slate-800">
                      Housemates Count
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={housematesCount}
                      onChange={(e) => setHousematesCount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-md font-bold text-slate-800">
                      Preferred Environment
                    </Label>
                    <Input
                      value={preferredEnvironment}
                      onChange={(e) => setPreferredEnvironment(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-md font-bold text-slate-800">
                      Known Triggers
                    </Label>
                    <Input
                      value={knownTriggers}
                      onChange={(e) => setKnownTriggers(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-md font-bold text-slate-800">
                      Likes & Interests
                    </Label>
                    <Input
                      value={likesAndInterests}
                      onChange={(e) => setLikesAndInterests(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

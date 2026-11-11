"use client";

import React, { useState, useEffect } from "react";
import { Badge, Button, Input, Tabs, TabsList, TabsTrigger, Text, Textarea } from "@repo/ui/components/ui";

interface NarrativeFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  isTextarea?: boolean;
  rows?: number;
  isEditable?: boolean;
  helpText?: string;
  fallback?: string;
  className?: string;
}

function NarrativeField({
  label,
  value,
  onChange,
  placeholder,
  isTextarea = false,
  rows = 2,
  isEditable = true,
  helpText,
  fallback = "None specified",
  className,
}: NarrativeFieldProps) {
  return (
    <div className="space-y-1.5">
      <Text size="sm" weight="medium" className="text-slate-700">
        {label}
      </Text>
      {isEditable ? (
        isTextarea ? (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className={` resize-y ${className || ""}`}
          />
        ) : (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={` ${className || ""}`}
          />
        )
      ) : (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl min-h-[44px]">
          <Text size="sm" className="text-slate-800 leading-relaxed">
            {value || fallback}
          </Text>
        </div>
      )}
      {helpText && (
        <Text size="sm" variant="muted">
          {helpText}
        </Text>
      )}
    </div>
  );
}

interface CarePlanNarrativeSectionsProps {
  activeSection: string;
  resident: any;
  isEditable?: boolean;
  basisOption?: string;
  setBasisOption?: (val: string) => void;
  participationOption?: string;
  setParticipationOption?: (val: string) => void;
}

export function CarePlanNarrativeSections({
  activeSection,
  resident,
  isEditable = true,
  basisOption,
  setBasisOption,
  participationOption,
  setParticipationOption,
}: CarePlanNarrativeSectionsProps) {
  // History state
  const [lifeStory, setLifeStory] = useState("");
  const [relationships, setRelationships] = useState("");
  const [identityCulture, setIdentityCulture] = useState("");
  const [lifelongRoutines, setLifelongRoutines] = useState("");
  const [mattersMost, setMattersMost] = useState("");
  const [whoContributed, setWhoContributed] = useState("");

  // Preferences state
  const [carePreferences, setCarePreferences] = useState("");
  const [communicationPref, setCommunicationPref] = useState("");
  const [dailyRoutine, setDailyRoutine] = useState("");
  const [activities, setActivities] = useState("");
  const [foodAndDrink, setFoodAndDrink] = useState("");

  // Consent state
  const [involvementNotes, setInvolvementNotes] = useState("");
  const [representativesConsulted, setRepresentativesConsulted] = useState("");

  useEffect(() => {
    if (resident) {
      const nok = resident.nextOfKin?.[0];
      setLifeStory(resident.aboutBio || resident.careProfile?.specialRequirements || (resident.admission?.admittedFrom ? `Admitted from ${resident.admission.admittedFrom}.` : ""));
      setRelationships(nok ? `${nok.name || nok.firstName || ""} (${nok.relation || "Contact"})${nok.phone ? ` - ${nok.phone}` : ""}`.trim() : "");
      setIdentityCulture(resident.profile?.religion || resident.profile?.preferredLanguage ? `Religion: ${resident.profile?.religion || "Not specified"}. Preferred language: ${resident.profile?.preferredLanguage || "English"}.` : "");
      setLifelongRoutines(resident.profile?.hobbies || resident.careProfile?.routinePreferences || "");
      setMattersMost(resident.profile?.hobbies ? `Personal routine, maintaining independence, ${resident.profile.hobbies}.` : "");
      setWhoContributed(resident.keyworker?.fullName ? `Resident and key worker (${resident.keyworker.fullName})` : "");
      setCarePreferences(resident.careProfile?.routinePreferences || "");
      setCommunicationPref(resident.careProfile?.sensoryAids?.length ? `Sensory aids: ${resident.careProfile.sensoryAids.join(", ")}` : (resident.careProfile?.communicationAbility || ""));
      setDailyRoutine(resident.careProfile?.sleepPattern || "");
      setActivities(resident.profile?.hobbies || resident.profile?.formerOccupation || "");
      setFoodAndDrink(resident.careProfile?.dietType ? `${resident.careProfile.dietType}${resident.careProfile.textureModification ? ` (${resident.careProfile.textureModification})` : ""}` : "");
      setInvolvementNotes(resident.carePlan?.residentAgreementNotes || "");
      setRepresentativesConsulted(nok ? `${nok.name || nok.firstName || ""} (${nok.relation || "Next of kin"})` : "");
    }
  }, [resident]);

  const BASIS_OPTIONS = [
    { id: "confirmed", label: "Confirmed with resident" },
    { id: "assessed", label: "Assessed" },
    { id: "proposed", label: "Proposed" },
    { id: "awaiting", label: "Awaiting review" },
  ];

  const renderBasisSelector = () => (
    <div className="space-y-1.5">
      <Text size="sm" weight="medium" className="text-slate-700">
        Basis of this section *
      </Text>
      <div className="flex flex-wrap gap-1 p-1 bg-slate-100/80 rounded-xl w-fit">
        {BASIS_OPTIONS.map((opt) => (
          <Button
            key={opt.id}
            type="button"
            size="sm"
            variant={basisOption === opt.id ? "primary" : "ghost"}
            onClick={() => setBasisOption?.(opt.id)}
          >
            <Text size="sm" className={` ${basisOption === opt.id ? "text-white" : ""}`}>{opt.label}</Text>
          </Button>
        ))}
      </div>
    </div>
  );

  if (activeSection === "history") {
    return (
      <div className="space-y-4">
        {renderBasisSelector()}
        <NarrativeField
          label="Life story *"
          value={lifeStory}
          onChange={setLifeStory}
          placeholder="Work, places, key events and achievements — what would they want staff to know?"
          isTextarea
          rows={3}
          isEditable={isEditable}
          helpText="Work, places, key events and achievements — what would they want staff to know?"
          fallback="No background narrative recorded yet."
        />
        <NarrativeField label="Important relationships" value={relationships} onChange={setRelationships} placeholder="e.g. John Doe (Son) - 07123456789" isEditable={isEditable} fallback="No emergency contacts or next of kin specified." />
        <NarrativeField label="Identity, culture & faith" value={identityCulture} onChange={setIdentityCulture} placeholder="In their own words where possible" isEditable={isEditable} fallback="In their own words where possible." />
        <NarrativeField label="Interests & lifelong routines" value={lifelongRoutines} onChange={setLifelongRoutines} placeholder="e.g. Gardening, listening to classical music, morning walks" isEditable={isEditable} />
        <NarrativeField label="What matters most to them now *" value={mattersMost} onChange={setMattersMost} placeholder="e.g. Maintaining dignity, seeing family weekly, keeping mobile" isTextarea rows={2} isEditable={isEditable} fallback="Maintaining dignity and independence with daily routines." />
        <NarrativeField label="Who contributed" value={whoContributed} onChange={setWhoContributed} placeholder="e.g. Resident and key worker" isEditable={isEditable} className="w-full sm:w-80" />
      </div>
    );
  }

  if (activeSection === "preferences") {
    return (
      <div className="space-y-4">
        {renderBasisSelector()}
        <NarrativeField label="How they want care to be given *" value={carePreferences} onChange={setCarePreferences} placeholder="e.g. Likes unhurried assistance; prompt rather than rush." isTextarea rows={2} isEditable={isEditable} fallback="Likes unhurried assistance; prompt rather than rush." />
        <NarrativeField label="Communication preferences *" value={communicationPref} onChange={setCommunicationPref} placeholder="e.g. Clear speech; wears hearing aid in left ear." isEditable={isEditable} />
        <NarrativeField label="Daily routine *" value={dailyRoutine} onChange={setDailyRoutine} placeholder="e.g. Breakfast at 08:00, afternoon rest, early evening dinner." isEditable={isEditable} />
        <NarrativeField label="Activities & occupation" value={activities} onChange={setActivities} placeholder="e.g. Socializing with companions, light reading, music." isEditable={isEditable} />
        <NarrativeField label="Food & drink" value={foodAndDrink} onChange={setFoodAndDrink} placeholder="e.g. Regular diet. Adequate fluid encouragement." isEditable={isEditable} />
      </div>
    );
  }

  if (activeSection === "consent") {
    const nok = resident?.nextOfKin?.[0];
    const nokDesc = nok
      ? `${nok.name || nok.firstName} (${nok.relation || "Next of kin"})`
      : "No legal representative assigned";

    return (
      <div className="space-y-4 font-sans">
        {renderBasisSelector()}

        {/* Statutory Consent & Capacity Context Panel matching Needs section */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <Text size="md" weight="bold" className="text-slate-900">
              Statutory Capacity &amp; Legal Consent Reference
            </Text>
            <Badge variant="secondary" state="success" className="text-sm font-semibold px-2 py-0.5 shadow-none">
              MCA 2005 Compliant
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-1.5">
              <Text size="sm" variant="muted">Mental Capacity:</Text>
              <Text size="sm" weight="medium" className="text-slate-800">
                Presumed capable of consenting to daily routine
              </Text>
            </div>
            <div className="flex items-center gap-1.5">
              <Text size="sm" variant="muted">Legal Representative:</Text>
              <Text size="sm" className="text-slate-800">
                {nokDesc}
              </Text>
            </div>
            <div className="flex items-center gap-1.5">
              <Text size="sm" variant="muted">General Consent:</Text>
              <Text size="sm" className="text-slate-800">
                Admission care consent on file
              </Text>
            </div>
            <div className="flex items-center gap-1.5">
              <Text size="sm" variant="muted">DNACPR Order:</Text>
              <Badge
                variant="secondary"
                state={resident?.dnarStatus ? "warning" : "inactive"}
                className="text-sm font-semibold px-2 py-0.5 shadow-none"
              >
                {resident?.dnarStatus ? "DNACPR Recorded" : "Not recorded"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Resident Participation Level */}
        <div className="space-y-1.5">
          <Text size="sm" weight="medium" className="text-slate-700">
            Resident participation in plan *
          </Text>
          <div className="flex flex-wrap gap-1 p-1 bg-slate-100/80 rounded-xl w-fit">
            {[
              { id: "fully", label: "Fully involved" },
              { id: "partly", label: "Partly involved" },
              { id: "unable", label: "Unable to participate" },
            ].map((opt) => (
              <Button
                key={opt.id}
                type="button"
                size="sm"
                variant={participationOption === opt.id ? "primary" : "ghost"}
                onClick={() => setParticipationOption?.(opt.id)}
              >
                <Text size="sm" className={` ${participationOption === opt.id ? "text-white" : "text-slate-700"}`}>{opt.label}</Text>
              </Button>
            ))}
          </div>
        </div>

        <NarrativeField
          label="How the resident was involved *"
          value={involvementNotes}
          onChange={setInvolvementNotes}
          placeholder="e.g. Plan discussed and agreed with the resident at review with key worker."
          isTextarea
          rows={2}
          isEditable={isEditable}
        />
        <NarrativeField
          label="Representatives consulted"
          value={representativesConsulted}
          onChange={setRepresentativesConsulted}
          placeholder="e.g. Next of kin consulted and updated."
          isEditable={isEditable}
          fallback="No representative consultation required."
        />
      </div>
    );
  }

  return null;
}

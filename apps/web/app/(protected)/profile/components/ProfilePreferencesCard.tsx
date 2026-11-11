"use client";

import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@repo/ui/components/ui/Card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/Select";
import { Text } from "@repo/ui/components/ui/Text";

interface PreferenceField {
  label: string;
  options: string[];
}

const PREFERENCE_FIELDS: PreferenceField[] = [
  { label: "Theme", options: ["System", "Light", "Dark"] },
  {
    label: "Dashboard Default",
    options: ["Admin Dashboard", "Nurse Dashboard", "Carer Dashboard"],
  },
  { label: "Landing page", options: ["Dashboard", "Profile", "Residents"] },
  { label: "Date Format", options: ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"] },
  { label: "Time Format", options: ["24-Hour", "12-Hour"] },
];

export function ProfilePreferencesCard() {
  const [values, setValues] = useState<Record<string, string>>({
    "Theme": "System",
    "Dashboard Default": "Admin Dashboard",
    "Landing page": "Dashboard",
    "Date Format": "DD/MM/YYYY",
    "Time Format": "24-Hour",
  });

  return (
    <Card variant="default" className="w-full">
      {/* ==================== HEADER ==================== */}
      <CardHeader className="pb-5 border-b border-border-secondary">
        <CardTitle>Preferences</CardTitle>
        <CardDescription>Customise your workspace experiences.</CardDescription>
      </CardHeader>

      {/* ==================== CONTENT BODY ==================== */}
      <CardContent className="pt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full">
        {PREFERENCE_FIELDS.map((pref) => (
          <div key={pref.label} className="flex flex-col items-start gap-2 w-full min-w-0">
            <Text size="md" className="text-muted-foreground truncate w-full">
              {pref.label}
            </Text>

            <Select
              value={values[pref.label]}
              onValueChange={(next) =>
                setValues((prev) => ({ ...prev, [pref.label]: next }))
              }
            >
              <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white px-3 shadow-2xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pref.options.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

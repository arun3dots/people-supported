"use client";

import React from "react";
import { Text, Input, Badge, Button, Alert, AlertTitle, AlertDescription } from "@repo/ui/components/ui";

interface SbarVitalsTabProps {
  bpSystolic?: number;
  onBpSystolicChange: (val?: number) => void;
  bpDiastolic?: number;
  onBpDiastolicChange: (val?: number) => void;
  pulse?: number;
  onPulseChange: (val?: number) => void;
  temp?: number;
  onTempChange: (val?: number) => void;
  spo2?: number;
  onSpo2Change: (val?: number) => void;
  respiration?: number;
  onRespirationChange: (val?: number) => void;
  consciousness: string;
  onConsciousnessChange: (val: string) => void;
  liveNews2: number;
}

export function SbarVitalsTab({
  bpSystolic,
  onBpSystolicChange,
  bpDiastolic,
  onBpDiastolicChange,
  pulse,
  onPulseChange,
  temp,
  onTempChange,
  spo2,
  onSpo2Change,
  respiration,
  onRespirationChange,
  consciousness,
  onConsciousnessChange,
  liveNews2,
}: SbarVitalsTabProps): React.JSX.Element {
  return (
    <div className="space-y-4">
      <Alert>
        <AlertTitle>NEWS2 Score Calculator</AlertTitle>
        <AlertDescription>
          Royal College of Physicians Standard
          <div className="mt-2">
            <Badge variant={liveNews2 >= 7 ? "destructive" : liveNews2 >= 5 ? "default" : "outline"}>
              NEWS2: {liveNews2}{" "}
              {liveNews2 >= 7
                ? "(Urgent Response)"
                : liveNews2 >= 5
                ? "(Medium Trigger)"
                : "(Low Risk)"}
            </Badge>
          </div>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Text weight="semibold">Systolic BP</Text>
          <Input
            type="number"
            value={bpSystolic ?? ""}
            onChange={(e) => onBpSystolicChange(e.target.value ? Number(e.target.value) : undefined)}
            placeholder="mmHg"
          />
        </div>
        <div>
          <Text weight="semibold">Diastolic BP</Text>
          <Input
            type="number"
            value={bpDiastolic ?? ""}
            onChange={(e) => onBpDiastolicChange(e.target.value ? Number(e.target.value) : undefined)}
            placeholder="mmHg"
          />
        </div>
        <div>
          <Text weight="semibold">Pulse / HR</Text>
          <Input
            type="number"
            value={pulse ?? ""}
            onChange={(e) => onPulseChange(e.target.value ? Number(e.target.value) : undefined)}
            placeholder="bpm"
          />
        </div>
        <div>
          <Text weight="semibold">Temperature</Text>
          <Input
            type="number"
            step="0.1"
            value={temp ?? ""}
            onChange={(e) => onTempChange(e.target.value ? Number(e.target.value) : undefined)}
            placeholder="°C"
          />
        </div>
        <div>
          <Text weight="semibold">Oxygen SpO2</Text>
          <Input
            type="number"
            value={spo2 ?? ""}
            onChange={(e) => onSpo2Change(e.target.value ? Number(e.target.value) : undefined)}
            placeholder="%"
          />
        </div>
        <div>
          <Text weight="semibold">Respirations</Text>
          <Input
            type="number"
            value={respiration ?? ""}
            onChange={(e) => onRespirationChange(e.target.value ? Number(e.target.value) : undefined)}
            placeholder="/min"
          />
        </div>
      </div>

      <div>
        <Text weight="semibold">Consciousness (ACVPU)</Text>
        <div className="grid grid-cols-5 gap-1.5 mt-1">
          {["Alert", "Confusion", "V", "P", "U"].map((level) => (
            <Button
              key={level}
              type="button"
              variant={consciousness === level ? "default" : "outline"}
              onClick={() => onConsciousnessChange(level)}
            >
              {level}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

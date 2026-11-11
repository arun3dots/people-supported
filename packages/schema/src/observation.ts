import { z } from "zod";

export const ObservationSchema = z.object({
  residentId: z.string().uuid(),
  temp: z.number().optional().nullable(),
  pulse: z.number().int().optional().nullable(),
  bpSystolic: z.number().int().optional().nullable(),
  bpDiastolic: z.number().int().optional().nullable(),
  respiration: z.number().int().optional().nullable(),
  spo2: z.number().optional().nullable(),
  spo2Scale: z.number().int(),
  airOrOxygen: z.string().optional().nullable(),
  consciousness: z.string(),
  news2Score: z.number().int().optional().nullable(),
  isAbnormal: z.boolean(),
  notifyGP: z.boolean(),
  increaseMonitoring: z.boolean(),
  notes: z.string().optional().nullable(),
  occurredAt: z.string().datetime().or(z.date()).optional().nullable(),
  isLateEntry: z.boolean().optional(),
});

export type ObservationDTO = z.infer<typeof ObservationSchema>;

// B-06: Clinical Rectification Strike-Through Workflow
export const CorrectObservationSchema = ObservationSchema.partial().extend({
  correctionReason: z
    .string()
    .trim()
    .min(5, "Correction reason must be at least 5 characters")
    .max(500),
});

export type CorrectObservationDTO = z.infer<typeof CorrectObservationSchema>;

export function calculateNEWS2Score(data: Partial<ObservationDTO>) {
  let score = 0;
  const details: Record<string, number> = {};

  // Respiration
  if (data.respiration !== undefined && data.respiration !== null) {
    let s = 0;
    if (data.respiration <= 8) s = 3;
    else if (data.respiration <= 11) s = 1;
    else if (data.respiration <= 20) s = 0;
    else if (data.respiration <= 24) s = 2;
    else s = 3;
    score += s;
    details.respiration = s;
  }

  // SpO2
  if (data.spo2 !== undefined && data.spo2 !== null) {
    let s = 0;
    if (data.spo2Scale === 2) {
      if (data.spo2 <= 83) s = 3;
      else if (data.spo2 <= 85) s = 2;
      else if (data.spo2 <= 87) s = 1;
      else if (data.spo2 <= 92) s = 0;
      else {
        // 93+
        if (data.airOrOxygen && data.airOrOxygen !== "Air") {
          if (data.spo2 <= 94) s = 1;
          else if (data.spo2 <= 96) s = 2;
          else s = 3;
        } else {
          s = 0;
        }
      }
    } else {
      // Scale 1 (default)
      if (data.spo2 <= 91) s = 3;
      else if (data.spo2 <= 93) s = 2;
      else if (data.spo2 <= 95) s = 1;
      else s = 0;
    }
    score += s;
    details.spo2 = s;
  }

  // Air or Oxygen
  if (data.airOrOxygen !== undefined && data.airOrOxygen !== null) {
    const s = data.airOrOxygen === "Air" ? 0 : 2;
    score += s;
    details.airOrOxygen = s;
  }

  // Systolic BP
  if (data.bpSystolic !== undefined && data.bpSystolic !== null) {
    let s = 0;
    if (data.bpSystolic <= 90) s = 3;
    else if (data.bpSystolic <= 100) s = 2;
    else if (data.bpSystolic <= 110) s = 1;
    else if (data.bpSystolic <= 219) s = 0;
    else s = 3;
    score += s;
    details.bpSystolic = s;
  }

  // Pulse
  if (data.pulse !== undefined && data.pulse !== null) {
    let s = 0;
    if (data.pulse <= 40) s = 3;
    else if (data.pulse <= 50) s = 1;
    else if (data.pulse <= 90) s = 0;
    else if (data.pulse <= 110) s = 1;
    else if (data.pulse <= 130) s = 2;
    else s = 3;
    score += s;
    details.pulse = s;
  }

  // Consciousness
  if (data.consciousness) {
    const s = data.consciousness === "Alert" ? 0 : 3;
    score += s;
    details.consciousness = s;
  }

  // Temperature
  if (data.temp !== undefined && data.temp !== null) {
    let s = 0;
    if (data.temp <= 35.0) s = 3;
    else if (data.temp <= 36.0) s = 1;
    else if (data.temp <= 38.0) s = 0;
    else if (data.temp <= 39.0) s = 1;
    else s = 2;
    score += s;
    details.temp = s;
  }

  return { score, details };
}

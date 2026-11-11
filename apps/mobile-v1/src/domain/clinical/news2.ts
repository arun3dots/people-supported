/**
 * Royal College of Physicians (RCP) National Early Warning Score 2 (NEWS2)
 * UK Clinical Standard for detecting clinical deterioration in adult care settings.
 */

export interface News2Input {
  respirationRate?: number | null;
  spo2?: number | null;
  spo2Scale?: 1 | 2; // Scale 2 is for confirmed hypercapnic respiratory failure
  airOrOxygen?: 'Air' | 'Oxygen' | null;
  systolicBp?: number | null;
  diastolicBp?: number | null;
  pulseRate?: number | null;
  consciousness?: 'Alert' | 'Confusion' | 'Voice' | 'Pain' | 'Unresponsive' | null;
  temperature?: number | null;
  isAbnormal?: boolean;
  notifyGP?: boolean;
  increaseMonitoring?: boolean;
}

export type News2RiskLevel = 'Low' | 'Medium' | 'High';

export interface News2Result {
  totalScore: number;
  hasRedScore: boolean; // 3 points in any single physiological parameter
  riskLevel: News2RiskLevel;
  clinicalAction: string;
  breakdown: {
    respirationScore: number;
    spo2Score: number;
    airOrOxygenScore: number;
    systolicBpScore: number;
    pulseScore: number;
    consciousnessScore: number;
    temperatureScore: number;
  };
}

export function scoreRespiration(rate: number | null | undefined): number {
  if (rate === null || rate === undefined) return 0;
  if (rate <= 8) return 3;
  if (rate >= 9 && rate <= 11) return 1;
  if (rate >= 12 && rate <= 20) return 0;
  if (rate >= 21 && rate <= 24) return 2;
  return 3; // >= 25
}

export function scoreSpo2(spo2: number | null | undefined, scale: 1 | 2 = 1, airOrOxygen = 'Air'): number {
  if (spo2 === null || spo2 === undefined) return 0;
  if (scale === 2) {
    if (spo2 <= 83) return 3;
    if (spo2 >= 84 && spo2 <= 85) return 2;
    if (spo2 >= 86 && spo2 <= 87) return 1;
    if (spo2 >= 88 && spo2 <= 92) return 0;
    if (airOrOxygen === 'Oxygen') {
      if (spo2 >= 93 && spo2 <= 94) return 1;
      if (spo2 >= 95 && spo2 <= 96) return 2;
      if (spo2 >= 97) return 3;
    }
    return 0;
  }
  // Scale 1 (Standard)
  if (spo2 <= 91) return 3;
  if (spo2 >= 92 && spo2 <= 93) return 2;
  if (spo2 >= 94 && spo2 <= 95) return 1;
  return 0; // >= 96
}

export function scoreAirOrOxygen(airOrOxygen: string | null | undefined): number {
  return airOrOxygen === 'Oxygen' ? 2 : 0;
}

export function scoreSystolicBp(bp: number | null | undefined): number {
  if (bp === null || bp === undefined) return 0;
  if (bp <= 90) return 3;
  if (bp >= 91 && bp <= 100) return 2;
  if (bp >= 101 && bp <= 110) return 1;
  if (bp >= 111 && bp <= 219) return 0;
  return 3; // >= 220
}

export function scorePulse(pulse: number | null | undefined): number {
  if (pulse === null || pulse === undefined) return 0;
  if (pulse <= 40) return 3;
  if (pulse >= 41 && pulse <= 50) return 1;
  if (pulse >= 51 && pulse <= 90) return 0;
  if (pulse >= 91 && pulse <= 110) return 1;
  if (pulse >= 111 && pulse <= 130) return 2;
  return 3; // >= 131
}

export function scoreConsciousness(consciousness: string | null | undefined): number {
  if (!consciousness || consciousness === 'Alert') return 0;
  return 3; // New Confusion, Voice, Pain, or Unresponsive
}

export function scoreTemperature(temp: number | null | undefined): number {
  if (temp === null || temp === undefined) return 0;
  if (temp <= 35.0) return 3;
  if (temp >= 35.1 && temp <= 36.0) return 1;
  if (temp >= 36.1 && temp <= 38.0) return 0;
  if (temp >= 38.1 && temp <= 39.0) return 1;
  return 2; // >= 39.1
}

export function calculateNews2(input: News2Input): News2Result {
  const resp = scoreRespiration(input.respirationRate);
  const spo2 = scoreSpo2(input.spo2, input.spo2Scale || 1, input.airOrOxygen || 'Air');
  const oxy = scoreAirOrOxygen(input.airOrOxygen);
  const bp = scoreSystolicBp(input.systolicBp);
  const pulse = scorePulse(input.pulseRate);
  const conscious = scoreConsciousness(input.consciousness);
  const temp = scoreTemperature(input.temperature);

  const totalScore = resp + spo2 + oxy + bp + pulse + conscious + temp;
  const hasRedScore =
    resp === 3 || spo2 === 3 || bp === 3 || pulse === 3 || conscious === 3 || temp === 3;

  let riskLevel: News2RiskLevel = 'Low';
  let clinicalAction = 'Routine 12-hourly clinical observation monitoring.';

  if (totalScore >= 7) {
    riskLevel = 'High';
    clinicalAction =
      'CRITICAL: Emergency clinical assessment required. Immediately alert Registered Nurse on duty and escalate via 999 / Emergency Services.';
  } else if (totalScore >= 5 || hasRedScore) {
    riskLevel = 'Medium';
    clinicalAction =
      'URGENT: Urgent clinical review by Registered Nurse within 1 hour. Consider escalation to resident GP / NHS 111.';
  } else if (totalScore >= 1) {
    riskLevel = 'Low';
    clinicalAction = 'Increase observation frequency to 4-6 hourly; inform Nurse in charge.';
  }

  return {
    totalScore,
    hasRedScore,
    riskLevel,
    clinicalAction,
    breakdown: {
      respirationScore: resp,
      spo2Score: spo2,
      airOrOxygenScore: oxy,
      systolicBpScore: bp,
      pulseScore: pulse,
      consciousnessScore: conscious,
      temperatureScore: temp,
    },
  };
}

export interface ResidentAllergy {
  allergen: string;
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Life-Threatening';
}

export interface ResidentRiskRatings {
  fallRisk: 'Low' | 'Medium' | 'High';
  pressureUlcerRisk: 'Low' | 'Medium' | 'High';
  chokingRisk: 'Low' | 'Medium' | 'High';
}

export interface Resident {
  id: string;
  fullName: string;
  preferredName?: string;
  roomNumber: string;
  bedNumber?: string;
  wingName?: string;
  dateOfBirth: string;
  age: number;
  gender: string;
  status: 'Active' | 'Discharged' | 'Hospitalized' | 'Deceased';
  allergies: ResidentAllergy[];
  dnacpr: boolean; // ReSPECT / DNACPR in place
  riskRatings: ResidentRiskRatings;
  mustScore: number;
  fluidTargetMl: number;
  communicationNeeds?: string;
  dietaryRequirements?: string;
  photoUrl?: string | null;
  lastObservationNews2?: number | null;
  lastObservationTime?: string | null;
  riskLevel?: 'High' | 'Medium' | 'Low';
  flags?: string[];
  nextCheckInMinutes?: number;
  latestCareNote?: {
    content: string;
    authorName: string;
    timestamp: string;
  };
}

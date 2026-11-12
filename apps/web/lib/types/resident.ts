import { Bed } from "./facility";
import type {
  PreAdmissionPartCDTO,
  PreAdmissionStatus,
  SupportedLivingDetailsDTO,
} from "@repo/schema";

export interface ResidentProfileType {
  title?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  preferredName?: string | null;
  gender?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  postcode?: string | null;
  country?: string | null;
  insuranceProvider?: string | null;
}

export interface ResidentAdmissionType {
  admissionType?: string | null;
  admissionSource?: string | null;
  weeklyFundingAmount?: number | null;
  topUpAmount?: number | null;
  payer?: string | null;
  paymentFrequency?: string | null;
  isSelfFunder?: boolean;
  localAuthority?: string | null;
}

export interface ResidentCareProfileType {
  careCategory?: string | null;
  primaryCareNeed?: string | null;
  primaryDiagnosis?: string | null;
  careComplexity?: string | null;
  chronicConditions?: string[] | null;
  allergies?: string[] | null;
  mobility?: string | null;
  communityNursePhone?: string | null;
  socialWorkerEmail?: string | null;
}

export interface Resident {
  id: string;
  tenantId: string;
  fullName: string;
  dob: string;
  nhsNumber?: string;
  dnarStatus: boolean;
  fundingType: string;
  status:
    | "Active"
    | "Draft"
    | "Pending"
    | "Discharged"
    | "On Leave"
    | "Deceased"
    | "Hospitalized"
    | "Transferred"
    | string;
  isDraft?: boolean;
  admissionStep?: number;
  keyworkerId?: string;
  admissionDate: string;
  photoUrl?: string;
  preferredCarerIds?: string[];
  doNotAssignIds?: string[];
  requiredCertifications?: string[];
  supportedLivingDetails?: SupportedLivingDetailsDTO | null;
  carePlans?: Array<{
    id: string;
    status: string;
    reviewDate?: string | null;
    nextReviewDate?: string | null;
    versionNumber?: number;
  }>;
  bed?: Bed & {
    room: {
      id: string;
      roomNumber: string;
      wing?: {
        id: string;
        name: string;
        schemeId?: string | null;
        scheme?: {
          id: string;
          name: string;
          referenceId?: string | null;
        } | null;
        propertyDetails?: Record<string, unknown> | null;
        branch?: { id: string; name: string };
      };
    };
  };
  keyworker?: {
    id: string;
    fullName: string;
  };
  profile?: ResidentProfileType | null;
  careProfile?: ResidentCareProfileType | null;
  preAdmissions?: Array<{
    id: string;
    status?: PreAdmissionStatus;
    isCurrent?: boolean;
    partC?: Partial<PreAdmissionPartCDTO> | null;
  }> | null;
  admission?: ResidentAdmissionType | null;
  nextOfKin?: {
    name?: string;
    relationship?: string;
    phoneNumber?: string;
    email?: string;
    address?: string;
  } | null;
  councilDetails?: {
    authority?: string;
    contactName?: string;
    email?: string;
    phone?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

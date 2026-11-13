import { CreateStaffDTO } from "@repo/schema";

export type StaffMember = {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  gender?: string;
  keyWorkerCount?: number;
  role: {
    id: string;
    name: string;
  };
  isActive: boolean;
  isOnLeave?: boolean;
  phoneNumber?: string;
  dob?: string;
  niNumber?: string;
  department?: string;
  dbsNumber?: string;
  dbsExpiryDate?: string;
  dbsStatus?: string | null;
  startDate?: string;
  contractType?: string | null;
  contractedHoursPerWeek?: number | null;
  schemeId?: string | null;
  propertyId?: string | null;
  scheme?: { id: string; name: string } | null;
  property?: { id: string; name: string } | null;
  assignedWings?: {
    id: string;
    name: string;
    unit?: {
      id: string;
      name: string;
    };
  }[];
  assignedRooms?: {
    id: string;
    roomNumber: string;
  }[];
  assignedBeds?: {
    id: string;
    number: string;
  }[];
  createdAt: string;
  updatedAt: string;
  
  // Frontend extended fields (Mocked until backend supports)
  address?: string;
  emergencyContacts?: {
    name: string;
    relation: string;
    phone: string;
    email?: string;
  }[];
  certifications?: {
    id: string;
    name: string;
    issueDate: string;
    expiryDate: string;
    status: "Valid" | "Expiring Soon" | "Expired";
  }[];
  dbsType?: "Standard" | "Enhanced";
  dbsUpdateService?: boolean;
  occupationalHealthClearance?: string;
  immunisations?: {
    name: string;
    date: string;
    status: "Up to date" | "Requires Booster" | "Not Vaccinated";
  }[];
  rightToWork?: {
    documentType: string;
    expiryDate?: string;
    status: "Valid" | "Expiring Soon" | "Expired";
  };
};

export type StaffFormValues = CreateStaffDTO;

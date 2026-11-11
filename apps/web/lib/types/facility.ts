export type FacilityStaff = {
  id: string;
  fullName: string;
  email?: string;
  role: {
    id: string;
    name: string;
  };
};

export type Wing = {
  id: string;
  name: string;
  code: string;
  description?: string;
  primaryContact?: string;
  notes?: string;
  branchId: string;
  branchName?: string;
  branch?: { id: string; name: string };
  totalRooms: number;
  totalBeds: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  staff?: FacilityStaff[];
  rooms?: Room[];
};

export type Room = {
  id: string;
  roomNumber: string;
  type: string;
  name?: string;
  code?: string;
  description?: string;
  primaryContact?: string;
  notes?: string;
  wingId: string;
  wingName?: string;
  branchName?: string;
  wing?: {
    id: string;
    name: string;
    staff?: FacilityStaff[];
    branch?: { id: string; name: string };
  };
  branchId: string;
  totalBeds: number;
  occupiedBeds: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  staff?: FacilityStaff[];
  beds?: Bed[];
};

export type Bed = {
  id: string;
  number?: string;
  code?: string;
  roomId: string;
  roomNumber?: string;
  wingName?: string;
  branchName?: string;
  room?: {
    id: string;
    roomNumber: string;
    staff?: FacilityStaff[];
    wing?: { staff?: FacilityStaff[] };
  };
  wingId: string;
  branchId: string;
  status: string;
  bedLabel?: string;
  bedType?: string;
  bedLength?: number;
  bedWidth?: number;
  safeWorkingLoad?: number;
  heightAdjustment?: string;
  sideRails?: string;
  pressureMattress?: string;
  equipment?: string[];
  specificationNotes?: string;
  availableFrom?: string;
  plannedStatus?: string;
  occupancyAvailableFrom?: string;
  expectedDischargeDate?: string;
  availabilityNotes?: string;
  residentId?: string;
  residentName?: string;
  residentAdmissionDate?: string;
  residentStatus?: string;
  createdAt: string;
  updatedAt: string;
  staff?: FacilityStaff[];
};

export type SchemeItem = {
  id: string;
  tenantId: string;
  branchId: string;
  name: string;
  referenceId?: string | null;
  location?: string | null;
  description?: string | null;
  commissioningLa?: string | null;
  housingPartner?: string | null;
  schemeManagerId?: string | null;
  schemeManagerName?: string | null;
  commissionedHours?: number | null;
  status: string;
  schemeDetails?: {
    housingPartner?: string;
    schemeManagerName?: string;
    targetOccupancy?: number;
    staffIds?: string[];
    residentIds?: string[];
  } | null;
  totalProperties: number;
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  occupancyRate: number;
  properties: Array<{
    id: string;
    name: string;
    code: string | null;
    status: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

export type PropertyRoomTenancy = {
  id: string;
  roomNumber: string;
  name: string | null;
  type: string;
  status: string;
  floor: string | null;
  isAccessible: boolean;
  weeklyRent: number | null;
  tenancyStatus: "In tenancy" | "Void" | "Maintenance";
  notes: string | null;
  beds: Array<{
    id: string;
    bedNumber: string;
    bedCode: string;
    status: string;
    resident: {
      id: string;
      fullName: string;
      nhsNumber: string | null;
      admissionDate: string | null;
      status: string;
      keyWorkerName: string | null;
      supportHoursPerWeek: number | null;
      referenceCode: string | null;
    } | null;
  }>;
};

export type PropertyItem = {
  id: string;
  name: string;
  code: string | null;
  description?: string | null;
  primaryContact?: string | null;
  notes?: string | null;
  status: string;
  branchId: string;
  branchName?: string;
  schemeId?: string | null;
  scheme?: {
    id: string;
    name: string;
    referenceId: string | null;
    housingPartner: string | null;
    commissioningLa: string | null;
  } | null;
  parsedPropertyDetails: {
    referenceId?: string;
    propertyType?: string;
    unitConfiguration?: string;
    streetAddress?: string;
    postcode?: string;
    totalCapacity?: number;
    landlordDetails?: {
      name?: string;
      contactName?: string;
      phone?: string;
      email?: string;
      coreChargePerWeek?: number;
      notes?: string;
    };
    facilities?: string[];
    featuresAndAccessibility?: string[];
    propertyManagerId?: string | null;
    propertyManagerName?: string | null;
    safetyStatus?: "On track" | "Due soon" | "Overdue";
    safetyNotes?: string | null;
    safetyCertificates?: Array<{
      id?: string;
      name: string;
      expiryDate?: string;
      status: "On track" | "Due soon" | "Overdue";
      notes?: string;
    }>;
  };
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  vacantBeds: number;
  maintenanceBeds: number;
  occupancyRate: number;
  safetyEvidenceStatus: "On track" | "Due soon" | "Overdue";
  staffToday: {
    assignedCount: number;
    requiredCount: number;
    shifts: Array<{
      id: string;
      startTime: string;
      endTime: string;
      staffNames: string[];
    }>;
  };
  roomTenancies: PropertyRoomTenancy[];
  createdAt: string;
  updatedAt: string;
};


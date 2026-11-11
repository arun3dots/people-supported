import type { Wing } from '@repo/db';
import type { PropertyDetailsDTO } from '@repo/schema';

export interface PropertyRoomTenancy {
  id: string;
  roomNumber: string;
  name: string | null;
  type: string;
  status: string;
  floor: string | null;
  isAccessible: boolean;
  weeklyRent: number | null;
  tenancyStatus: 'In tenancy' | 'Void' | 'Maintenance';
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
      admissionDate: Date | null;
      status: string;
      keyWorkerName: string | null;
      supportHoursPerWeek: number | null;
      referenceCode: string | null;
    } | null;
  }>;
}

export interface PropertyWithDetails extends Wing {
  branchName?: string;
  scheme?: {
    id: string;
    name: string;
    referenceId: string | null;
    housingPartner: string | null;
    commissioningLa: string | null;
  } | null;
  parsedPropertyDetails: PropertyDetailsDTO;
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  vacantBeds: number;
  maintenanceBeds: number;
  occupancyRate: number;
  safetyEvidenceStatus: 'On track' | 'Due soon' | 'Overdue';
  staffToday: {
    assignedCount: number;
    requiredCount: number;
    shifts: Array<{
      id: string;
      startTime: Date;
      endTime: Date;
      staffNames: string[];
    }>;
  };
  roomTenancies: PropertyRoomTenancy[];
}

export function buildDefaultSafetyCertificates(): NonNullable<
  PropertyDetailsDTO['safetyCertificates']
> {
  return [
    {
      id: 'cp12',
      name: 'Gas Safety Certificate (CP12)',
      status: 'On track',
      expiryDate: '2027-06-30',
      notes: 'Annual landlord gas safety inspection',
    },
    {
      id: 'eicr',
      name: 'Electrical Installation (EICR)',
      status: 'On track',
      expiryDate: '2028-04-15',
      notes: '5-year fixed wire testing',
    },
    {
      id: 'fra',
      name: 'Fire Risk Assessment (FRA)',
      status: 'On track',
      expiryDate: '2027-09-01',
      notes: 'Supported living fire safety review',
    },
    {
      id: 'legionella',
      name: 'Legionella Water Testing',
      status: 'On track',
      expiryDate: '2027-03-31',
      notes: 'Water temperature and flushing schedule',
    },
  ];
}

export function computeSafetyStatus(
  certs?: PropertyDetailsDTO['safetyCertificates'],
): 'On track' | 'Due soon' | 'Overdue' {
  if (!certs || certs.length === 0) return 'On track';
  if (certs.some((c) => c.status === 'Overdue')) return 'Overdue';
  if (certs.some((c) => c.status === 'Due soon')) return 'Due soon';
  return 'On track';
}

export function parsePropertyDetails(raw: unknown): PropertyDetailsDTO {
  if (!raw || typeof raw !== 'object') {
    return {
      propertyType: 'Self-contained flats',
      unitConfiguration: 'Self-contained flats',
      facilities: [],
      featuresAndAccessibility: [],
      safetyCertificates: buildDefaultSafetyCertificates(),
    };
  }
  const obj = raw as Record<string, unknown>;
  const certs = Array.isArray(obj.safetyCertificates)
    ? (obj.safetyCertificates as PropertyDetailsDTO['safetyCertificates'])
    : buildDefaultSafetyCertificates();

  const landlordObj =
    obj.landlordDetails && typeof obj.landlordDetails === 'object'
      ? (obj.landlordDetails as PropertyDetailsDTO['landlordDetails'])
      : typeof obj.housingPartner === 'string'
        ? {
            name: obj.housingPartner,
            coreChargePerWeek:
              typeof obj.coreChargeWeekly === 'number'
                ? obj.coreChargeWeekly
                : undefined,
          }
        : undefined;

  return {
    referenceId:
      typeof obj.referenceId === 'string' ? obj.referenceId : undefined,
    propertyType:
      typeof obj.propertyType === 'string'
        ? obj.propertyType
        : typeof obj.unitConfiguration === 'string'
          ? obj.unitConfiguration
          : 'Self-contained flats',
    unitConfiguration:
      typeof obj.unitConfiguration === 'string'
        ? obj.unitConfiguration
        : typeof obj.propertyType === 'string'
          ? obj.propertyType
          : 'Self-contained flats',
    streetAddress:
      typeof obj.streetAddress === 'string' ? obj.streetAddress : undefined,
    postcode: typeof obj.postcode === 'string' ? obj.postcode : undefined,
    totalCapacity:
      typeof obj.totalCapacity === 'number' ? obj.totalCapacity : undefined,
    landlordDetails: landlordObj,
    propertyManagerId:
      typeof obj.propertyManagerId === 'string' ? obj.propertyManagerId : null,
    propertyManagerName:
      typeof obj.propertyManagerName === 'string'
        ? obj.propertyManagerName
        : typeof obj.teamLeaderName === 'string'
          ? obj.teamLeaderName
          : null,
    safetyStatus:
      obj.safetyStatus === 'Overdue' ||
      obj.safetyStatus === 'Due soon' ||
      obj.safetyStatus === 'On track'
        ? obj.safetyStatus
        : undefined,
    safetyNotes: typeof obj.safetyNotes === 'string' ? obj.safetyNotes : null,
    facilities: Array.isArray(obj.facilities)
      ? obj.facilities.filter((f): f is string => typeof f === 'string')
      : [],
    featuresAndAccessibility: Array.isArray(obj.featuresAndAccessibility)
      ? obj.featuresAndAccessibility.filter(
          (f): f is string => typeof f === 'string',
        )
      : [],
    safetyCertificates: certs,
  };
}

export interface RawPropertyWing extends Wing {
  branch?: { name: string } | null;
  scheme?: {
    id: string;
    name: string;
    referenceId: string | null;
    commissioningLa: string | null;
    schemeDetails: unknown;
  } | null;
  shifts: Array<{
    id: string;
    startTime: Date;
    endTime: Date;
    assignments: Array<{
      userId: string;
      user: { id: string; fullName: string };
    }>;
  }>;
  rooms: Array<{
    id: string;
    roomNumber: string;
    name: string | null;
    type: string;
    status: string;
    description: string | null;
    notes: string | null;
    beds: Array<{
      id: string;
      number: string | null;
      code: string | null;
      status: string;
      resident: {
        id: string;
        fullName: string;
        nhsNumber: string | null;
        admissionDate: Date | null;
        status: string;
        supportedLivingDetails: unknown;
        keyworker: { id: string; fullName: string } | null;
      } | null;
    }>;
  }>;
}

export function mapWingToPropertyWithDetails(
  w: RawPropertyWing,
): PropertyWithDetails {
  const parsedDetails = parsePropertyDetails(w.propertyDetails);
  const rawObj =
    w.propertyDetails && typeof w.propertyDetails === 'object'
      ? (w.propertyDetails as Record<string, unknown>)
      : {};
  const roomMetaMap =
    rawObj.roomMetaMap && typeof rawObj.roomMetaMap === 'object'
      ? (rawObj.roomMetaMap as Record<
          string,
          {
            weeklyRent?: number | null;
            floor?: string | null;
            isAccessible?: boolean;
          }
        >)
      : {};

  let totalBeds = 0;
  let occupiedBeds = 0;
  let maintenanceBeds = 0;

  const roomTenancies: PropertyRoomTenancy[] = w.rooms.map((r) => {
    const meta = roomMetaMap[r.roomNumber] ?? {};
    const bedsMapped = r.beds.map((b) => {
      totalBeds++;
      if (b.status === 'Occupied' || b.resident) occupiedBeds++;
      else if (b.status === 'Maintenance' || r.status === 'Maintenance') {
        maintenanceBeds++;
      }
      const sl =
        b.resident?.supportedLivingDetails &&
        typeof b.resident.supportedLivingDetails === 'object'
          ? (b.resident.supportedLivingDetails as Record<string, unknown>)
          : {};
      return {
        id: b.id,
        bedNumber: b.number ?? 'Bed 1',
        bedCode: b.code ?? '',
        status: b.status,
        resident: b.resident
          ? {
              id: b.resident.id,
              fullName: b.resident.fullName,
              nhsNumber: b.resident.nhsNumber,
              admissionDate: b.resident.admissionDate,
              status: b.resident.status,
              keyWorkerName: b.resident.keyworker?.fullName ?? null,
              supportHoursPerWeek:
                typeof sl.supportHoursPerWeek === 'number'
                  ? sl.supportHoursPerWeek
                  : null,
              referenceCode:
                typeof sl.referenceCode === 'string' ? sl.referenceCode : null,
            }
          : null,
      };
    });

    const hasOccupant = bedsMapped.some((b) => b.resident !== null);
    const isMaint =
      r.status === 'Maintenance' ||
      bedsMapped.some((b) => b.status === 'Maintenance');

    return {
      id: r.id,
      roomNumber: r.roomNumber,
      name: r.name,
      type: r.type,
      status: r.status,
      floor: meta.floor ?? r.description ?? 'Ground floor',
      isAccessible:
        Boolean(meta.isAccessible) ||
        Boolean(r.description?.toLowerCase().includes('accessible')),
      weeklyRent: typeof meta.weeklyRent === 'number' ? meta.weeklyRent : null,
      tenancyStatus: hasOccupant
        ? 'In tenancy'
        : isMaint
          ? 'Maintenance'
          : 'Void',
      notes: r.notes,
      beds: bedsMapped,
    };
  });

  const vacantBeds = Math.max(0, totalBeds - occupiedBeds - maintenanceBeds);
  const occupancyRate =
    totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const assignedStaffSet = new Set<string>();
  const shiftSummaries = w.shifts.map((s) => ({
    id: s.id,
    startTime: s.startTime,
    endTime: s.endTime,
    staffNames: s.assignments.map((a) => {
      assignedStaffSet.add(a.userId);
      return a.user.fullName;
    }),
  }));

  const schemeDetailsObj =
    w.scheme?.schemeDetails && typeof w.scheme.schemeDetails === 'object'
      ? (w.scheme.schemeDetails as Record<string, unknown>)
      : {};

  const assignedCount = assignedStaffSet.size;
  return {
    ...w,
    branchName: w.branch?.name,
    scheme: w.scheme
      ? {
          id: w.scheme.id,
          name: w.scheme.name,
          referenceId: w.scheme.referenceId,
          housingPartner:
            typeof schemeDetailsObj.housingPartner === 'string'
              ? schemeDetailsObj.housingPartner
              : (parsedDetails.landlordDetails?.name ?? null),
          commissioningLa: w.scheme.commissioningLa,
        }
      : null,
    parsedPropertyDetails: parsedDetails,
    totalRooms: w.rooms.length,
    totalBeds,
    occupiedBeds,
    vacantBeds,
    maintenanceBeds,
    occupancyRate,
    safetyEvidenceStatus:
      parsedDetails.safetyStatus ??
      computeSafetyStatus(parsedDetails.safetyCertificates),
    staffToday: {
      assignedCount,
      requiredCount: Math.max(assignedCount, w.shifts.length || 2),
      shifts: shiftSummaries,
    },
    roomTenancies,
  };
}

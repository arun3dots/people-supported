import { z } from "zod";
import { paginationQuerySchema } from "./common/pagination";

export const createBranchSchema = z.object({
  name: z.string().min(2, "Branch name is required"),
  code: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional(),
  status: z.string().min(1, "Branch status is required").optional(),
});

export const updateBranchSchema = createBranchSchema.partial();

export const landlordDetailsSchema = z.object({
  name: z.string().optional(),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  coreChargePerWeek: z.number().optional(),
  notes: z.string().optional(),
});

export const safetyCertificateItemSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  expiryDate: z.string().optional(),
  status: z.enum(["On track", "Due soon", "Overdue"]).default("On track"),
  notes: z.string().optional(),
});

export const propertyDetailsSchema = z.object({
  referenceId: z.string().optional(),
  propertyType: z.string().optional(),
  unitConfiguration: z.string().optional(),
  streetAddress: z.string().optional(),
  postcode: z.string().optional(),
  landlordDetails: landlordDetailsSchema.optional(),
  totalCapacity: z.number().int().min(0).optional(),
  facilities: z.array(z.string()).optional(),
  featuresAndAccessibility: z.array(z.string()).optional(),
  propertyManagerId: z.string().optional().nullable(),
  propertyManagerName: z.string().optional().nullable(),
  safetyStatus: z.enum(["On track", "Due soon", "Overdue"]).optional(),
  safetyNotes: z.string().optional().nullable(),
  safetyCertificates: z.array(safetyCertificateItemSchema).optional(),
});

export type PropertyDetailsDTO = z.infer<typeof propertyDetailsSchema>;

export const schemeDetailsSchema = z.object({
  housingPartner: z.string().optional(),
  schemeManagerName: z.string().optional(),
  targetOccupancy: z.number().optional(),
  staffIds: z.array(z.string()).optional(),
  residentIds: z.array(z.string()).optional(),
});

export type SchemeDetailsDTO = z.infer<typeof schemeDetailsSchema>;

export const createSchemeSchema = z.object({
  branchId: z.string().uuid("Invalid branch selected").optional(),
  name: z.string().min(2, "Scheme name is required"),
  referenceId: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  commissioningLa: z.string().optional(),
  schemeManagerId: z.string().optional().nullable(),
  commissionedHours: z.number().min(0).optional(),
  status: z.string().default("Active").optional(),
  schemeDetails: schemeDetailsSchema.optional(),
  propertyIds: z.array(z.string()).optional(),
});

export const updateSchemeSchema = createSchemeSchema.partial();

export type CreateSchemeDTO = z.infer<typeof createSchemeSchema>;
export type UpdateSchemeDTO = z.infer<typeof updateSchemeSchema>;

export const propertyRoomDraftSchema = z.object({
  roomNumber: z.string().min(1, "Room/Flat number is required"),
  name: z.string().optional(),
  type: z.string().default("Single"),
  floor: z.string().optional(),
  weeklyRent: z.number().min(0).optional(),
  isAccessible: z.boolean().optional(),
  notes: z.string().optional(),
  bedsCount: z.number().int().min(1).max(10).default(1),
  bedLabels: z.array(z.string()).optional(),
});

export type PropertyRoomDraftDTO = z.infer<typeof propertyRoomDraftSchema>;

export const createPropertyWithRoomsSchema = z.object({
  branchId: z.string().uuid("Invalid branch selected").optional(),
  name: z.string().min(2, "Property name is required"),
  code: z.string().optional(),
  schemeId: z.string().uuid().optional().nullable(),
  description: z.string().optional(),
  primaryContact: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().default("Active").optional(),
  propertyDetails: propertyDetailsSchema.optional(),
  rooms: z.array(propertyRoomDraftSchema).optional(),
});

export const updatePropertySchema = createPropertyWithRoomsSchema.partial();

export type CreatePropertyWithRoomsDTO = z.infer<typeof createPropertyWithRoomsSchema>;
export type UpdatePropertyDTO = z.infer<typeof updatePropertySchema>;

export const createWingSchema = z.object({
  // Optional: branch-assigned callers get branchId from their JWT
  // (req.user.activeBranchId); only tenant-wide callers with no active
  // branch need to supply it explicitly here.
  branchId: z.string().uuid("Invalid branch selected").optional(),
  schemeId: z.string().uuid().optional().nullable(),
  name: z.string().min(2, "Wing name is required"),
  code: z.string().optional(),
  description: z.string().optional(),
  primaryContact: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().min(1, "Wing status is required").optional(),
  propertyDetails: propertyDetailsSchema.optional(),
});

export const updateWingSchema = createWingSchema.partial();

export const createRoomSchema = z.object({
  wingId: z.string().uuid("Invalid wing selected"),
  roomNumber: z.string().min(1, "Room number is required"),
  type: z.string().min(1, "Room type is required"), // Single, Double, Ensuite
  code: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  primaryContact: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().min(1, "Room status is required").optional(),
});

export const updateRoomSchema = createRoomSchema.partial();

export const bedStatusSchema = z.enum(["Available", "Occupied", "Maintenance", "Reserved"]);

export const createBedSchema = z.object({
  roomId: z.string().uuid("Invalid room selected"),
  bedNumber: z.string().min(1, "Bed number is required"),
  bedCode: z.string().optional(),
  status: bedStatusSchema,
  quantity: z.number().min(1).max(10).optional(),
  // Step 1 — Bed Details
  bedLabel: z.string().optional(),
  bedType: z.string().optional(),
  // Step 2 — Specifications. These map to 32-bit `Int` DB columns, so bound
  // them to the signed integer range to avoid Prisma overflow errors.
  bedLength: z.number().int().min(-2147483648).max(2147483647).optional(),
  bedWidth: z.number().int().min(-2147483648).max(2147483647).optional(),
  safeWorkingLoad: z
    .number()
    .int()
    .min(-2147483648)
    .max(2147483647)
    .optional(),
  heightAdjustment: z.string().optional(),
  sideRails: z.string().optional(),
  pressureMattress: z.string().optional(),
  equipment: z.array(z.string()).optional(),
  specificationNotes: z.string().optional(),
  // Step 3 — Availability
  availableFrom: z.string().optional(),
  plannedStatus: z.string().optional(),
  occupancyAvailableFrom: z.string().optional(),
  expectedDischargeDate: z.string().optional(),
  availabilityNotes: z.string().optional(),
  // Relation
  residentId: z.string().uuid("Invalid resident selected").optional(),
});

export const updateBedSchema = createBedSchema.partial();

export type CreateBranchDTO = z.infer<typeof createBranchSchema>;
export type UpdateBranchDTO = z.infer<typeof updateBranchSchema>;
export type CreateWingDTO = z.infer<typeof createWingSchema>;
export type UpdateWingDTO = z.infer<typeof updateWingSchema>;
export type CreateRoomDTO = z.infer<typeof createRoomSchema>;
export type UpdateRoomDTO = z.infer<typeof updateRoomSchema>;
export type CreateBedDTO = z.infer<typeof createBedSchema>;
export type UpdateBedDTO = z.infer<typeof updateBedSchema>;
export type BedStatus = z.infer<typeof bedStatusSchema>;

// --- Facility list queries ---
// page/limit/search/all come from paginationQuerySchema. Facility lists read
// most naturally in ascending name/number order, so each overrides sortOrder.

export const schemeListQuerySchema = paginationQuerySchema.extend({
  branchId: z.string().optional(),
  status: z.string().optional(),
  sortBy: z.enum(["name", "createdAt"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const wingListQuerySchema = paginationQuerySchema.extend({
  branchId: z.string().optional(),
  schemeId: z.string().optional(),
  status: z.string().optional(),
  unitType: z.string().optional(),
  safetyStatus: z.string().optional(),
  sortBy: z.enum(["name", "code", "createdAt"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const roomListQuerySchema = paginationQuerySchema.extend({
  branchId: z.string().optional(),
  wingId: z.string().optional(),
  /** Display label from the Room Type dropdown, e.g. "Single". */
  type: z.string().optional(),
  status: z.string().optional(),
  sortBy: z.enum(["roomNumber", "name", "createdAt"]).default("roomNumber"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const bedListQuerySchema = paginationQuerySchema.extend({
  branchId: z.string().optional(),
  wingId: z.string().optional(),
  roomId: z.string().optional(),
  /** "Occupied" also matches any bed with a resident assigned. */
  status: z.string().optional(),
  sortBy: z.enum(["number", "createdAt"]).default("number"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

/** Parsed shapes the services receive (defaults applied). */
export type SchemeListQueryDTO = z.infer<typeof schemeListQuerySchema>;
export type WingListQueryDTO = z.infer<typeof wingListQuerySchema>;
export type RoomListQueryDTO = z.infer<typeof roomListQuerySchema>;
export type BedListQueryDTO = z.infer<typeof bedListQuerySchema>;

/** Partial shapes the web hooks send. */
export type SchemeListQueryInput = z.input<typeof schemeListQuerySchema>;
export type WingListQueryInput = z.input<typeof wingListQuerySchema>;
export type RoomListQueryInput = z.input<typeof roomListQuerySchema>;
export type BedListQueryInput = z.input<typeof bedListQuerySchema>;

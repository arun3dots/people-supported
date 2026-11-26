import { z } from "zod";

export const accessSlugSchema = z.string().regex(/^[a-z][a-z0-9-]{0,62}$/);
export const accessServiceTokenSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{43,128}$/);
const permission = z
  .string()
  .regex(/^[a-zA-Z][a-zA-Z0-9]*\.[a-zA-Z][a-zA-Z0-9]*$/)
  .max(100);
export const accessPermissionsSchema = z
  .array(permission)
  .max(256)
  .refine(
    (items) => new Set(items).size === items.length,
    "Duplicate permissions",
  );

export const supportedLivingAccessCatalog = [
  "riskAssessments.read",
  "riskAssessments.write",
  "riskAssessments.delete",
  "riskAssessments.approve",
  "riskAssessments.manageTemplates",
] as const;

export const accessActorSchema = z
  .object({
    issuer: z.string().url().max(300),
    subject: z.string().min(1).max(128),
    tenantId: z.string().uuid(),
    authenticatedAt: z.string().datetime(),
  })
  .strict();

export const accessDecisionSchema = z
  .object({
    permissions: accessPermissionsSchema,
    canManage: z.boolean(),
  })
  .strict();

const roleFields = {
  name: z.string().trim().min(2).max(80),
  permissions: accessPermissionsSchema,
};

export const accessRoleCreateSchema = z
  .object({
    key: accessSlugSchema,
    ...roleFields,
  })
  .strict();
export const accessRoleUpdateSchema = z
  .object({
    ...roleFields,
    version: z.number().int().positive(),
  })
  .strict();
export const accessRoleSchema = accessRoleCreateSchema
  .extend({
    version: z.number().int().positive(),
    editable: z.boolean(),
  })
  .strict();
export const accessMemberSchema = z
  .object({
    userId: z.string().uuid(),
    name: z.string().max(150).nullable(),
    roleKey: accessSlugSchema,
    enabled: z.boolean(),
    editable: z.boolean(),
    version: z.number().int().positive(),
  })
  .strict();
export const accessMemberUpdateSchema = z
  .object({
    roleKey: accessSlugSchema,
    enabled: z.boolean(),
    version: z.number().int().positive(),
  })
  .strict();
export const accessConsoleSchema = z
  .object({
    product: accessSlugSchema,
    permissions: accessPermissionsSchema,
    delegablePermissions: accessPermissionsSchema,
    roles: z.array(accessRoleSchema),
    members: z.array(accessMemberSchema),
  })
  .strict();

export const accessCreateCommandSchema = z
  .object({
    actor: accessActorSchema,
    role: accessRoleCreateSchema,
  })
  .strict();
export const accessUpdateCommandSchema = z
  .object({
    actor: accessActorSchema,
    role: accessRoleUpdateSchema,
  })
  .strict();
export const accessMemberCommandSchema = z
  .object({
    actor: accessActorSchema,
    membership: accessMemberUpdateSchema,
  })
  .strict();

export type AccessActor = z.infer<typeof accessActorSchema>;
export type AccessDecision = z.infer<typeof accessDecisionSchema>;
export type AccessRoleCreate = z.infer<typeof accessRoleCreateSchema>;
export type AccessRoleUpdate = z.infer<typeof accessRoleUpdateSchema>;
export type AccessRole = z.infer<typeof accessRoleSchema>;
export type AccessMember = z.infer<typeof accessMemberSchema>;
export type AccessMemberUpdate = z.infer<typeof accessMemberUpdateSchema>;
export type AccessConsole = z.infer<typeof accessConsoleSchema>;
export type AccessCreateCommand = z.infer<typeof accessCreateCommandSchema>;
export type AccessUpdateCommand = z.infer<typeof accessUpdateCommandSchema>;
export type AccessMemberCommand = z.infer<typeof accessMemberCommandSchema>;

const staffEnrollmentKey = z.object({
  productUserId: z.string().uuid(),
  tenantId: z.string().uuid(),
});

export const reserveAccessStaffSchema = z
  .object({
    actor: accessActorSchema,
    productUserId: staffEnrollmentKey.shape.productUserId,
    roleKey: accessSlugSchema,
  })
  .strict();

export const completeAccessStaffSchema = staffEnrollmentKey
  .extend({
    issuer: accessActorSchema.shape.issuer,
    subject: accessActorSchema.shape.subject,
    roleKey: accessSlugSchema,
    name: z.string().trim().min(2).max(150),
  })
  .strict();

export const accessStaffResultSchema = z
  .object({ ok: z.literal(true) })
  .strict();
export type ReserveAccessStaff = z.infer<typeof reserveAccessStaffSchema>;
export type CompleteAccessStaff = z.infer<typeof completeAccessStaffSchema>;

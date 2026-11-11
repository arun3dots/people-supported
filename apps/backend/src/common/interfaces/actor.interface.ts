export interface ActorContext {
  tenantId: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  roleName?: string;
  ipAddress?: string;
  userAgent?: string;
}

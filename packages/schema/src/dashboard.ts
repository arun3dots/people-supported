import { z } from "zod";

export const DashboardAlertSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  timestamp: z.string(),
});
export type DashboardAlertDTO = z.infer<typeof DashboardAlertSchema>;

export const DashboardActivitySchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  description: z.string(),
  timestamp: z.string(),
  actorName: z.string().optional(),
});
export type DashboardActivityDTO = z.infer<typeof DashboardActivitySchema>;

export const DashboardSummarySchema = z.object({
  totalResidents: z.number(),
  activeResidents: z.number().optional(),
  occupancyRate: z.number(),
  occupiedBeds: z.number().optional(),
  activeStaff: z.number(),
  staffOnDuty: z.number().optional(),
  staffOnLeave: z.number().optional(),
  totalBeds: z.number().optional(),
  pendingTasks: z.number(),
  openIncidents: z.number().optional(),
  totalRevenue: z.number().optional(),
  monthlyRevenue: z.number().optional(),
  totalOutstanding: z.number().optional(),
  criticalResidents: z.array(
    z.object({
      id: z.string(),
      fullName: z.string(),
      photoUrl: z.string().nullable().optional(),
    })
  ),
  alerts: z.array(DashboardAlertSchema),
  recentActivity: z.array(DashboardActivitySchema),
});
export type DashboardSummaryDTO = z.infer<typeof DashboardSummarySchema>;
export type AdminStatsDTO = DashboardSummaryDTO;

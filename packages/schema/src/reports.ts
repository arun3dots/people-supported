import { z } from "zod";

export const reportExportQuerySchema = z.object({
  branchId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type ReportExportQueryDTO = z.infer<typeof reportExportQuerySchema>;

export const reportCsvResponseSchema = z.object({
  filename: z.string(),
  content: z.string(),
  rowCount: z.number(),
});

export type ReportCsvResponseDTO = z.infer<typeof reportCsvResponseSchema>;

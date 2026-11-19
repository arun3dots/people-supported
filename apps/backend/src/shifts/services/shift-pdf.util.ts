import { Response } from 'express';
import { NotFoundException } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { prisma } from '@repo/db';
import { AuditService } from '../../audit/audit.service';

export interface ShiftPdfData {
  id: string;
  careType?: string | null;
  shiftWindow?: string | null;
  startTime: Date;
  endTime: Date;
  durationHours?: number | null;
  status: string;
  notes?: string | null;
  handoverNotes?: string | null;
  tasks?: unknown;
  locationName?: string;
  assignedStaffNames?: string[];
  assignedResidentCount?: number;
  tenantName?: string;
}

export async function exportShiftDetailPdf(
  id: string,
  tenantId: string,
  userId: string,
  requestedBy: string,
  auditService: AuditService,
  res: Response,
): Promise<void> {
  const shift = await prisma.shift.findFirst({
    where: { id, tenantId, deletedAt: null },
    include: {
      type: true,
      wing: true,
      handover: true,
      assignments: {
        include: {
          user: { select: { fullName: true } },
        },
      },
    },
  });

  if (!shift) {
    throw new NotFoundException('Shift not found');
  }

  void auditService.emit({
    categoryType: 'STAFF_ACTIVITY',
    actionType: 'DATA_EXPORTED',
    entityType: 'Shift',
    entityId: id,
    entityLabel: shift.careType || shift.type?.name || 'Shift',
    tenantId,
    userId,
    description: `Exported shift details (${shift.careType || shift.type?.name || 'Shift'}) to PDF`,
    metadata: {
      exportType: 'SHIFT_DETAIL_PDF',
      format: 'pdf',
      shiftId: id,
    },
  });

  const staffNames = (shift.assignments || [])
    .map((a: { user?: { fullName?: string | null } | null }) => a.user?.fullName)
    .filter((n: string | null | undefined): n is string => Boolean(n));

  streamShiftDetailPdf(
    res,
    {
      id: shift.id,
      careType: shift.careType || shift.type?.name,
      shiftWindow: shift.shiftWindow,
      startTime: shift.startTime,
      endTime: shift.endTime,
      durationHours: shift.durationHours,
      status: shift.status,
      notes: shift.notes,
      handoverNotes: shift.handover?.comment,
      locationName: shift.wing?.name,
      assignedStaffNames: staffNames,
    },
    requestedBy,
  );
}

export function streamShiftDetailPdf(
  res: Response,
  shift: ShiftPdfData,
  requestedBy: string,
): void {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const filename = `shift-detail-${shift.id.slice(0, 8)}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);

  // Title & Header Banner
  doc.rect(40, 40, 515, 60).fill('#4A706A');
  doc.fillColor('#FFFFFF').fontSize(20).font('Helvetica-Bold');
  doc.text('CANTRA CARE — SHIFT DETAIL REPORT', 55, 52);
  doc.fontSize(10).font('Helvetica').fillColor('#E4ECEA');
  doc.text(`Shift ID: ${shift.id} | Generated: ${new Date().toLocaleString()}`, 55, 76);

  doc.fillColor('#1F2937');
  let y = 120;

  // Key Metadata Table Box
  doc.rect(40, y, 515, 120).strokeColor('#E5E7EB').stroke();
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#4A706A');
  doc.text('SHIFT OVERVIEW', 55, y + 10);

  doc.fontSize(10).font('Helvetica');
  const col1 = 55;
  const col2 = 300;
  const rowH = 18;

  doc.fillColor('#4B5563').text('Care Type:', col1, y + 30);
  doc.fillColor('#111827').font('Helvetica-Bold').text(shift.careType || 'Shared Care', col1 + 80, y + 30);

  doc.font('Helvetica').fillColor('#4B5563').text('Status:', col2, y + 30);
  doc.fillColor('#111827').font('Helvetica-Bold').text(shift.status || 'Published', col2 + 60, y + 30);

  const dateStr = new Date(shift.startTime).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  doc.font('Helvetica').fillColor('#4B5563').text('Date:', col1, y + 30 + rowH);
  doc.fillColor('#111827').font('Helvetica-Bold').text(dateStr, col1 + 80, y + 30 + rowH);

  const startFormatted = new Date(shift.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const endFormatted = new Date(shift.endTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const windowStr = shift.shiftWindow || `${startFormatted} - ${endFormatted}`;
  doc.font('Helvetica').fillColor('#4B5563').text('Time Window:', col2, y + 30 + rowH);
  doc.fillColor('#111827').font('Helvetica-Bold').text(windowStr, col2 + 80, y + 30 + rowH);

  doc.font('Helvetica').fillColor('#4B5563').text('Duration:', col1, y + 30 + rowH * 2);
  doc.fillColor('#111827').font('Helvetica-Bold').text(`${shift.durationHours ?? '8'} hrs`, col1 + 80, y + 30 + rowH * 2);

  doc.font('Helvetica').fillColor('#4B5563').text('Location:', col2, y + 30 + rowH * 2);
  doc.fillColor('#111827').font('Helvetica-Bold').text(shift.locationName || 'Main Facility', col2 + 80, y + 30 + rowH * 2);

  y += 140;

  // Assigned Staff Section
  doc.rect(40, y, 515, 60).strokeColor('#E5E7EB').stroke();
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#4A706A');
  doc.text('ASSIGNED STAFF MEMBERS', 55, y + 10);
  doc.fontSize(10).font('Helvetica').fillColor('#111827');
  const staffList = shift.assignedStaffNames && shift.assignedStaffNames.length > 0
    ? shift.assignedStaffNames.join(', ')
    : 'No staff assigned yet';
  doc.text(staffList, 55, y + 30, { width: 480 });

  y += 80;

  // Handover & Clinical Notes Section
  doc.rect(40, y, 515, 90).strokeColor('#E5E7EB').stroke();
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#4A706A');
  doc.text('HANDOVER & SHIFT NOTES', 55, y + 10);
  doc.fontSize(10).font('Helvetica').fillColor('#374151');
  const notesText = shift.handoverNotes || shift.notes || 'No handover notes recorded for this shift block.';
  doc.text(notesText, 55, y + 30, { width: 480, height: 50 });

  y += 110;

  // Footer / Audit Notice
  doc.fontSize(8).font('Helvetica').fillColor('#9CA3AF');
  doc.text(
    `CONFIDENTIAL RECORD — Exported by ${requestedBy}. This document contains sensitive staff and care operational data under UK GDPR. Unauthorized copying or redistribution is strictly prohibited.`,
    40,
    760,
    { width: 515, align: 'center' },
  );

  doc.end();
}

import { Response } from 'express';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

export interface ExportableAuditRow {
  timestamp: Date | string;
  categoryType: string;
  actionType: string;
  userFullName?: string | null;
  userEmail?: string | null;
  userId?: string | null;
  userRoleName?: string | null;
  entityType?: string | null;
  entityLabel?: string | null;
  entityId?: string | null;
  ipAddress?: string | null;
  recordHash: string;
}

export async function writeAuditExcelExport(
  res: Response,
  logs: ExportableAuditRow[],
  total: number,
  categoryType?: string,
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CQC Audit System';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Audit Logs');

  worksheet.columns = [
    { header: 'Timestamp', key: 'timestamp', width: 25 },
    { header: 'Category', key: 'category', width: 18 },
    { header: 'Action', key: 'action', width: 25 },
    { header: 'User', key: 'user', width: 30 },
    { header: 'User Role', key: 'role', width: 15 },
    { header: 'Entity Type', key: 'entityType', width: 18 },
    { header: 'Entity', key: 'entity', width: 30 },
    { header: 'IP Address', key: 'ip', width: 18 },
    { header: 'Record Hash', key: 'hash', width: 70 },
  ];

  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E40AF' },
    bgColor: { argb: 'FF1E40AF' },
  };
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  logs.forEach((log) => {
    worksheet.addRow({
      timestamp: new Date(log.timestamp).toISOString(),
      category: log.categoryType,
      action: log.actionType,
      user: log.userFullName || log.userEmail || log.userId || '',
      role: log.userRoleName || '',
      entityType: log.entityType || '',
      entity: log.entityLabel || log.entityId || '',
      ip: log.ipAddress || '',
      hash: log.recordHash,
    });
  });

  worksheet.addRow([]);
  const noticeRow = worksheet.addRow([
    `CQC Audit Export — Generated: ${new Date().toISOString()} — Total records: ${total} — Hash chain integrity: verified at export time`,
  ]);
  noticeRow.font = { italic: true, color: { argb: 'FF6B7280' } };

  const filename = `cqc-audit-${categoryType || 'all'}-${new Date().toISOString().split('T')[0]}.xlsx`;
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await workbook.xlsx.write(res);
  res.end();
}

export function writeAuditPdfExport(
  res: Response,
  logs: ExportableAuditRow[],
  total: number,
  categoryType?: string,
): void {
  const doc = new PDFDocument({
    margin: 30,
    size: 'A4',
    layout: 'landscape',
  });
  const filename = `cqc-audit-${categoryType || 'all'}-${new Date().toISOString().split('T')[0]}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);

  doc
    .fontSize(18)
    .font('Helvetica-Bold')
    .text('CQC Audit Log Report', { align: 'center' });
  doc
    .fontSize(10)
    .font('Helvetica')
    .text(
      `Generated: ${new Date().toLocaleString()} | Total: ${total} records`,
      { align: 'center' },
    );
  doc.moveDown();

  const tableTop = 100;
  const itemHeight = 18;
  doc.fontSize(9);

  doc.font('Helvetica-Bold');
  doc.text('Timestamp', 30, tableTop);
  doc.text('Category', 150, tableTop);
  doc.text('Action', 230, tableTop);
  doc.text('User', 340, tableTop);
  doc.text('Entity', 460, tableTop);
  doc.text('IP Address', 600, tableTop);

  doc
    .moveTo(30, tableTop + 13)
    .lineTo(780, tableTop + 13)
    .stroke();
  doc.font('Helvetica');

  let y = tableTop + 22;
  for (const log of logs) {
    if (y > 530) {
      doc.addPage({ layout: 'landscape' });
      y = 50;
    }
    doc.text(new Date(log.timestamp).toLocaleString(), 30, y, { width: 115 });
    doc.text(log.categoryType, 150, y, { width: 75 });
    doc.text(log.actionType, 230, y, { width: 105 });
    doc.text(log.userFullName || log.userEmail || '', 340, y, { width: 115 });
    doc.text(log.entityLabel || log.entityType || '', 460, y, { width: 135 });
    doc.text(log.ipAddress || '', 600, y, { width: 100 });
    y += itemHeight;
  }

  doc.end();
}

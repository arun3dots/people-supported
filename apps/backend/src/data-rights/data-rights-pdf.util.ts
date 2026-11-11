import { Response } from 'express';
import PDFDocument from 'pdfkit';

export function streamSarDossierPdf(
  res: Response,
  title: string,
  filename: string,
  bundle: Record<string, unknown>,
): void {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);

  doc.fontSize(18).font('Helvetica-Bold').text(title, { align: 'center' });
  doc
    .fontSize(10)
    .font('Helvetica')
    .text(
      `UK GDPR Article 15 Subject Access & Article 20 Portability Export | Generated: ${new Date().toISOString()}`,
      { align: 'center' },
    );
  doc.moveDown();

  // Mandatory Third-Party Redaction Notice (UK GDPR Art 15(4))
  doc
    .fontSize(11)
    .font('Helvetica-Bold')
    .fillColor('#991B1B')
    .text('IMPORTANT DISCLOSURE & REDACTION CHECKLIST (UK GDPR Art 15(4))');
  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#1F2937')
    .text(
      'Before releasing this dossier to the data subject or their verified representative, the Care Home Controller must review free-text notes, incident reports, and family communications to redact personal data identifying third parties (other residents, relatives, or non-professional informants) unless they have consented or disclosure is reasonable without consent.',
    );
  doc.moveDown();

  for (const [sectionKey, sectionVal] of Object.entries(bundle)) {
    if (sectionKey === 'redactionGuidance') continue;
    if (doc.y > 700) doc.addPage();

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#1E3A8A')
      .text(sectionKey.toUpperCase());
    doc.moveDown(0.3);

    const formatted = JSON.stringify(sectionVal, null, 2);
    const truncated =
      formatted.length > 6000
        ? `${formatted.slice(0, 6000)}\n... [Truncated in PDF preview; see JSON export for full machine-readable array]`
        : formatted;

    doc
      .fontSize(8)
      .font('Courier')
      .fillColor('#111827')
      .text(truncated, { width: 510 });
    doc.moveDown(0.8);
  }

  doc.end();
}

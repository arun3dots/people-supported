import { Injectable } from '@nestjs/common';
import type { EmergencyResidentSummaryDTO } from '@repo/schema';

@Injectable()
export class EmergencyHandoverPackService {
  /**
   * I-06: One-Click Print Emergency MAR & Handover Pack (CQC Reg 12 & NICE SC1).
   * Generates clean, high-contrast, device-agnostic printable HTML for offline continuity.
   */
  generatePrintableHtml(summary: EmergencyResidentSummaryDTO): string {
    const generatedAt = new Date().toLocaleString('en-GB', {
      timeZone: 'Europe/London',
    });

    const prescriptionsRows =
      summary.medications.length > 0
        ? summary.medications
            .map(
              (m) => `
          <tr>
            <td style="border:1px solid #334155;padding:6px;font-weight:bold;">${m.drugName}</td>
            <td style="border:1px solid #334155;padding:6px;">${m.dose}</td>
            <td style="border:1px solid #334155;padding:6px;">${m.form ?? 'Oral'}</td>
            <td style="border:1px solid #334155;padding:6px;">${m.times.join(', ') || 'PRN'}</td>
            <td style="border:1px solid #334155;padding:6px;font-size:11px;">${m.instructions ?? '-'}</td>
            <td style="border:1px solid #334155;padding:4px;min-width:140px;text-align:center;font-size:10px;color:#64748b;">
              [ Initials / Time ]
            </td>
          </tr>
        `,
            )
            .join('')
        : '<tr><td colspan="6" style="border:1px solid #334155;padding:8px;text-align:center;">No active prescriptions recorded</td></tr>';

    const contactsList =
      summary.emergencyContacts.length > 0
        ? summary.emergencyContacts
            .map(
              (c) =>
                `<li><strong>${c.name}</strong> (${c.relationship}): ${c.phone}${c.isPrimary ? ' <span style="color:#047857;font-weight:bold;">[PRIMARY]</span>' : ''}</li>`,
            )
            .join('')
        : '<li>No emergency contacts listed</li>';

    const obs = summary.latestObservation;
    const obsText = obs
      ? `NEWS2: ${obs.news2Score ?? 'N/A'} | BP: ${obs.bpSystolic && obs.bpDiastolic ? `${obs.bpSystolic}/${obs.bpDiastolic}` : 'N/A'} | Pulse: ${obs.pulse ? obs.pulse + ' bpm' : 'N/A'} | Temp: ${obs.temp ? obs.temp + ' °C' : 'N/A'} | SpO2: ${obs.spo2 ? obs.spo2 + '%' : 'N/A'} | Resp: ${obs.respiration ? obs.respiration + '/min' : 'N/A'}`
      : 'No vitals recorded recently';

    const allergyList = [
      ...summary.allergies.medication,
      ...summary.allergies.food,
      ...summary.allergies.other,
    ];
    const allergies = allergyList.join(', ') || 'No known allergies (NKDA)';
    const dnacprNotice = summary.dnacpr
      ? `<div style="background:#fef2f2;border:2px solid #b91c1c;color:#991b1b;padding:8px;font-weight:bold;margin-bottom:12px;border-radius:4px;text-align:center;">
             DNACPR IN PLACE — DO NOT ATTEMPT RESUSCITATION
           </div>`
      : `<div style="background:#f0fdf4;border:1px solid #16a34a;color:#166534;padding:6px;font-weight:bold;margin-bottom:12px;border-radius:4px;">
             Resuscitation Status: Full Resuscitation
           </div>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Emergency MAR & Handover Pack - ${summary.fullName}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.35; font-size: 12px; margin: 0; padding: 12px; }
    h1 { font-size: 18px; margin: 0 0 4px 0; }
    h2 { font-size: 14px; margin: 12px 0 6px 0; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; color: #1e293b; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; }
    .grid { display: flex; flex-wrap: wrap; gap: 12px; }
    .col { flex: 1; min-width: 240px; }
    .box { border: 1px solid #cbd5e1; border-radius: 4px; padding: 8px; background: #f8fafc; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom:12px;text-align:right;">
    <button onclick="window.print()" style="background:#047857;color:#fff;border:none;padding:8px 16px;border-radius:4px;font-size:13px;font-weight:bold;cursor:pointer;">
      Print Handover Pack
    </button>
  </div>

  <header style="border-bottom:2px solid #0f172a;padding-bottom:8px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:flex-end;">
    <div>
      <p style="margin:0;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#047857;font-weight:bold;">CantraCare Emergency Handover Continuity Pack</p>
      <h1>${summary.fullName}</h1>
      <p style="margin:2px 0 0 0;color:#475569;">
        DOB: <strong>${summary.dob ?? 'Not Provided'}</strong> (Age ${summary.age ?? 'N/A'}) • NHS No: <strong>${summary.nhsNumber ?? 'Not Provided'}</strong> • Room: <strong>${summary.roomNumber ?? 'Unassigned'}</strong> (Bed: ${summary.bedLabel ?? 'Standard'})
      </p>
    </div>
    <div style="text-align:right;font-size:10px;color:#64748b;">
      Generated: <strong>${generatedAt}</strong><br>
      Reason: <strong>Outage Continuity / Paramedic Transfer</strong>
    </div>
  </header>

  ${dnacprNotice}

  <div class="grid">
    <div class="col box">
      <h3 style="margin:0 0 4px 0;font-size:12px;color:#b91c1c;">Allergies &amp; Adverse Reactions</h3>
      <p style="margin:0;font-weight:bold;color:#991b1b;">${allergies}</p>
    </div>
    <div class="col box">
      <h3 style="margin:0 0 4px 0;font-size:12px;color:#1e293b;">Primary Diagnoses &amp; Needs</h3>
      <p style="margin:0;">${[summary.primaryDiagnosis, ...summary.secondaryDiagnoses, ...summary.chronicConditions].filter(Boolean).join(', ') || 'No diagnoses recorded'}</p>
    </div>
  </div>

  <h2>Latest Physiological Vitals (NEWS2)</h2>
  <div class="box" style="font-weight:600;font-size:11px;">
    ${obsText}
  </div>

  <h2>Active Medication Administration Record (eMAR Snapshot)</h2>
  <p style="margin:0 0 4px 0;font-size:10px;color:#64748b;">
    In the event of network/power failure, utilize the rightmost column for manual administration signing.
  </p>
  <table>
    <thead>
      <tr style="background:#e2e8f0;text-align:left;">
        <th style="border:1px solid #334155;padding:6px;">Medication</th>
        <th style="border:1px solid #334155;padding:6px;">Dose</th>
        <th style="border:1px solid #334155;padding:6px;">Route</th>
        <th style="border:1px solid #334155;padding:6px;">Times</th>
        <th style="border:1px solid #334155;padding:6px;">Instructions</th>
        <th style="border:1px solid #334155;padding:6px;">Manual Sign-Off</th>
      </tr>
    </thead>
    <tbody>
      ${prescriptionsRows}
    </tbody>
  </table>

  <h2>Emergency Contacts &amp; Clinical Team</h2>
  <div class="grid">
    <div class="col">
      <ul style="margin:0;padding-left:18px;">
        ${contactsList}
      </ul>
    </div>
    <div class="col">
      <p style="margin:0;">
        Registered GP: <strong>${summary.gp?.name ?? 'Not Assigned'}</strong><br>
        Practice: ${summary.gp?.practice ?? 'N/A'}<br>
        Phone: ${summary.gp?.phone ?? 'N/A'}
      </p>
    </div>
  </div>

  <footer style="margin-top:24px;border-top:1px solid #cbd5e1;padding-top:8px;font-size:9px;color:#64748b;display:flex;justify-content:space-between;">
    <span>CantraCare Health Technologies • CQC Fundamental Standards Regulation 12 Continuity Pack</span>
    <span>CONFIDENTIAL MEDICAL RECORD • FOR PROFESSIONAL USE ONLY</span>
  </footer>
</body>
</html>`;
  }
}

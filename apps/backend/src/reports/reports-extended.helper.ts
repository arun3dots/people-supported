import { prisma } from '@repo/db';
import { formatCsv } from '../common/utils/csv.util';
import type { ReportCsvResponseDTO } from '@repo/schema';

const isoDate = (d?: Date | null): string =>
  d ? d.toISOString().slice(0, 10) : '';

const isoDateTime = (d?: Date | null): string =>
  d ? d.toISOString().replace('T', ' ').slice(0, 16) : '';

export async function exportOccupancyCsv(
  tenantId: string,
  branchId?: string,
): Promise<ReportCsvResponseDTO> {
  const wings = await prisma.wing.findMany({
    where: { tenantId, deletedAt: null, ...(branchId ? { branchId } : {}) },
    include: {
      scheme: { select: { name: true } },
      rooms: {
        where: { deletedAt: null },
        orderBy: { roomNumber: 'asc' },
        include: {
          beds: {
            where: { deletedAt: null },
            include: {
              resident: {
                select: {
                  fullName: true,
                  admissionDate: true,
                  fundingType: true,
                  status: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  const headers = [
    'property',
    'scheme',
    'room_unit',
    'bed_number',
    'bed_status',
    'resident_name',
    'resident_status',
    'admission_date',
    'funding_type',
  ];

  const rows: string[][] = [];
  for (const w of wings) {
    for (const r of w.rooms) {
      for (const b of r.beds) {
        rows.push([
          w.name,
          w.scheme?.name || 'Unassigned / Standalone',
          r.roomNumber,
          b.number || b.code || 'Bed',
          b.status,
          b.resident?.fullName || 'Vacant',
          b.resident?.status || '—',
          isoDate(b.resident?.admissionDate),
          b.resident?.fundingType || '—',
        ]);
      }
    }
  }

  return {
    filename: `RM-13_Occupancy_and_admissions_${isoDate(new Date())}.csv`,
    content: formatCsv(headers, rows),
    rowCount: rows.length,
  };
}

export async function exportMedicationsCsv(
  tenantId: string,
  branchId?: string,
): Promise<ReportCsvResponseDTO> {
  const rounds = await prisma.medicationRound.findMany({
    where: {
      deletedAt: null,
      resident: { tenantId, deletedAt: null, ...(branchId ? { branchId } : {}) },
    },
    include: {
      resident: { select: { fullName: true } },
      administrations: {
        where: { deletedAt: null, isSuperseded: false },
        orderBy: { administeredAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { scheduledTime: 'desc' },
    take: 500,
  });

  const headers = [
    'scheduled_time',
    'resident',
    'medication',
    'dose',
    'form',
    'round_status',
    'administration_status',
    'reason',
    'administered_at',
  ];

  const rows = rounds.map((r) => {
    const latest = r.administrations[0];
    return [
      isoDateTime(r.scheduledTime),
      r.resident?.fullName || 'N/A',
      r.drugName,
      r.dose,
      r.form,
      r.status,
      latest?.status || 'Pending',
      latest?.reason || '',
      isoDateTime(latest?.administeredAt),
    ];
  });

  return {
    filename: `NU-01_eMAR_medication_rounds_${isoDate(new Date())}.csv`,
    content: formatCsv(headers, rows),
    rowCount: rows.length,
  };
}

export async function exportCarePlansCsv(
  tenantId: string,
  branchId?: string,
): Promise<ReportCsvResponseDTO> {
  const plans = await prisma.carePlan.findMany({
    where: { tenantId, ...(branchId ? { branchId } : {}) },
    include: { resident: { select: { fullName: true } } },
    orderBy: { updatedAt: 'desc' },
    take: 500,
  });

  const headers = [
    'resident',
    'version',
    'status',
    'valid_from',
    'valid_to',
    'next_review_date',
    'last_reviewed_at',
    'consent_basis',
  ];

  const rows = plans.map((cp) => [
    cp.resident?.fullName || 'N/A',
    `v${cp.versionNumber}`,
    cp.status,
    isoDate(cp.validFrom),
    isoDate(cp.validTo),
    isoDate(cp.nextReviewDate),
    isoDate(cp.lastReviewedAt),
    cp.legalConsentBasis || 'ResidentSelf',
  ]);

  return {
    filename: `RM-06_Care_plan_and_risk_reviews_${isoDate(new Date())}.csv`,
    content: formatCsv(headers, rows),
    rowCount: rows.length,
  };
}

export async function exportShiftsCsv(
  tenantId: string,
  branchId?: string,
): Promise<ReportCsvResponseDTO> {
  const shifts = await prisma.shift.findMany({
    where: { tenantId, deletedAt: null, ...(branchId ? { branchId } : {}) },
    include: {
      wing: { select: { name: true } },
      assignments: {
        where: { deletedAt: null },
        include: { user: { select: { fullName: true } } },
      },
    },
    orderBy: { startTime: 'desc' },
    take: 500,
  });

  const headers = [
    'date',
    'shift_window',
    'duration_hours',
    'care_type',
    'property_wing',
    'status',
    'assigned_staff',
    'notes',
  ];

  const rows = shifts.map((s) => [
    isoDate(s.startTime),
    s.shiftWindow ||
      `${s.startTime.toISOString().slice(11, 16)} - ${s.endTime.toISOString().slice(11, 16)}`,
    s.durationHours !== null && s.durationHours !== undefined
      ? String(s.durationHours)
      : '',
    s.careType || 'Standard Shift',
    s.wing?.name || 'Facility Wide',
    s.status,
    s.assignments.map((a) => a.user?.fullName).filter(Boolean).join('; ') ||
      'Unassigned',
    s.notes || '',
  ]);

  return {
    filename: `RM-07_Staff_rota_and_hours_${isoDate(new Date())}.csv`,
    content: formatCsv(headers, rows),
    rowCount: rows.length,
  };
}

export async function exportCqcComplianceCsv(
  tenantId: string,
  branchId?: string,
): Promise<ReportCsvResponseDTO> {
  const scope = { tenantId, ...(branchId ? { branchId } : {}) };
  const [incidents, safeguardings, complaints] = await Promise.all([
    prisma.incident.findMany({
      where: { ...scope, deletedAt: null },
      include: { resident: { select: { fullName: true } } },
      orderBy: { incidentDate: 'desc' },
      take: 200,
    }),
    prisma.safeguardingReferral.findMany({
      where: scope,
      include: { resident: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    prisma.complaint.findMany({
      where: scope,
      include: { resident: { select: { fullName: true } } },
      orderBy: { receivedAt: 'desc' },
      take: 200,
    }),
  ]);

  const headers = [
    'domain',
    'reference',
    'date',
    'subject_or_category',
    'severity_or_status',
    'person_or_complainant',
    'cqc_notified',
  ];

  const rows: string[][] = [
    ...incidents.map((i) => [
      'Incident',
      i.incidentNumber || i.id.slice(0, 8),
      isoDate(i.incidentDate),
      i.category || 'General',
      `${i.severity} / ${i.status}`,
      i.resident?.fullName || 'N/A',
      i.cqcNotificationRequired ? 'Yes' : 'No',
    ]),
    ...safeguardings.map((sg) => [
      'Safeguarding',
      sg.referralNumber,
      isoDate(sg.createdAt),
      sg.abuseCategory,
      sg.status,
      sg.resident?.fullName || 'N/A',
      sg.cqcNotified ? 'Yes' : 'No',
    ]),
    ...complaints.map((c) => [
      'Complaint',
      c.complaintNumber,
      isoDate(c.receivedAt),
      c.subject,
      `${c.severity} / ${c.status}`,
      c.complainantName || c.resident?.fullName || 'N/A',
      c.escalatedToExternals ? 'Yes' : 'No',
    ]),
  ];

  return {
    filename: `RM-01_CQC_quality_and_compliance_${isoDate(new Date())}.csv`,
    content: formatCsv(headers, rows),
    rowCount: rows.length,
  };
}

export async function exportInvoicesCsv(
  tenantId: string,
  branchId?: string,
): Promise<ReportCsvResponseDTO> {
  const invoices = await prisma.invoice.findMany({
    where: { tenantId, deletedAt: null, ...(branchId ? { branchId } : {}) },
    include: { resident: { select: { fullName: true } } },
    orderBy: { issuedDate: 'desc' },
    take: 500,
  });

  const headers = [
    'invoice_number',
    'resident',
    'invoice_type',
    'amount_gbp',
    'status',
    'issued_date',
    'due_date',
    'paid_date',
  ];

  const rows = invoices.map((inv) => [
    inv.invoiceNumber,
    inv.resident?.fullName || 'N/A',
    inv.invoiceType,
    inv.amount.toFixed(2),
    inv.status,
    isoDate(inv.issuedDate),
    isoDate(inv.dueDate),
    isoDate(inv.paidDate),
  ]);

  return {
    filename: `AD-03_Invoicing_and_revenue_${isoDate(new Date())}.csv`,
    content: formatCsv(headers, rows),
    rowCount: rows.length,
  };
}

import { Injectable, Logger } from '@nestjs/common';
import { prisma, Prisma } from '@repo/db';
import { formatCsv } from '../common/utils/csv.util';
import { ReportCsvResponseDTO } from '@repo/schema';
import {
  exportCarePlansCsv,
  exportCqcComplianceCsv,
  exportInvoicesCsv,
  exportMedicationsCsv,
  exportOccupancyCsv,
  exportShiftsCsv,
} from './reports-extended.helper';

type ResidentWithRelations = Prisma.ResidentGetPayload<{
  include: {
    bed: {
      include: {
        room: { select: { roomNumber: true } };
      };
    };
    observations: {
      select: { news2Score: true };
    };
    dolsAuthorizations: {
      select: { status: true };
    };
  };
}>;

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  /**
   * Generates RM-02 Incident & Accident Log CSV export.
   * Conforms to CQC Reg 17, 18 and Health and Social Care Act 2008 Duty of Candour.
   */
  async exportIncidentsCsv(
    tenantId: string,
    branchId?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<ReportCsvResponseDTO> {
    const where: {
      tenantId: string;
      deletedAt: null;
      branchId?: string;
      incidentDate?: { gte?: Date; lte?: Date };
    } = {
      tenantId,
      deletedAt: null,
    };

    if (branchId) {
      where.branchId = branchId;
    }

    if (startDate || endDate) {
      where.incidentDate = {};
      if (startDate) {
        where.incidentDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.incidentDate.lte = new Date(endDate);
      }
    }

    const incidents = await prisma.incident.findMany({
      where,
      include: {
        resident: { select: { fullName: true } },
        assignedTo: { select: { fullName: true } },
        reportedBy: { select: { fullName: true } },
      },
      orderBy: { incidentDate: 'desc' },
    });

    const headers = [
      'ref',
      'date_time',
      'subject',
      'type',
      'severity',
      'description',
      'immediate_action',
      'notified_to',
      'duty_of_candour',
      'status',
      'owner',
    ];

    const rows = incidents.map((inc) => {
      const dateStr = inc.incidentDate
        ? inc.incidentDate.toISOString().slice(0, 10)
        : '';
      const timeStr = inc.incidentTime ? ` ${inc.incidentTime}` : '';
      const dateTime = `${dateStr}${timeStr}`.trim();

      let immediateActionText = 'None';
      if (Array.isArray(inc.immediateActions)) {
        immediateActionText = inc.immediateActions
          .map((a) => (typeof a === 'string' ? a : JSON.stringify(a)))
          .join('; ');
      } else if (
        inc.immediateActions !== null &&
        inc.immediateActions !== undefined
      ) {
        immediateActionText =
          typeof inc.immediateActions === 'string'
            ? inc.immediateActions
            : JSON.stringify(inc.immediateActions);
      }

      const notifiedTo = inc.cqcNotificationRequired
        ? inc.cqcReferenceNumber
          ? `CQC (${inc.cqcReferenceNumber})`
          : 'CQC Notified'
        : 'Internal';

      const docStatus =
        inc.dutyOfCandourStatus ||
        (inc.dutyOfCandourApplicable ? 'Pending' : 'Not applicable');

      const owner =
        inc.assignedTo?.fullName || inc.reportedBy?.fullName || 'Unassigned';

      return [
        inc.incidentNumber || inc.id.slice(0, 8),
        dateTime,
        inc.resident?.fullName || 'N/A',
        inc.category || 'General',
        inc.severity || inc.harmLevel || 'Medium',
        inc.title || inc.initialAssessment || '',
        immediateActionText,
        notifiedTo,
        docStatus,
        inc.status || 'Open',
        owner,
      ];
    });

    const content = formatCsv(headers, rows);
    const dateTag = new Date().toISOString().slice(0, 10);
    const filename = `RM-02_Incident_and_accident_log_${dateTag}.csv`;

    this.logger.log(
      `Generated incidents report for tenant ${tenantId} (${incidents.length} rows)`,
    );

    return {
      filename,
      content,
      rowCount: incidents.length,
    };
  }

  /**
   * Generates NU-11 Resident Clinical Risk Summary CSV export.
   * Conforms to CQC Reg 12 (Safe Care) and NICE guidelines.
   */
  async exportResidentsCsv(
    tenantId: string,
    branchId?: string,
  ): Promise<ReportCsvResponseDTO> {
    const where: {
      tenantId: string;
      deletedAt: null;
      branchId?: string;
    } = {
      tenantId,
      deletedAt: null,
    };

    if (branchId) {
      where.branchId = branchId;
    }

    const rawResidents = await prisma.resident.findMany({
      where,
      include: {
        bed: {
          include: {
            room: { select: { roomNumber: true } },
          },
        },
        observations: {
          orderBy: { timestamp: 'desc' },
          take: 1,
          select: { news2Score: true },
        },
        dolsAuthorizations: {
          where: { status: 'Active' },
          take: 1,
          select: { status: true },
        },
      },
      orderBy: { fullName: 'asc' },
    });

    const residents = rawResidents as unknown as ResidentWithRelations[];

    const headers = [
      'room',
      'resident',
      'news2_latest',
      'must',
      'waterlow',
      'falls_risk',
      'choking_risk',
      'iddsi_food_and_drink',
      'cpr_status',
      'dols_status',
      'alerts',
    ];

    const rows = residents.map((res) => {
      const roomNumber =
        res.bed?.room?.roomNumber || res.bed?.number || 'Unassigned';

      const latestObservation = res.observations[0];
      const news2 =
        latestObservation?.news2Score !== null &&
        latestObservation?.news2Score !== undefined
          ? String(latestObservation.news2Score)
          : 'N/A';

      const cprStatus =
        res.dnacprStatus || (res.dnarStatus ? 'DNACPR' : 'For CPR');

      const dolsStatus = res.dolsAuthorizations[0]?.status || 'None';

      return [
        roomNumber,
        res.fullName,
        news2,
        'Assessed',
        'Assessed',
        res.fallsRiskLevel || 'Standard',
        res.iddsiLevel ? 'Assessed' : 'Low',
        res.iddsiLevel || 'Normal',
        cprStatus,
        dolsStatus,
        res.allergySummary || 'None',
      ];
    });

    const content = formatCsv(headers, rows);
    const dateTag = new Date().toISOString().slice(0, 10);
    const filename = `NU-11_Resident_clinical_risk_summary_${dateTag}.csv`;

    this.logger.log(
      `Generated residents risk report for tenant ${tenantId} (${residents.length} rows)`,
    );

    return {
      filename,
      content,
      rowCount: residents.length,
    };
  }

  /**
   * NU-07 / Escalations: Clinical Escalations & Falls Log Export.
   */
  async exportEscalationsCsv(
    tenantId: string,
    branchId?: string,
  ): Promise<ReportCsvResponseDTO> {
    const where: {
      tenantId: string;
      branchId?: string;
    } = {
      tenantId,
    };

    if (branchId) {
      where.branchId = branchId;
    }

    const escalations = await prisma.clinicalEscalation.findMany({
      where,
      include: {
        resident: { select: { fullName: true } },
        raisedBy: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'date_time',
      'resident',
      'reason',
      'severity',
      'status',
      'assigned_role',
      'sbar_situation',
      'vitals_news2',
      'actions_taken',
      'raised_by',
    ];

    const rows = escalations.map((esc) => {
      const dateTime = esc.createdAt
        .toISOString()
        .replace('T', ' ')
        .slice(0, 16);

      let news2Val = 'N/A';
      if (
        esc.vitalsSnapshot &&
        typeof esc.vitalsSnapshot === 'object' &&
        'news2Score' in (esc.vitalsSnapshot as Record<string, unknown>)
      ) {
        const score = (esc.vitalsSnapshot as Record<string, unknown>)
          .news2Score;
        if (typeof score === 'number' || typeof score === 'string') {
          news2Val = `${score}`;
        }
      }

      let actionsText = 'None';
      if (Array.isArray(esc.actionsTaken)) {
        actionsText = esc.actionsTaken
          .map((a) => {
            if (typeof a === 'object' && a !== null && 'action' in a) {
              const act = (a as Record<string, unknown>).action;
              return typeof act === 'string' ? act : JSON.stringify(act);
            }
            return typeof a === 'string' ? a : JSON.stringify(a);
          })
          .join('; ');
      }

      return [
        dateTime,
        esc.resident?.fullName || 'N/A',
        esc.reason,
        esc.severity,
        esc.status,
        esc.assignedToRole,
        esc.sbarSituation || esc.initialNotes || '',
        news2Val,
        actionsText,
        esc.raisedBy?.fullName || 'Staff',
      ];
    });

    const content = formatCsv(headers, rows);
    const dateTag = new Date().toISOString().slice(0, 10);
    const filename = `NU-07_Clinical_escalations_and_falls_${dateTag}.csv`;

    this.logger.log(
      `Generated escalations report for tenant ${tenantId} (${escalations.length} rows)`,
    );

    return {
      filename,
      content,
      rowCount: escalations.length,
    };
  }

  exportOccupancyCsv(tenantId: string, branchId?: string): Promise<ReportCsvResponseDTO> {
    return exportOccupancyCsv(tenantId, branchId);
  }

  exportMedicationsCsv(tenantId: string, branchId?: string): Promise<ReportCsvResponseDTO> {
    return exportMedicationsCsv(tenantId, branchId);
  }

  exportCarePlansCsv(tenantId: string, branchId?: string): Promise<ReportCsvResponseDTO> {
    return exportCarePlansCsv(tenantId, branchId);
  }

  exportShiftsCsv(tenantId: string, branchId?: string): Promise<ReportCsvResponseDTO> {
    return exportShiftsCsv(tenantId, branchId);
  }

  exportCqcComplianceCsv(tenantId: string, branchId?: string): Promise<ReportCsvResponseDTO> {
    return exportCqcComplianceCsv(tenantId, branchId);
  }

  exportInvoicesCsv(tenantId: string, branchId?: string): Promise<ReportCsvResponseDTO> {
    return exportInvoicesCsv(tenantId, branchId);
  }
}

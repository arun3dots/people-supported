import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@repo/db';
import {
  calculateAge,
  type EmergencyDirectoryItemDTO,
  type EmergencyDirectoryResponseDTO,
  type EmergencyMedicationSummaryDTO,
  type EmergencyResidentSummaryDTO,
} from '@repo/schema';
import { AuditService } from '../../audit/audit.service';
import { safeDecryptStr } from '../../common/utils/crypto.util';
import type { ActorContext } from '../../common/interfaces/actor.interface';
import {
  buildCareProviders,
  mapObservation,
  parseEmergencyContacts,
  parseGp,
  textOrNull,
  uniqueStrings,
} from './resident-emergency.mapper';

interface AssignmentScope {
  residentIds: Set<string>;
  roomIds: Set<string>;
}

const DIRECTORY_STATUS = 'Active';
const DIRECTORY_LIMIT = 500;

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

function endOfToday(): Date {
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );
}

function formatUkTime(date: Date): string {
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/London',
  });
}

/**
 * Read-only emergency access (CQC Reg 12). Lists every active resident in the
 * caller's branch regardless of shift assignment, and records an audit event
 * every time a resident's emergency summary is opened. No write paths.
 */
@Injectable()
export class ResidentEmergencyService {
  constructor(private readonly auditService: AuditService) {}

  private async loadAssignmentScope(
    tenantId: string,
    userId: string,
  ): Promise<AssignmentScope> {
    const assignments = await prisma.shiftAssignment.findMany({
      where: {
        userId,
        deletedAt: null,
        shift: {
          tenantId,
          deletedAt: null,
          status: { not: 'Cancelled' },
          startTime: { lte: endOfToday() },
          endTime: { gte: startOfToday() },
        },
      },
      select: { assignedResidentIds: true, assignedRoomIds: true },
    });

    const scope: AssignmentScope = {
      residentIds: new Set(),
      roomIds: new Set(),
    };
    for (const assignment of assignments) {
      assignment.assignedResidentIds.forEach((id) => scope.residentIds.add(id));
      assignment.assignedRoomIds.forEach((id) => scope.roomIds.add(id));
    }
    return scope;
  }

  private isAssigned(
    scope: AssignmentScope,
    residentId: string,
    roomId?: string | null,
  ): boolean {
    // If explicit residents were assigned to the staff shift, match strictly on resident ID (BUG-049)
    if (scope.residentIds.size > 0) {
      return scope.residentIds.has(residentId);
    }
    return Boolean(roomId && scope.roomIds.has(roomId));
  }

  async listDirectory(
    tenantId: string,
    userId: string,
    branchId?: string,
  ): Promise<EmergencyDirectoryResponseDTO> {
    const [scope, residents] = await Promise.all([
      this.loadAssignmentScope(tenantId, userId),
      prisma.resident.findMany({
        where: {
          tenantId,
          deletedAt: null,
          status: DIRECTORY_STATUS,
          ...(branchId ? { branchId } : {}),
        },
        select: {
          id: true,
          fullName: true,
          dob: true,
          dnarStatus: true,
          status: true,
          photoUrl: true,
          profile: { select: { preferredName: true, gender: true } },
          careProfile: {
            select: {
              allergies: true,
              medicationAllergies: true,
              foodAllergies: true,
              environmentalAllergies: true,
            },
          },
          bed: {
            select: {
              bedLabel: true,
              number: true,
              roomId: true,
              room: {
                select: { roomNumber: true, wing: { select: { name: true } } },
              },
            },
          },
        },
        orderBy: { fullName: 'asc' },
        take: DIRECTORY_LIMIT,
      }),
    ]);

    const items: EmergencyDirectoryItemDTO[] = residents.map((resident) => {
      const care = resident.careProfile;
      return {
        id: resident.id,
        fullName: resident.fullName,
        preferredName: textOrNull(resident.profile?.preferredName),
        age: calculateAge(safeDecryptStr(resident.dob)),
        gender: textOrNull(resident.profile?.gender),
        roomNumber: textOrNull(resident.bed?.room?.roomNumber),
        bedLabel:
          textOrNull(resident.bed?.bedLabel) ??
          textOrNull(resident.bed?.number),
        wingName: textOrNull(resident.bed?.room?.wing?.name),
        photoUrl: resident.photoUrl,
        status: resident.status,
        dnacpr: resident.dnarStatus,
        hasAllergies:
          uniqueStrings(
            care?.allergies,
            care?.medicationAllergies,
            care?.foodAllergies,
            care?.environmentalAllergies,
          ).length > 0,
        isAssigned: this.isAssigned(scope, resident.id, resident.bed?.roomId),
      };
    });

    const byRoom = (
      a: EmergencyDirectoryItemDTO,
      b: EmergencyDirectoryItemDTO,
    ) =>
      (a.roomNumber ?? '').localeCompare(b.roomNumber ?? '', undefined, {
        numeric: true,
      }) || a.fullName.localeCompare(b.fullName);

    return {
      assigned: items.filter((item) => item.isAssigned).sort(byRoom),
      others: items.filter((item) => !item.isAssigned),
      total: items.length,
    };
  }

  async getSummary(
    id: string,
    tenantId: string,
    branchId: string | undefined,
    actor: ActorContext,
  ): Promise<EmergencyResidentSummaryDTO> {
    const today = startOfToday();
    const resident = await prisma.resident.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
        ...(branchId ? { branchId } : {}),
      },
      select: {
        id: true,
        fullName: true,
        dob: true,
        nhsNumber: true,
        dnarStatus: true,
        status: true,
        photoUrl: true,
        gpDetails: true,
        nextOfKin: true,
        profile: {
          select: {
            preferredName: true,
            gender: true,
            preferredLanguage: true,
            interpreterRequired: true,
          },
        },
        careProfile: {
          select: {
            primaryDiagnosis: true,
            secondaryDiagnoses: true,
            chronicConditions: true,
            allergies: true,
            medicationAllergies: true,
            foodAllergies: true,
            environmentalAllergies: true,
            mobility: true,
            mobilityAidsUsed: true,
            fallRiskScore: true,
            dietType: true,
            textureModification: true,
            dietaryRequirements: true,
            communicationAbility: true,
            sensoryAids: true,
            hospitalConsultant: true,
            hospitalName: true,
            communityNursePhone: true,
            mentalHealthTeam: true,
          },
        },
        bed: {
          select: {
            bedLabel: true,
            number: true,
            roomId: true,
            room: {
              select: { roomNumber: true, wing: { select: { name: true } } },
            },
          },
        },
        observations: {
          where: { deletedAt: null },
          orderBy: { timestamp: 'desc' },
          take: 1,
          select: {
            timestamp: true,
            news2Score: true,
            temp: true,
            pulse: true,
            bpSystolic: true,
            bpDiastolic: true,
            respiration: true,
            spo2: true,
            consciousness: true,
          },
        },
        medicationPrescriptions: {
          where: { status: 'Active', deletedAt: null, endDate: { gte: today } },
          orderBy: { drugName: 'asc' },
          select: {
            drugName: true,
            dose: true,
            form: true,
            times: true,
            instructions: true,
          },
        },
        medicationRounds: {
          where: {
            prescriptionId: null,
            deletedAt: null,
            isAdhoc: false,
            scheduledTime: { gte: today },
          },
          orderBy: { scheduledTime: 'asc' },
          take: 100,
          select: {
            drugName: true,
            dose: true,
            form: true,
            instructions: true,
            scheduledTime: true,
          },
        },
      },
    });

    if (!resident) throw new NotFoundException('Resident not found');

    const scope = await this.loadAssignmentScope(tenantId, actor.userId);
    const isAssignedResident = this.isAssigned(
      scope,
      resident.id,
      resident.bed?.roomId,
    );

    await this.auditService.emitDataAccess({
      userId: actor.userId,
      tenantId: actor.tenantId,
      userEmail: actor.userEmail,
      userFullName: actor.userFullName,
      userRoleName: actor.roleName,
      actionType: 'RESIDENT_EMERGENCY_VIEWED',
      entityType: 'Resident',
      entityId: resident.id,
      entityLabel: resident.fullName,
      residentId: resident.id,
      description: `Emergency directory (read-only) view of ${resident.fullName}`,
      metadata: { accessMode: 'EMERGENCY_DIRECTORY', isAssignedResident },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    const care = resident.careProfile;
    const dob = safeDecryptStr(resident.dob);

    // Prescribed courses are the source of truth; legacy rounds with no prescription
    // are collapsed to one line per drug so a month of generated tasks reads as one entry.
    const legacy = new Map<string, EmergencyMedicationSummaryDTO>();
    for (const round of resident.medicationRounds) {
      const key = `${round.drugName}|${round.dose}|${round.form}`.toLowerCase();
      const time = formatUkTime(round.scheduledTime);
      const existing = legacy.get(key);
      if (existing) {
        if (!existing.times.includes(time)) existing.times.push(time);
      } else {
        legacy.set(key, {
          drugName: round.drugName,
          dose: round.dose,
          form: round.form,
          times: [time],
          instructions: textOrNull(round.instructions),
        });
      }
    }

    const medications: EmergencyMedicationSummaryDTO[] = [
      ...resident.medicationPrescriptions.map((rx) => ({
        drugName: rx.drugName,
        dose: rx.dose,
        form: rx.form,
        times: [...rx.times].sort(),
        instructions: textOrNull(rx.instructions),
      })),
      ...Array.from(legacy.values()).map((med) => ({
        ...med,
        times: [...med.times].sort(),
      })),
    ];

    return {
      id: resident.id,
      fullName: resident.fullName,
      preferredName: textOrNull(resident.profile?.preferredName),
      dob,
      age: calculateAge(dob),
      gender: textOrNull(resident.profile?.gender),
      nhsNumber: safeDecryptStr(resident.nhsNumber),
      photoUrl: resident.photoUrl,
      status: resident.status,
      roomNumber: textOrNull(resident.bed?.room?.roomNumber),
      bedLabel:
        textOrNull(resident.bed?.bedLabel) ?? textOrNull(resident.bed?.number),
      wingName: textOrNull(resident.bed?.room?.wing?.name),
      dnacpr: resident.dnarStatus,
      allergies: {
        medication: uniqueStrings(care?.medicationAllergies),
        food: uniqueStrings(care?.foodAllergies),
        other: uniqueStrings(care?.allergies, care?.environmentalAllergies),
      },
      primaryDiagnosis: textOrNull(care?.primaryDiagnosis),
      secondaryDiagnoses: uniqueStrings(care?.secondaryDiagnoses),
      chronicConditions: uniqueStrings(care?.chronicConditions),
      medications,
      latestObservation: mapObservation(resident.observations[0]),
      emergencyContacts: parseEmergencyContacts(resident.nextOfKin),
      gp: parseGp(resident.gpDetails),
      careProviders: buildCareProviders(care),
      mobility: {
        summary: textOrNull(care?.mobility),
        aids: uniqueStrings(care?.mobilityAidsUsed),
        fallRisk: textOrNull(care?.fallRiskScore),
      },
      diet: {
        dietType: textOrNull(care?.dietType),
        textureModification: textOrNull(care?.textureModification),
        requirements: uniqueStrings(care?.dietaryRequirements),
      },
      communication: {
        ability: textOrNull(care?.communicationAbility),
        preferredLanguage: textOrNull(resident.profile?.preferredLanguage),
        interpreterRequired: resident.profile?.interpreterRequired ?? false,
        sensoryAids: uniqueStrings(care?.sensoryAids),
      },
    };
  }
}

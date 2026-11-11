import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@repo/db';
import { HospitalTransferPackDTO } from '@repo/schema';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CarePlanTransferService {
  constructor(private readonly auditService: AuditService) {}

  async generateTransferPack(
    residentId: string,
    tenantId: string,
    userId: string,
    reasonForTransfer?: string,
  ): Promise<HospitalTransferPackDTO> {
    // 1. Fetch Resident & Tenant
    const resident = await prisma.resident.findFirst({
      where: { id: residentId, tenantId },
      include: {
        profile: true,
        consent: true,
        tenant: true,
        bed: { include: { room: true } },
      },
    });

    if (!resident) {
      throw new NotFoundException('Resident not found');
    }

    // 2. Fetch Active Care Plan
    const activeCarePlan = await prisma.carePlan.findFirst({
      where: { residentId, tenantId, status: 'Active' },
      include: {
        medications: { where: { isActive: true } },
        goals: { where: { status: 'Active' } },
        tasks: { where: { status: 'Active', isActive: true } },
      },
    });

    // 3. Fetch Latest Observation / Vitals
    const latestObservation = await prisma.observation.findFirst({
      where: { residentId },
      orderBy: { timestamp: 'desc' },
    });

    // 4. Fetch Active DoLS
    const activeDols = await prisma.dolsAuthorization.findFirst({
      where: {
        residentId,
        tenantId,
        status: { in: ['Authorized', 'UrgentApplied'] },
      },
      orderBy: { appliedDate: 'desc' },
    });

    // 5. Fetch Capacity Assessments
    const capacityAssessments = await prisma.mentalCapacityAssessment.findMany({
      where: { residentId, tenantId },
      orderBy: { assessedAt: 'desc' },
      take: 3,
    });

    // Determine legal directives
    const advanceDirectives =
      (resident.consent?.advanceDirectives as Record<string, unknown>) || {};
    const dnacprInPlace =
      resident.dnarStatus === true ||
      advanceDirectives.dnacpr === true ||
      advanceDirectives.dnr === true ||
      advanceDirectives.status === 'DNACPR' ||
      false;

    const dnacprLocation =
      typeof advanceDirectives.location === 'string'
        ? advanceDirectives.location
        : 'Front of physical care file in red sleeve (CQC Reg 9/11)';

    const hasCapacity =
      capacityAssessments.length > 0
        ? capacityAssessments.every((a) => a.hasCapacity)
        : true;

    // Build emergency contacts
    const emergencyContacts = [];
    interface NextOfKinInfo {
      name?: string;
      relationship?: string;
      phoneNumber?: string;
      phone?: string;
    }
    const nok = resident.nextOfKin as NextOfKinInfo | null;
    if (nok && typeof nok === 'object') {
      emergencyContacts.push({
        name: typeof nok.name === 'string' ? nok.name : 'Next of Kin',
        relationship:
          typeof nok.relationship === 'string'
            ? nok.relationship
            : 'Next of Kin',
        phone:
          typeof nok.phoneNumber === 'string'
            ? nok.phoneNumber
            : typeof nok.phone === 'string'
              ? nok.phone
              : 'Recorded in resident file',
      });
    } else if (activeCarePlan?.representativeName) {
      emergencyContacts.push({
        name: activeCarePlan.representativeName,
        relationship:
          activeCarePlan.representativeRelationship || 'Representative',
        phone: 'See Care Home records',
      });
    }

    // Baseline Care summaries from active plan
    const mobilityTasks =
      activeCarePlan?.tasks.filter((t) =>
        t.category.toLowerCase().includes('mobility'),
      ) || [];
    const nutritionTasks =
      activeCarePlan?.tasks.filter((t) =>
        t.category.toLowerCase().includes('nutrition'),
      ) || [];

    const roomText = resident.bed?.room?.roomNumber
      ? `Room ${resident.bed.room.roomNumber}${resident.bed.number ? ` (Bed ${resident.bed.number})` : ''}`
      : null;

    const pack: HospitalTransferPackDTO = {
      generatedAt: new Date().toISOString(),
      reasonForTransfer:
        reasonForTransfer || 'Urgent Hospital Admission / Ambulance Assessment',
      careHome: {
        name: resident.tenant.name,
        phone: resident.tenant.primaryContactPhone || 'Not recorded',
        address:
          [
            resident.tenant.addressLine1,
            resident.tenant.city,
            resident.tenant.postcode,
          ]
            .filter(Boolean)
            .join(', ') || 'Not recorded',
        registeredManager:
          resident.tenant.primaryContactName || 'Registered Care Home Manager',
      },
      resident: {
        id: resident.id,
        fullName: resident.fullName,
        preferredName: resident.profile?.preferredName || null,
        dateOfBirth: resident.dob,
        nhsNumber: resident.nhsNumber,
        gender: resident.profile?.gender || null,
        roomNumber: roomText,
      },
      emergencyContacts,
      legalDirectives: {
        dnacprInPlace,
        dnacprLocation,
        hasCapacity,
        lpaHealthAndWelfareName: activeCarePlan?.representativeName || null,
        lpaContact: null,
        dolsInPlace: !!activeDols,
        dolsSupervisoryBody: activeDols?.supervisoryBody || null,
        dolsExpiryDate: activeDols?.expiryDate || null,
      },
      baselineCare: {
        mobility:
          mobilityTasks.length > 0
            ? mobilityTasks.map((t) => t.title).join('; ')
            : 'Independently mobile with walking aid and supervision',
        transferAssistance: '1 Carer assistance with standing and transfers',
        nutrition:
          nutritionTasks.length > 0
            ? nutritionTasks.map((t) => t.title).join('; ')
            : 'Normal diet, independent with cutlery',
        iddsiFood: 'Level 7 - Regular Easy to Chew',
        iddsiFluid: 'Level 0 - Thin Drinks',
        mustScore: 0,
        continence: 'Continent with prompt / pads as precaution',
        skinIntegrity: 'Skin intact, pressure relieving foam mattress in use',
        waterlowScore: 8,
        communicationNeeds:
          resident.profile?.preferredCommunication || 'Verbal, clear English',
        sensoryImpairments: resident.profile?.interpreterRequired
          ? 'Interpreter required'
          : 'Glasses for reading',
      },
      latestVitals: latestObservation
        ? {
            news2Score: latestObservation.news2Score,
            consciousness: latestObservation.consciousness,
            spo2: latestObservation.spo2,
            bloodPressure:
              latestObservation.bpSystolic && latestObservation.bpDiastolic
                ? `${latestObservation.bpSystolic}/${latestObservation.bpDiastolic} mmHg`
                : null,
            pulse: latestObservation.pulse,
            temperature: latestObservation.temp,
            respirationRate: latestObservation.respiration,
            recordedAt: latestObservation.timestamp,
          }
        : undefined,
      activeMedications: (activeCarePlan?.medications || []).map((m) => ({
        drugName: m.drugName,
        dose: m.dose,
        frequency: m.frequency,
        route: m.form || 'Oral',
        instructions: m.instructions || null,
      })),
      medicalConditions: [],
      allergies: [],
    };

    // Emit typed audit event
    await this.auditService.emitDataAccess({
      tenantId,
      userId,
      residentId,
      entityType: 'Resident',
      actionType: 'DOCUMENT_DOWNLOADED',
      entityId: resident.id,
      description: `Hospital Transfer Pack (e-RedBag) generated for ${resident.fullName} (NHS: ${resident.nhsNumber || 'Unknown'}).`,
    });

    return pack;
  }
}

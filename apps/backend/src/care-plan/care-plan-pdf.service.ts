import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@repo/db';
import type { DetailedCarePlanExportDTO } from '@repo/schema';
import { buildCarePlanPdfDefinition } from './care-plan-pdf-template';

const pdfmake = require('pdfmake');

pdfmake.fonts = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};

@Injectable()
export class CarePlanPdfService {
  /**
   * Aggregates complete care plan data and generates a downloadable PDF buffer
   */
  async generateCarePlanPdf(
    carePlanId: string,
    tenantId: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const exportData = await this.getHydratedExportData(carePlanId, tenantId);
    const docDefinition = buildCarePlanPdfDefinition(exportData);
    const pdfDoc = pdfmake.createPdf(docDefinition);
    const buffer = await pdfDoc.getBuffer();

    const sanitizedName = exportData.resident.fullName.replace(
      /[^a-zA-Z0-9]/g,
      '_',
    );
    const filename = `care-plan-${sanitizedName}-v${exportData.plan.versionNumber}.pdf`;

    return { buffer, filename };
  }

  /**
   * Compiles the full hydrated care plan record
   */
  async getHydratedExportData(
    carePlanId: string,
    tenantId: string,
  ): Promise<DetailedCarePlanExportDTO> {
    const plan = await prisma.carePlan.findFirst({
      where: { id: carePlanId, tenantId },
      include: {
        resident: {
          include: {
            profile: true,
            admission: true,
            careProfile: true,
            consent: true,
            bed: { include: { room: { include: { wing: true } } } },
          },
        },
        sections: { orderBy: { createdAt: 'asc' } },
        goals: { orderBy: { createdAt: 'asc' } },
        tasks: {
          where: { status: 'Active', isActive: true },
          orderBy: { createdAt: 'asc' },
        },
        medications: {
          where: { isActive: true },
          orderBy: { drugName: 'asc' },
        },
        reviews: {
          include: { reviewer: { select: { fullName: true } } },
          orderBy: { reviewedAt: 'desc' },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException(`Care Plan ${carePlanId} not found`);
    }

    const resident = plan.resident;
    const profile = resident.profile;
    const admission = resident.admission;
    const careProfile = resident.careProfile;
    const consent = resident.consent;

    // Calculate age
    let age: number | undefined;
    if (resident.dob) {
      const birthDate = new Date(resident.dob);
      if (!isNaN(birthDate.getTime())) {
        const diff = Date.now() - birthDate.getTime();
        age = Math.abs(new Date(diff).getUTCFullYear() - 1970);
      }
    }

    // Parse GP details & Next of Kin
    let gpName: string | undefined;
    let gpPractice: string | undefined;
    if (resident.gpDetails && typeof resident.gpDetails === 'object') {
      const gp = resident.gpDetails as Record<string, unknown>;
      gpName = (gp.doctorName as string) || (gp.name as string);
      gpPractice = (gp.practiceName as string) || (gp.surgery as string);
    }

    let nokName: string | undefined;
    let nokRelation: string | undefined;
    let nokContact: string | undefined;
    if (resident.nextOfKin && typeof resident.nextOfKin === 'object') {
      const nok = resident.nextOfKin as Record<string, unknown>;
      nokName = (nok.name as string) || (nok.fullName as string);
      nokRelation = (nok.relationship as string) || (nok.relation as string);
      nokContact = (nok.phone as string) || (nok.email as string);
    }

    // Fetch active risk assessments
    const riskAssessments = await prisma.riskAssessment.findMany({
      where: {
        residentId: resident.id,
        tenantId,
        status: { in: ['Active', 'Approved'] },
      },
      orderBy: { nextReviewDate: 'asc' },
    });

    const riskSummary = riskAssessments.map((r) => ({
      riskArea: r.category || r.title,
      level: r.residualLevel || r.inherentLevel || 'Medium',
      assessmentRef: `#RA-${r.id.slice(0, 6).toUpperCase()}`,
      lastReviewed: r.reviewedAt
        ? new Date(r.reviewedAt).toLocaleDateString('en-GB')
        : undefined,
      nextDue: r.nextReviewDate
        ? new Date(r.nextReviewDate).toLocaleDateString('en-GB')
        : undefined,
    }));

    return {
      plan: {
        id: plan.id,
        versionNumber: plan.versionNumber,
        status: plan.status,
        validFrom: plan.validFrom,
        validTo: plan.validTo,
        nextReviewDate: plan.nextReviewDate,
        description: plan.description,
        authorRole: plan.authorRole,
        legalConsentBasis: plan.legalConsentBasis,
        residentAgreed: plan.residentAgreed,
        residentAgreementNotes: plan.residentAgreementNotes,
        representativeName: plan.representativeName,
        representativeRelationship: plan.representativeRelationship,
      },
      resident: {
        id: resident.id,
        fullName: resident.fullName,
        preferredName: profile?.preferredName,
        dob: resident.dob,
        age,
        nhsNumber: resident.nhsNumber ? 'Encrypted on file' : undefined,
        roomNumber: resident.bed?.room?.roomNumber,
        wingName: resident.bed?.room?.wing?.name,
        admissionDate: resident.admissionDate,
        fundingType: resident.fundingType,
        isSelfFunder: admission?.isSelfFunder ?? false,
        gpName,
        gpPractice,
        nextOfKinName: nokName,
        nextOfKinRelation: nokRelation,
        nextOfKinContact: nokContact,
        lpaStatus: consent?.poaDocumentUrl
          ? 'Health & Welfare LPA Registered (copy on file)'
          : undefined,
        religion: profile?.religion,
        dnarStatus: resident.dnarStatus,
      },
      sections: plan.sections.map((s) => ({
        id: s.id,
        carePlanId: s.carePlanId,
        sectionName: s.sectionName,
        content: s.content,
        sectionData: (s.sectionData as Record<string, unknown>) || null,
        authorId: s.authorId,
        version: s.version,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
      riskSummary,
      goals: plan.goals.map((g) => ({
        id: g.id,
        title: g.title,
        whyItMattersToResident: g.whyItMattersToResident,
        targetDescription: g.targetDescription,
        category: g.category,
        reviewFrequency: g.reviewFrequency,
        nextReviewDate: g.nextReviewDate
          ? g.nextReviewDate.toISOString()
          : null,
        status: g.status,
      })),
      tasks: plan.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        category: t.category,
        frequency: t.frequency,
        timeOfDay: t.timeOfDay,
        instructions: t.instructions,
        precautions: t.precautions,
        priority: t.priority,
      })),
      medications: plan.medications.map((m) => ({
        drugName: m.drugName,
        dose: m.dose,
        frequency: m.frequency,
        instructions: m.instructions,
        timeOfDay: m.timeOfDay,
      })),
      reviews: plan.reviews.map((rv) => ({
        id: rv.id,
        reviewedAt: rv.reviewedAt,
        reviewerName: rv.reviewer?.fullName || 'Registered Manager',
        decision: rv.decision,
        summaryNotes: rv.summaryNotes,
        residentFeedback: rv.residentFeedback,
        familyFeedback: rv.familyFeedback,
      })),
    };
  }
}

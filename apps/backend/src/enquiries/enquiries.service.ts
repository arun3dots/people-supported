import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma, Prisma } from '@repo/db';
import {
  CreateEnquiryStage1DTO,
  CreateEnquiryDraftDTO,
  UpdateEnquiryAssessmentDTO,
  CreateAssessmentTemplateDTO,
  UpdateAssessmentTemplateDTO,
  type EnquiryListQueryDTO,
} from '@repo/schema';
import { toJsonValue } from '../common/utils/json.util';
import { paginate, resolvePagination } from '../common/utils/pagination.util';

@Injectable()
export class EnquiriesService {
  async create(
    dto: CreateEnquiryStage1DTO | CreateEnquiryDraftDTO,
    tenantId: string,
    branchId: string,
  ) {
    return prisma.enquiry.create({
      data: {
        tenantId,
        branchId,
        enquirerName: dto.enquirerName?.trim() || '',
        enquirerRelationship: dto.enquirerRelationship || '',
        enquirerPhone: dto.enquirerPhone?.trim() || '',
        enquirerEmail: dto.enquirerEmail || null,
        firstName: dto.firstName?.trim() || '',
        middleName: dto.middleName?.trim() || null,
        lastName: dto.lastName?.trim() || '',
        dob: dto.dob ? new Date(dto.dob) : null,
        currentLocation: dto.currentLocation || '',
        careCategory: dto.careCategory || '',
        contactPreference:
          ('contactPreference' in dto && dto.contactPreference) || 'Email',
        status: 'isDraft' in dto && dto.isDraft ? 'Draft' : 'Enquiry',
      },
    });
  }

  async findAll(tenantId: string, query: Partial<EnquiryListQueryDTO> = {}) {
    const slice = resolvePagination(query);

    const where: Prisma.EnquiryWhereInput = { tenantId };

    if (query.status) {
      where.status = query.status;
    }

    if (query.careCategory) {
      where.careCategory = query.careCategory;
    }

    if (query.branchId) {
      where.branchId = query.branchId;
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { firstName: { contains: term, mode: 'insensitive' } },
        { middleName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
        { enquirerName: { contains: term, mode: 'insensitive' } },
        { enquirerPhone: { contains: term, mode: 'insensitive' } },
      ];
    }

    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
    const orderBy: Prisma.EnquiryOrderByWithRelationInput =
      query.sortBy === 'firstName'
        ? { firstName: sortOrder }
        : query.sortBy === 'lastName'
          ? { lastName: sortOrder }
          : { createdAt: sortOrder };

    return paginate(
      slice,
      (args) =>
        prisma.enquiry.findMany({
          where,
          ...args,
          orderBy,
          include: {
            convertedResident: {
              select: { id: true, fullName: true, status: true },
            },
          },
        }),
      () => prisma.enquiry.count({ where }),
    );
  }

  async getMetrics(tenantId: string) {
    const baseWhere: Prisma.EnquiryWhereInput = { tenantId };

    const [total, pendingAssessments, readyForAdmission, admittedCount] =
      await Promise.all([
        prisma.enquiry.count({
          where: baseWhere,
        }),
        prisma.enquiry.count({
          where: {
            ...baseWhere,
            status: 'Assessment Pending',
          },
        }),
        prisma.enquiry.count({
          where: {
            ...baseWhere,
            status: 'Ready for Admission',
          },
        }),
        prisma.enquiry.count({
          where: {
            ...baseWhere,
            status: 'Admitted',
          },
        }),
      ]);

    const pendingPercent =
      total > 0 ? Number(((pendingAssessments / total) * 100).toFixed(0)) : 0;
    const conversionPercent =
      total > 0 ? Number(((admittedCount / total) * 100).toFixed(0)) : 0;

    return {
      totalEnquiries: total,
      pendingAssessments,
      readyForAdmission,
      admittedCount,
      pendingPercent,
      conversionPercent,
    };
  }

  async findOne(id: string, tenantId: string) {
    const enquiry = await prisma.enquiry.findFirst({
      where: { id, tenantId },
      include: {
        convertedResident: {
          select: { id: true, fullName: true, status: true },
        },
      },
    });

    if (!enquiry) {
      throw new NotFoundException('Enquiry record not found');
    }

    return enquiry;
  }

  async update(id: string, dto: UpdateEnquiryAssessmentDTO, tenantId: string) {
    const enquiry = await this.findOne(id, tenantId);

    const data: Record<string, unknown> = { ...dto };
    if (dto.targetAdmissionDate !== undefined) {
      data.targetAdmissionDate =
        dto.targetAdmissionDate && String(dto.targetAdmissionDate).trim() !== ''
          ? new Date(dto.targetAdmissionDate)
          : null;
    }
    if (dto.admittedAt !== undefined) {
      data.admittedAt =
        dto.admittedAt && String(dto.admittedAt).trim() !== ''
          ? new Date(dto.admittedAt)
          : null;
    }
    if (dto.dob !== undefined) {
      data.dob =
        dto.dob && String(dto.dob).trim() !== '' ? new Date(dto.dob) : null;
    }
    if (dto.middleName !== undefined) {
      data.middleName = dto.middleName?.trim() || null;
    }

    if (dto.assessmentData) {
      data.assessmentData = toJsonValue(dto.assessmentData);
      data.assessmentCompletedAt = new Date();

      // Automatically sync core summary fields if provided in assessment
      const ad = dto.assessmentData;
      if (ad.mobilityStatus) data.mobilityNeeds = ad.mobilityStatus;
      if (ad.recommendedCareAllocationLevel)
        data.dependencyLevel = ad.recommendedCareAllocationLevel;
      if (ad.dietTexture) data.dietaryRequirements = ad.dietTexture;
      if (
        ad.fallInjuriesNotes ||
        (ad.riskBehaviors && ad.riskBehaviors.length > 0)
      ) {
        data.riskNotes = [
          ad.fallInjuriesNotes ? `Falls: ${ad.fallInjuriesNotes}` : '',
          ad.riskBehaviors && ad.riskBehaviors.length > 0
            ? `Risks: ${ad.riskBehaviors.join(', ')}`
            : '',
        ]
          .filter(Boolean)
          .join('; ');
      }

      if (dto.status) {
        data.status = dto.status;
      } else if (ad.finalAssessorDecision === 'APPROVED') {
        data.status = 'Ready for Admission';
      } else if (ad.finalAssessorDecision === 'DECLINED') {
        data.status = 'Closed';
      } else if (!enquiry.status || enquiry.status === 'Enquiry') {
        data.status = 'Assessment Pending';
      }
    } else if (
      dto.status === 'Assessment Pending' &&
      !enquiry.assessmentCompletedAt
    ) {
      data.assessmentCompletedAt = new Date();
    }

    return prisma.enquiry.update({
      where: { id: enquiry.id },
      data,
    });
  }

  async remove(id: string, tenantId: string) {
    const enquiry = await this.findOne(id, tenantId);

    return prisma.enquiry.delete({
      where: { id: enquiry.id },
    });
  }

  /**
   * B-09: Objection & Marketing Opt-Out (UK GDPR Art 21).
   */
  async recordOptOut(id: string, reason: string, tenantId: string) {
    const enquiry = await this.findOne(id, tenantId);
    return prisma.enquiry.update({
      where: { id: enquiry.id },
      data: {
        contactPreference: 'DoNotContact',
        optOutAt: new Date(),
        optOutReason: reason,
      },
    });
  }

  // --- Assessment Template CRUD ---

  async getTemplates(tenantId: string) {
    return prisma.assessmentTemplate.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getTemplateById(id: string, tenantId: string) {
    const template = await prisma.assessmentTemplate.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!template) {
      throw new NotFoundException('Assessment template not found');
    }

    return template;
  }

  async createTemplate(dto: CreateAssessmentTemplateDTO, tenantId: string) {
    if (dto.isDefault) {
      await prisma.assessmentTemplate.updateMany({
        where: { tenantId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return prisma.assessmentTemplate.create({
      data: {
        tenantId,
        name: dto.name,
        category: dto.category || 'Pre-Admission',
        description: dto.description || null,
        sections: toJsonValue(dto.sections),
        isDefault: dto.isDefault || false,
      },
    });
  }

  async updateTemplate(
    id: string,
    dto: UpdateAssessmentTemplateDTO,
    tenantId: string,
  ) {
    await this.getTemplateById(id, tenantId);

    if (dto.isDefault) {
      await prisma.assessmentTemplate.updateMany({
        where: { tenantId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.sections !== undefined) data.sections = toJsonValue(dto.sections);
    if (dto.isDefault !== undefined) data.isDefault = dto.isDefault;

    return prisma.assessmentTemplate.update({
      where: { id },
      data,
    });
  }

  async deleteTemplate(id: string, tenantId: string) {
    await this.getTemplateById(id, tenantId);

    return prisma.assessmentTemplate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

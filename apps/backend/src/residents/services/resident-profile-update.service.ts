import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma, Resident, Prisma, PrismaTransactionClient } from '@repo/db';
import {
  AdmitStep1DTO,
  AdmitStep3DTO,
  UpdateSupportedLivingDetailsDTO,
} from '@repo/schema';

import { toJsonValue } from '../../common/utils/json.util';

@Injectable()
export class ResidentProfileUpdateService {
  private parseSafeDate(val?: string | null): Date {
    if (!val) return new Date();
    const parsed = new Date(val);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  async updateResidentPersonalInfo(
    id: string,
    dto: Partial<AdmitStep1DTO>,
    updaterId: string,
    tenantId: string,
  ): Promise<Resident> {
    const existing = await prisma.resident.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Resident not found');

    return prisma.$transaction(async (tx: PrismaTransactionClient) => {
      const computedFullName =
        [dto.firstName, dto.middleName, dto.lastName]
          .filter(Boolean)
          .join(' ')
          .trim() || dto.fullName;

      const residentUpdateData: Record<string, unknown> = {
        updatedById: updaterId,
      };
      if (computedFullName !== undefined && computedFullName.length > 0)
        residentUpdateData.fullName = computedFullName;
      if (dto.dob !== undefined) residentUpdateData.dob = dto.dob;
      if (dto.photoUrl !== undefined)
        residentUpdateData.photoUrl = dto.photoUrl;
      if (dto.nationalId !== undefined)
        residentUpdateData.nhsNumber = dto.nationalId?.trim() || null;
      if (dto.admissionDate !== undefined)
        residentUpdateData.admissionDate = this.parseSafeDate(
          dto.admissionDate,
        );
      if (dto.nextOfKin !== undefined)
        residentUpdateData.nextOfKin = toJsonValue(dto.nextOfKin);

      const updatedResident = await tx.resident.update({
        where: { id },
        data: residentUpdateData,
      });

      const profileData: Record<string, unknown> = {};
      if (dto.firstName !== undefined) profileData.firstName = dto.firstName;
      if (dto.middleName !== undefined) profileData.middleName = dto.middleName;
      if (dto.lastName !== undefined) profileData.lastName = dto.lastName;
      if (dto.preferredName !== undefined)
        profileData.preferredName = dto.preferredName;
      if (dto.gender !== undefined) profileData.gender = dto.gender;
      if (dto.maritalStatus !== undefined)
        profileData.maritalStatus = dto.maritalStatus;
      if (dto.religion !== undefined) profileData.religion = dto.religion;
      if (dto.languagesSpoken !== undefined)
        profileData.languagesSpoken = dto.languagesSpoken;
      if (dto.interpreterRequired !== undefined)
        profileData.interpreterRequired = dto.interpreterRequired;
      if (dto.nationalId !== undefined)
        profileData.nationalId = dto.nationalId?.trim() || null;
      if (dto.nationalIdType !== undefined)
        profileData.nationalIdType = dto.nationalIdType;
      if (dto.formerOccupation !== undefined)
        profileData.formerOccupation = dto.formerOccupation;
      if (dto.hobbies !== undefined) profileData.hobbies = dto.hobbies;
      if (dto.previousAddress !== undefined)
        profileData.addressLine1 = dto.previousAddress;

      if (Object.keys(profileData).length > 0) {
        await tx.residentProfile.upsert({
          where: { residentId: id },
          create: { residentId: id, ...profileData },
          update: profileData,
        });
      }

      const admissionData: Record<string, unknown> = {};
      if (dto.admissionType !== undefined)
        admissionData.admissionType = dto.admissionType;
      if (dto.admittedFrom !== undefined)
        admissionData.admittedFrom = dto.admittedFrom;
      if (dto.referringFacilityName !== undefined)
        admissionData.referringFacilityName = dto.referringFacilityName;
      if (dto.admissionDate !== undefined)
        admissionData.expectedAdmissionDate = this.parseSafeDate(
          dto.admissionDate,
        );

      if (Object.keys(admissionData).length > 0) {
        await tx.residentAdmission.upsert({
          where: { residentId: id },
          create: { residentId: id, ...admissionData },
          update: admissionData,
        });
      }

      return updatedResident as Resident;
    });
  }

  async updateResidentCareProfile(
    id: string,
    dto: AdmitStep3DTO,
    updaterId: string,
    tenantId: string,
  ): Promise<Resident> {
    const resident = await prisma.resident.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!resident) throw new NotFoundException('Resident not found');

    const careData = {
      primaryDiagnosis: dto.primaryDiagnosis,
      secondaryDiagnoses: dto.secondaryDiagnoses ?? [],
      heightCm: dto.heightCm,
      weightKg: dto.weightKg,
      bmi: dto.bmi,
      baselineVitals: toJsonValue(dto.baselineVitals ?? {}) as object,
      allergies: [
        ...(dto.medicationAllergies ?? []),
        ...(dto.foodAllergies ?? []),
        ...(dto.environmentalAllergies ?? []),
      ],
      medicationAllergies: dto.medicationAllergies ?? [],
      foodAllergies: dto.foodAllergies ?? [],
      environmentalAllergies: dto.environmentalAllergies ?? [],
      currentMedications: toJsonValue(dto.currentMedications ?? []) as object,
      chronicConditions: dto.chronicConditions ?? [],
      postSurgeries: dto.pastSurgeries,
      skinConditionPressureAreas: dto.skinConditionPressureAreas,
      continenceStatus: dto.continenceStatus,
      sensoryAids: dto.sensoryAids ? [dto.sensoryAids] : [],
      dentalStatus: dto.dentalStatus,
      substanceUseHistory: dto.substanceUseHistory,
      recentHospitalizations: dto.recentHospitalizations,
    };

    await prisma.$transaction(async (tx: PrismaTransactionClient) => {
      await tx.residentCareProfile.upsert({
        where: { residentId: id },
        create: { residentId: id, ...careData },
        update: careData,
      });

      await tx.resident.update({
        where: { id },
        data: { admissionStep: 3, updatedById: updaterId },
      });
    });

    return (await prisma.resident.findUnique({ where: { id } })) as Resident;
  }

  async updateSupportedLivingDetails(
    id: string,
    dto: UpdateSupportedLivingDetailsDTO,
    updaterId: string,
    tenantId: string,
  ): Promise<Resident> {
    const existing = await prisma.resident.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Resident not found');

    const currentDetails =
      existing.supportedLivingDetails &&
      typeof existing.supportedLivingDetails === 'object'
        ? (existing.supportedLivingDetails as Record<string, unknown>)
        : {};

    const mergedDetails = {
      ...currentDetails,
      ...dto,
      ...(dto.tenancy
        ? {
            tenancy: {
              ...((currentDetails.tenancy as Record<string, unknown>) ?? {}),
              ...dto.tenancy,
            },
          }
        : {}),
      ...(dto.compatibility
        ? {
            compatibility: {
              ...((currentDetails.compatibility as Record<string, unknown>) ??
                {}),
              ...dto.compatibility,
            },
          }
        : {}),
      ...(dto.supportPlanHeader
        ? {
            supportPlanHeader: {
              ...((currentDetails.supportPlanHeader as Record<
                string,
                unknown
              >) ?? {}),
              ...dto.supportPlanHeader,
            },
          }
        : {}),
    };

    const updated = await prisma.resident.update({
      where: { id },
      data: {
        supportedLivingDetails: toJsonValue(
          mergedDetails,
        ) as Prisma.InputJsonValue,
        updatedById: updaterId,
      },
    });

    return updated as Resident;
  }
}

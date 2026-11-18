import { BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma, type MedicationPrescription } from '@repo/db';

export async function getActiveMedicationPrescription(
  prescriptionId: string,
  tenantId: string,
): Promise<MedicationPrescription> {
  const prescription = await prisma.medicationPrescription.findFirst({
    where: {
      id: prescriptionId,
      deletedAt: null,
      resident: { tenantId, deletedAt: null },
    },
  });
  if (!prescription)
    throw new NotFoundException('Medication prescription not found');
  if (prescription.status !== 'Active') {
    throw new BadRequestException(
      `Prescription is already ${prescription.status.toLowerCase()}`,
    );
  }
  return prescription;
}

export async function getMedicationResidentOrThrow(
  residentId: string,
  tenantId: string,
) {
  const resident = await prisma.resident.findFirst({
    where: { id: residentId, tenantId, deletedAt: null },
  });
  if (!resident) {
    throw new NotFoundException('Resident not found');
  }
  return resident;
}

export async function listMedicationPrescriptions(
  residentId: string,
  tenantId: string,
) {
  await getMedicationResidentOrThrow(residentId, tenantId);
  return prisma.medicationPrescription.findMany({
    where: { residentId, deletedAt: null, resident: { tenantId } },
    orderBy: { startDate: 'desc' },
    include: {
      pauses: { orderBy: { pauseFrom: 'asc' } },
      rounds: {
        where: { deletedAt: null },
        orderBy: { scheduledTime: 'asc' },
        include: {
          administrations: {
            where: { deletedAt: null, isSuperseded: false },
            orderBy: { administeredAt: 'desc' },
            take: 1,
            include: { observation: true },
          },
        },
      },
    },
  });
}

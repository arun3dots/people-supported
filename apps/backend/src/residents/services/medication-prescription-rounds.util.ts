import type {
  MedicationPrescription,
  Prisma,
  PrismaTransactionClient,
} from '@repo/db';
import { parseUkDateTime } from '../../common/utils/time.util';

export function buildPrescriptionRounds(
  prescription: MedicationPrescription,
  days: string[],
  times: string[],
  cutoff: Date,
  userId: string,
): Prisma.MedicationRoundCreateManyInput[] {
  const rows: Prisma.MedicationRoundCreateManyInput[] = [];
  for (const day of days) {
    for (const time of times) {
      const scheduledTime = parseUkDateTime(day, time);
      if (scheduledTime < cutoff) continue;
      rows.push({
        residentId: prescription.residentId,
        prescriptionId: prescription.id,
        drugName: prescription.drugName,
        dose: prescription.dose,
        form: prescription.form,
        instructions: prescription.instructions,
        imageUrls: prescription.imageUrls,
        allowLateAdministration: prescription.allowLateAdministration,
        mandatoryObservations: prescription.mandatoryObservations,
        scheduledTime,
        createdById: userId,
        updatedById: userId,
      });
    }
  }
  return rows;
}

export async function cancelPrescriptionRounds(
  tx: PrismaTransactionClient,
  prescriptionId: string,
  from: Date,
  to: Date | null,
  userId: string,
  tenantId: string,
): Promise<void> {
  await tx.medicationRound.updateMany({
    where: {
      prescriptionId,
      resident: { tenantId },
      deletedAt: null,
      administrations: { none: {} },
      scheduledTime: { gte: from, ...(to ? { lt: to } : {}) },
    },
    data: { deletedAt: new Date(), deletedById: userId },
  });
}

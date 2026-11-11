import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  prisma,
  ControlledDrugRegister,
  MedicationStockLedger,
} from '@repo/db';
import {
  CreateControlledDrugEntryDTO,
  CreateMedicationStockTransactionDTO,
} from '@repo/schema';
import { AuditService } from '../audit/audit.service';
import { toJsonValue } from '../common/utils/json.util';

@Injectable()
export class ControlledDrugService {
  constructor(private readonly auditService: AuditService) {}

  /**
   * C-07 & G-05: Controlled Drug Register Entry (Misuse of Drugs Regs 2001 & NICE SC1).
   * Strict running balance calculation, dual witness sign-off, immutable record.
   */
  async createEntry(
    dto: CreateControlledDrugEntryDTO,
    userId: string,
    userFullName: string,
    tenantId: string,
  ): Promise<ControlledDrugRegister> {
    const resident = await prisma.resident.findFirst({
      where: { id: dto.residentId, tenantId, deletedAt: null },
    });
    if (!resident) {
      throw new NotFoundException('Resident not found');
    }
    if (resident.recordState && resident.recordState !== 'Active') {
      throw new BadRequestException(
        `Controlled drug records cannot be modified when resident record state is "${resident.recordState}"`,
      );
    }
    if (dto.witnessById === userId) {
      throw new BadRequestException(
        'Dual-witness requirement: The witness cannot be the administering/recording staff member.',
      );
    }

    // Verify or derive running balance against latest entry
    const latestEntry = await prisma.controlledDrugRegister.findFirst({
      where: {
        tenantId,
        residentId: dto.residentId,
        drugName: { equals: dto.drugName, mode: 'insensitive' },
      },
      orderBy: { occurredAt: 'desc' },
    });

    const previousBalance = latestEntry?.runningBalance ?? 0;
    const expectedBalance = previousBalance + dto.quantityIn - dto.quantityOut;

    if (expectedBalance < 0) {
      throw new BadRequestException(
        `Insufficient controlled drug stock. Current balance: ${previousBalance}, attempted out: ${dto.quantityOut}`,
      );
    }

    const entry = await prisma.controlledDrugRegister.create({
      data: {
        tenantId,
        branchId: resident.branchId,
        residentId: dto.residentId,
        prescriptionId: dto.prescriptionId ?? null,
        drugName: dto.drugName,
        strength: dto.strength,
        form: dto.form,
        entryType: dto.entryType,
        quantityIn: dto.quantityIn,
        quantityOut: dto.quantityOut,
        runningBalance: expectedBalance,
        performedById: userId,
        performedByName: userFullName,
        witnessById: dto.witnessById,
        witnessByName: dto.witnessByName,
        witnessSignature: dto.witnessSignature ?? null,
        disposalMethod: dto.disposalMethod ?? null,
        notes: dto.notes ?? null,
        occurredAt: new Date(),
      },
    });

    void this.auditService.emitMedication({
      userId,
      tenantId,
      actionType: 'CONTROLLED_DRUG_RECORDED',
      entityType: 'ControlledDrugRegister',
      entityId: entry.id,
      entityLabel: `CD Register: ${dto.drugName} ${dto.strength} for ${resident.fullName}`,
      newValue: toJsonValue(entry) as Record<string, unknown>,
      metadata: {
        drugName: dto.drugName,
        dose: dto.strength,
        entryType: dto.entryType,
        quantityIn: dto.quantityIn,
        quantityOut: dto.quantityOut,
        runningBalance: expectedBalance,
        witnessByName: dto.witnessByName,
      },
    });

    return entry;
  }

  async listEntries(
    residentId: string,
    tenantId: string,
    drugName?: string,
  ): Promise<ControlledDrugRegister[]> {
    const resident = await prisma.resident.findFirst({
      where: { id: residentId, tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!resident) {
      throw new NotFoundException('Resident not found');
    }

    return prisma.controlledDrugRegister.findMany({
      where: {
        tenantId,
        residentId,
        ...(drugName
          ? { drugName: { equals: drugName, mode: 'insensitive' } }
          : {}),
      },
      orderBy: { occurredAt: 'desc' },
    });
  }

  /**
   * C-07 & G-05: General Medication Stock Ledger
   */
  async recordStockTransaction(
    dto: CreateMedicationStockTransactionDTO,
    userId: string,
    tenantId: string,
  ): Promise<MedicationStockLedger> {
    const resident = await prisma.resident.findFirst({
      where: { id: dto.residentId, tenantId, deletedAt: null },
    });
    if (!resident) {
      throw new NotFoundException('Resident not found');
    }

    const ledger = await prisma.medicationStockLedger.create({
      data: {
        tenantId,
        branchId: resident.branchId,
        residentId: dto.residentId,
        prescriptionId: dto.prescriptionId ?? null,
        drugName: dto.drugName,
        batchNumber: dto.batchNumber ?? null,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        transactionType: dto.transactionType,
        quantityDelta: dto.quantityDelta,
        balanceAfter: dto.balanceAfter,
        recordedById: userId,
        witnessById: dto.witnessById ?? null,
        reason: dto.reason ?? null,
      },
    });

    return ledger;
  }

  async listStockLedger(
    residentId: string,
    tenantId: string,
  ): Promise<MedicationStockLedger[]> {
    const resident = await prisma.resident.findFirst({
      where: { id: residentId, tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!resident) {
      throw new NotFoundException('Resident not found');
    }

    return prisma.medicationStockLedger.findMany({
      where: { tenantId, residentId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

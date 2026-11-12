import { ConflictException } from '@nestjs/common';
import { prisma } from '@repo/db';
import type { PropertyRoomDraftDTO } from '@repo/schema';

type ExtendedTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export async function syncPropertyRoomsTx(
  tx: ExtendedTx,
  wingId: string,
  branchId: string,
  wingCode: string,
  userId: string,
  draftRooms: PropertyRoomDraftDTO[],
): Promise<void> {
  const existingRooms = await tx.room.findMany({
    where: { wingId, deletedAt: null },
    include: { beds: { where: { deletedAt: null }, orderBy: { createdAt: 'asc' } } },
  });

  const existingById = new Map(existingRooms.map((r) => [r.id, r]));
  const keptIds = new Set(
    draftRooms.map((r) => r.id).filter((id): id is string => Boolean(id)),
  );

  for (const room of existingRooms) {
    if (keptIds.has(room.id)) continue;
    const hasOccupied = room.beds.some(
      (b) => b.status === 'Occupied' || Boolean(b.residentId),
    );
    if (hasOccupied) {
      throw new ConflictException(
        `Cannot remove room "${room.roomNumber}" because it has occupied beds`,
      );
    }
    const now = new Date();
    await tx.bed.updateMany({
      where: { roomId: room.id, deletedAt: null },
      data: { deletedAt: now, deletedById: userId },
    });
    await tx.room.update({
      where: { id: room.id },
      data: { deletedAt: now, deletedById: userId },
    });
  }

  for (let idx = 0; idx < draftRooms.length; idx++) {
    const draft = draftRooms[idx]!;
    const existing = draft.id ? existingById.get(draft.id) : undefined;
    const rNum = draft.roomNumber.trim();
    const targetBeds = Math.max(1, draft.bedsCount ?? 1);
    const description = [draft.floor || 'Ground floor']
      .filter(Boolean)
      .join(' · ');
    const notes =
      draft.weeklyRent !== undefined
        ? `£${Number(draft.weeklyRent).toFixed(2)}/wk rent`
        : (draft.notes ?? null);

    if (existing) {
      await tx.room.update({
        where: { id: existing.id },
        data: {
          roomNumber: rNum,
          name: (draft.name || rNum).trim(),
          type: draft.type || existing.type,
          description,
          notes,
          updatedById: userId,
        },
      });

      const currentBeds = existing.beds;
      if (targetBeds > currentBeds.length) {
        for (let b = currentBeds.length; b < targetBeds; b++) {
          const bedNumber = `${rNum}-B${b + 1}`;
          const bedCode = `${existing.code}-B${b + 1}-${Math.floor(100 + Math.random() * 900)}`;
          await tx.bed.create({
            data: {
              branchId,
              roomId: existing.id,
              number: bedNumber,
              code: bedCode,
              bedLabel: targetBeds === 1 ? `${rNum} Bed` : `Bed ${b + 1}`,
              bedType: 'Standard Bed',
              status: 'Available',
              createdById: userId,
              updatedById: userId,
            },
          });
        }
      } else if (targetBeds < currentBeds.length) {
        const excess = currentBeds.slice(targetBeds);
        if (excess.some((b) => b.status === 'Occupied' || Boolean(b.residentId))) {
          throw new ConflictException(
            `Cannot reduce beds in room "${rNum}" below occupied count`,
          );
        }
        await tx.bed.updateMany({
          where: { id: { in: excess.map((b) => b.id) } },
          data: { deletedAt: new Date(), deletedById: userId },
        });
      }
    } else {
      const rCode = `${wingCode}-R${String(idx + 1).padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`;
      const created = await tx.room.create({
        data: {
          branchId,
          wingId,
          roomNumber: rNum,
          name: (draft.name || rNum).trim(),
          code: rCode,
          type: draft.type || 'Single',
          description,
          notes,
          status: 'Active',
          createdById: userId,
          updatedById: userId,
        },
      });
      for (let b = 0; b < targetBeds; b++) {
        const bedNumber = targetBeds === 1 ? `${rNum}-B1` : `${rNum}-B${b + 1}`;
        const bedCode = `${rCode}-B${b + 1}-${Math.floor(100 + Math.random() * 900)}`;
        await tx.bed.create({
          data: {
            branchId,
            roomId: created.id,
            number: bedNumber,
            code: bedCode,
            bedLabel: targetBeds === 1 ? `${rNum} Bed` : `Bed ${b + 1}`,
            bedType: 'Standard Bed',
            status: 'Available',
            createdById: userId,
            updatedById: userId,
          },
        });
      }
    }
  }
}

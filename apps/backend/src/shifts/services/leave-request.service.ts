import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@repo/db";
import { CreateLeaveRequestDTO, UpdateLeaveRequestStatusDTO } from "@repo/schema";

@Injectable()
export class LeaveRequestService {
  async getAll(tenantId: string) {
    return prisma.leaveRequest.findMany({
      where: { tenantId },
      include: {
        staff: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: { select: { name: true } },
            profile: { select: { profilePhotoUrl: true, phoneNumber: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(tenantId: string, userId: string, dto: CreateLeaveRequestDTO) {
    return prisma.leaveRequest.create({
      data: {
        tenantId,
        staffId: dto.staffId,
        type: dto.type,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        reason: dto.reason,
        status: "Pending",
        createdById: userId,
      },
      include: {
        staff: {
          select: {
            id: true,
            fullName: true,
            role: { select: { name: true } },
          },
        },
      },
    });
  }

  async updateStatus(
    tenantId: string,
    id: string,
    userId: string,
    dto: UpdateLeaveRequestStatusDTO,
  ) {
    const existing = await prisma.leaveRequest.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`Leave request not found`);
    }

    return prisma.leaveRequest.update({
      where: { id },
      data: {
        status: dto.status,
        adminNotes: dto.adminNotes,
        updatedById: userId,
      },
    });
  }
}

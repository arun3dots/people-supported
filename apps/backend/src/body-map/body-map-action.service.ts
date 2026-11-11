import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { prisma } from '@repo/db';
import {
  CreateBodyMapFindingActionDTO,
  UpdateBodyMapFindingActionDTO,
} from '@repo/schema';
import { AuthenticatedUser } from '../common/interfaces/request.interface';

@Injectable()
export class BodyMapActionService {
  /**
   * Adds an action to an active finding.
   * Rejects if the finding is already resolved.
   */
  async createAction(
    findingId: string,
    dto: CreateBodyMapFindingActionDTO,
    tenantId: string,
    user: AuthenticatedUser,
  ) {
    const finding = await prisma.bodyMapFinding.findFirst({
      where: { id: findingId },
      include: {
        assessment: {
          select: { tenantId: true, residentId: true },
        },
      },
    });

    if (!finding) {
      throw new NotFoundException('Finding not found');
    }
    if (finding.assessment.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }
    if (finding.status === 'Resolved') {
      throw new BadRequestException('Cannot add action to a resolved finding');
    }

    return prisma.bodyMapFindingAction.create({
      data: {
        findingId,
        description: dto.description.trim(),
        createdById: user.userId,
        createdByName: user.fullName || user.email,
      },
    });
  }

  /**
   * Updates an existing action.
   * Rejects if the finding is already resolved.
   */
  async updateAction(
    findingId: string,
    actionId: string,
    dto: UpdateBodyMapFindingActionDTO,
    tenantId: string,
  ) {
    const action = await prisma.bodyMapFindingAction.findFirst({
      where: { id: actionId, findingId },
      include: {
        finding: {
          include: {
            assessment: {
              select: { tenantId: true },
            },
          },
        },
      },
    });

    if (!action) {
      throw new NotFoundException('Action not found');
    }
    if (action.finding.assessment.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }
    if (action.finding.status === 'Resolved') {
      throw new BadRequestException(
        'Cannot edit actions on a resolved finding',
      );
    }

    return prisma.bodyMapFindingAction.update({
      where: { id: actionId },
      data: {
        description: dto.description.trim(),
      },
    });
  }

  /**
   * Deletes an action from a finding.
   * Rejects if the finding is already resolved.
   */
  async deleteAction(findingId: string, actionId: string, tenantId: string) {
    const action = await prisma.bodyMapFindingAction.findFirst({
      where: { id: actionId, findingId },
      include: {
        finding: {
          include: {
            assessment: {
              select: { tenantId: true },
            },
          },
        },
      },
    });

    if (!action) {
      throw new NotFoundException('Action not found');
    }
    if (action.finding.assessment.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }
    if (action.finding.status === 'Resolved') {
      throw new BadRequestException(
        'Cannot delete actions on a resolved finding',
      );
    }

    await prisma.bodyMapFindingAction.delete({
      where: { id: actionId },
    });

    return { success: true };
  }
}

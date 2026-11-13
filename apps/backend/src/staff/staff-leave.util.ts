import { prisma, type User } from '@repo/db';
import { getUkDateString } from '../common/utils/time.util';

/** Calendar leave is inclusive of its end date; shift leave uses exact times. */
export async function getStaffOnLeaveIds(
  users: Pick<User, 'id' | 'tenantId'>[],
  branchId: string,
  now = new Date(),
): Promise<Set<string>> {
  if (users.length === 0) return new Set();

  const userIds = users.map((user) => user.id);
  const tenantIds = [
    ...new Set(
      users
        .map((user) => user.tenantId)
        .filter((id): id is string => id !== null),
    ),
  ];
  // LeaveRequest dates come from date inputs and are stored at UTC midnight.
  const today = new Date(`${getUkDateString(now)}T00:00:00.000Z`);
  const [calendarLeave, shiftLeave] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: {
        tenantId: { in: tenantIds },
        staffId: { in: userIds },
        status: 'Approved',
        startDate: { lte: today },
        endDate: { gte: today },
      },
      select: { staffId: true },
    }),
    prisma.shiftRequest.findMany({
      where: {
        tenantId: { in: tenantIds },
        branchId,
        userId: { in: userIds },
        type: 'Leave',
        status: 'Approved',
        startTime: { lte: now },
        endTime: { gte: now },
      },
      select: { userId: true },
    }),
  ]);

  return new Set([
    ...calendarLeave.map((leave) => leave.staffId),
    ...shiftLeave.map((leave) => leave.userId),
  ]);
}

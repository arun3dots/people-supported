import { prisma } from '@repo/db';

export interface UserSummary {
  fullName: string;
  email: string;
  roleName?: string;
}

/**
 * Resolves user names/emails/roles from the main tenant database for any audit logs
 * where userFullName is missing (e.g. historical records or events emitted with only userId).
 */
export async function populateAuditUserSummaries(
  logs: Array<{
    userId?: string | null;
    userFullName?: string | null;
    userEmail?: string | null;
    userRoleName?: string | null;
  }>,
): Promise<Map<string, UserSummary>> {
  const missingUserIds = new Set<string>();

  for (const log of logs) {
    if (
      log.userId &&
      (!log.userFullName || log.userFullName === 'Unknown User')
    ) {
      missingUserIds.add(log.userId);
    }
  }

  const userMap = new Map<string, UserSummary>();
  if (missingUserIds.size === 0) {
    return userMap;
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        id: { in: Array.from(missingUserIds) },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: {
          select: { name: true },
        },
      },
    });

    for (const u of users) {
      userMap.set(u.id, {
        fullName: u.fullName || u.email,
        email: u.email,
        roleName: u.role?.name,
      });
    }
  } catch {
    // Fail-safe: if main database lookup fails, retain existing values
  }

  return userMap;
}

import { rawPrisma } from "./src";

async function main(): Promise<void> {
  const users = await rawPrisma.user.findMany({
    where: { fullName: { contains: "cantra", mode: "insensitive" } },
    select: { id: true, fullName: true, tenantId: true },
  });
  console.log("users", users);
  const now = new Date();
  for (const u of users) {
    const shifts = await rawPrisma.shift.findMany({
      where: {
        assignments: { some: { userId: u.id } },
        endTime: { gte: new Date(now.getTime() - 3 * 864e5) },
        startTime: { lte: new Date(now.getTime() + 3 * 864e5) },
      },
      select: {
        id: true, startTime: true, endTime: true, status: true, deletedAt: true,
        staffLogs: { where: { userId: u.id }, select: { status: true, createdAt: true }, orderBy: { createdAt: "desc" } },
        assignments: { where: { userId: u.id }, select: { deletedAt: true } },
      },
      orderBy: { startTime: "asc" },
    });
    console.log("now", now.toISOString());
    console.log(JSON.stringify(shifts, null, 1));
  }
}

main().finally(() => rawPrisma.$disconnect());


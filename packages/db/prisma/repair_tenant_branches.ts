import { prisma } from '../src/index';

/**
 * One-time backfill script:
 * Ensures all tenants have at least one Branch ("Main Branch"),
 * and all tenant users have a UserBranch link to that branch as primary.
 */
async function repairTenantBranches() {
  console.log('Starting tenant and branch backfill...');

  const tenants = await prisma.tenant.findMany({
    include: {
      branches: true,
      users: {
        include: { branches: true },
      },
    },
  });

  for (const tenant of tenants) {
    let mainBranch = tenant.branches[0];

    if (!mainBranch) {
      console.log(`[Tenant ${tenant.name} (${tenant.id})] Creating default Main Branch...`);
      mainBranch = await prisma.branch.create({
        data: {
          tenantId: tenant.id,
          name: 'Main Branch',
          code: 'MAIN',
          addressLine1: tenant.addressLine1,
          addressLine2: tenant.addressLine2,
          city: tenant.city,
          postcode: tenant.postcode,
          status: 'Active',
        },
      });
      console.log(`  -> Created Main Branch (${mainBranch.id})`);
    } else {
      console.log(`[Tenant ${tenant.name} (${tenant.id})] Already has branch: ${mainBranch.name} (${mainBranch.id})`);
    }

    for (const user of tenant.users) {
      if (!user.branches || user.branches.length === 0) {
        console.log(`  -> Assigning user ${user.email} (${user.id}) to branch ${mainBranch.id}...`);
        await prisma.userBranch.upsert({
          where: {
            userId_branchId: {
              userId: user.id,
              branchId: mainBranch.id,
            },
          },
          update: { isPrimary: true },
          create: {
            userId: user.id,
            branchId: mainBranch.id,
            isPrimary: true,
          },
        });
        console.log(`     Assigned!`);
      } else {
        console.log(`  -> User ${user.email} already has branch assignment(s): ${user.branches.map(b => b.branchId).join(', ')}`);
      }
    }
  }

  console.log('Finished tenant and branch backfill successfully.');
}

repairTenantBranches()
  .catch((err) => {
    console.error('Backfill failed:', err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });


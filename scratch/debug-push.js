const { prisma } = require("./packages/db/dist");

async function main() {
  const userId = "2941ca01-5807-468f-8f0e-477a92a1b02c"; // admin@platform.com
  const subs = await prisma.pushSubscription.findMany({
    where: { userId }
  });
  console.log(`User ${userId} has ${subs.length} push subscriptions.`);
  console.log(JSON.stringify(subs, null, 2));

  const prefs = await prisma.notificationPreference.findUnique({
    where: { userId }
  });
  console.log(`Preferences:`, JSON.stringify(prefs, null, 2));
}

main().catch(console.error);

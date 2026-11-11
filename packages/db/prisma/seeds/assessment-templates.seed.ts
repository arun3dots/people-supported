import { PrismaClient } from "../../src/generated/client";
import { DEMO_TENANT_ID } from "./tenant.seed";
import { ALL_ASSESSMENT_TEMPLATES } from "./templates";

export async function seedAssessmentTemplates(prisma: PrismaClient): Promise<void> {
  console.log("Seeding 5 CQC-aligned Assessment Templates...");

  for (const t of ALL_ASSESSMENT_TEMPLATES) {
    await prisma.assessmentTemplate.upsert({
      where: { id: t.id },
      update: {
        tenantId: DEMO_TENANT_ID,
        name: t.name,
        category: t.category,
        description: t.description,
        isDefault: t.isDefault,
        sections: t.sections as unknown as object,
      },
      create: {
        id: t.id,
        tenantId: DEMO_TENANT_ID,
        name: t.name,
        category: t.category,
        description: t.description,
        isDefault: t.isDefault,
        sections: t.sections as unknown as object,
      },
    });
  }

  console.log(`Successfully seeded ${ALL_ASSESSMENT_TEMPLATES.length} CQC-aligned Assessment Templates.`);
}

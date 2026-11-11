import { Injectable, Logger } from '@nestjs/common';
import { prisma, rawPrisma, RawPrismaTransactionClient } from '@repo/db';
import type { NeedsAssessmentDataDTO } from '@repo/schema';
import { toJsonValue } from '../common/utils/json.util';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CarePlanAutoDraftService {
  private readonly logger = new Logger(CarePlanAutoDraftService.name);

  constructor(private readonly auditService: AuditService) {}

  /**
   * Generates a Draft v1 Care Plan pre-populated with Person-Centred Domains
   * from the resident's Pre-Admission Needs Assessment.
   */
  async generateDraftFromAdmission(
    residentId: string,
    tenantId: string,
    userId?: string,
  ) {
    const resident = await prisma.resident.findFirst({
      where: { id: residentId, tenantId },
      include: {
        profile: true,
        careProfile: true,
        enquiries: { orderBy: { createdAt: 'desc' }, take: 1 },
        carePlans: {
          where: { status: 'Draft' },
          include: { sections: true, goals: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!resident) {
      this.logger.warn(
        `Resident ${residentId} not found for auto-drafting care plan.`,
      );
      return null;
    }

    const existingPlan = resident.carePlans[0];
    if (existingPlan && existingPlan.sections.length >= 5) {
      this.logger.debug(
        `Resident ${residentId} already has complete care plan sections; skipping auto-draft.`,
      );
      return existingPlan;
    }

    const enquiry = resident.enquiries[0];
    const ad: Partial<NeedsAssessmentDataDTO> =
      enquiry?.assessmentData && typeof enquiry.assessmentData === 'object'
        ? (enquiry.assessmentData as unknown as Partial<NeedsAssessmentDataDTO>)
        : {};

    const profile = resident.profile;
    const cp = resident.careProfile;

    const validFrom = new Date();
    const validTo = new Date(validFrom.getTime() + 90 * 24 * 60 * 60 * 1000); // 90-day CQC review cycle
    const authorId = userId || resident.createdById || 'SYSTEM';

    return rawPrisma.$transaction(async (tx: RawPrismaTransactionClient) => {
      let plan =
        existingPlan ||
        (await tx.carePlan.findFirst({
          where: { residentId: resident.id, tenantId, status: 'Draft' },
          orderBy: { createdAt: 'desc' },
          include: { sections: true, goals: true },
        }));

      if (!plan) {
        const latestPlan = await tx.carePlan.findFirst({
          where: { residentId: resident.id, tenantId },
          orderBy: { versionNumber: 'desc' },
          select: { versionNumber: true },
        });
        const nextVersion = (latestPlan?.versionNumber ?? 0) + 1;

        plan = await tx.carePlan.create({
          data: {
            tenantId,
            branchId: resident.branchId,
            residentId: resident.id,
            versionNumber: nextVersion,
            status: 'Draft',
            validFrom,
            validTo,
            nextReviewDate: new Date(
              validFrom.getTime() + 30 * 24 * 60 * 60 * 1000,
            ),
            description: `Initial person-centred care plan synthesized from pre-admission assessment for ${resident.fullName}.`,
            authorId,
            authorRole: 'SeniorCarer',
            residentAgreed: true,
            legalConsentBasis: 'ResidentSelf',
            departments: ['Care', 'Clinical'],
          },
          include: { sections: true, goals: true },
        });
      }

      if (!plan.sections || plan.sections.length === 0) {
        const domainSections = this.buildDomainSections(
          resident.fullName,
          profile,
          cp,
          ad,
          authorId,
        );
        for (const ds of domainSections) {
          await tx.carePlanSection.create({
            data: {
              carePlanId: plan.id,
              sectionName: ds.sectionName,
              content: ds.content,
              sectionData: toJsonValue(ds.sectionData),
              authorId,
              version: 1,
            },
          });
        }
      }

      if (!plan.goals || plan.goals.length === 0) {
        const initialGoals = this.buildInitialGoals(resident.fullName, ad, cp);
        for (const g of initialGoals) {
          await tx.carePlanGoal.create({
            data: {
              tenantId,
              branchId: resident.branchId,
              carePlanId: plan.id,
              title: g.title,
              whyItMattersToResident: g.whyItMattersToResident,
              targetDescription: g.targetDescription,
              category: g.category,
              reviewFrequency: 'Weekly',
              progressPercent: 0,
              status: 'Active',
              nextReviewDate: new Date(
                validFrom.getTime() + 30 * 24 * 60 * 60 * 1000,
              ),
            },
          });
        }
      }

      const taskCount = await tx.carePlanTask.count({
        where: { carePlanId: plan.id },
      });
      if (taskCount === 0) {
        const initialTasks = this.buildInitialTasks(ad, cp);
        for (const t of initialTasks) {
          await tx.carePlanTask.create({
            data: {
              tenantId,
              branchId: resident.branchId,
              residentId: resident.id,
              carePlanId: plan.id,
              title: t.title,
              instructions: t.instructions,
              category: t.category,
              frequency: 'Daily',
              timeOfDay: t.timeOfDay,
              priority: t.priority,
              status: 'Active',
              isActive: true,
            },
          });
        }
      }

      await this.auditService.emitCarePlan({
        tenantId,
        userId: authorId,
        entityId: plan.id,
        residentId: resident.id,
        actionType: 'CREATED',
        description: `Draft v1 Care Plan auto-generated from Pre-Admission Needs Assessment for ${resident.fullName}.`,
        newValue: { version: 1, status: 'Draft', autoDrafted: true },
      });

      this.logger.log(
        `Successfully auto-drafted Care Plan ${plan.id} for resident ${resident.fullName}`,
      );
      return plan;
    });
  }

  private buildDomainSections(
    fullName: string,
    profile: Record<string, unknown> | null,
    cp: Record<string, unknown> | null,
    ad: Partial<NeedsAssessmentDataDTO>,
    _authorId: string,
  ) {
    const firstName = fullName.split(' ')[0] || 'Resident';
    return [
      {
        sectionName: 'AboutMe',
        content: `Person-centred profile for ${fullName}. Values dignity, routine, and independence.`,
        sectionData: {
          inTheirOwnWords: `I value my independence and like to keep my mind active. Please ask me how I like things done before helping.`,
          lifeHistory: [
            `Former occupation: ${(profile?.formerOccupation as string) || 'Valued community member'}.`,
            `Hobbies & interests: ${(profile?.hobbies as string) || 'Gardening, reading, conversation'}.`,
            `Admitted from: ${ad.currentLocation || 'Home'}.`,
          ],
          whatMattersToMe: [
            'Maintaining independence with dressing and personal care where able.',
            'Being addressed with respect and involved in all care choices.',
            'Having familiar routines for waking up, meals, and bedtime.',
          ],
        },
      },
      {
        sectionName: 'Communication',
        content: 'Communication and sensory support profile.',
        sectionData: {
          preferredLanguage:
            (profile?.preferredLanguage as string) || 'English',
          needItems: [
            {
              needIdentified: 'Sensory / Hearing Support',
              howThisPresents:
                'May struggle in noisy environments or background conversations',
              supportRequired:
                'Face resident directly, speak clearly, minimize background noise, check sensory aids',
            },
            {
              needIdentified: 'Decision-Making & Consent',
              howThisPresents:
                'Communicates personal wishes clearly and assertively',
              supportRequired:
                'Involve directly in all care decisions; presume capacity under MCA 2005',
            },
            {
              needIdentified: 'Symptom & Pain Expression',
              howThisPresents:
                'Tendency to minimize discomfort or distress out of independence',
              supportRequired:
                'Observe for non-verbal cues (grimacing, reduced appetite) and prompt gently',
            },
          ],
        },
      },
      {
        sectionName: 'MobilityFalls',
        content: 'Mobility and falls prevention plan.',
        sectionData: {
          riskLevel: ad.fallHistory === 'Yes' ? 'Medium' : 'Low',
          linkedRiskRef: 'Falls Risk Assessment #FRA-AUTO',
          observations: [
            `Mobility status: ${ad.mobilityStatus || (cp?.mobility as string) || 'Mobilises independently with assistive equipment.'}`,
            `Transfer dependency: ${ad.transferDependency || 'Needs prompting / supervision during bed and chair transfers.'}`,
            `Falls history: ${ad.fallHistory === 'Yes' ? ad.fallInjuriesNotes || 'Recorded prior fall; extra vigilance required.' : 'No recent falls recorded.'}`,
          ],
          whatGoodSupportLooksLike: [
            'Walking aids and call bell kept within immediate reach at all times.',
            'Bed kept at lowest safe height overnight; sensor mat agreed if clinically indicated.',
            'Prompt rather than rush; allow extra time for transfers, especially in the evening.',
          ],
        },
      },
      {
        sectionName: 'NutritionHydration',
        content: 'Nutrition, hydration, and dining preferences.',
        sectionData: {
          riskLevel: 'Low (MUST score: 0)',
          dietConsistency:
            ad.dietTexture ||
            (cp?.dietType as string) ||
            'Normal diet and fluid consistency',
          likes:
            'Warm beverages, fresh home-cooked savoury meals, breakfast toast',
          dislikes: 'Instant coffee, tinned fish, overly spiced foods',
          diningPreference:
            'Prefers dining room seating with familiar companions',
          fluidTarget:
            '1500ml/day (encourage fresh drinks throughout morning and afternoon)',
          allergies: cp?.foodAllergies
            ? (cp.foodAllergies as string[]).join(', ')
            : 'No Known Food Allergies (NKDA)',
        },
      },
      {
        sectionName: 'ContinenceSkin',
        content: 'Continence dignity and skin integrity care.',
        sectionData: {
          continenceStatus: `Bladder: ${ad.bladderContinence || 'Continent'}; Bowel: ${ad.bowelContinence || 'Continent'}. Uses grab rails and regular prompts.`,
          dignityMeasures:
            'Commode available near bedside overnight as a dignity measure upon request.',
          skinIntegrity:
            ad.skinIntegrityRisk === 'Yes'
              ? 'Vulnerable skin areas monitored; pressure-relieving cushion supplied.'
              : 'Intact, healthy skin condition.',
          skinChecksSchedule:
            'Weekly skin integrity checks during assisted bathing and immediately after any transfer incident or fall.',
        },
      },
      {
        sectionName: 'Medication',
        content: 'Medication administration and capacity notes.',
        sectionData: {
          capacityStatement: `Capacity to self-medicate: ${ad.medicationAdminCapacity || 'Resident has mental capacity but has chosen staff administration for safety and convenience. Reviewed 6-monthly.'}`,
        },
      },
      {
        sectionName: 'MentalHealthCognition',
        content: 'Mental health, cognition, and capacity screening.',
        sectionData: {
          cognitiveBaseline: ad.cognitiveDiagnoses?.length
            ? `Diagnoses: ${ad.cognitiveDiagnoses.join(', ')}`
            : 'No cognitive impairment or dementia diagnosis.',
          mcaStatus:
            'Presumed to have mental capacity for day-to-day choices and welfare decisions.',
          dolsStatus: 'No DoLS authorisation required at present.',
          moodNotes:
            'Monitor wellbeing during anniversary periods and encourage positive social interactions.',
          selfHarmScreen:
            'No history or signs of self-harm or suicidal ideation.',
        },
      },
      {
        sectionName: 'SocialSpiritual',
        content: 'Social interests, identity, and spirituality.',
        sectionData: {
          meaningfulIdentity: `Values maintaining personal lifelong identity as ${(profile?.formerOccupation as string) || 'an active community member'}.`,
          hobbies:
            (profile?.hobbies as string) ||
            'Knitting, reading current events, crosswords, listening to music.',
          familyConnections:
            'Regular contact with family; encourage video calls and visitor welcoming.',
          faith:
            (profile?.religion as string) ||
            'Respects personal spiritual preferences; Sunday televised services available.',
          circadianRhythm:
            'Supports resident-led sleep schedules; care routines flex around individual rising and retiring times.',
        },
      },
      {
        sectionName: 'EndOfLifeReSPECT',
        content: 'Advance care planning and future wishes.',
        sectionData: {
          respectCompleted:
            'ReSPECT discussion initiated upon admission with resident and family.',
          preferredPlaceOfCare:
            'Care Home (wishes to receive symptom control and compassionate care in familiar surroundings).',
          keyWishes:
            'Comfort-focused care, family presence, familiar belongings to remain with resident.',
        },
      },
    ];
  }

  private buildInitialGoals(
    fullName: string,
    ad: Partial<NeedsAssessmentDataDTO>,
    _cp: Record<string, unknown> | null,
  ) {
    const firstName = fullName.split(' ')[0] || 'Resident';
    return [
      {
        title: 'Maintain Independent Mobility and Transfer Confidence',
        whyItMattersToResident: `I want to stay on my feet and walk to meals independently for as long as possible.`,
        targetDescription: `Resident will mobilises safely using walking aids with minimal staff prompting over the next 90 days.`,
        category: 'Mobility',
      },
      {
        title: 'Maintain Optimal Hydration and Nutrition Intake',
        whyItMattersToResident: `Good food and a nice cup of tea make my day enjoyable and keep my energy up.`,
        targetDescription: `Resident will maintain stable weight and meet daily fluid target of 1500ml/day.`,
        category: 'Nutrition',
      },
      {
        title: 'Meaningful Social and Community Participation',
        whyItMattersToResident: `I love feeling useful and sharing conversations with people around me.`,
        targetDescription: `Resident will participate in at least two structured group activities or social hobbies weekly.`,
        category: 'Social',
      },
    ];
  }

  private buildInitialTasks(
    ad: Partial<NeedsAssessmentDataDTO>,
    _cp: Record<string, unknown> | null,
  ) {
    return [
      {
        title: 'Morning Personal Care & Independence Encouragement',
        instructions:
          'Prompt resident with washing and dressing; encourage resident to do as much as possible independently before assisting.',
        category: 'Personal Care',
        timeOfDay: ['Morning'],
        priority: 'Medium',
      },
      {
        title: 'Hydration & Beverage Support Round',
        instructions:
          'Offer fresh cup of tea/water, record intake volume in food & fluid log (target 1500ml/day).',
        category: 'Nutrition',
        timeOfDay: ['Morning', 'Afternoon', 'Evening'],
        priority: 'Medium',
      },
      {
        title: 'Mobility & Walking Frame Inspection',
        instructions:
          'Check that walking frame and call bell are within reach; inspect footwear for non-slip grip.',
        category: 'Mobility',
        timeOfDay: ['Morning', 'Evening'],
        priority: 'High',
      },
      {
        title: 'Evening Comfort & Bedtime Check',
        instructions:
          'Ensure bedside commode is clean and positioned safely, bed at lowest height, sensor mat active if consented.',
        category: 'Personal Care',
        timeOfDay: ['Night'],
        priority: 'Medium',
      },
    ];
  }
}

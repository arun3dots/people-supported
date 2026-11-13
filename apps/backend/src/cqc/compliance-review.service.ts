import { Injectable } from '@nestjs/common';
import { prisma } from '@repo/db';
import {
  ComplianceReviewQueryDTO,
  ComplianceReviewResponseDTO,
  ComplianceReviewItemDTO,
} from '@repo/schema';

@Injectable()
export class ComplianceReviewService {
  async getComplianceReviews(
    tenantId: string,
    query: ComplianceReviewQueryDTO,
  ): Promise<ComplianceReviewResponseDTO> {
    const days = query.days ?? 30;
    const now = new Date();
    const cutoffDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const [carePlans, staffCerts, prescriptions] = await Promise.all([
      // 1. Expiring Support Plans
      prisma.carePlan.findMany({
        where: {
          tenantId,
          status: { in: ['Active', 'active'] },
          OR: [
            { validTo: { lte: cutoffDate } },
            { nextReviewDate: { lte: cutoffDate } },
          ],
        },
        include: {
          resident: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      }),

      // 2. Expiring Staff Certifications
      prisma.staffCertification.findMany({
        where: {
          user: {
            tenantId,
            deletedAt: null,
          },
          expiryDate: { lte: cutoffDate },
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: {
                select: { name: true },
              },
            },
          },
        },
      }),

      // 3. Expiring Medication Prescriptions
      prisma.medicationPrescription.findMany({
        where: {
          resident: {
            tenantId,
            deletedAt: null,
          },
          status: 'Active',
          deletedAt: null,
          endDate: { lte: cutoffDate },
        },
        include: {
          resident: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      }),
    ]);

    // Map Care Plans to unified items
    const planItems: ComplianceReviewItemDTO[] = [];
    for (const plan of carePlans) {
      const targetDate = plan.nextReviewDate || plan.validTo;
      if (!targetDate) continue;
      const diffMs = targetDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      planItems.push({
        id: `plan-${plan.id}`,
        category: 'support-plan',
        entityId: plan.id,
        personId: plan.residentId,
        personName: plan.resident?.fullName || 'Resident',
        personRoleOrRoom: 'Resident',
        title: `Support Plan v${plan.versionNumber}`,
        details: plan.renewalReason
          ? `Reason: ${plan.renewalReason}`
          : 'Scheduled Review',
        targetDate: targetDate.toISOString(),
        daysRemaining,
        status: plan.status,
        linkUrl: `/admin/residents/${plan.residentId}?tab=careplan`,
      });
    }

    // Map Staff Certifications
    const certItems: ComplianceReviewItemDTO[] = staffCerts.map((cert) => {
      const diffMs = cert.expiryDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      return {
        id: `cert-${cert.id}`,
        category: 'staff-certification',
        entityId: cert.id,
        personId: cert.userId,
        personName: cert.user?.fullName || 'Staff Member',
        personRoleOrRoom: cert.user?.role?.name || 'Staff',
        title: cert.name,
        details:
          cert.skills && cert.skills.length > 0
            ? cert.skills.join(', ')
            : 'Mandatory Training',
        targetDate: cert.expiryDate.toISOString(),
        daysRemaining,
        status: cert.status,
        linkUrl: `/admin/staff/${cert.userId}?tab=certifications`,
      };
    });

    // Map Medication Prescriptions
    const medItems: ComplianceReviewItemDTO[] = prescriptions.map((pres) => {
      const diffMs = pres.endDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      return {
        id: `med-${pres.id}`,
        category: 'medication',
        entityId: pres.id,
        personId: pres.residentId,
        personName: pres.resident?.fullName || 'Resident',
        personRoleOrRoom: 'Resident',
        title: `${pres.drugName} ${pres.dose}`,
        details: pres.instructions || pres.form,
        targetDate: pres.endDate.toISOString(),
        daysRemaining,
        status: pres.status,
        linkUrl: `/admin/residents/${pres.residentId}?tab=medication`,
      };
    });

    // Compute Summary counts
    const allItems: ComplianceReviewItemDTO[] = [
      ...planItems,
      ...certItems,
      ...medItems,
    ];

    const summary = {
      totalDue: allItems.length,
      supportPlansDue: planItems.length,
      staffCertsDue: certItems.length,
      medicationsDue: medItems.length,
      criticalCount: allItems.filter((i) => i.daysRemaining <= 7).length,
    };

    // Filter by Category
    let filtered = allItems;
    if (query.category && query.category !== 'all') {
      filtered = filtered.filter((item) => item.category === query.category);
    }

    // Filter by Search
    if (query.search?.trim()) {
      const q = query.search.trim().toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.personName.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q) ||
          (item.details && item.details.toLowerCase().includes(q)),
      );
    }

    // Sort by Urgency (least days remaining first)
    filtered.sort((a, b) => a.daysRemaining - b.daysRemaining);

    // Pagination
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const startIndex = (page - 1) * limit;
    const paginatedItems = filtered.slice(startIndex, startIndex + limit);

    return {
      summary,
      items: paginatedItems,
      total: filtered.length,
      page,
      limit,
    };
  }
}

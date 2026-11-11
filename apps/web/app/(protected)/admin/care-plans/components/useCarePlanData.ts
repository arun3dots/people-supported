import { useMemo } from "react";
import { differenceInDays, isBefore, startOfDay, parseISO, subDays } from "date-fns";
import type { PlanItem, CarePlanFilterTab, ReviewDueFilter } from "./types";
import type { CarePlanMetricsStats } from "./CarePlanStatCards";
import type { Resident } from "../../../../../lib/types/resident";

export function useCarePlanData({
  rawPlans,
  rawResidents,
  search,
  selectedUnit,
  selectedReviewDue,
  activeTab,
}: {
  rawPlans: PlanItem[];
  rawResidents: Resident[];
  search: string;
  selectedUnit: string;
  selectedReviewDue: ReviewDueFilter;
  activeTab: CarePlanFilterTab;
}) {
  const combinedData = useMemo<PlanItem[]>(() => {
    const planByResId = new Map<string, PlanItem>();
    const unattachedPlans: PlanItem[] = [];

    for (const p of rawPlans) {
      const resId = p.resident?.id;
      if (resId) {
        const existing = planByResId.get(resId);
        if (!existing || (p.versionNumber || 0) > (existing.versionNumber || 0)) {
          planByResId.set(resId, p);
        }
      } else {
        unattachedPlans.push(p);
      }
    }

    const items: PlanItem[] = [];

    for (const res of rawResidents) {
      const plan = planByResId.get(res.id);
      const resWingName = (res.bed as unknown as { room?: { wing?: { name?: string } } })?.room?.wing?.name;
      const resKeyworker = res.keyworker
        ? typeof res.keyworker === "string"
          ? { id: res.keyworker, fullName: res.keyworker }
          : { id: res.keyworker.id, fullName: res.keyworker.fullName }
        : plan?.resident?.keyworker || null;

      if (plan) {
        items.push({
          ...plan,
          resident: {
            ...plan.resident,
            id: res.id,
            fullName: res.fullName || plan.resident?.fullName || "Unnamed",
            photoUrl: res.photoUrl || plan.resident?.photoUrl,
            nhsNumber: res.nhsNumber,
            bed: res.bed
              ? {
                  room: {
                    roomNumber: res.bed.room?.roomNumber,
                    wing: {
                      name: resWingName,
                    },
                  },
                }
              : plan.resident?.bed,
            keyworker: resKeyworker,
          },
        });
      } else {
        items.push({
          id: `missing-${res.id}`,
          versionNumber: 1,
          status: "Missing",
          validFrom: res.admissionDate || new Date(),
          resident: {
            id: res.id,
            fullName: res.fullName || "Unnamed",
            photoUrl: res.photoUrl,
            nhsNumber: res.nhsNumber,
            bed: res.bed
              ? {
                  room: {
                    roomNumber: res.bed.room?.roomNumber,
                    wing: {
                      name: resWingName,
                    },
                  },
                }
              : null,
            keyworker: resKeyworker,
          },
        });
      }
    }

    for (const p of unattachedPlans) {
      items.push(p);
    }

    return items;
  }, [rawPlans, rawResidents]);

  const availableUnits = useMemo(() => {
    const units = new Set<string>();
    for (const item of combinedData) {
      const wingName = item.resident?.bed?.room?.wing?.name;
      if (wingName) units.add(wingName);
    }
    return Array.from(units);
  }, [combinedData]);

  const stats = useMemo<CarePlanMetricsStats>(() => {
    const today = startOfDay(new Date());
    const sevenDaysAgo = subDays(today, 7);

    let missingPlanCount = 0;
    let draftCount = 0;
    let awaitingApprovalCount = 0;
    let returnedCount = 0;
    let activeCount = 0;
    let reviewOverdueCount = 0;
    let due14Count = 0;
    let recordChangedCount = 0;
    let updated7Count = 0;

    for (const item of combinedData) {
      const st = (item.status || "").toLowerCase();
      if (st === "missing") {
        missingPlanCount++;
        continue;
      }

      if (st === "active") activeCount++;
      else if (st === "draft") draftCount++;
      else if (st.includes("pending") || st.includes("review")) awaitingApprovalCount++;
      else if (st.includes("change") || st.includes("returned")) returnedCount++;

      const nextDate = item.nextReviewDate || item.validTo;
      if (nextDate) {
        const d = typeof nextDate === "string" ? parseISO(nextDate) : nextDate;
        if (!isNaN(d.getTime())) {
          const target = startOfDay(d);
          if (isBefore(target, today)) {
            reviewOverdueCount++;
          } else {
            const diff = differenceInDays(target, today);
            if (diff <= 14) due14Count++;
          }
        }
      }

      const updated = item.updatedAt || item.validFrom;
      if (updated) {
        const d = typeof updated === "string" ? parseISO(updated) : updated;
        if (!isNaN(d.getTime()) && !isBefore(d, sevenDaysAgo)) {
          updated7Count++;
        }
      }

      if (item.approvedAt && item.updatedAt) {
        const approved = typeof item.approvedAt === "string" ? parseISO(item.approvedAt) : item.approvedAt;
        const updatedDate = typeof item.updatedAt === "string" ? parseISO(item.updatedAt) : item.updatedAt;
        if (!isNaN(approved.getTime()) && !isNaN(updatedDate.getTime()) && updatedDate.getTime() > approved.getTime()) {
          recordChangedCount++;
        }
      }
    }

    return {
      totalResidents: combinedData.length,
      missingPlanCount,
      draftCount,
      awaitingApprovalCount,
      returnedCount,
      activeCount,
      reviewOverdueCount,
      due14Count,
      recordChangedCount,
      updated7Count,
    };
  }, [combinedData]);

  const filteredData = useMemo(() => {
    const today = startOfDay(new Date());

    return combinedData.filter((item) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const name = item.resident?.fullName?.toLowerCase() || "";
        const id = item.resident?.id?.toLowerCase() || "";
        const room = item.resident?.bed?.room?.roomNumber?.toLowerCase() || "";
        if (!name.includes(q) && !id.includes(q) && !room.includes(q)) {
          return false;
        }
      }

      if (selectedUnit !== "ALL") {
        const wing = item.resident?.bed?.room?.wing?.name;
        if (wing !== selectedUnit) return false;
      }

      if (selectedReviewDue !== "ANY") {
        const nextDate = item.nextReviewDate || item.validTo;
        if (!nextDate) return false;
        const d = typeof nextDate === "string" ? parseISO(nextDate) : nextDate;
        if (isNaN(d.getTime())) return false;
        const target = startOfDay(d);
        const isOverdue = isBefore(target, today);
        const days = Math.abs(differenceInDays(target, today));

        if (selectedReviewDue === "OVERDUE" && !isOverdue) return false;
        if (selectedReviewDue === "14_DAYS" && (isOverdue || days > 14)) return false;
        if (selectedReviewDue === "30_DAYS" && (isOverdue || days > 30)) return false;
      }

      if (activeTab === "ALL") return true;
      const st = (item.status || "").toLowerCase();
      if (activeTab === "MISSING") return st === "missing";
      if (activeTab === "DRAFT") return st === "draft";
      if (activeTab === "AWAITING_APPROVAL") return st.includes("pending") || st.includes("review");
      if (activeTab === "RETURNED") return st.includes("change") || st.includes("returned");
      if (activeTab === "ACTIVE") return st === "active";
      if (activeTab === "REVIEW_OVERDUE") {
        const nextDate = item.nextReviewDate || item.validTo;
        if (!nextDate) return false;
        const d = typeof nextDate === "string" ? parseISO(nextDate) : nextDate;
        return !isNaN(d.getTime()) && isBefore(startOfDay(d), today);
      }
      if (activeTab === "DUE_14_DAYS") {
        const nextDate = item.nextReviewDate || item.validTo;
        if (!nextDate) return false;
        const d = typeof nextDate === "string" ? parseISO(nextDate) : nextDate;
        if (isNaN(d.getTime())) return false;
        const target = startOfDay(d);
        return !isBefore(target, today) && differenceInDays(target, today) <= 14;
      }
      if (activeTab === "UPDATED_7_DAYS") {
        const updated = item.updatedAt || item.validFrom;
        if (!updated) return false;
        const d = typeof updated === "string" ? parseISO(updated) : updated;
        return !isNaN(d.getTime()) && !isBefore(d, subDays(today, 7));
      }

      return true;
    });
  }, [combinedData, search, selectedUnit, selectedReviewDue, activeTab]);

  return {
    combinedData,
    availableUnits,
    stats,
    filteredData,
  };
}

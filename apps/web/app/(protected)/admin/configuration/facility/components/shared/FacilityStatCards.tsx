"use client";

import React, { ReactNode } from "react";
import { SummaryCardsGrid, type SummaryCardItem } from "@repo/ui/components/ui/SummaryCard";

export interface StatCardItem extends SummaryCardItem {
  bgIcon?: string;
  iconColor?: string;
  textColor?: string;
}

interface FacilityStatCardsProps {
  cards: StatCardItem[];
  extra?: ReactNode;
  className?: string;
}

export function FacilityStatCards({ cards, extra, className }: FacilityStatCardsProps) {
  const summaryCards: SummaryCardItem[] = cards.map((card) => ({
    title: card.title,
    value: card.value,
    subtitle: card.subtitle,
    subtitleColor: card.subtitleColor || card.textColor || "text-slate-500",
    icon: card.icon,
  }));

  return (
    <SummaryCardsGrid
      cards={summaryCards}
      extra={extra}
      className={className || "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6"}
    />
  );
}

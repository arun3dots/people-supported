"use client";

import * as React from "react";
import { Card } from "./Card";
import { cn } from "../../lib/utils";
import { Text } from "./Text";

export interface SummaryCardItem {
  title: string;
  value: string | number;
  subtitle?: string;
  subtitleColor?: string;
  icon?: React.ReactNode;
  iconClassName?: string;
}

export interface SummaryCardProps extends React.ComponentProps<"div"> {
  title: string;
  value: string | number;
  subtitle?: string;
  subtitleColor?: string;
  icon?: React.ReactNode;
  iconClassName?: string;
}

export function SummaryCard({
  title,
  value,
  subtitle,
  subtitleColor,
  icon,
  iconClassName,
  className,
  ...props
}: SummaryCardProps) {
  return (
    <Card
      className={cn(
        "p-4 flex flex-row items-start justify-start gap-3.5 min-h-[96px] w-full",
        className
      )}
      {...props}
    >
      {icon && (
        <div
          className={cn(
            "size-10 rounded-xl flex items-center justify-center text-slate-700 shrink-0",
            iconClassName
          )}
        >
          {icon}
        </div>
      )}
      <div className="flex flex-col gap-1 text-left min-w-0 flex-1">
        <Text size={'md'} weight={'medium'}>
          {title}
        </Text>
        <Text size={'xl'} weight={'bold'} suppressHydrationWarning>
          {value}
        </Text>
        {subtitle && (
          <Text size={'sm'} weight={'regular'}
            suppressHydrationWarning
            className={cn(
              "truncate",
              subtitleColor || "text-slate-500"
            )}
          >
            {subtitle}
          </Text>
        )}
      </div>
    </Card>
  );
}

export interface SummaryCardsGridProps extends React.ComponentProps<"div"> {
  cards: SummaryCardItem[];
  extra?: React.ReactNode;
}

export function SummaryCardsGrid({
  cards,
  extra,
  className,
  ...props
}: SummaryCardsGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 w-full",
        className
      )}
      {...props}
    >
      {cards.map((card, idx) => (
        <SummaryCard
          key={idx}
          title={card.title}
          value={card.value}
          subtitle={card.subtitle}
          subtitleColor={card.subtitleColor}
          icon={card.icon}
          iconClassName={card.iconClassName}
        />
      ))}
      {extra}
    </div>
  );
}

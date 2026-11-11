"use client";

import { Card, Text } from "@repo/ui/components/ui";

export function AdminWelcomeBanner() {
  return (
    <Card
      className="relative overflow-hidden w-full h-full min-h-[285px] rounded-2xl border-none shadow-none font-sans"
      style={{
        background: "linear-gradient(270deg, #F8F7F5 0%, #F7F7F7 100%)",
      }}
    >
      {/* Background Image Layer - Exact Path preserved */}
      <div
        className="absolute inset-0 w-full h-full rounded-2xl bg-no-repeat pointer-events-none"
        style={{
          backgroundImage:
            "url('/images/dashboard/caring-is-more-than-a-gesture.svg')",
          backgroundSize: "cover",
          backgroundPosition: "center right",
        }}
      />

      {/* Text Box Container (Frame 2162) */}
      <div className="absolute left-[30px] sm:left-[40px] top-[60px] sm:top-[86px] max-w-[226px] flex flex-col items-start gap-[10px] z-10">
        <Text
          as="h2"
          size="2xl"
          weight="medium"
          className="w-full text-black leading-[32px] sm:leading-[40px] tracking-normal"
        >
          “Caring is more than a gesture.
        </Text>
        <Text
          size="sm"
          variant="muted"
          className="w-full text-[#5D5D5D] leading-[18px]"
        >
          it's a commitment to making someone's day a little brighter.”
        </Text>
      </div>
    </Card>
  );
}
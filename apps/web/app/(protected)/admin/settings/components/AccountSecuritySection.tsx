import { useEffect, useState } from "react";
import { Card, Button, Text } from "@repo/ui/components/ui";
import { CheckCircle2, ArrowRight } from "lucide-react";
import Image from "next/image";

export function AccountSecuritySection() {
  const [isLoaded, setIsLoaded] = useState(false);

  // Chart configuration
  const score = 92;
  const radius = 60;
  const strokeWidth = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  useEffect(() => {
    // Triggers ring stroke animation after mount
    const timer = setTimeout(() => setIsLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const breakdownItems = [
    { label: "Firewall", value: "Active" },
    { label: "Two-factor Authentication", value: "Enabled" },
    { label: "Password Strength", value: "Strong" },
    { label: "Active Sessions", value: "3 active" },
    { label: "Data Encryption", value: "Enabled" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch w-full font-sans">
      {/* Account Status Card */}
      <Card className="bg-surface-card-grey rounded-2xl shadow-none border-none p-5 sm:p-8 w-full h-full flex flex-col sm:flex-row items-center sm:items-start justify-center sm:justify-start gap-5 sm:gap-8">
        {/* Graphic Wrapper */}
        <div className="size-32 sm:size-36 shrink-0 relative flex items-center justify-center">
          <Image
            src="/lock.svg"
            alt="Account security"
            width={148}
            height={148}
            priority
            className="size-full object-contain"
          />
        </div>

        {/* Content Container */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-3 w-full sm:max-w-xs">
          <Text as="h2" size="lg" weight="semibold" className="text-slate-900">
            Your account is secure
          </Text>

          {/* Checkmark + Subtitle */}
          <div className="flex items-center gap-1.5 justify-center sm:justify-start w-full">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <Text size="sm" weight="regular" className="text-slate-500">
              Last security check was completed 2 hours ago
            </Text>
          </div>

          {/* Body Description */}
          <Text size="sm" weight="regular" className="text-slate-500 leading-relaxed">
            We continuously monitor your account and data to keep your information safe and secure
          </Text>

          {/* Action Button */}
          <Button variant="primary" size="sm" className="mt-2 rounded-xl cursor-pointer">
            Run Security Check
          </Button>
        </div>
      </Card>

      {/* Security Score Card */}
      <Card className="w-full h-full p-5 sm:p-6 bg-surface-card-grey border-none rounded-2xl shadow-none flex flex-col justify-center">
        <div className="w-full flex flex-col xl:flex-row items-center justify-between gap-6">
          {/* Left Column: Radial Score */}
          <div className="flex flex-col items-center gap-4 shrink-0 w-full xl:w-auto">
            <Text as="h3" size="base" weight="semibold" className="text-slate-900 text-center w-full">
              Security Score
            </Text>

            {/* Animated Radial Chart */}
            <div className="relative size-36 flex items-center justify-center shrink-0">
              <svg
                className="size-full transform -rotate-90 overflow-visible"
                viewBox="0 0 148 148"
              >
                {/* Background Ring */}
                <circle
                  cx="74"
                  cy="74"
                  r={radius}
                  fill="transparent"
                  stroke="#E2E8F0"
                  strokeWidth={strokeWidth}
                />
                {/* Animated Value Ring */}
                <circle
                  cx="74"
                  cy="74"
                  r={radius}
                  fill="transparent"
                  stroke="#059669"
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={isLoaded ? strokeDashoffset : circumference}
                  strokeLinecap="round"
                  style={{
                    transition:
                      "stroke-dashoffset 1.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />
              </svg>

              {/* Inner Center Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-bold text-2xl text-slate-900 text-center">
                  {score}%
                </span>
                <span className="font-semibold text-md text-emerald-700 text-center">
                  Strong
                </span>
              </div>
            </div>
          </div>

          {/* Vertical Divider for XL view */}
          <div className="hidden xl:block w-px self-stretch bg-border-secondary/60 shrink-0 my-1" />

          {/* Horizontal Divider for Mobile/Tablet view */}
          <div className="block xl:hidden w-full h-px bg-border-secondary/60 shrink-0" />

          {/* Right Column: Score Breakdown */}
          <div className="flex-1 w-full flex flex-col justify-between gap-5">
            <div className="w-full flex flex-col gap-3">
              {breakdownItems.map((item) => (
                <div
                  key={item.label}
                  className="w-full flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <Text size="sm" weight="medium" className="text-slate-800 truncate">
                      {item.label}
                    </Text>
                  </div>

                  <Text size="sm" weight="semibold" className="text-emerald-700 text-right shrink-0">
                    {item.value}
                  </Text>
                </div>
              ))}
            </div>

            {/* Security Recommendations Link Action */}
            <button className="flex items-center gap-2 text-emerald-800 hover:text-emerald-900 transition-colors cursor-pointer w-fit group">
              <span className="font-semibold text-md group-hover:underline">
                View Security Recommendations
              </span>
              <ArrowRight className="size-4 text-emerald-800 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
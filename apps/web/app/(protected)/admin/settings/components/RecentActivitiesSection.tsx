import React from "react"
import {
  Smartphone,
  ShieldCheck,
  Tablet,
  CheckCircle2,
  ArrowRight,
  Shield,
  Lock,
  LogIn,
  KeyRound,
  AlertCircle
} from "lucide-react"
import { Card } from "@repo/ui/components/ui"
import { cn } from "@repo/ui/lib/utils"

interface SessionItem {
  id: string;
  icon: React.ElementType;
  device: string;
  location: string;
  time: string;
  lastChangedLabel?: string;
  current?: boolean;
}
interface ActivityItem {
  id: string;
  icon: React.ElementType;
  title: string;
  location: string;
  time: string;
  isAlert?: boolean;
}



export function RecentActivitiesSection() {
  const sessionsData: SessionItem[] = [
    {
      id: "chrome-windows",
      icon: ShieldCheck,
      device: "Chrome on Windows",
      location: "Glasgow, England | 192.168.1.10",
      time: "20 days ago",
      lastChangedLabel: "Last changed",
      current: true,
    },
    {
      id: "safari-iphone",
      icon: Smartphone,
      device: "Safari on iPhone 14",
      location: "Glasgow, England | 192.168.1.10",
      time: "2 hours ago",
      current: false,
    },
    {
      id: "chrome-ipad",
      icon: Tablet,
      device: "Chrome on iPad",
      location: "Glasgow, England | 192.168.1.10",
      time: "1 day ago",
      current: false,
    },
  ];
  const activityData: ActivityItem[] = [
    {
      id: "successful-login",
      icon: LogIn,
      title: "Successful login",
      location: "Glasgow, England | 192.168.1.10",
      time: "2 hours ago",
    },
    {
      id: "password-changed",
      icon: KeyRound,
      title: "Password changed",
      location: "Glasgow, England | 192.168.1.10",
      time: "2 days ago",
    },
    {
      id: "two-factor-enabled",
      icon: ShieldCheck,
      title: "Two-factor enabled",
      location: "Glasgow, England | 192.168.1.10",
      time: "5 days ago",
    },
    {
      id: "failed-login",
      icon: AlertCircle,
      title: "Failed login Attempt",
      location: "Unknown IP | 192.168.1.10",
      time: "1 week ago",
      isAlert: true,
    },
  ];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Active Sessions */}
      <Card className="w-full h-auto bg-surface-card-grey rounded-2xl border-none shadow-none p-5 flex flex-col gap-6 font-sans">
        {/* Section Header (Frame 1359) */}
        <div className="flex flex-col gap-[10px]">
          <h3 className="font-medium text-[16px] leading-[20px] text-[#141F1E]">
            Active Sessions
          </h3>
          <p className="font-normal text-[12px] leading-[15px] text-[#5D5D5D]">
            You are currently signed in on the following devices
          </p>
        </div>

        {/* Main Sessions List Container (Frame 1392 / Frame 1391) */}
        <div className="flex flex-col w-full gap-6">
          {sessionsData.map((session, index) => {
            const IconComponent = session.icon;

            return (
              <React.Fragment key={session.id}>
                {/* Single Session Row (Frame 1373) */}
                <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
                  {/* Left Group: Circular Icon & Info (Frame 1370) */}
                  <div className="flex items-center gap-[18px] flex-1 min-w-0">
                    {/* Icon Circle (Frame 1404 / 1405 / 1403) */}
                    <div className="w-[50px] h-[50px] rounded-full bg-[#DEE9E6] flex items-center justify-center shrink-0">
                      <IconComponent className="w-6 h-6 text-[#4A706A]" />
                    </div>

                    {/* Device Info (Frame 1390) */}
                    <div className="flex flex-col gap-[2px] min-w-0">
                      <div className="flex items-center gap-[9px] flex-wrap">
                        <span className="font-medium text-[12px] leading-[15px] text-[#141F1E]">
                          {session.device}
                        </span>

                        {/* Current Session Badge (Frame 1387) */}
                        {session.current && (
                          <span className="bg-[#F1FCF3] text-[#1D5E2E] font-medium text-md px-2.5 py-0.5 rounded-full inline-flex items-center justify-center">
                            Current Session
                          </span>
                        )}
                      </div>

                      <span className="font-normal text-[12px] leading-[15px] text-[#5D5D5D] truncate sm:whitespace-normal">
                        {session.location}
                      </span>
                    </div>
                  </div>

                  {/* Right Group: Timestamp Info (Frame 1371) */}
                  <div className="flex flex-col items-start sm:items-end shrink-0 pl-[68px] sm:pl-0">
                    {session.lastChangedLabel && (
                      <span className="font-normal text-[8px] leading-[10px] text-[#5D5D5D]">
                        {session.lastChangedLabel}
                      </span>
                    )}
                    <span className="font-normal text-[12px] leading-[15px] text-[#5D5D5D]">
                      {session.time}
                    </span>
                  </div>
                </div>

                {/* Line Divider (Line 32) */}
                {index < sessionsData.length - 1 && (
                  <div className="w-full h-[0.5px] bg-[#F5F8F7]" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* View All Sessions Button (Frame 1367) */}
        <button className="flex items-center gap-2 text-[#1E7735] text-[12px] leading-[15px] font-medium hover:underline cursor-pointer w-fit transition-colors pt-1">
          <span>View All Sessions</span>
          <ArrowRight className="w-4 h-4 text-[#1E7735]" />
        </button>
      </Card>

      {/* Recent Security Activity */}
      <Card className="bg-surface-card-grey rounded-2xl shadow-none border-none p-6 lg:p-8 font-sans">
        <div className="mb-5">
          <h3 className="text-lg font-bold text-[#141F1E]">
            Recent Security Activity
          </h3>
          <p className="text-md text-[#5D5D5D] mt-0.5">
            Latest security related events
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              icon: CheckCircle2,
              iconBg: "bg-[#EBF7EE]",
              iconColor: "text-[#1E7735]",
              title: "Successful login",
              location: "Glasgow, England | 192.168.1.10",
              time: "2 hours ago",
            },
            {
              icon: Lock,
              iconBg: "bg-[#FFF4E5]",
              iconColor: "text-[#C9906E]",
              title: "Password changed",
              location: "Glasgow, England | 192.168.1.10",
              time: "2 days ago",
            },
            {
              icon: Shield,
              iconBg: "bg-[#DEE9E6]",
              iconColor: "text-[#4A706A]",
              title: "Two-factor enabled",
              location: "Glasgow, England | 192.168.1.10",
              time: "5 days ago",
            },
            {
              icon: AlertCircle,
              iconBg: "bg-[#FEF2F2]",
              iconColor: "text-[#DC2626]",
              title: "Failed login Attempt",
              location: "Unknown IP | 192.168.1.10",
              time: "1 week ago",
            },
          ].map((event, i) => (
            <div key={i} className="flex items-center gap-4">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  event.iconBg
                )}
              >
                {React.createElement(event.icon, { className: cn("w-5 h-5", event.iconColor) })}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-md font-medium text-[#141F1E]">
                  {event.title}
                </p>
                <p className="text-md text-[#5D5D5D] mt-0.5">
                  {event.location}
                </p>
              </div>
              <span className="text-md text-[#5D5D5D] shrink-0">
                {event.time}
              </span>
            </div>
          ))}
        </div>

        <button className="flex items-center gap-1 text-[#4A706A] text-md font-semibold mt-5 hover:underline cursor-pointer">
          View All Activity
          <ArrowRight className="w-3 h-3" />
        </button>
      </Card>
    </div>
  )
}
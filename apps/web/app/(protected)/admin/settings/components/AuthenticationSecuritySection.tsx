import { Card, Button, Switch } from "@repo/ui/components/ui";
import {
  Lock,
  Monitor,
  Globe,
  Bell,
  Clock,
  ShieldCheck,
} from "lucide-react";
import React, { useState } from "react";

interface AuthenticationSectionProps {
  onPasswordChange?: () => void;
  onManage2FA?: () => void;
  onManageDevices?: () => void;
}

export function AuthenticationSecuritySection({
  onPasswordChange,
  onManage2FA,
  onManageDevices,
}: AuthenticationSectionProps) {
  const [settings, setSettings] = useState({
    loginAlerts: true,
    sessionTimeout: true,
    ipAllowlisting: true,
    passwordExpiry: true,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const securityItems = [
    {
      id: "loginAlerts" as const,
      icon: Bell,
      title: "Login Alerts",
      desc: "Get notified of new sign-ins to your account",
    },
    {
      id: "sessionTimeout" as const,
      icon: Clock,
      title: "Session Timeout",
      desc: "Automatically log out after 30minutes of inactivity",
    },
    {
      id: "ipAllowlisting" as const,
      icon: Globe,
      title: "IP Allowlisting",
      desc: "Restict acccess to trusted IP addresses only",
    },
    {
      id: "passwordExpiry" as const,
      icon: Lock,
      title: "Password Expiry",
      desc: "Require password change every 90 days",
    },
  ];

  const authItems = [
    {
      id: "password",
      icon: Lock,
      title: "Password",
      desc: "Update your password regularly to keep your account secure.",
      lastChanged: "20 days ago",
      action: "Change Password",
      onClick: onPasswordChange,
    },
    {
      id: "2fa",
      icon: ShieldCheck,
      title: "Two-Factor Authentication",
      desc: "Add an extra layer of security to your account.",
      lastChanged: "20 days ago",
      action: "Manage",
      onClick: onManage2FA,
    },
    {
      id: "devices",
      icon: Monitor,
      title: "Trusted Devices",
      desc: "Manage devices that have access to your account.",
      lastChanged: "20 days ago",
      action: "Manage Devices",
      onClick: onManageDevices,
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch w-full">
      {/* Authentication — takes 7/12 */}
      <div className="lg:col-span-7 h-full">
        <Card className="w-full h-full bg-surface-card-grey rounded-2xl border-none shadow-none p-4 xs:p-5 sm:p-6 flex flex-col justify-between gap-6 font-sans">
          {/* Header Container */}
          <div className="flex flex-col gap-[10px]">
            <h3 className="font-medium text-[16px] leading-[20px] text-[#141F1E]">
              Authentication
            </h3>
            <p className="font-normal text-[12px] leading-[15px] text-[#5D5D5D]">
              Manage how you sign in and verify your identity
            </p>
          </div>

          {/* List Rows Container */}
          <div className="flex flex-col w-full flex-1 justify-between gap-4 py-1">
            {authItems.map((item, index) => (
              <React.Fragment key={item.id}>

                <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 py-1">
                  {/* Left Group: Icon + Title & Description */}
                  <div className="flex items-center gap-[14px] xs:gap-[18px] flex-1 min-w-0 w-full sm:w-auto">
                    {/* Circle Icon Badge */}
                    <div className="w-[44px] h-[44px] xs:w-[50px] xs:h-[50px] rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                      <item.icon className="w-[20px] h-[20px] xs:w-[24px] xs:h-[24px] text-[#4A706A]" />
                    </div>

                    {/* Text Content */}
                    <div className="flex flex-col justify-center gap-[4px] max-w-full sm:max-w-[280px]">
                      <h4 className="font-medium text-[12px] leading-[15px] text-[#141F1E]">
                        {item.title}
                      </h4>
                      <p className="font-normal text-[12px] leading-[15px] text-[#5D5D5D]">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  {/* Right Group: Last Changed Text + Action Button */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 xs:gap-6 sm:gap-[32px] w-full sm:w-auto shrink-0 mt-1 sm:mt-0">
                    {/* Last Changed Meta */}
                    <div className="flex flex-col justify-center gap-[2px] text-left sm:text-right shrink-0">
                      <span className="font-normal text-[8px] leading-[10px] text-[#5D5D5D]">
                        Last changed
                      </span>
                      <span className="font-medium text-[12px] leading-[15px] text-[#5D5D5D]">
                        {item.lastChanged}
                      </span>
                    </div>

                    {/* Action Button */}
                    <Button
                      variant="outline"
                      className="h-[33px] min-w-[125px] px-[14px] py-0 flex items-center justify-center rounded-xl border-[#BCD3CD] bg-transparent text-[#141F1E] hover:bg-white hover:text-[#141F1E] font-medium text-[12px] leading-[15px] transition-colors shadow-none shrink-0"
                      onClick={item.onClick}
                    >
                      {item.action}
                    </Button>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </Card>
      </div>

      {/* Security Settings — takes 5/12 */}
      <div className="lg:col-span-5 h-full">
        <Card className="w-full h-full bg-surface-card-grey rounded-2xl border-none shadow-none p-4 xs:p-5 sm:p-6 flex flex-col justify-between gap-5 font-sans">
          {/* Section Header */}
          <div className="flex flex-col gap-[10px]">
            <h3 className="font-medium text-[16px] leading-[20px] text-[#141F1E]">
              Security Settings
            </h3>
            <p className="font-normal text-[12px] leading-[15px] text-[#5D5D5D]">
              Configure additional security preferences
            </p>
          </div>

          {/* Settings List Wrapper */}
          <div className="flex flex-col w-full flex-1 justify-between gap-4 py-1">
            {securityItems.map((item) => {
              const IconComponent = item.icon;
              const isChecked = settings[item.id];

              return (
                <div
                  key={item.id}
                  className="w-full flex items-center justify-between gap-3 xs:gap-4"
                >
                  {/* Left Group: Icon + Label & Subtitle */}
                  <div className="flex items-center gap-3 xs:gap-4 flex-1 min-w-0">
                    <IconComponent className="w-[22px] h-[22px] xs:w-[24px] xs:h-[24px] text-[#141F1E] shrink-0 stroke-[1.75]" />
                    <div className="flex flex-col gap-[2px] min-w-0 pr-1">
                      <span className="font-medium text-[12px] leading-[15px] text-[#141F1E]">
                        {item.title}
                      </span>
                      <span className="font-normal text-[12px] leading-[15px] text-[#5D5D5D] break-words sm:truncate">
                        {item.desc}
                      </span>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <Switch
                    checked={isChecked}
                    onCheckedChange={() => toggleSetting(item.id)}
                    className="shrink-0 data-[state=checked]:bg-[#4A706A] data-[state=unchecked]:bg-[#D1D1D1]"
                  />
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
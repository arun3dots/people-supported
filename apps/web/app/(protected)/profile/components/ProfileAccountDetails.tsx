"use client";

import React from "react";
import { Card } from "@repo/ui/components/ui/Card";

interface ProfileAccountDetailsProps {
  createdDate?: string;
  roleName?: string;
  licenseType?: string;
  status?: string;
}

export function ProfileAccountDetails({
  createdDate = "15 Jan 2024",
  roleName = "Adminstrator",
  licenseType = "Enterprise",
  status = "Active",
}: ProfileAccountDetailsProps) {
  const details = [
    { label: "Account Created", value: createdDate },
    { label: "Role", value: roleName },
    { label: "Licence Type", value: licenseType },
    { label: "Status", value: status, isStatus: true },
  ];

  return (
    <Card className="w-full bg-surface-card-grey rounded-2xl shadow-none border-none p-5 lg:p-6 font-sans flex flex-col gap-4">
      {/* Title Header */}
      <div className="w-full">
        <h3 className="font-semibold text-md leading-tight text-slate-900">
          Account Details
        </h3>
      </div>

      {/* Details List */}
      <div className="w-full flex flex-col gap-2.5">
        {details.map((item, idx) => (
          <div
            key={idx}
            className="grid grid-cols-2 items-center w-full min-h-[17px]"
          >
            {/* Left Column (50% width) */}
            <span className="font-normal text-md text-slate-600 truncate pr-2">
              {item.label}
            </span>

            {/* Right Column (50% width - starts at exact center) */}
            {item.isStatus ? (
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-emerald-600 shrink-0" />
                <span className="font-medium text-md text-slate-900 truncate">
                  {item.value}
                </span>
              </div>
            ) : (
              <span className="font-medium text-md text-slate-900 truncate">
                {item.value}
              </span>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
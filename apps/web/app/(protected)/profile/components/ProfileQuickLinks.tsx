"use client";

import React from "react";
import { Bell, ChevronRight, LockKeyhole } from "lucide-react";
import { Card } from "@repo/ui/components/ui/Card";

function ShieldCustomIcon() {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 30 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-[30px] h-[30px] shrink-0"
    >
      <rect width="30" height="30" rx="15" fill="#DEE9E6" />
      <rect x="5" y="5" width="20" height="20" rx="10" fill="#DEE9E6" />
      <path
        d="M15.262 23.7617L11.9166 21.88C10.9629 21.3449 10.1653 20.5458 9.60948 19.5685C9.05369 18.5913 8.7607 17.4728 8.76197 16.3331V8.90458C8.76197 8.60147 8.8761 8.31078 9.07927 8.09645C9.28243 7.88213 9.55798 7.76172 9.8453 7.76172H20.6786C20.9659 7.76172 21.2415 7.88213 21.4447 8.09645C21.6478 8.31078 21.762 8.60147 21.762 8.90458V16.3331C21.7632 17.4728 21.4702 18.5913 20.9144 19.5685C20.3587 20.5458 19.5611 21.3449 18.6073 21.88L15.262 23.7617ZM9.8453 8.90458V16.3331C9.8447 17.2655 10.0846 18.1805 10.5394 18.98C10.9942 19.7795 11.6467 20.4333 12.4269 20.8714L15.262 22.4663L18.097 20.872C18.8773 20.4339 19.5298 19.7799 19.9846 18.9803C20.4394 18.1807 20.6793 17.2656 20.6786 16.3331V8.90458H9.8453Z"
        fill="#4A706A"
      />
      <path
        d="M15.762 20.7617V9.76172H19.762V15.9274C19.7619 16.6506 19.5898 17.3603 19.264 17.9807C18.9382 18.6011 18.4709 19.1089 17.912 19.4498L15.762 20.7617Z"
        fill="#4A706A"
      />
    </svg>
  );
}

function FileCustomIcon() {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 30 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-[30px] h-[30px] shrink-0"
    >
      <rect width="30" height="30" rx="15" fill="#DEE9E6" />
      <path
        d="M11.9385 11.0391H20.3376V21.238H11.9385V11.0391Z"
        stroke="#4A706A"
        strokeLinejoin="round"
      />
      <path
        d="M18.5378 11.0381V9.23828H10.4386C10.3591 9.23828 10.2828 9.26988 10.2265 9.32614C10.1703 9.38239 10.1387 9.45869 10.1387 9.53825V19.4372H11.9385M14.3382 14.6377H17.9378M14.3382 17.0374H17.9378"
        stroke="#4A706A"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProfileQuickLinks() {
  const links = [
    {
      icon: (
        <div className="w-[30px] h-[30px] rounded-full bg-[#DEE9E6] flex items-center justify-center shrink-0">
          <LockKeyhole className="w-4 h-4 text-[#4A706A]" />
        </div>
      ),
      label: "Change Password",
    },
    {
      icon: <ShieldCustomIcon />,
      label: "Manage MFA",
    },
    {
      icon: (
        <div className="w-[30px] h-[30px] rounded-full bg-[#DEE9E6] flex items-center justify-center shrink-0">
          <Bell className="w-4 h-4 text-[#4A706A]" />
        </div>
      ),
      label: "Notification Settings",
    },
    {
      icon: <FileCustomIcon />,
      label: "Activity Log",
    },
  ];

  return (
    <Card className="w-full h-full flex-1 bg-surface-card-grey rounded-2xl shadow-none border-none p-5 font-sans flex flex-col gap-3">
      {/* Section Header */}
      <div className="w-full">
        <h3 className="font-semibold text-md leading-tight text-slate-900">
          Quick Links
        </h3>
      </div>

      {/* Links List */}
      <div className="w-full flex flex-col divide-y divide-slate-200/60">
        {links.map((link) => (
          <button
            key={link.label}
            className="w-full flex items-center justify-between py-2.5 group transition-colors cursor-pointer"
          >
            {/* Left: Icon Badge & Label */}
            <div className="flex items-center gap-2.5">
              {link.icon}
              <span className="font-normal text-md text-slate-800">
                {link.label}
              </span>
            </div>

            {/* Right: Chevron Arrow */}
            <ChevronRight className="size-3.5 text-slate-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </button>
        ))}
      </div>
    </Card>
  );
}
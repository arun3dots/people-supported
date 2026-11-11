"use client";

import React from "react";
import { Button } from "@repo/ui/components/ui/Button";
import Image from "next/image";

interface AddRoleSuccessProps {
  roleName?: string;
  userName?: string;
  usersCount?: string;
  onClose: () => void;
}

export function AddRoleSuccess({
  roleName = "Clinical Lead",
  userName = "Chandru",
  usersCount = "04",
  onClose,
}: AddRoleSuccessProps) {
  return (
    <div className="w-[381px] h-[495px] bg-white rounded-2xl p-6 flex flex-col items-center justify-center gap-[20px] font-['Outfit',sans-serif] mx-auto relative">

      {/* Success Illustration */}
      <div className="w-[351px] h-[153px] flex items-center justify-center relative">
        <Image
          src="/images/common/created-success.png"
          alt="Role created successfully"
          fill
          className="size-[225px] object-contain"
        />
      </div>

      {/* Title & Subtitle Section (Frame 1640) */}
      <div className="w-[351px] flex flex-col items-center justify-center gap-4">
        {/* Title */}
        <h2 className="text-[20px] font-medium leading-[25px] text-[#000000] text-center">
          Role Created Successfully!
        </h2>

        {/* Subtitle */}
        <p className="text-md font-medium leading-[13px] text-[#5D5D5D] text-center">
          The new role has been created and is ready to use.
        </p>
      </div>

      {/* Decorative Divider with Center Dot (Frame 1764) */}
      <div className="w-[171px] flex items-center justify-center gap-[3px]">
        <div className="w-[80px] h-0 border-t-[0.3px] border-[#BCD3CD]" />
        <div className="size-[5px] rounded-full bg-[#6C958D]" />
        <div className="w-[80px] h-0 border-t-[0.3px] border-[#BCD3CD]" />
      </div>

      {/* Role Details Summary Card (Frame 1867) */}
      <div className="w-[273px] bg-[#F7F7F7] rounded-xl px-5 py-4 flex flex-col gap-4">
        {/* Section Header */}
        <h4 className="text-[14px] font-medium leading-[18px] text-[#141F1E] mb-2">
          Role Details
        </h4>

        {/* Details Rows */}
        <div className="flex flex-col gap-[10px] w-full text-md leading-[15px] text-[#141F1E]">
          {/* Row 1: Role Name */}
          <div className="flex justify-between items-center">
            <span className="font-normal">Role Name</span>
            <span className="font-normal text-right">{roleName}</span>
          </div>
          <div className="w-full border-t-[0.3px] border-[#BCD3CD]" />

          {/* Row 2: User Name */}
          <div className="flex justify-between items-center">
            <span className="font-normal">User Name</span>
            <span className="font-normal text-right">{userName}</span>
          </div>
          <div className="w-full border-t-[0.3px] border-[#BCD3CD]" />

          {/* Row 3: Users */}
          <div className="flex justify-between items-center">
            <span className="font-normal">Users</span>
            <span className="font-normal text-right">{usersCount}</span>
          </div>
        </div>
      </div>

      {/* Action Button (Frame 1158) */}
      <Button
        type="button"
        onClick={onClose}
        className="w-28 h-8 bg-[#4A706A] hover:bg-[#3D5C57] text-white rounded-xl text-md font-medium flex items-center justify-center p-0 transition-colors border-none shadow-none"
      >
        Go to Roles
      </Button>
    </div>
  );
}

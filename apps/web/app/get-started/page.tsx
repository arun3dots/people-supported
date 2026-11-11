"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@repo/ui/components/ui/Button";

export default function GetStartedPage() {
  return (
    <div className="flex min-h-screen w-full bg-[#F7FAF9] font-sans overflow-hidden">
      {/* Left side - Card Container */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-xl border border-slate-100/80 max-w-md w-full text-center space-y-6">
          {/* Top Anime Illustration */}
          <div className="relative w-56 sm:w-64 h-48 mx-auto">
            <Image
              unoptimized
              src="/images/common/lets-get-started-anime.png"
              alt="Let's Go"
              fill
              className="object-contain"
              priority
            />
          </div>

          {/* Heading & Subtitle */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Let&apos;s Get Started
            </h1>
            <p className="text-md sm:text-md font-medium text-slate-500 max-w-xs mx-auto leading-relaxed">
              Join thousands of care teams already using Cantra to deliver better care
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <Link href="/signup" className="block w-full">
              <Button className="w-full h-12 rounded-xl bg-[#4A706A] hover:bg-[#3D5E59] text-white font-bold text-md sm:text-md shadow-md transition-all">
                Create an Account
              </Button>
            </Link>

            <Link href="/login" className="block w-full">
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl bg-white border border-slate-200 text-slate-800 font-bold text-md sm:text-md hover:bg-slate-50 transition-all"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Right side - Full-screen Banner Image */}
      <div className="hidden lg:block lg:w-1/2 relative bg-slate-100">
        <Image
          unoptimized
          src="/images/common/get-started-image.jpg"
          alt="Care background"
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  );
}

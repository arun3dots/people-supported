"use client";

import React from "react";
import Image from "next/image";
import { LoginForm } from "./components/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full bg-[#F7FAF9] font-sans overflow-hidden">
      {/* Left side - Sign In Form Card Container */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-xl border border-slate-100/80 max-w-md w-full space-y-6">
          {/* Header */}
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Welcome Back
            </h1>
            <p className="text-md sm:text-md font-medium text-slate-500">
              Sign in to continue to your account
            </p>
          </div>

          {/* Form */}
          <LoginForm />
        </div>
      </div>

      {/* Right side - Full-screen Banner Image */}
      <div className="hidden lg:block lg:w-1/2 relative bg-slate-100">
        <Image
          unoptimized
          src="/images/common/signup-right-image.png"
          alt="Sign In banner"
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  );
}

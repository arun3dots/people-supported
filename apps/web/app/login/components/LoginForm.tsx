"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginDTO } from "@repo/schema";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/context/AuthContext";
import { useToast } from "@repo/ui/hooks";
import { ForgotPasswordModal } from "./ForgotPasswordModal";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginDTO>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  const onSubmit = async (data: LoginDTO) => {
    setIsLoading(true);
    try {
      const result = await login(data);
      if (result?.requiresMfa) {
        const query = result.mfaSetupRequired ? "?setup=1" : "";
        router.push(`/login/mfa${query}`);
        return;
      }
      toast({
        title: "Success",
        description: "Welcome back!",
      });
      router.push("/dashboard");
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description:
          error instanceof Error ? error.message : "Invalid credentials",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <form noValidate className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        {/* Email Field */}
        <div className="space-y-1.5">
          <label className="text-md font-bold text-slate-800" htmlFor="email">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            {...register("email")}
            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-md font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4A706A]/30 focus:border-[#4A706A] transition-all"
          />
          {errors.email && (
            <p className="text-md text-red-500 mt-0.5 font-medium">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <label
            className="text-md font-bold text-slate-800"
            htmlFor="password"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              {...register("password")}
              className="w-full h-11 pl-4 pr-10 rounded-xl border border-slate-200 bg-white text-md font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4A706A]/30 focus:border-[#4A706A] transition-all"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-md text-red-500 mt-0.5 font-medium">
              {errors.password.message}
            </p>
          )}

          {/* Right-aligned Forgot Password Link */}
          <div className="text-right pt-0.5">
            <button
              type="button"
              onClick={() => setIsForgotPasswordOpen(true)}
              className="text-md font-semibold text-[#4A706A] hover:underline cursor-pointer"
            >
              Forgot Password?
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 rounded-xl bg-[#4A706A] hover:bg-[#3D5E59] text-white font-bold text-md shadow-md transition-all mt-4 disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? "Signing In..." : "Sign In"}
        </button>

        {/* Footer Link */}
        <div className="pt-4 text-center text-md text-slate-600 font-medium">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-bold text-[#4A706A] hover:underline ml-0.5"
          >
            Sign up
          </Link>
        </div>

        {/* Legal & Privacy Footer Links (A-04 / A-02) */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-md text-slate-500">
          <Link href="/privacy-policy" className="hover:text-slate-800 hover:underline">
            Privacy Notice
          </Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-slate-800 hover:underline">
            Terms of Service
          </Link>
          <span>•</span>
          <Link href="/dpa" className="hover:text-slate-800 hover:underline">
            Data Processing Agreement (DPA)
          </Link>
        </div>
      </form>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />
    </>
  );
}

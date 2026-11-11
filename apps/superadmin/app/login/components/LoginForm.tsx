"use client";

import { useState } from "react";
import { Button, Input, Label, Text } from "@repo/ui/components/ui";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginDTO } from "@repo/schema";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/context/AuthContext";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginDTO>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

  const onLogin = async (data: LoginDTO) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      await login({ email: data.email, password: data.password });
      router.push("/dashboard");
    } catch (e: unknown) {
      setErrorMessage(
        e instanceof Error
          ? e.message
          : "Login failed. Please verify your credentials.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-100 flex items-center justify-center">
          {errorMessage}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleLoginSubmit(onLogin)}>
        <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
          <Label required htmlFor="email">
            Administrator Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="admin@platform.com"
            {...registerLogin("email")}
          />
          {loginErrors.email && (
            <Text size="xs" className="text-red-500 font-medium mt-1">
              {loginErrors.email.message}
            </Text>
          )}
        </div>

        <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
          <div className="flex justify-between items-center">
            <Label required htmlFor="password">
              Security Password
            </Label>
            <Link
              href="#"
              className="text-xs font-semibold text-emerald-800 hover:underline transition-colors"
            >
              Lost Access?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              {...registerLogin("password")}
              className="pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-hidden cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff size={16} strokeWidth={1.75} />
              ) : (
                <Eye size={16} strokeWidth={1.75} />
              )}
            </button>
          </div>
          {loginErrors.password && (
            <Text size="xs" className="text-red-500 font-medium mt-1">
              {loginErrors.password.message}
            </Text>
          )}
        </div>

        <div className="flex items-center space-x-2 py-1">
          <input
            {...registerLogin("remember")}
            type="checkbox"
            id="remember"
            className="size-4 rounded border-slate-300 text-emerald-800 focus:ring-emerald-800 cursor-pointer accent-emerald-800"
          />
          <label
            htmlFor="remember"
            className="text-xs font-medium text-slate-600 cursor-pointer select-none"
          >
            Keep this session active for 24 hours
          </label>
        </div>

        <Button
          variant="primary"
          className="w-full font-semibold gap-2"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Authenticating...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4" />
              Access SuperAdmin Portal
            </div>
          )}
        </Button>

        <div className="pt-3 border-t border-slate-200/80 text-center">
          <Text size="xs" variant="subdued" className="text-2xs">
            Restricted Access. Unauthorized entry attempts are logged.
          </Text>
        </div>
      </form>
    </div>
  );
}

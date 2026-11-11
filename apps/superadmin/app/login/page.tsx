import { Text } from "@repo/ui/components/ui";
import { LoginForm } from "./components/LoginForm";
import { LoginHero } from "./components/LoginHero";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full bg-white font-sans">
      {/* Left side - Login Form */}
      <div className="flex w-full flex-col justify-center lg:w-1/2 p-8 lg:p-16 xl:p-24 relative">
        <div className="absolute top-8 left-8 flex items-center gap-3">
          <img
            src="/primary-logo.png"
            alt="Cantra Care"
            className="h-7 w-auto"
          />
          <span className="text-2xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider">
            SuperAdmin
          </span>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 text-left text-slate-900 mt-12">
            <Text as="h1" size="xl" weight="bold" className="text-slate-900 tracking-tight">
              SuperAdmin Portal
            </Text>
            <Text size="xs" variant="subdued" className="mt-1">
              Enter your administrative credentials to access the system control panel.
            </Text>
          </div>

          <LoginForm />
        </div>
      </div>

      {/* Right side - Graphic */}
      <LoginHero />
    </div>
  );
}

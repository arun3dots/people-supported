"use client";

import { ToastProvider, TooltipProvider } from "@repo/ui/components/ui";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { FC, ReactNode, useEffect } from "react";
import { AuthProvider } from "./context/AuthContext";
import { SessionReauthDialog } from "./auth/SessionReauthDialog";
import { PaymentRequiredOverlay } from "./billing/PaymentRequiredOverlay";
import { EmailVerificationOverlay } from "./billing/EmailVerificationOverlay";
import { getQueryClient } from "./query-client";

interface LayoutProps {
  children: ReactNode;
}

const Providers: FC<LayoutProps> = ({ children }) => {
  console.log("[Providers] Initializing...");
  const queryClient = getQueryClient();


  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider delayDuration={10}>
          <ToastProvider>{children}</ToastProvider>
          <SessionReauthDialog />
          <EmailVerificationOverlay />
          <PaymentRequiredOverlay />
        </TooltipProvider>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryClientProvider>
  );
};

export default Providers;

"use client";

import { ToastProvider, TooltipProvider } from "@repo/ui/components/ui";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { FC, ReactNode } from "react";
import { AuthProvider } from "./context/AuthContext";
import { SessionReauthDialog } from "./auth/SessionReauthDialog";
import { getQueryClient } from "./query-client";

interface ProvidersProps {
  children: ReactNode;
}

const Providers: FC<ProvidersProps> = ({ children }) => {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider delayDuration={10}>
          <ToastProvider>{children}</ToastProvider>
          <SessionReauthDialog />
        </TooltipProvider>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryClientProvider>
  );
};

export default Providers;

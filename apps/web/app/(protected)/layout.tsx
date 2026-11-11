import { primaryColor, SidebarProvider, Toaster } from "@repo/ui/components/ui";
import NextTopLoader from "nextjs-toploader";
import { ReactNode, Suspense } from "react";
import { PageHeader } from "../../lib/components/PageHeader";
import { AppSidebar } from "../../lib/components/AppSidebar";
import { MainContentShell } from "../../lib/components/MainContentShell";
import { ActiveShiftIndicator } from "../../lib/components/ActiveShiftIndicator";
import { PageViewTracker } from "../../lib/components/shared/PageViewTracker";
import { cookies } from "next/headers";

export const metadata = {
  title: "Care Home | 3dots",
  description: "Care Home | 3dots",
};

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <PageViewTracker />
      <div className="flex h-screen w-full bg-white overflow-hidden font-sans antialiased text-gray-900">
        <NextTopLoader color="#4A706A" showSpinner={false} />

        {/* Sidebar Component */}
        <AppSidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full min-w-0 transition-all duration-300 relative">
          <ActiveShiftIndicator />
          <PageHeader />

          <MainContentShell>
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center p-20 animate-pulse">
                  <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                </div>
              }
            >
              <div className="max-w-screen-2xl mx-auto w-full">{children}</div>
            </Suspense>
          </MainContentShell>
        </div>

        <Toaster />
      </div>
    </SidebarProvider>
  );
}

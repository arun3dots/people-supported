"use client";

import React from "react";
import { SidebarProvider } from "@repo/ui/components/ui";
import { AppSidebar } from "./AppSidebar";
import { UserMenu } from "./UserMenu";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-white font-sans antialiased text-gray-900 overflow-hidden relative">
        {/* Sidebar Component */}
        <AppSidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full min-w-0 transition-all duration-300 relative">
          {/* Top bar */}
          <header className="h-16 flex items-center justify-between gap-4 px-6 md:px-8 border-b border-gray-100 bg-white shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-md">
                SuperAdmin
              </span>
            </div>
            <UserMenu />
          </header>

          <main className="flex-1 overflow-auto p-6 md:p-8 custom-scrollbar">
            <div className="max-w-screen-2xl mx-auto w-full animate-in fade-in duration-300">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

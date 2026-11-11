"use client";

import React from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@repo/ui/components/ui";
import {
  LayoutDashboard,
  Database,
  Table as TableIcon,
  AppWindow,
  Bell,
  CreditCard,
  Rows3,
} from "lucide-react";

// Import Demo Components
import { FormDemo } from "./components/FormDemo";
import { TableDemo } from "./components/TableDemo";
import { DataTableDemo } from "./components/DataTableDemo";
import { TableViewDemo } from "./components/TableViewDemo";
import { ModalDemo } from "./components/ModalDemo";
import { ToastDemo } from "./components/ToastDemo";

export default function UIComponentsPage() {
  return (
    <div className="container mx-auto py-10 px-4 max-w-7xl animate-fade-in">
      <div className="mb-10 space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight text-gray-900 lg:text-5xl">
          Design System <span className="text-primary italic">Components</span>
        </h1>
        <p className="text-lg text-gray-500 font-medium max-w-2xl">
          A comprehensive reference for our UI library. Use these standardized
          components to maintain visual consistency across the entire
          application.
        </p>
      </div>

      <Tabs defaultValue="forms" className="space-y-8">
        <div className="overflow-x-auto pb-4 -mx-4 px-4 sticky top-0 bg-white/80 backdrop-blur-md z-10 pt-2 border-b border-gray-100 mb-6">
          <TabsList className="bg-gray-100/50 p-1.5 rounded-2xl h-auto inline-flex">
            <TabsTrigger
              value="forms"
              className="rounded-xl px-5 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-md flex items-center gap-2.5 transition-all"
            >
              <CreditCard className="h-4 w-4" />
              <span className="font-semibold text-md">Forms & Inputs</span>
            </TabsTrigger>
            <TabsTrigger
              value="tables"
              className="rounded-xl px-5 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-md flex items-center gap-2.5 transition-all"
            >
              <TableIcon className="h-4 w-4" />
              <span className="font-semibold text-md">Standard Tables</span>
            </TabsTrigger>
            <TabsTrigger
              value="datatable"
              className="rounded-xl px-5 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-md flex items-center gap-2.5 transition-all"
            >
              <Database className="h-4 w-4" />
              <span className="font-semibold text-md">Data Tables</span>
            </TabsTrigger>
            <TabsTrigger
              value="tableviews"
              className="rounded-xl px-5 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-md flex items-center gap-2.5 transition-all"
            >
              <Rows3 className="h-4 w-4" />
              <span className="font-semibold text-md">View Switchers</span>
            </TabsTrigger>
            <TabsTrigger
              value="modals"
              className="rounded-xl px-5 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-md flex items-center gap-2.5 transition-all"
            >
              <AppWindow className="h-4 w-4" />
              <span className="font-semibold text-md">Modals & Dialogs</span>
            </TabsTrigger>
            <TabsTrigger
              value="toasts"
              className="rounded-xl px-5 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-md flex items-center gap-2.5 transition-all"
            >
              <Bell className="h-4 w-4" />
              <span className="font-semibold text-md">Toasts</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="forms"
          className="focus-visible:outline-none focus-visible:ring-0"
        >
          <FormDemo />
        </TabsContent>

        <TabsContent
          value="tables"
          className="focus-visible:outline-none focus-visible:ring-0"
        >
          <TableDemo />
        </TabsContent>

        <TabsContent
          value="datatable"
          className="focus-visible:outline-none focus-visible:ring-0"
        >
          <DataTableDemo />
        </TabsContent>

        <TabsContent
          value="tableviews"
          className="focus-visible:outline-none focus-visible:ring-0"
        >
          <TableViewDemo />
        </TabsContent>

        <TabsContent
          value="modals"
          className="focus-visible:outline-none focus-visible:ring-0"
        >
          <ModalDemo />
        </TabsContent>

        <TabsContent
          value="toasts"
          className="focus-visible:outline-none focus-visible:ring-0"
        >
          <ToastDemo />
        </TabsContent>
      </Tabs>

      <footer className="mt-20 pt-10 border-t border-gray-100 text-center">
        <p className="text-md text-gray-400 font-semibold">
          Built with <span className="text-rose-500">♥</span> using our internal
          Design System. All components use the standardized 20px radius and
          Outfit typography.
        </p>
      </footer>
    </div>
  );
}

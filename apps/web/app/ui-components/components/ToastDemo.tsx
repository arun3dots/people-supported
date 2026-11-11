"use client";

import React from "react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@repo/ui/components/ui";
import { useToast } from "@repo/ui/hooks";
import {
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  BellRing,
  Sparkles,
} from "lucide-react";

export function ToastDemo() {
  const { toast } = useToast();

  return (
    <div className="space-y-8 animate-fade-in">
      <Card className="rounded-[20px] shadow-sm border-gray-100 overflow-hidden">
        <CardHeader className="bg-gray-50/50 pb-6">
          <CardTitle className="text-xl font-semibold tracking-tight">
            Notification System
          </CardTitle>
          <CardDescription>
            Toast notifications for real-time feedback and alerts.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Success Toast */}
            <Button
              variant="outline"
              className="h-24 rounded-2xl border-emerald-100 bg-emerald-50/20 hover:bg-emerald-50 hover:border-emerald-200 transition-all group flex flex-col items-center justify-center gap-2"
              onClick={() => {
                toast({
                  title: "Action Successful",
                  description:
                    "The staff record has been updated successfully.",
                });
              }}
            >
              <div className="bg-emerald-100 p-2 rounded-xl group-hover:scale-110 transition-transform">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <span className="font-semibold text-emerald-900 text-md">
                Success Toast
              </span>
            </Button>

            {/* Error Toast */}
            <Button
              variant="outline"
              className="h-24 rounded-2xl border-rose-100 bg-rose-50/20 hover:bg-rose-50 hover:border-rose-200 transition-all group flex flex-col items-center justify-center gap-2"
              onClick={() => {
                toast({
                  variant: "destructive",
                  title: "Error Occurred",
                  description:
                    "Unable to connect to the server. Please try again.",
                });
              }}
            >
              <div className="bg-rose-100 p-2 rounded-xl group-hover:scale-110 transition-transform">
                <AlertCircle className="h-5 w-5 text-rose-600" />
              </div>
              <span className="font-semibold text-rose-900 text-md">
                Error Toast
              </span>
            </Button>

            {/* Info Toast */}
            <Button
              variant="outline"
              className="h-24 rounded-2xl border-blue-100 bg-blue-50/20 hover:bg-blue-50 hover:border-blue-200 transition-all group flex flex-col items-center justify-center gap-2"
              onClick={() => {
                toast({
                  title: "Information",
                  description: "Maintenance is scheduled for 10:00 PM tonight.",
                });
              }}
            >
              <div className="bg-blue-100 p-2 rounded-xl group-hover:scale-110 transition-transform">
                <Info className="h-5 w-5 text-blue-600" />
              </div>
              <span className="font-semibold text-blue-900 text-md">
                Info Toast
              </span>
            </Button>

            {/* Warning Toast */}
            <Button
              variant="outline"
              className="h-24 rounded-2xl border-amber-100 bg-amber-50/20 hover:bg-amber-50 hover:border-amber-200 transition-all group flex flex-col items-center justify-center gap-2"
              onClick={() => {
                toast({
                  title: "Low Inventory",
                  description: "Critical medical supplies are running low.",
                });
              }}
            >
              <div className="bg-amber-100 p-2 rounded-xl group-hover:scale-110 transition-transform">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <span className="font-semibold text-amber-900 text-md">
                Warning Toast
              </span>
            </Button>

            {/* Action Toast */}
            <Button
              variant="outline"
              className="h-24 rounded-2xl border-indigo-100 bg-indigo-50/20 hover:bg-indigo-50 hover:border-indigo-200 transition-all group flex flex-col items-center justify-center gap-2"
              onClick={() => {
                toast({
                  title: "System Update",
                  description: "A new version is available.",
                });
              }}
            >
              <div className="bg-indigo-100 p-2 rounded-xl group-hover:scale-110 transition-transform">
                <BellRing className="h-5 w-5 text-indigo-600" />
              </div>
              <span className="font-semibold text-indigo-900 text-md">
                Update Alert
              </span>
            </Button>

            {/* Fancy Toast */}
            <Button
              className="h-24 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 hover:shadow-lg hover:shadow-primary/20 transition-all group flex flex-col items-center justify-center gap-2 border-none"
              onClick={() => {
                toast({
                  title: "Premium Feature Enabled",
                  description: "You now have access to advanced reports.",
                });
              }}
            >
              <div className="bg-white/20 p-2 rounded-xl group-hover:rotate-12 transition-transform">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold text-white text-md">
                Premium Toast
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="p-6 bg-primary/5 rounded-[20px] border border-primary/10 flex items-center gap-4">
        <div className="bg-primary p-3 rounded-2xl shadow-lg ring-4 ring-primary/10 shrink-0">
          <BellRing className="h-6 w-6 text-white" />
        </div>
        <div>
          <h4 className="font-semibold text-primary">Best Practices</h4>
          <p className="text-md text-primary/70 font-semibold leading-relaxed">
            Use toasts for non-blocking feedback. For critical decisions that
            require explicit confirmation, prefer{" "}
            <span className="underline decoration-2">AlertDialog</span> instead.
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
} from "@repo/ui/components/ui";
import {
  AlertTriangle,
  Trash2,
  Settings,
  UserPlus,
  Info,
  CheckCircle2,
} from "lucide-react";

export function ModalDemo() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Standard Dialogs */}
        <Card className="rounded-[20px] shadow-sm border-gray-100 overflow-hidden">
          <CardHeader className="bg-gray-50/50">
            <CardTitle className="text-xl font-semibold tracking-tight">
              Standard Dialogs
            </CardTitle>
            <CardDescription>
              Modals for complex interactions and forms.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full rounded-xl font-semibold gap-2 h-12 shadow-sm shadow-primary/20">
                  <UserPlus className="h-4 w-4" /> Add New Staff Member
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] rounded-[30px] p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="bg-primary pt-10 pb-8 px-8 text-white relative">
                  <DialogTitle className="text-2xl font-semibold">
                    Add Staff Member
                  </DialogTitle>
                  <DialogDescription className="text-primary-foreground/80 font-medium">
                    Create a new profile for a care home staff member.
                  </DialogDescription>
                  <div className="absolute -bottom-6 right-8 bg-white p-3 rounded-2xl shadow-lg ring-4 ring-primary">
                    <UserPlus className="h-6 w-6 text-primary" />
                  </div>
                </DialogHeader>
                <div className="p-8 space-y-6 bg-white">
                  <div className="space-y-2">
                    <label className="text-md font-semibold uppercase tracking-widest text-gray-400">
                      Full Name
                    </label>
                    <Input
                      placeholder="Enter full name"
                      className="rounded-xl border-gray-100 bg-gray-50/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-md font-semibold uppercase tracking-widest text-gray-400">
                      Position
                    </label>
                    <Input
                      placeholder="e.g. Registered Nurse"
                      className="rounded-xl border-gray-100 bg-gray-50/50"
                    />
                  </div>
                </div>
                <DialogFooter className="bg-gray-50 px-8 py-6 gap-3">
                  <Button variant="ghost" className="rounded-xl font-semibold">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="rounded-xl font-semibold px-8 bg-primary"
                  >
                    Create Profile
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full rounded-xl font-semibold gap-2 h-12 border-gray-200"
                >
                  <Settings className="h-4 w-4" /> System Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[30px] border-none shadow-2xl p-8">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-semibold text-gray-900">
                    System Preferences
                  </DialogTitle>
                  <DialogDescription className="font-medium text-gray-500">
                    Configure your application preferences and global defaults.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-6 space-y-4">
                  <div className="p-4 bg-emerald-50 rounded-2xl flex items-start gap-4 border border-emerald-100">
                    <div className="bg-emerald-500 p-2 rounded-xl">
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-emerald-900 text-md">
                        System Healthy
                      </p>
                      <p className="text-md text-emerald-700 font-semibold">
                        All services are running normally.
                      </p>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button className="rounded-xl font-semibold w-full bg-primary h-12">
                    Close Settings
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Confirmation Modals */}
        <Card className="rounded-[20px] shadow-sm border-gray-100 overflow-hidden">
          <CardHeader className="bg-gray-50/50">
            <CardTitle className="text-xl font-semibold tracking-tight">
              Confirmation Flows
            </CardTitle>
            <CardDescription>
              Alert dialogs for high-stakes actions.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full rounded-xl font-semibold gap-2 h-12 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                >
                  <Trash2 className="h-4 w-4" /> Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-[30px] border-none shadow-2xl p-0 overflow-hidden">
                <div className="bg-rose-50 p-10 flex flex-col items-center text-center space-y-4">
                  <div className="bg-rose-100 p-4 rounded-full ring-8 ring-rose-50">
                    <AlertTriangle className="h-10 w-10 text-rose-600" />
                  </div>
                  <div className="space-y-2">
                    <AlertDialogTitle className="text-2xl font-semibold text-rose-900">
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-rose-700 font-semibold max-w-[300px]">
                      This action cannot be undone. This will permanently delete
                      your account and remove your data from our servers.
                    </AlertDialogDescription>
                  </div>
                </div>
                <AlertDialogFooter className="p-8 bg-white border-t border-rose-100 flex-row sm:justify-center gap-4">
                  <AlertDialogCancel className="rounded-xl font-semibold flex-1 border-gray-200 mt-0">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction className="rounded-xl font-semibold flex-1 bg-rose-600 hover:bg-rose-700">
                    Delete Forever
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex gap-4">
              <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-md text-blue-700 font-medium">
                Confirmation modals use the{" "}
                <code className="font-semibold">AlertDialog</code> component to
                prevent accidental data loss.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import {
  Input,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Switch,
  Checkbox,
  RadioGroup,
  RadioGroupItem,
  Slider,
  Textarea,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Button,
} from "@repo/ui/components/ui";

export function FormDemo() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Basic Inputs */}
        <Card className="rounded-[20px] shadow-sm overflow-hidden border-gray-100">
          <CardHeader className="bg-gray-50/50 pb-4">
            <CardTitle className="text-xl font-semibold tracking-tight">
              Basic Inputs
            </CardTitle>
            <CardDescription>
              Standard text fields and variants.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <label className="text-md font-semibold text-gray-700">
                Full Name
              </label>
              <Input placeholder="John Doe" />
              <p className="text-[11px] text-gray-400 font-medium">
                Enter your legal name as it appears on your ID.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-md font-semibold text-gray-700">
                Email Address
              </label>
              <Input type="email" placeholder="john@example.com" />
            </div>
            <div className="space-y-2">
              <label className="text-md font-semibold text-gray-700">
                Password
              </label>
              <Input type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <label className="text-md font-semibold text-gray-700 text-rose-500">
                Error State
              </label>
              <Input
                placeholder="Invalid input"
                errorMessage="This field is required"
              />
            </div>
            <div className="space-y-2">
              <label className="text-md font-semibold text-gray-700">
                Disabled State
              </label>
              <Input placeholder="Cannot edit this" disabled />
            </div>
          </CardContent>
        </Card>

        {/* Selection Elements */}
        <Card className="rounded-[20px] shadow-sm overflow-hidden border-gray-100">
          <CardHeader className="bg-gray-50/50 pb-4">
            <CardTitle className="text-xl font-semibold tracking-tight">
              Selection & Choices
            </CardTitle>
            <CardDescription>
              Dropdowns, checkboxes, and radio buttons.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pt-6">
            <div className="space-y-2">
              <label className="text-md font-semibold text-gray-700">
                Preferred Role
              </label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Administration</SelectLabel>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Care Staff</SelectLabel>
                    <SelectItem value="nurse">Nurse</SelectItem>
                    <SelectItem value="carer">Care Worker</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <label className="text-md font-semibold text-gray-700">
                Communication Preferences
              </label>
              <div className="flex items-center space-x-3">
                <Checkbox id="terms" />
                <label
                  htmlFor="terms"
                  className="text-md font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Email notifications
                </label>
              </div>
              <div className="flex items-center space-x-3 text-primary">
                <Checkbox id="sms" defaultChecked />
                <label
                  htmlFor="sms"
                  className="text-md font-medium leading-none"
                >
                  SMS alerts
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-md font-semibold text-gray-700">
                Theme Selection
              </label>
              <RadioGroup defaultValue="light">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="light" id="r1" />
                  <label htmlFor="r1" className="text-md font-medium">
                    Light Mode
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="dark" id="r2" />
                  <label htmlFor="r2" className="text-md font-medium">
                    Dark Mode
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="system" id="r3" />
                  <label htmlFor="r3" className="text-md font-medium">
                    System Default
                  </label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Controls */}
        <Card className="rounded-[20px] shadow-sm overflow-hidden border-gray-100 md:col-span-2">
          <CardHeader className="bg-gray-50/50 pb-4">
            <CardTitle className="text-xl font-semibold tracking-tight">
              Advanced Form Controls
            </CardTitle>
            <CardDescription>
              Sliders, switches, and multi-line text input.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-teal-50/30 rounded-2xl border border-teal-50">
                <div className="space-y-0.5">
                  <label className="text-md font-semibold text-teal-900">
                    Push Notifications
                  </label>
                  <p className="text-md text-teal-600/70">
                    Receive real-time alerts on your device.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex justify-between items-center">
                  <label className="text-md font-semibold text-gray-700 font-semibold">
                    Volume Level
                  </label>
                  <span className="text-md font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    75%
                  </span>
                </div>
                <Slider
                  defaultValue={[75]}
                  max={100}
                  step={1}
                  sliderValues={[10, 30]}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-md font-semibold text-gray-700">
                Special Instructions
              </label>
              <Textarea
                placeholder="Type your message here..."
                className="min-h-[120px] rounded-2xl"
              />
              <p className="text-md text-gray-400">Word count: 0 / 500</p>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50/30 border-t border-gray-100 flex justify-end gap-3 p-6">
            <Button variant="outline" className="rounded-xl px-6 font-semibold">
              Discard
            </Button>
            <Button className="rounded-xl px-8 font-semibold bg-primary">
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import {
  Users,
  Bed,
  Calendar,
  Filter,
  ChevronDown,
  UserPlus,
  Search,
  SlidersHorizontal,
  ArrowUp,
  ArrowDown,
  Info,
  ArrowRight,
  Star,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import {
  Button,
  Card,
  CardContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui";
import { useAuth } from "../../../../../../lib/context/AuthContext";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  LabelList,
} from "recharts";

const careTypeData = [
  { name: "Occupied", value: 89, color: "#4A706A" },
  { name: "Occupied 2", value: 89, color: "#93B5AE" },
  { name: "Occupied 3", value: 89, color: "#C6B37E" },
  { name: "Available", value: 9, color: "#E2D0C6" },
  { name: "Reserved", value: 3, color: "#CFB1A2" },
  { name: "Under Maintenance", value: 2, color: "#8F6C3F" },
];

const ageData = [
  { name: "60", value: 4 },
  { name: "60 - 69", value: 19 },
  { name: "70 - 79", value: 33 },
  { name: "80 - 89", value: 18 },
  { name: "90+", value: 7 },
];

const stayData = [
  { name: "Occupied", value: 89, color: "#4A706A" },
  { name: "Occupied 2", value: 89, color: "#93B5AE" },
  { name: "Occupied 3", value: 89, color: "#C6B37E" },
  { name: "Available", value: 9, color: "#E2D0C6" },
  { name: "Under Maintenance", value: 2, color: "#8F6C3F" },
];

const trendData = [
  { name: "1 May", activeResidents: 121, admissions: 24, discharge: 17 },
  { name: "8 May", activeResidents: 124, admissions: 23, discharge: 17 },
  { name: "15 May", activeResidents: 121, admissions: 14, discharge: 18 },
  { name: "22 May", activeResidents: 120, admissions: 20, discharge: 17 },
  { name: "31 May", activeResidents: 121, admissions: 21, discharge: 17 },
];

const data = [
  { unit: "Maple Unit", value: 38, countText: "38(29.7%)" },
  { unit: "Oak Unit", value: 32, countText: "32(25.0%)" },
  { unit: "Pine Unit", value: 28, countText: "28(21.9%)" },
  { unit: "Cedar Unit", value: 18, countText: "18(14.7%)" },
  { unit: "Willow Unit", value: 12, countText: "12(29.7%)" },
];
const CustomYAxisTick = ({ x, y, payload }: any) => {
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={-8}
        y={4}
        textAnchor="end"
        fill="#141F1E"
        fontSize={12}
        fontWeight={400}
        fontFamily="Outfit"
        style={{ whiteSpace: 'pre' }}
      >
        {payload.value}
      </text>
    </g>
  );
};

const genderData = [
  { name: "Female", value: 89, color: "#4A706A" },
  { name: "Male", value: 89, color: "#93B5AE" },
  { name: "Other", value: 89, color: "#C6B37E" },
];

export function ResidentAnalyticsClient() {
  const { user } = useAuth();
  const isAdmin = user?.roleName?.toLowerCase() === "admin";

  const [dateRange, setDateRange] = useState("Date Range");
  const [floor1, setFloor1] = useState("All Floors");
  const [floor2, setFloor2] = useState("All Floors");
  const [careType, setCareType] = useState("All Care type");
  const [status, setStatus] = useState("All Statuses");
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 lg:gap-6">
        <div className="space-y-1 lg:space-y-2">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-normal text-black font-sans leading-none">
            Resident Directory Analytics
          </h1>
          <p className="text-[#5D5D5D] text-md lg:text-md font-medium font-sans">
            Insights and trends about your residents and care population.
          </p>
        </div>
        <div className="flex items-center gap-4 lg:gap-6">
          <Button
            variant="ghost"
            className="w-[124px] lg:w-[140px] h-[38px] lg:h-[44px] bg-white border border-[#BCD3CD] hover:bg-slate-50 text-[#4A706A] font-medium rounded-xl text-md lg:text-md flex items-center justify-center gap-1.5 lg:gap-2 transition-colors"
          >
            <Calendar className="w-4 h-4 lg:w-5 lg:h-5 text-[#4A706A]" />
            May
            <ChevronDown className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-[#4A706A]" />
          </Button>
          {isAdmin && (
            <Button
              asChild
              className="w-[137px] lg:w-[160px] h-[38px] lg:h-[44px] bg-[#4A706A] hover:bg-[#3d5d58] text-white font-medium rounded-xl text-md lg:text-md flex items-center justify-center gap-1.5 lg:gap-2 transition-colors shadow-none"
            >
              <Link href="/admin/residents/admit">
                <UserPlus className="w-4 h-4 lg:w-5 lg:h-5 text-white" /> Admit Resident
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Top Metrics Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
        {[
          {
            title: "Total Residents",
            value: "128",
            sub: "3 vs last month",
            isUp: true,
            isTrend: true,
            icon: Bed,
          },
          {
            title: "Active Residents",
            value: "118",
            sub: "92.2% of total",
            isTrend: false,
            icon: Bed,
          },
          {
            title: "New Admissions",
            value: "7",
            sub: "2 vs last month",
            isUp: true,
            isTrend: true,
            icon: Users,
          },
          {
            title: "Discharges",
            value: "5",
            sub: "1 vs last month",
            isUp: false,
            isTrend: true,
            icon: Users,
          },
          {
            title: "Average Age",
            value: "76.4",
            sub: "Year",
            hasInfo: true,
            isTrend: false,
            icon: Wrench,
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card
              key={i}
              className="bg-[#F7F7F7] p-4 lg:p-6 rounded-2xl flex flex-row items-center min-h-[104px] lg:min-h-[128px] gap-3 lg:gap-5 shadow-none border-none"
            >
              <div className="w-8 lg:w-12 h-8 lg:h-12 bg-white rounded-full flex items-center justify-center text-[#4A706A] shrink-0 shadow-xs">
                <Icon className="size-4 lg:size-6 text-[#4A706A]" />
              </div>
              <div className="space-y-1 lg:space-y-2">
                <p className="text-md lg:text-md text-[#141F1E] font-normal leading-none font-sans">
                  {stat.title}
                </p>
                <h4 className="text-xl lg:text-3xl font-bold text-[#141F1E] tracking-normal leading-none font-sans py-0.5">
                  {stat.value}
                </h4>
                <div className="flex items-center gap-1 lg:gap-1.5">
                  {stat.isTrend && (
                    stat.isUp ? (
                      <ArrowUp className="size-3 lg:size-4 text-[#22973F]" />
                    ) : (
                      <ArrowDown className="size-3 lg:size-4 text-[#FF3B2F]" />
                    )
                  )}
                  <span
                    className={`text-[10px] lg:text-md font-normal font-sans ${stat.isTrend
                      ? stat.isUp
                        ? "text-[#22973F]"
                        : "text-[#FF3B2F]"
                      : "text-[#141F1E]"
                      }`}
                  >
                    {stat.sub}
                  </span>
                  {stat.hasInfo && (
                    <Info className="size-3 lg:size-4 text-[#141F1E] ml-0.5" />
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 3. Filter Controls Row */}
      <div className="flex flex-wrap xl:flex-nowrap items-center gap-3 lg:gap-3.5 w-full">
        {/* Select Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 flex-1 min-w-full xl:min-w-0 gap-3 lg:gap-3.5">
          {[
            { value: dateRange, setter: setDateRange, placeholder: "Date Range" },
            { value: floor1, setter: setFloor1, placeholder: "All Floors" },
            { value: floor2, setter: setFloor2, placeholder: "All Floors" },
            { value: careType, setter: setCareType, placeholder: "All Care type" },
            { value: status, setter: setStatus, placeholder: "All Statuses" },
          ].map((sel, idx) => (
            <Select
              key={idx}
              value={sel.value}
              onValueChange={sel.setter}
            >
              <SelectTrigger className="w-full h-[50px] bg-white border border-border-secondary rounded-xl px-3 text-[12px] leading-[15px] text-text-body">
                <SelectValue placeholder={sel.placeholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={sel.placeholder}>{sel.placeholder}</SelectItem>
              </SelectContent>
            </Select>
          ))}
        </div>

        {/* Search Input & Filter Button */}
        <div className="flex items-center gap-3 lg:gap-3.5 w-full xl:w-[330px] shrink-0">
          <div className="relative flex-1 h-[50px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#141F1E] w-5 h-5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by names, room ...."
              className="w-full h-full pl-11 pr-4 bg-white border border-[#BCD3CD] rounded-xl text-[12px] leading-[15px] font-['Outfit'] text-[#141F1E] placeholder:text-[#5D5D5D] focus:outline-none truncate"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="border border-[#BCD3CD] bg-white rounded-xl h-[50px] w-[50px] xl:w-[61px] flex items-center justify-center text-[#141F1E] hover:bg-slate-50 shrink-0 p-0"
          >
            <Filter className="w-4 h-4 text-[#141F1E]" />
          </Button>
        </div>
      </div>

      {/* Analytics Section Container (Two Separate 12-Column Grids) */}
      <div className="flex flex-col gap-6 w-full">

        {/* ========================================================= */}
        {/* GRID 1: TOP ROW (3 Equal-Width Cards: 4 + 4 + 4 = 12)    */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 lg:gap-6 w-full items-stretch">

          {/* Card 1: Residents by Care Type (4 Columns) */}
          <Card className="lg:col-span-4 bg-[#F7F7F7] rounded-2xl p-5 lg:p-6 flex flex-col justify-between h-full min-h-[300px] shadow-none border-none">
            <h3 className="text-md lg:text-base font-semibold text-[#141F1E]">
              Residents by Care Type
            </h3>
            <div className="flex flex-col sm:flex-row items-center gap-3 lg:gap-4 my-auto w-full">
              <div className="relative size-32 lg:size-36 shrink-0 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={careTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius="68%"
                      outerRadius="98%"
                      startAngle={90}
                      endAngle={-270}
                      paddingAngle={0}
                      stroke="none"
                      dataKey="value"
                    >
                      {careTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute text-center flex flex-col items-center">
                  <span className="text-xl lg:text-2xl font-bold text-[#141F1E] leading-none">128</span>
                  <span className="text-[8px] lg:text-[10px] font-medium text-[#141F1E] mt-0.5">Total</span>
                </div>
              </div>

              <div className="space-y-1.5 text-[9px] lg:text-[11px] text-[#141F1E] flex-1 w-full min-w-0">
                {[
                  { label: "Occupied", sub: "89(81%)", color: "bg-[#4A706A]" },
                  { label: "Occupied", sub: "89(81%)", color: "bg-[#93B5AE]" },
                  { label: "Occupied", sub: "89(81%)", color: "bg-[#C6B37E]" },
                  { label: "Available", sub: "9(6.8%)", color: "bg-[#E2D0C6]" },
                  { label: "Reserved", sub: "3(2.3%)", color: "bg-[#CFB1A2]" },
                  { label: "Under Maintenance", sub: "2(1.5%)", color: "bg-[#8F6C3F]" },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 w-full">
                    <div className={`size-2 ${item.color} rounded-xs shrink-0`} />
                    <span className="font-medium truncate">{item.label}</span>
                    <span className="text-[#5D5D5D] ml-auto shrink-0">{item.sub}</span>
                  </div>
                ))}
              </div>
            </div>
            <button className="mx-auto flex items-center gap-1.5 text-md lg:text-md text-[#141F1E] font-medium hover:text-[#4A706A] mt-2">
              View all Rejected Requests <ArrowRight className="size-3 lg:size-4 text-[#4A706A]" />
            </button>
          </Card>

          {/* Card 2: Age Distribution (Vertical Bar - 4 Columns) */}
          <Card className="lg:col-span-4 bg-[#F7F7F7] rounded-2xl p-5 lg:p-6 flex flex-col justify-between h-full min-h-[300px] shadow-none border-none">
            <h3 className="text-md lg:text-base font-semibold text-[#141F1E]">
              Age Distribution
            </h3>
            <div className="h-36 lg:h-48 w-full min-w-0 pt-2 my-auto">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="0" vertical={false} stroke="#E5E7EB" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#141F1E", fontSize: 11, fontWeight: 500 }}
                    dy={5}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#141F1E", fontSize: 11, fontWeight: 500 }}
                    domain={[0, 40]}
                    ticks={[0, 10, 20, 30, 40]}
                    width={35}
                  />
                  <Bar dataKey="value" fill="#4A706A" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-1.5 text-[10px] lg:text-md text-[#141F1E] font-medium mt-1">
              <span className="w-3.5 h-2.5 bg-[#4A706A] rounded-xs" /> Residents
            </div>
          </Card>

          {/* Card 3: Length of Stay (4 Columns | 2 cols on md) */}
          <Card className="md:col-span-2 lg:col-span-4 bg-[#F7F7F7] rounded-2xl p-5 lg:p-6 flex flex-col justify-between h-full min-h-[300px] shadow-none border-none">
            <h3 className="text-md lg:text-base font-semibold text-[#141F1E]">
              Length of Stay
            </h3>
            <div className="flex flex-col sm:flex-row items-center gap-3 lg:gap-4 my-auto w-full">
              <div className="relative size-32 lg:size-36 shrink-0 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stayData}
                      cx="50%"
                      cy="50%"
                      innerRadius="68%"
                      outerRadius="98%"
                      startAngle={90}
                      endAngle={-270}
                      paddingAngle={0}
                      stroke="none"
                      dataKey="value"
                    >
                      {stayData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute text-center flex flex-col items-center">
                  <span className="text-xl lg:text-2xl font-bold text-[#141F1E] leading-none">128</span>
                  <span className="text-[8px] lg:text-[10px] font-medium text-[#141F1E] mt-0.5">Total</span>
                </div>
              </div>

              <div className="space-y-1.5 text-[9px] lg:text-[11px] text-[#141F1E] flex-1 w-full min-w-0">
                {[
                  { label: "Occupied", sub: "89(81%)", color: "bg-[#4A706A]" },
                  { label: "Occupied", sub: "89(81%)", color: "bg-[#93B5AE]" },
                  { label: "Occupied", sub: "89(81%)", color: "bg-[#C6B37E]" },
                  { label: "Available", sub: "9(6.8%)", color: "bg-[#E2D0C6]" },
                  { label: "Under Maintenance", sub: "2(1.5%)", color: "bg-[#8F6C3F]" },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 w-full">
                    <div className={`size-2 ${item.color} rounded-xs shrink-0`} />
                    <span className="font-medium truncate">{item.label}</span>
                    <span className="text-[#5D5D5D] ml-auto shrink-0">{item.sub}</span>
                  </div>
                ))}
              </div>
            </div>
            <button className="mx-auto flex items-center gap-1.5 text-md lg:text-md text-[#141F1E] font-medium hover:text-[#4A706A] mt-2">
              View all Rejected Requests <ArrowRight className="size-3 lg:size-4 text-[#4A706A]" />
            </button>
          </Card>

        </div>

        {/* ========================================================= */}
        {/* GRID 2: BOTTOM ROW (Asymmetric Cards: 3 + 4 + 5 = 12)     */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 lg:gap-6 w-full items-stretch">

          {/* Card 4: Age/Unit Distribution (Horizontal Bar - 3 Columns / ~25% Width) */}
          <Card className="lg:col-span-3 bg-[#F7F7F7] rounded-2xl p-5 lg:p-6 flex flex-col justify-between h-full min-h-[300px] shadow-none border-none">
            <h3 className="text-md lg:text-base font-semibold text-[#141F1E]">
              Age Distribution
            </h3>
            <div className="w-full h-[190px] min-w-0 my-auto">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={data}
                  margin={{ top: 5, right: 35, left: 0, bottom: 0 }}
                  barCategoryGap={10}
                >
                  <XAxis
                    type="number"
                    domain={[0, 40]}
                    ticks={[0, 10, 20, 30, 40]}
                    interval={0}
                    axisLine={{ stroke: "#BCD3CD", strokeWidth: 0.5 }}
                    tickLine={false}
                    tick={{ fill: "#141F1E", fontSize: 10, fontWeight: 500 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="unit"
                    interval={0}
                    axisLine={false}
                    tickLine={false}
                    width={70}
                    tick={{ fill: "#141F1E", fontSize: 10, fontWeight: 500 }}
                  />
                  <Bar dataKey="value" fill="#4A706A" barSize={16} radius={[0, 2, 2, 0]}>
                    <LabelList
                      dataKey="countText"
                      position="right"
                      offset={6}
                      style={{ fill: "#5D5D5D", fontSize: "9px" }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Card 5: Length of Stay (4 Columns / ~33% Width) */}
          <Card className="lg:col-span-4 bg-[#F7F7F7] rounded-2xl p-5 lg:p-6 flex flex-col justify-between h-full min-h-[300px] shadow-none border-none">
            <h3 className="text-md lg:text-base font-semibold text-[#141F1E]">
              Length of Stay
            </h3>
            <div className="flex flex-col sm:flex-row items-center gap-3 lg:gap-4 my-auto w-full">
              <div className="relative size-32 lg:size-36 shrink-0 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stayData}
                      cx="50%"
                      cy="50%"
                      innerRadius="68%"
                      outerRadius="98%"
                      startAngle={90}
                      endAngle={-270}
                      paddingAngle={0}
                      stroke="none"
                      dataKey="value"
                    >
                      {stayData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute text-center flex flex-col items-center">
                  <span className="text-xl lg:text-2xl font-bold text-[#141F1E] leading-none">128</span>
                  <span className="text-[8px] lg:text-[10px] font-medium text-[#141F1E] mt-0.5">Total</span>
                </div>
              </div>

              <div className="space-y-1.5 text-[9px] lg:text-[11px] text-[#141F1E] flex-1 w-full min-w-0">
                {[
                  { label: "Occupied", sub: "89(81%)", color: "bg-[#4A706A]" },
                  { label: "Occupied", sub: "89(81%)", color: "bg-[#93B5AE]" },
                  { label: "Occupied", sub: "89(81%)", color: "bg-[#C6B37E]" },
                  { label: "Available", sub: "9(6.8%)", color: "bg-[#E2D0C6]" },
                  { label: "Under Maintenance", sub: "2(1.5%)", color: "bg-[#8F6C3F]" },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 w-full">
                    <div className={`size-2 ${item.color} rounded-xs shrink-0`} />
                    <span className="font-medium truncate">{item.label}</span>
                    <span className="text-[#5D5D5D] ml-auto shrink-0">{item.sub}</span>
                  </div>
                ))}
              </div>
            </div>
            <button className="mx-auto flex items-center gap-1.5 text-md lg:text-md text-[#141F1E] font-medium hover:text-[#4A706A] mt-2">
              View all Rejected Requests <ArrowRight className="size-3 lg:size-4 text-[#4A706A]" />
            </button>
          </Card>

          {/* Card 6: Key Metrics Trend (5 Columns / ~42% Width | 2 cols on md) */}
          <Card className="md:col-span-2 lg:col-span-5 bg-[#F7F7F7] rounded-2xl p-5 lg:p-6 flex flex-col justify-between h-full min-h-[300px] shadow-none border-none">
            <h3 className="text-base font-semibold text-[#141F1E] mb-2">
              Key Metrics Trend
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-md font-medium text-[#141F1E] mb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-2.5 bg-[#ED2115] rounded-xs inline-block" />
                <span>Active Residents</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-2.5 bg-[#1B75F5] rounded-xs inline-block" />
                <span>Admissions</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-2.5 bg-[#22973F] rounded-xs inline-block" />
                <span>Discharge</span>
              </div>
            </div>
            <div className="w-full h-[200px] min-w-0 my-auto">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#E3ECE9" strokeWidth={1} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#141F1E", fontSize: 11 }} dy={10} />
                  <YAxis type="number" axisLine={false} tickLine={false} domain={[0, 140]} ticks={[0, 20, 40, 60, 80, 100, 120, 140]} tick={{ fill: "#141F1E", fontSize: 10 }} width={35} />
                  <Line type="monotone" dataKey="activeResidents" stroke="#ED2115" strokeWidth={1.8} dot={false} />
                  <Line type="monotone" dataKey="admissions" stroke="#1B75F5" strokeWidth={1.8} dot={false} />
                  <Line type="monotone" dataKey="discharge" stroke="#22973F" strokeWidth={1.8} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

        </div>

      </div>
      {/* 6. Dark Teal Bottom Section */}
      <div className="bg-[#4A706A] rounded-2xl p-4 md:p-5 w-full font-['Outfit'] box-border">

        {/* Responsive Grid Layout: 1 col on mobile, 2 cols on tablet, 3 on desktop, 5 on wide screens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 w-full">

          {/* Cards 1, 2, 3: Upcoming Reviews */}
          {[1, 2, 3].map((_, idx) => (
            <div
              key={idx}
              className="bg-[#F7F7F7] border border-[#BCD3CD] rounded-xl px-3 py-4 h-[117px] flex flex-row items-center justify-between shadow-none box-border w-full"
            >
              {/* Star Icon Badge + Main Text */}
              <div className="flex flex-row items-center gap-2.5 min-w-0">
                {/* Star Badge Container */}
                <div className="w-8 h-8 rounded-full bg-[#FDFBE9] shrink-0 flex items-center justify-center">
                  <StarBadgeIcon />
                </div>

                {/* Text Column */}
                <div className="flex flex-col justify-center min-w-0">
                  <span className="text-[9px] font-light text-[#141F1E] leading-tight truncate">
                    Upcoming Reviews
                  </span>

                  <h4 className="text-[20px] font-medium text-[#141F1E] leading-tight my-0.5">
                    18
                  </h4>

                  <p className="text-[8px] font-normal text-[#5D5D5D] leading-[10px] whitespace-nowrap">
                    Reviews due <br /> in next 30 days
                  </p>
                </div>
              </div>

              {/* Gray Circle Badge */}
              <div className="w-7 h-7 flex items-center justify-center shrink-0 ml-1">
                <div className="w-3.5 h-3.5 rounded-full bg-[#D9D9D9]" />
              </div>
            </div>
          ))}

          {/* Card 4: Top Card Needs */}
          <div className="bg-[#F7F7F7] border border-[#BCD3CD] rounded-xl p-4 h-[117px] flex flex-col justify-center shadow-none box-border w-full">
            <h4 className="text-[9px] font-light text-[#141F1E] leading-tight mb-2">
              Top Card Needs
            </h4>

            <div className="flex flex-col gap-1.5 w-full">
              {[
                { label: "Occupied", value: "89(81%)" },
                { label: "Occupied", value: "89(81%)" },
                { label: "Occupied", value: "89(81%)" },
                { label: "Available", value: "9(6.8%)" },
              ].map((item, index) => (
                <div key={index} className="flex flex-row items-center justify-between text-[8px] leading-none w-full">
                  <span className="font-normal text-[#141F1E]">{item.label}</span>
                  <span className="font-normal text-[#5D5D5D]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 5: Gender Distribution */}
          <div className="bg-[#F7F7F7] border border-[#BCD3CD] rounded-xl p-4 h-[117px] flex flex-col justify-center shadow-none box-border w-full">
            <h4 className="text-[9px] font-light text-[#141F1E] leading-tight mb-1.5">
              Gender Distribution
            </h4>

            <div className="flex flex-row items-center justify-between gap-2 w-full h-[65px]">
              {/* Donut Pie Chart Container */}
              <div className="w-[48px] h-[48px] shrink-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Occupied 1", value: 60 },
                        { name: "Occupied 2", value: 35 },
                        { name: "Occupied 3", value: 5 },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius="60%"
                      outerRadius="100%"
                      startAngle={90}
                      endAngle={-270}
                      stroke="none"
                      dataKey="value"
                      isAnimationActive={true}
                      animationBegin={0}
                      animationDuration={1200}
                      animationEasing="ease-out"
                    >
                      <Cell fill="#4A706A" />
                      <Cell fill="#93B5AE" />
                      <Cell fill="#C6B37E" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend Rows */}
              <div className="flex flex-col justify-center gap-1.5 flex-1 min-w-0">
                {[
                  { color: "bg-[#4A706A]", label: "Occupied", value: "89(81%)" },
                  { color: "bg-[#93B5AE]", label: "Occupied", value: "89(81%)" },
                  { color: "bg-[#C6B37E]", label: "Occupied", value: "89(81%)" },
                ].map((item, index) => (
                  <div key={index} className="flex flex-row items-center justify-between text-[8px] leading-none w-full">
                    <div className="flex flex-row items-center gap-1 min-w-0">
                      <div className={`w-2 h-2 ${item.color} shrink-0 rounded-xs`} />
                      <span className="font-medium text-[#141F1E] truncate">{item.label}</span>
                    </div>
                    <span className="font-normal text-[#141F1E] shrink-0 ml-1">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}


{/* Custom Star Icon SVG */ }
const StarBadgeIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <rect width="32" height="32" rx="16" fill="#FDFBE9" />
    <path d="M17.1401 23.4H23.1401V25H17.1401V23.4ZM17.1401 20.2H26.1401V21.8H17.1401V20.2ZM17.1401 17H26.1401V18.6H17.1401V17Z" fill="#E2B310" />
    <path d="M18.8419 12.5836L15.6072 6L12.3725 12.5836L5.14014 13.6393L10.3737 18.7643L9.13782 26L14.185 23.335V21.7207L11.0272 23.3886L11.7752 19.0057L11.9018 18.265L11.3663 17.7414L8.19635 14.6364L12.5773 13.9971L13.3168 13.8893L13.6482 13.2157L15.6072 9.22786L17.5662 13.2157L17.8976 13.8893L18.6371 13.9971L23.9375 14.7721L24.1401 13.3571L18.8419 12.5836Z" fill="#E2B310" />
  </svg>
);
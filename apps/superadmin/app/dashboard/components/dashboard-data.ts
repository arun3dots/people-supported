import {
  Building2,
  Users,
  AlertCircle,
  Activity,
  type LucideIcon,
} from "lucide-react";

export interface DashboardStat {
  title: string;
  value: string;
  subValue: string;
  icon: LucideIcon;
  trend: number;
}

export interface OnboardingEntry {
  name: string;
  email: string;
  date: string;
  status: "Active" | "Pending";
}

export interface SystemHealthMetric {
  label: string;
  value: number;
  tone: "primary" | "secondary";
}

/**
 * Placeholder dashboard figures. These are static demo values until the
 * platform-metrics endpoints exist; keeping them in one typed module makes the
 * page components pure and easy to swap for live queries later.
 */
export const DASHBOARD_STATS: DashboardStat[] = [
  {
    title: "Total Tenants",
    value: "24",
    subValue: "vs last month",
    icon: Building2,
    trend: 12,
  },
  {
    title: "Total Residents",
    value: "1,248",
    subValue: "across all homes",
    icon: Activity,
    trend: 8,
  },
  {
    title: "Platform Users",
    value: "482",
    subValue: "active carers/nurses",
    icon: Users,
    trend: 15,
  },
  {
    title: "Storage Usage",
    value: "1.2 TB",
    subValue: "images & logs",
    icon: AlertCircle,
    trend: -2,
  },
];

export const RECENT_ONBOARDING: OnboardingEntry[] = [
  {
    name: "Willow Creek Care",
    email: "contact@willowcreek.co.uk",
    date: "2 hours ago",
    status: "Active",
  },
  {
    name: "Sunrise Manor",
    email: "admin@sunrisemanor.com",
    date: "Yesterday",
    status: "Pending",
  },
  {
    name: "Oakwood Gardens",
    email: "info@oakwood.io",
    date: "2 days ago",
    status: "Active",
  },
];

export const SYSTEM_HEALTH: SystemHealthMetric[] = [
  { label: "Database Load", value: 24, tone: "primary" },
  { label: "Carer Active Sessions", value: 88, tone: "secondary" },
];

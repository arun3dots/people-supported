import {
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  Building2,
  Package,
  ClipboardList,
  CreditCard,
  FileText,
  UserCircle,
  ShieldAlert,
  UserPlus,
  Heart,
  AlertTriangle,
  ClipboardCheck,
  ListTodo,
  type LucideIcon,
} from "lucide-react";

export interface NavSubItem {
  title: string;
  url: string;
}

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  hasSubmenu?: boolean;
  subItems?: NavSubItem[];
}

export interface NavGroup {
  category: string;
  icon: LucideIcon;
  items: NavItem[];
}

export const ROLE_NAVIGATION: Record<string, NavGroup[]> = {
  ADMIN: [
    {
      category: "OVERVIEW",
      icon: LayoutDashboard,
      items: [{ title: "Overview", url: "/admin/dashboard", icon: LayoutDashboard }],
    },
    {
      category: "ENQUIRIES",
      icon: UserPlus,
      items: [
        {
          title: "Enquiry Directory",
          url: "/admin/enquiries",
          icon: UserPlus,
        },
      ],
    },
    {
      category: "PEOPLE SUPPORTED",
      icon: Heart,
      items: [
        {
          title: "People Supported",
          url: "/admin/residents",
          icon: Heart,
          hasSubmenu: true,
          subItems: [
            { title: "People Supported Directory", url: "/admin/residents" },
            { title: "Daily Tasks Board", url: "/admin/care-plans/daily-tasks" },
            { title: "Clinical Escalations & CQC", url: "/admin/escalations" },
          ],
        },
      ],
    },
    {
      category: "PROPERTIES & SCHEMES",
      icon: Building2,
      items: [
        {
          title: "Properties & Schemes",
          url: "/admin/configuration/facility",
          icon: Building2,
          hasSubmenu: true,
          subItems: [
            { title: "Properties Directory", url: "/admin/configuration/facility?tab=properties" },
            { title: "Supported Living Schemes", url: "/admin/configuration/facility?tab=schemes" },
            { title: "Room Management", url: "/admin/configuration/facility?tab=rooms" },
            { title: "Bed Management", url: "/admin/configuration/facility?tab=beds" },
          ],
        },
      ],
    },
    {
      category: "STAFF",
      icon: Users,
      items: [
        { title: "Staff Directory", url: "/admin/staff", icon: Users },
      ],
    },
    {
      category: "ROTA MANAGEMENT",
      icon: Calendar,
      items: [
        {
          title: "Rota Management",
          url: "/admin/staff/rota",
          icon: Calendar,
          hasSubmenu: true,
          subItems: [
            { title: "Shift Planner", url: "/admin/staff/rota" },
            { title: "Hours Summary", url: "/admin/staff/rota?tab=hours" },
            { title: "Staff Allocation", url: "/admin/staff/rota?tab=allocation" },
            { title: "Leave Request Management", url: "/admin/staff/requests" },
            { title: "Attendance", url: "/admin/staff/rota?tab=attendance" },
          ],
        },
      ],
    },
    {
      category: "INCIDENT MANAGEMENT",
      icon: ShieldAlert,
      items: [
        {
          title: "Incident Management",
          url: "/admin/incidents",
          icon: ShieldAlert,
        },
      ],
    },
    {
      category: "FINANCE",
      icon: CreditCard,
      items: [
        {
          title: "Finance",
          url: "/admin/finance/invoices",
          icon: CreditCard,
          hasSubmenu: true,
          subItems: [
            { title: "New Invoice", url: "/admin/finance/new-invoice" },
            { title: "Invoice Management", url: "/admin/finance/invoices" },
            { title: "Payment History", url: "/admin/finance/payments" },
            { title: "Expense Management", url: "/admin/finance/expenses" },
          ],
        },
      ],
    },
    {
      category: "REPORTS & AUDIT",
      icon: FileText,
      items: [
        {
          title: "Compliance",
          url: "#",
          icon: Package,
          hasSubmenu: true,
          subItems: [
            { title: "Audit Log", url: "/admin/audit-log" },
            { title: "Reports", url: "/admin/reports" },
          ],
        },
        {
          title: "Resources",
          url: "/admin/configuration/risk-templates",
          icon: ShieldAlert,
          hasSubmenu: true,
          subItems: [
            { title: "Risk Templates", url: "/admin/configuration/risk-templates" },
            { title: "Assessment Templates", url: "/admin/enquiries/templates" },
          ],
        },
      ],
    },
    {
      category: "SETTINGS",
      icon: Settings,
      items: [
        {
          title: "Settings",
          url: "#",
          icon: Settings,
          hasSubmenu: true,
          subItems: [
            { title: "Profile", url: "/profile" },
            { title: "Organisation Profile", url: "/admin/settings/organization" },
            { title: "Roles & Permissions", url: "/admin/settings/roles" },
            { title: "Subscription Management", url: "/subscriptions" },
          ],
        },
      ],
    },
  ],
  SUPERADMIN: [
    {
      category: "PLATFORM",
      icon: LayoutDashboard,
      items: [{ title: "Overview", url: "/admin/dashboard", icon: LayoutDashboard }],
    },
    {
      category: "TENANTS",
      icon: Building2,
      items: [
        { title: "Tenant List", url: "/admin/tenants", icon: Building2 },
      ],
    },
    {
      category: "BILLING & PLANS",
      icon: Package,
      items: [
        {
          title: "Finance",
          url: "#",
          icon: CreditCard,
          hasSubmenu: true,
          subItems: [
            { title: "Packages", url: "/packages" },
            { title: "Subscriptions", url: "/subscriptions" },
          ],
        },
      ],
    },
    {
      category: "REPORTS & AUDIT",
      icon: FileText,
      items: [
        {
          title: "Resources",
          url: "#",
          icon: Package,
          hasSubmenu: true,
          subItems: [
            { title: "Audit Log", url: "/admin/audit-log" },
            { title: "Reports", url: "/admin/reports" },
          ],
        },
      ],
    },
  ],
  CARER: [
    {
      category: "OVERVIEW",
      icon: LayoutDashboard,
      items: [
        { title: "Overview", url: "/carer/dashboard", icon: LayoutDashboard },
        { title: "My Rota", url: "/carer/rota", icon: Calendar },
        { title: "People Supported", url: "/carer/residents", icon: Heart },
        { title: "Report Incident", url: "/carer/incidents", icon: AlertTriangle },
        { title: "Handover", url: "/carer/handover", icon: ClipboardCheck },
        { title: "Task List", url: "/carer/tasks", icon: ListTodo },
      ],
    },
    {
      category: "ROTA & LEAVE",
      icon: Calendar,
      items: [
        { title: "Leave Management", url: "/carer/requests", icon: ClipboardList },
      ],
    },
    {
      category: "USER",
      icon: UserCircle,
      items: [{ title: "My Profile", url: "/profile", icon: UserCircle }],
    },
  ],
  NURSE: [
    {
      category: "OVERVIEW",
      icon: LayoutDashboard,
      items: [
        { title: "Overview", url: "/nurse/dashboard", icon: LayoutDashboard },
        { title: "My Rota", url: "/nurse/rota", icon: Calendar },
      ],
    },
    {
      category: "ROTA & LEAVE",
      icon: Calendar,
      items: [
        { title: "Leave Management", url: "/nurse/requests", icon: ClipboardList },
      ],
    },
    {
      category: "USER",
      icon: UserCircle,
      items: [{ title: "My Profile", url: "/profile", icon: UserCircle }],
    },
  ],
  RESIDENT: [
    {
      category: "OVERVIEW",
      icon: LayoutDashboard,
      items: [
        { title: "Overview", url: "/resident/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      category: "USER",
      icon: UserCircle,
      items: [{ title: "Profile", url: "/profile", icon: UserCircle }],
    },
  ],
};

export interface Incident {
  id: string;
  tenantId: string;
  incidentNumber: string;
  title: string;
  category: string;
  harmLevel: string | null;
  severity: string;
  status: "Draft" | "Open" | "Under Review" | "Closed";
  priority: "High" | "Medium" | "Low";
  incidentDate: string;
  incidentTime: string | null;
  residentId: string | null;
  roomNumber: string | null;
  bedNumber: string | null;
  location?: string | null;
  initialAssessment?: string | null;
  immediateActions: string[] | null;
  investigationDetails?: Array<{
    id: string;
    title: string;
    subtitle?: string;
    notes?: string;
    isSaved?: boolean;
  }> | null;
  tasks?: Array<{
    id: string;
    title: string;
    description: string;
    assignedToName: string;
    assignedToRole?: string;
    priority: "High" | "Medium" | "Low";
    date: string;
    time: string;
    attachmentCount?: number;
    notifyEmail?: boolean;
  }> | null;
  attachments?: Array<{
    id: string;
    name: string;
    timestamp: string;
    previewUrl?: string;
    type: "image" | "pdf";
  }> | null;
  complianceItems?: Array<{
    id: string;
    title: string;
    timestamp?: string;
    status: "Completed" | "Pending";
  }> | null;
  managerNotes?: string | null;
  notes: string | null;
  reportedById: string | null;
  assignedToId: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  resident?: {
    id: string;
    fullName: string;
    photoUrl?: string;
    nextOfKin?: any;
    gpDetails?: any;
    bed?: {
      room?: {
        roomNumber: string;
      };
      number?: string;
    };
  } | null;
  reportedBy?: {
    id: string;
    fullName: string;
  } | null;
  assignedTo?: {
    id: string;
    fullName: string;
  } | null;
}

export interface IncidentMetrics {
  total: number;
  open: number;
  underReview: number;
  closed: number;
  overdue: number;
  closedThisMonth: number;
}

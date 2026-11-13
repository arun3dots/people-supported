"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Eye,
  Scan,
  UserCheck,
  FileText,
  Star,
  ShieldCheck,
  Loader2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { toast, Text } from "@repo/ui/components/ui";
import { Button } from "@repo/ui/components/ui/Button";
import {
  useGetIncidentQuery,
  useGetIncidentMetricsQuery,
  useUpdateIncidentMutation,
} from "../../../../../../lib/queries/incidents";
import { IncidentMetricsCards } from "../../components/IncidentMetricsCards";
import {
  IncidentReviewMainCard,
  AttachmentItem,
} from "./IncidentReviewMainCard";
import { InvestigationDetailsCard } from "./InvestigationDetailsCard";
import { TaskSummaryCard } from "./TaskSummaryCard";
import { InternalNotesCard } from "./InternalNotesCard";
import { QuickActionsPanel } from "./QuickActionsPanel";
import {
  ComplianceChecklistWidget,
  ComplianceItem,
} from "./ComplianceChecklistWidget";
import { ComplianceReminderWidget } from "./ComplianceReminderWidget";
import { ManagerResponseCard } from "./ManagerResponseCard";
import { IncidentReviewFooter } from "./IncidentReviewFooter";
import { IncidentReviewModals } from "./IncidentReviewModals";
import { InvestigationStep } from "./InvestigationModal";
import { IncidentTask } from "./AssignTaskModal";
import { InternalNote } from "./AddInternalNoteModal";
import { ImagePreviewModal } from "../../../../../shared/components/body-map/ImagePreviewModal";
import { makeAPICall } from "../../../../../../lib/api";
import { UPLOAD_INCIDENT_ATTACHMENT } from "@repo/endpoints";

interface IncidentReviewClientProps {
  incidentId?: string;
}

const DEFAULT_INVESTIGATION_STEPS: InvestigationStep[] = [
  {
    id: "resident-statement",
    title: "Resident Statement",
    subtitle: "Record the resident's account of what happened.",
    icon: User,
    notes: "",
  },
  {
    id: "witness-statement",
    title: "Witness Statement",
    subtitle:
      "Capture statements from any individuals who witnessed the incident.",
    icon: Eye,
    notes: "",
  },
  {
    id: "inspecting-environment",
    title: "Inspecting Environment",
    subtitle: "Inspect the location and environment related to the incident.",
    icon: Scan,
    notes: "",
  },
  {
    id: "carer-statement",
    title: "Carer Statement",
    subtitle: "Capture statements from carers involved in the incident.",
    icon: UserCheck,
    notes: "",
  },
  {
    id: "root-cause-analysis",
    title: "Root Cause Analysis",
    subtitle: "Identify the root cause and contributing factors.",
    icon: FileText,
    notes: "",
  },
  {
    id: "review-evidences",
    title: "Review Evidences",
    subtitle: "Review all available documents, photos and recordings.",
    icon: Star,
    notes: "",
  },
  {
    id: "prevent-future",
    title: "Prevent Future Incidents",
    subtitle:
      "Define actions and recommendations to prevent similar incidents.",
    icon: ShieldCheck,
    notes: "",
  },
];

const DEFAULT_COMPLIANCE_ITEMS: ComplianceItem[] = [
  { id: "c-1", title: "Family Notified", status: "Pending" },
  { id: "c-4", title: "RCA Completed", status: "Pending" },
  { id: "c-5", title: "Action Plan Created", status: "Pending" },
];

export function IncidentReviewClient({
  incidentId,
}: IncidentReviewClientProps) {
  const router = useRouter();

  // Queries & Mutations
  const { data: incident, isLoading } = useGetIncidentQuery(incidentId || "");
  const { data: metrics } = useGetIncidentMetricsQuery();
  const updateMutation = useUpdateIncidentMutation(incidentId || "");
  const isReadOnly = incident?.status === "Closed";

  // Local Reactive State
  const [investigationModalOpen, setInvestigationModalOpen] = useState(false);
  const [investigationSteps, setInvestigationSteps] = useState<
    InvestigationStep[]
  >(DEFAULT_INVESTIGATION_STEPS);
  const [assignTaskModalOpen, setAssignTaskModalOpen] = useState(false);
  const [returnToInvestigationAfterTask, setReturnToInvestigationAfterTask] =
    useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [notifyFamilyModalOpen, setNotifyFamilyModalOpen] = useState(false);
  const [addNoteModalOpen, setAddNoteModalOpen] = useState(false);
  const [internalNotes, setInternalNotes] = useState<InternalNote[]>([]);
  const [tasks, setTasks] = useState<IncidentTask[]>([]);
  const [managerNotes, setManagerNotes] = useState("");
  const [previewAttachment, setPreviewAttachment] =
    useState<AttachmentItem | null>(null);
  const imageAttachments = useMemo(
    () =>
      ((incident?.attachments as AttachmentItem[] | null) ?? []).filter(
        (attachment) => Boolean(attachment.previewUrl),
      ),
    [incident?.attachments],
  );
  const previewIndex = previewAttachment
    ? imageAttachments.findIndex(
        (attachment) => attachment.id === previewAttachment.id,
      )
    : -1;
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>(
    DEFAULT_COMPLIANCE_ITEMS,
  );

  // Dynamic checklist computation based on live incident activity
  const activeComplianceItems: ComplianceItem[] = useMemo(() => {
    // 1. Family Notified
    const familyItem = complianceItems.find(
      (i) => i.id === "c-1" || i.title === "Family Notified",
    );
    const isFamilyDone = familyItem?.status === "Completed";

    // 2. RCA Completed (investigation completed or RCA step filled/saved)
    const rcaStep = investigationSteps.find(
      (s) => s.id === "root-cause-analysis",
    );
    const rcaItem = complianceItems.find(
      (i) => i.id === "c-4" || i.title === "RCA Completed",
    );
    const isRcaDone =
      rcaItem?.status === "Completed" ||
      Boolean(rcaStep?.isSaved) ||
      Boolean(rcaStep?.notes && rcaStep.notes.trim().length > 0) ||
      incident?.status === "Under Review" ||
      incident?.status === "Closed";

    // 3. Action Plan Created (tasks created or checklist marked completed)
    const actionItem = complianceItems.find(
      (i) => i.id === "c-5" || i.title === "Action Plan Created",
    );
    const isActionDone = actionItem?.status === "Completed" || tasks.length > 0;

    return [
      {
        id: "c-1",
        title: "Family Notified",
        status: isFamilyDone ? "Completed" : "Pending",
        timestamp: isFamilyDone ? familyItem?.timestamp || "Logged" : undefined,
      },
      {
        id: "c-4",
        title: "RCA Completed",
        status: isRcaDone ? "Completed" : "Pending",
        timestamp: isRcaDone ? rcaItem?.timestamp || "Logged" : undefined,
      },
      {
        id: "c-5",
        title: "Action Plan Created",
        status: isActionDone ? "Completed" : "Pending",
        timestamp: isActionDone
          ? actionItem?.timestamp ||
            `${tasks.length} task${tasks.length > 1 ? "s" : ""}`
          : undefined,
      },
    ];
  }, [complianceItems, incident?.status, investigationSteps, tasks]);

  // Synchronize server incident data when query resolves
  useEffect(() => {
    if (incident) {
      if (
        incident.investigationDetails &&
        incident.investigationDetails.length > 0
      ) {
        const stepIcons: Record<string, typeof User> = {
          "resident-statement": User,
          "witness-statement": Eye,
          "inspecting-environment": Scan,
          "carer-statement": UserCheck,
          "root-cause-analysis": FileText,
          "review-evidences": Star,
          "prevent-future": ShieldCheck,
        };

        const mappedSteps = incident.investigationDetails.map((s) => ({
          ...s,
          icon: stepIcons[s.id] || FileText,
        }));
        setInvestigationSteps(mappedSteps as InvestigationStep[]);
      }

      if (incident.tasks) {
        setTasks(incident.tasks as IncidentTask[]);
      }

      if (incident.complianceItems && incident.complianceItems.length > 0) {
        setComplianceItems(incident.complianceItems as ComplianceItem[]);
      }

      if (incident.managerNotes) {
        setManagerNotes(incident.managerNotes);
      }

      if (incident.notes) {
        try {
          const parsed = JSON.parse(incident.notes);
          if (Array.isArray(parsed)) {
            setInternalNotes(parsed);
          } else {
            setInternalNotes([
              {
                id: "note-init",
                author: incident.reportedBy?.fullName || "Care Staff",
                role: "Reporter",
                date: new Date(incident.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }),
                time: new Date(incident.createdAt).toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                category: "General",
                content: incident.notes,
              },
            ]);
          }
        } catch {
          setInternalNotes([
            {
              id: "note-init",
              author: incident.reportedBy?.fullName || "Care Staff",
              role: "Reporter",
              date: new Date(incident.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              }),
              time: new Date(incident.createdAt).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              category: "General",
              content: incident.notes,
            },
          ]);
        }
      }
    }
  }, [incident]);

  const handleSaveStep = async (stepId: string, notes: string) => {
    if (isReadOnly) return;
    const updatedSteps = investigationSteps.map((step) =>
      step.id === stepId ? { ...step, notes, isSaved: true } : step,
    );
    setInvestigationSteps(updatedSteps);

    if (incidentId) {
      try {
        await updateMutation.mutateAsync({
          investigationDetails: updatedSteps.map(
            ({ id, title, subtitle, notes, isSaved }) => ({
              id,
              title,
              subtitle,
              notes,
              isSaved,
            }),
          ),
        });
      } catch (err) {
        console.error("Failed to update step notes", err);
      }
    }
  };

  const handleCompleteInvestigation = async () => {
    if (isReadOnly) return;
    setInvestigationModalOpen(false);

    const updatedCompliance = complianceItems.map((item) =>
      item.id === "c-4"
        ? {
            ...item,
            status: "Completed" as const,
            timestamp: new Date().toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          }
        : item,
    );
    setComplianceItems(updatedCompliance);

    if (incidentId) {
      try {
        await updateMutation.mutateAsync({
          investigationDetails: investigationSteps.map(
            ({ id, title, subtitle, notes, isSaved }) => ({
              id,
              title,
              subtitle,
              notes,
              isSaved,
            }),
          ),
          complianceItems: updatedCompliance,
          status: "Under Review",
        });
      } catch (err) {
        console.error("Failed to persist completed investigation", err);
      }
    }

    toast({
      title: "Investigation Completed",
      description: "Investigation findings have been logged to the database.",
    });
  };

  const handleTaskCreated = async (newTask: IncidentTask) => {
    if (isReadOnly) return;
    const updatedTasks = [newTask, ...tasks];
    setTasks(updatedTasks);

    const updatedCompliance = complianceItems.map((item) =>
      item.id === "c-5"
        ? {
            ...item,
            status: "Completed" as const,
            timestamp: new Date().toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          }
        : item,
    );
    setComplianceItems(updatedCompliance);

    if (incidentId) {
      try {
        await updateMutation.mutateAsync({
          tasks: updatedTasks,
          complianceItems: updatedCompliance,
        });
      } catch (err) {
        console.error("Failed to save task to database", err);
      }
    }
  };

  const handleUploadFiles = async (files: File[]) => {
    if (isReadOnly) return;
    if (!incident) return;
    const newAttachments = await Promise.all(
      files.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        const uploaded = await makeAPICall<AttachmentItem>(
          UPLOAD_INCIDENT_ATTACHMENT,
          formData,
          {},
          { id: incident.id },
        );
        return {
          ...uploaded,
          timestamp: new Date().toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
      }),
    );

    const currentAttachments = (incident.attachments || []) as Array<{
      id: string;
      name: string;
      timestamp: string;
      type: "image" | "pdf";
      previewUrl?: string;
    }>;
    const updatedAttachments = [...currentAttachments, ...newAttachments];

    if (incidentId) {
      try {
        await updateMutation.mutateAsync({
          attachments: updatedAttachments,
        });
      } catch (err) {
        console.error("Failed to save uploaded attachments", err);
      }
    }
  };

  const handleAddInternalNote = async (newNote: InternalNote) => {
    if (isReadOnly) return;
    const updatedNotes = [newNote, ...internalNotes];
    setInternalNotes(updatedNotes);

    if (incidentId) {
      try {
        await updateMutation.mutateAsync({
          notes: JSON.stringify(updatedNotes),
        });
        toast({
          title: "Internal Note Added",
          description: `Logged under ${newNote.category} category.`,
        });
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "Failed to Save Note",
          description: err?.message || "Could not persist note to database.",
        });
      }
    }
  };

  const handleResolveIncident = async () => {
    if (isReadOnly) return;
    if (!managerNotes.trim()) {
      toast({
        variant: "destructive",
        title: "Management Response Required",
        description:
          "Add Management Response Notes before resolving this incident.",
      });
      return;
    }

    try {
      if (incidentId) {
        await updateMutation.mutateAsync({
          status: "Closed",
          managerNotes,
        });
        toast({
          title: "Incident Resolved",
          description:
            "Incident has been marked as Closed & compliance items archived.",
        });
        router.push("/admin/incidents");
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Resolution Failed",
        description: "Could not mark incident as closed.",
      });
    }
  };

  const handleSaveDraft = async () => {
    if (isReadOnly) return;
    if (incidentId) {
      try {
        await updateMutation.mutateAsync({
          managerNotes,
          complianceItems,
          notes: JSON.stringify(internalNotes),
          status: "Draft",
        });
        toast({
          title: "Draft Saved",
          description: "Incident review progress and notes saved successfully.",
        });
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Save Failed",
          description: "Could not save draft changes.",
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] gap-3">
        <Loader2 className="size-8 animate-spin text-surface-primary" />
        <Text size={"md"} weight={"medium"} className="text-slate-500">
          Loading incident review details...
        </Text>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] gap-3">
        <AlertCircle className="size-8 text-status-danger" />
        <Text size={"md"} weight={"bold"} className="text-slate-900">
          Incident Record Not Found
        </Text>
        <Button
          onClick={() => router.push("/admin/incidents")}
          variant="outline"
          size="sm"
          className="mt-2 rounded-xl cursor-pointer"
        >
          Return to Incident Directory
        </Button>
      </div>
    );
  }

  const defaultMetrics = metrics || {
    total: 0,
    open: 0,
    underReview: 0,
    closed: 0,
    overdue: 0,
    closedThisMonth: 0,
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/incidents")}
            className="h-auto cursor-pointer gap-2 p-0 text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="size-4" />
            <Text size="md" weight="medium">
              Back to Directory
            </Text>
          </Button>
          <Text as="h1" size="xl" weight="bold">
            Incident Review
          </Text>
          <Text size="md" weight="regular" variant="muted">
            Review the incident escalation, take necessary actions &amp; resolve
            the incident.
          </Text>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      {/*<IncidentMetricsCards metrics={defaultMetrics} />*/}

      {/* 3. Main 2-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 Cols wide) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Incident Details Card */}
          <IncidentReviewMainCard
            incident={incident}
            attachments={incident.attachments || undefined}
            onOpenUploadModal={
              isReadOnly ? undefined : () => setUploadModalOpen(true)
            }
            onPreviewImage={setPreviewAttachment}
          />

          {/* Investigation Details Card - Only displayed when investigation findings or steps have been saved */}
          {investigationSteps.some((step) =>
            Boolean(
              step.isSaved || (step.notes && step.notes.trim().length > 0),
            ),
          ) && (
            <InvestigationDetailsCard
              steps={investigationSteps}
              onOpenInvestigationModal={() => setInvestigationModalOpen(true)}
              readOnly={isReadOnly}
            />
          )}

          {/* Internal Notes & Observations Card - Only displayed when notes exist */}
          {internalNotes.length > 0 && (
            <InternalNotesCard
              notes={internalNotes}
              onOpenAddModal={() => setAddNoteModalOpen(true)}
            />
          )}

          {/* Task Summary Card - Only displayed when tasks have been assigned */}
          {tasks.length > 0 && (
            <TaskSummaryCard
              tasks={tasks}
              onOpenAssignModal={() => setAssignTaskModalOpen(true)}
            />
          )}

          {/* Manager Review & Response Card */}
          <ManagerResponseCard
            notes={managerNotes}
            onChangeNotes={setManagerNotes}
            readOnly={isReadOnly}
          />
        </div>

        {/* Right Column (1 Col wide) */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <QuickActionsPanel
            readOnly={isReadOnly}
            onStartInvestigation={() => !isReadOnly && setInvestigationModalOpen(true)}
            onAssignTask={() => {
              if (isReadOnly) return;
              setReturnToInvestigationAfterTask(false);
              setAssignTaskModalOpen(true);
            }}
            onUploadDocument={() => !isReadOnly && setUploadModalOpen(true)}
            onNotifyFamily={() => !isReadOnly && setNotifyFamilyModalOpen(true)}
            onAddInternalNotes={() => !isReadOnly && setAddNoteModalOpen(true)}
          />

          {/* Compliance Checklist Widget */}
          <ComplianceChecklistWidget items={activeComplianceItems} />

          {/* Compliance Reminder Alert Card */}
          {/*<ComplianceReminderWidget incident={incident} />*/}
        </div>
      </div>

      {/* 4. Bottom Action Bar */}
      <IncidentReviewFooter
        onSaveDraft={handleSaveDraft}
        onAssignTask={() => {
          setReturnToInvestigationAfterTask(false);
          setAssignTaskModalOpen(true);
        }}
        onResolveIncident={handleResolveIncident}
        isSaving={updateMutation.isPending}
        readOnly={isReadOnly}
      />

      {/* 5. Modals & Dialogs */}
      <IncidentReviewModals
        investigationModalOpen={investigationModalOpen}
        setInvestigationModalOpen={setInvestigationModalOpen}
        investigationSteps={investigationSteps}
        onSaveStep={handleSaveStep}
        onCompleteInvestigation={handleCompleteInvestigation}
        onOpenAssignTask={() => {
          setInvestigationModalOpen(false);
          setReturnToInvestigationAfterTask(true);
          setAssignTaskModalOpen(true);
        }}
        assignTaskModalOpen={assignTaskModalOpen}
        setAssignTaskModalOpen={setAssignTaskModalOpen}
        incident={incident}
        onTaskCreated={handleTaskCreated}
        returnToInvestigationAfterTask={returnToInvestigationAfterTask}
        uploadModalOpen={uploadModalOpen}
        setUploadModalOpen={setUploadModalOpen}
        onUploadFiles={handleUploadFiles}
        notifyFamilyModalOpen={notifyFamilyModalOpen}
        setNotifyFamilyModalOpen={setNotifyFamilyModalOpen}
        onFamilyNotificationSent={() => {
          const nowTime = new Date().toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          });
          const updatedCompliance = complianceItems.map((item) =>
            item.title === "Family Notified" || item.id === "c-1"
              ? { ...item, status: "Completed" as const, timestamp: nowTime }
              : item,
          );
          if (!updatedCompliance.some((i) => i.id === "c-1")) {
            updatedCompliance.push({
              id: "c-1",
              title: "Family Notified",
              status: "Completed",
              timestamp: nowTime,
            });
          }
          setComplianceItems(updatedCompliance);
          if (incidentId) {
            updateMutation.mutate({
              complianceItems: updatedCompliance,
            });
          }
        }}
        addNoteModalOpen={addNoteModalOpen}
        setAddNoteModalOpen={setAddNoteModalOpen}
        onAddInternalNote={handleAddInternalNote}
        isSavingNote={updateMutation.isPending}
      />

      <ImagePreviewModal
        open={Boolean(previewAttachment)}
        onOpenChange={(open) => !open && setPreviewAttachment(null)}
        imageUrl={previewAttachment?.previewUrl ?? null}
        title={previewAttachment?.name}
        showDownload
        hasPrevious={previewIndex > 0}
        hasNext={
          previewIndex >= 0 && previewIndex < imageAttachments.length - 1
        }
        onPrevious={() =>
          previewIndex > 0 &&
          setPreviewAttachment(imageAttachments[previewIndex - 1] ?? null)
        }
        onNext={() =>
          previewIndex < imageAttachments.length - 1 &&
          setPreviewAttachment(imageAttachments[previewIndex + 1] ?? null)
        }
      />
    </div>
  );
}

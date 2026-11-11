"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ChevronLeft } from "lucide-react";
import { Button, Text, Card, toast } from "@repo/ui/components/ui";
import { useGetResidentsQuery } from "../../../../../../lib/queries/residents";
import { useCreateIncidentMutation } from "../../../../../../lib/queries/incidents";
import { makeAPICall } from "../../../../../../lib/api";
import { UPLOAD_INCIDENT_ATTACHMENT, UPDATE_INCIDENT } from "@repo/endpoints";
import { Resident } from "../../../../../../lib/types/resident";
import { IncidentDetailsSection } from "./IncidentDetailsSection";
import { ImagePreviewModal } from "../../../../../shared/components/body-map/ImagePreviewModal";
import {
  IncidentActionsSection,
  AttachmentItem,
} from "./IncidentActionsSection";

function getTodayLocalDate(): string {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

export function RecordIncidentClient({
  returnPath = "/admin/incidents",
}: {
  returnPath?: string;
}) {
  const router = useRouter();

  // Form State
  const [title, setTitle] = useState("");
  const [incidentDate, setIncidentDate] = useState<string>(getTodayLocalDate);
  const [incidentTime, setIncidentTime] = useState<string>(() =>
    new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  );
  const [residentId, setResidentId] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [bedNumber, setBedNumber] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [harmLevel, setHarmLevel] = useState("");
  const [severity, setSeverity] = useState<"High" | "Medium" | "Low" | "">("");
  const [actions, setActions] = useState<string[]>([]);
  const [customActionInput, setCustomActionInput] = useState("");
  const [showAddAction, setShowAddAction] = useState(false);
  const [notes, setNotes] = useState("");
  const [initialAssessment, setInitialAssessment] = useState("");
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [previewAttachment, setPreviewAttachment] =
    useState<AttachmentItem | null>(null);
  const imageAttachments = useMemo(
    () => attachments.filter((attachment) => Boolean(attachment.previewUrl)),
    [attachments],
  );
  const previewIndex = previewAttachment
    ? imageAttachments.findIndex(
        (attachment) => attachment.id === previewAttachment.id,
      )
    : -1;

  // Queries & Mutations
  const { data: assignedResidents } = useGetResidentsQuery({
    assignedOnly: true,
  });
  const { data: allResidents } = useGetResidentsQuery({
    all: true,
    includeAll: true,
  });
  const residents = useMemo(() => {
    const isNonDraft = (r: Resident) =>
      !r.isDraft && r.status !== "Draft" && r.status !== "draft" && r.status !== "Discharged";
    const assigned = (assignedResidents ?? []).filter(isNonDraft);
    const assignedIds = new Set(
      assigned.map((resident: Resident) => resident.id),
    );
    const otherResidents = (allResidents ?? []).filter(
      (resident: Resident) => !assignedIds.has(resident.id) && isNonDraft(resident),
    );
    otherResidents.sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));
    return [...assigned, ...otherResidents];
  }, [allResidents, assignedResidents]);

  React.useEffect(() => {
    if (residentId && residents.length > 0) {
      const exists = residents.some((r) => r.id === residentId);
      if (!exists) {
        setResidentId("");
        setRoomNumber("");
        setBedNumber("");
      }
    }
  }, [residentId, residents]);
  const createIncidentMutation = useCreateIncidentMutation();

  // Derive unique rooms and beds from residents for dropdown options
  const roomOptions = useMemo(() => {
    if (!residents) return [];
    const seen = new Set<string>();
    return residents
      .filter((r: Resident) => r.bed?.room?.roomNumber)
      .map((r: Resident) => r.bed!.room!.roomNumber)
      .filter((rn: string) => {
        if (seen.has(rn)) return false;
        seen.add(rn);
        return true;
      })
      .sort();
  }, [residents]);

  const bedOptions = useMemo(() => {
    if (!residents) return [];
    const seen = new Set<string>();
    return residents
      .filter((r: Resident) => r.bed?.number)
      .map((r: Resident) => r.bed!.number as string)
      .filter((bn: string) => {
        if (seen.has(bn)) return false;
        seen.add(bn);
        return true;
      })
      .sort();
  }, [residents]);

  const handleResidentChange = (val: string) => {
    setResidentId(val);
    const selectedResident = residents?.find((r: Resident) => r.id === val);
    if (selectedResident) {
      if (selectedResident.bed?.room?.roomNumber) {
        setRoomNumber(selectedResident.bed.room.roomNumber);
      }
      if (selectedResident.bed?.number) {
        setBedNumber(selectedResident.bed.number);
      }
    }
  };

  const toggleAction = (action: string) => {
    if (actions.includes(action)) {
      setActions(actions.filter((a) => a !== action));
    } else {
      setActions([...actions, action]);
    }
  };

  const handleAddCustomAction = () => {
    if (customActionInput.trim()) {
      if (!actions.includes(customActionInput.trim())) {
        setActions([...actions, customActionInput.trim()]);
      }
      setCustomActionInput("");
      setShowAddAction(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const validFiles: File[] = [];

      Array.from(files).forEach((file) => {
        const isImage = file.type.startsWith("image/");
        const maxLimit = isImage ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
        if (file.size > maxLimit) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds the ${isImage ? "5MB" : "10MB"} limit.`,
            variant: "destructive",
          });
        } else {
          validFiles.push(file);
        }
      });

      if (validFiles.length > 0) {
        const newItems: AttachmentItem[] = validFiles.map((file, idx) => ({
          id: `att-new-${Date.now()}-${idx}`,
          name: file.name,
          timestamp: new Date().toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          type: file.type.includes("pdf") ? "pdf" : "image",
          previewUrl: file.type.includes("image")
            ? URL.createObjectURL(file)
            : undefined,
          file,
        }));
        setAttachments((prev) => [...prev, ...newItems]);
        toast({
          title: "Files Attached",
          description: `${validFiles.length} file(s) attached successfully`,
        });
      }
      e.target.value = "";
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(attachments.filter((a) => a.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Incident Name is required",
      });
      return;
    }

        if (!incidentDate) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Incident Date is required",
      });
      return;
    }

    if (!incidentTime) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Incident Time is required",
      });
      return;
    }

    const incidentDateTime = new Date(
      `${incidentDate}T${incidentTime || "00:00"}:00`,
    );
    if (
      Number.isNaN(incidentDateTime.getTime()) ||
      incidentDateTime > new Date()
    ) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Incident date and time cannot be in the future",
      });
      return;
    }

    if (!category) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select an Incident Category",
      });
      return;
    }

    if (!harmLevel) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select a Harm Level",
      });
      return;
    }

    if (!severity) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select a Severity",
      });
      return;
    }

    try {
      const createdIncident = await createIncidentMutation.mutateAsync({
        title,
        category,
        incidentDate,
        incidentTime,
        residentId: residentId || undefined,
        roomNumber,
        bedNumber,
        location,
        harmLevel,
        severity: severity as "High" | "Medium" | "Low",
        priority: severity as "High" | "Medium" | "Low",
        immediateActions: actions,
        initialAssessment,
        attachments: [],
        notes,
      });

      const uploadedAttachments = await Promise.all(
        attachments
          .filter((attachment) => attachment.file)
          .map(async (attachment) => {
            const formData = new FormData();
            formData.append("file", attachment.file as File);
            const uploaded = await makeAPICall<AttachmentItem>(
              UPLOAD_INCIDENT_ATTACHMENT,
              formData,
              {},
              { id: createdIncident.id },
            );
            return { ...uploaded, timestamp: attachment.timestamp };
          }),
      );
      if (uploadedAttachments.length > 0) {
        await makeAPICall(
          UPDATE_INCIDENT,
          { attachments: uploadedAttachments },
          {},
          { id: createdIncident.id },
        );
      }

      toast({
        title: "Incident Recorded",
        description:
          "The incident has been recorded and submitted successfully.",
      });

      router.push(returnPath);
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description:
          (err as { message?: string })?.message ||
          "Failed to record incident. Please try again.",
      });
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-6 p-6 font-sans pb-16">
      {/* 1. Header Section with Back Navigation */}
      <div className="space-y-3">
        <Link href={returnPath}>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="h-8 gap-1.5 rounded-xl text-slate-600 hover:text-slate-900 px-0 cursor-pointer"
          >
            <ChevronLeft className="size-4" /> Back to Incidents
          </Button>
        </Link>
        <div>
          <Text size="xl" weight="bold" className="tracking-tight">
            Record Incident
          </Text>
          <Text variant="subdued" size="md" weight="regular">
            Record care home incidents, clinical injuries, and immediate actions
            taken for audit and CQC governance.
          </Text>
        </div>
      </div>

      {/* 2. Main Form Card */}
      <Card
        variant="surface"
        className="p-6 lg:p-8 shadow-none bg-surface-card-grey border-none rounded-2xl space-y-6"
      >
        <IncidentDetailsSection
          title={title}
          setTitle={setTitle}
          incidentDate={incidentDate}
          setIncidentDate={setIncidentDate}
          incidentTime={incidentTime}
          setIncidentTime={setIncidentTime}
          residentId={residentId}
          onResidentChange={handleResidentChange}
          roomNumber={roomNumber}
          setRoomNumber={setRoomNumber}
          bedNumber={bedNumber}
          setBedNumber={setBedNumber}
          location={location}
          setLocation={setLocation}
          category={category}
          setCategory={setCategory}
          harmLevel={harmLevel}
          setHarmLevel={setHarmLevel}
          severity={severity}
          setSeverity={setSeverity}
          residents={residents}
          roomOptions={roomOptions}
          bedOptions={bedOptions}
        />

        <div className="border-t border-slate-200/70" />

        <IncidentActionsSection
          actions={actions}
          toggleAction={toggleAction}
          showAddAction={showAddAction}
          setShowAddAction={setShowAddAction}
          customActionInput={customActionInput}
          setCustomActionInput={setCustomActionInput}
          onAddCustomAction={handleAddCustomAction}
          notes={notes}
          setNotes={setNotes}
          initialAssessment={initialAssessment}
          setInitialAssessment={setInitialAssessment}
          attachments={attachments}
          onFileUpload={handleFileUpload}
          onRemoveAttachment={removeAttachment}
          onPreviewImage={setPreviewAttachment}
        />
      </Card>

      <ImagePreviewModal
        open={Boolean(previewAttachment)}
        onOpenChange={(open) => !open && setPreviewAttachment(null)}
        imageUrl={previewAttachment?.previewUrl ?? null}
        title={previewAttachment?.name}
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

      {/* 3. Bottom Action Bar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link href={returnPath}>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl px-5 cursor-pointer"
          >
            Cancel
          </Button>
        </Link>
        <Button
          type="submit"
          variant="primary"
          disabled={createIncidentMutation.isPending}
          className="rounded-xl px-6 text-md font-semibold gap-2 shadow-none"
        >
          <CheckCircle2 className="size-4" />
          <span>
            {createIncidentMutation.isPending ? "Saving..." : "Save Incident"}
          </span>
        </Button>
      </div>
    </form>
  );
}

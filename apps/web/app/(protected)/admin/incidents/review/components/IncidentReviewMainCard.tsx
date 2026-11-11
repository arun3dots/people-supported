"use client";

import React from "react";
import {
  AlertCircle,
  Calendar,
  MapPin,
  CheckCircle2,
  Upload,
  FileText,
  X,
} from "lucide-react";
import { Card } from "@repo/ui/components/ui/Card";
import { Badge } from "@repo/ui/components/ui/Badge";
import { Text } from "@repo/ui/components/ui/Text";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui/Avatar";
import { Incident } from "../../../../../../lib/types/incident";

export interface AttachmentItem {
  id: string;
  name: string;
  timestamp: string;
  type: "image" | "pdf";
  previewUrl?: string;
}

interface IncidentReviewMainCardProps {
  incident: Incident;
  attachments?: AttachmentItem[];
  onUploadAttachment?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAttachment?: (id: string) => void;
  onOpenUploadModal?: () => void;
  onPreviewImage?: (attachment: AttachmentItem) => void;
}

export function IncidentReviewMainCard({
  incident,
  attachments,
  onUploadAttachment,
  onRemoveAttachment,
  onOpenUploadModal,
  onPreviewImage,
}: IncidentReviewMainCardProps) {
  const residentName = incident.resident?.fullName || "Resident";
  const room = incident.roomNumber || incident.resident?.bed?.room?.roomNumber || "—";
  const bed = incident.bedNumber || incident.resident?.bed?.number || "—";
  const actionsTaken = incident.immediateActions || [];
  const activeAttachments = attachments || (incident.attachments as AttachmentItem[]) || [];

  const formattedDate = incident.incidentDate
    ? new Date(incident.incidentDate).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }) + (incident.incidentTime ? `, ${incident.incidentTime}` : "")
    : "—";

  return (
    <Card variant="surface">
      {/* 1. Top Section: 3-column summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-slate-100">
        {/* Incident Summary */}
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0">
            <AlertCircle className="size-5" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <Text size={'md'} weight={'bold'} className="text-slate-900 leading-tight truncate">
              {incident.title}
            </Text>
            <Text size={'md'} weight={'regular'} className="text-slate-500">
              #{incident.incidentNumber}
            </Text>
            <div className="flex items-center gap-1.5 pt-0.5">
              <Text size={'md'} weight={'regular'} className="text-slate-400">
                Reported by:
              </Text>
              <Text size={'md'} weight={'medium'} className="text-slate-700">
                {incident.reportedBy?.fullName || "Staff Member"}
              </Text>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="size-3 text-slate-400" />
              <Text size={'md'} weight={'regular'} className="text-slate-500">
                {formattedDate}
              </Text>
            </div>
          </div>
        </div>

        {/* Resident Summary */}
        <div className="flex items-start gap-3 md:border-l md:border-slate-100 md:pl-4">
          <Avatar className="size-10 shrink-0">
            {incident.resident?.photoUrl && (
              <AvatarImage
                src={incident.resident.photoUrl}
                alt={residentName}
              />
            )}
            <AvatarFallback className="bg-surface-primary-light text-icon-primary font-bold">
              {residentName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-0.5 min-w-0">
            <Text size={'md'} weight={'bold'} className="text-slate-900 truncate">
              {residentName}
            </Text>
            <Text size={'md'} weight={'regular'} className="text-slate-500">
              Resident
            </Text>
            <Text size={'md'} weight={'regular'} className="text-slate-600 pt-0.5">
              Room {room}, Bed {bed}
            </Text>
          </div>
        </div>

        {/* Location Summary */}
        <div className="flex items-start gap-3 md:border-l md:border-slate-100 md:pl-4">
          <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
            <MapPin className="size-5" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <Text size={'md'} weight={'regular'} className="text-slate-500">
              Location
            </Text>
            <Text size={'md'} weight={'bold'} className="text-slate-900 truncate">
              {incident.location || "Bedroom"}
            </Text>
          </div>
        </div>
      </div>

      {/* 2. Meta Grid (Category, Harm-Level, Severity, Status) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-slate-100">
        <div>
          <Text size={'md'} weight={'regular'} className="text-slate-500">
            Category
          </Text>
          <Text size={'md'} weight={'semibold'} className="text-slate-800 pt-0.5">
            {incident.category || "General"}
          </Text>
        </div>
        <div>
          <Text size={'md'} weight={'regular'} className="text-slate-500">
            Harm-Level
          </Text>
          <Badge
            variant="secondary"
            state={
              Number(incident.harmLevel?.match(/\d+/)?.[0] ?? 0) >= 4
                ? "danger"
                : Number(incident.harmLevel?.match(/\d+/)?.[0] ?? 0) >= 2
                  ? "warning"
                  : "success"
            }
          >
            {incident.harmLevel || "None Recorded"}
          </Badge>
        </div>
        <div>
          <Text size={'md'} weight={'regular'} className="text-slate-500">
            Severity
          </Text>
          <Badge
            variant="secondary"
            state={
              incident.severity === "High"
                ? "danger"
                : incident.severity === "Medium"
                  ? "warning"
                  : "success"
            }
          >
            {incident.severity || "Medium"}
          </Badge>
        </div>
        <div>
          <Text size={'md'} weight={'regular'} className="text-slate-500 mb-1">
            Status
          </Text>
          <Badge
            variant="secondary"
            state={
              incident.status === "Closed"
                ? "success"
                : incident.status === "Under Review"
                  ? "warning"
                    : incident.status === "Draft"
                      ? "inactive"
                      : "danger"
            }
          >
            {incident.status}
          </Badge>
        </div>
      </div>

      {/* 3. Initial Assessment & Immediate Actions Taken */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4 border-b border-slate-100">
        {/* Initial Assessment */}
        <div className="space-y-2">
          <Text size={'md'} weight={'bold'} className="text-slate-900">
            Initial Assessment
          </Text>
          {incident.initialAssessment ? (
            <Text size={'md'} weight={'regular'} className="text-slate-600 leading-relaxed">
              {incident.initialAssessment}
            </Text>
          ) : (
            <Text size={'md'} weight={'regular'} className="text-slate-400 italic">
              No assessment notes recorded.
            </Text>
          )}
        </div>

        {/* Immediate Actions Taken */}
        <div className="space-y-2">
          <Text size={'md'} weight={'bold'} className="text-slate-900">
            Immediate Actions Taken
          </Text>
          {actionsTaken.length > 0 ? (
            <div className="space-y-2">
              {actionsTaken.map((action, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <Text size={'md'} weight={'regular'} className="text-slate-700 break-all">
                    {action}
                  </Text>
                </div>
              ))}
            </div>
          ) : (
            <Text size={'md'} weight={'regular'} className="text-slate-400 italic">
              No immediate actions recorded.
            </Text>
          )}
        </div>
      </div>


      {/* 5. Attachments Section */}
      <div className="space-y-3">
        <Text size={'md'} weight={'bold'} className="text-slate-900">
          Attachments ({activeAttachments.length})
        </Text>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {activeAttachments.map((att) => (
            <div
              key={att.id}
              className="group relative border border-slate-200 rounded-xl p-2 flex flex-col items-center bg-white hover:border-emerald-700 transition-colors"
            >
              {onRemoveAttachment && (
                <button
                  type="button"
                  onClick={() => onRemoveAttachment(att.id)}
                  className="absolute top-1.5 right-1.5 size-5 rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                >
                  <X className="size-3" />
                </button>
              )}

              <button
                type="button"
                disabled={!att.previewUrl}
                onClick={() => att.previewUrl && onPreviewImage?.(att)}
                className="size-14 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 mt-1 disabled:cursor-default cursor-pointer"
                aria-label={att.previewUrl ? `Preview ${att.name}` : undefined}
              >
                {att.previewUrl ? (
                  <img
                    src={att.previewUrl}
                    alt={att.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <FileText className="size-7 text-emerald-800" />
                )}
              </button>

              <div className="text-center w-full mt-2">
                <Text size={'md'} weight={'medium'} className="text-slate-800 truncate px-1 block">
                  {att.name}
                </Text>
                <Text size={'md'} weight={'regular'} className="text-slate-400 truncate block">
                  {att.timestamp}
                </Text>
              </div>
            </div>
          ))}

          {/* Upload More Box */}
          {onOpenUploadModal ? (
            <button
              type="button"
              onClick={onOpenUploadModal}
              className="border border-dashed border-emerald-300/80 rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:bg-emerald-50/50 transition-colors min-h-[110px]"
            >
              <div className="size-7 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-800">
                <Upload className="size-3.5" />
              </div>
              <Text size={'md'} weight={'medium'} className="text-slate-700">
                Upload More
              </Text>
              <span className="text-md text-slate-400 text-center">
                PNG, JPG, JPEG · Max 5MB
              </span>
            </button>
          ) : (
            <label className="border border-dashed border-emerald-300/80 rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:bg-emerald-50/50 transition-colors min-h-[110px]">
              <input
                type="file"
                multiple
                className="hidden"
                onChange={onUploadAttachment}
              />
              <div className="size-7 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-800">
                <Upload className="size-3.5" />
              </div>
              <Text size={'md'} weight={'medium'} className="text-slate-700">
                Upload More
              </Text>
              <span className="text-md text-slate-400 text-center">
                PNG, JPG, JPEG · Max 5MB
              </span>
            </label>
          )}
        </div>
      </div>
    </Card>
  );
}

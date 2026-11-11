"use client";

import React from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Badge,
  Card,
  CardContent,
  Separator,
} from "@repo/ui/components/ui";
import {
  Activity,
  Thermometer,
  Heart,
  Waves,
  Wind,
  Brain,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface ObservationDetailModalProps {
  observation: any | null;
  onClose: () => void;
}

export function ObservationDetailModal({
  observation,
  onClose,
}: ObservationDetailModalProps) {
  if (!observation) return null;

  const getScoreBadge = (score: number | null) => {
    if (score === null) return null;
    if (score === 0) {
      return (
        <Badge className="bg-[#4A706A] text-white border-none px-4 py-1 text-md font-semibold rounded-full shadow-xs">
          0 - Normal
        </Badge>
      );
    }
    if (score <= 4) {
      return (
        <Badge className="bg-amber-500 text-white border-none px-4 py-1 text-md font-semibold rounded-full shadow-xs">
          {score} - Low Risk
        </Badge>
      );
    }
    if (score <= 6) {
      return (
        <Badge className="bg-orange-500 text-white border-none px-4 py-1 text-md font-semibold rounded-full shadow-xs">
          {score} - Medium Risk
        </Badge>
      );
    }
    return (
      <Badge className="bg-red-500 text-white border-none px-4 py-1 text-md font-semibold rounded-full shadow-xs">
        {score} - High Risk
      </Badge>
    );
  };

  const ParamItem = ({ icon: Icon, label, value, unit, score }: any) => (
    <div className="flex items-center justify-between p-4 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
      <div className="flex items-center gap-3 min-w-0">
        <div className="size-9 rounded-full bg-slate-50 border border-slate-200 text-[#4A706A] flex items-center justify-center shrink-0">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-md font-normal text-slate-500 truncate">{label}</p>
          <p className="text-md font-bold text-slate-900 truncate">
            {value || "—"}{" "}
            {unit && <span className="text-md font-normal text-slate-500">{unit}</span>}
          </p>
        </div>
      </div>
      {score !== undefined && (
        <div
          className={`size-6 rounded-md flex items-center justify-center font-bold text-md text-white shrink-0 shadow-2xs ${
            score === 0
              ? "bg-[#4A706A]"
              : score === 1
                ? "bg-amber-500"
                : score === 2
                  ? "bg-orange-500"
                  : "bg-red-500"
          }`}
        >
          {score}
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={!!observation} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="lg" className="p-6 bg-surface-card-grey rounded-2xl border border-slate-200/80 shadow-xl max-w-lg sm:max-w-xl font-sans max-h-[85vh] overflow-y-auto space-y-4">
        {/* Header */}
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-white border border-slate-200/80 text-[#4A706A] flex items-center justify-center shrink-0 shadow-2xs">
              <Activity className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-slate-900">
                Observation Details
              </DialogTitle>
              <div className="flex items-center gap-1.5 text-md font-normal text-slate-500 mt-0.5">
                <Clock className="size-3.5 text-slate-400 shrink-0" />
                <span>
                  {format(new Date(observation.timestamp), "MMM d, yyyy · h:mm a")}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Central NEWS2 Score Card */}
        <div className="flex justify-center">
          <div className="text-center p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs w-full space-y-2">
            <p className="text-md font-medium text-slate-500">
              NEWS2 Clinical Score
            </p>
            <div className="py-1">
              {getScoreBadge(observation.news2Score)}
            </div>
            <p className="text-md font-normal text-slate-500 italic">
              {observation.news2Score >= 5
                ? "Urgent clinical response required"
                : "Routine clinical monitoring"}
            </p>
          </div>
        </div>

        {/* Grid of Vitals */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ParamItem
            icon={Thermometer}
            label="Temperature"
            value={observation.temp}
            unit="°C"
          />
          <ParamItem
            icon={Heart}
            label="Pulse Rate"
            value={observation.pulse}
            unit="bpm"
          />
          <ParamItem
            icon={Waves}
            label="Blood Pressure"
            value={observation.bpSystolic}
            unit={`/ ${observation.bpDiastolic || "—"} mmHg`}
          />
          <ParamItem
            icon={Wind}
            label="Respiration"
            value={observation.respiration}
            unit="bpm"
          />
          <ParamItem
            icon={Waves}
            label="Oxygen Saturation"
            value={observation.spo2}
            unit="%"
          />
          <ParamItem
            icon={Brain}
            label="Consciousness"
            value={observation.consciousness}
            unit=""
          />
        </div>

        {/* Oxygen Details */}
        <Card className="border-slate-200/80 bg-white shadow-2xs rounded-xl">
          <CardContent className="p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-md">
              <span className="text-slate-500 flex items-center gap-2">
                <Clock className="size-4 text-slate-400" /> Oxygen Source
              </span>
              <Badge variant="outline" className="font-medium text-slate-800 text-md">
                {observation.airOrOxygen || "Air"}
              </Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-md">
              <span className="text-slate-500 flex items-center gap-2">
                <Activity className="size-4 text-slate-400" /> SpO2 Scale
              </span>
              <Badge variant="outline" className="font-medium text-slate-800 text-md">
                Scale {observation.spo2Scale || 1}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Clinical Outcomes & Actions */}
        <Card className="border-slate-200/80 bg-white shadow-2xs rounded-xl overflow-hidden">
          <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-200/80">
            <h4 className="text-md font-semibold text-slate-800">
              Clinical Outcomes &amp; Actions
            </h4>
          </div>
          <CardContent className="p-4 space-y-3">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`size-6 rounded-full flex items-center justify-center shrink-0 ${
                    observation.isAbnormal ? "bg-red-50 text-red-600" : "bg-[#4A706A]/10 text-[#4A706A]"
                  }`}
                >
                  {observation.isAbnormal ? (
                    <AlertCircle className="size-4" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}
                </div>
                <p className="text-md font-medium text-slate-800">
                  {observation.isAbnormal
                    ? "Abnormal clinical status recorded"
                    : "Clinical status stable"}
                </p>
              </div>

              {observation.notifyGP && (
                <div className="flex items-center gap-2.5 p-3 bg-sky-50 border border-sky-100 rounded-lg text-sky-800">
                  <User className="size-4 shrink-0 text-sky-600" />
                  <span className="text-md font-medium">
                    GP Notification Sent
                  </span>
                </div>
              )}

              {observation.increaseMonitoring && (
                <div className="flex items-center gap-2.5 p-3 bg-purple-50 border border-purple-100 rounded-lg text-purple-800">
                  <Clock className="size-4 shrink-0 text-purple-600" />
                  <span className="text-md font-medium">
                    Escalated Monitoring Frequency
                  </span>
                </div>
              )}
            </div>

            {observation.notes && (
              <div className="mt-3 p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1">
                <p className="text-md font-medium text-amber-800">
                  Clinical Notes
                </p>
                <p className="text-md text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {observation.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

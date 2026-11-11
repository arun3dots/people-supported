"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@repo/ui/components/ui/Dialog";
import { Button } from "@repo/ui/components/ui/Button";
import { Input } from "@repo/ui/components/ui/Input";
import { Label } from "@repo/ui/components/ui/Label";
import { Textarea } from "@repo/ui/components/ui/Textarea";
import { Card } from "@repo/ui/components/ui/Card";
import { Text } from "@repo/ui/components/ui/Text";
import { Badge } from "@repo/ui/components/ui/Badge";
import { toast } from "@repo/ui/components/ui";
import {
  Users,
  Mail,
  Phone,
  Send,
  AlertCircle,
  CheckCircle2,
  User,
  ShieldCheck,
} from "lucide-react";
import { Incident } from "../../../../../../lib/types/incident";
import { useNotifyIncidentNokMutation } from "../../../../../../lib/queries/incidents";

interface NotifyFamilyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incident?: Incident | null;
  onNotificationSent?: () => void;
}

export function NotifyFamilyModal({
  open,
  onOpenChange,
  incident,
  onNotificationSent,
}: NotifyFamilyModalProps) {
  // Extract primary Next of Kin from resident data
  const rawNokList = incident?.resident?.nextOfKin;
  const nokArray = Array.isArray(rawNokList)
    ? rawNokList
    : rawNokList && typeof rawNokList === "object"
      ? [rawNokList]
      : [];

  const primaryNok = nokArray[0] || {};

  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [relationship, setRelationship] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const residentName = incident?.resident?.fullName || "Resident";
  const incidentNumber = incident?.incidentNumber || "INC-RECORD";
  const incidentCategory = incident?.category || "Incident";
  const incidentDate = incident?.incidentDate
    ? new Date(incident.incidentDate).toLocaleDateString("en-GB")
    : new Date().toLocaleDateString("en-GB");

  // Populate default form values when dialog opens or incident changes
  useEffect(() => {
    if (open && incident) {
      const name = primaryNok.name || "Margaret Ashworth";
      const email = primaryNok.email || "family.contact@gmail.com";
      const rel = primaryNok.relation || "Primary Next of Kin";
      const ph = primaryNok.phone || "+44 7123 456789";

      setRecipientName(name);
      setRecipientEmail(email);
      setRelationship(rel);
      setPhone(ph);

      const defaultSubject = `Important Care Notification regarding ${residentName} (${incidentNumber})`;
      setSubject(defaultSubject);

      const defaultMessage = `We are writing to inform you that an incident (${incidentCategory}) occurred involving ${residentName} on ${incidentDate}.\n\nImmediate care protocols and initial medical assessments were provided promptly by our on-duty clinical team. ${residentName} is safe and currently resting comfortably under observation.\n\nPlease contact our care manager directly if you would like to discuss this further.`;
      setMessage(defaultMessage);
    }
  }, [
    open,
    incident,
    primaryNok.name,
    primaryNok.email,
    primaryNok.relation,
    primaryNok.phone,
    residentName,
    incidentNumber,
    incidentCategory,
    incidentDate,
  ]);

  const notifyMutation = useNotifyIncidentNokMutation(incident?.id || "");

  const handleSendNotification = async () => {
    if (!recipientEmail || !recipientEmail.includes("@")) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter a valid recipient email address.",
      });
      return;
    }

    if (!recipientName.trim()) {
      toast({
        variant: "destructive",
        title: "Recipient Name Required",
        description: "Please enter the Next of Kin's name.",
      });
      return;
    }

    if (!message.trim()) {
      toast({
        variant: "destructive",
        title: "Message Required",
        description: "Please enter the notification message body.",
      });
      return;
    }

    try {
      await notifyMutation.mutateAsync({
        recipientEmail: recipientEmail.trim(),
        recipientName: recipientName.trim(),
        relationship: relationship.trim(),
        phone: phone.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });

      toast({
        title: "Family Notified Successfully",
        description: `Notification email dispatched to ${recipientName} (${recipientEmail}). Compliance checklist updated.`,
      });

      onNotificationSent?.();
      onOpenChange(false);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Notification Failed",
        description:
          err?.message ||
          "Failed to dispatch email. Please check internet connection.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="2xl">
        <DialogHeader className="text-left space-y-1 pb-4 border-b border-border-secondary">
          <div className="flex items-center gap-2 text-surface-primary">
            <div className="size-8 rounded-lg bg-surface-primary-light flex items-center justify-center text-surface-primary">
              <Users className="size-4" />
            </div>
            <DialogTitle className="text-lg font-bold text-text-body">
              Notify Next of Kin / Family
            </DialogTitle>
          </div>
          <DialogDescription className="text-md text-text-description">
            Confirm Next of Kin contact details and send an official incident
            notification email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2 pr-1">
          {/* 1. Next of Kin Identity Card */}
          <Card variant="surface" className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Text
                variant="base-medium"
                className="text-text-body text-md font-bold flex items-center gap-2"
              >
                <User className="size-3.5 text-icon-primary" />
                Next of Kin Details
              </Text>
              <Badge
                variant="secondary"
                state="info"
                className="px-2.5 py-0.5 shadow-none"
              >
                Primary Contact
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>
                  Contact Name
                </Label>
                <Input
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Margaret Ashworth"
                  className="h-9"
                />
              </div>

              <div className="space-y-1">
                <Label>
                  Relationship
                </Label>
                <Input
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  placeholder="e.g. Daughter / Primary Carer"
                  className="h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-md font-semibold text-text-body flex items-center gap-1">
                  <Mail className="size-3 text-text-description" />
                  Email Address
                </Label>
                <Input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-md font-semibold text-text-body flex items-center gap-1">
                  <Phone className="size-3 text-text-description" />
                  Telephone Number
                </Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+44 7123 456789"
                  className="h-9"
                />
              </div>
            </div>
          </Card>

          {/* 2. Incident Summary Context Banner */}
          <div className="p-3 bg-surface-neutral border border-border-secondary rounded-xl flex items-center justify-between text-md">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-icon-primary shrink-0" />
              <div>
                <span className="font-bold text-text-body">
                  {incidentNumber}
                </span>
                <span className="text-text-description ml-2">
                  {residentName} • {incidentCategory} ({incidentDate})
                </span>
              </div>
            </div>
            <Badge
              variant="secondary"
              state={incident?.severity === "High" ? "danger" : "warning"}
              className="px-2.5 py-0.5 shadow-none"
            >
              {incident?.severity || "Medium"} Severity
            </Badge>
          </div>

          {/* 3. Email Subject & Body Composition */}
          <Card variant="surface" className="p-4 space-y-3">
            <div className="space-y-1">
              <Label>
                Email Subject
              </Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email Subject"
                className="h-9 text-md"
              />
            </div>

            <div className="space-y-1">
              <Label>
                Email Message Body
              </Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="text-md leading-relaxed"
                placeholder="Write message to family member..."
              />
            </div>
          </Card>

          {/* 4. Statutory Compliance Notice */}
          <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-md text-emerald-900 flex items-center gap-2 font-medium">
            <CheckCircle2 className="size-4 text-emerald-700 shrink-0" />
            <span>
              Sending this notification automatically logs &quot;Family
              Notified&quot; in the CQC Compliance Checklist with a timestamp.
            </span>
          </div>
        </div>

        <DialogFooter className="pt-4 border-t border-border-secondary flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl h-10 px-4 text-md font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={notifyMutation.isPending}
            onClick={handleSendNotification}
            className="rounded-xl h-10 px-5 text-md font-bold gap-1.5"
          >
            {notifyMutation.isPending ? (
              "Sending Email..."
            ) : (
              <>
                <Send className="size-3.5" />
                Send Notification Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

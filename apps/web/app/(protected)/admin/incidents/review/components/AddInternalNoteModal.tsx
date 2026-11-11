"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../../../../../../lib/context/AuthContext";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/Select";
import { toast } from "@repo/ui/components/ui";
import { FileText, Plus, ShieldAlert } from "lucide-react";

export type NoteCategory =
  | "General"
  | "Medical"
  | "Behavioral"
  | "Family"
  | "Follow-up"
  | "Safeguarding";

const STAFF_ROLES = [
  "SuperAdmin",
  "Admin",
  "Manager",
  "Nurse",
  "Carer",
  "Resident",
] as const;
type StaffRole = (typeof STAFF_ROLES)[number];

export interface InternalNote {
  id: string;
  author: string;
  role: string;
  date: string;
  time: string;
  category: NoteCategory;
  content: string;
}

interface AddInternalNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddNote: (note: InternalNote) => void;
  isSaving?: boolean;
}

export function AddInternalNoteModal({
  open,
  onOpenChange,
  onAddNote,
  isSaving = false,
}: AddInternalNoteModalProps) {
  const { user } = useAuth();
  const [author, setAuthor] = useState("");
  const [role, setRole] = useState<StaffRole>("Carer");
  const [category, setCategory] = useState<NoteCategory>("General");
  const [content, setContent] = useState("");

  useEffect(() => {
    const authenticatedRole = user?.roleName;
    if (authenticatedRole && STAFF_ROLES.includes(authenticatedRole as StaffRole)) {
      setRole(authenticatedRole as StaffRole);
    }
    if (user?.fullName && !author) {
      setAuthor(user.fullName);
    }
  }, [author, user]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!author.trim()) {
      toast({
        variant: "destructive",
        title: "Author Required",
        description: "Please enter the author name.",
      });
      return;
    }

    if (!role.trim()) {
      toast({
        variant: "destructive",
        title: "Role Required",
        description: "Please enter the staff role.",
      });
      return;
    }

    if (!content.trim()) {
      toast({
        variant: "destructive",
        title: "Content Required",
        description: "Please enter the note content before saving.",
      });
      return;
    }

    const today = new Date();
    const newNote: InternalNote = {
      id: `note-${Date.now()}`,
      author: author.trim() || "Staff Member",
      role: role.trim() || "Care Staff",
      date: today.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      time: today.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      category,
      content: content.trim(),
    };

    onAddNote(newNote);
    setContent("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader className="text-left space-y-1 pb-4 border-b border-border-secondary">
          <div className="flex items-center gap-2 text-surface-primary">
            <div className="size-8 rounded-lg bg-surface-primary-light flex items-center justify-center text-surface-primary">
              <FileText className="size-4" />
            </div>
            <DialogTitle className="text-lg font-bold text-text-body">
              Add Internal Care Note
            </DialogTitle>
          </div>
          <DialogDescription className="text-md text-text-description">
            Record confidential internal observations, follow-up notes, or management reviews.
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit} className="space-y-4 my-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label required>Author Name</Label>
              <Input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. Elizabeth Davies"
                className="h-9 text-md"
              />
            </div>

            <div className="space-y-1.5">
              <Label required>
                Staff Role
              </Label>
              <Select value={role} onValueChange={(value) => setRole(value as StaffRole)}>
                <SelectTrigger className="h-9 text-md w-full" disabled>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {STAFF_ROLES.map((staffRole) => (
                    <SelectItem key={staffRole} value={staffRole}>
                      {staffRole}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label required>
              Note Category
            </Label>
            <Select value={category} onValueChange={(val: NoteCategory) => setCategory(val)}>
              <SelectTrigger className="h-9 text-md w-full">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="General">General Care Note</SelectItem>
                <SelectItem value="Medical">Medical & Clinical Observation</SelectItem>
                <SelectItem value="Behavioral">Behavioural & Mood Note</SelectItem>
                <SelectItem value="Family">Family Communication Note</SelectItem>
                <SelectItem value="Follow-up">Post-Incident Follow-up</SelectItem>
                <SelectItem value="Safeguarding">Safeguarding Note</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label required>
              Note Details
            </Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Record detailed notes, direct quotes, and observations..."
              rows={4}
              className="text-md leading-relaxed"
            />
          </div>

          <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-md text-amber-900 flex items-center gap-2">
            <ShieldAlert className="size-4 text-amber-700 shrink-0" />
            <span>
              Internal notes are encrypted and restricted to authorised care team members.
            </span>
          </div>

          <DialogFooter className="pt-3 border-t border-border-secondary flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl h-10 px-4 text-md font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSaving}
              className="rounded-xl h-10 px-5 text-md font-bold gap-1.5"
            >
              <Plus className="size-3.5" />
              {isSaving ? "Saving Note..." : "Save Internal Note"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

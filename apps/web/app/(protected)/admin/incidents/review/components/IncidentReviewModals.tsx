"use client";

import React from "react";
import { InvestigationModal, InvestigationStep } from "./InvestigationModal";
import { AssignTaskModal, IncidentTask } from "./AssignTaskModal";
import { UploadDocumentModal } from "./UploadDocumentModal";
import { NotifyFamilyModal } from "./NotifyFamilyModal";
import { AddInternalNoteModal, InternalNote } from "./AddInternalNoteModal";
import { Incident } from "../../../../../../lib/types/incident";

interface IncidentReviewModalsProps {
  investigationModalOpen: boolean;
  setInvestigationModalOpen: (open: boolean) => void;
  investigationSteps: InvestigationStep[];
  onSaveStep: (stepId: string, notes: string) => void;
  onCompleteInvestigation: () => void;
  onOpenAssignTask: () => void;
  assignTaskModalOpen: boolean;
  setAssignTaskModalOpen: (open: boolean) => void;
  incident?: Incident | null;
  onTaskCreated: (task: IncidentTask) => void;
  returnToInvestigationAfterTask?: boolean;
  uploadModalOpen: boolean;
  setUploadModalOpen: (open: boolean) => void;
  onUploadFiles: (files: File[]) => void;
  notifyFamilyModalOpen: boolean;
  setNotifyFamilyModalOpen: (open: boolean) => void;
  onFamilyNotificationSent: () => void;
  addNoteModalOpen: boolean;
  setAddNoteModalOpen: (open: boolean) => void;
  onAddInternalNote: (note: InternalNote) => void;
  isSavingNote?: boolean;
}

export function IncidentReviewModals({
  investigationModalOpen,
  setInvestigationModalOpen,
  investigationSteps,
  onSaveStep,
  onCompleteInvestigation,
  onOpenAssignTask,
  assignTaskModalOpen,
  setAssignTaskModalOpen,
  incident,
  onTaskCreated,
  returnToInvestigationAfterTask = false,
  uploadModalOpen,
  setUploadModalOpen,
  onUploadFiles,
  notifyFamilyModalOpen,
  setNotifyFamilyModalOpen,
  onFamilyNotificationSent,
  addNoteModalOpen,
  setAddNoteModalOpen,
  onAddInternalNote,
  isSavingNote,
}: IncidentReviewModalsProps) {
  return (
    <>
      {/* 1. Start Investigation Modal Dialog */}
      <InvestigationModal
        open={investigationModalOpen}
        onOpenChange={setInvestigationModalOpen}
        investigationSteps={investigationSteps}
        onSaveStep={onSaveStep}
        onComplete={onCompleteInvestigation}
        onOpenAssignTask={onOpenAssignTask}
        description="Complete the key steps below to investigate this incident."
      />

      {/* 2. Assign Task Modal Dialog */}
      <AssignTaskModal
        open={assignTaskModalOpen}
        onOpenChange={(isOpen) => {
          setAssignTaskModalOpen(isOpen);
          if (!isOpen && returnToInvestigationAfterTask) {
            setInvestigationModalOpen(true);
          }
        }}
        incident={incident || ({} as Incident)}
        onTaskCreated={(task) => {
          onTaskCreated(task);
        }}
      />

      {/* 3. Upload Document Modal Dialog */}
      <UploadDocumentModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onUploadSuccess={onUploadFiles}
      />

      {/* 4. Notify Family / Next of Kin Modal Dialog */}
      <NotifyFamilyModal
        open={notifyFamilyModalOpen}
        onOpenChange={setNotifyFamilyModalOpen}
        incident={incident}
        onNotificationSent={onFamilyNotificationSent}
      />

      {/* 5. Add Internal Note Modal Dialog */}
      <AddInternalNoteModal
        open={addNoteModalOpen}
        onOpenChange={setAddNoteModalOpen}
        onAddNote={onAddInternalNote}
        isSaving={isSavingNote}
      />
    </>
  );
}

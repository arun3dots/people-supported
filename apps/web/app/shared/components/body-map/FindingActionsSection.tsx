"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import {
  Activity,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  User as UserIcon,
  Clock,
} from "lucide-react";
import {
  Button,
  Textarea,
  Label,
  Text,
  Badge,
} from "@repo/ui/components/ui";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/ui/Tooltip";
import { DeleteConfirmDialog } from "../../../../lib/components/shared/DeleteConfirmDialog";
import {
  useCreateFindingActionMutation,
  useUpdateFindingActionMutation,
  useDeleteFindingActionMutation,
} from "../../../../lib/queries/body-map";

export interface FindingActionItem {
  id: string;
  findingId: string;
  description: string;
  createdById: string;
  createdByName?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface FindingActionsSectionProps {
  findingId: string;
  residentId: string;
  isResolved: boolean;
  actions: FindingActionItem[];
  showAddForm?: boolean;
  onOpenAddForm?: () => void;
  onCloseAddForm?: () => void;
}

export function FindingActionsSection({
  findingId,
  residentId,
  isResolved,
  actions = [],
  showAddForm,
  onOpenAddForm,
  onCloseAddForm,
}: FindingActionsSectionProps) {
  const [internalShowAddForm, setInternalShowAddForm] = useState(false);
  const isFormOpen = showAddForm !== undefined ? showAddForm : internalShowAddForm;
  const openForm = onOpenAddForm ?? (() => setInternalShowAddForm(true));
  const closeForm = onCloseAddForm ?? (() => setInternalShowAddForm(false));

  const [newDescription, setNewDescription] = useState("");
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [actionToDelete, setActionToDelete] = useState<FindingActionItem | null>(null);

  const createMutation = useCreateFindingActionMutation(residentId);
  const updateMutation = useUpdateFindingActionMutation(residentId);
  const deleteMutation = useDeleteFindingActionMutation(residentId);

  const handleSaveNewAction = async () => {
    const trimmed = newDescription.trim();
    if (!trimmed) return;
    await createMutation.mutateAsync({
      findingId,
      dto: { description: trimmed },
    });
    setNewDescription("");
    closeForm();
  };

  const handleStartEdit = (action: FindingActionItem) => {
    setEditingActionId(action.id);
    setEditDescription(action.description);
  };

  const handleSaveEdit = async (actionId: string) => {
    const trimmed = editDescription.trim();
    if (!trimmed) return;
    await updateMutation.mutateAsync({
      findingId,
      actionId,
      dto: { description: trimmed },
    });
    setEditingActionId(null);
    setEditDescription("");
  };

  const handleConfirmDelete = async () => {
    if (!actionToDelete) return;
    await deleteMutation.mutateAsync({
      findingId,
      actionId: actionToDelete.id,
    });
    setActionToDelete(null);
  };

  return (
    <div className="space-y-3 pt-2 border-t border-slate-200/80">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-emerald-700" />
          <Text size="sm" weight="semibold" className="text-slate-800">
            Action History ({actions.length})
          </Text>
          {isResolved && (
            <Badge variant="secondary" state="inactive" className="text-[10px] py-0 px-1.5">
              Read-only
            </Badge>
          )}
        </div>
        {!isResolved && !isFormOpen && (
          <Button
            size="sm"
            variant="outline"
            onClick={openForm}
            className="h-7 text-sm gap-1 text-emerald-800 border-emerald-300 hover:bg-emerald-50"
          >
            <Plus className="size-3.5" />
            Action Taken
          </Button>
        )}
      </div>

      {/* Add Action Form */}
      {!isResolved && isFormOpen && (
        <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/90 space-y-2.5">
          <Label className="text-sm font-semibold text-emerald-950">
            Record Action Taken
          </Label>
          <Textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Describe the action taken (e.g. Cleansed wound with saline and applied sterile dressing)..."
            rows={2}
            className="text-sm bg-white resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setNewDescription("");
                closeForm();
              }}
              disabled={createMutation.isPending}
              className="h-7 text-sm"
            >
              <X className="size-3.5 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveNewAction}
              disabled={!newDescription.trim() || createMutation.isPending}
              className="h-7 text-sm bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              <Check className="size-3.5 mr-1" />
              {createMutation.isPending ? "Saving..." : "Save Action"}
            </Button>
          </div>
        </div>
      )}

      {/* Action List */}
      {actions.length === 0 ? (
        <p className="text-sm text-slate-400 italic py-1">
          No actions recorded yet for this finding.
        </p>
      ) : (
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {actions.map((act) => {
            const isEditing = editingActionId === act.id;
            return (
              <div
                key={act.id}
                className="p-3 rounded-lg border border-slate-200/80 bg-slate-50 hover:bg-white transition-colors space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <UserIcon className="size-3 text-slate-400" />
                      {act.createdByName || "Staff Member"}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock className="size-3 text-slate-400" />
                      {format(new Date(act.createdAt), "dd MMM yyyy, HH:mm")}
                    </span>
                  </div>

                  {/* Edit and Delete Actions - Only when finding is active */}
                  {!isResolved && !isEditing && (
                    <div className="flex items-center gap-0.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStartEdit(act)}
                            aria-label="Edit action"
                            className="size-7 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md"
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent
                          sideOffset={4}
                          className="bg-white border border-slate-200/80 text-slate-800 rounded-lg px-2.5 py-1 text-sm font-medium shadow-md"
                        >
                          Edit Action
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setActionToDelete(act)}
                            aria-label="Delete action"
                            className="size-7 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent
                          sideOffset={4}
                          className="bg-white border border-slate-200/80 text-slate-800 rounded-lg px-2.5 py-1 text-sm font-medium shadow-md"
                        >
                          Delete Action
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-2 pt-1">
                    <Textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={2}
                      className="text-sm bg-white resize-none"
                    />
                    <div className="flex justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingActionId(null);
                          setEditDescription("");
                        }}
                        disabled={updateMutation.isPending}
                        className="h-6 text-sm px-2"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(act.id)}
                        disabled={!editDescription.trim() || updateMutation.isPending}
                        className="h-6 text-sm px-2 bg-emerald-700 hover:bg-emerald-800 text-white"
                      >
                        {updateMutation.isPending ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {act.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmDialog
        isOpen={Boolean(actionToDelete)}
        onOpenChange={(open) => !open && setActionToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Action"
        description="Are you sure you want to permanently delete this action from the finding history? This cannot be undone."
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}

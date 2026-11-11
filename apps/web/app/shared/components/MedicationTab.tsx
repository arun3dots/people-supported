"use client";

import React, { useState } from "react";
import {
  Pill,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Plus,
  Edit2,
  Trash2,
  MoreVertical,
  Activity,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Textarea,
  Label,
  Input,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Switch,
  Checkbox,
  DatePicker,
  DateTimePicker,
} from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import { format } from "date-fns";
import {
  useGetResidentMedicationRoundsQuery,
  useAdministerMedicationMutation,
  useCreateMedicationRoundMutation,
  useCreateMedicationRoundBulkMutation,
  useUpdateMedicationRoundMutation,
  useDeleteMedicationRoundMutation,
  useAdministerAdHocMedicationMutation,
} from "../../../lib/queries/residents";

import { useAuth } from "../../../lib/context/AuthContext";

interface MedicationTabProps {
  residentId: string;
  selectedDate?: Date;
  residentStatus?: string;
}

export function MedicationTab({
  residentId,
  selectedDate,
  residentStatus,
}: MedicationTabProps) {
  const { user } = useAuth();
  const isCarer = user?.roleName?.toLowerCase() === "carer";
  const canManagePrescriptions = !isCarer && residentStatus !== "Discharged";

  const { data: allRounds, isLoading } =
    useGetResidentMedicationRoundsQuery(residentId);

  const rounds = React.useMemo(() => {
    if (!allRounds) return [];
    if (!selectedDate) return allRounds;

    return allRounds.filter(
      (round: any) =>
        new Date(round.scheduledTime).toDateString() ===
        selectedDate.toDateString(),
    );
  }, [allRounds, selectedDate]);
  const administerMutation = useAdministerMedicationMutation();
  const createMutation = useCreateMedicationRoundMutation();
  const createBulkMutation = useCreateMedicationRoundBulkMutation();
  const updateMutation = useUpdateMedicationRoundMutation();
  const deleteMutation = useDeleteMedicationRoundMutation();
  const adhocMutation = useAdministerAdHocMedicationMutation();

  // Administration Modal State
  const [selectedRound, setSelectedRound] = useState<any>(null);
  const [actionType, setActionType] = useState<
    "Given" | "Refused" | "Not Available" | null
  >(null);
  const [remark, setRemark] = useState("");
  const [vitals, setVitals] = useState<any>({
    bpSystolic: "",
    bpDiastolic: "",
    bloodSugar: "",
    pulse: "",
    temp: "",
    respiration: "",
    spo2: "",
  });
  const [isAdministerModalOpen, setIsAdministerModalOpen] = useState(false);

  // AdHoc Modal State
  const [isAdhocModalOpen, setIsAdhocModalOpen] = useState(false);
  const [adhocFormData, setAdhocFormData] = useState({
    drugName: "",
    dose: "",
    form: "",
    status: "Given",
    reason: "",
  });

  // CRUD Modal State
  const [isCRUDModalOpen, setIsCRUDModalOpen] = useState(false);
  const [crudMode, setCrudMode] = useState<"Add" | "Edit">("Add");
  const [roundToEdit, setRoundToEdit] = useState<any>(null);
  const [formData, setFormData] = useState({
    drugName: "",
    dose: "",
    form: "",
    scheduledTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    isBulk: false,
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
    times: ["08:00"],
    allowLateAdministration: false,
    mandatoryObservations: [] as string[],
  });

  // Delete State
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletionReason, setDeletionReason] = useState("");
  const [roundToDelete, setRoundToDelete] = useState<any>(null);

  // Vitals View State
  const [viewObservation, setViewObservation] = useState<any>(null);

  const handleActionClick = (
    round: any,
    type: "Given" | "Refused" | "Not Available",
  ) => {
    setSelectedRound(round);
    setActionType(type);
    setRemark("");
    setVitals({
      bpSystolic: "",
      bpDiastolic: "",
      bloodSugar: "",
      pulse: "",
      temp: "",
      respiration: "",
      spo2: "",
    });
    setIsAdministerModalOpen(true);
  };

  const handleAdministerConfirm = () => {
    if (!selectedRound || !actionType) return;

    administerMutation.mutate(
      {
        roundId: selectedRound.id,
        status: actionType,
        reason: remark,
        residentId,
        vitals: actionType === "Given" ? vitals : undefined,
      },
      {
        onSuccess: () => {
          setIsAdministerModalOpen(false);
          setSelectedRound(null);
          setActionType(null);
          setRemark("");
        },
      },
    );
  };

  const handleOpenAdd = () => {
    setCrudMode("Add");
    setFormData({
      drugName: "",
      dose: "",
      form: "",
      scheduledTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      isBulk: false,
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
      times: ["08:00"],
      allowLateAdministration: false,
      mandatoryObservations: [],
    });
    setIsCRUDModalOpen(true);
  };

  const handleOpenEdit = (round: any) => {
    setCrudMode("Edit");
    setRoundToEdit(round);
    setFormData({
      drugName: round.drugName,
      dose: round.dose,
      form: round.form,
      scheduledTime: format(
        new Date(round.scheduledTime),
        "yyyy-MM-dd'T'HH:mm",
      ),
      isBulk: false,
      startDate: format(new Date(round.scheduledTime), "yyyy-MM-dd"),
      endDate: format(new Date(round.scheduledTime), "yyyy-MM-dd"),
      times: [format(new Date(round.scheduledTime), "HH:mm")],
      allowLateAdministration: round.allowLateAdministration || false,
      mandatoryObservations: round.mandatoryObservations || [],
    });
    setIsCRUDModalOpen(true);
  };

  const handleCRUDSubmit = () => {
    if (crudMode === "Add" && formData.isBulk) {
      createBulkMutation.mutate(
        {
          residentId,
          data: {
            drugName: formData.drugName,
            dose: formData.dose,
            form: formData.form,
            startDate: formData.startDate,
            endDate: formData.endDate,
            times: formData.times,
            allowLateAdministration: formData.allowLateAdministration,
            mandatoryObservations: formData.mandatoryObservations,
          },
        },
        {
          onSuccess: () => setIsCRUDModalOpen(false),
        },
      );
      return;
    }

    const payload = {
      drugName: formData.drugName,
      dose: formData.dose,
      form: formData.form,
      scheduledTime: new Date(formData.scheduledTime).toISOString(),
      allowLateAdministration: formData.allowLateAdministration,
      mandatoryObservations: formData.mandatoryObservations,
    };

    if (crudMode === "Add") {
      createMutation.mutate(
        { residentId, data: payload },
        {
          onSuccess: () => setIsCRUDModalOpen(false),
        },
      );
    } else {
      updateMutation.mutate(
        { roundId: roundToEdit.id, residentId, data: payload },
        {
          onSuccess: () => setIsCRUDModalOpen(false),
        },
      );
    }
  };

  const handleDeleteClick = (round: any) => {
    setRoundToDelete(round);
    setDeletionReason("");
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!roundToDelete) return;
    if (!deletionReason.trim()) return;
    deleteMutation.mutate(
      { roundId: roundToDelete.id, residentId, reason: deletionReason.trim() },
      {
        onSuccess: () => setIsDeleteConfirmOpen(false),
      },
    );
  };

  const addTimeSlot = () => {
    setFormData((prev) => ({
      ...prev,
      times: [...prev.times, "12:00"],
    }));
  };

  const removeTimeSlot = (index: number) => {
    if (formData.times.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      times: prev.times.filter((_, i) => i !== index),
    }));
  };

  const updateTimeSlot = (index: number, val: string) => {
    const newTimes = [...formData.times];
    newTimes[index] = val;
    setFormData((prev) => ({ ...prev, times: newTimes }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-md border-border overflow-hidden">
        <CardHeader className="bg-muted/10 border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Pill className="w-5 h-5 text-primary" />
              MAR (Medication Administration Record)
            </CardTitle>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="font-medium bg-white">
                Today, {format(new Date(), "MMM d, yyyy")}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAdhocModalOpen(true)}
                className="gap-2 rounded-xl text-yellow-600 border-yellow-200 bg-yellow-50 hover:bg-yellow-100"
              >
                <Plus className="w-4 h-4" /> Record Unlisted
              </Button>
              {canManagePrescriptions && (
                <Button
                  size="sm"
                  onClick={handleOpenAdd}
                  className="gap-2 rounded-xl"
                >
                  <Plus className="w-4 h-4" /> Add MAR Entry
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {rounds && rounds.length > 0 ? (
              rounds.map((round: any) => {
                const isLate = new Date(round.scheduledTime) < new Date();
                const cannotAdminister =
                  isLate &&
                  !round.allowLateAdministration &&
                  round.status !== "Administered";

                return (
                  <div
                    key={round.id}
                    className={cn(
                      "p-6 hover:bg-muted/5 transition-colors group border-l-4 border-transparent",
                      cannotAdminister &&
                      "bg-red-50/50 border-red-500 hover:bg-red-50",
                    )}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-2 flex-1">
                        {cannotAdminister && (
                          <div className="flex items-center gap-2 text-red-600 text-md font-bold uppercase tracking-wider mb-2">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Late administration not permitted
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-lg text-foreground">
                            Drug: {round.drugName}
                          </h4>
                          {round.isAdhoc ? (
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]"
                            >
                              Ad-hoc / Unlisted
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px]"
                            >
                              Care Plan Scheduled
                            </Badge>
                          )}
                          {round.status === "Administered" && (
                            <Badge
                              variant="default"
                              className="bg-green-500 hover:bg-green-600 text-white border-none text-[10px]"
                            >
                              Completed
                            </Badge>
                          )}

                          {canManagePrescriptions && (
                            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                onClick={() => handleOpenEdit(round)}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteClick(round)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                        {!cannotAdminister ? (
                          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-md">
                            <p className="text-muted-foreground">
                              <span className="font-semibold text-foreground/80">
                                Dose:
                              </span>{" "}
                              {round.dose}
                            </p>
                            <p className="text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span className="font-semibold text-foreground/80">
                                Time:
                              </span>{" "}
                              {format(new Date(round.scheduledTime), "HH:mm")}
                            </p>
                            <p className="text-muted-foreground col-span-2">
                              <span className="font-semibold text-foreground/80">
                                Form:
                              </span>{" "}
                              {round.form}
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <p className="text-muted-foreground flex items-center gap-1 text-md">
                              <Clock className="w-3.5 h-3.5" />
                              <span className="font-semibold text-foreground/80">
                                Scheduled:
                              </span>{" "}
                              {format(new Date(round.scheduledTime), "HH:mm")}
                            </p>
                            <p className="text-md text-destructive font-medium italic">
                              Dosage details hidden for safety - contact nurse
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "bg-purple-100 hover:bg-purple-200 text-purple-700 border-purple-200 rounded-xl px-6 h-10 font-medium",
                            cannotAdminister && "opacity-50 cursor-not-allowed",
                          )}
                          onClick={() => handleActionClick(round, "Given")}
                          disabled={
                            round.status === "Administered" || cannotAdminister
                          }
                        >
                          Given
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "bg-purple-100 hover:bg-purple-200 text-purple-700 border-purple-200 rounded-xl px-6 h-10 font-medium",
                            cannotAdminister && "opacity-50 cursor-not-allowed",
                          )}
                          onClick={() => handleActionClick(round, "Refused")}
                          disabled={
                            round.status === "Administered" || cannotAdminister
                          }
                        >
                          Refused
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "bg-purple-100 hover:bg-purple-200 text-purple-700 border-purple-200 rounded-xl px-6 h-10 font-medium",
                            cannotAdminister && "opacity-50 cursor-not-allowed",
                          )}
                          onClick={() =>
                            handleActionClick(round, "Not Available")
                          }
                          disabled={
                            round.status === "Administered" || cannotAdminister
                          }
                        >
                          Not Available
                        </Button>
                        {round.administrations?.[0]?.observation && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="rounded-xl px-6 h-10 font-medium"
                            onClick={() =>
                              setViewObservation(round.administrations[0].observation)
                            }
                          >
                            <Activity className="w-4 h-4 mr-2" /> View Vitals
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Pill className="w-12 h-12 mb-3 opacity-20" />
                <p className="font-medium text-lg">
                  No MAR records scheduled for today
                </p>
                <p className="text-md">
                  MAR records will appear here when scheduled.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Administration Modal */}
      <Dialog
        open={isAdministerModalOpen}
        onOpenChange={setIsAdministerModalOpen}
      >
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              {actionType === "Given" && (
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              )}
              {actionType === "Refused" && (
                <XCircle className="w-6 h-6 text-red-500" />
              )}
              {actionType === "Not Available" && (
                <AlertCircle className="w-6 h-6 text-yellow-500" />
              )}
              Confirm {actionType}
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              Are you sure you want to mark{" "}
              <strong>{selectedRound?.drugName}</strong> as{" "}
              <strong>{actionType}</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            {actionType === "Given" &&
              selectedRound?.mandatoryObservations?.length > 0 && (
                <div className="mb-4 space-y-3 border p-3 rounded-lg bg-muted/20">
                  <h4 className="font-semibold text-md">Required Vitals</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedRound.mandatoryObservations.includes("BP") && (
                      <>
                        <div className="space-y-1">
                          <Label>Systolic BP</Label>
                          <Input
                            placeholder="mmHg"
                            type="number"
                            value={vitals.bpSystolic}
                            onChange={(e) =>
                              setVitals({ ...vitals, bpSystolic: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Diastolic BP</Label>
                          <Input
                            placeholder="mmHg"
                            type="number"
                            value={vitals.bpDiastolic}
                            onChange={(e) =>
                              setVitals({ ...vitals, bpDiastolic: e.target.value })
                            }
                          />
                        </div>
                      </>
                    )}
                    {selectedRound.mandatoryObservations.includes("Pulse") && (
                      <div className="space-y-1">
                        <Label>Pulse (bpm)</Label>
                        <Input
                          placeholder="bpm"
                          type="number"
                          value={vitals.pulse}
                          onChange={(e) =>
                            setVitals({ ...vitals, pulse: e.target.value })
                          }
                        />
                      </div>
                    )}
                    {selectedRound.mandatoryObservations.includes("Temp") && (
                      <div className="space-y-1">
                        <Label>Temp (°C)</Label>
                        <Input
                          placeholder="°C"
                          type="number"
                          step="0.1"
                          value={vitals.temp}
                          onChange={(e) =>
                            setVitals({ ...vitals, temp: e.target.value })
                          }
                        />
                      </div>
                    )}
                    {selectedRound.mandatoryObservations.includes(
                      "Blood Sugar",
                    ) && (
                        <div className="space-y-1">
                          <Label>Blood Sugar (mmol/L)</Label>
                          <Input
                            placeholder="mmol/L"
                            type="number"
                            step="0.1"
                            value={vitals.bloodSugar}
                            onChange={(e) =>
                              setVitals({ ...vitals, bloodSugar: e.target.value })
                            }
                          />
                        </div>
                      )}
                  </div>
                </div>
              )}
            <Label
              htmlFor="remark"
            >
              {actionType === "Given"
                ? "Remarks (Optional)"
                : "Reason/Review (Required)"}
            </Label>
            <Textarea
              id="remark"
              placeholder={
                actionType === "Given"
                  ? "Add any notes..."
                  : "Please provide a reason for refusal or unavailability..."
              }
              className="min-h-[120px] rounded-xl border-border focus:ring-primary/20"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
            />
          </div>

          <DialogFooter className="gap-3 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setIsAdministerModalOpen(false)}
              className="rounded-xl font-medium"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdministerConfirm}
              disabled={
                administerMutation.isPending ||
                (actionType !== "Given" && !remark.trim())
              }
              className="rounded-xl font-semibold px-8"
            >
              {administerMutation.isPending ? "Recording..." : "Confirm Action"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit CRUD Modal */}
      <Dialog open={isCRUDModalOpen} onOpenChange={setIsCRUDModalOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {crudMode} MAR Entry
            </DialogTitle>
            <DialogDescription>
              Enter the details of the medication record below.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="drugName">Drug Name</Label>
              <Input
                id="drugName"
                placeholder="e.g. Paracetamol 500mg"
                value={formData.drugName}
                onChange={(e) =>
                  setFormData({ ...formData, drugName: e.target.value })
                }
                className="rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dose">Dose</Label>
                <Input
                  id="dose"
                  placeholder="e.g. 2 tablets"
                  value={formData.dose}
                  onChange={(e) =>
                    setFormData({ ...formData, dose: e.target.value })
                  }
                  className="rounded-xl"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="form">Form</Label>
                <Input
                  id="form"
                  placeholder="e.g. Tablet"
                  value={formData.form}
                  onChange={(e) =>
                    setFormData({ ...formData, form: e.target.value })
                  }
                  className="rounded-xl"
                />
              </div>
            </div>
            {crudMode === "Add" && (
              <div className="flex items-center justify-between py-2 border-y border-border/50">
                <div className="space-y-0.5">
                  <Label>Create Schedule</Label>
                  <p className="text-md text-muted-foreground">
                    Create multiple rounds across a date range
                  </p>
                </div>
                <Switch
                  checked={formData.isBulk}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isBulk: checked })
                  }
                />
              </div>
            )}

            {!formData.isBulk ? (
              <div className="grid gap-2">
                <Label htmlFor="scheduledTime">Scheduled Time</Label>
                <DateTimePicker
                  value={formData.scheduledTime}
                  onChange={(d) =>
                    setFormData({ ...formData, scheduledTime: d ? d.toISOString() : "" })
                  }
                  placeholder="Select scheduled time"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <DatePicker
                      value={formData.startDate}
                      onChange={(d) =>
                        setFormData({ ...formData, startDate: d ? d.toISOString().split("T")[0] ?? "" : "" })
                      }
                      placeholder="Select start date"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <DatePicker
                      value={formData.endDate}
                      onChange={(d) =>
                        setFormData({ ...formData, endDate: d ? d.toISOString().split("T")[0] ?? "" : "" })
                      }
                      placeholder="Select end date"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Scheduled Times</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addTimeSlot}
                      className="h-7 px-2 text-md"
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add Time
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {formData.times.map((time, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          type="time"
                          value={time}
                          onChange={(e) =>
                            updateTimeSlot(index, e.target.value)
                          }
                          className="rounded-xl h-9"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTimeSlot(index)}
                          className="h-9 w-9 text-red-500"
                          disabled={formData.times.length <= 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border mt-2 mb-4">
            <div className="space-y-0.5">
              <Label>
                Allow Late Administration
              </Label>
              <p className="text-md text-muted-foreground">
                Permit carers to provide this medication after the scheduled
                time
              </p>
            </div>
            <Switch
              checked={formData.allowLateAdministration}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, allowLateAdministration: checked })
              }
            />
          </div>

          <div className="space-y-3 mb-4 p-4 border rounded-xl bg-muted/10">
            <div className="space-y-0.5">
              <Label>
                Mandatory Observations
              </Label>
              <p className="text-md text-muted-foreground">
                Require carers to record these vitals before marking as given
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              {["BP", "Pulse", "Temp", "Blood Sugar"].map((vital) => (
                <div key={vital} className="flex items-center gap-2">
                  <Checkbox
                    id={`vital-${vital}`}
                    checked={formData.mandatoryObservations.includes(vital)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData({
                          ...formData,
                          mandatoryObservations: [
                            ...formData.mandatoryObservations,
                            vital,
                          ],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          mandatoryObservations:
                            formData.mandatoryObservations.filter(
                              (v) => v !== vital,
                            ),
                        });
                      }
                    }}
                  />
                  <Label htmlFor={`vital-${vital}`} className="text-md cursor-pointer">
                    {vital}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsCRUDModalOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCRUDSubmit}
              disabled={
                createMutation.isPending ||
                createBulkMutation.isPending ||
                updateMutation.isPending ||
                !formData.drugName ||
                !formData.dose
              }
              className="rounded-xl px-8"
            >
              {createMutation.isPending ||
                createBulkMutation.isPending ||
                updateMutation.isPending
                ? "Saving..."
                : `${crudMode} Round`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Delete MAR Entry
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to delete the MAR entry for{" "}
              <strong>{roundToDelete?.drugName}</strong>? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <div className="w-full space-y-1.5 text-left">
              <Label required>Deletion reason</Label>
              <Textarea
                value={deletionReason}
                onChange={(event) => setDeletionReason(event.target.value)}
                placeholder="Explain why this PRN medication is being deactivated"
                required
              />
            </div>
            <Button
              variant="ghost"
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending || !deletionReason.trim()}
              className="rounded-xl px-8"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Round"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AdHoc Medication Modal */}
      <Dialog open={isAdhocModalOpen} onOpenChange={setIsAdhocModalOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Record Unlisted Medication
            </DialogTitle>
            <DialogDescription>
              Record an unscheduled or unlisted medication. This will
              automatically flag and alert management.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="adhocDrugName">Drug Name</Label>
              <Input
                id="adhocDrugName"
                placeholder="e.g. Ibuprofen 400mg"
                value={adhocFormData.drugName}
                onChange={(e) =>
                  setAdhocFormData({ ...adhocFormData, drugName: e.target.value })
                }
                className="rounded-xl border-yellow-200 focus-visible:ring-yellow-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="adhocDose">Dose</Label>
                <Input
                  id="adhocDose"
                  placeholder="e.g. 1 tablet"
                  value={adhocFormData.dose}
                  onChange={(e) =>
                    setAdhocFormData({ ...adhocFormData, dose: e.target.value })
                  }
                  className="rounded-xl"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="adhocForm">Form</Label>
                <Input
                  id="adhocForm"
                  placeholder="e.g. Tablet"
                  value={adhocFormData.form}
                  onChange={(e) =>
                    setAdhocFormData({ ...adhocFormData, form: e.target.value })
                  }
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="adhocReason">Reason for Administration</Label>
              <Textarea
                id="adhocReason"
                placeholder="Why is this unlisted medication being given?"
                value={adhocFormData.reason}
                onChange={(e) =>
                  setAdhocFormData({ ...adhocFormData, reason: e.target.value })
                }
                className="rounded-xl"
              />
            </div>

            <div className="space-y-3 border p-3 rounded-lg bg-muted/20">
              <h4 className="font-semibold text-md">Vitals (Optional)</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Systolic BP</Label>
                  <Input
                    placeholder="mmHg"
                    type="number"
                    value={vitals.bpSystolic}
                    onChange={(e) =>
                      setVitals({ ...vitals, bpSystolic: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Diastolic BP</Label>
                  <Input
                    placeholder="mmHg"
                    type="number"
                    value={vitals.bpDiastolic}
                    onChange={(e) =>
                      setVitals({ ...vitals, bpDiastolic: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Pulse (bpm)</Label>
                  <Input
                    placeholder="bpm"
                    type="number"
                    value={vitals.pulse}
                    onChange={(e) =>
                      setVitals({ ...vitals, pulse: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Temp (°C)</Label>
                  <Input
                    placeholder="°C"
                    type="number"
                    step="0.1"
                    value={vitals.temp}
                    onChange={(e) =>
                      setVitals({ ...vitals, temp: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsAdhocModalOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                adhocMutation.mutate(
                  {
                    residentId,
                    data: {
                      ...adhocFormData,
                      residentId,
                      vitals,
                    },
                  },
                  {
                    onSuccess: () => {
                      setIsAdhocModalOpen(false);
                      setAdhocFormData({
                        drugName: "",
                        dose: "",
                        form: "",
                        status: "Given",
                        reason: "",
                      });
                      setVitals({
                        bpSystolic: "",
                        bpDiastolic: "",
                        bloodSugar: "",
                        pulse: "",
                        temp: "",
                        respiration: "",
                        spo2: "",
                      });
                    },
                  },
                );
              }}
              disabled={
                adhocMutation.isPending ||
                !adhocFormData.drugName ||
                !adhocFormData.dose ||
                !adhocFormData.reason
              }
              className="rounded-xl px-8 bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              {adhocMutation.isPending ? "Recording..." : "Record Ad-Hoc Medication"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Vitals Modal */}
      <Dialog
        open={!!viewObservation}
        onOpenChange={(open) => !open && setViewObservation(null)}
      >
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Activity className="w-5 h-5 text-blue-500" />
              Recorded Vitals
            </DialogTitle>
            <DialogDescription>
              Vitals recorded during this medication administration.
            </DialogDescription>
          </DialogHeader>

          {viewObservation && (
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {viewObservation.bpSystolic !== null && viewObservation.bpDiastolic !== null && (
                  <div className="space-y-1">
                    <Label>Blood Pressure</Label>
                    <p className="font-medium">{viewObservation.bpSystolic} / {viewObservation.bpDiastolic} mmHg</p>
                  </div>
                )}
                {viewObservation.pulse !== null && (
                  <div className="space-y-1">
                    <Label>Pulse</Label>
                    <p className="font-medium">{viewObservation.pulse} bpm</p>
                  </div>
                )}
                {viewObservation.temp !== null && (
                  <div className="space-y-1">
                    <Label>Temperature</Label>
                    <p className="font-medium">{viewObservation.temp} °C</p>
                  </div>
                )}
                {viewObservation.bloodSugar !== null && (
                  <div className="space-y-1">
                    <Label>Blood Sugar</Label>
                    <p className="font-medium">{viewObservation.bloodSugar} mmol/L</p>
                  </div>
                )}
                {viewObservation.respiration !== null && (
                  <div className="space-y-1">
                    <Label>Respiration</Label>
                    <p className="font-medium">{viewObservation.respiration} /min</p>
                  </div>
                )}
                {viewObservation.spo2 !== null && (
                  <div className="space-y-1">
                    <Label>SpO2</Label>
                    <p className="font-medium">{viewObservation.spo2}%</p>
                  </div>
                )}
              </div>
              {viewObservation.notes && (
                <div className="space-y-1 pt-2 border-t">
                  <Label>Notes</Label>
                  <p className="text-md italic text-muted-foreground">{viewObservation.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="default"
              onClick={() => setViewObservation(null)}
              className="rounded-xl w-full"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@repo/ui/components/ui/Dialog";
import { Button } from "@repo/ui/components/ui/Button";
import { Input } from "@repo/ui/components/ui/Input";
import { Label } from "@repo/ui/components/ui/Label";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@repo/ui/components/ui/Select";
import { Award, Loader2 } from "lucide-react";
import { DatePicker } from "@repo/ui/components/ui";

import { useToast } from "@repo/ui/hooks";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import {
    CertificationRecord,
    useCreateCertificationMutation,
    useUpdateCertificationMutation,
    useUploadComplianceDocumentMutation,
} from "../../../../../../lib/queries/staff/useComplianceQueries";
import { FileUploadField } from "../components/forms/FileUploadField";
import { cn } from "@repo/ui/lib/utils";

const certificationSchema = z.object({
    name: z.string().min(1, "Certification name is required"),
    skills: z.string().optional(),
    issueDate: z.string().min(1, "Issue date is required"),
    expiryDate: z.string().min(1, "Expiry date is required"),
    status: z.string().min(1, "Status is required"),
});

type CertificationFormValues = z.infer<typeof certificationSchema>;

interface AddCertificateModalProps {
    existingData?: CertificationRecord | null;
}

export function AddCertificateModal({ existingData }: AddCertificateModalProps = {}) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const isOpen = searchParams.get('isCertificateModalOpen') === 'true';
    const isEdit = searchParams.get('isEdit') === 'true';
    const { id: staffId } = useParams<{ id: string }>();

    const closeModal = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('isEdit');
        params.delete('isCertificateModalOpen');
        const search = params.toString();
        router.replace(pathname + (search ? '?' + search : ''));
    };

    const { toast } = useToast();
    const [documentFile, setDocumentFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<CertificationFormValues>({
        resolver: zodResolver(certificationSchema),
        defaultValues: {
            name: existingData?.name || "",
            skills: existingData?.skills ? existingData.skills.join(", ") : "",
            issueDate: existingData?.issueDate?.substring(0, 10) || "",
            expiryDate: existingData?.expiryDate?.substring(0, 10) || "",
            status: (existingData?.status as any) || "",
        },
    });

    const statusValue = watch("status");
    const issueDateValue = watch("issueDate");
    const expiryDateValue = watch("expiryDate");

    // Sync form with existing record when it changes or dialog opens
    useEffect(() => {
        if (isOpen) {
            reset({
                name: existingData?.name || "",
                skills: existingData?.skills ? existingData.skills.join(", ") : "",
                issueDate: existingData?.issueDate?.substring(0, 10) || "",
                expiryDate: existingData?.expiryDate?.substring(0, 10) || "",
                status: (existingData?.status as any) || "",
            });
            setDocumentFile(null);
            setIsSubmitting(false);
        }
    }, [isOpen, existingData, reset]);

    const createMutation = useCreateCertificationMutation(staffId);
    const updateMutation = useUpdateCertificationMutation(staffId);
    const uploadMutation = useUploadComplianceDocumentMutation(staffId);

    const onFormSubmit = async (data: CertificationFormValues) => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            let certId = existingData?.id;

            const skillsArray = data.skills
                ? data.skills.split(",").map((s) => s.trim()).filter(Boolean)
                : [];
            const payload = {
                name: data.name,
                skills: skillsArray,
                issueDate: data.issueDate,
                expiryDate: data.expiryDate,
                status: data.status,
            };

            if (isEdit && existingData) {
                await updateMutation.mutateAsync({ certId: existingData.id, data: payload as any });
            } else {
                const responseData: any = await createMutation.mutateAsync(payload as any);
                certId = responseData?.id;
            }

            // Upload document file to S3 if a new file was chosen
            if (documentFile && certId) {
                await uploadMutation.mutateAsync({
                    file: documentFile,
                    domain: "certification",
                    certId,
                });
            }

            toast({
                title: "Success",
                description: isEdit
                    ? (documentFile ? "Certification and document updated successfully" : "Certification updated successfully")
                    : (documentFile ? "Certification and document uploaded successfully" : "Certification added successfully"),
            });

            closeModal();
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: err?.message || "Failed to save certification or upload document",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isPending = isSubmitting || createMutation.isPending || updateMutation.isPending || uploadMutation.isPending;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isPending) closeModal(); }}>
            <DialogContent size="lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-primary" />
                        {isEdit ? "Edit" : "Add"} Certification
                    </DialogTitle>
                    <DialogDescription className="text-sm text-[12px]">
                        Record a mandatory NHS/CQC training module or certification.
                    </DialogDescription>
                </DialogHeader>

                <form noValidate onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
                    <div className="space-y-1.5">
                        <Label required>
                            Training / Certification Name
                        </Label>
                        <Input
                            {...register("name")}
                            placeholder="e.g. Safeguarding Adults (Level 2)"
                            errorMessage={errors.name?.message}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Skills</Label>
                        <Input
                            {...register("skills")}
                            placeholder="e.g. First Aid, CPR, Medication Administration"
                            errorMessage={errors.skills?.message}
                        />
                        <p className="text-sm text-muted-foreground">
                            Enter skills separated by commas
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label required>
                                Issue Date
                            </Label>
                            <DatePicker
                                value={issueDateValue}
                                onChange={(d) => setValue("issueDate", d ? format(d, "yyyy-MM-dd") : "")}
                                maxDate={new Date()}
                                placeholder="Select issue date..."
                                errorMessage={errors.issueDate?.message}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label required>
                                Expiry Date
                            </Label>
                            <DatePicker
                                value={expiryDateValue}
                                onChange={(d) => setValue("expiryDate", d ? format(d, "yyyy-MM-dd") : "")}
                                minDate={new Date()}
                                placeholder="Select expiry date..."
                                errorMessage={errors.expiryDate?.message}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label required>Status</Label>
                        <Select
                            value={statusValue}
                            onValueChange={(val) => setValue("status", val as any, { shouldValidate: true })}
                        >
                            <SelectTrigger className={cn(errors.status && "border-rose-500")}>
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Valid">Valid</SelectItem>
                                <SelectItem value="Expiring Soon">Expiring Soon</SelectItem>
                                <SelectItem value="Expired">Expired</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.status?.message && (
                            <p className="text-sm text-rose-500 mt-1">{errors.status.message}</p>
                        )}
                    </div>

                    {/* Document Upload */}
                    <div className="border-t border-border pt-4">
                        <FileUploadField
                            label="Certificate Document"
                            existingUrl={existingData?.certificateUrl}
                            onFileSelect={setDocumentFile}
                            staffId={staffId}
                            documentTitle={existingData?.name || "Certificate Document"}
                            helpText="Upload training certificate or qualification proof (PDF, JPG, PNG up to 10MB)"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={closeModal} disabled={isPending}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending} className="gap-2">
                            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isPending
                                ? (documentFile ? "Uploading & Saving..." : "Saving...")
                                : isEdit
                                    ? "Update Certification"
                                    : "Add Certification"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

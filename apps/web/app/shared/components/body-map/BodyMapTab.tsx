"use client";

import React, { useState, useCallback, useMemo } from "react";
import type {
  BodyMapViewType,
  BodyMapVariantType,
  AnatomyNode,
  ExactPointDTO,
} from "@repo/schema";
import { ANATOMY_BY_ID } from "@repo/schema";
import { AnatomicalLocatorCard } from "./AnatomicalLocatorCard";
import { ActiveFindingsCard } from "./ActiveFindingsCard";
import { AssessmentHistoryCard } from "./AssessmentHistoryCard";
import { AddFindingDialog, type PendingFinding } from "./AddFindingDialog";
import {
  FindingDetailDialog,
  type FindingDetailItem,
} from "./FindingDetailDialog";
import { getBodyMapVariant } from "./variant";
import {
  useGetBodyMapAssessmentsQuery,
  useCreateBodyMapAssessmentMutation,
  useResolveBodyMapFindingMutation,
  useUploadBodyMapPhotoMutation,
} from "../../../../lib/queries/body-map";
import { useGetResidentQuery } from "../../../../lib/queries/residents";
import { useAuth } from "../../../../lib/context/AuthContext";
import type { BodyMapInteractionMode } from "./BodyMapCanvas";

interface BodyMapTabProps {
  residentId: string;
  resident?: {
    id: string;
    fullName?: string;
    gender?: string | null;
    profile?: { gender?: string | null } | null;
    status?: string;
  } | null;
}

interface AssessmentData {
  id: string;
  assessedAt: string;
  notes?: string;
  createdById: string;
  findings: FindingDetailItem[];
}

function variantLabel(variant: BodyMapVariantType): string {
  return variant === "female"
    ? "Female body"
    : variant === "male"
      ? "Male body"
      : "Neutral body";
}

export function BodyMapTab({ residentId, resident }: BodyMapTabProps) {
  const { user } = useAuth();
  const roleName = user?.roleName?.toUpperCase() ?? "";
  const canResolve = ["ADMIN", "MANAGER", "NURSE"].includes(roleName);

  // Query resident if not passed directly from parent
  const residentQuery = useGetResidentQuery(residentId);
  const effectiveResident = resident || residentQuery.data;
  const canEdit = effectiveResident?.status !== "Discharged";

  // Body Map Variant (male | female | neutral) resolved from resident profile
  const profileVariant = useMemo(
    () => getBodyMapVariant(effectiveResident),
    [effectiveResident],
  );
  const [overrideVariant, setOverrideVariant] =
    useState<BodyMapVariantType | null>(null);
  const variant = overrideVariant || profileVariant;

  // ─── State ──────────────────────────────────────────────
  const [activeView, setActiveView] = useState<BodyMapViewType>("Front");
  const [mode, setMode] = useState<BodyMapInteractionMode>("navigate");
  const [selectedNode, setSelectedNode] = useState<AnatomyNode | null>(null);
  const [exactPoint, setExactPoint] = useState<ExactPointDTO | null>(null);

  // Dialogs
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedFinding, setSelectedFinding] =
    useState<FindingDetailItem | null>(null);

  // History accordion
  const [expandedAssessmentId, setExpandedAssessmentId] = useState<
    string | null
  >(null);

  // ─── Queries & Mutations ─────────────────────────────────
  const assessmentsQuery = useGetBodyMapAssessmentsQuery(residentId);
  const createMutation = useCreateBodyMapAssessmentMutation(residentId);
  const resolveMutation = useResolveBodyMapFindingMutation(residentId);
  const uploadPhotoMutation = useUploadBodyMapPhotoMutation(residentId);

  const assessments = (assessmentsQuery.data ?? []) as AssessmentData[];
  const allFindings: FindingDetailItem[] = assessments.flatMap(
    (a) => a.findings,
  );
  const openFindings = allFindings.filter((f) => f.status === "Open");

  // Findings matching current view for map rendering (only active Open findings appear on live canvas)
  const viewFindings = openFindings.filter((f) => f.view === activeView);

  // Sync selectedFinding with latest cache (ensures newly uploaded photos appear immediately)
  const activeFinding = useMemo(() => {
    if (!selectedFinding) return null;
    return (
      allFindings.find((f) => f.id === selectedFinding.id) || selectedFinding
    );
  }, [allFindings, selectedFinding]);

  // ─── Handlers ────────────────────────────────────────────

  const handleSelectNode = useCallback((node: AnatomyNode | null) => {
    setSelectedNode(node);
    if (!node) {
      setExactPoint(null);
      setMode("navigate");
    }
  }, []);

  const handleOpenAddFinding = useCallback(
    (node: AnatomyNode, pt?: ExactPointDTO) => {
      setSelectedNode(node);
      if (pt) setExactPoint(pt);
      setAddDialogOpen(true);
    },
    [],
  );

  const handleSaveFinding = useCallback(
    async (finding: PendingFinding) => {
      setAddDialogOpen(false);
      setExactPoint(null);

      // Separate File objects so finding DTO is 100% clean JSON
      const { photos, ...findingPayload } = finding;

      // Fast Care-Home Workflow: Automatically groups into snapshot session
      const result = await createMutation.mutateAsync({
        notes: `Documented for ${findingPayload.locationLabel}`,
        findings: [findingPayload],
      });

      // Upload clinical photographs attached during finding creation
      if (photos && photos.length > 0) {
        const resObj = result as Record<string, unknown>;
        const createdFindings = (resObj?.findings ||
          (resObj?.data as Record<string, unknown>)?.findings) as
          | Array<{ id: string }>
          | undefined;
        const createdFinding = createdFindings?.[0];
        if (createdFinding?.id) {
          for (const file of photos) {
            await uploadPhotoMutation.mutateAsync({
              findingId: createdFinding.id,
              file,
            });
          }
          await assessmentsQuery.refetch();
        }
      }
    },
    [createMutation, uploadPhotoMutation, assessmentsQuery],
  );

  const handleMarkerClick = useCallback(
    (clickedFindings: FindingDetailItem[]) => {
      if (clickedFindings.length > 0) {
        setSelectedFinding(clickedFindings[0]!);
        setDetailDialogOpen(true);
      }
    },
    [],
  );

  const handleResolve = useCallback(
    (findingId: string, resolutionNote: string) => {
      resolveMutation.mutate({
        findingId,
        dto: { resolutionNote: resolutionNote || undefined },
      });
      setDetailDialogOpen(false);
      setSelectedFinding(null);
    },
    [resolveMutation],
  );

  const handleUploadPhoto = useCallback(
    (findingId: string, file: File) => {
      uploadPhotoMutation.mutate({ findingId, file });
    },
    [uploadPhotoMutation],
  );

  const handleViewChange = useCallback((view: BodyMapViewType) => {
    setActiveView(view);
  }, []);

  const handleClearPin = useCallback(() => {
    setExactPoint(null);
    setSelectedNode(null);
    setMode("navigate");
    if (typeof document !== "undefined") {
      document
        .querySelectorAll("#active-body-map-pin")
        .forEach((el) => el.remove());
    }
  }, []);

  const subtitle = overrideVariant
    ? `Illustration Preview: ${overrideVariant.toUpperCase()}`
    : `${variantLabel(profileVariant)} · Resident profile`;

  return (
    <div className="space-y-6">
      {/* Main Grid: Body Map Canvas + Anatomy Navigator & Findings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Canvas (7 cols) */}
        <AnatomicalLocatorCard
          view={activeView}
          onViewChange={handleViewChange}
          variant={variant}
          mode={mode}
          onModeChange={setMode}
          selectedNode={selectedNode}
          onSelectNode={handleSelectNode}
          findings={viewFindings}
          onMarkerClick={(findings) =>
            handleMarkerClick(findings as FindingDetailItem[])
          }
          exactPoint={exactPoint}
          onSelectExactPoint={(node, pt) => {
            setSelectedNode(node);
            setExactPoint(pt);
            if (!pt && typeof document !== "undefined") {
              document
                .querySelectorAll("#active-body-map-pin")
                .forEach((el) => el.remove());
            }
          }}
          onClearPin={handleClearPin}
          onOpenAddFinding={handleOpenAddFinding}
          onAddDefaultFinding={() =>
            handleOpenAddFinding(
              selectedNode ||
              ANATOMY_BY_ID.get(activeView === "Front" ? "chest" : "upper-back")!,
            )
          }
          subtitle={subtitle}
          canEdit={canEdit}
        />

        {/* Right Column: Active Finding Lists & History (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Current Findings */}
          <ActiveFindingsCard
            allFindings={allFindings}
            openFindings={openFindings}
            totalFindings={allFindings.length}
            onSelect={(finding) => {
              setSelectedFinding(finding);
              setDetailDialogOpen(true);
            }}
          />

          {/* Assessment Snapshot History */}
          <AssessmentHistoryCard
            assessments={assessments}
            isLoading={assessmentsQuery.isLoading}
            expandedId={expandedAssessmentId}
            onToggle={(id) =>
              setExpandedAssessmentId(expandedAssessmentId === id ? null : id)
            }
            onFindingSelect={(finding) => {
              setSelectedFinding(finding);
              setDetailDialogOpen(true);
            }}
          />
        </div>
      </div>

      {/* Add Finding Dialog */}
      {selectedNode && (
        <AddFindingDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          view={activeView}
          variant={variant}
          node={selectedNode}
          exactPoint={exactPoint}
          onAdd={handleSaveFinding}
        />
      )}

      {/* Finding Detail Dialog */}
      <FindingDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        finding={activeFinding}
        canResolve={canResolve}
        onResolve={handleResolve}
        onUploadPhoto={handleUploadPhoto}
        residentId={residentId}
      />
    </div>
  );
}

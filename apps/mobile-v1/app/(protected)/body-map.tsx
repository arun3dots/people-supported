import React, { useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { ChevronLeft, Maximize2 } from 'lucide-react-native';
import { ScreenWrapper } from '../../src/components/common/ScreenWrapper';
import { Text } from '../../src/components/ui/text';
import { useResidentDetail } from '../../src/presentation/hooks/useResidentDetail';
import { ResidentProfileHeaderCard } from '../../src/components/clinical/ResidentProfileHeaderCard';
import { useBodyMap, type BodyMapFindingItem } from '../../src/presentation/hooks/useBodyMap';
import {
  MobileBodyMapCanvas,
  MobileAnatomySelector,
  MobileActiveFindingsCard,
  MobileAddFindingModal,
  MobileFindingDetailModal,
  MobileAssessmentHistoryCard,
  MobileBodyMapHeader,
  MobileBodyMapDock,
  MobileBodyMapFindingsModal,
  MobileBodyMapSelectorModal,
  type PendingMobileFinding,
} from '../../src/components/body-map';
import type { BodyMapViewType, BodyMapVariantType, ExactPointDTO } from '@repo/schema';
import { ANATOMY_BY_ID } from '@repo/schema';

export default function BodyMapScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { resident, loading: residentLoading } = useResidentDetail(id);

  const {
    assessments,
    allFindings,
    openFindings,
    resolvedFindings,
    createAssessment,
    isCreating,
    resolveFinding,
    isResolving,
    uploadFindingPhoto,
    isUploadingPhoto,
  } = useBodyMap(resident?.id);

  // Body Map & Layout mode
  const [view, setView] = useState<BodyMapViewType>('Front');
  const [isFullView, setIsFullView] = useState<boolean>(true);
  const [isAddMode, setIsAddMode] = useState<boolean>(false);
  const [selectedAnatomyId, setSelectedAnatomyId] = useState<string | null>(null);
  const [exactPoint, setExactPoint] = useState<ExactPointDTO | null>(null);

  const resetSelection = () => { setSelectedAnatomyId(null); setExactPoint(null); };
  const handleToggleAddMode = () => {
    setIsAddMode((prev) => {
      if (prev) resetSelection();
      return !prev;
    });
  };

  // Dialogs
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [modalAnatomyId, setModalAnatomyId] = useState('chest');
  const [modalLocationLabel, setModalLocationLabel] = useState('Chest');
  const [selectedFinding, setSelectedFinding] = useState<BodyMapFindingItem | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [findingsModalVisible, setFindingsModalVisible] = useState(false);
  const [findingsModalTab, setFindingsModalTab] = useState<'findings' | 'history'>('findings');
  const [selectorModalVisible, setSelectorModalVisible] = useState(false);

  // Derive body map variant from resident profile
  const rawGender = (
    (resident?.profile?.gender || (resident as { gender?: string } | null)?.gender || '') as string
  ).toLowerCase();
  const variant: BodyMapVariantType =
    rawGender === 'female' ? 'female' : rawGender === 'male' ? 'male' : 'neutral';

  const handleOpenAddFinding = (anatomyId: string, label: string) => {
    setModalAnatomyId(anatomyId);
    setModalLocationLabel(label);
    setAddModalVisible(true);
  };

  const activeFinding = selectedFinding
    ? allFindings.find((f) => f.id === selectedFinding.id) || selectedFinding
    : null;

  const handleSaveFinding = async (finding: PendingMobileFinding) => {
    const node = ANATOMY_BY_ID.get(finding.anatomyId);
    const created = await createAssessment({
      notes: `Documented for ${finding.locationLabel}`,
      findings: [
        {
          view: finding.view,
          bodyMapVariant: finding.bodyMapVariant,
          bodyMapAssetVersion: 'body-map-assets-v1',
          anatomyId: finding.anatomyId,
          anatomicalRegion: node?.anatomicalRegion || 'general',
          bodyPart: node?.bodyPart || 'general',
          subPart: node?.subPart,
          detail: node?.detail,
          laterality: node?.laterality,
          locationLabel: finding.locationLabel,
          exactPoint: finding.exactPoint,
          findingType: finding.findingType,
          severity: finding.severity,
          onsetDate: finding.onsetDate,
          description: finding.description,
        },
      ],
    });
    const createdFindingId = created?.findings?.[0]?.id || created?.data?.findings?.[0]?.id;
    if (createdFindingId && finding.photos && finding.photos.length > 0) {
      for (const photo of finding.photos) {
        await uploadFindingPhoto(createdFindingId, photo);
      }
    }
    setExactPoint(null);
    setSelectedAnatomyId(null);
    setIsAddMode(false);
  };

  const handleSelectMarker = (finding: BodyMapFindingItem) => {
    setSelectedFinding(finding);
    setDetailModalVisible(true);
  };

  const handleResolve = async (findingId: string, resolutionNote: string) => {
    await resolveFinding({ findingId, dto: { resolutionNote: resolutionNote || undefined } });
  };

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.navigate('/residents' as Href);
  };

  if (!resident) {
    return (
      <ScreenWrapper key="body-map-state" scrollable>
        <View className="flex-row items-center justify-between py-3 mb-1">
          <TouchableOpacity onPress={handleBack} activeOpacity={0.7} className="w-9 h-9 rounded-full bg-surface items-center justify-center">
            <ChevronLeft size={22} color="#141F1E" strokeWidth={2.4} />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-foreground">Body Map Assessment</Text>
          <View className="w-9" />
        </View>
        <View className="items-center justify-center py-24">
          {residentLoading ? (
            <>
              <ActivityIndicator size="large" color="#4A706A" />
              <Text className="text-xs text-muted-foreground mt-3 font-medium">Loading body map...</Text>
            </>
          ) : (
            <>
              <Text className="text-md font-bold text-foreground">Person Not Found</Text>
              <Text className="text-xs text-muted-foreground mt-1">Please select a person supported to view body map.</Text>
            </>
          )}
        </View>
      </ScreenWrapper>
    );
  }

  // 1. FULL VIEW SCREEN MODE (Diagram takes full height of screen)
  if (isFullView) {
    return (
      <ScreenWrapper
        key={`body-map-full-${resident.id}`}
        scrollable={false}
        disablePadding
      >
        <MobileBodyMapHeader
          resident={resident}
          view={view}
          onViewChange={setView}
          onBack={handleBack}
          isAddMode={isAddMode}
          onToggleAddMode={handleToggleAddMode}
          onResetSelection={resetSelection}
        />

        <MobileBodyMapCanvas
          view={view}
          variant={variant}
          selectedAnatomyId={selectedAnatomyId}
          onSelectAnatomyId={setSelectedAnatomyId}
          exactPoint={exactPoint}
          onSelectExactPoint={setExactPoint}
          findings={openFindings}
          onMarkerPress={handleSelectMarker}
          onOpenAddFinding={handleOpenAddFinding}
          onViewChange={setView}
          fullScreen
          isAddMode={isAddMode}
        />

        <MobileBodyMapDock
          openFindingsCount={openFindings.length}
          assessmentsCount={assessments.length}
          onOpenFindings={() => {
            setFindingsModalTab('findings');
            setFindingsModalVisible(true);
          }}
          onOpenHistory={() => {
            setFindingsModalTab('history');
            setFindingsModalVisible(true);
          }}
          onOpenSelector={() => setSelectorModalVisible(true)}
          isAddMode={isAddMode}
        />

        <MobileAddFindingModal
          visible={addModalVisible}
          onClose={() => setAddModalVisible(false)}
          view={view}
          variant={variant}
          anatomyId={modalAnatomyId}
          locationLabel={modalLocationLabel}
          exactPoint={exactPoint}
          onSubmit={handleSaveFinding}
          isSubmitting={isCreating}
        />

        <MobileFindingDetailModal
          visible={detailModalVisible}
          onClose={() => setDetailModalVisible(false)}
          finding={activeFinding}
          onResolve={handleResolve}
          isResolving={isResolving}
          onUploadPhoto={uploadFindingPhoto}
          isUploadingPhoto={isUploadingPhoto}
        />

        <MobileBodyMapFindingsModal
          visible={findingsModalVisible}
          initialTab={findingsModalTab}
          onClose={() => setFindingsModalVisible(false)}
          openFindings={openFindings}
          resolvedCount={resolvedFindings.length}
          assessments={assessments}
          onSelectFinding={handleSelectMarker}
        />

        <MobileBodyMapSelectorModal
          visible={selectorModalVisible}
          onClose={() => setSelectorModalVisible(false)}
          view={view}
          selectedAnatomyId={selectedAnatomyId}
          onSelectAnatomyId={(id) => {
            setSelectedAnatomyId(id);
            if (id) setIsAddMode(true);
          }}
          exactPoint={exactPoint}
          onOpenAddFinding={handleOpenAddFinding}
        />
      </ScreenWrapper>
    );
  }

  // 2. SCROLLABLE OVERVIEW MODE (Multi-Card Layout)
  return (
    <ScreenWrapper key={`body-map-overview-${resident.id}`} scrollable>
      <MobileBodyMapHeader
        resident={resident}
        view={view}
        onViewChange={setView}
        onBack={handleBack}
        isAddMode={isAddMode}
        onToggleAddMode={handleToggleAddMode}
        onResetSelection={resetSelection}
      />

      <TouchableOpacity
        onPress={() => setIsFullView(true)}
        activeOpacity={0.8}
        className="flex-row items-center justify-between p-3 my-2 bg-primary-light rounded-2xl"
      >
        <View className="flex-row items-center gap-2">
          <Maximize2 size={16} color="#4A706A" />
          <Text className="text-xs font-bold text-primary">Open Full Screen Diagram</Text>
        </View>
        <Text className="text-xs font-semibold text-primary">Tap to expand</Text>
      </TouchableOpacity>

      <ResidentProfileHeaderCard resident={resident} />

      <MobileBodyMapCanvas
        view={view}
        variant={variant}
        selectedAnatomyId={selectedAnatomyId}
        onSelectAnatomyId={setSelectedAnatomyId}
        exactPoint={exactPoint}
        onSelectExactPoint={setExactPoint}
        findings={openFindings}
        onMarkerPress={handleSelectMarker}
        onOpenAddFinding={handleOpenAddFinding}
        onViewChange={setView}
        fullScreen={false}
        isAddMode={isAddMode}
      />

      {isAddMode && (
        <MobileAnatomySelector
          view={view}
          selectedAnatomyId={selectedAnatomyId}
          onSelectAnatomyId={setSelectedAnatomyId}
          exactPoint={exactPoint}
          onOpenAddFinding={handleOpenAddFinding}
        />
      )}

      <MobileActiveFindingsCard
        openFindings={openFindings}
        resolvedCount={resolvedFindings.length}
        onSelectFinding={handleSelectMarker}
      />

      <MobileAssessmentHistoryCard assessments={assessments} />

      <MobileAddFindingModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        view={view}
        variant={variant}
        anatomyId={modalAnatomyId}
        locationLabel={modalLocationLabel}
        exactPoint={exactPoint}
        onSubmit={handleSaveFinding}
        isSubmitting={isCreating}
      />

      <MobileFindingDetailModal
        visible={detailModalVisible}
        onClose={() => setDetailModalVisible(false)}
        finding={activeFinding}
        onResolve={handleResolve}
        isResolving={isResolving}
        onUploadPhoto={uploadFindingPhoto}
        isUploadingPhoto={isUploadingPhoto}
      />
    </ScreenWrapper>
  );
}

import React, { useMemo } from 'react';
import { View, TouchableOpacity } from 'react-native';
import Svg, { SvgXml } from 'react-native-svg';
import { MapPin, RotateCcw, Plus } from 'lucide-react-native';
import { Text } from '../ui/text';
import { theme } from '../../theme';
import {
  getBodyMapDimensions,
  getBodyMapProcessedSvg,
  stripDataAttributes,
} from './svg';
import { BodyMapTopBar } from './BodyMapTopBar';
import { BodyMapZoomControls } from './BodyMapZoomControls';
import { BodyMapMarkersLayer } from './BodyMapMarkersLayer';
import { useBodyMapGestures } from './useBodyMapGestures';
import type { BodyMapFindingItem } from '../../presentation/hooks/useBodyMap';
import type { BodyMapViewType, BodyMapVariantType, ExactPointDTO } from '@repo/schema';

interface Props {
  view: BodyMapViewType;
  variant?: BodyMapVariantType;
  selectedAnatomyId: string | null;
  onSelectAnatomyId: (id: string | null) => void;
  exactPoint: ExactPointDTO | null;
  onSelectExactPoint: (pt: ExactPointDTO | null) => void;
  findings: BodyMapFindingItem[];
  onMarkerPress: (finding: BodyMapFindingItem) => void;
  onOpenAddFinding?: (anatomyId: string, label: string) => void;
  onViewChange?: (view: BodyMapViewType) => void;
  fullScreen?: boolean;
  mode?: 'navigate' | 'mark-exact';
  onModeChange?: (mode: 'navigate' | 'mark-exact') => void;
  isAddMode?: boolean;
}

export function MobileBodyMapCanvas({
  view,
  variant = 'neutral',
  selectedAnatomyId,
  onSelectAnatomyId,
  exactPoint,
  onSelectExactPoint,
  findings,
  onMarkerPress,
  onOpenAddFinding,
  onViewChange,
  fullScreen = false,
  mode,
  isAddMode = false,
}: Props) {
  const defaultDim = useMemo(() => getBodyMapDimensions(view, variant), [view, variant]);

  const {
    zoomLevel,
    layout,
    onLayout,
    containerRef,
    currentViewBox,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    isZoomed,
    selectedLabel,
    pinPixelPos,
    isDraggingPin,
  } = useBodyMapGestures({
    defaultDim,
    selectedAnatomyId,
    exactPoint,
    view,
    variant,
    onSelectAnatomyId,
    onSelectExactPoint,
    isAddMode,
  });

  const processedSvg = useMemo(() => {
    return stripDataAttributes(
      getBodyMapProcessedSvg(view, variant, isAddMode ? selectedAnatomyId : null, currentViewBox),
    );
  }, [view, variant, isAddMode, selectedAnatomyId, currentViewBox]);

  return (
    <View className={fullScreen ? 'flex-1 w-full' : 'items-center justify-center my-1 w-full'}>
      {/* 1. Contextual Top Bar matching App Theme (Only in card mode) */}
      {!fullScreen && (
        <BodyMapTopBar
          selectedAnatomyId={selectedAnatomyId}
          selectedLabel={selectedLabel}
          mode={mode}
          isZoomed={isZoomed}
          exactPoint={exactPoint}
          onSelectExactPoint={onSelectExactPoint}
          onOpenAddFinding={onOpenAddFinding}
          onResetZoom={handleResetZoom}
        />
      )}

      {/* 2. SVG Canvas Card */}
      <View
        ref={containerRef}
        onLayout={onLayout}
        className={
          fullScreen
            ? 'flex-1 w-full bg-[#F7F9F8] items-center justify-center relative overflow-hidden'
            : 'w-full h-[470px] bg-[#F7F9F8] rounded-xl border border-slate-200/80 items-center justify-center relative overflow-hidden'
        }
      >
        {/* Full-width Touch & Pinch Container */}
        <View
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className="w-full h-full relative items-center justify-center"
        >
          {/* Base High-Fidelity Anatomical SVG with Dynamic Blue Highlighting */}
          <SvgXml
            xml={processedSvg}
            width="100%"
            height="100%"
            viewBox={`${currentViewBox.x} ${currentViewBox.y} ${currentViewBox.w} ${currentViewBox.h}`}
          />

          {/* Dynamic SVG Overlay: Arrow Callout, Findings & Exact Pin */}
          <Svg
            width="100%"
            height="100%"
            viewBox={`${currentViewBox.x} ${currentViewBox.y} ${currentViewBox.w} ${currentViewBox.h}`}
            pointerEvents="box-none"
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            <BodyMapMarkersLayer
              view={view}
              variant={variant}
              findings={findings}
              exactPoint={isAddMode ? exactPoint : null}
              selectedAnatomyId={isAddMode ? selectedAnatomyId : null}
              defaultDim={defaultDim}
              currentViewBox={currentViewBox}
              onMarkerPress={onMarkerPress}
            />
          </Svg>
        </View>

        {/* 3. In-Canvas Top-Left "Full Body" Reset Button (Web App Pattern) */}
        {(isZoomed || (isAddMode && selectedAnatomyId)) && (
          <TouchableOpacity
            onPress={handleResetZoom}
            activeOpacity={0.8}
            className="absolute top-3 left-3 z-20 flex-row items-center gap-1.5 px-3 py-1.5 bg-white/95 rounded-xl border border-slate-200/90 shadow-xs"
          >
            <RotateCcw size={12} color="#475569" />
            <Text className="text-xs font-semibold text-slate-700">Full Body</Text>
          </TouchableOpacity>
        )}

        {/* 4. In-Canvas Top-Right "Front" / "Back" View Switcher (Web App Pattern) */}
        {onViewChange && (
          <View className="absolute top-3 right-3 z-20 flex-row items-center p-1 bg-slate-100/90 border border-slate-200/80 rounded-xl shadow-xs">
            <TouchableOpacity
              onPress={() => {
                onSelectAnatomyId(null);
                onSelectExactPoint(null);
                onViewChange('Front');
              }}
              activeOpacity={0.8}
              className={`px-3 py-1 rounded-lg ${
                view === 'Front' ? 'bg-white shadow-2xs' : ''
              }`}
            >
              <Text
                className={`text-xs ${
                  view === 'Front' ? 'font-bold text-slate-900' : 'font-medium text-slate-600'
                }`}
              >
                Front
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                onSelectAnatomyId(null);
                onSelectExactPoint(null);
                onViewChange('Back');
              }}
              activeOpacity={0.8}
              className={`px-3 py-1 rounded-lg ${
                view === 'Back' ? 'bg-white shadow-2xs' : ''
              }`}
            >
              <Text
                className={`text-xs ${
                  view === 'Back' ? 'font-bold text-slate-900' : 'font-medium text-slate-600'
                }`}
              >
                Back
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 5. Floating Pin Interactive Tooltip (Only shown in Add Mode) */}
        {isAddMode && exactPoint && selectedAnatomyId && pinPixelPos && !isDraggingPin && (
          <View
            style={{
              position: 'absolute',
              left: Math.max(115, Math.min(layout.width - 115, pinPixelPos.x)),
              top: pinPixelPos.y < 130 ? pinPixelPos.y + 24 : pinPixelPos.y - 14,
              transform: [{ translateX: -105 }, { translateY: pinPixelPos.y < 130 ? 0 : -85 }],
              zIndex: 30,
            }}
            className="p-2.5 bg-white/95 rounded-xl border border-slate-200/90 shadow-xl w-[210px]"
          >
            {/* Header: Sub-part label */}
            <View className="flex-row items-center gap-1.5 pb-1.5 border-b border-slate-100">
              <MapPin size={13} color={theme.colors.primary.DEFAULT} />
              <Text className="text-xs font-bold text-slate-900 flex-1" numberOfLines={1}>
                {selectedLabel}
              </Text>
            </View>

            {/* Actions: Clear Pin & Document Finding */}
            <View className="flex-row items-center gap-1.5 pt-1">
              <TouchableOpacity
                onPress={() => onSelectExactPoint(null)}
                activeOpacity={0.7}
                className="h-7 px-2 rounded-lg border border-rose-200 bg-white items-center justify-center flex-1"
              >
                <Text className="text-[11px] font-semibold text-rose-600">Clear Pin</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onOpenAddFinding?.(selectedAnatomyId, selectedLabel)}
                activeOpacity={0.7}
                className="h-7 px-2 rounded-lg bg-primary flex-row items-center justify-center gap-1 flex-1 shadow-xs"
              >
                <Plus size={12} color="#FFFFFF" />
                <Text className="text-[11px] font-semibold text-white">Document</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 6. Floating Zoom Controls on Canvas (#4A706A Theme) */}
        <BodyMapZoomControls
          isZoomed={isZoomed}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
        />

        {/* 7. Active Zoom Pill indicator */}
        {isZoomed && !selectedAnatomyId && (
          <View className="absolute bottom-3 left-3 bg-[#141F1E]/80 px-2.5 py-1 rounded-full flex-row items-center gap-1">
            <Text className="text-[10px] font-bold text-white">
              {zoomLevel.toFixed(1)}x Zoom · Pinch or drag to pan
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

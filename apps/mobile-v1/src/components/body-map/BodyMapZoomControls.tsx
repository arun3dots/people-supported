import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react-native';

interface Props {
  isZoomed: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

/**
 * Floating zoom controls widget for the Body Map canvas matching #4A706A theme.
 */
export function BodyMapZoomControls({
  isZoomed,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}: Props) {
  return (
    <View className="absolute bottom-3 right-3 flex-col gap-1.5 bg-white/95 border border-slate-200/90 rounded-xl p-1 shadow-sm">
      <TouchableOpacity
        onPress={onZoomIn}
        activeOpacity={0.7}
        className="w-8 h-8 items-center justify-center rounded-lg active:bg-slate-100"
        accessibilityLabel="Zoom in"
      >
        <ZoomIn size={16} color="#4A706A" strokeWidth={2.4} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onZoomOut}
        activeOpacity={0.7}
        className="w-8 h-8 items-center justify-center rounded-lg active:bg-slate-100"
        accessibilityLabel="Zoom out"
      >
        <ZoomOut size={16} color="#4A706A" strokeWidth={2.4} />
      </TouchableOpacity>

      {isZoomed && (
        <TouchableOpacity
          onPress={onResetZoom}
          activeOpacity={0.7}
          className="w-8 h-8 items-center justify-center rounded-lg bg-[#4A706A]/10"
          accessibilityLabel="Reset to full body"
        >
          <Maximize2 size={14} color="#4A706A" strokeWidth={2.4} />
        </TouchableOpacity>
      )}
    </View>
  );
}

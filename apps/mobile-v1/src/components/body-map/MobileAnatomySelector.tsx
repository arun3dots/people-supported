import React, { useState } from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { Plus, Crosshair, Check } from 'lucide-react-native';
import { Text } from '../ui/text';
import { theme } from '../../theme';
import { ANATOMY_DEFAULT_CENTERS } from './bodyMapConstants';
import type { ExactPointDTO } from '@repo/schema';

interface Props {
  view: 'Front' | 'Back';
  selectedAnatomyId: string | null;
  onSelectAnatomyId: (id: string | null) => void;
  exactPoint: ExactPointDTO | null;
  onStartPinExact?: () => void;
  onOpenAddFinding: (anatomyId: string, locationLabel: string) => void;
}

type Quadrant = 'head-neck' | 'torso' | 'upper-limb' | 'lower-limb';

const QUADRANTS: Array<{ id: Quadrant; label: string }> = [
  { id: 'torso', label: 'Torso' },
  { id: 'upper-limb', label: 'Upper Limbs' },
  { id: 'lower-limb', label: 'Lower Limbs' },
  { id: 'head-neck', label: 'Head & Neck' },
];

export function MobileAnatomySelector({
  view,
  selectedAnatomyId,
  onSelectAnatomyId,
  exactPoint,
  onStartPinExact,
  onOpenAddFinding,
}: Props) {
  const [activeQuadrant, setActiveQuadrant] = useState<Quadrant>('torso');

  // Filter anatomy items belonging to the selected quadrant and supported in this view
  const subparts = Object.entries(ANATOMY_DEFAULT_CENTERS)
    .filter(([key, item]) => {
      if (item.view !== 'both' && item.view !== view) return false;
      if (activeQuadrant === 'head-neck') {
        return ['head-neck', 'cranium', 'face', 'forehead', 'nose', 'mouth', 'neck', 'anterior-neck', 'posterior-neck', 'right-ear', 'left-ear'].includes(key);
      }
      if (activeQuadrant === 'torso') {
        return ['torso', 'chest', 'right-chest', 'left-chest', 'upper-back', 'abdomen', 'upper-abdomen', 'lower-abdomen', 'lower-back', 'sacrum', 'buttocks', 'groin'].includes(key);
      }
      if (activeQuadrant === 'upper-limb') {
        return ['upper-limb', 'right-shoulder', 'left-shoulder', 'right-upper-arm', 'left-upper-arm', 'right-elbow', 'left-elbow', 'right-forearm', 'left-forearm', 'right-wrist', 'left-wrist', 'right-hand', 'left-hand'].includes(key);
      }
      if (activeQuadrant === 'lower-limb') {
        return ['lower-limb', 'right-hip', 'left-hip', 'right-thigh', 'left-thigh', 'right-knee', 'left-knee', 'right-lower-leg', 'left-lower-leg', 'right-ankle', 'left-ankle', 'right-foot', 'left-foot', 'right-heel', 'left-heel'].includes(key);
      }
      return false;
    })
    .map(([id, item]) => ({ id, label: item.label }));

  const currentLabel = selectedAnatomyId
    ? ANATOMY_DEFAULT_CENTERS[selectedAnatomyId]?.label || selectedAnatomyId
    : 'None selected';

  return (
    <View className="bg-white rounded-xl border border-slate-200/80 p-3.5 mb-3 shadow-xs">
      <Text className="text-xs font-bold text-slate-800 mb-2.5">
        Select Anatomical Region
      </Text>

      {/* 1. Quadrant Selector Tabs */}
      <View className="flex-row gap-1.5 mb-3">
        {QUADRANTS.map((quad) => {
          const isActive = activeQuadrant === quad.id;
          return (
            <TouchableOpacity
              key={quad.id}
              onPress={() => setActiveQuadrant(quad.id)}
              activeOpacity={0.7}
              className={`flex-1 py-1.5 px-2 rounded-lg items-center justify-center border ${
                isActive
                  ? 'bg-[#4A706A] border-[#4A706A]'
                  : 'bg-slate-50 border-slate-200/80'
              }`}
            >
              <Text
                numberOfLines={1}
                className={`text-[11px] font-semibold ${
                  isActive ? 'text-white' : 'text-slate-600'
                }`}
              >
                {quad.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 2. Subparts Chip List */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-row gap-2 mb-3 pb-1"
      >
        {subparts.map((item) => {
          const isSelected = selectedAnatomyId === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => onSelectAnatomyId(isSelected ? null : item.id)}
              activeOpacity={0.7}
              className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border ${
                isSelected
                  ? 'bg-[#4A706A]/10 border-[#4A706A]'
                  : 'bg-white border-slate-200'
              }`}
            >
              {isSelected && <Check size={12} color="#4A706A" strokeWidth={2.5} />}
              <Text
                className={`text-xs font-medium ${
                  isSelected ? 'text-[#4A706A] font-bold' : 'text-slate-700'
                }`}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 3. Action Buttons for Selected Region */}
      <View className="pt-2 border-t border-slate-100 flex-row items-center justify-between">
        <View className="flex-1 pr-2">
          <Text className="text-[10px] text-slate-400 font-medium">Selected Location</Text>
          <Text className="text-xs font-bold text-[#141F1E]" numberOfLines={1}>
            {currentLabel}
          </Text>
        </View>

        <View className="flex-row gap-2">
          {exactPoint && (
            <View className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary-light border border-primary-subtle">
              <Crosshair size={13} color={theme.colors.primary.DEFAULT} strokeWidth={2} />
              <Text className="text-[11px] font-semibold text-primary">Pin Placed</Text>
            </View>
          )}

          {/* Add Finding Button */}
          <TouchableOpacity
            onPress={() => {
              const anatomyId = selectedAnatomyId || 'chest';
              const label =
                selectedAnatomyId && ANATOMY_DEFAULT_CENTERS[selectedAnatomyId]
                  ? ANATOMY_DEFAULT_CENTERS[selectedAnatomyId].label
                  : 'Chest';
              onOpenAddFinding(anatomyId, label);
            }}
            activeOpacity={0.7}
            className="flex-row items-center gap-1 bg-[#4A706A] px-3 py-1.5 rounded-lg shadow-xs"
          >
            <Plus size={14} color="#FFFFFF" strokeWidth={2.5} />
            <Text className="text-xs font-bold text-white">Add Finding</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

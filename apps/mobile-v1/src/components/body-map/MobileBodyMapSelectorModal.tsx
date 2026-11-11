import React from 'react';
import { View, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { Text } from '../ui/text';
import { useSheetBottomPadding } from '../../presentation/hooks/useSheetBottomPadding';
import { MobileAnatomySelector } from './MobileAnatomySelector';
import type { BodyMapViewType, ExactPointDTO } from '@repo/schema';

interface Props {
  visible: boolean;
  onClose: () => void;
  view: BodyMapViewType;
  selectedAnatomyId: string | null;
  onSelectAnatomyId: (id: string | null) => void;
  exactPoint: ExactPointDTO | null;
  onOpenAddFinding?: (anatomyId: string, label: string) => void;
}

export function MobileBodyMapSelectorModal({
  visible,
  onClose,
  view,
  selectedAnatomyId,
  onSelectAnatomyId,
  exactPoint,
  onOpenAddFinding,
}: Props) {
  const sheetBottomPadding = useSheetBottomPadding(12);
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <View
          className="bg-white rounded-t-3xl max-h-[75%] flex-1 pt-3 px-4"
          style={{ paddingBottom: sheetBottomPadding }}
        >
          <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
            <Text className="text-sm font-bold text-slate-800">Browse Anatomical Regions</Text>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
            >
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>
          <ScrollView className="flex-1 mt-2" showsVerticalScrollIndicator={false}>
            <MobileAnatomySelector
              view={view}
              selectedAnatomyId={selectedAnatomyId}
              onSelectAnatomyId={(id) => {
                onSelectAnatomyId(id);
                onClose();
              }}
              exactPoint={exactPoint}
              onOpenAddFinding={(id, label) => {
                onClose();
                onOpenAddFinding?.(id, label);
              }}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

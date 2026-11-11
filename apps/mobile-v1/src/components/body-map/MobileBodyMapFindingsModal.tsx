import React, { useEffect, useState } from 'react';
import { View, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { X, AlertCircle, History } from 'lucide-react-native';
import { Text } from '../ui/text';
import { useSheetBottomPadding } from '../../presentation/hooks/useSheetBottomPadding';
import { MobileActiveFindingsCard } from './MobileActiveFindingsCard';
import { MobileAssessmentHistoryCard } from './MobileAssessmentHistoryCard';
import type { BodyMapFindingItem, BodyMapAssessmentItem } from '../../presentation/hooks/useBodyMap';

export type FindingsModalTab = 'findings' | 'history';

interface Props {
  visible: boolean;
  initialTab?: FindingsModalTab;
  onClose: () => void;
  openFindings: BodyMapFindingItem[];
  resolvedCount: number;
  assessments: BodyMapAssessmentItem[];
  onSelectFinding: (finding: BodyMapFindingItem) => void;
}

export function MobileBodyMapFindingsModal({
  visible,
  initialTab = 'findings',
  onClose,
  openFindings,
  resolvedCount,
  assessments,
  onSelectFinding,
}: Props) {
  const sheetBottomPadding = useSheetBottomPadding(12);
  const [activeTab, setActiveTab] = useState<FindingsModalTab>(initialTab);

  // Reopening from the Findings or History dock button always starts on that tab.
  useEffect(() => {
    if (visible) setActiveTab(initialTab);
  }, [visible, initialTab]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <View
          className="bg-white rounded-t-3xl max-h-[82%] flex-1 pt-3 px-4"
          style={{ paddingBottom: sheetBottomPadding }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={() => setActiveTab('findings')}
                activeOpacity={0.7}
                className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                  activeTab === 'findings' ? 'bg-[#4A706A]/15' : 'bg-transparent'
                }`}
              >
                <AlertCircle
                  size={15}
                  color={activeTab === 'findings' ? '#4A706A' : '#64748B'}
                />
                <Text
                  className={`text-xs font-bold ${
                    activeTab === 'findings' ? 'text-[#4A706A]' : 'text-slate-500'
                  }`}
                >
                  Active Findings ({openFindings.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab('history')}
                activeOpacity={0.7}
                className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                  activeTab === 'history' ? 'bg-[#4A706A]/15' : 'bg-transparent'
                }`}
              >
                <History
                  size={15}
                  color={activeTab === 'history' ? '#4A706A' : '#64748B'}
                />
                <Text
                  className={`text-xs font-bold ${
                    activeTab === 'history' ? 'text-[#4A706A]' : 'text-slate-500'
                  }`}
                >
                  History ({assessments.length})
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
            >
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          <ScrollView className="flex-1 mt-3" showsVerticalScrollIndicator={false}>
            {activeTab === 'findings' ? (
              <MobileActiveFindingsCard
                openFindings={openFindings}
                resolvedCount={resolvedCount}
                onSelectFinding={(f) => {
                  onClose();
                  onSelectFinding(f);
                }}
              />
            ) : (
              <MobileAssessmentHistoryCard assessments={assessments} />
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

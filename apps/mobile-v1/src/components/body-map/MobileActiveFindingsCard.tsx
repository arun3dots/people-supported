import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import {
  AlertCircle,
  Camera,
  ChevronRight,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react-native';
import { Text } from '../ui/text';
import { Card } from '../ui/card';
import {
  SEVERITY_BG_LIGHT,
  FINDING_TYPE_COLORS,
} from './bodyMapConstants';
import type { BodyMapFindingItem } from '../../presentation/hooks/useBodyMap';
import { formatUkDate } from '../../lib/date';

interface Props {
  openFindings: BodyMapFindingItem[];
  resolvedCount: number;
  onSelectFinding: (finding: BodyMapFindingItem) => void;
}

export function MobileActiveFindingsCard({
  openFindings,
  resolvedCount,
  onSelectFinding,
}: Props) {
  return (
    <Card className="mb-4 p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs">
      {/* Header */}
      <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <View className="flex-row items-center gap-2">
          <View className="w-7 h-7 rounded-full bg-rose-50 items-center justify-center border border-rose-200">
            <ShieldAlert size={14} color="#EF4444" />
          </View>
          <View>
            <Text className="text-sm font-bold text-slate-800">
              Active Skin & Body Findings
            </Text>
            <Text className="text-[11px] text-slate-500">
              {openFindings.length} open · {resolvedCount} resolved
            </Text>
          </View>
        </View>

        <View className="px-2 py-0.5 rounded-full bg-rose-100">
          <Text className="text-[11px] font-bold text-rose-700">
            {openFindings.length} Active
          </Text>
        </View>
      </View>

      {/* Findings List */}
      {openFindings.length === 0 ? (
        <View className="items-center justify-center py-6">
          <CheckCircle2 size={32} color="#10B981" />
          <Text className="text-xs font-bold text-slate-700 mt-2">
            No Active Findings
          </Text>
          <Text className="text-[11px] text-slate-400 text-center mt-0.5 max-w-[220px]">
            No open pressure ulcers, tears, or wounds documented for this person supported.
          </Text>
        </View>
      ) : (
        <View className="gap-2.5">
          {openFindings.map((finding) => {
            const sevStyle =
              SEVERITY_BG_LIGHT[finding.severity] ||
              'bg-slate-50 border-slate-200 text-slate-700';
            const typeColor =
              FINDING_TYPE_COLORS[finding.findingType] || '#3B82F6';
            const formattedDate = finding.onsetDate
              ? formatUkDate(finding.onsetDate)
              : 'Recent';
            const photoCount = finding.photos?.length || 0;

            return (
              <TouchableOpacity
                key={finding.id}
                onPress={() => onSelectFinding(finding)}
                activeOpacity={0.7}
                className="p-3 rounded-lg border border-slate-200/80 bg-[#FAFBFB] flex-row items-center justify-between"
              >
                <View className="flex-1 pr-2">
                  <View className="flex-row items-center gap-1.5 mb-1">
                    <View
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: typeColor }}
                    />
                    <Text className="text-xs font-bold text-slate-800">
                      {finding.findingType}
                    </Text>
                    <Text className="text-[10px] text-slate-400 font-mono">
                      {finding.trackingId}
                    </Text>
                  </View>

                  <Text
                    className="text-xs font-semibold text-slate-700 mb-1"
                    numberOfLines={1}
                  >
                    {finding.locationLabel} ({finding.view})
                  </Text>

                  <View className="flex-row items-center gap-2">
                    <View
                      className={`px-1.5 py-0.5 rounded-sm border ${sevStyle}`}
                    >
                      <Text className="text-[10px] font-bold">
                        {finding.severity}
                      </Text>
                    </View>

                    <Text className="text-[10px] text-slate-400">
                      Onset: {formattedDate}
                    </Text>

                    {photoCount > 0 && (
                      <View className="flex-row items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded-sm">
                        <Camera size={10} color="#64748B" />
                        <Text className="text-[10px] text-slate-600 font-semibold">
                          {photoCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <ChevronRight size={16} color="#94A3B8" />
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </Card>
  );
}

import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { History, ChevronDown, ChevronUp, FileSpreadsheet } from 'lucide-react-native';
import { Text } from '../ui/text';
import { Card } from '../ui/card';
import type { BodyMapAssessmentItem } from '../../presentation/hooks/useBodyMap';
import { formatUkDate } from '../../lib/date';

interface Props {
  assessments: BodyMapAssessmentItem[];
}

export function MobileAssessmentHistoryCard({ assessments }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (assessments.length === 0) return null;

  return (
    <Card className="mb-4 p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs">
      <View className="flex-row items-center gap-2 pb-3 border-b border-slate-100 mb-2">
        <View className="w-7 h-7 rounded-full bg-slate-100 items-center justify-center border border-slate-200">
          <History size={14} color="#475569" />
        </View>
        <Text className="text-sm font-bold text-slate-800">
          Assessment History ({assessments.length})
        </Text>
      </View>

      <View className="gap-2">
        {assessments.map((a) => {
          const isExpanded = expandedId === a.id;
          const formattedDate = formatUkDate(a.assessedAt);
          const count = a.findings?.length || 0;

          return (
            <View
              key={a.id}
              className="rounded-lg border border-slate-200/80 bg-slate-50 overflow-hidden"
            >
              <TouchableOpacity
                onPress={() => setExpandedId(isExpanded ? null : a.id)}
                activeOpacity={0.7}
                className="p-3 flex-row items-center justify-between"
              >
                <View className="flex-1 pr-2">
                  <Text className="text-xs font-bold text-slate-800">
                    {formattedDate}
                  </Text>
                  <Text className="text-[11px] text-slate-500" numberOfLines={1}>
                    {a.notes || 'Clinical body map assessment'}
                  </Text>
                </View>

                <View className="flex-row items-center gap-2">
                  <View className="px-2 py-0.5 rounded-full bg-slate-200">
                    <Text className="text-[10px] font-bold text-slate-700">
                      {count} {count === 1 ? 'Finding' : 'Findings'}
                    </Text>
                  </View>
                  {isExpanded ? (
                    <ChevronUp size={16} color="#64748B" />
                  ) : (
                    <ChevronDown size={16} color="#64748B" />
                  )}
                </View>
              </TouchableOpacity>

              {isExpanded && a.findings && a.findings.length > 0 && (
                <View className="px-3 pb-3 pt-1 border-t border-slate-200/60 bg-white gap-1.5">
                  {a.findings.map((f) => (
                    <View
                      key={f.id}
                      className="flex-row items-center justify-between py-1 border-b border-slate-100 last:border-b-0"
                    >
                      <View className="flex-row items-center gap-1.5 flex-1">
                        <Text className="text-xs font-bold text-slate-800">
                          {f.findingType}
                        </Text>
                        <Text className="text-[11px] text-slate-500">
                          · {f.locationLabel}
                        </Text>
                      </View>
                      <View
                        className={`px-1.5 py-0.2 rounded-sm ${
                          f.status === 'Open' ? 'bg-amber-100' : 'bg-emerald-100'
                        }`}
                      >
                        <Text
                          className={`text-[9px] font-bold ${
                            f.status === 'Open' ? 'text-amber-800' : 'text-emerald-800'
                          }`}
                        >
                          {f.status}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </Card>
  );
}

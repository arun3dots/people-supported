import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { PlusSquare, HeartPulse, ClipboardList, Eye } from 'lucide-react-native';
import { Text } from '../ui/text';
import { Card } from '../ui/card';
import { cn } from '@/lib/utils';
import { formatUkRelativeDayAndTime } from '../../lib/date';
import type { ResidentDetailData, ResidentTimelineItem } from '../../presentation/hooks/useResidentDetail';

interface Props {
  resident: ResidentDetailData;
  timeline: ResidentTimelineItem[];
  activityError?: string | null;
  onRetry?: () => void;
}

export function ResidentActivitiesTimeline({
  resident,
  timeline,
  activityError,
  onRetry,
}: Props) {
  const [activityTab, setActivityTab] = useState<'recent' | 'upcoming'>('recent');

  const mappedActivities = [
    ...timeline.map((t) => {
      const { dateLabel, timeLabel } = formatUkRelativeDayAndTime(t.timestamp);
      const isAccessEvent = t.eventType === 'RESIDENT_RECORD_VIEWED';
      return {
        id: t.id,
        title: isAccessEvent
          ? 'Resident Profile Viewed'
          : t.eventType
              .replace(/_/g, ' ')
              .toLowerCase()
              .replace(/\b\w/g, (letter) => letter.toUpperCase()),
        summary: t.summary,
        carerName: t.carer?.fullName,
        timestamp: t.timestamp,
        dateLabel,
        timeLabel,
        type: isAccessEvent
          ? ('access' as const)
          : t.eventType.toLowerCase().includes('med')
            ? ('med' as const)
            : ('note' as const),
      };
    }),
    ...(resident.observations || []).map((o) => {
      const { dateLabel, timeLabel } = formatUkRelativeDayAndTime(o.timestamp);
      return {
        id: o.id,
        title: 'Vitals Recorded',
        summary: `BP: ${o.bpSystolic ?? '-'}/${o.bpDiastolic ?? '-'} mmHg, Pulse: ${o.pulse ?? '-'}bpm, Temp: ${o.temp ?? '-'}°C`,
        carerName: undefined,
        timestamp: o.timestamp,
        dateLabel,
        timeLabel,
        type: 'vitals' as const,
      };
    }),
  ];

  const activities = mappedActivities
    .sort(
      (first, second) =>
        new Date(second.timestamp).getTime() - new Date(first.timestamp).getTime()
    )
    .slice(0, 10);

  return (
    <View className="pb-6">
      <Text className="text-lg font-bold text-foreground mb-3">Activities</Text>

      {/* Tab Selection */}
      <View className="flex-row items-center gap-7 mb-4">
        <TouchableOpacity onPress={() => setActivityTab('recent')} activeOpacity={0.7}>
          <Text
            className={cn(
              'text-md',
              activityTab === 'recent' ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'
            )}
          >
            Recent Activities
          </Text>
          {activityTab === 'recent' && (
            <View className="h-0.5 bg-primary rounded-full mt-1.5 w-full" />
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setActivityTab('upcoming')} activeOpacity={0.7}>
          <Text
            className={cn(
              'text-md',
              activityTab === 'upcoming' ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'
            )}
          >
            Upcoming Activities
          </Text>
          {activityTab === 'upcoming' && (
            <View className="h-0.5 bg-primary rounded-full mt-1.5 w-full" />
          )}
        </TouchableOpacity>
      </View>

      {/* Activities Card */}
      <Card className="p-5">
        {activityError ? (
          <View className="mb-3 rounded-lg bg-amber-50 p-3">
            <Text className="text-xs text-amber-800">
              Activity history could not be refreshed. {activityError}
            </Text>
            {onRetry ? (
              <TouchableOpacity onPress={onRetry} activeOpacity={0.7} className="mt-2">
                <Text className="text-xs font-bold text-amber-900">Retry</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
        {activityTab === 'recent' ? (
          activities.length > 0 ? (
            activities.map((act, index) => {
              const isLast = index === activities.length - 1;

              return (
                <View key={act.id} className="flex-row items-start">
                  {/* Left: Icon & Connector Line */}
                  <View className="items-center mr-3.5">
                    <View
                      className={cn(
                        'w-9 h-9 rounded-full items-center justify-center',
                        act.type === 'med'
                          ? 'bg-[#E8F5E9]'
                          : act.type === 'access'
                            ? 'bg-[#E3F2FD]'
                          : act.type === 'vitals'
                            ? 'bg-[#E3F2FD]'
                            : 'bg-[#FFF3E0]'
                      )}
                    >
                      {act.type === 'med' ? (
                        <PlusSquare size={18} color="#2E7D32" />
                      ) : act.type === 'access' ? (
                        <Eye size={18} color="#1976D2" />
                      ) : act.type === 'vitals' ? (
                        <HeartPulse size={18} color="#1976D2" />
                      ) : (
                        <ClipboardList size={18} color="#D97706" />
                      )}
                    </View>
                    {!isLast && <View className="w-px bg-slate-300 flex-1 my-1.5" style={{ minHeight: 36 }} />}
                  </View>

                  {/* Middle: Content */}
                  <View className={cn('flex-1', !isLast ? 'pb-6' : 'pb-1')}>
                    <Text className="text-base font-bold text-[#141F1E] leading-snug">{act.title}</Text>
                    <Text className="text-xs text-slate-500 mt-1 leading-normal">
                      {act.summary}
                    </Text>
                    {act.carerName ? (
                      <Text className="text-xs font-semibold text-blue-600 mt-0.5">{act.carerName}</Text>
                    ) : null}
                  </View>

                  {/* Right: Date & Time */}
                  <View className="items-end pl-2 pt-0.5">
                    <Text className="text-xs text-slate-500 font-normal">{act.dateLabel}</Text>
                    <Text className="text-xs text-slate-500 font-normal mt-1">{act.timeLabel}</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <Text className="text-xs text-slate-500 text-center py-6">No recent clinical activities or notes recorded.</Text>
          )
        ) : (
          <Text className="text-xs text-slate-500 text-center py-6">No upcoming activities scheduled.</Text>
        )}
      </Card>
    </View>
  );
}

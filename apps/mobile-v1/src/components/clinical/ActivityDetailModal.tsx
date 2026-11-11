import React from 'react';
import { View, Modal, TouchableOpacity, Pressable, ScrollView } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import {
  X,
  PlusSquare,
  Activity,
  ClipboardList,
  Clock,
  User,
  HeartPulse,
  Pill,
  CheckCircle2,
  FileText,
  AlertCircle,
  ChevronRight,
} from 'lucide-react-native';
import { Text } from '../ui/text';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { theme } from '../../theme';

export interface FormattedActivity {
  id: string;
  title: string;
  summary: string;
  carerName?: string;
  timestamp: string;
  type: 'med' | 'vitals' | 'note' | 'scheduled' | 'fluid';
  status?: string;
  details?: {
    bp?: string;
    pulse?: number | string;
    temp?: number | string;
    spo2?: number | string;
    resp?: number | string;
    news2Score?: number;
    notes?: string;
    dosage?: string;
    instructions?: string;
    category?: string;
    fluidMl?: number;
  };
}

export interface ActivityDetailModalProps {
  activity: FormattedActivity | null;
  onClose: () => void;
  residentName: string;
}

function formatDetailTime(dateStr?: string | Date | null): string {
  if (!dateStr) return 'Recent contemporaneous entry';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function ActivityDetailModal({
  activity,
  onClose,
  residentName,
}: ActivityDetailModalProps) {
  const router = useRouter();

  if (!activity) return null;

  const isVitals = activity.type === 'vitals';
  const isMed = activity.type === 'med';
  const isScheduled = activity.type === 'scheduled';
  const isNote = activity.type === 'note';

  const formattedDate = formatDetailTime(activity.timestamp);

  const handleActionNavigation = (route: string) => {
    onClose();
    router.push(route as unknown as Href);
  };

  return (
    <Modal
      visible={Boolean(activity)}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        {/* Backdrop */}
        <Pressable className="absolute inset-0 bg-black/60" onPress={onClose} />

        {/* Modal Sheet */}
        <View className="bg-white rounded-t-3xl max-h-[85%] pb-7 border-t border-slate-100">
          {/* Drag Handle */}
          <View className="w-10 h-1 bg-[#D1DDD9] rounded-full self-center mt-2.5 mb-2" />

          {/* Header */}
          <View className="flex-row items-center justify-between px-5 pb-3 border-b border-slate-100">
            <View className="flex-row items-center gap-3 flex-1 mr-2">
              <View
                className={`w-10 h-10 rounded-xl items-center justify-center ${
                  isMed
                    ? 'bg-emerald-100'
                    : isVitals
                    ? 'bg-sky-100'
                    : isScheduled
                    ? 'bg-primary/10'
                    : 'bg-amber-100'
                }`}
              >
                {isMed ? (
                  <PlusSquare size={20} color="#1E755D" />
                ) : isVitals ? (
                  <Activity size={20} color="#0284C7" />
                ) : isScheduled ? (
                  <Clock size={20} color={theme.colors.primary.DEFAULT} />
                ) : (
                  <ClipboardList size={20} color="#D97706" />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-foreground" numberOfLines={1}>
                  {activity.title}
                </Text>
                <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                  {residentName}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
              onPress={onClose}
              activeOpacity={0.7}
              accessibilityLabel="Close activity details"
            >
              <X size={18} color="#5D5D5D" />
            </TouchableOpacity>
          </View>

          {/* Body Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20 }}
          >
            {/* Status & Timestamp Banner */}
            <View className="flex-row items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 mb-4">
              <View className="flex-row items-center gap-2">
                <Clock size={15} color="#5D6B66" />
                <Text className="text-xs font-semibold text-slate-700">{formattedDate}</Text>
              </View>
              <Badge
                variant={isScheduled ? 'outline' : 'clinicalSafe'}
                size="sm"
              >
                <Text
                  className={`text-[10px] font-bold ${
                    isScheduled ? 'text-primary' : 'text-[#1D5E2E]'
                  }`}
                >
                  {isScheduled ? 'Scheduled Care' : 'Contemporaneous Record'}
                </Text>
              </Badge>
            </View>

            {/* Clinical Carer Attestation */}
            {activity.carerName && (
              <View className="flex-row items-center gap-2.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 mb-4">
                <View className="w-7 h-7 rounded-full bg-emerald-200 items-center justify-center">
                  <User size={14} color="#1E755D" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-foreground">
                    Logged by {activity.carerName}
                  </Text>
                  <Text className="text-[10px] text-muted-foreground">
                    Verified care staff electronic signature
                  </Text>
                </View>
              </View>
            )}

            {/* Event Summary / Instructions */}
            <View className="mb-4">
              <Text className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                {isScheduled ? 'Care Activity Instructions' : 'Clinical Summary & Observations'}
              </Text>
              <View className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <Text className="text-xs text-foreground leading-relaxed">
                  {activity.summary}
                </Text>
              </View>
            </View>

            {/* Vital Signs Breakdown Grid (If Observation) */}
            {isVitals && activity.details && (
              <View className="mb-4">
                <Text className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Vital Parameters Recorded
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {activity.details.bp && (
                    <View className="flex-1 min-w-[45%] p-2.5 bg-sky-50/80 border border-sky-100 rounded-xl">
                      <Text className="text-[10px] text-muted-foreground">Blood Pressure</Text>
                      <Text className="text-sm font-bold text-foreground mt-0.5">
                        {activity.details.bp} mmHg
                      </Text>
                    </View>
                  )}
                  {activity.details.pulse && (
                    <View className="flex-1 min-w-[45%] p-2.5 bg-sky-50/80 border border-sky-100 rounded-xl">
                      <Text className="text-[10px] text-muted-foreground">Pulse / Heart Rate</Text>
                      <Text className="text-sm font-bold text-foreground mt-0.5">
                        {activity.details.pulse} bpm
                      </Text>
                    </View>
                  )}
                  {activity.details.temp && (
                    <View className="flex-1 min-w-[45%] p-2.5 bg-sky-50/80 border border-sky-100 rounded-xl">
                      <Text className="text-[10px] text-muted-foreground">Temperature</Text>
                      <Text className="text-sm font-bold text-foreground mt-0.5">
                        {activity.details.temp} °C
                      </Text>
                    </View>
                  )}
                  {activity.details.spo2 && (
                    <View className="flex-1 min-w-[45%] p-2.5 bg-sky-50/80 border border-sky-100 rounded-xl">
                      <Text className="text-[10px] text-muted-foreground">Oxygen Saturation</Text>
                      <Text className="text-sm font-bold text-foreground mt-0.5">
                        {activity.details.spo2} %
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Primary Action Button */}
            {isVitals && (
              <Button
                variant="clinical"
                size="default"
                className="w-full mb-2"
                leftIcon={<HeartPulse size={16} color="#FFFFFF" />}
                rightIcon={<ChevronRight size={16} color="#FFFFFF" />}
                onPress={() => handleActionNavigation('/(protected)/news2')}
              >
                Record New Observation (NEWS2)
              </Button>
            )}

            {isMed && (
              <Button
                variant="clinical"
                size="default"
                className="w-full mb-2"
                leftIcon={<Pill size={16} color="#FFFFFF" />}
                rightIcon={<ChevronRight size={16} color="#FFFFFF" />}
                onPress={() => handleActionNavigation('/(protected)/mar')}
              >
                Open eMAR Medication Chart
              </Button>
            )}

            {isScheduled && (
              <Button
                variant="clinical"
                size="default"
                className="w-full mb-2"
                leftIcon={<CheckCircle2 size={16} color="#FFFFFF" />}
                onPress={() => {
                  onClose();
                  router.push('/(protected)/tasks' as Href);
                }}
              >
                Sign Off & Complete Activity in Tasks
              </Button>
            )}

            {/* Close Button */}
            <Button
              variant="outline"
              size="default"
              className="w-full"
              onPress={onClose}
            >
              Close Activity Details
            </Button>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

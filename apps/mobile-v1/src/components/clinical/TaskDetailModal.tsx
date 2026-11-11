import React, { useState } from 'react';
import { View, Modal, TouchableOpacity, Pressable, TextInput } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { X, CheckCircle2, Check, User, ChevronRight } from 'lucide-react-native';
import { Text } from '../ui/text';
import { Button } from '../ui/button';
import { theme } from '../../theme/tokens';
import type { MobileTaskItem } from '../../presentation/hooks/useDailyTasks';

export interface TaskDetailModalProps {
  task: MobileTaskItem | null;
  onClose: () => void;
  onSignOff: (taskId: string, notes: string) => Promise<void>;
  isSubmitting: boolean;
}

export function TaskDetailModal({
  task,
  onClose,
  onSignOff,
  isSubmitting,
}: TaskDetailModalProps) {
  const router = useRouter();
  const [signOffNotes, setSignOffNotes] = useState('');

  if (!task) return null;

  const handleSignOffPress = async () => {
    await onSignOff(task.id, signOffNotes);
    setSignOffNotes('');
  };

  const handleOpenResident = () => {
    if (!task.residentId) return;
    onClose();
    router.push({
      pathname: '/(protected)/resident-details',
      params: { id: task.residentId },
    } as unknown as Href);
  };

  const locationLabel = task.locationDisplay || task.roomDisplay || 'Room unassigned';

  return (
    <Modal
      visible={Boolean(task)}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/50" onPress={onClose} />
        <View className="bg-white rounded-t-3xl p-5 pb-8 border-t border-border">
          <View className="w-10 h-1 bg-[#D1DDD9] rounded-full self-center mb-3" />

          {/* Modal Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-border/50">
            <View className="flex-1 mr-2">
              <Text className="text-lg font-bold text-foreground">{task.title}</Text>
              <Text className="text-xs text-muted-foreground mt-0.5">
                {task.time} • {task.residentName} · {locationLabel}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-secondary items-center justify-center"
              accessibilityLabel="Close task modal"
            >
              <X size={18} color="#5D5D5D" />
            </TouchableOpacity>
          </View>

          {/* Instructions */}
          <View className="py-3">
            <Text className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
              Care Intervention Instruction
            </Text>
            <Text className="text-sm text-foreground leading-relaxed">
              {task.description || 'Routine scheduled task for resident.'}
            </Text>
          </View>

          {/* Completion Status or Sign-off Form */}
          {task.status === 'Completed' ? (
            <View className="flex-row items-center gap-2 bg-[#E8F7EE] p-3 rounded-xl mt-2 mb-3">
              <CheckCircle2 size={18} color="#1E854A" />
              <Text className="text-xs font-semibold text-[#1E854A]">
                Task signed off and completed at {task.completedAt || task.time}
              </Text>
            </View>
          ) : (
            <>
              <View className="mb-4">
                <Text className="text-xs font-semibold text-muted-foreground mb-1.5">
                  Carer Observation / Handover Notes (Optional)
                </Text>
                <TextInput
                  value={signOffNotes}
                  onChangeText={setSignOffNotes}
                  placeholder="e.g. Resident completed without distress, good fluid intake..."
                  placeholderTextColor="#9CA3AF"
                  style={{ fontFamily: theme.fonts.regular }}
                  className="border border-border rounded-xl p-3 text-xs text-foreground bg-[#F9FAFA]"
                  multiline
                  numberOfLines={2}
                />
              </View>

              <Button
                variant="clinical"
                size="default"
                className="w-full mb-2"
                loading={isSubmitting}
                disabled={isSubmitting}
                leftIcon={<Check size={18} color="#FFFFFF" />}
                onPress={handleSignOffPress}
              >
                Sign Off & Complete Task
              </Button>
            </>
          )}

          {/* View Resident Profile Link */}
          {task.residentId && (
            <Button
              variant="outline"
              size="default"
              className="w-full mt-1 border-slate-200"
              leftIcon={<User size={15} color="#1E755D" />}
              rightIcon={<ChevronRight size={15} color="#64748B" />}
              onPress={handleOpenResident}
            >
              View {task.residentName}'s Full Profile
            </Button>
          )}
        </View>
      </View>
    </Modal>
  );
}

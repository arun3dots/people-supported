import React, { useState, useEffect } from 'react';
import {
  View,
  Modal,
  Pressable,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { X } from 'lucide-react-native';
import { Text } from '../ui/text';
import { theme } from '../../theme';
import type { MobileTaskItem } from '../../presentation/hooks/useDailyTasks';

export interface LogTaskModalSubmitData {
  status: 'Completed' | 'Skipped';
  notes?: string;
  skipReason?: string;
}

export interface TaskSignOffModalProps {
  task: MobileTaskItem | null;
  isOpen?: boolean;
  onClose: () => void;
  onSignOff?: (taskId: string, notes: string) => Promise<void>;
  onSubmit?: (data: LogTaskModalSubmitData) => Promise<void>;
  isPending?: boolean;
}

export const TaskSignOffModal: React.FC<TaskSignOffModalProps> = ({
  task,
  isOpen = true,
  onClose,
  onSignOff,
  onSubmit,
  isPending = false,
}) => {
  const [status, setStatus] = useState<'Completed' | 'Skipped'>('Completed');
  const [notes, setNotes] = useState('');
  const [skipReason, setSkipReason] = useState('');
  const [localSubmitting, setLocalSubmitting] = useState(false);

  useEffect(() => {
    if (task) {
      setStatus('Completed');
      setNotes(task.notes || '');
      setSkipReason(task.skipReason || '');
    }
  }, [task]);

  if (!task || !isOpen) return null;

  const submitting = isPending || localSubmitting;
  const isSkipMissingReason = status === 'Skipped' && !skipReason.trim();

  const handleSave = async () => {
    if (isSkipMissingReason || submitting) return;

    try {
      setLocalSubmitting(true);
      if (onSubmit) {
        await onSubmit({
          status,
          notes: notes.trim() || undefined,
          skipReason: status === 'Skipped' ? skipReason.trim() : undefined,
        });
      } else if (onSignOff) {
        await onSignOff(task.id, notes.trim());
      }
      onClose();
    } finally {
      setLocalSubmitting(false);
    }
  };

  return (
    <Modal
      visible={Boolean(task && isOpen)}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-center items-center px-4"
      >
        {/* Backdrop */}
        <Pressable className="absolute inset-0 bg-black/60" onPress={onClose} />

        {/* Modal Surface Box */}
        <View className="bg-white rounded-3xl p-5 shadow-2xl w-full max-w-lg border border-slate-100 z-10">
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* 1. Header with Close Button */}
            <View className="flex-row items-start justify-between pb-3 border-b border-slate-100">
              <View className="flex-1 mr-2">
                <Text className="text-lg font-bold text-foreground leading-snug">
                  Log Task Activity
                </Text>
                <Text className="text-xs text-muted-foreground mt-1 leading-4">
                  Record care delivery or skip status for{' '}
                  <Text className="font-bold text-foreground">
                    {task.residentName || 'person supported'}
                  </Text>
                  :{' '}
                  <Text className="font-semibold text-foreground">
                    {task.title}
                  </Text>
                </Text>
              </View>

              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.7}
                className="w-8 h-8 rounded-full bg-surface items-center justify-center -mt-1 -mr-1"
              >
                <X size={17} color="#5D5D5D" />
              </TouchableOpacity>
            </View>

            {/* 2. Outcome Toggle (Mark Completed vs Skip / Hand Over) */}
            <View className="pt-4 gap-1.5">
              <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Outcome
              </Text>
              <View className="flex-row items-center gap-2">
                {/* Completed Button */}
                <TouchableOpacity
                  onPress={() => setStatus('Completed')}
                  activeOpacity={0.8}
                  className={`flex-1 py-2.5 px-3 rounded-xl border items-center justify-center ${
                    status === 'Completed'
                      ? 'bg-primary border-primary'
                      : 'bg-surface border-transparent'
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      status === 'Completed'
                        ? 'text-white font-bold'
                        : 'text-foreground font-semibold'
                    }`}
                  >
                    Mark Completed
                  </Text>
                </TouchableOpacity>

                {/* Skip / Hand Over Button */}
                <TouchableOpacity
                  onPress={() => setStatus('Skipped')}
                  activeOpacity={0.8}
                  className={`flex-1 py-2.5 px-3 rounded-xl border items-center justify-center ${
                    status === 'Skipped'
                      ? 'bg-clinical-criticalBg border-clinical-critical'
                      : 'bg-surface border-transparent'
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      status === 'Skipped'
                        ? 'text-clinical-critical font-bold'
                        : 'text-foreground font-semibold'
                    }`}
                  >
                    Skip / Hand Over
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 3. Conditional Skip Reason Input */}
            {status === 'Skipped' && (
              <View className="pt-3.5 gap-1.5">
                <Text className="text-sm font-semibold text-foreground">
                  Reason for Skipping{' '}
                  <Text className="text-clinical-critical font-bold">*</Text>
                </Text>
                <TextInput
                  placeholder="e.g. Asleep, refused, away at appointment..."
                  placeholderTextColor="#8E8E93"
                  value={skipReason}
                  onChangeText={setSkipReason}
                  style={{ fontFamily: theme.fonts.regular }}
                  className="border border-slate-200 rounded-xl p-3 text-md text-foreground bg-surface"
                />
              </View>
            )}

            {/* 4. Observation & Care Notes */}
            <View className="pt-3.5 gap-1.5">
              <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Observation & Care Notes
              </Text>
              <TextInput
                placeholder="Record details (e.g. Completed with 1 carer, good fluid intake, responsive)..."
                placeholderTextColor="#8E8E93"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                style={{ fontFamily: theme.fonts.regular }}
                className="border border-slate-200 rounded-xl p-3 text-md text-foreground bg-surface min-h-[88px]"
              />
            </View>

            {/* 5. Footer Buttons */}
            <View className="flex-row items-center justify-end gap-2.5 pt-5 mt-3 border-t border-slate-100">
              <TouchableOpacity
                onPress={onClose}
                disabled={submitting}
                activeOpacity={0.7}
                className="px-4 py-2.5 rounded-full bg-surface"
              >
                <Text className="text-sm font-semibold text-foreground">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSave}
                disabled={submitting || isSkipMissingReason}
                activeOpacity={0.8}
                className={`px-5 py-2.5 rounded-full items-center justify-center flex-row gap-2 ${
                  submitting || isSkipMissingReason
                    ? 'bg-slate-200'
                    : 'bg-primary'
                }`}
              >
                {submitting && (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                )}
                <Text
                  className={`text-sm font-bold ${
                    submitting || isSkipMissingReason
                      ? 'text-slate-400'
                      : 'text-white'
                  }`}
                >
                  {submitting ? 'Saving...' : 'Mark Task Complete'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export const LogTaskModal = TaskSignOffModal;
export const LogTaskDialog = TaskSignOffModal;

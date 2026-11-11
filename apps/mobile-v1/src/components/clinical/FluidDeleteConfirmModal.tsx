import React from 'react';
import { View, Modal, TouchableOpacity } from 'react-native';
import { Trash2, X } from 'lucide-react-native';
import { Text, Button } from '../../presentation/components/common';

interface FluidDeleteConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function FluidDeleteConfirmModal({
  visible,
  onClose,
  onConfirm,
  isPending,
}: FluidDeleteConfirmModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/55 items-center justify-center px-5">
        <View className="w-full max-w-sm bg-white rounded-3xl p-5 border border-slate-100">
          <View className="flex-row items-center justify-between pb-3 mb-2 border-b border-slate-100">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-full bg-clinical-criticalBg items-center justify-center">
                <Trash2 size={15} color="#FF3B2F" />
              </View>
              <Text className="text-lg font-bold text-foreground">Delete Intake Entry?</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              disabled={isPending}
              className="w-8 h-8 rounded-full bg-surface items-center justify-center"
              accessibilityLabel="Close dialog"
            >
              <X size={16} color="#5D5D5D" />
            </TouchableOpacity>
          </View>

          <Text className="text-sm text-muted-foreground leading-5 mb-4">
            Are you sure you want to delete this intake entry? This action will remove the record from daily hydration calculations and will be logged in the audit trail.
          </Text>

          <View className="flex-row gap-2.5">
            <Button
              variant="outline"
              className="flex-1"
              onPress={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onPress={onConfirm}
              disabled={isPending}
            >
              {isPending ? 'Deleting...' : 'Delete Entry'}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}


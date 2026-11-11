import React from 'react';
import { View, Modal, TouchableOpacity } from 'react-native';
import { Laptop } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import type { AdminPromptInfo } from '@/presentation/context/AuthContext';

interface AdminRedirectionModalProps {
  adminPrompt: AdminPromptInfo | null;
  onDismiss: () => void;
}

export function AdminRedirectionModal({
  adminPrompt,
  onDismiss,
}: AdminRedirectionModalProps) {
  return (
    <Modal
      visible={!!adminPrompt}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View className="flex-1 bg-black/60 items-center justify-center p-6">
        <View className="w-full max-w-[380px] bg-white rounded-3xl p-6 items-center">
          <View className="h-16 w-16 rounded-full bg-clinical-warningBg items-center justify-center mb-3">
            <Laptop size={32} color="#D97706" />
          </View>

          <View className="px-3 py-1 rounded-full bg-clinical-warningBg mb-3">
            <Text className="text-xs font-bold text-clinical-warning">Web Portal Required</Text>
          </View>

          <Text className="text-lg font-bold text-text-primary text-center mb-2">
            Please Use the Web Application
          </Text>

          <Text className="text-xs text-text-secondary text-center mb-4 leading-5">
            You have signed in with an{' '}
            <Text className="font-bold text-text-primary">{adminPrompt?.roleName || 'Admin'}</Text>{' '}
            account ({adminPrompt?.userEmail}).
          </Text>

          <View className="w-full bg-surface rounded-2xl p-4 mb-5">
            <Text className="text-xs font-bold text-primary mb-1">
              Mobile App Scope:
            </Text>
            <Text className="text-xs text-text-primary leading-4 mb-2">
              This mobile application is solely dedicated to <Text className="font-bold">Carers</Text> and <Text className="font-bold">Nurses</Text> on active duty for real-time bedside tasks, observations, and medication logs.
            </Text>
            <Text className="text-xs text-text-secondary">
              Please access the administrative dashboard from a computer browser at <Text className="font-semibold text-primary">carehome.app</Text>.
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onDismiss}
            className="w-full h-[48px] rounded-full bg-primary items-center justify-center"
          >
            <Text className="text-sm font-bold text-white">Return to Staff Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

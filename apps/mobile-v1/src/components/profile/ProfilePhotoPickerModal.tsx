import React from 'react';
import { View, Modal, TouchableOpacity, Platform } from 'react-native';
import { Camera, Image as ImageIcon, X } from 'lucide-react-native';
import { Text } from '../ui/text';

interface ProfilePhotoPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectSource: (source: 'camera' | 'gallery') => void;
}

export function ProfilePhotoPickerModal({
  visible,
  onClose,
  onSelectSource,
}: ProfilePhotoPickerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end sm:justify-center px-4 pb-6 sm:pb-0">
        <View className="bg-white rounded-2xl p-5 shadow-xl">
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className="text-base font-bold text-text-primary">Update Profile Photo</Text>
              <Text className="text-xs text-text-secondary mt-0.5">
                JPG, PNG, or WEBP up to 5MB
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-1">
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View className="gap-2.5">
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => {
                onClose();
                if (Platform.OS === 'web') {
                  onSelectSource('camera');
                } else {
                  setTimeout(() => onSelectSource('camera'), 100);
                }
              }}
              className="flex-row items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200"
            >
              <View className="w-10 h-10 rounded-full bg-primary-light items-center justify-center">
                <Camera size={20} color="#4A706A" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-text-primary">Take Photo</Text>
                <Text className="text-xs text-text-secondary">Use camera to capture staff photo</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => {
                onClose();
                if (Platform.OS === 'web') {
                  onSelectSource('gallery');
                } else {
                  setTimeout(() => onSelectSource('gallery'), 100);
                }
              }}
              className="flex-row items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200"
            >
              <View className="w-10 h-10 rounded-full bg-primary-light items-center justify-center">
                <ImageIcon size={20} color="#4A706A" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-text-primary">Choose from Gallery</Text>
                <Text className="text-xs text-text-secondary">Select an existing photo from device</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}


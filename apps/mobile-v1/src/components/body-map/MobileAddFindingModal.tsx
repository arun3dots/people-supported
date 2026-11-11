import React, { useState } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Check, AlertCircle, Camera, Image as ImageIcon, Trash2 } from 'lucide-react-native';
import { Text } from '../ui/text';
import { useSheetBottomPadding } from '../../presentation/hooks/useSheetBottomPadding';
import { theme } from '../../theme/tokens';
import {
  BODY_MAP_FINDING_TYPES,
  BODY_MAP_SEVERITIES,
  FINDING_TYPE_COLORS,
} from './bodyMapConstants';
import type { ExactPointDTO, BodyMapViewType, BodyMapVariantType } from '@repo/schema';
import { getUkDateString } from '../../lib/date';
import {
  PickedMobileFile,
  pickImageFromCamera,
  pickImageFromGallery,
} from '../../lib/fileUpload';

export interface PendingMobileFinding {
  view: BodyMapViewType;
  bodyMapVariant: BodyMapVariantType;
  anatomyId: string;
  locationLabel: string;
  exactPoint?: ExactPointDTO;
  findingType: (typeof BODY_MAP_FINDING_TYPES)[number];
  severity: (typeof BODY_MAP_SEVERITIES)[number];
  onsetDate: string;
  description?: string;
  photos?: PickedMobileFile[];
}

interface Props {
  visible: boolean;
  onClose: () => void;
  view: BodyMapViewType;
  variant: BodyMapVariantType;
  anatomyId: string;
  locationLabel: string;
  exactPoint: ExactPointDTO | null;
  onSubmit: (finding: PendingMobileFinding) => Promise<void>;
  isSubmitting: boolean;
}

export function MobileAddFindingModal({
  visible,
  onClose,
  view,
  variant,
  anatomyId,
  locationLabel,
  exactPoint,
  onSubmit,
  isSubmitting,
}: Props) {
  const sheetBottomPadding = useSheetBottomPadding(20);
  const [findingType, setFindingType] =
    useState<(typeof BODY_MAP_FINDING_TYPES)[number]>('Pressure Injury');
  const [severity, setSeverity] =
    useState<(typeof BODY_MAP_SEVERITIES)[number]>('Moderate');
  const [onsetDate] = useState<string>(getUkDateString(new Date()));
  const [description, setDescription] = useState<string>('');
  const [photos, setPhotos] = useState<PickedMobileFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleCamera = async () => {
    setError(null);
    try {
      const picked = await pickImageFromCamera(5);
      if (picked) setPhotos((prev) => [...prev, picked]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to capture photo');
    }
  };

  const handleGallery = async () => {
    setError(null);
    try {
      const picked = await pickImageFromGallery(5);
      if (picked) setPhotos((prev) => [...prev, picked]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to select photo');
    }
  };

  const handleSave = async () => {
    setError(null);
    if (!locationLabel) {
      setError('Anatomical location label is required');
      return;
    }

    try {
      await onSubmit({
        view,
        bodyMapVariant: variant,
        anatomyId,
        locationLabel,
        exactPoint: exactPoint || undefined,
        findingType,
        severity,
        onsetDate: onsetDate || getUkDateString(new Date()),
        description: description.trim() || undefined,
        photos: photos.length > 0 ? photos : undefined,
      });
      setDescription('');
      setPhotos([]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save finding');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-black/50 justify-end"
      >
        <View
          className="bg-white rounded-t-3xl max-h-[88%] px-5 pt-5 shadow-xl"
          style={{ paddingBottom: sheetBottomPadding }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <View>
              <Text className="text-lg font-bold text-text-primary">Document Body Finding</Text>
              <Text className="text-xs text-text-secondary">
                {locationLabel} · {view} View
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              disabled={isSubmitting}
              activeOpacity={0.7}
              className="w-8 h-8 rounded-full bg-surface items-center justify-center"
            >
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="space-y-4">
            {error && (
              <View className="flex-row items-center gap-1.5 p-2.5 rounded-lg bg-rose-50 border border-rose-200 mb-2">
                <AlertCircle size={14} color="#EF4444" />
                <Text className="text-xs text-rose-700 font-medium flex-1">{error}</Text>
              </View>
            )}

            {/* 1. Finding Type Selection */}
            <View className="mb-3">
              <Text className="text-xs font-bold text-slate-700 mb-2">Finding Type *</Text>
              <View className="flex-row flex-wrap gap-2">
                {BODY_MAP_FINDING_TYPES.map((type) => {
                  const isSelected = findingType === type;
                  const color = FINDING_TYPE_COLORS[type] || '#3B82F6';
                  return (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setFindingType(type)}
                      activeOpacity={0.7}
                      className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border ${
                        isSelected
                          ? 'bg-slate-900 border-slate-900'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <View className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      <Text
                        className={`text-xs font-semibold ${
                          isSelected ? 'text-white' : 'text-slate-700'
                        }`}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 2. Severity Selection */}
            <View className="mb-3">
              <Text className="text-xs font-bold text-slate-700 mb-2">Severity Grade *</Text>
              <View className="flex-row gap-2">
                {BODY_MAP_SEVERITIES.map((sev) => {
                  const isSelected = severity === sev;
                  return (
                    <TouchableOpacity
                      key={sev}
                      onPress={() => setSeverity(sev)}
                      activeOpacity={0.7}
                      className={`flex-1 py-2 rounded-lg items-center justify-center border ${
                        isSelected
                          ? 'border-slate-800 bg-slate-900'
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          isSelected ? 'text-white' : 'text-slate-700'
                        }`}
                      >
                        {sev}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 3. Clinical Observation / Description */}
            <View className="mb-3">
              <Text className="text-xs font-bold text-slate-700 mb-1.5">
                Clinical Description & Observations
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Describe size, redness, exudate, dressing, or skin integrity..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                style={{ fontFamily: theme.fonts.regular }}
                className="p-3 bg-surface rounded-xl text-xs text-text-primary min-h-[75px]"
              />
            </View>

            {/* 4. Clinical Photographs (Uploaded to AWS S3) */}
            <View className="mb-3">
              <Text className="text-xs font-bold text-slate-700 mb-1.5">
                Clinical Photographs (Optional • Max 5MB)
              </Text>
              <View className="flex-row gap-2 mb-2">
                <TouchableOpacity
                  onPress={() => void handleCamera()}
                  disabled={isSubmitting}
                  activeOpacity={0.7}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-dashed border-[#4A706A]/40 bg-[#F4F8F7] flex-row items-center justify-center gap-1.5"
                >
                  <Camera size={15} color="#4A706A" />
                  <Text className="text-xs font-bold text-[#4A706A]">Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => void handleGallery()}
                  disabled={isSubmitting}
                  activeOpacity={0.7}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-dashed border-[#4A706A]/40 bg-[#F4F8F7] flex-row items-center justify-center gap-1.5"
                >
                  <ImageIcon size={15} color="#4A706A" />
                  <Text className="text-xs font-bold text-[#4A706A]">Gallery</Text>
                </TouchableOpacity>
              </View>

              {photos.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {photos.map((p) => (
                    <View key={p.id} className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 relative">
                      <Image source={{ uri: p.uri }} className="w-full h-full" resizeMode="cover" />
                      <TouchableOpacity
                        onPress={() => setPhotos((prev) => prev.filter((x) => x.id !== p.id))}
                        className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-1"
                      >
                        <Trash2 size={10} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* 5. Action Buttons */}
            <View className="pt-2 flex-row gap-2.5">
              <TouchableOpacity
                onPress={onClose}
                disabled={isSubmitting}
                activeOpacity={0.7}
                className="flex-1 py-3 rounded-xl border border-slate-200 items-center justify-center bg-slate-100"
              >
                <Text className="text-xs font-bold text-slate-600">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => void handleSave()}
                disabled={isSubmitting}
                activeOpacity={0.7}
                className="flex-1 py-3 rounded-xl bg-[#4A706A] items-center justify-center shadow-xs flex-row gap-1.5"
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
                    <Text className="text-xs font-bold text-white">Save Finding</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

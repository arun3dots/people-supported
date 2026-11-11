import React, { useState } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  X,
  CheckCircle2,
  Clock,
  FileText,
  Camera,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react-native';
import { Text } from '../ui/text';
import { AuthenticatedImage } from '../common/AuthenticatedImage';
import { useSheetBottomPadding } from '../../presentation/hooks/useSheetBottomPadding';
import { theme } from '../../theme/tokens';
import { SEVERITY_BG_LIGHT } from './bodyMapConstants';
import type { BodyMapFindingItem } from '../../presentation/hooks/useBodyMap';
import { getApiBaseUrl } from '../../data/api/client';
import { formatUkDate } from '../../lib/date';
import {
  PickedMobileFile,
  pickImageFromCamera,
  pickImageFromGallery,
} from '../../lib/fileUpload';

interface Props {
  visible: boolean;
  onClose: () => void;
  finding: BodyMapFindingItem | null;
  onResolve: (findingId: string, resolutionNote: string) => Promise<void>;
  isResolving: boolean;
  onUploadPhoto?: (findingId: string, file: PickedMobileFile) => Promise<unknown>;
  isUploadingPhoto?: boolean;
}

export function MobileFindingDetailModal({
  visible,
  onClose,
  finding,
  onResolve,
  isResolving,
  onUploadPhoto,
  isUploadingPhoto = false,
}: Props) {
  const sheetBottomPadding = useSheetBottomPadding(20);
  const [resolutionNote, setResolutionNote] = useState('');
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!finding) return null;

  const isOpen = finding.status === 'Open';
  const sevStyle =
    SEVERITY_BG_LIGHT[finding.severity] ||
    'bg-slate-50 border-slate-200 text-slate-700';
  const formattedOnset = finding.onsetDate
    ? formatUkDate(finding.onsetDate)
    : 'Not recorded';

  const handleConfirmResolve = async () => {
    setError(null);
    try {
      await onResolve(finding.id, resolutionNote.trim());
      setShowResolveForm(false);
      setResolutionNote('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve finding');
    }
  };

  const handlePickAndUpload = async (source: 'camera' | 'gallery') => {
    if (!onUploadPhoto) return;
    setError(null);
    try {
      const picked =
        source === 'camera'
          ? await pickImageFromCamera(5)
          : await pickImageFromGallery(5);
      if (picked) {
        await onUploadPhoto(finding.id, picked);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to upload clinical photo');
    }
  };

  const apiBase = getApiBaseUrl();
  const photos = finding.photos ?? [];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-black/50 justify-end"
      >
        <View
          className="bg-white rounded-t-3xl max-h-[85%] px-5 pt-5 shadow-xl"
          style={{ paddingBottom: sheetBottomPadding }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <View>
              <View className="flex-row items-center gap-2 mb-0.5">
                <Text className="text-lg font-bold text-text-primary">{finding.findingType}</Text>
                <Text className="text-xs text-text-muted">{finding.trackingId}</Text>
              </View>
              <Text className="text-xs text-text-secondary">
                {finding.locationLabel} · {finding.view} View
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              disabled={isResolving || isUploadingPhoto}
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

            {/* Status & Severity Bar */}
            <View className="flex-row items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 mb-3">
              <View className="flex-row items-center gap-2">
                <View
                  className={`px-2.5 py-1 rounded-full border ${
                    isOpen ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      isOpen ? 'text-amber-800' : 'text-emerald-800'
                    }`}
                  >
                    {isOpen ? 'Active Finding' : 'Resolved'}
                  </Text>
                </View>

                <View className={`px-2.5 py-1 rounded-full border ${sevStyle}`}>
                  <Text className="text-xs font-bold">{finding.severity} Severity</Text>
                </View>
              </View>

              <View className="flex-row items-center gap-1">
                <Clock size={12} color="#94A3B8" />
                <Text className="text-[11px] text-slate-500">{formattedOnset}</Text>
              </View>
            </View>

            {/* Clinical Description */}
            <View className="mb-3">
              <View className="flex-row items-center gap-1.5 mb-1.5">
                <FileText size={14} color="#64748B" />
                <Text className="text-xs font-bold text-slate-700">
                  Clinical Notes & Observation
                </Text>
              </View>
              <View className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <Text className="text-xs text-slate-700 leading-relaxed">
                  {finding.description || 'No specific clinical description documented.'}
                </Text>
              </View>
            </View>

            {/* Resolved Info */}
            {!isOpen && (
              <View className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 mb-3">
                <View className="flex-row items-center gap-1.5 mb-1">
                  <CheckCircle2 size={14} color="#059669" />
                  <Text className="text-xs font-bold text-emerald-800">
                    Clinical Resolution Documented
                  </Text>
                </View>
                <Text className="text-xs text-emerald-900 mt-0.5">
                  {finding.resolutionNote || 'Condition resolved.'}
                </Text>
              </View>
            )}

            {/* Clinical Photographs Stream & Upload */}
            <View className="mb-3">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-1.5">
                  <Camera size={14} color="#4A706A" />
                  <Text className="text-xs font-bold text-slate-700">
                    Clinical Photographs ({photos.length})
                  </Text>
                </View>
                {isUploadingPhoto && <ActivityIndicator size="small" color="#4A706A" />}
              </View>

              {photos.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mb-2.5"
                  contentContainerStyle={{ gap: 8 }}
                >
                  {photos.map((photo) => (
                    <View
                      key={photo.id}
                      className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 border border-slate-200"
                    >
                      <AuthenticatedImage
                        uri={`${apiBase}/body-map-photos/${photo.id}/stream`}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    </View>
                  ))}
                </ScrollView>
              )}

              {isOpen && Boolean(onUploadPhoto) && (
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => void handlePickAndUpload('camera')}
                    disabled={isUploadingPhoto}
                    activeOpacity={0.7}
                    className="flex-1 py-2 px-3 rounded-xl border border-dashed border-[#4A706A]/40 bg-[#F4F8F7] flex-row items-center justify-center gap-1.5"
                  >
                    <Camera size={14} color="#4A706A" />
                    <Text className="text-xs font-bold text-[#4A706A]">Take Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => void handlePickAndUpload('gallery')}
                    disabled={isUploadingPhoto}
                    activeOpacity={0.7}
                    className="flex-1 py-2 px-3 rounded-xl border border-dashed border-[#4A706A]/40 bg-[#F4F8F7] flex-row items-center justify-center gap-1.5"
                  >
                    <ImageIcon size={14} color="#4A706A" />
                    <Text className="text-xs font-bold text-[#4A706A]">Upload Photo</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Resolution Form or Action */}
            {isOpen && (
              <View className="pt-2 border-t border-slate-100">
                {!showResolveForm ? (
                  <TouchableOpacity
                    onPress={() => setShowResolveForm(true)}
                    activeOpacity={0.7}
                    className="w-full py-3 rounded-xl bg-emerald-600 items-center justify-center flex-row gap-2 shadow-xs"
                  >
                    <CheckCircle2 size={16} color="#FFFFFF" strokeWidth={2.5} />
                    <Text className="text-xs font-bold text-white">Mark as Resolved</Text>
                  </TouchableOpacity>
                ) : (
                  <View className="space-y-3">
                    <Text className="text-xs font-bold text-slate-800">Resolution Note *</Text>
                    <TextInput
                      value={resolutionNote}
                      onChangeText={setResolutionNote}
                      placeholder="e.g. Healed, dressing discontinued, skin intact..."
                      placeholderTextColor="#94A3B8"
                      multiline
                      numberOfLines={2}
                      style={{ fontFamily: theme.fonts.regular }}
                      className="p-3 bg-surface rounded-xl text-xs text-text-primary"
                    />

                    <View className="flex-row gap-2 pt-1">
                      <TouchableOpacity
                        onPress={() => setShowResolveForm(false)}
                        disabled={isResolving}
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 items-center justify-center bg-slate-100"
                      >
                        <Text className="text-xs font-bold text-slate-600">Cancel</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => void handleConfirmResolve()}
                        disabled={isResolving}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 items-center justify-center flex-row gap-1.5 shadow-xs"
                      >
                        {isResolving ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text className="text-xs font-bold text-white">Confirm Resolution</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

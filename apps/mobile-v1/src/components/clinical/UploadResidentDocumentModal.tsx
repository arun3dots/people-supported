import React, { useState } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Upload, Camera, Image as ImageIcon, FileText, Trash2, AlertCircle } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { UPLOAD_RESIDENT_DOCUMENT } from '@repo/endpoints';
import { Text, Button } from '../../presentation/components/common';
import { makeMobileApiCall } from '../../data/api/client';
import {
  PickedMobileFile,
  pickImageFromCamera,
  pickDocumentOrImageFile,
  appendFileToFormData,
  formatBytes,
} from '../../lib/fileUpload';
import { RESIDENT_DOCUMENT_CATEGORIES } from './residentDocuments.types';
import { supportPlanLabel } from '../../lib/supportPlanLabel';

interface UploadResidentDocumentModalProps {
  visible: boolean;
  residentId: string;
  onClose: () => void;
}

export function UploadResidentDocumentModal({
  visible,
  residentId,
  onClose,
}: UploadResidentDocumentModalProps) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [category, setCategory] = useState<string>('General');
  const [selectedFile, setSelectedFile] = useState<PickedMobileFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resetAndClose = () => {
    if (isUploading) return;
    setSelectedFile(null);
    setCategory('General');
    setErrorMsg(null);
    onClose();
  };

  const handleCameraPick = async () => {
    setErrorMsg(null);
    try {
      const picked = await pickImageFromCamera(10);
      if (picked) setSelectedFile(picked);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to capture photo.');
    }
  };

  const handleFilePick = async () => {
    setErrorMsg(null);
    try {
      const picked = await pickDocumentOrImageFile({ acceptPdf: true, maxSizeMb: 10 });
      if (picked) setSelectedFile(picked);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to select file.');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMsg('Please select or capture a document/photo to upload.');
      return;
    }

    setErrorMsg(null);
    setIsUploading(true);
    try {
      const formData = new FormData();
      await appendFileToFormData(formData, 'file', selectedFile);
      formData.append('category', category || 'General');

      await makeMobileApiCall(
        UPLOAD_RESIDENT_DOCUMENT,
        formData,
        {},
        { id: residentId }
      );

      await queryClient.invalidateQueries({
        queryKey: ['resident-documents', residentId],
      });

      setSelectedFile(null);
      setCategory('General');
      onClose();
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'Failed to upload document.';
      if (raw.includes('403') || raw.toLowerCase().includes('forbidden')) {
        setErrorMsg('Your current role does not have permission to upload documents (Nurse, Manager, or Admin required).');
      } else {
        setErrorMsg(raw);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const isImage = Boolean(selectedFile?.mimeType.startsWith('image/'));
  const sizeLabel = formatBytes(selectedFile?.fileSize);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={resetAndClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-black/50 justify-end"
      >
        <View
          className="bg-white rounded-t-3xl max-h-[88%] px-5 pt-5"
          style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3.5 border-b border-slate-100 mb-3.5">
            <View className="flex-row items-center gap-2.5 flex-1 pr-2">
              <View className="w-8 h-8 rounded-full bg-primary-light items-center justify-center">
                <Upload size={16} color="#4A706A" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-foreground">Upload Document</Text>
                <Text className="text-xs text-muted-foreground">
                  Encrypted upload to AWS S3 (PDF, JPG, PNG, WEBP · Max 10MB)
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={resetAndClose}
              disabled={isUploading}
              className="w-8 h-8 rounded-full bg-surface items-center justify-center"
            >
              <X size={18} color="#5D5D5D" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {errorMsg && (
              <View className="flex-row items-start gap-2 p-3 rounded-xl bg-clinical-criticalBg mb-3">
                <AlertCircle size={15} color="#FF3B2F" />
                <Text className="text-xs text-clinical-critical font-medium flex-1 leading-4">
                  {errorMsg}
                </Text>
              </View>
            )}

            {/* Category Selector */}
            <Text className="text-sm font-bold text-foreground mb-2">Document Category *</Text>
            <View className="flex-row flex-wrap gap-1.5 mb-4">
              {RESIDENT_DOCUMENT_CATEGORIES.map((cat) => {
                const active = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    activeOpacity={0.7}
                    className={`px-3.5 py-1.5 rounded-full ${
                      active ? 'bg-primary' : 'bg-surface'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        active ? 'text-white' : 'text-muted-foreground'
                      }`}
                    >
                      {supportPlanLabel(cat)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* File Picker Section */}
            <Text className="text-sm font-bold text-foreground mb-2">Select File or Capture Photo *</Text>
            {selectedFile ? (
              <View className="p-3 rounded-2xl bg-surface flex-row items-center gap-3 mb-4">
                <View className="w-12 h-12 rounded-xl overflow-hidden bg-white items-center justify-center">
                  {isImage ? (
                    <Image source={{ uri: selectedFile.uri }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <FileText size={22} color="#FF3B2F" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-foreground" numberOfLines={1}>
                    {selectedFile.fileName}
                  </Text>
                  <Text className="text-xs text-muted-foreground mt-0.5">
                    {category} {sizeLabel ? `· ${sizeLabel}` : ''}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedFile(null)}
                  disabled={isUploading}
                  className="w-8 h-8 rounded-full bg-white items-center justify-center"
                >
                  <Trash2 size={14} color="#FF3B2F" />
                </TouchableOpacity>
              </View>
            ) : (
              <View className="flex-row gap-2.5 mb-4">
                <TouchableOpacity
                  onPress={() => void handleCameraPick()}
                  activeOpacity={0.75}
                  className="flex-1 p-4 rounded-2xl bg-surface items-center justify-center"
                >
                  <Camera size={22} color="#4A706A" />
                  <Text className="text-sm font-bold text-foreground mt-1.5">Take Photo</Text>
                  <Text className="text-xs text-muted-foreground mt-0.5">Scan clinical page</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => void handleFilePick()}
                  activeOpacity={0.75}
                  className="flex-1 p-4 rounded-2xl bg-surface items-center justify-center"
                >
                  <ImageIcon size={22} color="#4A706A" />
                  <Text className="text-sm font-bold text-foreground mt-1.5">Browse File</Text>
                  <Text className="text-xs text-muted-foreground mt-0.5">PDF or Image</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Submit Row */}
            <View className="flex-row gap-2.5 pt-1">
              <Button
                variant="outline"
                onPress={resetAndClose}
                disabled={isUploading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onPress={() => void handleUpload()}
                disabled={isUploading || !selectedFile}
                className="flex-1 flex-row items-center justify-center gap-1.5"
              >
                {isUploading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Upload size={15} color="#FFFFFF" strokeWidth={2.3} />
                    <Text className="text-sm font-bold text-white">Upload Document</Text>
                  </>
                )}
              </Button>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}


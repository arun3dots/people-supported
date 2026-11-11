import React, { useState } from 'react';
import { View, Modal, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { X, FileText, Download, ShieldCheck, Clock } from 'lucide-react-native';
import { Text } from '../ui/text';
import { AuthenticatedImage } from '../common/AuthenticatedImage';
import { openAuthenticatedDocument } from '../../lib/fileUpload';
import type { ResidentDocumentItem } from './residentDocuments.types';

interface Props {
  document: ResidentDocumentItem | null;
  onClose: () => void;
}

export function ResidentDocumentViewModal({ document, onClose }: Props) {
  const [opening, setOpening] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  if (!document) return null;

  const isVerified = document.status === 'Verified';
  const isImageDoc = document.fileType === 'IMG' && !imgFailed;

  const handleOpenExternal = async () => {
    setOpening(true);
    try {
      await openAuthenticatedDocument(document.viewUrl, document.title);
    } catch (err: unknown) {
      Alert.alert(
        'Unable to Open Document',
        err instanceof Error ? err.message : 'Failed to stream document from Cloud Storage.'
      );
    } finally {
      setOpening(false);
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-center px-5">
        <View className="bg-white rounded-3xl p-5 border border-slate-100 max-h-[85%]">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-1 pr-2">
              <Text className="text-lg font-bold text-foreground" numberOfLines={1}>
                {document.title}
              </Text>
              <Text className="text-xs text-muted-foreground mt-0.5">{document.subtitle}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-surface items-center justify-center"
              accessibilityLabel="Close modal"
            >
              <X size={18} color="#5D5D5D" />
            </TouchableOpacity>
          </View>

          {/* Document Metadata Banner */}
          <View className="mb-4 p-3.5 bg-surface rounded-2xl flex-row items-center justify-between">
            <View className="flex-row items-center gap-2.5 flex-1 mr-2">
              <View className="w-9 h-9 rounded-full bg-white items-center justify-center">
                <FileText size={16} color="#FF3B2F" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-foreground">
                  {document.fileType} Document
                </Text>
                <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                  {document.fileSize ? `${document.fileSize} · ` : ''}Uploaded {document.dateStr}
                </Text>
              </View>
            </View>

            {isVerified ? (
              <View className="px-2.5 py-0.5 rounded-full bg-clinical-safeBg flex-row items-center gap-1">
                <ShieldCheck size={11} color="#1D5E2E" />
                <Text className="text-xs font-semibold text-clinical-safe">Verified</Text>
              </View>
            ) : (
              <View className="px-2.5 py-0.5 rounded-full bg-white flex-row items-center gap-1">
                <Clock size={11} color="#5D5D5D" />
                <Text className="text-xs font-semibold text-muted-foreground">
                  {document.status || 'Uploaded'}
                </Text>
              </View>
            )}
          </View>

          {/* Authenticated Document Preview Area */}
          <ScrollView className="max-h-64 bg-surface rounded-2xl p-3 mb-4">
            {isImageDoc ? (
              <View className="items-center justify-center min-h-[180px]">
                <AuthenticatedImage
                  uri={document.viewUrl}
                  className="w-full h-52 rounded-xl"
                  resizeMode="contain"
                  onLoadFailed={() => setImgFailed(true)}
                />
              </View>
            ) : (
              <View className="items-center py-6">
                <FileText size={40} color="#8E8E93" />
                <Text className="text-sm font-semibold text-foreground mt-3 text-center">
                  {document.title}
                </Text>
                <Text className="text-xs text-muted-foreground mt-1 text-center">
                  Encrypted compliance document stored securely in AWS S3. Tap Open Document to view stream.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View className="flex-row gap-2.5 justify-end">
            <TouchableOpacity
              onPress={onClose}
              className="px-4 py-2.5 rounded-full bg-surface"
            >
              <Text className="text-sm font-semibold text-foreground">Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => void handleOpenExternal()}
              disabled={opening}
              className="px-5 py-2.5 rounded-full bg-primary flex-row items-center gap-1.5"
            >
              {opening ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Download size={14} color="#FFFFFF" strokeWidth={2.2} />
                  <Text className="text-sm font-bold text-white">Open Document</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

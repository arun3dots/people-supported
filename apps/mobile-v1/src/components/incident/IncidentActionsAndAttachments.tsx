import React, { useState } from 'react';
import { View, Image, TouchableOpacity, TextInput, Modal, Alert, Platform } from 'react-native';
import {
  Check,
  Plus,
  Upload,
  ShieldCheck,
  X,
  FileText,
  Trash2,
  Camera,
  Image as ImageIcon,
} from 'lucide-react-native';
import { Text } from '../../presentation/components/common';
import { theme } from '../../theme/tokens';
import {
  PickedMobileFile,
  pickImageFromCamera,
  pickDocumentOrImageFile,
} from '../../lib/fileUpload';

export type IncidentAttachment = PickedMobileFile;

interface IncidentActionsAndAttachmentsProps {
  initialActions?: string[];
  initialNotes?: string;
  initialAttachments?: IncidentAttachment[];
  onSubmit: (data: {
    actions: string[];
    notes: string;
    attachments: IncidentAttachment[];
  }) => void;
  isSubmitting?: boolean;
}

const DEFAULT_ACTIONS: string[] = [];
const DEFAULT_ATTACHMENTS: IncidentAttachment[] = [];

export function IncidentActionsAndAttachments({
  initialActions = DEFAULT_ACTIONS,
  initialNotes = '',
  initialAttachments = DEFAULT_ATTACHMENTS,
  onSubmit,
  isSubmitting = false,
}: IncidentActionsAndAttachmentsProps) {
  const [actions, setActions] = useState<string[]>(initialActions);
  const [notes, setNotes] = useState<string>(initialNotes);
  const [attachments, setAttachments] = useState<IncidentAttachment[]>(initialAttachments);
  const [isAddActionModalOpen, setIsAddActionModalOpen] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [newActionText, setNewActionText] = useState('');

  const toggleAction = (action: string) => {
    if (actions.includes(action)) {
      setActions(actions.filter((a) => a !== action));
    } else {
      setActions([...actions, action]);
    }
  };

  const handleAddCustomAction = () => {
    const trimmed = newActionText.trim();
    if (trimmed && !actions.includes(trimmed)) {
      setActions([...actions, trimmed]);
      setNewActionText('');
      setIsAddActionModalOpen(false);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleLaunchCamera = async () => {
    try {
      const picked = await pickImageFromCamera(5);
      if (picked) {
        setAttachments((prev) => [...prev, picked]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to open camera';
      Alert.alert('Camera Error', msg);
    }
  };

  const handleLaunchGalleryOrFiles = async () => {
    try {
      const picked = await pickDocumentOrImageFile({ acceptPdf: true, maxSizeMb: 10 });
      if (picked) {
        setAttachments((prev) => [...prev, picked]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to open file manager or gallery';
      Alert.alert('Attachment Error', msg);
    }
  };

  return (
    <View className="mb-6">
      {/* 1. Immediate Actions */}
      <View className="bg-surface rounded-2xl p-4 mb-4">
        <Text className="text-base font-bold text-text-primary mb-2.5">Immediate Actions</Text>
        {actions.length > 0 ? (
          <View className="flex-row flex-wrap items-center gap-2 mb-2.5">
            {actions.map((act) => (
              <TouchableOpacity
                key={act}
                activeOpacity={0.7}
                onPress={() => toggleAction(act)}
                className="bg-white rounded-full px-3 py-1.5 flex-row items-center gap-2"
              >
                <View className="w-5 h-5 rounded-full bg-primary items-center justify-center">
                  <Check size={12} color="#FFFFFF" strokeWidth={3} />
                </View>
                <Text className="text-xs font-semibold text-text-primary">{act}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text className="text-xs text-text-muted italic mb-2.5">
            No actions recorded yet. Tap below to log immediate clinical actions.
          </Text>
        )}

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setIsAddActionModalOpen(true)}
          className="self-start bg-primary px-4 py-2 rounded-full flex-row items-center gap-1.5"
        >
          <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
          <Text className="text-xs font-bold text-white">Add Actions</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Incident Notes */}
      <View className="bg-surface rounded-2xl p-4 mb-4">
        <Text className="text-base font-bold text-text-primary mb-2">Incident Notes</Text>
        <View className="bg-white rounded-xl p-3.5">
          <TextInput
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholder="Enter clinical observations, description of the incident, injuries, and immediate response..."
            placeholderTextColor="#94A3B8"
            style={{ fontFamily: theme.fonts.regular }}
            className="text-sm text-text-primary leading-relaxed p-0 min-h-[88px]"
          />
        </View>
      </View>

      {/* 3. Attachments (Uploaded to AWS S3 via UPLOAD_INCIDENT_ATTACHMENT) */}
      <View className="bg-surface rounded-2xl p-4 mb-6">
        <Text className="text-base font-bold text-text-primary mb-2.5">Attachments</Text>
        <View className="flex-row flex-wrap items-start gap-3">
          {attachments.map((att) => {
            const isImage = att.mimeType.startsWith('image/') && Boolean(att.uri);
            return (
              <View key={att.id} className="w-24">
                <View className="w-24 h-24 rounded-xl overflow-hidden bg-white mb-1 items-center justify-center relative">
                  {isImage ? (
                    <Image source={{ uri: att.uri }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <FileText size={28} color="#4A706A" />
                  )}
                  <TouchableOpacity
                    onPress={() => removeAttachment(att.id)}
                    className="absolute top-1 right-1 bg-black/60 rounded-full p-1"
                    accessibilityLabel="Remove attachment"
                  >
                    <Trash2 size={12} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                <Text className="text-xs font-semibold text-text-primary" numberOfLines={1}>
                  {att.fileName}
                </Text>
                <Text className="text-xs text-text-muted">{att.dateStr}</Text>
              </View>
            );
          })}

          {/* Upload More Card */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsMediaPickerOpen(true)}
            className="w-24 h-24 rounded-xl border-2 border-dashed border-primary/40 bg-primary-light items-center justify-center"
          >
            <Upload size={20} color="#4A706A" strokeWidth={2} />
            <Text className="text-xs font-bold text-primary mt-1.5 text-center leading-tight">
              Upload More
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. Report Incident Primary Action Button */}
      <TouchableOpacity
        activeOpacity={0.85}
        disabled={isSubmitting}
        onPress={() => onSubmit({ actions, notes, attachments })}
        className="w-full h-14 rounded-full bg-primary flex-row items-center justify-center gap-2"
      >
        <ShieldCheck size={20} color="#FFFFFF" strokeWidth={2.4} />
        <Text className="text-base font-bold text-white tracking-wide">
          {isSubmitting ? 'Uploading & Submitting...' : 'Report Incident'}
        </Text>
      </TouchableOpacity>

      {/* Add Action Modal */}
      <Modal
        visible={isAddActionModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAddActionModalOpen(false)}
      >
        <View className="flex-1 bg-black/50 justify-center px-5">
          <View className="bg-white rounded-3xl p-5">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-bold text-text-primary">Add Immediate Action</Text>
              <TouchableOpacity onPress={() => setIsAddActionModalOpen(false)}>
                <X size={20} color="#7C8B87" />
              </TouchableOpacity>
            </View>
            <TextInput
              value={newActionText}
              onChangeText={setNewActionText}
              placeholder="e.g. Doctor contacted, Ice applied..."
              placeholderTextColor="#94A3B8"
              style={{ fontFamily: theme.fonts.regular }}
              className="h-12 px-3.5 rounded-xl bg-surface text-sm text-text-primary mb-4"
              autoFocus
            />
            <View className="flex-row gap-2 justify-end">
              <TouchableOpacity
                onPress={() => setIsAddActionModalOpen(false)}
                className="px-4 py-2.5 rounded-full bg-surface"
              >
                <Text className="text-xs font-semibold text-text-secondary">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddCustomAction}
                className="px-5 py-2.5 rounded-full bg-primary"
              >
                <Text className="text-xs font-bold text-white">Add Action</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Media Source Picker Modal */}
      <Modal
        visible={isMediaPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMediaPickerOpen(false)}
      >
        <View className="flex-1 bg-black/50 justify-end sm:justify-center px-4 pb-6 sm:pb-0">
          <View className="bg-white rounded-2xl p-5 shadow-xl">
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className="text-base font-bold text-text-primary">Attach Evidence or Photo</Text>
                <Text className="text-xs text-text-secondary mt-0.5">
                  Files are securely uploaded to Cloud Storage (Max 10MB)
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsMediaPickerOpen(false)} className="p-1">
                <X size={20} color="#7C8B87" />
              </TouchableOpacity>
            </View>

            <View className="gap-2.5 mb-2">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setIsMediaPickerOpen(false);
                  if (Platform.OS === 'web') {
                    void handleLaunchCamera();
                  } else {
                    setTimeout(() => void handleLaunchCamera(), 100);
                  }
                }}
                className="flex-row items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200"
              >
                <View className="w-10 h-10 rounded-full bg-primary-light items-center justify-center">
                  <Camera size={20} color="#4A706A" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-text-primary">Camera Photo</Text>
                  <Text className="text-xs text-text-secondary">Capture photo using device camera</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setIsMediaPickerOpen(false);
                  if (Platform.OS === 'web') {
                    void handleLaunchGalleryOrFiles();
                  } else {
                    setTimeout(() => void handleLaunchGalleryOrFiles(), 100);
                  }
                }}
                className="flex-row items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200"
              >
                <View className="w-10 h-10 rounded-full bg-primary-light items-center justify-center">
                  <ImageIcon size={20} color="#4A706A" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-text-primary">
                    Choose from Gallery / File Manager
                  </Text>
                  <Text className="text-xs text-text-secondary">
                    Select image or PDF document from device storage
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

import React, { useState } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, FileText, Check } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CREATE_CARE_NOTE } from '@repo/endpoints';
import { makeMobileApiCall } from '../../data/api/client';
import { isNetworkError } from '../../data/api/errors';
import { enqueueMutation } from '../../data/api/offlineQueue';
import { Text, Button } from '../../presentation/components/common';
import { useSheetBottomPadding } from '../../presentation/hooks/useSheetBottomPadding';
import { safeLogger } from '../../data/security/safeLogger';
import { theme } from '../../theme/tokens';

interface Props {
  visible: boolean;
  onClose: () => void;
  residentId: string;
}

const CATEGORIES = ['General', 'Medical', 'Nutrition', 'Behavioral'] as const;

const QUICK_TEMPLATES = [
  'Assisted with personal hygiene and dress.',
  'Good appetite, finished meal and fluids.',
  'Restful night, no distress or wandering noted.',
  'Participated in morning social activities.',
  'Skin integrity checked during care - intact.',
];

export function AddCareNoteModal({ visible, onClose, residentId }: Props) {
  const queryClient = useQueryClient();
  const sheetBottomPadding = useSheetBottomPadding(16);

  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('General');
  const [content, setContent] = useState('');

  const addTemplate = (template: string) => {
    setContent((prev) => {
      if (!prev.trim()) return template;
      return `${prev.trim()}\n• ${template}`;
    });
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const trimmed = content.trim();
      if (!trimmed) throw new Error('Please enter note content.');
      const payload = { category, content: trimmed };

      let queuedOffline = false;
      try {
        await makeMobileApiCall(CREATE_CARE_NOTE, payload, undefined, { id: residentId });
      } catch (err) {
        if (!isNetworkError(err)) throw err;
        safeLogger.warn('Network error saving care note, queuing offline mutation', err);
        await enqueueMutation(CREATE_CARE_NOTE, payload, { id: residentId });
        queuedOffline = true;
      }
      return { queuedOffline };
    },
    onSuccess: ({ queuedOffline }) => {
      void queryClient.invalidateQueries({ queryKey: ['residentTimeline', residentId] });
      void queryClient.invalidateQueries({ queryKey: ['resident-care-notes', residentId] });
      setContent('');
      onClose();
      Alert.alert(queuedOffline ? 'Saved Offline' : 'Care Note Saved', queuedOffline ? 'Your note is queued and has not yet been recorded on the server.' : 'Your note has been recorded on the timeline.');
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to save care note';
      Alert.alert('Error', msg);
    },
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-black/60 justify-end"
      >
        <View
          className="bg-white rounded-t-3xl max-h-[90%] px-5 pt-4"
          style={{ paddingBottom: sheetBottomPadding }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
            <View className="flex-row items-center gap-2.5">
              <View className="w-9 h-9 rounded-full bg-primary-light items-center justify-center">
                <FileText size={16} color="#4A706A" />
              </View>
              <Text className="text-lg font-bold text-text-primary">Add Care Note</Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              className="w-8 h-8 rounded-full bg-surface items-center justify-center"
            >
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Category Selection */}
            <View className="my-3">
              <Text className="text-sm font-bold text-text-primary mb-2">Note Category</Text>
              <View className="flex-row flex-wrap gap-2">
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setCategory(cat)}
                      activeOpacity={0.8}
                      className={`px-3.5 py-1.5 rounded-full ${
                        isSelected ? 'bg-primary' : 'bg-surface'
                      }`}
                    >
                      <Text
                        className={`text-xs ${
                          isSelected ? 'font-bold text-white' : 'font-medium text-text-secondary'
                        }`}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Quick Templates */}
            <View className="mb-3">
              <Text className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">
                Quick Observations
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                {QUICK_TEMPLATES.map((tmpl, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => addTemplate(tmpl)}
                    activeOpacity={0.7}
                    className="bg-surface rounded-xl px-3 py-2 mr-2 max-w-[240px]"
                  >
                    <Text className="text-xs text-text-primary leading-tight" numberOfLines={2}>
                      + {tmpl}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Note Content Input */}
            <View className="mb-4">
              <Text className="text-sm font-bold text-text-primary mb-1.5">Observation & Details *</Text>
              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder="Write detailed notes regarding the resident's wellbeing, meal intake, sleep, or behavior..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                style={{ fontFamily: theme.fonts.regular }}
                className="w-full bg-surface rounded-xl p-3.5 text-sm text-text-primary min-h-[130px]"
              />
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-2.5 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onPress={onClose}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>

              <Button
                variant="default"
                className="flex-1 bg-primary"
                onPress={() => createMutation.mutate()}
                disabled={createMutation.isPending || !content.trim()}
              >
                {createMutation.isPending ? 'Saving...' : 'Save Note'}
              </Button>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

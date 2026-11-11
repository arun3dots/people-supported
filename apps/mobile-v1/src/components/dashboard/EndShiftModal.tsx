import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Power, Users, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { Text } from '../ui/text';
import { Button } from '../ui/button';
import { Resident } from '../../domain/entities/Resident';
import { theme } from '../../theme';
import { useSheetBottomPadding } from '../../presentation/hooks/useSheetBottomPadding';

export interface EndShiftModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirmEndShift: (handoverNotes: string) => Promise<void> | void;
  shiftName?: string;
  assignedResidents?: Resident[];
  completedTasks?: number;
  totalTasks?: number;
}

export function EndShiftModal({
  visible,
  onClose,
  onConfirmEndShift,
  shiftName = 'Shift',
  assignedResidents = [],
  completedTasks = 0,
  totalTasks = 0,
}: EndShiftModalProps) {
  const [handoverNotes, setHandoverNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const sheetBottomPadding = useSheetBottomPadding(12);

  const quickTemplates = [
    'All meds administered',
    'Hydration logs up to date',
    'No incidents to report',
    'Physio completed',
  ];

  const handleAddTemplate = (template: string) => {
    setValidationError(null);
    setHandoverNotes((prev) => {
      if (!prev.trim()) return template;
      return `${prev.trim()}\n• ${template}`;
    });
  };

  const handleConfirm = async () => {
    const trimmed = handoverNotes.trim();
    if (!trimmed) {
      setValidationError('Handover notes are mandatory to end your shift. Please provide handover notes for the incoming team.');
      return;
    }

    try {
      setIsSubmitting(true);
      setValidationError(null);
      await onConfirmEndShift(trimmed);
      setHandoverNotes('');
      onClose();
    } catch (e) {
      console.error('Error ending shift:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setValidationError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={[styles.modalContent, { paddingBottom: sheetBottomPadding }]}>
          {/* Top Drag Indicator */}
          <View style={styles.dragHandle} />

          {/* Header Row */}
          <View style={styles.header}>
            <View style={styles.headerTitleGroup}>
              <Text className="text-lg font-bold text-foreground">
                End Shift & Handover
              </Text>
              <Text className="text-xs text-muted-foreground">
                {shiftName} • Summary & Care Handover
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton} activeOpacity={0.7}>
              <X size={20} color="#141F1E" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Shift Completion Overview Pill */}
            <View style={styles.overviewBox}>
              <View style={styles.overviewItem}>
                <CheckCircle2 size={16} color={theme.colors.primary.DEFAULT} />
                <Text className="text-xs font-semibold text-primary ml-1.5">
                  {completedTasks}/{totalTasks} Tasks Completed
                </Text>
              </View>
              <View style={styles.overviewItem}>
                <Users size={16} color={theme.colors.primary.DEFAULT} />
                <Text className="text-xs font-semibold text-primary ml-1.5">
                  {assignedResidents.length} Residents Assigned
                </Text>
              </View>
            </View>

            {/* Handover Notes Input Section */}
            <View style={styles.section}>
              <Text className="text-sm font-bold text-foreground mb-1">
                Handover Notes for Next Shift <Text className="text-red-500 font-bold">*</Text>
              </Text>
              <Text className="text-xs text-muted-foreground mb-2">
                Document any resident changes, skin integrity alerts, or outstanding actions for the incoming carer.
              </Text>

              {/* Validation Error Banner */}
              {validationError && (
                <View className="flex-row items-center bg-rose-50 border border-rose-200 rounded-lg p-2.5 mb-2.5 gap-2">
                  <AlertCircle size={16} color="#E11D48" />
                  <Text className="text-xs text-rose-700 font-medium flex-1">
                    {validationError}
                  </Text>
                </View>
              )}

              {/* Quick Template Chips */}
              <View style={styles.chipRow}>
                {quickTemplates.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.7}
                    onPress={() => handleAddTemplate(item)}
                    style={styles.chip}
                  >
                    <Text className="text-xs font-medium text-primary">
                      + {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={[
                  styles.textInput,
                  validationError ? { borderColor: '#E11D48', backgroundColor: '#FFF5F5' } : null,
                ]}
                placeholder="Enter mandatory clinical handover notes..."
                placeholderTextColor="#8E8E93"
                multiline
                numberOfLines={4}
                value={handoverNotes}
                onChangeText={(val) => {
                  setHandoverNotes(val);
                  if (validationError) setValidationError(null);
                }}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          {/* Bottom Action Buttons */}
          <View style={styles.footer}>
            <Button
              variant="outline"
              className="flex-1 py-3"
              onPress={handleClose}
            >
              <Text className="text-sm font-bold text-foreground">Cancel</Text>
            </Button>
            <Button
              variant="destructive"
              className={`flex-1 py-3 flex-row items-center justify-center gap-1.5 ${
                !handoverNotes.trim() || isSubmitting ? 'opacity-60' : 'opacity-100'
              }`}
              onPress={handleConfirm}
              disabled={isSubmitting || !handoverNotes.trim()}
            >
              <Power size={15} color="#FFFFFF" />
              <Text className="text-sm font-bold text-white">
                {isSubmitting ? 'Ending...' : 'Sign Off & End'}
              </Text>
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleGroup: {
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  overviewBox: {
    flexDirection: 'row',
    backgroundColor: '#F5F8F7',
    borderRadius: 14,
    padding: 12,
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: '#E8EFEF',
  },
  overviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  section: {
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    backgroundColor: '#F5F8F7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#BCD3CD',
  },
  textInput: {
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5EAE8',
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    color: '#141F1E',
    minHeight: 90,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
});

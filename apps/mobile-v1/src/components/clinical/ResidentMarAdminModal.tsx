import React, { useState } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Check, Activity, ChevronDown, ChevronUp } from 'lucide-react-native';
import { Text } from '../ui/text';
import { theme } from '../../theme/tokens';
import type {
  ScheduledMedication,
  PrnMedication,
  MarAdminActionItem,
  AdministrationVitals,
} from './residentMar.types';

interface Props {
  actionItem: MarAdminActionItem | ScheduledMedication | PrnMedication | null;
  onClose: () => void;
  onConfirm: (
    action: 'Administer' | 'Refused' | 'Omitted',
    reasonNotes: string,
    witnessName: string,
    vitals?: AdministrationVitals
  ) => void;
}

export function ResidentMarAdminModal({ actionItem, onClose, onConfirm }: Props) {
  const [selectedAction, setSelectedAction] = useState<'Administer' | 'Refused' | 'Omitted'>('Administer');
  const [reasonNotes, setReasonNotes] = useState('');
  const [witnessStaffName, setWitnessStaffName] = useState('');

  // Pre-administration vitals
  const [showVitals, setShowVitals] = useState(false);
  const [bpSystolic, setBpSystolic] = useState('');
  const [bpDiastolic, setBpDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [bloodSugar, setBloodSugar] = useState('');
  const [temp, setTemp] = useState('');
  const [spo2, setSpo2] = useState('');

  if (!actionItem) return null;

  const handleConfirm = () => {
    if (selectedAction !== 'Administer' && !reasonNotes.trim()) {
      Alert.alert('Reason Required', 'Please enter a clinical reason for this medication status.');
      return;
    }
    if (actionItem.isControlledDrug && selectedAction === 'Administer' && !witnessStaffName.trim()) {
      Alert.alert('Witness Required', 'Please enter the name of the witnessing nurse for controlled drugs.');
      return;
    }

    const vitalsObj: AdministrationVitals = {};
    if (bpSystolic.trim()) vitalsObj.bpSystolic = bpSystolic.trim();
    if (bpDiastolic.trim()) vitalsObj.bpDiastolic = bpDiastolic.trim();
    if (pulse.trim()) vitalsObj.pulse = pulse.trim();
    if (bloodSugar.trim()) vitalsObj.bloodSugar = bloodSugar.trim();
    if (temp.trim()) vitalsObj.temp = temp.trim();
    if (spo2.trim()) vitalsObj.spo2 = spo2.trim();

    onConfirm(
      selectedAction,
      reasonNotes.trim(),
      witnessStaffName.trim(),
      Object.keys(vitalsObj).length > 0 ? vitalsObj : undefined
    );

    setReasonNotes('');
    setWitnessStaffName('');
    setSelectedAction('Administer');
    setBpSystolic('');
    setBpDiastolic('');
    setPulse('');
    setBloodSugar('');
    setTemp('');
    setSpo2('');
    setShowVitals(false);
  };

  const handleClose = () => {
    setReasonNotes('');
    setWitnessStaffName('');
    setSelectedAction('Administer');
    setShowVitals(false);
    onClose();
  };

  const scheduledTimeDisplay =
    'scheduledTime' in actionItem && actionItem.scheduledTime
      ? actionItem.scheduledTime
      : 'PRN (As Needed)';

  return (
    <Modal visible transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-black/60 justify-center px-4"
      >
        <View className="bg-white rounded-3xl p-5 max-h-[88vh] shadow-2xl">
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* 1. Header */}
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-bold text-text-primary">
                Log Medication Administration
              </Text>
              <TouchableOpacity
                onPress={handleClose}
                accessibilityLabel="Close modal"
                className="w-8 h-8 rounded-full bg-surface items-center justify-center"
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* 2. Medication Summary Banner */}
            <View className="mb-3.5 p-3.5 bg-surface rounded-2xl">
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-bold text-text-primary flex-1 mr-2">
                  {actionItem.drugName}
                </Text>
                {actionItem.isControlledDrug && (
                  <View className="bg-clinical-warningBg px-2.5 py-0.5 rounded-full">
                    <Text className="text-xs font-bold text-clinical-warning">Controlled Drug</Text>
                  </View>
                )}
              </View>
              <Text className="text-xs text-text-secondary mt-1">
                Schedule: {scheduledTimeDisplay} • {actionItem.dose} ({actionItem.route})
              </Text>
            </View>

            {/* 3. Action Outcome Segment Picker */}
            <View className="flex-row gap-2 mb-3.5">
              {(['Administer', 'Refused', 'Omitted'] as const).map((act) => {
                const isSelected = selectedAction === act;
                return (
                  <TouchableOpacity
                    key={act}
                    activeOpacity={0.7}
                    onPress={() => setSelectedAction(act)}
                    className={`flex-1 py-2.5 rounded-full items-center ${
                      isSelected
                        ? act === 'Administer'
                          ? 'bg-primary'
                          : 'bg-clinical-criticalBg'
                        : 'bg-surface'
                    }`}
                  >
                    <Text
                      className={`text-xs ${
                        isSelected
                          ? act === 'Administer'
                            ? 'text-white font-bold'
                            : 'text-clinical-critical font-bold'
                          : 'text-text-secondary font-medium'
                      }`}
                    >
                      {act}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 4. Clinical Reason for Refusal or Omission */}
            {selectedAction !== 'Administer' && (
              <View className="mb-3.5 space-y-1.5">
                <Text className="text-sm font-semibold text-text-primary">
                  Clinical Reason / Notes <Text className="text-clinical-critical">*</Text>
                </Text>
                <TextInput
                  value={reasonNotes}
                  onChangeText={setReasonNotes}
                  placeholder="e.g. Resident asleep, nauseous, or refused medication..."
                  placeholderTextColor="#94A3B8"
                  style={{ fontFamily: theme.fonts.regular }}
                  className="h-11 px-3 rounded-xl text-sm text-text-primary bg-surface"
                />
              </View>
            )}

            {/* 5. Controlled Drug Witness Input */}
            {actionItem.isControlledDrug && selectedAction === 'Administer' && (
              <View className="mb-3.5 space-y-1.5">
                <Text className="text-sm font-semibold text-text-primary">
                  Witnessing Registered Nurse <Text className="text-clinical-critical">*</Text>
                </Text>
                <TextInput
                  value={witnessStaffName}
                  onChangeText={setWitnessStaffName}
                  placeholder="Enter full name of witnessing nurse..."
                  placeholderTextColor="#94A3B8"
                  style={{ fontFamily: theme.fonts.regular }}
                  className="h-11 px-3 rounded-xl text-sm text-text-primary bg-surface"
                />
              </View>
            )}

            {/* 6. Pre-Administration Vitals (Optional collapsible section) */}
            {selectedAction === 'Administer' && (
              <View className="mb-3.5 rounded-2xl p-3.5 bg-surface">
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowVitals(!showVitals)}
                  className="flex-row items-center justify-between"
                >
                  <View className="flex-row items-center gap-1.5">
                    <Activity size={14} color="#4A706A" />
                    <Text className="text-xs font-semibold text-text-primary">
                      Pre-Dose Clinical Vitals (Optional)
                    </Text>
                  </View>
                  {showVitals ? <ChevronUp size={16} color="#64748B" /> : <ChevronDown size={16} color="#64748B" />}
                </TouchableOpacity>

                {showVitals && (
                  <View className="pt-3 space-y-2.5">
                    {/* BP Row */}
                    <View className="flex-row gap-2">
                      <View className="flex-1 space-y-1">
                        <Text className="text-xs font-semibold text-text-secondary">BP Systolic</Text>
                        <TextInput
                          value={bpSystolic}
                          onChangeText={setBpSystolic}
                          placeholder="e.g. 120"
                          keyboardType="numeric"
                          style={{ fontFamily: theme.fonts.regular }}
                          className="h-9 px-2.5 bg-white rounded-xl text-xs text-text-primary"
                        />
                      </View>
                      <View className="flex-1 space-y-1">
                        <Text className="text-xs font-semibold text-text-secondary">BP Diastolic</Text>
                        <TextInput
                          value={bpDiastolic}
                          onChangeText={setBpDiastolic}
                          placeholder="e.g. 80"
                          keyboardType="numeric"
                          style={{ fontFamily: theme.fonts.regular }}
                          className="h-9 px-2.5 bg-white rounded-xl text-xs text-text-primary"
                        />
                      </View>
                    </View>

                    {/* Pulse & Glucose Row */}
                    <View className="flex-row gap-2">
                      <View className="flex-1 space-y-1">
                        <Text className="text-xs font-semibold text-text-secondary">Pulse (bpm)</Text>
                        <TextInput
                          value={pulse}
                          onChangeText={setPulse}
                          placeholder="e.g. 72"
                          keyboardType="numeric"
                          style={{ fontFamily: theme.fonts.regular }}
                          className="h-9 px-2.5 bg-white rounded-xl text-xs text-text-primary"
                        />
                      </View>
                      <View className="flex-1 space-y-1">
                        <Text className="text-xs font-semibold text-text-secondary">Blood Sugar (mmol/L)</Text>
                        <TextInput
                          value={bloodSugar}
                          onChangeText={setBloodSugar}
                          placeholder="e.g. 5.8"
                          keyboardType="numeric"
                          style={{ fontFamily: theme.fonts.regular }}
                          className="h-9 px-2.5 bg-white rounded-xl text-xs text-text-primary"
                        />
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* 7. Action Footer Buttons */}
            <View className="flex-row gap-2.5 justify-end pt-3 border-t border-slate-100">
              <TouchableOpacity
                onPress={handleClose}
                className="px-4 py-2.5 rounded-full bg-surface"
              >
                <Text className="text-xs font-semibold text-text-secondary">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirm}
                className="px-5 py-2.5 rounded-full bg-primary flex-row items-center gap-1.5"
              >
                <Check size={14} color="#FFFFFF" strokeWidth={2.5} />
                <Text className="text-xs font-bold text-white">Confirm</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

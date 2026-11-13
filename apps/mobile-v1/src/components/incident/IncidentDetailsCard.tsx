import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Calendar, Clock, ChevronDown, Check } from 'lucide-react-native';
import { Text } from '../../presentation/components/common';
import { useSheetBottomPadding } from '../../presentation/hooks/useSheetBottomPadding';
import { theme } from '../../theme/tokens';
import { formatUkDate } from '../../lib/date';
import { CalendarDatePickerModal } from '../common/CalendarDatePickerModal';

export interface ResidentOption {
  id: string;
  fullName: string;
  roomNumber: string;
  bedNumber?: string;
}

export interface IncidentDetailsFormState {
  incidentName: string;
  incidentDate: string;
  incidentTime: string;
  residentName: string;
  residentId: string;
  roomNumber: string;
  bedNumber: string;
  category: string;
  harmLevel: string;
  severity: string;
  escalationNotes: string;
}

interface IncidentDetailsCardProps {
  form: IncidentDetailsFormState;
  onChange: <K extends keyof IncidentDetailsFormState>(key: K, value: IncidentDetailsFormState[K]) => void;
  residents?: ResidentOption[];
}

const CATEGORIES = ['Fall', 'Medication Error', 'Behavioural / Aggression', 'Injury / Laceration', 'Pressure Ulcer', 'Other'];
const HARM_LEVELS = ['Level 1 - None', 'Level 2 - Low', 'Level 3 - Moderate', 'Level 4', 'Level 5 - Death'];
const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

export function IncidentDetailsCard({ form, onChange, residents = [] }: IncidentDetailsCardProps) {
  const sheetBottomPadding = useSheetBottomPadding(20);
  const [activePicker, setActivePicker] = useState<'resident' | 'category' | 'harm' | 'severity' | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const residentList: ResidentOption[] = residents;

  return (
    <View className="bg-surface rounded-2xl p-4 mb-4">
      <Text className="text-base font-bold text-text-primary mb-3">Incident Details</Text>

      {/* Incident Name */}
      <View className="mb-3">
        <Text className="text-xs font-semibold text-text-secondary mb-1.5">
          Incident Name <Text className="text-clinical-critical font-bold">*</Text>
        </Text>
        <TextInput
          value={form.incidentName}
          onChangeText={(v) => onChange('incidentName', v)}
          placeholder="Enter incident title"
          placeholderTextColor="#94A3B8"
          style={{ fontFamily: theme.fonts.regular }}
          className="h-12 px-3.5 rounded-xl bg-white text-sm text-text-primary"
        />
      </View>

      {/* Date & Time Row */}
      <View className="flex-row gap-3 mb-3">
        <View className="flex-1">
          <Text className="text-xs font-semibold text-text-secondary mb-1.5">
            Date <Text className="text-clinical-critical font-bold">*</Text>
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsCalendarOpen(true)}
            className="h-12 px-3.5 rounded-xl bg-white flex-row items-center justify-between"
            accessibilityLabel="Select incident date"
          >
            <View className="flex-row items-center gap-2 flex-1">
              <Calendar size={16} color="#4A706A" />
              <Text className="text-sm font-medium text-text-primary" numberOfLines={1}>
                {formatUkDate(form.incidentDate) || form.incidentDate || 'Select Date'}
              </Text>
            </View>
            <ChevronDown size={16} color="#7C8B87" />
          </TouchableOpacity>
        </View>

        <View className="flex-1">
          <Text className="text-xs font-semibold text-text-secondary mb-1.5">
            Time <Text className="text-clinical-critical font-bold">*</Text>
          </Text>
          <View className="h-12 px-3.5 rounded-xl bg-white flex-row items-center gap-2">
            <Clock size={16} color="#7C8B87" />
            <TextInput
              value={form.incidentTime}
              onChangeText={(v) => onChange('incidentTime', v)}
              placeholder="Time"
              placeholderTextColor="#94A3B8"
              style={{ fontFamily: theme.fonts.regular }}
              className="flex-1 text-sm text-text-primary p-0"
            />
          </View>
        </View>
      </View>

      {/* Resident Name */}
      <View className="mb-3">
        <Text className="text-xs font-semibold text-text-secondary mb-1.5">
          Person Supported <Text className="text-clinical-critical font-bold">*</Text>
        </Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setActivePicker('resident')}
          className="h-12 px-3.5 rounded-xl bg-white flex-row items-center justify-between"
        >
          <Text
            className={`text-sm ${form.residentName ? 'font-medium text-text-primary' : 'font-normal text-text-muted'
              }`}
          >
            {form.residentName || 'Select Person Supported'}
          </Text>
          <ChevronDown size={18} color="#7C8B87" />
        </TouchableOpacity>
      </View>

      {/* Room Number & Bed Number Row */}
      <View className="flex-row gap-3 mb-3">
        <View className="flex-1">
          <Text className="text-xs font-semibold text-text-secondary mb-1.5">Room Number</Text>
          <TextInput
            value={form.roomNumber}
            onChangeText={(v) => onChange('roomNumber', v)}
            placeholder="e.g. Room 14B"
            placeholderTextColor="#94A3B8"
            style={{ fontFamily: theme.fonts.regular }}
            className="h-12 px-3.5 rounded-xl bg-white text-sm text-text-primary"
          />
        </View>

        <View className="flex-1">
          <Text className="text-xs font-semibold text-text-secondary mb-1.5">Bed Number</Text>
          <TextInput
            value={form.bedNumber}
            onChangeText={(v) => onChange('bedNumber', v)}
            placeholder="e.g. Bed 2"
            placeholderTextColor="#94A3B8"
            style={{ fontFamily: theme.fonts.regular }}
            className="h-12 px-3.5 rounded-xl bg-white text-sm text-text-primary"
          />
        </View>
      </View>

      {/* Incident Category */}
      <View className="mb-3">
        <Text className="text-xs font-semibold text-text-secondary mb-1.5">Incident Category</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setActivePicker('category')}
          className="h-12 px-3.5 rounded-xl bg-white flex-row items-center justify-between"
        >
          <Text
            className={`text-sm ${form.category ? 'font-medium text-text-primary' : 'font-normal text-text-muted'
              }`}
          >
            {form.category || 'Select Incident Category'}
          </Text>
          <ChevronDown size={18} color="#7C8B87" />
        </TouchableOpacity>
      </View>

      {/* Harm-level & Severity Row */}
      <View className="flex-row gap-3 mb-3">
        <View className="flex-1">
          <Text className="text-xs font-semibold text-text-secondary mb-1.5">Harm-level</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActivePicker('harm')}
            className="h-12 px-3.5 rounded-xl bg-white flex-row items-center justify-between"
          >
            <Text
              className={`text-sm ${form.harmLevel ? 'font-medium text-text-primary' : 'font-normal text-text-muted'
                }`}
            >
              {form.harmLevel || 'Select Harm Level'}
            </Text>
            <ChevronDown size={18} color="#7C8B87" />
          </TouchableOpacity>
        </View>

        <View className="flex-1">
          <Text className="text-xs font-semibold text-text-secondary mb-1.5">Severity</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActivePicker('severity')}
            className="h-12 px-3.5 rounded-xl bg-white flex-row items-center justify-between"
          >
            <Text
              className={`text-sm ${form.severity ? 'font-bold text-clinical-critical' : 'font-normal text-text-muted'
                }`}
            >
              {form.severity || 'Select Severity'}
            </Text>
            <ChevronDown size={18} color="#7C8B87" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Escalation Notes */}
      <View>
        <Text className="text-xs font-semibold text-text-secondary mb-1.5">Escalation Notes</Text>
        <TextInput
          value={form.escalationNotes}
          onChangeText={(v) => onChange('escalationNotes', v)}
          placeholder="Enter escalation or duty manager notification notes..."
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          style={{ fontFamily: theme.fonts.regular }}
          className="min-h-[72px] p-3 rounded-xl bg-white text-sm text-text-primary"
        />
      </View>

      {/* Selection Bottom Sheet Modal */}
      <Modal visible={!!activePicker} transparent animationType="fade" onRequestClose={() => setActivePicker(null)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setActivePicker(null)}
          className="flex-1 bg-black/50 justify-end"
        >
          <View
            className="bg-white rounded-t-3xl px-5 pt-5 max-h-[60%]"
            style={{ paddingBottom: sheetBottomPadding }}
          >
            <Text className="text-lg font-bold text-text-primary mb-3">
              {activePicker === 'resident'
                ? 'Select Person Supported'
                : activePicker === 'category'
                  ? 'Select Incident Category'
                  : activePicker === 'harm'
                    ? 'Select Harm Level'
                    : 'Select Severity'}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {activePicker === 'resident' &&
                (residentList.length === 0 ? (
                  <Text className="text-xs text-slate-500 py-6 text-center">
                    No people supported found in directory.
                  </Text>
                ) : (
                  residentList.map((r) => (
                    <TouchableOpacity
                      key={r.id}
                      onPress={() => {
                        onChange('residentId', r.id);
                        onChange('residentName', r.fullName);
                        onChange('roomNumber', r.roomNumber);
                        if (r.bedNumber !== undefined) {
                          onChange('bedNumber', r.bedNumber);
                        }
                        setActivePicker(null);
                      }}
                      className="py-3 px-2 border-b border-slate-100 flex-row items-center justify-between"
                    >
                      <Text className="text-sm font-semibold text-[#141F1E]">{r.fullName} ({r.roomNumber})</Text>
                      {form.residentId === r.id && <Check size={18} color="#4A706A" />}
                    </TouchableOpacity>
                  ))
                ))}

              {activePicker === 'category' &&
                CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => {
                      onChange('category', cat);
                      setActivePicker(null);
                    }}
                    className="py-3 px-2 border-b border-slate-100 flex-row items-center justify-between"
                  >
                    <Text className="text-sm font-medium text-[#141F1E]">{cat}</Text>
                    {form.category === cat && <Check size={18} color="#4A706A" />}
                  </TouchableOpacity>
                ))}

              {activePicker === 'harm' &&
                HARM_LEVELS.map((h) => (
                  <TouchableOpacity
                    key={h}
                    onPress={() => {
                      onChange('harmLevel', h);
                      setActivePicker(null);
                    }}
                    className="py-3 px-2 border-b border-slate-100 flex-row items-center justify-between"
                  >
                    <Text className="text-sm font-medium text-[#141F1E]">{h}</Text>
                    {form.harmLevel === h && <Check size={18} color="#4A706A" />}
                  </TouchableOpacity>
                ))}

              {activePicker === 'severity' &&
                SEVERITIES.map((sev) => (
                  <TouchableOpacity
                    key={sev}
                    onPress={() => {
                      onChange('severity', sev);
                      setActivePicker(null);
                    }}
                    className="py-3 px-2 border-b border-slate-100 flex-row items-center justify-between"
                  >
                    <Text className={`text-sm font-bold ${sev === 'High' || sev === 'Critical' ? 'text-red-500' : 'text-[#141F1E]'}`}>
                      {sev}
                    </Text>
                    {form.severity === sev && <Check size={18} color="#4A706A" />}
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <CalendarDatePickerModal
        visible={isCalendarOpen}
        value={form.incidentDate}
        onSelectDate={(dateIso) => onChange('incidentDate', dateIso)}
        onClose={() => setIsCalendarOpen(false)}
      />
    </View>
  );
}

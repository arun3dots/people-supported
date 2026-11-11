import React, { useEffect, useState } from 'react';
import { View, Modal, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { X, Droplet, Utensils, Check, Clock } from 'lucide-react-native';
import type { CreateFoodFluidLogDTO, UpdateFoodFluidLogDTO, MealSlot } from '@repo/schema';
import { Text, Button } from '../../presentation/components/common';
import { useSheetBottomPadding } from '../../presentation/hooks/useSheetBottomPadding';
import {
  BEVERAGE_PRESETS, CONSUMED_PERCENTAGES, FoodFluidLogItem, INTAKE_UNIT_OPTIONS, IntakeUnit, MEAL_SLOT_OPTIONS,
} from '../../domain/clinical/fluid-balance';
import { formatUkDate, formatUkTime } from '../../lib/date';
import { theme } from '../../theme';

interface AddFluidIntakeModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDateStr: string;
  editingLog: FoodFluidLogItem | null;
  isSaving: boolean;
  onSaveCreate: (payload: CreateFoodFluidLogDTO) => Promise<unknown>;
  onSaveUpdate: (args: { logId: string; data: UpdateFoodFluidLogDTO }) => Promise<unknown>;
}

export function AddFluidIntakeModal({
  visible, onClose, selectedDateStr, editingLog, isSaving, onSaveCreate, onSaveUpdate,
}: AddFluidIntakeModalProps) {
  const sheetBottomPadding = useSheetBottomPadding(Platform.OS === 'android' ? 32 : 20);

  const [type, setType] = useState<'Fluid' | 'Food'>('Fluid');
  const [amountStr, setAmountStr] = useState('');
  const [unit, setUnit] = useState<IntakeUnit>('ml');
  const [mealSlot, setMealSlot] = useState<MealSlot | ''>('');
  const [intakePct, setIntakePct] = useState<number | null>(null);
  const [timeStr, setTimeStr] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!visible) return;
    if (editingLog) {
      setType(editingLog.type || 'Fluid');
      setAmountStr(editingLog.amount != null ? String(editingLog.amount) : '');
      setUnit((editingLog.unit as IntakeUnit) || (editingLog.type === 'Food' ? 'portion' : 'ml'));
      setMealSlot((editingLog.mealSlot as MealSlot) || '');
      setIntakePct(editingLog.intakePercentage ?? null);
      setTimeStr(formatUkTime(editingLog.timestamp) || formatUkTime(new Date()));
      setNotes(editingLog.notes || '');
      setErrorMsg('');
      return;
    }
    setType('Fluid');
    setAmountStr('');
    setUnit('ml');
    setMealSlot('');
    setIntakePct(null);
    setTimeStr(formatUkTime(new Date()));
    setNotes('');
    setErrorMsg('');
  }, [visible, editingLog]);

  const handleTypeSelect = (nextType: 'Fluid' | 'Food') => {
    setType(nextType);
    setUnit(nextType === 'Fluid' ? 'ml' : 'portion');
  };

  const handleSubmit = async () => {
    const parsedAmount = Number(amountStr.trim());
    if (!amountStr.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Please specify a valid intake amount greater than 0.');
      return;
    }

    const timeMatch = timeStr.trim().match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
    if (!timeMatch) {
      setErrorMsg('Please enter a valid 24-hour time (HH:mm, e.g. 14:30).');
      return;
    }

    setErrorMsg('');
    const hh = String(parseInt(timeMatch[1], 10)).padStart(2, '0');
    const baseDate = editingLog?.timestamp ? editingLog.timestamp.slice(0, 10) : selectedDateStr;
    const composedDate = new Date(`${baseDate}T${hh}:${timeMatch[2]}:00`);
    const isoTimestamp = Number.isNaN(composedDate.getTime())
      ? new Date().toISOString()
      : composedDate.toISOString();

    const payload: CreateFoodFluidLogDTO = {
      type,
      amount: parsedAmount,
      unit,
      mealSlot: mealSlot || undefined,
      intakePercentage: intakePct !== null ? intakePct : undefined,
      notes: notes.trim() || undefined,
      timestamp: isoTimestamp,
    };

    try {
      if (editingLog) {
        await onSaveUpdate({ logId: editingLog.id, data: payload });
      } else {
        await onSaveCreate(payload);
      }
      onClose();
    } catch (err: unknown) {
      Alert.alert('Save Failed', err instanceof Error ? err.message : 'Unable to save intake record.');
    }
  };

  const shortDate = formatUkDate(
    editingLog?.timestamp || `${selectedDateStr}T12:00:00`,
    { day: '2-digit', month: 'short' }
  );

  const chipCls = (active: boolean) =>
    `px-3 py-1.5 rounded-full ${active ? 'bg-primary' : 'bg-surface'}`;
  const chipTextCls = (active: boolean) =>
    `text-xs ${active ? 'font-semibold text-white' : 'font-medium text-muted-foreground'}`;
  const inputFont = { fontFamily: theme.fonts.regular };

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
            <View className="flex-row items-center gap-2">
              <View
                className={`w-8 h-8 rounded-full items-center justify-center ${
                  type === 'Fluid' ? 'bg-primary-light' : 'bg-clinical-warningBg'
                }`}
              >
                {type === 'Fluid' ? <Droplet size={16} color="#4A706A" /> : <Utensils size={16} color="#C38C0B" />}
              </View>
              <Text className="text-lg font-bold text-foreground">
                {editingLog ? 'Edit Intake Entry' : 'Record Intake'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              disabled={isSaving}
              className="w-8 h-8 rounded-full bg-surface items-center justify-center"
              accessibilityLabel="Close intake form"
            >
              <X size={18} color="#5D5D5D" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* 1. Intake Type Selector */}
            <View className="mt-3 mb-3">
              <Text className="text-sm font-bold text-foreground mb-1.5">Intake Type</Text>
              <View className="flex-row gap-2">
                {(['Fluid', 'Food'] as const).map((itemType) => {
                  const active = type === itemType;
                  const isFluid = itemType === 'Fluid';
                  return (
                    <TouchableOpacity
                      key={itemType}
                      activeOpacity={0.8}
                      onPress={() => handleTypeSelect(itemType)}
                      className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border ${
                        active
                          ? isFluid ? 'bg-primary-light border-primary' : 'bg-clinical-warningBg border-clinical-warning'
                          : 'bg-surface border-transparent'
                      }`}
                    >
                      {isFluid ? <Droplet size={15} color="#4A706A" /> : <Utensils size={15} color="#C38C0B" />}
                      <Text className={`text-sm font-semibold ${active ? (isFluid ? 'text-primary' : 'text-clinical-warning') : 'text-muted-foreground'}`}>
                        {isFluid ? 'Fluid Intake' : 'Food Intake'}
                      </Text>
                      {active && <Check size={14} color={isFluid ? '#4A706A' : '#C38C0B'} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 2. Quick Fluid Presets */}
            {type === 'Fluid' && (
              <View className="mb-3">
                <Text className="text-sm font-bold text-foreground mb-1.5">Quick Amount Presets</Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {BEVERAGE_PRESETS.map((preset) => {
                    const selected = Number(amountStr) === preset.amountMl && unit === 'ml';
                    return (
                      <TouchableOpacity
                        key={preset.id}
                        activeOpacity={0.75}
                        onPress={() => {
                          setAmountStr(String(preset.amountMl));
                          setUnit('ml');
                          setErrorMsg('');
                        }}
                        className={chipCls(selected)}
                      >
                        <Text className={chipTextCls(selected)}>{preset.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* 3. Amount & Unit */}
            <View className="mb-3">
              <Text className="text-sm font-bold text-foreground mb-1.5">
                Amount <Text className="text-clinical-critical">*</Text> & Unit
              </Text>
              <View className="flex-row items-center gap-2 mb-1">
                <TextInput
                  value={amountStr}
                  onChangeText={(v) => {
                    setAmountStr(v);
                    if (errorMsg) setErrorMsg('');
                  }}
                  keyboardType="decimal-pad"
                  placeholder="e.g. 200"
                  placeholderTextColor="#8E8E93"
                  style={inputFont}
                  className="w-28 h-10 px-3 rounded-xl bg-surface text-md font-semibold text-foreground"
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-1.5">
                    {INTAKE_UNIT_OPTIONS.map((u) => {
                      const active = unit === u.value;
                      return (
                        <TouchableOpacity
                          key={u.value}
                          onPress={() => setUnit(u.value)}
                          className={`h-10 px-3 rounded-full items-center justify-center ${
                            active ? 'bg-primary' : 'bg-surface'
                          }`}
                        >
                          <Text className={chipTextCls(active)}>{u.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
              {Boolean(errorMsg) && <Text className="text-xs font-semibold text-clinical-critical">{errorMsg}</Text>}
            </View>

            {/* 4. Meal / Hydration Slot */}
            <View className="mb-3">
              <Text className="text-sm font-bold text-foreground mb-1.5">Meal / Hydration Slot</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-1.5">
                  {MEAL_SLOT_OPTIONS.map((slot) => {
                    const active = mealSlot === slot.value;
                    return (
                      <TouchableOpacity
                        key={slot.value}
                        onPress={() => setMealSlot(active ? '' : slot.value)}
                        className={chipCls(active)}
                      >
                        <Text className={chipTextCls(active)}>{slot.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            {/* 5. Percentage Consumed & Time Logged */}
            <View className="flex-row gap-3 mb-3">
              <View className="flex-1">
                <Text className="text-sm font-bold text-foreground mb-1.5">% Consumed</Text>
                <View className="flex-row gap-1.5">
                  {CONSUMED_PERCENTAGES.map((pct) => {
                    const active = intakePct === pct;
                    return (
                      <TouchableOpacity
                        key={pct}
                        onPress={() => setIntakePct(active ? null : pct)}
                        className={`flex-1 py-2 rounded-full items-center ${
                          active ? 'bg-primary' : 'bg-surface'
                        }`}
                      >
                        <Text className={chipTextCls(active)}>{pct}%</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View className="w-28">
                <Text className="text-sm font-bold text-foreground mb-1.5">Time ({shortDate})</Text>
                <View className="h-10 px-2.5 rounded-xl bg-surface flex-row items-center gap-1.5">
                  <Clock size={13} color="#5D5D5D" />
                  <TextInput
                    value={timeStr}
                    onChangeText={setTimeStr}
                    placeholder="14:30"
                    placeholderTextColor="#8E8E93"
                    maxLength={5}
                    style={inputFont}
                    className="flex-1 text-sm font-semibold text-foreground p-0"
                  />
                </View>
              </View>
            </View>

            {/* 6. Notes / Details */}
            <View className="mb-4">
              <Text className="text-sm font-bold text-foreground mb-1.5">Notes / Details</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="e.g. Water, Orange squash, Cup of tea with milk..."
                placeholderTextColor="#8E8E93"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                style={inputFont}
                className="w-full bg-surface rounded-xl p-3 text-md text-foreground min-h-[76px]"
              />
            </View>

            {/* Footer Action Buttons */}
            <View className="flex-row gap-2.5 pt-1 pb-2">
              <Button variant="outline" className="flex-1" onPress={onClose} disabled={isSaving}>
                Cancel
              </Button>
              <Button
                variant="default"
                className="flex-1 bg-[#4A706A]"
                onPress={() => void handleSubmit()}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : editingLog ? 'Update Intake' : 'Save Intake'}
              </Button>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

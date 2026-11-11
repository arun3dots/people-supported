import React, { useState, useMemo } from 'react';
import { View, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon } from 'lucide-react-native';
import { Text } from '../../presentation/components/common';
import { getUkDateString, formatUkDate, normalizeToIsoDate } from '../../lib/date';

interface CalendarDatePickerModalProps {
  visible: boolean;
  value?: string;
  maxDate?: string;
  onSelectDate: (dateStr: string) => void;
  onClose: () => void;
}

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function CalendarDatePickerModal({
  visible,
  value,
  maxDate,
  onSelectDate,
  onClose,
}: CalendarDatePickerModalProps) {
  const todayUk = useMemo(() => maxDate || getUkDateString(new Date(), true), [maxDate]);
  const initialIso = useMemo(() => {
    const norm = normalizeToIsoDate(value);
    return norm > todayUk ? todayUk : norm;
  }, [value, todayUk]);

  const [selectedDate, setSelectedDate] = useState<string>(initialIso);

  const [viewDate, setViewDate] = useState<Date>(() => {
    const parts = initialIso.split('-');
    if (parts.length === 3) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
    }
    return new Date();
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthName = useMemo(() => {
    return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(viewDate);
  }, [viewDate]);

  const daysInMonth = useMemo(() => {
    return new Date(year, month + 1, 0).getDate();
  }, [year, month]);

  const startDayOfWeek = useMemo(() => {
    // 0 = Mon, 6 = Sun
    const day = new Date(year, month, 1).getDay();
    return (day + 6) % 7;
  }, [year, month]);

  const canGoNextMonth = useMemo(() => {
    const nextMonthFirst = new Date(year, month + 1, 1);
    const nextMonthFirstIso = `${nextMonthFirst.getFullYear()}-${String(nextMonthFirst.getMonth() + 1).padStart(2, '0')}-01`;
    return nextMonthFirstIso <= todayUk;
  }, [year, month, todayUk]);

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    if (canGoNextMonth) {
      setViewDate(new Date(year, month + 1, 1));
    }
  };

  const handleQuickSelect = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    const iso = getUkDateString(d, true);
    setSelectedDate(iso);
    const parts = iso.split('-');
    if (parts.length === 3) {
      setViewDate(new Date(Number(parts[0]), Number(parts[1]) - 1, 1));
    }
  };

  const handleConfirm = () => {
    onSelectDate(selectedDate);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-center items-center px-4">
        <View className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-full bg-primary-light items-center justify-center">
                <CalendarIcon size={16} color="#4A706A" />
              </View>
              <Text className="text-base font-bold text-text-primary">Select Incident Date</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-1.5 rounded-full bg-slate-100">
              <X size={16} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Quick Choice Presets */}
          <View className="flex-row gap-2 mb-3">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleQuickSelect(0)}
              className={`flex-1 py-1.5 rounded-lg border items-center ${
                selectedDate === todayUk
                  ? 'bg-primary border-primary'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  selectedDate === todayUk ? 'text-white' : 'text-text-primary'
                }`}
              >
                Today
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleQuickSelect(1)}
              className="flex-1 py-1.5 rounded-lg border bg-slate-50 border-slate-200 items-center"
            >
              <Text className="text-xs font-semibold text-text-primary">Yesterday</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleQuickSelect(2)}
              className="flex-1 py-1.5 rounded-lg border bg-slate-50 border-slate-200 items-center"
            >
              <Text className="text-xs font-semibold text-text-primary">2 Days Ago</Text>
            </TouchableOpacity>
          </View>

          {/* Month & Year Navigation */}
          <View className="flex-row items-center justify-between mb-2 px-1">
            <TouchableOpacity
              onPress={handlePrevMonth}
              className="p-1.5 rounded-lg bg-slate-100"
              accessibilityLabel="Previous month"
            >
              <ChevronLeft size={18} color="#141F1E" />
            </TouchableOpacity>

            <Text className="text-sm font-bold text-text-primary">{monthName}</Text>

            <TouchableOpacity
              onPress={handleNextMonth}
              disabled={!canGoNextMonth}
              className={`p-1.5 rounded-lg ${canGoNextMonth ? 'bg-slate-100' : 'bg-slate-50 opacity-30'}`}
              accessibilityLabel="Next month"
            >
              <ChevronRight size={18} color="#141F1E" />
            </TouchableOpacity>
          </View>

          {/* Day of Week Headers */}
          <View className="flex-row justify-between mb-1 px-1">
            {DAYS_OF_WEEK.map((day) => (
              <View key={day} className="w-9 items-center py-1">
                <Text className="text-[11px] font-bold text-text-secondary">{day}</Text>
              </View>
            ))}
          </View>

          {/* Days Grid */}
          <ScrollView className="max-h-60" showsVerticalScrollIndicator={false}>
            <View className="flex-row flex-wrap">
              {/* Empty leading padding slots */}
              {Array.from({ length: startDayOfWeek }).map((_, i) => (
                <View key={`empty-${i}`} className="w-[14.28%] h-9" />
              ))}

              {/* Day numbers */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateIso = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const isFuture = dateIso > todayUk;
                const isSelected = dateIso === selectedDate;
                const isToday = dateIso === todayUk;

                return (
                  <View key={dateIso} className="w-[14.28%] h-9 p-0.5 items-center justify-center">
                    <TouchableOpacity
                      disabled={isFuture}
                      onPress={() => setSelectedDate(dateIso)}
                      activeOpacity={0.7}
                      className={`w-8 h-8 rounded-full items-center justify-center ${
                        isSelected
                          ? 'bg-primary'
                          : isToday
                          ? 'border border-primary bg-primary-light'
                          : isFuture
                          ? 'opacity-20'
                          : 'bg-transparent'
                      }`}
                    >
                      <Text
                        className={`text-xs ${
                          isSelected
                            ? 'font-bold text-white'
                            : isToday
                            ? 'font-bold text-primary'
                            : isFuture
                            ? 'text-slate-400 line-through'
                            : 'font-semibold text-text-primary'
                        }`}
                      >
                        {dayNum}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          {/* Clinical note */}
          <View className="mt-3 pt-2.5 border-t border-slate-100">
            <Text className="text-[11px] text-text-secondary text-center">
              Selected: <Text className="font-bold text-text-primary">{formatUkDate(selectedDate)}</Text>
              {' • Future dates are disabled per audit guidelines'}
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-2 mt-3.5">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 py-2.5 rounded-full bg-slate-100 items-center justify-center"
            >
              <Text className="text-xs font-semibold text-text-secondary">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleConfirm}
              className="flex-1 py-2.5 rounded-full bg-primary items-center justify-center"
            >
              <Text className="text-xs font-bold text-white">Select Date</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}


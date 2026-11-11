import React, { useState } from 'react';
import { View, Switch, TouchableOpacity, Alert } from 'react-native';
import { Bell, Clock, Globe, ChevronRight } from 'lucide-react-native';
import { Text } from '../ui/text';

export function SettingsPreferencesCard() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [shiftRemindersEnabled, setShiftRemindersEnabled] = useState(true);

  const handleLanguagePress = () => {
    Alert.alert('Language Settings', 'Current language is English (UK). Multiple language localizations are managed by your care provider.');
  };

  return (
    <View className="mb-4">
      <Text className="text-base font-bold text-text-primary mb-2.5">
        Preferences
      </Text>

      <View className="bg-surface rounded-2xl overflow-hidden divide-y divide-slate-200/70">
        {/* 1. Push Notifications */}
        <View className="p-3.5 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3 flex-1 mr-2">
            <View className="w-9 h-9 rounded-full bg-white items-center justify-center">
              <Bell size={16} color="#64748B" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-text-primary">Push notifications</Text>
              <Text className="text-xs text-text-secondary mt-0.5">
                Alerts for tasks, messages and updates
              </Text>
            </View>
          </View>
          <Switch
            value={pushEnabled}
            onValueChange={setPushEnabled}
            trackColor={{ false: '#E2E8F0', true: '#4A706A' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* 2. Shift Reminders */}
        <View className="p-3.5 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3 flex-1 mr-2">
            <View className="w-9 h-9 rounded-full bg-white items-center justify-center">
              <Clock size={16} color="#64748B" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-text-primary">Shift reminders</Text>
              <Text className="text-xs text-text-secondary mt-0.5">
                Notify me before my shift starts
              </Text>
            </View>
          </View>
          <Switch
            value={shiftRemindersEnabled}
            onValueChange={setShiftRemindersEnabled}
            trackColor={{ false: '#E2E8F0', true: '#4A706A' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* 3. Language */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleLanguagePress}
          className="p-3.5 flex-row items-center justify-between"
        >
          <View className="flex-row items-center gap-3 flex-1 mr-2">
            <View className="w-9 h-9 rounded-full bg-white items-center justify-center">
              <Globe size={16} color="#64748B" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-text-primary">Language</Text>
              <Text className="text-xs text-text-secondary mt-0.5">English (UK)</Text>
            </View>
          </View>
          <ChevronRight size={16} color="#94A3B8" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

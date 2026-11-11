import React from 'react';
import { View } from 'react-native';
import { ScreenWrapper } from '../../src/components/common/ScreenWrapper';
import { Text } from '../../src/components/ui/text';
import { SettingsProfileCard } from '../../src/components/settings/SettingsProfileCard';
import { SettingsPersonalInfoCard } from '../../src/components/settings/SettingsPersonalInfoCard';
import { SettingsSecurityCard } from '../../src/components/settings/SettingsSecurityCard';
import { SettingsPreferencesCard } from '../../src/components/settings/SettingsPreferencesCard';
import { SettingsClinicalComplianceCard } from '../../src/components/settings/SettingsClinicalComplianceCard';
import { SettingsSupportCard } from '../../src/components/settings/SettingsSupportCard';

export default function SettingsScreen() {
  return (
    <ScreenWrapper scrollable>
      {/* Page Header */}
      <View className="pt-2 pb-4">
        <Text className="text-xl font-bold text-text-primary">
          Settings
        </Text>
        <Text className="text-sm text-text-secondary mt-0.5">
          Account profile, security & clinical preferences
        </Text>
      </View>

      {/* 1. Staff Profile Card */}
      <SettingsProfileCard />

      {/* 2. Personal & Facility Information */}
      <SettingsPersonalInfoCard />

      {/* 3. Security (Change Password) */}
      <SettingsSecurityCard />

      {/* 4. Preferences (Notifications, Language) */}
      <SettingsPreferencesCard />

      {/* 5. Clinical & DSPT Compliance (Offline Sync, Biometric Lock, Shift Sign Out) */}
      <SettingsClinicalComplianceCard />

      {/* 6. Support & About */}
      <SettingsSupportCard />
    </ScreenWrapper>
  );
}

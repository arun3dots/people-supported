import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ShieldCheck, MailCheck, KeyRound, Lock } from 'lucide-react-native';
import { Text } from '../ui/text';
import { Badge } from '../ui/badge';
import { MyProfileData, formatPasswordAge } from './profile.types';
import { theme } from '../../theme';

interface ProfileSecuritySectionProps {
  profile: MyProfileData | null;
  onChangePasswordPress: () => void;
}

export function ProfileSecuritySection({
  profile,
  onChangePasswordPress,
}: ProfileSecuritySectionProps) {
  const mfaEnabled = profile?.mfaEnabled ?? false;
  const emailVerified = profile?.emailVerified ?? false;
  const passwordAgeText = formatPasswordAge(profile?.passwordChangedAt);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text className="text-base font-bold text-text-primary">Account Security</Text>
      </View>

      <View style={styles.contentList}>
        {/* MFA Status */}
        <View style={styles.itemRow}>
          <View style={styles.iconContainer}>
            <ShieldCheck size={15} color={mfaEnabled ? '#059669' : '#64748B'} />
          </View>
          <View style={styles.textContainer}>
            <Text className="text-xs text-text-muted">Two-Factor Authentication (MFA)</Text>
            <Text className="text-sm font-semibold text-text-primary">
              {mfaEnabled ? 'Protected via authenticator' : 'Not configured'}
            </Text>
          </View>
          <Badge variant={mfaEnabled ? 'clinicalSafe' : 'secondary'} size="sm">
            {mfaEnabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </View>

        {/* Email Verification */}
        <View style={styles.itemRow}>
          <View style={styles.iconContainer}>
            <MailCheck size={15} color={emailVerified ? '#059669' : '#D97706'} />
          </View>
          <View style={styles.textContainer}>
            <Text className="text-xs text-text-muted">Email Verification</Text>
            <Text className="text-sm font-semibold text-text-primary">
              {emailVerified ? 'Email address verified' : 'Pending verification'}
            </Text>
          </View>
          <Badge variant={emailVerified ? 'clinicalSafe' : 'clinicalWarning'} size="sm">
            {emailVerified ? 'Verified' : 'Unverified'}
          </Badge>
        </View>

        {/* Password Age */}
        <View style={styles.itemRow}>
          <View style={styles.iconContainer}>
            <KeyRound size={15} color={theme.colors.primary.DEFAULT} />
          </View>
          <View style={styles.textContainer}>
            <Text className="text-xs text-text-muted">Password Status</Text>
            <Text className="text-sm font-semibold text-text-primary">
              {passwordAgeText}
            </Text>
          </View>
        </View>

        {/* Change Password Button */}
        <TouchableOpacity
          style={styles.changePasswordBtn}
          activeOpacity={0.8}
          onPress={onChangePasswordPress}
          accessibilityLabel="Change account password"
        >
          <Lock size={14} color={theme.colors.primary.DEFAULT} />
          <Text className="text-xs font-semibold text-primary ml-1.5">
            Change Password
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F7F7F7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  headerRow: {
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  contentList: {
    paddingTop: 10,
    gap: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  changePasswordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    marginTop: 4,
  },
});


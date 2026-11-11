import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Lock, Eye, EyeOff } from 'lucide-react-native';
import { CHANGE_PASSWORD } from '@repo/endpoints';
import { makeMobileApiCall } from '../../data/api/client';
import { Text } from '../ui/text';
import { theme } from '../../theme/tokens';
import {
  PasswordRequirementsView,
  validatePasswordCriteria,
} from '../profile/PasswordRequirementsView';

export function SettingsSecurityCard() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdatePassword = async () => {
    if (!currentPassword.trim()) {
      Alert.alert('Current Password Required', 'Please enter your current account password.');
      return;
    }
    const criteria = validatePasswordCriteria(newPassword, confirmPassword);
    if (!criteria.minChars) {
      Alert.alert('Password Too Short', 'New password must be at least 12 characters long.');
      return;
    }
    if (!criteria.hasUpper || !criteria.hasLower || !criteria.hasDigit || !criteria.hasSpecial) {
      Alert.alert(
        'Password Requirements Unmet',
        'Your new password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
      );
      return;
    }
    if (!criteria.matches) {
      Alert.alert('Password Mismatch', 'New password and confirmation do not match.');
      return;
    }

    try {
      setIsUpdating(true);
      await makeMobileApiCall<{ success: boolean }>(CHANGE_PASSWORD, {
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
        confirmPassword: confirmPassword.trim(),
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Password Updated', 'Your security password has been changed successfully.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update password. Please check your current password.';
      Alert.alert('Update Failed', msg);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <View className="mb-4">
      <Text className="text-base font-bold text-text-primary mb-2.5">
        Security
      </Text>

      <View className="bg-surface rounded-2xl p-4">
        <Text className="text-sm font-bold text-text-primary mb-3">
          Change password
        </Text>

        {/* 1. Current Password */}
        <View className="mb-3">
          <Text className="text-xs font-medium text-text-secondary mb-1">
            Current password
          </Text>
          <View className="bg-white rounded-xl px-3.5 h-11 flex-row items-center gap-2">
            <Lock size={15} color="#94A3B8" />
            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showCurrent}
              placeholder="Enter current password"
              placeholderTextColor="#94A3B8"
              style={{ fontFamily: theme.fonts.regular }}
              className="flex-1 text-sm text-text-primary h-full"
            />
            <TouchableOpacity
              onPress={() => setShowCurrent(!showCurrent)}
              className="p-1"
              accessibilityLabel={showCurrent ? 'Hide password' : 'Show password'}
            >
              {showCurrent ? (
                <EyeOff size={16} color="#94A3B8" />
              ) : (
                <Eye size={16} color="#94A3B8" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. New Password */}
        <View className="mb-3">
          <Text className="text-xs font-medium text-text-secondary mb-1">
            New password
          </Text>
          <View className="bg-white rounded-xl px-3.5 h-11 flex-row items-center gap-2">
            <Lock size={15} color="#94A3B8" />
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNew}
              placeholder="Enter new password"
              placeholderTextColor="#94A3B8"
              style={{ fontFamily: theme.fonts.regular }}
              className="flex-1 text-sm text-text-primary h-full"
            />
            <TouchableOpacity
              onPress={() => setShowNew(!showNew)}
              className="p-1"
              accessibilityLabel={showNew ? 'Hide password' : 'Show password'}
            >
              {showNew ? (
                <EyeOff size={16} color="#94A3B8" />
              ) : (
                <Eye size={16} color="#94A3B8" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Confirm New Password */}
        <View className="mb-3.5">
          <Text className="text-xs font-medium text-text-secondary mb-1">
            Confirm new password
          </Text>
          <View className="bg-white rounded-xl px-3.5 h-11 flex-row items-center gap-2">
            <Lock size={15} color="#94A3B8" />
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirm}
              placeholder="Re-enter new password"
              placeholderTextColor="#94A3B8"
              style={{ fontFamily: theme.fonts.regular }}
              className="flex-1 text-sm text-text-primary h-full"
            />
            <TouchableOpacity
              onPress={() => setShowConfirm(!showConfirm)}
              className="p-1"
              accessibilityLabel={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? (
                <EyeOff size={16} color="#94A3B8" />
              ) : (
                <Eye size={16} color="#94A3B8" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Password Requirements Checklist (BUG-053) */}
        <PasswordRequirementsView
          newPassword={newPassword}
          confirmPassword={confirmPassword}
        />

        {/* Submit Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleUpdatePassword}
          disabled={isUpdating}
          className="bg-primary rounded-full py-3 items-center justify-center mt-1"
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text className="text-xs font-bold text-white">
              Update password
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

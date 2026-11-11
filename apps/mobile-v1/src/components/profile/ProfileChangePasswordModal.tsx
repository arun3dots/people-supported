import React, { useState } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Lock, Eye, EyeOff } from 'lucide-react-native';
import { CHANGE_PASSWORD } from '@repo/endpoints';
import { makeMobileApiCall } from '../../data/api/client';
import { Text } from '../ui/text';
import { theme } from '../../theme';
import { useSheetBottomPadding } from '../../presentation/hooks/useSheetBottomPadding';
import {
  PasswordRequirementsView,
  validatePasswordCriteria,
} from './PasswordRequirementsView';

interface ProfileChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ProfileChangePasswordModal({
  visible,
  onClose,
  onSuccess,
}: ProfileChangePasswordModalProps) {
  const sheetBottomPadding = useSheetBottomPadding(24);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
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
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update password. Please check your current password.';
      Alert.alert('Update Failed', msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={[styles.container, { paddingBottom: sheetBottomPadding }]}>
          <View style={styles.header}>
            <Text className="text-lg font-bold text-text-primary">Change Password</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} accessibilityLabel="Close change password">
              <X size={20} color="#5D5D5D" />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            {/* Current Password */}
            <View style={styles.inputGroup}>
              <Text className="text-xs font-semibold text-foreground mb-1">Current Password</Text>
              <View style={styles.inputWrapper}>
                <Lock size={15} color="#94A3B8" />
                <TextInput
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry={!showCurrent}
                  placeholder="Enter current password"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                />
                <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} style={styles.eyeBtn}>
                  {showCurrent ? <EyeOff size={16} color="#94A3B8" /> : <Eye size={16} color="#94A3B8" />}
                </TouchableOpacity>
              </View>
            </View>

            {/* New Password */}
            <View style={styles.inputGroup}>
              <Text className="text-xs font-semibold text-foreground mb-1">New Password (min 8 chars)</Text>
              <View style={styles.inputWrapper}>
                <Lock size={15} color="#94A3B8" />
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNew}
                  placeholder="Enter new password"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                />
                <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.eyeBtn}>
                  {showNew ? <EyeOff size={16} color="#94A3B8" /> : <Eye size={16} color="#94A3B8" />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text className="text-xs font-semibold text-foreground mb-1">Confirm New Password</Text>
              <View style={styles.inputWrapper}>
                <Lock size={15} color="#94A3B8" />
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                  placeholder="Re-enter new password"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                  {showConfirm ? <EyeOff size={16} color="#94A3B8" /> : <Eye size={16} color="#94A3B8" />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Password Requirements Checklist (BUG-053) */}
            <PasswordRequirementsView
              newPassword={newPassword}
              confirmPassword={confirmPassword}
            />

            {/* Submit */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleUpdate}
              disabled={isUpdating}
              style={styles.submitBtn}
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-xs font-bold text-white">Update Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#F7F7F7',
    borderRadius: 16,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#F7F7F7',
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    fontFamily: theme.fonts.regular,
    color: '#141F1E',
    height: '100%',
  },
  eyeBtn: {
    padding: 4,
  },
  submitBtn: {
    backgroundColor: theme.colors.primary.DEFAULT,
    borderRadius: 9999,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
});


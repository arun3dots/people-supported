import React, { useState, useEffect } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Save, Lock } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { UPDATE_MY_PROFILE, GET_MY_PROFILE, AUTH_ME } from '@repo/endpoints';
import { makeMobileApiCall } from '../../data/api/client';
import { useAuth } from '../../presentation/context/AuthContext';
import { Text } from '../ui/text';
import { MyProfileData } from './profile.types';
import { theme } from '../../theme';
import { useSheetBottomPadding } from '../../presentation/hooks/useSheetBottomPadding';

interface ProfileEditModalProps {
  visible: boolean;
  profile: MyProfileData | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProfileEditModal({
  visible,
  profile,
  onClose,
  onSuccess,
}: ProfileEditModalProps) {
  const sheetBottomPadding = useSheetBottomPadding(Platform.OS === 'android' ? 32 : 20);
  const queryClient = useQueryClient();
  const { updateUserProfile } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && profile) {
      setFullName(profile.fullName || '');
      setEmail(profile.email || '');
      setPhoneNumber(profile.phoneNumber || '');
      setDepartment(profile.department || '');
      setAddressLine1(profile.addressLine1 || '');
      setAddressLine2(profile.addressLine2 || '');
      setCity(profile.city || '');
      setPostcode(profile.postcode || '');
      setPreferredLanguage(profile.preferredLanguage || 'English (UK)');
    }
  }, [visible, profile]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        phoneNumber: phoneNumber.trim() || null,
        department: department.trim() || null,
        addressLine1: addressLine1.trim() || null,
        addressLine2: addressLine2.trim() || null,
        city: city.trim() || null,
        postcode: postcode.trim() || null,
        preferredLanguage: preferredLanguage.trim() || null,
      };
      await makeMobileApiCall(UPDATE_MY_PROFILE, payload);
      await updateUserProfile(payload);
      await queryClient.invalidateQueries({ queryKey: [GET_MY_PROFILE] });
      await queryClient.invalidateQueries({ queryKey: [AUTH_ME] });

      Alert.alert('Profile Updated', 'Your profile details have been saved.');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile.';
      Alert.alert('Update Failed', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text className="text-lg font-bold text-text-primary">Edit Profile</Text>
              <Text className="text-xs text-text-secondary mt-0.5">
                Update your contact and residential details
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close edit form">
              <X size={20} color="#5D5D5D" />
            </TouchableOpacity>
          </View>

          {/* Form ScrollView */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Read-Only: Full Name (BUG-008: except name and email, others can be edited) */}
            <View style={styles.inputGroup}>
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-xs font-semibold text-text-primary">Full Name</Text>
                <View className="flex-row items-center gap-1">
                  <Lock size={11} color="#64748B" />
                  <Text className="text-xs text-text-muted font-medium">Locked</Text>
                </View>
              </View>
              <TextInput
                value={fullName}
                editable={false}
                placeholder="Full name"
                placeholderTextColor="#94A3B8"
                style={[styles.input, styles.readOnlyInput]}
              />
              <Text className="text-xs text-text-muted mt-1 italic">
                Official name is managed by your service administrator
              </Text>
            </View>

            {/* Read-Only: Work Email */}
            <View style={styles.inputGroup}>
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-xs font-semibold text-text-primary">Work Email Address</Text>
                <View className="flex-row items-center gap-1">
                  <Lock size={11} color="#64748B" />
                  <Text className="text-xs text-text-muted font-medium">Locked</Text>
                </View>
              </View>
              <TextInput
                value={email}
                editable={false}
                placeholder="Work email"
                placeholderTextColor="#94A3B8"
                style={[styles.input, styles.readOnlyInput]}
              />
              <Text className="text-xs text-text-muted mt-1 italic">
                Work email address is managed by administrator
              </Text>
            </View>

            {/* Editable: Phone Number */}
            <View style={styles.inputGroup}>
              <Text className="text-xs font-semibold text-foreground mb-1">Phone Number</Text>
              <TextInput
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="+44 7700 900077"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                style={styles.input}
              />
            </View>

            {/* Editable: Department */}
            <View style={styles.inputGroup}>
              <Text className="text-xs font-semibold text-foreground mb-1">Department</Text>
              <TextInput
                value={department}
                onChangeText={setDepartment}
                placeholder="e.g. Supported Living, Autism Support, Complex Care"
                placeholderTextColor="#94A3B8"
                style={styles.input}
              />
            </View>

            {/* Editable: Address Line 1 */}
            <View style={styles.inputGroup}>
              <Text className="text-xs font-semibold text-foreground mb-1">Address Line 1</Text>
              <TextInput
                value={addressLine1}
                onChangeText={setAddressLine1}
                placeholder="House number and street"
                placeholderTextColor="#94A3B8"
                style={styles.input}
              />
            </View>

            {/* Editable: Address Line 2 */}
            <View style={styles.inputGroup}>
              <Text className="text-xs font-semibold text-foreground mb-1">Address Line 2 (Optional)</Text>
              <TextInput
                value={addressLine2}
                onChangeText={setAddressLine2}
                placeholder="Apartment, suite, or flat"
                placeholderTextColor="#94A3B8"
                style={styles.input}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text className="text-xs font-semibold text-foreground mb-1">City</Text>
                <TextInput
                  value={city}
                  onChangeText={setCity}
                  placeholder="London"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text className="text-xs font-semibold text-foreground mb-1">Postcode</Text>
                <TextInput
                  value={postcode}
                  onChangeText={setPostcode}
                  placeholder="SW1A 1AA"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                  style={styles.input}
                />
              </View>
            </View>

            {/* Editable: Preferred Language */}
            <View style={styles.inputGroup}>
              <Text className="text-xs font-semibold text-foreground mb-1">Preferred Language</Text>
              <TextInput
                value={preferredLanguage}
                onChangeText={setPreferredLanguage}
                placeholder="English (UK)"
                placeholderTextColor="#94A3B8"
                style={styles.input}
              />
            </View>
          </ScrollView>

          {/* Footer Save Button (BUG-006: Elevated above bottom navigation & Android system bar) */}
          <View style={[styles.footer, { paddingBottom: Math.max(sheetBottomPadding, Platform.OS === 'android' ? 36 : 24) }]}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSave}
              disabled={saving}
              style={styles.saveBtn}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Save size={16} color="#FFFFFF" />
                  <Text className="text-sm font-bold text-white ml-2">Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.55)', justifyContent: 'flex-end', zIndex: 99999, elevation: 99 },
  container: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '88%', elevation: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  closeBtn: { padding: 6, backgroundColor: '#F1F5F9', borderRadius: 20 },
  scrollArea: { paddingHorizontal: 20 },
  scrollContent: { paddingTop: 16, paddingBottom: 16 },
  inputGroup: { marginBottom: 14 },
  row: { flexDirection: 'row' },
  input: { height: 44, borderRadius: 12, paddingHorizontal: 14, fontSize: 14, fontFamily: theme.fonts.regular, color: '#141F1E', backgroundColor: '#F7F7F7' },
  readOnlyInput: { backgroundColor: '#EEF2F1', color: '#64748B' },
  footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', backgroundColor: '#FFFFFF' },
  saveBtn: { backgroundColor: theme.colors.primary.DEFAULT, borderRadius: 9999, height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});

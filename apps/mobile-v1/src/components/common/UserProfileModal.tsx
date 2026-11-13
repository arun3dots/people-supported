import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { X, LogOut, Building2, Camera } from 'lucide-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { GET_MY_PROFILE } from '@repo/endpoints';
import { makeMobileApiCall } from '../../data/api/client';
import { Text } from '../ui/text';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Avatar } from './Avatar';
import { useAuth } from '../../presentation/context/AuthContext';
import { useProfilePhotoUpload } from '../../presentation/hooks/useProfilePhotoUpload';
import { MyProfileData } from '../profile/profile.types';
import { ProfilePersonalSection } from '../profile/ProfilePersonalSection';
import { ProfileEditModal } from '../profile/ProfileEditModal';
import { ProfileSecuritySection } from '../profile/ProfileSecuritySection';
import { ProfileChangePasswordModal } from '../profile/ProfileChangePasswordModal';
import { ProfileActivitySection } from '../profile/ProfileActivitySection';
import { ProfilePhotoPickerModal } from '../profile/ProfilePhotoPickerModal';

export interface UserProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export function UserProfileModal({ visible, onClose }: UserProfileModalProps) {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const { isUploading: isUploadingPhoto, pickAndUpload } = useProfilePhotoUpload();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [photoPickerOpen, setPhotoPickerOpen] = useState(false);

  const { data: profile, isLoading, refetch } = useQuery<MyProfileData>({
    queryKey: [GET_MY_PROFILE],
    queryFn: () => makeMobileApiCall<MyProfileData>(GET_MY_PROFILE),
    enabled: visible,
    staleTime: 30000,
  });

  const userAvatarUrl =
    profile?.profilePhotoUrl ||
    user?.avatarUrl ||
    user?.profilePhotoUrl ||
    user?.profilePicture ||
    user?.photoUrl ||
    null;

  const displayName = profile?.fullName || user?.fullName || 'Support Staff';
  const roleName = 'Support Staff' //||profile?.role?.name || user?.roleName || ;

  const handleProfileUpdated = () => {
    queryClient.invalidateQueries({ queryKey: [GET_MY_PROFILE] });
    refetch();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.profileCard}>
          {/* Top Modal Header */}
          <View style={styles.profileHeader}>
            <Text className="text-base font-bold text-foreground">User Profile</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityLabel="Close profile dialog"
            >
              <X size={20} color="#5D5D5D" />
            </TouchableOpacity>
          </View>

          {isLoading && !profile ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4A706A" />
            </View>
          ) : (
            <ScrollView
              style={styles.scrollContent}
              contentContainerStyle={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Profile Header Card */}
              <View style={styles.userHeaderCard}>
                <View className="relative">
                  <Avatar
                    name={displayName}
                    imageUrl={userAvatarUrl}
                    size="xl"
                  />
                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={isUploadingPhoto}
                    onPress={() => setPhotoPickerOpen(true)}
                    className="w-7 h-7 rounded-full bg-[#4A706A] items-center justify-center border-2 border-white absolute bottom-0 right-0"
                    accessibilityLabel="Upload profile photo"
                  >
                    {isUploadingPhoto ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Camera size={13} color="#FFFFFF" strokeWidth={2.2} />
                    )}
                  </TouchableOpacity>
                </View>
                <Text className="text-base font-bold text-foreground mt-2.5 mb-1 text-center">
                  {displayName}
                </Text>

                <View style={styles.badgeRow}>
                  <Badge variant="clinicalSafe" size="sm">
                    <Text className="text-xs font-semibold text-[#1D5E2E]">
                      {roleName}
                    </Text>
                  </Badge>
                  {profile?.department && (
                    <Badge variant="outline" size="sm">
                      <Text className="text-xs font-medium text-slate-700">
                        {profile.department}
                      </Text>
                    </Badge>
                  )}
                </View>

                {user?.organizationName && (
                  <View style={styles.orgRow}>
                    <Building2 size={13} color="#64748B" />
                    <Text className="text-xs text-muted-foreground ml-1" numberOfLines={1}>
                      {user.organizationName}
                    </Text>
                  </View>
                )}
              </View>

              {/* Section 1: Personal & Contact Information */}
              <ProfilePersonalSection
                profile={profile ?? null}
                onEditPress={() => setEditModalOpen(true)}
              />

              {/* Section 2: Account Security */}
              <ProfileSecuritySection
                profile={profile ?? null}
                onChangePasswordPress={() => setChangePasswordModalOpen(true)}
              />

              {/* Section 3: Recent Account Activity */}
              <ProfileActivitySection userId={user?.id} />

              {/* Section 4: Logout Button (BUG-011: Web logout consistency) */}
              <View style={styles.logoutWrapper}>
                <Button
                  variant="destructive"
                  className="w-full h-11 flex-row items-center justify-center rounded-xl"
                  onPress={async () => {
                    onClose();
                    await logout();
                  }}
                >
                  <LogOut size={16} color="#FFFFFF" />
                  <Text className="text-white font-bold ml-2">Log Out</Text>
                </Button>
              </View>
            </ScrollView>
          )}
        </View>

        {/* Edit Profile Form Modal */}
        <ProfileEditModal
          visible={editModalOpen}
          profile={profile ?? null}
          onClose={() => setEditModalOpen(false)}
          onSuccess={handleProfileUpdated}
        />

        {/* Change Password Modal */}
        <ProfileChangePasswordModal
          visible={changePasswordModalOpen}
          onClose={() => setChangePasswordModalOpen(false)}
          onSuccess={handleProfileUpdated}
        />

        {/* Profile Photo Upload Picker Modal */}
        <ProfilePhotoPickerModal
          visible={photoPickerOpen}
          onClose={() => setPhotoPickerOpen(false)}
          onSelectSource={(source) =>
            void pickAndUpload(source).then((ok) => {
              if (ok) handleProfileUpdated();
            })
          }
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  closeButton: {
    padding: 6,
    backgroundColor: '#F7F7F7',
    borderRadius: 16,
  },
  loadingContainer: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  userHeaderCard: {
    backgroundColor: '#F7F7F7',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  orgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  logoutWrapper: {
    marginTop: 4,
  },
});

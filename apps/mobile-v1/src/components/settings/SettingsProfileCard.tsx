import React, { useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Camera, Award } from 'lucide-react-native';
import { Text } from '../ui/text';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../presentation/context/AuthContext';
import { useProfilePhotoUpload } from '../../presentation/hooks/useProfilePhotoUpload';
import { ProfilePhotoPickerModal } from '../profile/ProfilePhotoPickerModal';

export function SettingsProfileCard() {
  const { user } = useAuth();
  const { isUploading, pickAndUpload } = useProfilePhotoUpload();
  const [pickerVisible, setPickerVisible] = useState(false);

  const fullName = user?.fullName || 'Staff Member';
  const roleName = user?.roleName || 'Staff';
  const staffId = user?.id ? user.id.slice(0, 8).toUpperCase() : 'Unassigned';
  const avatarUrl = user?.avatarUrl || user?.profilePhotoUrl || user?.photoUrl;
  const organizationName = user?.organizationName;
  const organizationContactName = user?.organizationContactName;

  return (
    <View className="bg-surface rounded-2xl p-5 items-center mb-4">
      {/* Avatar Container with Camera Upload Badge */}
      <View className="relative">
        <Avatar name={fullName} imageUrl={avatarUrl} size="xl" />

        <TouchableOpacity
          activeOpacity={0.8}
          disabled={isUploading}
          onPress={() => setPickerVisible(true)}
          className="w-7 h-7 rounded-full bg-primary items-center justify-center border-2 border-white absolute bottom-0 right-0"
          accessibilityLabel="Change profile picture"
        >
          {isUploading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Camera size={13} color="#FFFFFF" strokeWidth={2.2} />
          )}
        </TouchableOpacity>
      </View>

      {/* Staff Name */}
      <Text className="text-lg font-bold text-text-primary mt-3">{fullName}</Text>

      {organizationName && (
        <View className="mt-1 items-center px-2">
          <Text className="text-sm font-semibold text-text-secondary" numberOfLines={1}>
            {organizationName}
          </Text>
          {organizationContactName && (
            <Text className="text-xs text-text-muted mt-0.5" numberOfLines={1}>
              Organization contact: {organizationContactName}
            </Text>
          )}
        </View>
      )}

      {/* Role Badge & Staff ID */}
      <View className="flex-row items-center gap-2 mt-2">
        <View className="flex-row items-center gap-1 bg-clinical-safeBg px-2.5 py-1 rounded-full">
          <Award size={12} color="#059669" />
          <Text className="text-xs font-semibold text-clinical-safe">{roleName}</Text>
        </View>
        <Text className="text-xs font-medium text-text-secondary">ID • {staffId}</Text>
      </View>

      <ProfilePhotoPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelectSource={(source) => void pickAndUpload(source)}
      />
    </View>
  );
}

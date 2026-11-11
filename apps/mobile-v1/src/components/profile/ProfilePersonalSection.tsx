import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Mail, Phone, Building2, MapPin, Globe, Edit3 } from 'lucide-react-native';
import { Text } from '../ui/text';
import { MyProfileData } from './profile.types';
import { theme } from '../../theme';

interface ProfilePersonalSectionProps {
  profile: MyProfileData | null;
  onEditPress: () => void;
}

export function ProfilePersonalSection({ profile, onEditPress }: ProfilePersonalSectionProps) {
  const addressParts = [
    profile?.addressLine1,
    profile?.addressLine2,
    profile?.city,
    profile?.postcode,
  ].filter(Boolean);

  const formattedAddress = addressParts.length > 0 ? addressParts.join(', ') : 'Not provided';

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text className="text-base font-bold text-text-primary">Personal & Contact</Text>
        <TouchableOpacity
          style={styles.editButton}
          activeOpacity={0.7}
          onPress={onEditPress}
          accessibilityLabel="Edit profile"
        >
          <Edit3 size={14} color={theme.colors.primary.DEFAULT} />
          <Text className="text-xs font-semibold text-primary ml-1">Edit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentList}>
        {/* Email */}
        <View style={styles.itemRow}>
          <View style={styles.iconContainer}>
            <Mail size={15} color={theme.colors.primary.DEFAULT} />
          </View>
          <View style={styles.textContainer}>
            <Text className="text-xs text-text-muted">Email Address</Text>
            <Text className="text-sm font-semibold text-text-primary" numberOfLines={1}>
              {profile?.email || 'Not available'}
            </Text>
          </View>
        </View>

        {/* Phone */}
        <View style={styles.itemRow}>
          <View style={styles.iconContainer}>
            <Phone size={15} color={theme.colors.primary.DEFAULT} />
          </View>
          <View style={styles.textContainer}>
            <Text className="text-xs text-text-muted">Phone Number</Text>
            <Text className="text-sm font-semibold text-text-primary">
              {profile?.phoneNumber || 'Not provided'}
            </Text>
          </View>
        </View>

        {/* Department */}
        <View style={styles.itemRow}>
          <View style={styles.iconContainer}>
            <Building2 size={15} color={theme.colors.primary.DEFAULT} />
          </View>
          <View style={styles.textContainer}>
            <Text className="text-xs text-text-muted">Department</Text>
            <Text className="text-sm font-semibold text-text-primary">
              {profile?.department || 'Care Team'}
            </Text>
          </View>
        </View>

        {/* Address */}
        <View style={styles.itemRow}>
          <View style={styles.iconContainer}>
            <MapPin size={15} color={theme.colors.primary.DEFAULT} />
          </View>
          <View style={styles.textContainer}>
            <Text className="text-xs text-text-muted">Address</Text>
            <Text className="text-sm font-semibold text-text-primary">
              {formattedAddress}
            </Text>
          </View>
        </View>

        {/* Preferred Language */}
        <View style={styles.itemRow}>
          <View style={styles.iconContainer}>
            <Globe size={15} color={theme.colors.primary.DEFAULT} />
          </View>
          <View style={styles.textContainer}>
            <Text className="text-xs text-text-muted">Preferred Language</Text>
            <Text className="text-sm font-semibold text-text-primary">
              {profile?.preferredLanguage || 'English (UK)'}
            </Text>
          </View>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
  },
  contentList: {
    paddingTop: 10,
    gap: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
});


import React, { useState } from 'react';
import { View, TouchableOpacity, Alert } from 'react-native';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Home,
  Award,
  MapPin,
  ChevronRight,
  Edit2,
  Building2,
} from 'lucide-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { GET_MY_PROFILE } from '@repo/endpoints';
import { Text } from '../ui/text';
import { useAuth } from '../../presentation/context/AuthContext';
import { makeMobileApiCall } from '../../data/api/client';
import { MyProfileData } from '../profile/profile.types';
import { ProfileEditModal } from '../profile/ProfileEditModal';

export function SettingsPersonalInfoCard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editModalOpen, setEditModalOpen] = useState(false);

  const { data: profile, refetch } = useQuery<MyProfileData>({
    queryKey: [GET_MY_PROFILE],
    queryFn: () => makeMobileApiCall<MyProfileData>(GET_MY_PROFILE),
    staleTime: 10000,
  });

  const u = user as (Record<string, unknown> & { fullName?: string; email?: string; roleName?: string }) | null;

  const fullName = profile?.fullName || u?.fullName || 'Staff Member';
  const email = profile?.email || u?.email || 'Not recorded';
  const phone = profile?.phoneNumber || (u?.phoneNumber as string | undefined) || 'Not recorded';
  const dob = profile?.dob
    ? new Date(profile.dob).toLocaleDateString('en-GB')
    : (u?.dob as string | undefined) || 'Not recorded';
  const addressParts = [
    profile?.addressLine1,
    profile?.addressLine2,
    profile?.city,
    profile?.postcode,
  ].filter(Boolean);
  const address = addressParts.length > 0
    ? addressParts.join(', ')
    : (u?.address as string | undefined) || 'Not recorded';
  const department = profile?.department || (u?.department as string | undefined) || 'General Care';
  const roleName = profile?.role?.name || u?.roleName || 'Staff';
  const facility = (u?.facilityName as string | undefined) || (u?.branchName as string | undefined) || 'Supported Living Service';

  const handleEditNotice = (field: string) => {
    Alert.alert(
      `Edit ${field}`,
      'To update official staff compliance records, contact your Service Manager or HR administrator.'
    );
  };

  const handleProfileUpdated = () => {
    void queryClient.invalidateQueries({ queryKey: [GET_MY_PROFILE] });
    void refetch();
  };

  return (
    <View className="mb-4">
      <View className="flex-row items-center justify-between mb-2.5">
        <Text className="text-base font-bold text-text-primary">
          Personal Information
        </Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setEditModalOpen(true)}
          className="bg-white px-3 py-1 rounded-full border border-border/50 flex-row items-center gap-1.5"
          accessibilityLabel="Edit personal details"
        >
          <Edit2 size={12} color="#4A706A" />
          <Text className="text-xs font-semibold text-primary">Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* 1. Identity & Contact Details Card */}
      <View className="bg-surface rounded-2xl mb-3 overflow-hidden divide-y divide-slate-200/70">
        {/* Full Name */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleEditNotice('Full Name')}
          className="p-3.5 flex-row items-center justify-between"
        >
          <View className="flex-row items-center gap-3 flex-1 mr-2">
            <View className="w-9 h-9 rounded-full bg-white items-center justify-center">
              <User size={16} color="#64748B" />
            </View>
            <View>
              <Text className="text-xs font-medium text-text-muted">Full Name</Text>
              <Text className="text-sm font-semibold text-text-primary">{fullName}</Text>
            </View>
          </View>
          <ChevronRight size={16} color="#94A3B8" />
        </TouchableOpacity>

        {/* Email Address */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleEditNotice('Email')}
          className="p-3.5 flex-row items-center justify-between"
        >
          <View className="flex-row items-center gap-3 flex-1 mr-2">
            <View className="w-9 h-9 rounded-full bg-white items-center justify-center">
              <Mail size={16} color="#64748B" />
            </View>
            <View>
              <Text className="text-xs font-medium text-text-muted">Work Email</Text>
              <Text className="text-sm font-semibold text-text-primary">{email}</Text>
            </View>
          </View>
          <ChevronRight size={16} color="#94A3B8" />
        </TouchableOpacity>

        {/* Phone Number */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setEditModalOpen(true)}
          className="p-3.5 flex-row items-center justify-between"
        >
          <View className="flex-row items-center gap-3 flex-1 mr-2">
            <View className="w-9 h-9 rounded-full bg-white items-center justify-center">
              <Phone size={16} color="#64748B" />
            </View>
            <View>
              <Text className="text-xs font-medium text-text-muted">Contact Phone</Text>
              <Text className="text-sm font-semibold text-text-primary">{phone}</Text>
            </View>
          </View>
          <Edit2 size={15} color="#4A706A" />
        </TouchableOpacity>

        {/* Date of Birth */}
        <View className="p-3.5 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="w-9 h-9 rounded-full bg-white items-center justify-center">
              <Calendar size={16} color="#64748B" />
            </View>
            <View>
              <Text className="text-xs font-medium text-text-muted">Date of Birth</Text>
              <Text className="text-sm font-semibold text-text-primary">{dob}</Text>
            </View>
          </View>
        </View>

        {/* Address */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setEditModalOpen(true)}
          className="p-3.5 flex-row items-center justify-between"
        >
          <View className="flex-row items-center gap-3 flex-1 mr-2">
            <View className="w-9 h-9 rounded-full bg-white items-center justify-center">
              <Home size={16} color="#64748B" />
            </View>
            <View className="flex-1 mr-2">
              <Text className="text-xs font-medium text-text-muted">Address</Text>
              <Text className="text-sm font-semibold text-text-primary" numberOfLines={1}>
                {address}
              </Text>
            </View>
          </View>
          <Edit2 size={15} color="#4A706A" />
        </TouchableOpacity>
      </View>

      {/* 2. Employment & Facility Card */}
      <View className="bg-surface rounded-2xl overflow-hidden divide-y divide-slate-200/70">
        {/* Role Designation */}
        <View className="p-3.5 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="w-9 h-9 rounded-full bg-white items-center justify-center">
              <Award size={16} color="#4A706A" />
            </View>
            <View>
              <Text className="text-xs font-medium text-text-muted">Assigned Role</Text>
              <Text className="text-sm font-semibold text-text-primary">{roleName}</Text>
            </View>
          </View>
        </View>

        {/* Department */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setEditModalOpen(true)}
          className="p-3.5 flex-row items-center justify-between"
        >
          <View className="flex-row items-center gap-3">
            <View className="w-9 h-9 rounded-full bg-white items-center justify-center">
              <Building2 size={16} color="#4A706A" />
            </View>
            <View>
              <Text className="text-xs font-medium text-text-muted">Department</Text>
              <Text className="text-sm font-semibold text-text-primary">{department}</Text>
            </View>
          </View>
          <Edit2 size={15} color="#4A706A" />
        </TouchableOpacity>

        {/* Primary Facility */}
        <View className="p-3.5 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="w-9 h-9 rounded-full bg-white items-center justify-center">
              <MapPin size={16} color="#4A706A" />
            </View>
            <View>
              <Text className="text-xs font-medium text-text-muted">Primary Service</Text>
              <Text className="text-sm font-semibold text-text-primary">{facility}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Edit Profile Modal */}
      <ProfileEditModal
        visible={editModalOpen}
        profile={profile ?? null}
        onClose={() => setEditModalOpen(false)}
        onSuccess={handleProfileUpdated}
      />
    </View>
  );
}

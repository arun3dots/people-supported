import React from 'react';
import { View, TouchableOpacity, Alert } from 'react-native';
import { CircleHelp, FileText, Shield, ChevronRight } from 'lucide-react-native';
import { Text } from '../ui/text';

export function SettingsSupportCard() {
  const handleSupportPress = () => {
    Alert.alert(
      'Care Home Support',
      'For technical issues or roster inquiries, please contact IT support at support@centracare.co.uk or phone ext. 404.'
    );
  };

  const handlePrivacyPress = () => {
    Alert.alert(
      'Privacy Policy',
      'This clinical care application complies with UK GDPR and the Data Security and Protection Toolkit (DSPT).'
    );
  };

  const handleTermsPress = () => {
    Alert.alert(
      'Terms of Service',
      'Authorized NHS and private care home personnel only. All access and changes are audited under CQC standards.'
    );
  };

  return (
    <View className="mb-4">
      <Text className="text-sm font-bold text-[#141F1E] mb-2.5">
        Support & About
      </Text>

      <View className="bg-white rounded-md border border-slate-100 overflow-hidden">
        {/* 1. Help & Support */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleSupportPress}
          className="p-3.5 flex-row items-center justify-between"
        >
          <View className="flex-row items-center gap-3 flex-1 mr-2">
            <View className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center">
              <CircleHelp size={16} color="#64748B" />
            </View>
            <Text className="text-xs font-semibold text-[#141F1E]">
              Help & support
            </Text>
          </View>
          <ChevronRight size={16} color="#94A3B8" />
        </TouchableOpacity>

        <View className="h-px bg-slate-100 ml-14" />

        {/* 2. Privacy Policy */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handlePrivacyPress}
          className="p-3.5 flex-row items-center justify-between"
        >
          <View className="flex-row items-center gap-3 flex-1 mr-2">
            <View className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center">
              <FileText size={16} color="#64748B" />
            </View>
            <Text className="text-xs font-semibold text-[#141F1E]">
              Privacy policy
            </Text>
          </View>
          <ChevronRight size={16} color="#94A3B8" />
        </TouchableOpacity>

        <View className="h-px bg-slate-100 ml-14" />

        {/* 3. Terms of Service */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleTermsPress}
          className="p-3.5 flex-row items-center justify-between"
        >
          <View className="flex-row items-center gap-3 flex-1 mr-2">
            <View className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center">
              <Shield size={16} color="#64748B" />
            </View>
            <Text className="text-xs font-semibold text-[#141F1E]">
              Terms of service
            </Text>
          </View>
          <ChevronRight size={16} color="#94A3B8" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

import React from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { ChevronLeft, FileText } from 'lucide-react-native';
import { ScreenWrapper } from '../../src/components/common/ScreenWrapper';
import { Text } from '../../src/components/ui/text';
import { ResidentLoadError } from '../../src/components/clinical/ResidentLoadError';
import { useResidentDetail } from '../../src/presentation/hooks/useResidentDetail';
import { ResidentProfileHeaderCard } from '../../src/components/clinical/ResidentProfileHeaderCard';
import { ResidentDocumentsSections } from '../../src/components/clinical/ResidentDocumentsSections';

export default function DocumentsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { resident, loading, error, refetch } = useResidentDetail(id);

  if (loading && !resident) {
    return (
      <ScreenWrapper key="loading-documents" scrollable>
        <View className="flex-row items-center justify-between py-3 mb-1">
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.navigate('/residents' as Href))}
            activeOpacity={0.7}
            className="w-9 h-9 rounded-full bg-surface items-center justify-center"
          >
            <ChevronLeft size={22} color="#141F1E" strokeWidth={2.4} />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-foreground">Person Supported</Text>
          <View className="w-9" />
        </View>
        <View className="items-center justify-center py-24">
          <ActivityIndicator size="large" color="#4A706A" />
          <Text className="text-xs text-muted-foreground mt-3 font-medium">Loading documents...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (error) return <ResidentLoadError message={error} onRetry={() => { void refetch(); }} />;

  if (!resident) {
    return (
      <ScreenWrapper scrollable>
        <View className="flex-row items-center justify-between py-3 mb-1">
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.navigate('/residents' as Href))}
            activeOpacity={0.7}
            className="w-9 h-9 rounded-full bg-surface items-center justify-center"
          >
            <ChevronLeft size={22} color="#141F1E" strokeWidth={2.4} />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-foreground">Person Supported Documents</Text>
          <View className="w-9" />
        </View>
        <View className="items-center justify-center py-20 px-4">
          <View className="w-16 h-16 rounded-full bg-primary-light items-center justify-center mb-4">
            <FileText size={32} color="#4A706A" />
          </View>
          <Text className="text-lg font-bold text-foreground text-center">
            No Person Selected
          </Text>
          <Text className="text-xs text-muted-foreground mt-1 text-center max-w-[260px]">
            Please select a person supported to view their documents and records.
          </Text>
          <TouchableOpacity
            onPress={() => router.navigate('/residents' as Href)}
            className="mt-5 px-6 py-3 bg-primary rounded-full"
            activeOpacity={0.8}
          >
            <Text className="text-white font-bold text-md">Select Person</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper key={`documents-${resident.id}`} scrollable>
      {/* 1. Header with Back Chevron and Centered Title */}
      <View className="flex-row items-center justify-between py-3 mb-1">
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.navigate('/residents' as Href))}
          activeOpacity={0.7}
          className="w-9 h-9 rounded-full bg-surface items-center justify-center"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={22} color="#141F1E" strokeWidth={2.4} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-foreground">Person Supported</Text>
        <View className="w-9" />
      </View>

      {/* 2. Top Resident Profile Header Card with NEWS2 Score */}
      <ResidentProfileHeaderCard resident={resident} />

      {/* 3. Resident Documents Sections */}
      <ResidentDocumentsSections residentId={resident.id} residentStatus={resident.status} />
    </ScreenWrapper>
  );
}

import React, { useMemo, useState } from 'react';
import { View, TouchableOpacity, SectionList, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { ChevronLeft, Search, ShieldAlert, Users, X } from 'lucide-react-native';
import type { EmergencyDirectoryItemDTO } from '@repo/schema';
import { Button, Input, ScreenWrapper, Text } from '../../src/presentation/components/common';
import { EmergencyResidentRow } from '../../src/components/emergency/EmergencyResidentRow';
import { useEmergencyDirectory } from '../../src/presentation/hooks/useEmergencyDirectory';
import { useShiftDashboard } from '../../src/presentation/hooks/useShiftDashboard';

interface DirectorySection {
  key: 'assigned' | 'others';
  title: string;
  data: EmergencyDirectoryItemDTO[];
}

function matches(resident: EmergencyDirectoryItemDTO, query: string): boolean {
  if (!query) return true;
  return [
    resident.fullName,
    resident.preferredName,
    resident.roomNumber,
    resident.bedLabel,
    resident.wingName,
  ].some((value) => value?.toLowerCase().includes(query));
}

export default function EmergencyDirectoryScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const { data, isLoading, isRefetching, error, refetch } = useEmergencyDirectory();
  const { shift, assignedResidents } = useShiftDashboard();

  const query = searchQuery.trim().toLowerCase();

  const sections = useMemo<DirectorySection[]>(() => {
    const rawAssigned = data?.assigned ?? [];
    const rawOthers = data?.others ?? [];
    const allItems = [...rawAssigned, ...rawOthers];

    // De-duplicate all items by ID
    const uniqueMap = new Map<string, EmergencyDirectoryItemDTO>();
    allItems.forEach((item) => {
      if (item.id && !uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    });
    const uniqueList = Array.from(uniqueMap.values());

    const assignedIdSet = new Set(assignedResidents.map((r) => r.id));
    const hasAssignedContext = Boolean(shift && assignedResidents.length > 0);

    const isItemAssigned = (item: EmergencyDirectoryItemDTO) => {
      if (hasAssignedContext) {
        return assignedIdSet.has(item.id);
      }
      return Boolean(item.isAssigned);
    };

    const assigned = uniqueList
      .filter((r) => isItemAssigned(r) && matches(r, query));
    const others = uniqueList
      .filter((r) => !isItemAssigned(r) && matches(r, query));

    return [
      { key: 'assigned' as const, title: `Assigned to you (${assigned.length})`, data: assigned },
      { key: 'others' as const, title: `All other residents (${others.length})`, data: others },
    ].filter((section) => section.data.length > 0);
  }, [data, query, shift, assignedResidents]);

  const goBack = () =>
    router.canGoBack() ? router.back() : router.navigate('/residents' as Href);

  const header = (
    <View className="pb-2">
      <View className="flex-row items-center justify-between py-3">
        <TouchableOpacity
          onPress={goBack}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
          className="w-9 h-9 rounded-full bg-surface items-center justify-center"
        >
          <ChevronLeft size={22} color="#141F1E" strokeWidth={2.4} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-foreground">Emergency Directory</Text>
        <View className="w-9" />
      </View>

      <View className="flex-row items-start gap-2.5 rounded-2xl bg-clinical-warningBg p-3.5 mb-3">
        <ShieldAlert size={18} color="#C38C0B" />
        <View className="flex-1">
          <Text className="text-md font-bold text-foreground">Read-only emergency access</Text>
          <Text className="text-xs text-muted-foreground mt-0.5">
            Every resident record you open here is logged with your name and the time.
          </Text>
        </View>
      </View>

      <View className="relative mb-3">
        <View className="absolute left-3 top-0 bottom-0 justify-center z-10" pointerEvents="none">
          <Search size={18} color="#64748B" />
        </View>
        <Input
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by name, room or bed"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          accessibilityLabel="Search residents"
          className="pl-10 pr-10"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            accessibilityLabel="Clear search"
            className="absolute right-3 top-0 bottom-0 justify-center"
          >
            <X size={18} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      {data && (
        <Text className="text-xs text-slate-500 mb-1">
          {data.total} active {data.total === 1 ? 'resident' : 'residents'} in your home
        </Text>
      )}
    </View>
  );

  let emptyState: React.ReactElement | null = null;
  if (isLoading) {
    emptyState = (
      <View className="items-center py-16">
        <ActivityIndicator size="large" color="#4A706A" />
        <Text className="text-sm text-slate-500 mt-3">Loading residents...</Text>
      </View>
    );
  } else if (error) {
    emptyState = (
      <View className="items-center py-12 px-4">
        <Text className="text-base font-bold text-slate-900 text-center mb-1">
          Could not load the directory
        </Text>
        <Text className="text-sm text-slate-500 text-center mb-4">
          Check your connection and try again.
        </Text>
        <Button variant="outline" onPress={() => void refetch()}>
          Retry
        </Button>
      </View>
    );
  } else {
    emptyState = (
      <View className="items-center py-12 px-4">
        <View className="h-12 w-12 rounded-full bg-slate-100 items-center justify-center mb-3">
          <Users size={24} color="#64748B" />
        </View>
        <Text className="text-base font-bold text-slate-900 text-center mb-1">
          {query ? 'No matching residents' : 'No residents found'}
        </Text>
        <Text className="text-sm text-slate-500 text-center">
          {query ? 'Try a different name, room or bed.' : 'There are no active residents to show.'}
        </Text>
      </View>
    );
  }

  return (
    <ScreenWrapper>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        ListEmptyComponent={emptyState}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
        }
        renderSectionHeader={({ section }) => (
          <Text className="text-sm font-bold text-slate-700 mt-2 mb-2">{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <EmergencyResidentRow
            resident={item}
            onPress={() =>
              router.push({
                pathname: '/emergency-resident',
                params: { id: item.id },
              } as unknown as Href)
            }
          />
        )}
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </ScreenWrapper>
  );
}

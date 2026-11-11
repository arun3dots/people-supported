import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams, type Href } from 'expo-router';
import { Resident } from '../../src/domain/entities/Resident';
import {
  Search,
  Clock,
  Users,
  Play,
  ShieldAlert,
  X,
} from 'lucide-react-native';
import { ScreenWrapper } from '../../src/components/common/ScreenWrapper';
import { Text } from '../../src/components/ui/text';
import { Card } from '../../src/components/ui/card';
import { Button } from '../../src/components/ui/button';
import { FilterChip } from '../../src/components/common/FilterChip';
import { ResidentCard } from '../../src/components/common/ResidentCard';
import { useShiftDashboard } from '../../src/presentation/hooks/useShiftDashboard';
import { useClockInEligibility } from '../../src/presentation/hooks/useClockInEligibility';
import { theme } from '../../src/theme';

export default function ResidentsDirectoryScreen() {
  const router = useRouter();
  const { focusSearch } = useLocalSearchParams<{ focusSearch?: string }>();
  const { shift, assignedResidents, isShiftStarted, startShift } = useShiftDashboard();
  const eligibility = useClockInEligibility(shift);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'HighRisk' | 'Allergies'>('All');
  const searchInputRef = useRef<React.ElementRef<typeof TextInput>>(null);

  useEffect(() => {
    if (focusSearch === 'true') {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [focusSearch]);

  const baseList: Resident[] = assignedResidents;
  const openEmergencyDirectory = () => router.navigate('/emergency-directory' as Href);

  const filtered = baseList.filter((res: Resident) => {
    const matchesSearch =
      res.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.roomNumber.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeFilter === 'HighRisk') {
      return res.riskRatings?.fallRisk === 'High' || res.riskRatings?.pressureUlcerRisk === 'High';
    }
    if (activeFilter === 'Allergies') {
      return res.allergies && res.allergies.length > 0;
    }
    return true;
  });

  const isAccessAllowed = isShiftStarted;

  return (
    <ScreenWrapper scrollable>
      {/* Title & Subtitle */}
      <View className="pt-2 pb-3">
        <Text className="text-xl font-bold text-foreground">
          Assigned Residents
        </Text>
        <Text className="text-sm text-muted-foreground mt-0.5">
          {isShiftStarted
            ? 'Following residents are assigned to your shift'
            : 'Point-of-Care Access & Resident Search'}
        </Text>
      </View>

      {/* Global Resident Search Input - Always accessible (BUG-018) */}
      <View className="bg-surface rounded-xl px-3.5 h-11 flex-row items-center gap-2.5 mb-3">
        <Search size={18} color="#8E8E93" />
        <TextInput
          ref={searchInputRef}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search assigned residents..."
          placeholderTextColor="#8E8E93"
          style={{ fontFamily: theme.fonts.regular }}
          className="flex-1 text-md text-foreground h-full"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            className="p-1"
            accessibilityLabel="Clear search"
          >
            <X size={16} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>

      {/* If Access is NOT Allowed: Gate Access with Emergency Bypass */}
      {!isAccessAllowed ? (
        <View className="items-center justify-center pt-4 pb-12 px-2">
          <Card className="w-full p-6 items-center text-center">
            <View className="h-16 w-16 rounded-full bg-white items-center justify-center mb-4">
              <Clock size={32} color={theme.colors.primary.DEFAULT} />
            </View>

            <Text className="text-lg font-bold text-foreground text-center mb-1.5">
              Shift Not Started
            </Text>

            <Text className="text-xs text-muted-foreground text-center leading-5 mb-5 max-w-[280px]">
              Assigned residents and point-of-care clinical records are accessible once your
              shift is started. Use the Emergency Directory for emergency read-only access.
            </Text>

            {shift ? (
              <Button
                variant={eligibility.isEligible ? 'default' : 'secondary'}
                size="default"
                disabled={!eligibility.isEligible}
                className={`w-full mb-2.5 ${
                  eligibility.isEligible ? '' : 'opacity-60 bg-slate-200'
                }`}
                leftIcon={
                  <Play
                    size={16}
                    color={eligibility.isEligible ? '#FFFFFF' : '#64748B'}
                    fill={eligibility.isEligible ? '#FFFFFF' : '#64748B'}
                  />
                }
                onPress={async () => {
                  if (eligibility.isEligible) {
                    await startShift();
                  }
                }}
              >
                {eligibility.isEligible
                  ? `Start Shift (${shift.name || 'Shift'})`
                  : `Clock-in opens at ${eligibility.eligibleAtStr || 'scheduled time'}`}
              </Button>
            ) : null}

            {/* Emergency Read-Only Directory (CQC Reg 12) */}
            <Button
              variant="outline"
              size="default"
              className="w-full mb-2.5 border-amber-500/60"
              leftIcon={<ShieldAlert size={16} color="#D97706" />}
              onPress={openEmergencyDirectory}
            >
              Emergency Directory (Read-Only)
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onPress={() => router.navigate('/' as Href)}
            >
              Return to Home
            </Button>
          </Card>
        </View>
      ) : (
        <>
          {/* Emergency Directory: always one tap away, read-only and audit-logged */}
          <TouchableOpacity
            onPress={openEmergencyDirectory}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Open Emergency Directory"
            className="flex-row items-center gap-2.5 rounded-2xl bg-clinical-warningBg p-3.5 mb-3"
          >
            <ShieldAlert size={18} color="#C38C0B" />
            <View className="flex-1">
              <Text className="text-md font-bold text-foreground">Emergency Directory</Text>
              <Text className="text-xs text-muted-foreground">
                All residents, read-only. Access is logged.
              </Text>
            </View>
          </TouchableOpacity>

          {/* Filter Chips */}
          <View className="flex-row gap-2 mb-2.5">
            <FilterChip
              label={`All (${baseList.length})`}
              active={activeFilter === 'All'}
              onPress={() => setActiveFilter('All')}
            />
            <FilterChip
              label="High Risk"
              active={activeFilter === 'HighRisk'}
              onPress={() => setActiveFilter('HighRisk')}
            />
            <FilterChip
              label="Drug Allergies"
              active={activeFilter === 'Allergies'}
              onPress={() => setActiveFilter('Allergies')}
            />
          </View>

          <Text className="text-xs font-medium text-muted-foreground mb-3">
            Showing {filtered.length} of {baseList.length} Residents
          </Text>

          {/* Residents Cards List */}
          <View className="pb-8">
            {filtered.map((res) => (
              <ResidentCard
                key={res.id}
                resident={res}
                onPress={() =>
                  router.navigate({
                    pathname: '/resident-details',
                    params: { id: res.id },
                  } as unknown as Href)
                }
              />
            ))}

            {filtered.length === 0 && (
              <View className="rounded-2xl bg-surface p-8 items-center justify-center mt-2">
                <View className="h-12 w-12 rounded-full bg-white items-center justify-center mb-3">
                  <Users size={24} color="#64748B" />
                </View>
                <Text className="text-md font-bold text-foreground text-center mb-1">
                  {assignedResidents.length === 0
                    ? 'No Residents Assigned'
                    : 'No Matching Residents'}
                </Text>
                <Text className="text-xs text-muted-foreground text-center max-w-[280px]">
                  {assignedResidents.length === 0
                    ? `No residents are assigned to your shift (${shift?.name || 'Shift'}). Contact your manager or nurse lead to assign residents.`
                    : 'No residents matched your search query. Try clearing the filter.'}
                </Text>
              </View>
            )}
          </View>
        </>
      )}
    </ScreenWrapper>
  );
}

import React from 'react';
import { View, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Bed, HeartHandshake, Droplet, ChevronRight, AlertTriangle } from 'lucide-react-native';
import { Avatar } from './Avatar';
import { Text } from '../ui/text';
import { Resident } from '../../domain/entities/Resident';

export interface ResidentCardProps {
  resident: Resident;
  onPress?: () => void;
  expanded?: boolean;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

function formatResidentLocation(roomNumber?: string, bedNumber?: string): string {
  const cleanRoom = roomNumber?.trim() ? roomNumber.trim().replace(/^Room\s+/i, '') : '';
  const cleanBed = bedNumber?.trim() ? bedNumber.trim().replace(/^Bed\s+/i, '') : '';

  if (cleanRoom && cleanBed) {
    return `Room ${cleanRoom} · Bed ${cleanBed}`;
  }
  if (cleanRoom) {
    return `Room ${cleanRoom}`;
  }
  if (cleanBed) {
    return `Bed ${cleanBed}`;
  }
  return 'Room unassigned';
}

export function ResidentCard({
  resident,
  onPress,
  expanded = false,
  className,
}: ResidentCardProps) {
  const getRiskBadgeStyles = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'high':
        return {
          bg: 'bg-clinical-criticalBg',
          text: 'text-clinical-critical',
          label: 'High Risk',
        };
      case 'medium':
      case 'moderate':
        return {
          bg: 'bg-clinical-warningBg',
          text: 'text-clinical-warning',
          label: 'Medium Risk',
        };
      case 'low':
        return {
          bg: 'bg-clinical-safeBg',
          text: 'text-clinical-safe',
          label: 'Low Risk',
        };
      default:
        return null;
    }
  };

  const riskBadge = getRiskBadgeStyles(resident.riskLevel || resident.riskRatings?.fallRisk);
  const CardWrapper = onPress ? TouchableOpacity : View;

  const hasAllergies = resident.allergies && resident.allergies.length > 0;
  const isHighFall = resident.riskRatings?.fallRisk === 'High';
  const isHighPressure = resident.riskRatings?.pressureUlcerRisk === 'High';
  const isDnacpr = Boolean(resident.dnacpr);

  return (
    <CardWrapper
      onPress={onPress}
      activeOpacity={0.75}
      className={`bg-surface rounded-2xl p-4 mb-3 ${className || ''}`}
    >
      {/* 1. Header: Avatar + Identity + Meta + Chevron */}
      <View className="flex-row items-center">
        {/* Avatar */}
        <View className="mr-3.5">
          <Avatar
            name={resident.fullName}
            imageUrl={resident.photoUrl}
            size="lg"
          />
        </View>

        {/* Identity & Room */}
        <View className="flex-1 mr-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text
              className="text-md font-bold text-foreground flex-1 mr-2"
              numberOfLines={1}
            >
              {resident.fullName}
            </Text>
            {riskBadge && (
              <View className={`px-2.5 py-0.5 rounded-full ${riskBadge.bg}`}>
                <Text className={`text-xs font-semibold ${riskBadge.text}`}>
                  {riskBadge.label}
                </Text>
              </View>
            )}
          </View>

          {/* Meta Line: Room & Demographics */}
          <View className="flex-row items-center flex-wrap gap-2 mt-0.5">
            <View className="flex-row items-center gap-1">
              <Bed size={13} color="#5D5D5D" />
              <Text className="text-xs font-medium text-muted-foreground">
                {formatResidentLocation(resident.roomNumber, resident.bedNumber)}
              </Text>
            </View>
            <Text className="text-xs text-muted-foreground">
              {resident.gender}
              {resident.age ? ` · ${resident.age} yrs` : ''}
            </Text>
          </View>
        </View>

        {/* Action Chevron */}
        {onPress && (
          <View className="ml-1">
            <ChevronRight size={18} color="#8E8E93" />
          </View>
        )}
      </View>

      {/* 2. Clinical Badges Row */}
      <View className="flex-row flex-wrap gap-1.5 pt-2.5">
        {hasAllergies ? (
          <View className="flex-row items-center gap-1 rounded-full bg-clinical-criticalBg px-2.5 py-0.5">
            <AlertTriangle size={11} color="#FF3B2F" />
            <Text className="text-xs font-semibold text-clinical-critical">
              Allergy: {resident.allergies?.[0]?.allergen}
            </Text>
          </View>
        ) : resident.noKnownAllergies === true ? (
          <View className="rounded-full bg-clinical-safeBg px-2.5 py-0.5">
            <Text className="text-xs font-semibold text-clinical-safe">NKDA</Text>
          </View>
        ) : resident.allergySummary ? (
          <Text className="text-sm text-foreground">Allergies: {resident.allergySummary}</Text>
        ) : (
          <Text className="text-sm text-muted-foreground">Allergies not recorded</Text>
        )}

        {isHighFall && (
          <View className="rounded-full bg-clinical-criticalBg px-2.5 py-0.5">
            <Text className="text-xs font-semibold text-clinical-critical">Fall: High</Text>
          </View>
        )}

        {isHighPressure && (
          <View className="rounded-full bg-clinical-criticalBg px-2.5 py-0.5">
            <Text className="text-xs font-semibold text-clinical-critical">Pressure: High</Text>
          </View>
        )}

        {isDnacpr && (
          <View className="rounded-full bg-purple-100 px-2.5 py-0.5">
            <Text className="text-xs font-semibold text-purple-700">DNACPR</Text>
          </View>
        )}

        {!riskBadge && (
          <View className="rounded-full bg-white px-2.5 py-0.5">
            <Text className="text-sm font-medium text-muted-foreground">Risk not recorded</Text>
          </View>
        )}
      </View>

      {/* 3. Bottom Meta: Communication & Vitals */}
      {resident.communicationNeeds && (
        <View className="flex-row items-center justify-between border-t border-slate-200/70 pt-2.5 mt-2.5">
          <View className="flex-row items-center gap-1.5 flex-1 mr-2">
            <HeartHandshake size={13} color="#4A706A" />
            <Text className="text-xs text-muted-foreground" numberOfLines={1}>
              {resident.communicationNeeds || 'Routine communication'}
            </Text>
          </View>

          <View className="flex-row items-center gap-3">
            {typeof resident.fluidTargetMl === 'number' && <View className="flex-row items-center gap-1">
              <Droplet size={13} color="#0284C7" />
              <Text className="text-xs font-semibold text-foreground">
                {resident.fluidTargetMl}ml
              </Text>
            </View>}
            {resident.mustScore !== undefined && (
              <View className="flex-row items-center gap-1">
                <Text className="text-xs text-muted-foreground">MUST:</Text>
                <Text className="text-xs font-semibold text-foreground">{resident.mustScore}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* 4. Optional Expanded: Care Note */}
      {expanded && resident.latestCareNote && (
        <View className="mt-3 bg-white rounded-xl p-3">
          <View className="flex-row justify-between items-center mb-0.5">
            <Text className="text-xs font-bold text-foreground">Latest Care Note</Text>
            <Text className="text-xs text-muted-foreground">
              By {resident.latestCareNote.authorName}
            </Text>
          </View>
          <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={2}>
            {resident.latestCareNote.content}
          </Text>
        </View>
      )}
    </CardWrapper>
  );
}

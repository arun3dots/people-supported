import React from 'react';
import { View } from 'react-native';
import { User, Info } from 'lucide-react-native';
import { Text } from '../ui/text';
import { Card } from '../ui/card';
import { Avatar } from '../common/Avatar';
import { formatUkDate } from '../../lib/date';
import type { ResidentDetailData } from '../../presentation/hooks/useResidentDetail';

interface Props {
  resident: ResidentDetailData;
}

function formatAdmissionDate(dateStr?: string | Date | null): string {
  if (!dateStr) return 'Not recorded';
  const formatted = formatUkDate(dateStr, { day: '2-digit', month: 'short', year: 'numeric' });
  return formatted || 'Not recorded';
}

function computeAge(dobStr?: string | null): number | null {
  if (!dobStr) return null;
  const birth = new Date(dobStr);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function ResidentProfileHeaderCard({ resident }: Props) {
  const age = computeAge(resident.dob);
  const gender = resident.profile?.gender || (resident as { gender?: string }).gender || 'Not recorded';
  const residentIdDisplay = resident.id.slice(0, 8).toUpperCase();
  const refCode = resident.supportedLivingDetails?.referenceCode;
  const idLabel = refCode ? `Ref: ${refCode}` : `Person ID: ${residentIdDisplay}`;

  const admissionDateDisplay = formatAdmissionDate(resident.admissionDate);
  const wingName = resident.bed?.room?.wing?.name;
  const wingScheme = resident.bed?.room?.wing?.scheme;
  const wingDisplay = wingName && wingScheme ? `${wingName} · ${wingScheme}` : wingName || 'Unassigned';
  const roomDisplay = resident.bed?.room?.roomNumber ? `Room ${resident.bed.room.roomNumber}` : 'Unassigned';
  const bedDisplay = resident.bed?.bedLabel || (resident.bed?.number ? `Bed ${resident.bed.number}` : 'Unassigned');

  // BUG-021: Only retrieve real about information if provided
  const realAboutText =
    resident.careProfile?.routinePreferences?.trim() ||
    resident.admission?.admissionReason?.trim() ||
    resident.profile?.formerOccupation?.trim() ||
    null;

  const latestObservation = resident.observations?.[0];
  const news2Score = typeof latestObservation?.news2Score === 'number' ? latestObservation.news2Score : 0;
  const scoreFormatted = String(news2Score).padStart(2, '0');

  return (
    <Card className="mb-4">
      {/* Avatar & Header Meta */}
      <View className="flex-row items-center gap-4 mb-4">
        <Avatar name={resident.fullName} imageUrl={resident.photoUrl} size="xl" />
        <View className="flex-1">
          <Text className="text-xl font-bold text-foreground leading-tight">{resident.fullName}</Text>
          <Text className="text-xs text-muted-foreground font-medium mt-1">
            {gender} {age ? `| ${age} years` : ''}
          </Text>
          <Text className="text-xs text-muted-foreground mt-0.5">{idLabel}</Text>
        </View>
      </View>

      {/* 2x2 Meta Grid */}
      <View className="border-t border-slate-200/70 pt-3 pb-2 mb-3">
        {/* Row 1: Tenancy Start & Property */}
        <View className="flex-row justify-between mb-2.5">
          <View className="flex-1 pr-2">
            <Text className="text-xs text-muted-foreground">Tenancy Start</Text>
            <Text className="text-sm font-bold text-foreground mt-0.5">
              {admissionDateDisplay}
            </Text>
          </View>
          <View className="w-px bg-slate-200/70" />
          <View className="flex-1 pl-3">
            <Text className="text-xs text-muted-foreground">Property</Text>
            <Text className="text-sm font-bold text-foreground mt-0.5" numberOfLines={1}>
              {wingDisplay}
            </Text>
          </View>
        </View>

        {/* Row 2: Room No & Bed No */}
        <View className="flex-row justify-between pt-2.5 border-t border-slate-200/60">
          <View className="flex-1 pr-2">
            <Text className="text-xs text-muted-foreground">Room No</Text>
            <Text className="text-sm font-bold text-foreground mt-0.5" numberOfLines={1}>
              {roomDisplay}
            </Text>
          </View>
          <View className="w-px bg-slate-200/70" />
          <View className="flex-1 pl-3">
            <Text className="text-xs text-muted-foreground">Bed No</Text>
            <Text className="text-sm font-bold text-foreground mt-0.5" numberOfLines={1}>
              {bedDisplay}
            </Text>
          </View>
        </View>
      </View>

      {/* Spruce Green About Box (BUG-021: Render only if about text was provided) */}
      {realAboutText ? (
        <View className="bg-primary p-4 rounded-2xl mb-4">
          <View className="flex-row items-center gap-2 mb-1.5">
            <View className="w-5 h-5 rounded-full bg-white/20 items-center justify-center">
              <User size={12} color="#FFFFFF" />
            </View>
            <Text className="text-xs font-bold text-white">
              About {resident.profile?.preferredName || resident.fullName.split(' ')[0]}
            </Text>
          </View>
          <Text className="text-xs text-white/90 leading-relaxed font-normal">{realAboutText}</Text>
        </View>
      ) : null}

      {/* NEWS2 Score Section */}
      <View className="rounded-xl bg-white p-4">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-1.5">
            <Text className="text-md font-bold text-foreground">NEWS2 Score</Text>
            <Info size={14} color="#8E8E93" />
          </View>
          <View className="bg-surface px-3.5 py-1 rounded-full">
            <Text className="text-md font-bold text-foreground">{scoreFormatted}</Text>
          </View>
        </View>

        {/* 10-Segment Color Progress Bar */}
        <View className="flex-row items-center gap-1">
          {Array.from({ length: 10 }).map((_, idx) => {
            const isActive = idx < Math.min(news2Score, 10);
            let activeColor = '#4A706A';
            let inactiveColor = '#F4F6F5';
            if (idx >= 3 && idx < 5) {
              activeColor = '#0284C7';
              inactiveColor = '#F0F9FF';
            } else if (idx >= 5 && idx < 7) {
              activeColor = '#D97706';
              inactiveColor = '#FFFBEB';
            } else if (idx >= 7) {
              activeColor = '#EF4444';
              inactiveColor = '#FEF2F2';
            }
            return (
              <View
                key={`news2-bar-${idx}`}
                className="flex-1 h-2 rounded-full"
                style={{ backgroundColor: isActive ? activeColor : inactiveColor }}
              />
            );
          })}
        </View>
      </View>
    </Card>
  );
}

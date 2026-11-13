import React from 'react';
import { View, Alert, TouchableOpacity } from 'react-native';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  ShieldCheck,
  FileText,
  ChevronRight,
  CalendarDays,
} from 'lucide-react-native';
import { Text } from '../ui/text';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Avatar } from '../common/Avatar';
import { Resident } from '../../domain/entities/Resident';
import { theme } from '../../theme';
import { HandoverPersonInfo } from './ShiftDetailsModal';

export interface ShiftTodayViewProps {
  scheduledStartTime?: string;
  actualStartedTime?: string | null;
  scheduledEndTime?: string;
  timeRemainingStr?: string;
  isShiftStarted: boolean;
  isCompleted?: boolean;
  nextShiftName?: string | null;
  nextShiftStartTime?: string | null;
  nextShiftHandoverPerson?: HandoverPersonInfo | null;
  incidentCount?: number;
  assignedResidents?: Resident[];
  completedTasks?: number;
  totalTasks?: number;
  shiftInstructions?: string | null;
  handoverNoteSnippet?: string | null;
  onEnterHandoverNote?: () => void;
  onViewWeeklyRota?: () => void;
}

export function ShiftTodayView({
  scheduledStartTime = '',
  actualStartedTime = null,
  scheduledEndTime = '',
  timeRemainingStr = '',
  isShiftStarted,
  isCompleted = false,
  nextShiftName,
  nextShiftStartTime,
  nextShiftHandoverPerson,
  incidentCount = 0,
  assignedResidents = [],
  completedTasks = 0,
  totalTasks = 0,
  shiftInstructions,
  handoverNoteSnippet,
  onEnterHandoverNote,
  onViewWeeklyRota,
}: ShiftTodayViewProps) {
  const visibleResidents = isShiftStarted ? assignedResidents : [];
  return (
    <View className="flex-1">
      {/* 1. Shift Timings */}
      <Text className="text-xs font-bold text-primary uppercase tracking-wider mb-2 mt-1">
        Shift Hours & Timing
      </Text>
      <View className="flex-row gap-2.5">
        <View className="flex-1 bg-surface rounded-2xl p-3.5">
          <View className="flex-row items-center gap-1.5 mb-1">
            <Clock size={14} color={theme.colors.primary.DEFAULT} />
            <Text className="text-xs font-bold text-primary">Shift Start</Text>
          </View>
          <Text className="text-lg font-bold text-foreground">{scheduledStartTime || 'Scheduled'}</Text>
          <Text className="text-xs text-muted-foreground mt-0.5">
            {isShiftStarted ? `Started at ${actualStartedTime || scheduledStartTime}` : ''}
          </Text>
        </View>

        <View className="flex-1 bg-surface rounded-2xl p-3.5">
          <View className="flex-row items-center gap-1.5 mb-1">
            <CheckCircle2 size={14} color={theme.colors.primary.DEFAULT} />
            <Text className="text-xs font-bold text-primary">Shift End</Text>
          </View>
          <Text className="text-lg font-bold text-foreground">{scheduledEndTime || 'Scheduled'}</Text>
          <Text className="text-xs font-semibold text-clinical-safe mt-0.5">
            {isShiftStarted ? timeRemainingStr || 'In progress' : 'Expected handover'}
          </Text>
        </View>
      </View>

      {/* 2. Shift Instruction (Admin Notes & Handover Instructions) */}
      <Text className="text-xs font-bold text-primary uppercase tracking-wider mb-2 mt-3.5">
        Shift Instruction
      </Text>
      <View className="bg-surface rounded-2xl p-4 mb-1">
        <View className="flex-row items-center gap-2 mb-1">
          <FileText size={14} color={theme.colors.primary.DEFAULT} />
          <Text className="text-sm font-bold text-foreground">
            Notes & Handover Instructions
          </Text>
        </View>
        {shiftInstructions && shiftInstructions.trim() ? (
          <View className="bg-white p-3 rounded-xl mt-1.5">
            <Text className="text-xs text-foreground leading-5">
              {shiftInstructions.trim()}
            </Text>
          </View>
        ) : (
          <Text className="text-xs text-muted-foreground italic mt-0.5">
            No specific shift instructions assigned for this shift.
          </Text>
        )}
      </View>

      {/* 3. Next Shift & Handover Person */}
      <Text className="text-xs font-bold text-primary uppercase tracking-wider mb-2 mt-3.5">
        Next Shift & Handover Lead
      </Text>
      {nextShiftHandoverPerson ? (
        <View className="bg-card-subtle rounded-2xl p-4 mb-2.5">
          <View className="flex-row items-center gap-3 mb-2.5">
            <Avatar name={nextShiftHandoverPerson.name} imageUrl={nextShiftHandoverPerson.avatarUrl || undefined} size="md" />
            <View className="flex-1">
              <Text className="text-md font-bold text-foreground">Handover to: {nextShiftHandoverPerson.name}</Text>
              <Text className="text-xs text-muted-foreground mt-0.5">{nextShiftHandoverPerson.role}</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-1.5 bg-white px-3 py-2 rounded-xl">
            <Clock size={13} color={theme.colors.clinical.warning} />
            <Text className="text-xs font-semibold text-clinical-warning">
              {nextShiftName || 'Next Shift'} Starts: {nextShiftStartTime || 'Scheduled'} ({nextShiftHandoverPerson.shiftHours})
            </Text>
          </View>
        </View>
      ) : (
        <View className="bg-card-subtle rounded-2xl p-4 mb-2.5">
          <Text className="text-xs text-muted-foreground">
            {nextShiftName
              ? `Next shift: ${nextShiftName} (${nextShiftStartTime || 'Scheduled'}). Handover staff not yet assigned.`
              : 'No subsequent shift currently scheduled.'}
          </Text>
        </View>
      )}

      {/* 3. Clinical Metrics: Incidents, Assigned Residents, Tasks */}
      <Text className="text-xs font-bold text-primary uppercase tracking-wider mb-2 mt-3.5">
        Shift Status & Overview
      </Text>
      <View className="flex-row gap-2.5 mb-2.5">
        <View className="flex-1 bg-surface rounded-2xl p-3.5 items-center">
          <View
            className={`w-8 h-8 rounded-full justify-center items-center mb-1 ${
              incidentCount === 0 ? 'bg-clinical-safeBg' : 'bg-clinical-criticalBg'
            }`}
          >
            {incidentCount === 0 ? (
              <ShieldCheck size={16} color={theme.colors.clinical.safe} />
            ) : (
              <AlertTriangle size={16} color={theme.colors.clinical.critical} />
            )}
          </View>
          <Text className="text-lg font-bold text-foreground">{incidentCount}</Text>
          <Text className="text-xs font-medium text-muted-foreground">
            {incidentCount === 0 ? 'Incidents' : 'Reported'}
          </Text>
        </View>

        <View className="flex-1 bg-surface rounded-2xl p-3.5 items-center">
          <View className="w-8 h-8 rounded-full bg-clinical-infoBg justify-center items-center mb-1">
            <Users size={16} color={theme.colors.clinical.info} />
          </View>
          <Text className="text-lg font-bold text-foreground">{visibleResidents.length}</Text>
          <Text className="text-xs font-medium text-muted-foreground">People</Text>
        </View>

        <View className="flex-1 bg-surface rounded-2xl p-3.5 items-center">
          <View className="w-8 h-8 rounded-full bg-white justify-center items-center mb-1">
            <CheckCircle2 size={16} color={theme.colors.primary.DEFAULT} />
          </View>
          <Text className="text-lg font-bold text-foreground">
            {completedTasks}/{totalTasks}
          </Text>
          <Text className="text-xs font-medium text-muted-foreground">Tasks Done</Text>
        </View>
      </View>

      {/* 4. Handover Communication */}
      <Text className="text-xs font-bold text-primary uppercase tracking-wider mb-2 mt-3.5">
        Handover Communication
      </Text>
      <View className="bg-surface rounded-2xl p-4 mb-2.5">
        <View className="flex-row items-center justify-between">
          <Text className="text-md font-bold text-foreground">Clinical Shift Handover</Text>
          <Badge variant="outline" size="sm">
            <Text className="text-xs font-semibold text-primary">CQC Compliant</Text>
          </Badge>
        </View>
        <Text className="text-xs text-muted-foreground mt-1">
          Record care notes, medication observations, and mobility alerts for the incoming team.
        </Text>

        {handoverNoteSnippet ? (
          <View className="bg-card-subtle p-3 rounded-xl mt-2.5">
            <Text className="text-xs text-foreground italic" numberOfLines={3}>
              &quot;{handoverNoteSnippet}&quot;
            </Text>
          </View>
        ) : (
          <Text className="text-xs text-muted-foreground mt-2 italic">
            No handover note recorded yet.
          </Text>
        )}

        <Button
          variant={isShiftStarted && !isCompleted ? 'default' : 'secondary'}
          size="default"
          disabled={!isShiftStarted || isCompleted}
          className={`w-full mt-3 ${!isShiftStarted || isCompleted ? 'opacity-60 bg-slate-100' : ''}`}
          leftIcon={<FileText size={16} color={isShiftStarted && !isCompleted ? '#FFFFFF' : '#64748B'} />}
          rightIcon={isShiftStarted && !isCompleted ? <ChevronRight size={14} color="#FFFFFF" /> : undefined}
          onPress={() => {
            if (!isShiftStarted) {
              Alert.alert(
                'Shift Not Started',
                'Handover notes can only be entered once your shift is in progress. Please clock in to start your shift first.'
              );
              return;
            }
            if (onEnterHandoverNote) onEnterHandoverNote();
          }}
        >
          {isCompleted
            ? 'Handover Completed & Signed'
            : isShiftStarted
              ? 'Enter / Edit Handover Note'
              : 'Handover Locked (Start Shift First)'}
        </Button>
      </View>

      {/* 5. Assigned Residents Summary (BUG-050) */}
      <Text className="text-xs font-bold text-primary uppercase tracking-wider mb-2 mt-3.5">
        Assigned People Supported ({visibleResidents.length})
      </Text>
      <View className="gap-2.5 mt-1.5 mb-3">
        {!isShiftStarted ? (
          <View className="w-full bg-surface rounded-2xl p-3.5">
            <Text className="text-xs text-muted-foreground">
              Clock in and start your shift to view your assigned people supported.
            </Text>
          </View>
        ) : visibleResidents.length > 0 ? (
          visibleResidents.map((res) => {
            const formattedRoom = res.roomNumber
              ? res.roomNumber.startsWith('Room')
                ? res.roomNumber
                : `Room ${res.roomNumber}`
              : 'Room Unassigned';
            const formattedBed = res.bedNumber
              ? res.bedNumber.startsWith('Bed')
                ? res.bedNumber
                : `Bed ${res.bedNumber}`
              : 'Standard Bed';
            const wingLabel = res.wingName || 'Main Property';

            return (
              <View
                key={res.id}
                className="bg-surface rounded-2xl p-3.5 flex-row items-center gap-3 border border-border/30"
              >
                <Avatar name={res.fullName} imageUrl={res.photoUrl} size="md" />
                <View className="flex-1">
                  <Text className="text-sm font-bold text-foreground">
                    {res.fullName}
                  </Text>
                  <View className="flex-row items-center gap-2 mt-1 flex-wrap">
                    <View className="bg-white px-2 py-0.5 rounded-md border border-border/40">
                      <Text className="text-[11px] font-semibold text-primary">{wingLabel}</Text>
                    </View>
                    <Text className="text-xs text-muted-foreground">•</Text>
                    <Text className="text-xs font-medium text-text-secondary">{formattedRoom}</Text>
                    <Text className="text-xs text-muted-foreground">•</Text>
                    <Text className="text-xs font-medium text-text-secondary">{formattedBed}</Text>
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <View className="w-full bg-surface rounded-2xl p-3.5">
            <Text className="text-xs text-muted-foreground">No people supported currently assigned.</Text>
          </View>
        )}
      </View>

      {/* 6. Quick Link to Weekly Shift Rota */}
      {onViewWeeklyRota && (
        <TouchableOpacity
          onPress={onViewWeeklyRota}
          activeOpacity={0.75}
          className="bg-primary-light border border-border rounded-2xl p-3.5 mt-1 mb-2 flex-row items-center justify-between"
        >
          <View className="flex-row items-center gap-3">
            <View className="w-9 h-9 rounded-xl bg-white items-center justify-center">
              <CalendarDays size={18} color={theme.colors.primary.DEFAULT} />
            </View>
            <View>
              <Text className="text-sm font-bold text-foreground">View Weekly Shift Rota</Text>
              <Text className="text-xs text-muted-foreground">
                Check your full 7-day schedule and contracted hours
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={theme.colors.primary.DEFAULT} />
        </TouchableOpacity>
      )}
    </View>
  );
}


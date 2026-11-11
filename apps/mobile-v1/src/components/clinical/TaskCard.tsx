import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Bed } from 'lucide-react-native';
import { Text } from '../ui/text';
import { Avatar } from '../common/Avatar';
import type { MobileTaskItem } from '../../presentation/hooks/useDailyTasks';

export interface TaskCardProps {
  task: MobileTaskItem;
  currentUserId?: string;
  onPress: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  currentUserId,
  onPress,
}) => {
  const isCompleted =
    task.status === 'Completed' ||
    task.rawStatus.toLowerCase() === 'completed' ||
    task.rawStatus.toLowerCase() === 'done';

  const isSkipped =
    task.status === 'Skipped' ||
    task.status === 'Refused' ||
    task.rawStatus.toLowerCase() === 'skipped' ||
    task.rawStatus.toLowerCase() === 'missed' ||
    task.rawStatus.toLowerCase() === 'refused';

  const isOverdue =
    !isCompleted &&
    !isSkipped &&
    (task.status === 'Overdue' ||
      task.rawStatus.toLowerCase() === 'overdue' ||
      task.statusDetail?.toLowerCase().includes('delay'));

  const isDueNow =
    !isCompleted &&
    !isSkipped &&
    (task.status === 'Pending' ||
      isOverdue ||
      task.rawStatus.toLowerCase() === 'pending' ||
      task.rawStatus.toLowerCase() === 'due' ||
      task.rawStatus.toLowerCase() === 'inprogress');

  const isHighPriority = task.priority === 'High';
  const isAssignedToMe = Boolean(
    currentUserId && task.assignedStaffId && task.assignedStaffId === currentUserId
  );

  const displayTime = task.targetTime || task.time;
  const locationLabel = task.locationDisplay || task.roomDisplay || 'Room unassigned';

  const statusPill = isCompleted
    ? { bg: 'bg-clinical-safeBg', text: 'text-clinical-safe', label: 'Completed' }
    : isOverdue
      ? { bg: 'bg-clinical-criticalBg', text: 'text-clinical-critical', label: 'Overdue' }
      : isSkipped
        ? {
            bg: 'bg-clinical-criticalBg',
            text: 'text-clinical-critical',
            label: task.status === 'Refused' ? 'Refused' : 'Skipped',
          }
        : { bg: 'bg-clinical-warningBg', text: 'text-clinical-warning', label: 'Pending' };

  const detailSubtext = isCompleted
    ? task.completedAt || 'On-Time'
    : isOverdue
      ? task.statusDetail || task.dueBy
      : isDueNow
        ? task.statusDetail || task.dueBy || 'Due now'
        : task.statusDetail && task.statusDetail !== 'Scheduled'
          ? task.statusDetail
          : task.dueBy;

  const detailColor = isCompleted
    ? 'text-clinical-safe'
    : isOverdue || isSkipped
      ? 'text-clinical-critical'
      : 'text-clinical-warning';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      className="bg-surface rounded-2xl p-3.5 mb-3 flex-row items-center gap-3"
    >
      {/* 1. Left Circular White Time Badge (24-hour UK HH:mm) */}
      <View className="w-12 h-12 rounded-full bg-white items-center justify-center shrink-0">
        <Text className="text-xs font-bold text-foreground text-center leading-4">
          {displayTime}
        </Text>
      </View>

      {/* 2. Middle Column: Untruncated Title + Resident & Bed Metadata */}
      <View className="flex-1 min-w-0 gap-1">
        {/* Full Task Title (Untruncated per BUG-002) */}
        <Text className="text-md font-bold text-foreground leading-5">
          {task.title}
        </Text>

        {/* Resident & Location Row (Separated from status/delay per BUG-001/003) */}
        <View className="flex-row flex-wrap items-center gap-2 pt-0.5">
          <View className="flex-row items-center gap-1.5">
            <Avatar name={task.residentName} imageUrl={task.residentAvatar} size="xs" />
            <Text className="text-xs font-medium text-muted-foreground">
              {task.residentName}
            </Text>
          </View>

          <View className="flex-row items-center gap-1">
            <Bed size={13} color="#5D5D5D" />
            <Text className="text-xs text-muted-foreground">
              {locationLabel}
            </Text>
          </View>

          {isAssignedToMe ? (
            <Text className="text-xs font-medium text-primary">· You</Text>
          ) : task.assignedStaffName ? (
            <Text className="text-xs text-muted-foreground">
              · {task.assignedStaffName.split(' ')[0]}
            </Text>
          ) : null}
        </View>

        {/* Extra Clinical Flags (if present) */}
        {(task.escalateIfSkipped || isHighPriority) && (
          <View className="flex-row flex-wrap items-center gap-1.5 pt-0.5">
            {task.escalateIfSkipped && (
              <View className="bg-clinical-warningBg px-2 py-0.5 rounded-full">
                <Text className="text-xs font-semibold text-clinical-warning">
                  Senior sign-off
                </Text>
              </View>
            )}
            {isHighPriority && (
              <View className="bg-clinical-criticalBg px-2 py-0.5 rounded-full">
                <Text className="text-xs font-semibold text-clinical-critical">
                  High priority
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Notes / Instructions Snippet */}
        {task.notes || task.completedByName ? (
          <Text className="text-xs text-muted-foreground pt-0.5" numberOfLines={2}>
            {task.completedByName ? `By ${task.completedByName}` : 'Logged'}
            {task.notes ? ` · ${task.notes}` : ''}
          </Text>
        ) : task.instructions ? (
          <Text className="text-xs text-muted-foreground pt-0.5" numberOfLines={2}>
            {task.instructions}
          </Text>
        ) : null}
      </View>

      {/* 3. Right Column: Semantic Status Pill + Non-Overlapping Delay/Due Subtext */}
      <View className="items-end justify-center shrink-0 ml-1 max-w-[96px]">
        <View className={`px-2.5 py-1 rounded-full ${statusPill.bg}`}>
          <Text className={`text-xs font-semibold ${statusPill.text}`}>
            {statusPill.label}
          </Text>
        </View>
        {detailSubtext ? (
          <Text className={`text-xs font-medium mt-1 text-right leading-4 ${detailColor}`}>
            {detailSubtext}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

export const TaskItemCard = TaskCard;

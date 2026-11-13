import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { Text } from '../ui/text';
import { Card } from '../ui/card';
import { supportPlanLabel } from '../../lib/supportPlanLabel';

export interface GoalItem {
  id: string;
  title: string;
  category: string;
  target: string;
  progressPercentage: number;
  progressLabel: string;
  reviewFrequency: string;
  tasksCount?: number;
}

interface Props {
  goal: GoalItem;
}

export function CarePlanGoalCard({ goal }: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <Card className="p-4 mb-3">
      <TouchableOpacity
        onPress={() => setIsCollapsed(!isCollapsed)}
        activeOpacity={0.7}
        className="flex-row items-center justify-between"
      >
        <Text className="text-base font-bold text-text-primary flex-1 mr-2">{goal.title}</Text>
        <View className="flex-row items-center gap-2">
          <View className="bg-sky-50 px-2.5 py-1 rounded-full">
            <Text className="text-xs font-semibold text-sky-600">{supportPlanLabel(goal.category)}</Text>
          </View>
          {isCollapsed ? (
            <ChevronUp size={16} color="#64748B" />
          ) : (
            <ChevronDown size={16} color="#64748B" />
          )}
        </View>
      </TouchableOpacity>

      {!isCollapsed && (
        <View>
          <Text className="text-sm text-text-secondary mt-2 leading-relaxed">{goal.target}</Text>

          {/* Progress Bar */}
          <Text className="text-xs text-text-muted mt-3 mb-1">Progress</Text>
          <View className="h-2 rounded-full bg-white overflow-hidden">
            <View
              className="h-full rounded-full bg-primary"
              style={{ width: `${goal.progressPercentage}%` }}
            />
          </View>
          <View className="flex-row justify-between items-center mt-1.5">
            <Text className="text-xs text-text-muted font-medium">{goal.progressLabel}</Text>
            <Text className="text-xs text-text-muted font-medium">{goal.reviewFrequency}</Text>
          </View>

          {/* Linked Interventions Section */}
          <Text className="text-xs font-bold text-text-primary tracking-wider mt-3 mb-1">
            LINKED INTERVENTIONS (DAILY TASKS)
          </Text>
          <Text className="text-sm text-text-secondary">
            No specific daily routines linked to this goal yet.
          </Text>
        </View>
      )}
    </Card>
  );
}

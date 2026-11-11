import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '../ui/text';
import type { ResidentFilterItem } from '../../presentation/hooks/useDailyTasks';

export type TaskFilterType = 'all' | 'open' | 'upcoming' | 'done' | 'missed' | 'refused';

export interface TaskFilterTabsProps {
  activeFilter: TaskFilterType;
  onFilterChange: (filter: TaskFilterType) => void;
  selectedResidentId: string;
  onResidentChange: (residentId: string) => void;
  residents: ResidentFilterItem[];
  totalCount?: number;
  dueNowCount?: number;
  upcomingCount?: number;
  doneCount?: number;
  missedCount?: number;
  refusedCount?: number;
}

export const TaskFilterTabs: React.FC<TaskFilterTabsProps> = ({
  activeFilter,
  onFilterChange,
  selectedResidentId,
  onResidentChange,
  residents,
  totalCount,
  dueNowCount,
  upcomingCount,
  doneCount,
  missedCount,
  refusedCount,
}) => {
  const statusFilters: Array<{ key: TaskFilterType; label: string }> = [
    { key: 'all', label: totalCount !== undefined ? `All Tasks (${totalCount})` : 'All Tasks' },
    { key: 'open', label: dueNowCount !== undefined ? `Due Today (${dueNowCount})` : 'Due Today' },
    { key: 'missed', label: missedCount !== undefined ? `Overdue (${missedCount})` : 'Overdue' },
    { key: 'done', label: doneCount !== undefined ? `Completed (${doneCount})` : 'Completed' },
    { key: 'upcoming', label: upcomingCount !== undefined ? `Upcoming (${upcomingCount})` : 'Upcoming' },
    { key: 'refused', label: refusedCount !== undefined ? `Refused (${refusedCount})` : 'Refused' },
  ];

  return (
    <View className="mb-3 gap-2.5">
      {/* 1. Status Filter Pill Bar */}
      <View className="bg-surface rounded-full p-1">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 4 }}
        >
          {statusFilters.map((item) => {
            const isSelected = activeFilter === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => onFilterChange(item.key)}
                activeOpacity={0.8}
                className={`px-3.5 py-2 rounded-full ${
                  isSelected ? 'bg-primary' : 'bg-transparent'
                }`}
              >
                <Text
                  className={`text-xs ${
                    isSelected ? 'text-white font-semibold' : 'text-muted-foreground font-medium'
                  }`}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 2. Resident Filter Pills */}
      {residents.length > 0 && (
        <View className="flex-row items-center pt-0.5">
          <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-2">
            Person
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6, alignItems: 'center' }}
            className="flex-1"
          >
            <TouchableOpacity
              onPress={() => onResidentChange('all')}
              activeOpacity={0.8}
              className={`px-3.5 py-1.5 rounded-full ${
                selectedResidentId === 'all' ? 'bg-primary' : 'bg-surface'
              }`}
            >
              <Text
                className={`text-xs ${
                  selectedResidentId === 'all'
                    ? 'text-white font-semibold'
                    : 'text-muted-foreground font-medium'
                }`}
              >
                All
              </Text>
            </TouchableOpacity>

            {residents.map((r) => {
              const isSelected = selectedResidentId === r.id;
              return (
                <TouchableOpacity
                  key={r.id}
                  onPress={() => onResidentChange(r.id)}
                  activeOpacity={0.8}
                  className={`px-3.5 py-1.5 rounded-full ${
                    isSelected ? 'bg-primary' : 'bg-surface'
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      isSelected
                        ? 'text-white font-semibold'
                        : 'text-muted-foreground font-medium'
                    }`}
                  >
                    {r.firstName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export const TaskFilterBar = TaskFilterTabs;

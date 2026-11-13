import React, { useState, useMemo } from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { GET_DAILY_TASKS } from '@repo/endpoints';
import { Text } from '../ui/text';
import {
  type ResidentTaskHistoryItem,
  type TaskHistoryStatus,
} from './residentTaskHistory.types';
import { ResidentTaskHistoryCard } from './ResidentTaskHistoryCard';
import { makeMobileApiCall } from '../../data/api/client';
import { formatUkDate } from '../../lib/date';
import { theme } from '../../theme/tokens';

interface Props {
  residentId?: string;
}

export function ResidentTaskHistorySections({ residentId }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | TaskHistoryStatus>('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);

  const { data: rawTasks = [], isLoading } = useQuery<Array<Record<string, unknown>>>({
    queryKey: ['resident-task-history', residentId],
    queryFn: async () => {
      if (!residentId) return [];
      const res = await makeMobileApiCall<Array<Record<string, unknown>>>(
        GET_DAILY_TASKS,
        undefined,
        { residentId }
      ).catch(() => []);
      return Array.isArray(res) ? res : [];
    },
    enabled: Boolean(residentId),
    staleTime: 1000 * 60 * 3,
  });

  const tasks: ResidentTaskHistoryItem[] = useMemo(() => {
    return rawTasks.map((t, idx) => {
      const carePlanTask = t.carePlanTask as Record<string, unknown> | undefined;
      const assignedStaff = t.assignedStaff as Record<string, unknown> | undefined;
      const completedBy = t.completedBy as Record<string, unknown> | undefined;

      const rawCategory = String(t.category || carePlanTask?.category || '').toLowerCase();
      let taskType: ResidentTaskHistoryItem['taskType'] = 'observation';
      if (rawCategory.includes('med')) taskType = 'medication';
      else if (rawCategory.includes('fluid') || rawCategory.includes('hydration')) taskType = 'fluid';
      else if (rawCategory.includes('reposition') || rawCategory.includes('turn')) taskType = 'reposition';
      else if (rawCategory.includes('nutrition') || rawCategory.includes('meal')) taskType = 'nutrition';

      const rawStatus = String(t.status || 'Pending');
      let status: TaskHistoryStatus = 'Pending';
      if (rawStatus === 'Completed') status = 'Completed';
      else if (rawStatus === 'Skipped' || rawStatus === 'Overdue') status = 'Over Due';

      const dateStr = t.scheduledDate || t.createdAt
        ? formatUkDate(t.scheduledDate || t.createdAt)
        : 'Recorded';

      return {
        id: String(t.id || `task-${idx}`),
        title: String(t.title || carePlanTask?.instructions || 'Daily Task'),
        subtitle: String(
          t.description ||
          t.instructions ||
          carePlanTask?.instructions ||
          'Scheduled care routine'
        ),
        taskType,
        dateStr,
        assignedStaffName: String(
          completedBy?.fullName ||
          assignedStaff?.fullName ||
          'Care Staff'
        ),
        assignedStaffAvatar: undefined,
        status,
      };
    });
  }, [rawTasks]);

  // Filter tasks based on query and status filter
  const filteredTasks = useMemo(() => {
    return tasks.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.assignedStaffName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tasks, searchQuery, statusFilter]);

  // Paginated tasks
  const totalCount = filteredTasks.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const displayedTasks = filteredTasks.slice(startIndex, startIndex + rowsPerPage);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const cycleRowsPerPage = () => {
    if (rowsPerPage === 5) setRowsPerPage(10);
    else if (rowsPerPage === 10) setRowsPerPage(20);
    else setRowsPerPage(5);
    setCurrentPage(1);
  };

  return (
    <View className="pb-8">
      {/* 1. Header Title & Subtitle */}
      <Text className="text-lg font-bold text-text-primary">Task History</Text>
      <Text className="text-xs text-text-secondary mt-0.5 mb-3">
        View and track all assigned tasks for this person supported.
      </Text>

      {/* 2. Search & Filter Controls */}
      <View className="flex-row gap-2.5 mb-3.5 items-center">
        {/* Search Input Box */}
        <View className="flex-1 bg-surface rounded-xl px-3.5 h-11 flex-row items-center gap-2">
          <Search size={18} color="#64748B" />
          <TextInput
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setCurrentPage(1);
            }}
            placeholder="Search Task"
            placeholderTextColor="#94A3B8"
            style={{ fontFamily: theme.fonts.regular }}
            className="flex-1 text-sm text-text-primary h-full"
          />
        </View>

        {/* Filter Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setIsFilterOpen(!isFilterOpen)}
          className={`w-11 h-11 rounded-xl items-center justify-center ${
            isFilterOpen || statusFilter !== 'All' ? 'bg-primary-light' : 'bg-surface'
          }`}
          accessibilityLabel="Filter tasks"
        >
          <SlidersHorizontal
            size={18}
            color={isFilterOpen || statusFilter !== 'All' ? '#4A706A' : '#64748B'}
          />
        </TouchableOpacity>
      </View>

      {/* Filter Chips Drawer (collapsible) */}
      {isFilterOpen && (
        <View className="flex-row flex-wrap gap-2 mb-3.5 pb-1">
          {(['All', 'Completed', 'Over Due', 'Pending'] as const).map((st) => (
            <TouchableOpacity
              key={st}
              activeOpacity={0.7}
              onPress={() => {
                setStatusFilter(st);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-full ${
                statusFilter === st ? 'bg-primary' : 'bg-surface'
              }`}
            >
              <Text
                className={`text-xs ${
                  statusFilter === st ? 'text-white font-bold' : 'text-text-secondary font-medium'
                }`}
              >
                {st}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {isLoading && (
        <View className="py-6 items-center justify-center">
          <ActivityIndicator size="small" color="#4A706A" />
          <Text className="text-xs text-text-secondary mt-2">Loading task history...</Text>
        </View>
      )}

      {/* 3. Task Cards List */}
      {!isLoading && displayedTasks.length > 0 ? (
        displayedTasks.map((task, idx) => (
          <ResidentTaskHistoryCard key={`${task.id}-${idx}`} item={task} />
        ))
      ) : !isLoading ? (
        <View className="bg-surface rounded-2xl p-8 items-center justify-center my-2">
          <Text className="text-base font-bold text-text-primary">No tasks found</Text>
          <Text className="text-xs text-text-secondary mt-1">
            {searchQuery || statusFilter !== 'All'
              ? 'Try adjusting your search or filter'
              : 'No care tasks have been recorded for this resident.'}
          </Text>
        </View>
      ) : null}

      {/* 4. Pagination Section */}
      {totalCount > 0 && (
        <View className="mt-4 pt-3 items-center">
          {/* Count Label */}
          <Text className="text-xs text-text-secondary text-center mb-2.5">
            Showing {String(displayedTasks.length).padStart(2, '0')} of {String(totalCount).padStart(2, '0')}
          </Text>

          {/* Page Switcher Buttons Row */}
          <View className="flex-row items-center justify-center gap-1.5 mb-3">
            <TouchableOpacity
              onPress={handlePrevPage}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded-full items-center justify-center bg-surface"
            >
              <ChevronLeft size={14} color={currentPage === 1 ? '#CBD5E1' : '#64748B'} />
            </TouchableOpacity>

            {Array.from({ length: Math.min(totalPages, 5) }).map((_, pIdx) => {
              const pageNum = pIdx + 1;
              return (
                <TouchableOpacity
                  key={`page-${pageNum}`}
                  onPress={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-full items-center justify-center ${
                    currentPage === pageNum ? 'bg-primary' : 'bg-transparent'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      currentPage === pageNum ? 'text-white' : 'text-text-secondary'
                    }`}
                  >
                    {pageNum}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {totalPages > 5 && (
              <>
                <View className="w-5 h-8 items-center justify-center">
                  <Text className="text-xs text-text-muted">...</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setCurrentPage(totalPages)}
                  className={`w-8 h-8 rounded-full items-center justify-center ${
                    currentPage === totalPages ? 'bg-primary' : 'bg-transparent'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      currentPage === totalPages ? 'text-white' : 'text-text-secondary'
                    }`}
                  >
                    {totalPages}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              onPress={handleNextPage}
              disabled={currentPage === totalPages}
              className="w-8 h-8 rounded-full items-center justify-center bg-surface"
            >
              <ChevronRight size={14} color={currentPage === totalPages ? '#CBD5E1' : '#64748B'} />
            </TouchableOpacity>
          </View>

          {/* Rows per page dropdown */}
          <View className="flex-row items-center justify-center gap-2">
            <Text className="text-xs text-text-secondary">Rows per page</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={cycleRowsPerPage}
              className="bg-surface rounded-full px-3 py-1 flex-row items-center gap-1.5"
            >
              <Text className="text-xs font-semibold text-text-primary">
                {String(rowsPerPage).padStart(2, '0')}
              </Text>
              <ChevronDown size={12} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

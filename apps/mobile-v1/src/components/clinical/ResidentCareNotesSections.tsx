import React, { useState, useMemo } from 'react';
import { View, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, FileText, User, Clock, MessageSquare, AlertCircle } from 'lucide-react-native';
import { GET_RESIDENT_TIMELINE } from '@repo/endpoints';
import { makeMobileApiCall } from '../../data/api/client';
import { Text, Card } from '../../presentation/components/common';
import { formatUkRelativeDayAndTime } from '../../lib/date';
import { AddCareNoteModal } from './AddCareNoteModal';
import { useAuth } from '../../presentation/context/AuthContext';
import { isCareNoteEvent } from './residentTimelineRecords';
import { theme } from '../../theme/tokens';

export interface MobileCareNote {
  id: string;
  author: string;
  role: string;
  category: 'General' | 'Medical' | 'Nutrition' | 'Behavioral';
  content: string;
  timestamp: string;
  dateLabel: string;
  timeLabel: string;
}

interface Props {
  residentId: string;
}

const CATEGORY_FILTERS = ['All', 'General', 'Medical', 'Nutrition', 'Behavioral'] as const;

export function ResidentCareNotesSections({ residentId }: Props) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { data: timelineData = [], isLoading, error, refetch } = useQuery({
    queryKey: ['residentTimeline', residentId],
    queryFn: async () => {
      const res = await makeMobileApiCall<
        Array<{
          id: string;
          eventType?: string;
          summary?: string;
          timestamp: string;
          carerId?: string;
          carer?: { id?: string; fullName?: string; role?: { name?: string } };
        }>
      >(GET_RESIDENT_TIMELINE, undefined, undefined, { id: residentId });
      return Array.isArray(res) ? res : [];
    },
    enabled: Boolean(residentId),
    staleTime: 1000 * 60 * 2,
  });

  const notes: MobileCareNote[] = useMemo(() => {
    return timelineData.filter((item) => isCareNoteEvent(item.eventType) && Boolean(user?.id) && (item.carer?.id ?? item.carerId) === user?.id).map((item) => {
      let category: MobileCareNote['category'] = 'General';
      const evt = (item.eventType || '').toLowerCase();
      if (/nutrition|fluid|diet|hydration/i.test(evt)) category = 'Nutrition';
      else if (/medical|obs|clinical|medication/i.test(evt)) category = 'Medical';
      else if (/behavior|behaviour|mood|mental/i.test(evt)) category = 'Behavioral';

      const { dateLabel, timeLabel } = formatUkRelativeDayAndTime(item.timestamp);

      return {
        id: item.id,
        author: item.carer?.fullName || 'Author not recorded',
        role: item.carer?.role?.name || 'Role not recorded',
        category,
        content: item.summary || 'Content not recorded',
        timestamp: item.timestamp,
        dateLabel,
        timeLabel,
      };
    });
  }, [timelineData, user?.id]);

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchesSearch =
        n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.author.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat =
        selectedCategory === 'All' || n.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [notes, searchQuery, selectedCategory]);

  const getCategoryBadgeStyles = (cat: string) => {
    switch (cat) {
      case 'Nutrition':
        return { bg: 'bg-clinical-safeBg', text: 'text-clinical-safe' };
      case 'Medical':
        return { bg: 'bg-sky-50', text: 'text-sky-700' };
      case 'Behavioral':
        return { bg: 'bg-purple-50', text: 'text-purple-700' };
      case 'General':
      default:
        return { bg: 'bg-white', text: 'text-text-secondary' };
    }
  };

  if (isLoading) {
    return (
      <View className="items-center justify-center py-16">
        <ActivityIndicator size="large" color="#4A706A" />
        <Text className="text-xs text-text-secondary mt-3 font-medium">Loading care notes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <Card className="p-6 items-center justify-center my-4">
        <AlertCircle size={32} color="#FF3B2F" />
        <Text className="text-sm font-bold text-text-primary mt-2">Failed to load care notes</Text>
        <Text className="text-xs text-text-secondary mt-1 text-center">
          {error instanceof Error ? error.message : 'Please check your connection.'}
        </Text>
        <TouchableOpacity
          onPress={() => void refetch()}
          className="mt-4 px-4 py-2 bg-primary rounded-full"
        >
          <Text className="text-xs font-bold text-white">Retry</Text>
        </TouchableOpacity>
      </Card>
    );
  }

  return (
    <View className="pb-8">
      {/* 1. Top Action Row: Add Care Note Button */}
      <View className="flex-row items-center justify-between mb-3.5">
        <View>
          <Text className="text-lg font-bold text-text-primary">Care Documentation</Text>
          <Text className="text-xs text-text-secondary">
            {notes.length} total {notes.length === 1 ? 'note' : 'notes'} recorded
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setIsAddModalOpen(true)}
          activeOpacity={0.8}
          className="flex-row items-center gap-1.5 px-4 py-2 bg-primary rounded-full"
        >
          <Plus size={15} color="#FFFFFF" strokeWidth={2.4} />
          <Text className="text-xs font-bold text-white">Add Note</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Search Input */}
      <View className="bg-surface rounded-xl px-3.5 h-11 flex-row items-center gap-2 mb-3">
        <Search size={16} color="#64748B" />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search notes or author..."
          placeholderTextColor="#94A3B8"
          style={{ fontFamily: theme.fonts.regular }}
          className="flex-1 text-sm text-text-primary h-full"
        />
      </View>

      {/* 3. Category Filter Chips */}
      <View className="flex-row flex-wrap gap-2 mb-4">
        {CATEGORY_FILTERS.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full ${
                isSelected ? 'bg-primary' : 'bg-surface'
              }`}
            >
              <Text
                className={`text-xs ${
                  isSelected ? 'font-bold text-white' : 'font-medium text-text-secondary'
                }`}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 4. Notes List */}
      {filteredNotes.length === 0 ? (
        <Card className="p-8 items-center justify-center">
          <MessageSquare size={36} color="#64748B" />
          <Text className="text-base font-bold text-text-primary mt-2">No Care Notes Found</Text>
          <Text className="text-xs text-text-secondary mt-1 text-center max-w-[260px]">
            {searchQuery
              ? 'No notes match your search criteria.'
              : 'No care notes have been documented for this person supported yet.'}
          </Text>
          <TouchableOpacity
            onPress={() => setIsAddModalOpen(true)}
            className="mt-4 px-4 py-2 bg-primary rounded-full"
          >
            <Text className="text-xs font-bold text-white">Add First Note</Text>
          </TouchableOpacity>
        </Card>
      ) : (
        filteredNotes.map((note) => {
          const badge = getCategoryBadgeStyles(note.category);
          return (
            <Card key={note.id} className="mb-3 p-4">
              {/* Header: Author + Category */}
              <View className="flex-row items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200/70">
                <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                  <View className="w-8 h-8 rounded-full bg-white items-center justify-center">
                    <User size={14} color="#4A706A" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-text-primary" numberOfLines={1}>
                      {note.author}
                    </Text>
                    <Text className="text-xs text-text-muted">{note.role}</Text>
                  </View>
                </View>

                <View className={`px-2.5 py-1 rounded-full ${badge.bg}`}>
                  <Text className={`text-xs font-semibold ${badge.text}`}>{note.category}</Text>
                </View>
              </View>

              {/* Content */}
              <Text className="text-sm text-text-primary leading-relaxed mb-3">
                {note.content}
              </Text>

              {/* Timestamp Footer */}
              <View className="flex-row items-center gap-1.5 pt-2 border-t border-slate-200/60">
                <Clock size={12} color="#94A3B8" />
                <Text className="text-xs text-text-muted">
                  {note.dateLabel} at {note.timeLabel}
                </Text>
              </View>
            </Card>
          );
        })
      )}

      {/* Add Note Modal */}
      <AddCareNoteModal
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        residentId={residentId}
      />
    </View>
  );
}

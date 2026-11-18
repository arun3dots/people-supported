import React, { useMemo, useState } from 'react';
import { View, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import {
  Droplet, Plus, Search, Clock, Edit2, Trash2, ChevronLeft, ChevronRight, Calendar,
} from 'lucide-react-native';
import { Text, Card } from '../../presentation/components/common';
import { useAuth } from '../../presentation/context/AuthContext';
import type { ResidentDetailData } from '../../presentation/hooks/useResidentDetail';
import { useFluidTracker } from '../../presentation/hooks/useFluidTracker';
import { FoodFluidLogItem, formatMealSlotLabel } from '../../domain/clinical/fluid-balance';
import { formatUkDate, formatUkTime, getUkDateString } from '../../lib/date';
import { theme } from '../../theme';
import { FluidIntakeSummaryCard } from './FluidIntakeSummaryCard';
import { AddFluidIntakeModal } from './AddFluidIntakeModal';
import { FluidDeleteConfirmModal } from './FluidDeleteConfirmModal';

interface ResidentFluidIntakeSectionProps {
  resident: ResidentDetailData;
}

const WRITE_ROLES = new Set(['admin', 'superadmin', 'manager', 'nurse', 'carer']);

function shiftIsoDate(dateStr: string, deltaDays: number): string {
  const base = new Date(`${dateStr}T12:00:00`);
  base.setDate(base.getDate() + deltaDays);
  return getUkDateString(base);
}

export function ResidentFluidIntakeSection({ resident }: ResidentFluidIntakeSectionProps) {
  const { user } = useAuth();
  const todayStr = useMemo(() => getUkDateString(), []);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);
  const [typeFilter, setTypeFilter] = useState<'All' | 'Fluid' | 'Food'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllLogs, setShowAllLogs] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<FoodFluidLogItem | null>(null);
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);

  const isRestricted = resident.status === 'Discharged' || resident.status === 'Deceased';
  const roleLower = (user?.roleName || 'carer').toLowerCase();
  const canRecord = !isRestricted && WRITE_ROLES.has(roleLower);
  const isToday = selectedDateStr === todayStr;

  const {
    logs, summary, fluidCount, foodCount, isLoading, isSaving, isDeleting,
    logBeverage, createLog, updateLog, deleteLog, error, refetch,
  } = useFluidTracker(resident.id, selectedDateStr);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (typeFilter !== 'All' && log.type !== typeFilter) return false;
      const q = searchTerm.trim().toLowerCase();
      if (!q) return true;
      const slotLabel = formatMealSlotLabel(log.mealSlot).toLowerCase();
      return [slotLabel, (log.mealSlot || '').toLowerCase(), (log.notes || '').toLowerCase(), `${log.amount} ${log.unit}`.toLowerCase()]
        .some((field) => field.includes(q));
    });
  }, [logs, typeFilter, searchTerm]);

  const displayedLogs = showAllLogs ? filteredLogs : filteredLogs.slice(0, 5);
  const handleOpenCreate = () => { setEditingLog(null); setModalOpen(true); };
  const handleOpenEdit = (item: FoodFluidLogItem) => { setEditingLog(item); setModalOpen(true); };

  const handleConfirmDelete = async () => {
    if (!deletingLogId) return;
    try {
      await deleteLog(deletingLogId);
      setDeletingLogId(null);
    } catch (err: unknown) {
      Alert.alert('Delete Failed', err instanceof Error ? err.message : 'Unable to delete intake entry.');
    }
  };

  const displayDateLabel = formatUkDate(`${selectedDateStr}T12:00:00`, { day: '2-digit', month: 'short', year: 'numeric' });

  if (error) return <View className="p-4 gap-3">
    <Text className="text-base text-clinical-critical">Unable to load fluid and nutrition records.</Text>
    <TouchableOpacity onPress={() => { void refetch(); }}><Text className="text-base text-primary">Retry</Text></TouchableOpacity>
  </View>;
  if (isLoading) return <ActivityIndicator accessibilityLabel="Loading fluid and nutrition records" />;

  return (
    <View className="mb-4">
      {/* 1. Section Header (matches ResidentObservationsSection UI consistency) */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2 flex-1 mr-2">
          <View className="w-7 h-7 rounded-full bg-primary-light items-center justify-center">
            <Droplet size={14} color="#4A706A" />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-foreground" numberOfLines={1}>
              Fluid & Nutrition Monitoring
            </Text>
          </View>
        </View>
        {canRecord && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleOpenCreate}
            className="flex-row items-center gap-1 px-3.5 py-1.5 rounded-full bg-primary"
          >
            <Plus size={14} color="#FFFFFF" strokeWidth={2.5} />
            <Text className="text-xs font-semibold text-white">Record Intake</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 2. Hydration Balance Summary & 4 Metrics Cards */}
      <FluidIntakeSummaryCard
        summary={summary}
        fluidCount={fluidCount}
        foodCount={foodCount}
        totalEntries={logs.length}
        canQuickLog={canRecord && isToday}
        isSaving={isSaving}
        onQuickAdd={logBeverage}
      />

      {/* 3. Date Selector, Search & Type Filter Chips */}
      <View className="bg-surface rounded-xl px-3 h-10 flex-row items-center justify-between mb-2.5">
        <TouchableOpacity
          onPress={() => setSelectedDateStr((prev) => shiftIsoDate(prev, -1))}
          className="p-1"
          accessibilityLabel="Previous date"
        >
          <ChevronLeft size={16} color="#5D5D5D" />
        </TouchableOpacity>

        <View className="flex-row items-center gap-1.5">
          <Calendar size={13} color="#4A706A" />
          <Text className="text-xs font-semibold text-foreground">
            {isToday ? `Today · ${displayDateLabel}` : displayDateLabel}
          </Text>
          {!isToday && (
            <TouchableOpacity
              onPress={() => setSelectedDateStr(todayStr)}
              className="ml-1 px-2.5 py-0.5 rounded-full bg-white"
            >
              <Text className="text-xs font-bold text-primary">Today</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          disabled={isToday}
          onPress={() => setSelectedDateStr((prev) => shiftIsoDate(prev, 1))}
          className={`p-1 ${isToday ? 'opacity-30' : ''}`}
          accessibilityLabel="Next date"
        >
          <ChevronRight size={16} color="#5D5D5D" />
        </TouchableOpacity>
      </View>

      <View className="bg-surface rounded-xl px-3.5 h-10 flex-row items-center gap-2 mb-2.5">
        <Search size={15} color="#8E8E93" />
        <TextInput
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Search notes, slot or amount..."
          placeholderTextColor="#8E8E93"
          style={{ fontFamily: theme.fonts.regular }}
          className="flex-1 text-sm text-foreground h-full p-0"
        />
      </View>

      <View className="bg-surface rounded-full p-1 flex-row gap-1 mb-3">
        {(['All', 'Fluid', 'Food'] as const).map((tab) => {
          const active = typeFilter === tab;
          const label =
            tab === 'All'
              ? `All (${logs.length})`
              : tab === 'Fluid'
                ? `Fluids (${fluidCount})`
                : `Foods (${foodCount})`;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setTypeFilter(tab)}
              className={`flex-1 py-1.5 rounded-full items-center ${
                active ? 'bg-primary' : 'bg-transparent'
              }`}
            >
              <Text className={`text-xs ${active ? 'font-semibold text-white' : 'font-medium text-muted-foreground'}`}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 4. Intake Log Entries List */}
      {isLoading && logs.length === 0 ? (
        <Card className="p-6 items-center justify-center">
          <ActivityIndicator size="small" color="#4A706A" />
          <Text className="text-xs text-muted-foreground mt-2">Loading intake records...</Text>
        </Card>
      ) : filteredLogs.length === 0 ? (
        <Card className="p-5 items-center justify-center">
          <Droplet size={24} color="#8E8E93" className="mb-2" />
          <Text className="text-sm font-semibold text-foreground mb-1">No intake records found</Text>
          <Text className="text-xs text-muted-foreground text-center mb-3">
            {logs.length === 0
              ? 'No fluid or food intake entries have been logged for this date.'
              : `No records found matching "${searchTerm}".`}
          </Text>
          {canRecord && logs.length === 0 && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleOpenCreate}
              className="px-4 py-2 rounded-full bg-white"
            >
              <Text className="text-xs font-bold text-primary">Record First Intake</Text>
            </TouchableOpacity>
          )}
        </Card>
      ) : (
        <View className="gap-2.5">
          {displayedLogs.map((log) => {
            const dateStr = formatUkDate(log.timestamp, { day: '2-digit', month: 'short' });
            const timeStr = formatUkTime(log.timestamp);
            const isFluid = log.type === 'Fluid';
            const consumedPct = log.intakePercentage ?? 100;

            return (
              <Card key={log.id} className="p-3.5">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-1.5">
                    <Clock size={12} color="#8E8E93" />
                    <Text className="text-sm font-bold text-foreground">
                      {timeStr} <Text className="text-muted-foreground font-normal">· {dateStr}</Text>
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-1.5">
                    <View
                      className={`px-2.5 py-0.5 rounded-full ${
                        isFluid ? 'bg-primary' : 'bg-clinical-warningBg'
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          isFluid ? 'text-white' : 'text-clinical-warning'
                        }`}
                      >
                        {log.type}
                      </Text>
                    </View>

                    {canRecord && (
                      <>
                        <TouchableOpacity
                          onPress={() => handleOpenEdit(log)}
                          className="p-1.5 rounded-full bg-white"
                          accessibilityLabel="Edit intake entry"
                        >
                          <Edit2 size={12} color="#5D5D5D" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setDeletingLogId(log.id)}
                          className="p-1.5 rounded-full bg-clinical-criticalBg"
                          accessibilityLabel="Delete intake entry"
                        >
                          <Trash2 size={12} color="#FF3B2F" />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>

                <View className="flex-row flex-wrap gap-1.5">
                  <View className="px-2.5 py-1 rounded-lg bg-white">
                    <Text className="text-xs text-muted-foreground font-medium">
                      Round: <Text className="font-bold text-foreground">{formatMealSlotLabel(log.mealSlot)}</Text>
                    </Text>
                  </View>
                  <View className="px-2.5 py-1 rounded-lg bg-white">
                    <Text className="text-xs text-muted-foreground font-medium">
                      Amount: <Text className="font-bold text-foreground">{log.amount} {log.unit}</Text>
                    </Text>
                  </View>
                  <View className="px-2.5 py-1 rounded-lg bg-white">
                    <Text className="text-xs text-muted-foreground font-medium">
                      Consumed: <Text className="font-bold text-foreground">{consumedPct}%</Text>
                    </Text>
                  </View>
                </View>

                {Boolean(log.notes) && (
                  <View className="pt-1.5 mt-2 border-t border-slate-200/60">
                    <Text className="text-xs text-muted-foreground italic">{log.notes}</Text>
                  </View>
                )}
              </Card>
            );
          })}

          {filteredLogs.length > 5 && (
            <TouchableOpacity
              onPress={() => setShowAllLogs((prev) => !prev)}
              className="py-2.5 rounded-full bg-surface items-center"
            >
              <Text className="text-xs font-bold text-primary">
                {showAllLogs ? 'Show Less' : `Show All (${filteredLogs.length})`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 5. Add / Edit & Delete Modals */}
      <AddFluidIntakeModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedDateStr={selectedDateStr}
        editingLog={editingLog}
        isSaving={isSaving}
        onSaveCreate={createLog}
        onSaveUpdate={updateLog}
      />

      <FluidDeleteConfirmModal
        visible={Boolean(deletingLogId)}
        onClose={() => setDeletingLogId(null)}
        onConfirm={() => void handleConfirmDelete()}
        isPending={isDeleting}
      />
    </View>
  );
}

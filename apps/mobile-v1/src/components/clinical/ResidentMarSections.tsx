import React, { useState, useMemo } from 'react';
import { View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Clock, Pill, RotateCcw, ChevronRight, AlertTriangle } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { ADMINISTER_MEDICATION } from '@repo/endpoints';
import { Text } from '../ui/text';
import { Card } from '../ui/card';
import {
  type MarAdminActionItem,
  type AdministrationVitals,
} from './residentMar.types';
import { filterScheduledByDate } from './residentMar.utils';
import { ResidentMarAdminModal } from './ResidentMarAdminModal';
import { ResidentMarStatsRow } from './ResidentMarStatsRow';
import { ResidentPrescriptionsCard } from './ResidentPrescriptionsCard';
import { useResidentMarData } from './useResidentMarData';
import {
  ResidentScheduledMedCard,
  ResidentPrnMedCard,
  ResidentRecentMedCard,
} from './ResidentMedCards';
import { makeMobileApiCall } from '../../data/api/client';
import { enqueueMutation } from '../../data/api/offlineQueue';
import { safeLogger } from '../../data/security/safeLogger';

interface Props {
  residentId?: string;
  allergies?: string[];
}

export function ResidentMarSections({ residentId, allergies = [] }: Props) {
  const queryClient = useQueryClient();

  const [scheduleFilter, setScheduleFilter] = useState<'today' | 'all'>('today');
  const [expandedScheduled, setExpandedScheduled] = useState(false);
  const [expandedPrn, setExpandedPrn] = useState(false);
  const [expandedRecent, setExpandedRecent] = useState(false);
  const [actionItem, setActionItem] = useState<MarAdminActionItem | null>(null);

  const { isLoading, scheduledList, prnList, recentList } = useResidentMarData(residentId);

  // Dynamic KPI counts matching Web
  const dueCount = scheduledList.filter((s) => s.status === 'Due').length;
  const administeredCount = recentList.length;
  const missedCount = scheduledList.filter((s) => s.status === 'Missed').length;
  const prnCount = prnList.length;
  const onHoldCount = scheduledList.filter((s) => s.status === 'On Hold').length;

  // Filter scheduled medications by "Today" vs "All dates" (matching Web)
  const visibleScheduledList = useMemo(
    () => filterScheduledByDate(scheduledList, scheduleFilter),
    [scheduledList, scheduleFilter]
  );

  const handleConfirmAction = async (
    action: 'Administer' | 'Refused' | 'Omitted',
    reasonNotes: string,
    witnessName: string,
    vitals?: AdministrationVitals
  ) => {
    if (!actionItem || !residentId) return;

    let queuedOffline = false;
    try {
      const backendStatus = action === 'Administer' ? 'Given' : action === 'Refused' ? 'Refused' : 'Omitted';
      const payload = {
        roundId: actionItem.id,
        residentId,
        status: backendStatus,
        reason: reasonNotes || undefined,
        witnessName: witnessName || undefined,
        vitals: vitals || undefined,
      };

      try {
        await makeMobileApiCall(ADMINISTER_MEDICATION, payload);
      } catch (err) {
        safeLogger.warn('Failed to administer medication online; queuing for sync', err);
        await enqueueMutation(ADMINISTER_MEDICATION, payload);
        queuedOffline = true;
      }

      if (queuedOffline) {
        Alert.alert(
          'Saved Offline',
          `${actionItem.drugName} is queued and will sync when the connection is restored.`
        );
      } else {
        Alert.alert('Medication Recorded', `${actionItem.drugName} marked as ${action}.`);
        void queryClient.invalidateQueries({ queryKey: ['resident-medication-rounds', residentId] });
        void queryClient.invalidateQueries({ queryKey: ['resident-medication-prescriptions', residentId] });
        void queryClient.invalidateQueries({ queryKey: ['residentTimeline', residentId] });
        void queryClient.invalidateQueries({ queryKey: ['shift-resident-activity'] });
      }
    } catch (err) {
      safeLogger.error('Failed to record medication administration', err);
      Alert.alert(
        'Medication Not Recorded',
        `Could not record ${actionItem.drugName}. Please retry when the connection is available.`
      );
    }

    setActionItem(null);
  };

  const displayedScheduled = expandedScheduled ? visibleScheduledList : visibleScheduledList.slice(0, 2);
  const displayedPrn = expandedPrn ? prnList : prnList.slice(0, 2);
  const displayedRecent = expandedRecent ? recentList : recentList.slice(0, 2);

  return (
    <View className="pb-8">
      {/* 1. Allergies Safety Alert Banner (Matching Web) */}
      {allergies.length > 0 && (
        <View className="bg-clinical-criticalBg rounded-2xl p-3.5 mb-3.5 flex-row items-center gap-2.5">
          <AlertTriangle size={18} color="#FF3B2F" />
          <View className="flex-1">
            <Text className="text-sm font-bold text-clinical-critical">Known Clinical Allergies</Text>
            <Text className="text-xs font-semibold text-clinical-critical mt-0.5">
              {allergies.join(', ')}
            </Text>
          </View>
        </View>
      )}

      {/* 2. Section Title & Schedule Filter Toggle (Matching Web "Today" vs "All dates") */}
      <View className="flex-row items-center justify-between mb-3.5 flex-wrap gap-2">
        <Text className="text-lg font-bold text-text-primary">
          Medication Administration Record
        </Text>
        <View className="flex-row items-center bg-surface p-1 rounded-full">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setScheduleFilter('today')}
            className={`px-3 py-1 rounded-full ${
              scheduleFilter === 'today' ? 'bg-primary' : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-xs ${
                scheduleFilter === 'today' ? 'text-white font-bold' : 'text-text-secondary font-medium'
              }`}
            >
              Today
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setScheduleFilter('all')}
            className={`px-3 py-1 rounded-full ${
              scheduleFilter === 'all' ? 'bg-primary' : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-xs ${
                scheduleFilter === 'all' ? 'text-white font-bold' : 'text-text-secondary font-medium'
              }`}
            >
              All dates
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Stat Badges Row (5 KPI Cards) */}
      <ResidentMarStatsRow
        dueCount={dueCount}
        administeredCount={administeredCount}
        missedCount={missedCount}
        prnCount={prnCount}
        onHoldCount={onHoldCount}
      />

      {isLoading && (
        <View className="py-6 items-center justify-center">
          <ActivityIndicator size="small" color="#4A706A" />
          <Text className="text-xs text-text-secondary mt-2">Loading medication records...</Text>
        </View>
      )}

      {/* 4. Prescriptions (read-only; stop/pause/change are managed on web) */}
      <ResidentPrescriptionsCard residentId={residentId} />

      {/* 5. Scheduled Medications Section */}
      <Card className="p-4 mb-4">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <View className="w-7 h-7 rounded-full bg-white items-center justify-center">
              <Clock size={14} color="#0284C7" />
            </View>
            <Text className="text-base font-bold text-text-primary">
              Scheduled Medications
            </Text>
          </View>
          <Text className="text-xs text-text-muted font-medium">
            {scheduleFilter === 'today' ? 'Due Today' : 'All Prescriptions'}
          </Text>
        </View>

        {visibleScheduledList.length === 0 && !isLoading ? (
          <Text className="text-xs text-text-muted py-3 text-center">
            {scheduleFilter === 'today'
              ? 'No medications scheduled for today'
              : 'No scheduled medications recorded'}
          </Text>
        ) : (
          displayedScheduled.map((item) => (
            <ResidentScheduledMedCard
              key={item.id}
              item={item}
              onAction={(scheduledItem) =>
                setActionItem({
                  id: scheduledItem.id,
                  drugName: scheduledItem.drugName,
                  dose: scheduledItem.dose,
                  route: scheduledItem.route,
                  scheduledTime: scheduledItem.scheduledTime,
                  isControlledDrug: scheduledItem.isControlledDrug,
                  notes: scheduledItem.notes,
                  isPrn: false,
                })
              }
            />
          ))
        )}

        {visibleScheduledList.length > 2 && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setExpandedScheduled(!expandedScheduled)}
            className="flex-row items-center justify-between pt-2 border-t border-slate-200/70"
          >
            <Text className="text-xs font-semibold text-primary">
              {expandedScheduled ? 'Show Less' : `View All Scheduled (${visibleScheduledList.length})`}
            </Text>
            <ChevronRight size={16} color="#4A706A" />
          </TouchableOpacity>
        )}
      </Card>

      {/* 5. PRN (As Needed) Medication Section (With Administer Action) */}
      <Card className="p-4 mb-4">
        <View className="flex-row items-center gap-2 mb-3">
          <View className="w-7 h-7 rounded-full bg-white items-center justify-center">
            <Pill size={14} color="#059669" />
          </View>
          <Text className="text-base font-bold text-text-primary">
            PRN (As Needed) Medication
          </Text>
        </View>

        {prnList.length === 0 && !isLoading ? (
          <Text className="text-xs text-text-muted py-3 text-center">
            No PRN medications prescribed
          </Text>
        ) : (
          displayedPrn.map((item) => (
            <ResidentPrnMedCard
              key={item.id}
              item={item}
              onAction={(prnItem) =>
                setActionItem({
                  id: prnItem.id,
                  drugName: prnItem.drugName,
                  dose: prnItem.dose,
                  route: prnItem.route,
                  scheduledTime: 'PRN (As Needed)',
                  isControlledDrug: prnItem.isControlledDrug,
                  notes: prnItem.notes || prnItem.indication,
                  isPrn: true,
                })
              }
            />
          ))
        )}

        {prnList.length > 2 && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setExpandedPrn(!expandedPrn)}
            className="flex-row items-center justify-between pt-2 border-t border-slate-200/70"
          >
            <Text className="text-xs font-semibold text-primary">
              {expandedPrn ? 'Show Less' : `View All PRN (${prnList.length})`}
            </Text>
            <ChevronRight size={16} color="#4A706A" />
          </TouchableOpacity>
        )}
      </Card>

      {/* 6. Recent Administrations Section */}
      <Card className="p-4 mb-4">
        <View className="flex-row items-center gap-2 mb-3">
          <View className="w-7 h-7 rounded-full bg-white items-center justify-center">
            <RotateCcw size={14} color="#0284C7" />
          </View>
          <Text className="text-base font-bold text-text-primary">
            Recent Administrations
          </Text>
        </View>

        {recentList.length === 0 && !isLoading ? (
          <Text className="text-xs text-text-muted py-3 text-center">
            No recent administrations recorded
          </Text>
        ) : (
          displayedRecent.map((item) => (
            <ResidentRecentMedCard key={item.id} item={item} />
          ))
        )}

        {recentList.length > 2 && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setExpandedRecent(!expandedRecent)}
            className="flex-row items-center justify-between pt-2 border-t border-slate-200/70"
          >
            <Text className="text-xs font-semibold text-primary">
              {expandedRecent ? 'Show Less' : `View All Administrations (${recentList.length})`}
            </Text>
            <ChevronRight size={16} color="#4A706A" />
          </TouchableOpacity>
        )}
      </Card>

      {/* 7. Action / Administration Modal */}
      <ResidentMarAdminModal
        actionItem={actionItem}
        onClose={() => setActionItem(null)}
        onConfirm={handleConfirmAction}
      />
    </View>
  );
}

import React, { useState, useEffect } from 'react';
import {
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import {
  X,
  Play,
  Power,
  CheckCircle2,
  Calendar,
  Clock,
  CalendarDays,
} from 'lucide-react-native';
import { Text } from '../ui/text';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Resident } from '../../domain/entities/Resident';
import { theme } from '../../theme';
import { useSheetBottomPadding } from '../../presentation/hooks/useSheetBottomPadding';
import { ShiftTodayView } from './ShiftTodayView';
import { WeeklyShiftList } from './WeeklyShiftList';

export interface HandoverPersonInfo {
  id?: string;
  name: string;
  role: string;
  shiftHours: string;
  avatarUrl?: string | null;
}

export interface ShiftDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  initialTab?: 'today' | 'weekly';
  shiftName?: string;
  wardName?: string;
  isShiftStarted: boolean;
  isCompleted?: boolean;
  isContinuing?: boolean;
  scheduledStartTime?: string;
  actualStartedTime?: string | null;
  scheduledEndTime?: string;
  timeRemainingStr?: string;
  nextShiftName?: string | null;
  nextShiftStartTime?: string | null;
  nextShiftHandoverPerson?: HandoverPersonInfo | null;
  incidentCount?: number;
  assignedResidents?: Resident[];
  completedTasks?: number;
  totalTasks?: number;
  shiftInstructions?: string | null;
  handoverNoteSnippet?: string | null;
  isEligible?: boolean;
  clockInOpensAt?: string;
  onStartShift?: () => void;
  onEndShift?: () => void;
  onEnterHandoverNote?: () => void;
}

export function ShiftDetailsModal({
  visible,
  onClose,
  initialTab = 'today',
  shiftName = 'Shift',
  wardName = '',
  isShiftStarted,
  isCompleted = false,
  isContinuing = false,
  scheduledStartTime = '',
  actualStartedTime = null,
  scheduledEndTime = '',
  timeRemainingStr = '',
  nextShiftName,
  nextShiftStartTime,
  nextShiftHandoverPerson,
  incidentCount = 0,
  assignedResidents = [],
  completedTasks = 0,
  totalTasks = 0,
  shiftInstructions,
  handoverNoteSnippet,
  isEligible,
  clockInOpensAt,
  onStartShift,
  onEndShift,
  onEnterHandoverNote,
}: ShiftDetailsModalProps) {
  const footerBottomPadding = useSheetBottomPadding(16);
  const [activeTab, setActiveTab] = useState<'today' | 'weekly'>(initialTab);

  const hasTodayShift = Boolean(scheduledStartTime || isShiftStarted || isCompleted);

  useEffect(() => {
    if (visible) {
      setActiveTab(initialTab);
    }
    if (Platform.OS === 'android') {
      RNStatusBar.setBarStyle('dark-content', true);
    }
  }, [visible, initialTab]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        {/* Backdrop press to dismiss */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        {/* Modal Bottom Sheet Content */}
        <View className="bg-white rounded-t-3xl overflow-hidden flex-col" style={{ height: '88%', width: '100%' }}>
          <View className="w-10 h-1 bg-[#D1DDD9] rounded-full self-center mt-2.5 mb-1" />

          {/* Fixed Modal Header */}
          <View className="flex-row justify-between items-center px-5 py-2.5 border-b border-border/50">
            <View className="flex-1 mr-2.5">
              <View className="flex-row items-center gap-2">
                <Text className="text-lg font-bold text-foreground">
                  {activeTab === 'today' ? shiftName : 'Weekly Shift Rota'}
                </Text>
                {activeTab === 'today' && hasTodayShift && (
                  <Badge
                    variant={
                      isCompleted
                        ? 'clinicalSafe'
                        : isShiftStarted && isContinuing
                          ? 'clinicalWarning'
                          : isShiftStarted
                            ? 'clinicalSafe'
                            : 'outline'
                    }
                    size="sm"
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        isCompleted || (isShiftStarted && !isContinuing)
                          ? 'text-clinical-safe'
                          : isShiftStarted && isContinuing
                            ? 'text-clinical-warning'
                            : 'text-muted-foreground'
                      }`}
                    >
                      {isCompleted
                        ? 'Completed'
                        : isShiftStarted && isContinuing
                          ? 'Continuing'
                          : isShiftStarted
                            ? 'Active Shift'
                            : 'Scheduled'}
                    </Text>
                  </Badge>
                )}
              </View>
              <Text className="text-xs text-muted-foreground mt-0.5">
                {activeTab === 'today' ? `${wardName ? `${wardName} • ` : ''}CQC Duty Rota` : 'Staff Scheduled Shifts'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} className="w-9 h-9 rounded-full bg-surface items-center justify-center">
              <X size={18} color={theme.colors.muted.foreground} />
            </TouchableOpacity>
          </View>

          {/* Segmented Tab Bar (Matches App Pill Segmented Control) */}
          <View className="flex-row bg-surface p-1 rounded-full mx-4 mt-2.5 mb-1">
            <TouchableOpacity
              onPress={() => setActiveTab('today')}
              activeOpacity={0.8}
              className={`flex-1 py-2 items-center rounded-full flex-row justify-center gap-1.5 ${
                activeTab === 'today' ? 'bg-primary' : ''
              }`}
            >
              <Clock size={14} color={activeTab === 'today' ? '#FFFFFF' : theme.colors.muted.foreground} />
              <Text
                className={`text-xs font-bold ${
                  activeTab === 'today' ? 'text-white' : 'text-muted-foreground'
                }`}
              >
                Today&apos;s Shift
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('weekly')}
              activeOpacity={0.8}
              className={`flex-1 py-2 items-center rounded-full flex-row justify-center gap-1.5 ${
                activeTab === 'weekly' ? 'bg-primary' : ''
              }`}
            >
              <CalendarDays size={14} color={activeTab === 'weekly' ? '#FFFFFF' : theme.colors.muted.foreground} />
              <Text
                className={`text-xs font-bold ${
                  activeTab === 'weekly' ? 'text-white' : 'text-muted-foreground'
                }`}
              >
                Weekly Rota
              </Text>
            </TouchableOpacity>
          </View>

          {/* Scrollable Modal Content */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
            bounces={true}
          >
            {activeTab === 'today' ? (
              hasTodayShift ? (
                <ShiftTodayView
                  scheduledStartTime={scheduledStartTime}
                  actualStartedTime={actualStartedTime}
                  scheduledEndTime={scheduledEndTime}
                  timeRemainingStr={timeRemainingStr}
                  isShiftStarted={isShiftStarted}
                  isCompleted={isCompleted}
                  isContinuing={isContinuing}
                  nextShiftName={nextShiftName}
                  nextShiftStartTime={nextShiftStartTime}
                  nextShiftHandoverPerson={nextShiftHandoverPerson}
                  incidentCount={incidentCount}
                  assignedResidents={assignedResidents}
                  completedTasks={completedTasks}
                  totalTasks={totalTasks}
                  shiftInstructions={shiftInstructions}
                  handoverNoteSnippet={handoverNoteSnippet}
                  onViewWeeklyRota={() => setActiveTab('weekly')}
                  onEnterHandoverNote={() => {
                    onClose();
                    if (onEnterHandoverNote) onEnterHandoverNote();
                  }}
                />
              ) : (
                <View className="py-10 px-4 items-center justify-center">
                  <View className="w-14 h-14 rounded-full bg-surface items-center justify-center mb-3">
                    <Calendar size={28} color={theme.colors.primary.DEFAULT} />
                  </View>
                  <Text className="text-base font-bold text-foreground text-center mb-1">
                    No Shift Scheduled for Today
                  </Text>
                  <Text className="text-xs text-muted-foreground text-center mb-5 leading-5 max-w-[280px]">
                    You do not currently have a shift assigned for today. You can view your full weekly rota or contact your manager.
                  </Text>
                  <Button variant="default" size="default" onPress={() => setActiveTab('weekly')}>
                    View Weekly Rota
                  </Button>
                </View>
              )
            ) : (
              <WeeklyShiftList
                onSelectShift={(selected) => {
                  if (hasTodayShift) {
                    setActiveTab('today');
                  }
                }}
              />
            )}
          </ScrollView>

          {/* Fixed Pinned Footer Shift Actions */}
          <View
            className="flex-row gap-2.5 px-4 pt-3 border-t border-border/40 bg-white"
            style={{ paddingBottom: footerBottomPadding }}
          >
            {activeTab === 'today' ? (
              !hasTodayShift ? (
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1"
                  onPress={() => setActiveTab('weekly')}
                >
                  View Weekly Rota
                </Button>
              ) : isCompleted ? (
                <View className="flex-1 flex-row items-center justify-center bg-[#EBF7EE] rounded-lg py-2.5 px-3 border border-[#BDE8C6]">
                  <CheckCircle2 size={16} color="#1D5E2E" />
                  <Text className="text-sm font-semibold text-[#1D5E2E] ml-1.5">Shift Completed</Text>
                </View>
              ) : !isShiftStarted ? (
                isEligible === false ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled
                    className="flex-1 opacity-60 bg-slate-100"
                    leftIcon={<Play size={16} color="#94A3B8" />}
                  >
                    {clockInOpensAt ? `Opens at ${clockInOpensAt}` : 'Not Eligible Yet'}
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    leftIcon={<Play size={16} color="#FFFFFF" fill="#FFFFFF" />}
                    onPress={() => {
                      onClose();
                      if (onStartShift) onStartShift();
                    }}
                  >
                    Start Shift Now
                  </Button>
                )
              ) : (
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  leftIcon={<Power size={16} color="#FFFFFF" />}
                  onPress={() => {
                    onClose();
                    if (onEndShift) onEndShift();
                  }}
                >
                  End Shift
                </Button>
              )
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onPress={() => setActiveTab('today')}
              >
                Today&apos;s Shift
              </Button>
            )}

            <Button variant="secondary" size="sm" onPress={onClose}>
              Close
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

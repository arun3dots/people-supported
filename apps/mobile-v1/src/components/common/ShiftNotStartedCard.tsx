import React from 'react';
import { View } from 'react-native';
import { Clock, Play } from 'lucide-react-native';
import { Card } from '../ui/card';
import { Text } from '../ui/text';
import { Button } from '../ui/button';
import { theme } from '../../theme';
import { ShiftInfo } from '../../presentation/hooks/shiftDashboard.utils';
import { useClockInEligibility } from '../../presentation/hooks/useClockInEligibility';

export interface ShiftNotStartedCardProps {
  title?: string;
  description: string;
  shift?: ShiftInfo | null;
  eligibility: ReturnType<typeof useClockInEligibility>;
  onStartShift?: () => Promise<void> | void;
  onReturnHome?: () => void;
  secondaryAction?: React.ReactNode;
}

export function ShiftNotStartedCard({
  title = 'Shift Not Started',
  description,
  shift,
  eligibility,
  onStartShift,
  onReturnHome,
  secondaryAction,
}: ShiftNotStartedCardProps) {
  return (
    <View className="items-center justify-center pt-8 pb-12 px-2">
      <Card className="w-full p-6 items-center text-center">
        <View className="h-16 w-16 rounded-full bg-white items-center justify-center mb-4 border border-slate-100">
          <Clock size={32} color={theme.colors.primary.DEFAULT} />
        </View>

        <Text className="text-lg font-bold text-foreground text-center mb-1.5">
          {title}
        </Text>

        <Text className="text-xs text-muted-foreground text-center leading-5 mb-5 max-w-[280px]">
          {description}
        </Text>

        {shift ? (
          <Button
            variant={eligibility.isEligible ? 'default' : 'secondary'}
            size="default"
            disabled={!eligibility.isEligible}
            className={`w-full mb-2.5 ${
              eligibility.isEligible ? '' : 'opacity-60 bg-slate-200'
            }`}
            leftIcon={
              <Play
                size={16}
                color={eligibility.isEligible ? '#FFFFFF' : '#64748B'}
                fill={eligibility.isEligible ? '#FFFFFF' : '#64748B'}
              />
            }
            onPress={async () => {
              if (eligibility.isEligible && onStartShift) {
                await onStartShift();
              }
            }}
          >
            {eligibility.isEligible
              ? `Start Shift (${shift.name || 'Shift'})`
              : eligibility.reason === 'invalid_schedule' ? 'Schedule unavailable' : `Clock-in opens at ${eligibility.eligibleAtStr || 'scheduled time'}`}
          </Button>
        ) : null}

        {secondaryAction}

        {onReturnHome ? (
          <Button variant="ghost" size="sm" onPress={onReturnHome}>
            Return to Dashboard
          </Button>
        ) : null}
      </Card>
    </View>
  );
}


import * as React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Droplet, Plus } from 'lucide-react-native';
import { Text } from '../ui/text';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { BEVERAGE_PRESETS, BeveragePreset } from '../../domain/clinical/fluid-balance';
import { theme } from '../../theme';

export interface FluidBalanceGaugeProps {
  currentIntakeMl: number;
  targetMl?: number;
  onAddBeverage: (preset: BeveragePreset) => void;
  className?: string;
}

export function FluidBalanceGauge({
  currentIntakeMl,
  targetMl,
  onAddBeverage,
  className,
}: FluidBalanceGaugeProps) {
  const percentage = targetMl && targetMl > 0 ? Math.min(Math.round((currentIntakeMl / targetMl) * 100), 100) : null;
  const isLow = percentage !== null && percentage < 40;

  return (
    <Card className={`${className || ''} mb-4`} >
      <CardHeader className="pb-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Droplet size={20} color="#3294FF" />
            <CardTitle className="text-base font-bold text-foreground">24h Fluid Balance</CardTitle>
          </View>
          <Badge variant={isLow ? 'warning' : 'info'} size="sm">
            {percentage === null ? 'Target not recorded' : `${percentage}% Target Met`}
          </Badge>
        </View>
        <Text className="text-xs text-muted-foreground">
          {currentIntakeMl} ml logged{percentage === null ? ' ? Clinical target not recorded' : ` of ${targetMl} ml clinical target`}
        </Text>
      </CardHeader>

      <CardContent className="space-y-3">
        {percentage !== null && <Progress value={percentage} indicatorClassName="bg-[#3294FF]" className="h-3" />}

        {isLow && (
          <View className="rounded-md bg-[#FDFBE9] px-2.5 py-1 border border-[#C38C0B]/30">
            <Text className="text-xs font-semibold text-[#C38C0B]">
              DEHYDRATION NOTICE: Prompt person supported with preferred fluids.
            </Text>
          </View>
        )}

        <View className="pt-1">
          <Text className="text-xs font-semibold text-muted-foreground mb-2">
            QUICK POINT-OF-CARE LOGGING
          </Text>
          <View className="flex-row gap-2">
            {BEVERAGE_PRESETS.slice(0, 3).map((preset) => (
              <TouchableOpacity
                key={preset.id}
                onPress={() => onAddBeverage(preset)}
                activeOpacity={0.7}
                className="flex-1 flex-col items-center justify-center rounded-md bg-secondary p-2.5 border border-border"
              >
                <Plus size={14} color={theme.colors.primary.DEFAULT} />
                <Text className="text-xs font-bold text-foreground mt-0.5">+{preset.amountMl}ml</Text>
                <Text className="text-[10px] text-muted-foreground text-center" numberOfLines={1}>
                  {preset.label.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </CardContent>
    </Card>
  );
}

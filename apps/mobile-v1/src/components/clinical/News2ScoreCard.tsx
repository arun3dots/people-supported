import * as React from 'react';
import { View } from 'react-native';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react-native';
import { Text } from '../ui/text';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { News2Result } from '../../domain/clinical/news2';

export interface News2ScoreCardProps {
  result: News2Result;
  residentName?: string;
  className?: string;
}

export function News2ScoreCard({ result, residentName, className }: News2ScoreCardProps) {
  const isHigh = result.riskLevel === 'High';
  const isMed = result.riskLevel === 'Medium';

  const riskBg = isHigh ? 'bg-clinical-criticalBg' : isMed ? 'bg-clinical-warningBg' : 'bg-clinical-safeBg';
  const riskTextColor = isHigh ? 'text-clinical-critical' : isMed ? 'text-clinical-warning' : 'text-clinical-safe';
  const scoreBadgeBg = isHigh ? 'bg-clinical-critical' : isMed ? 'bg-clinical-warning' : 'bg-clinical-safe';

  return (
    <Card className={`${riskBg} ${className || ''}`}>
      <CardHeader className="pb-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            {isHigh ? (
              <AlertCircle size={22} color="#FF3B2F" />
            ) : isMed ? (
              <AlertTriangle size={22} color="#C38C0B" />
            ) : (
              <CheckCircle2 size={22} color="#1D5E2E" />
            )}
            <View>
              <CardTitle className={`text-lg font-bold ${riskTextColor}`}>
                NEWS2: {result.totalScore} ({result.riskLevel} Risk)
              </CardTitle>
              {residentName && (
                <Text className="text-xs text-muted-foreground">{residentName}</Text>
              )}
            </View>
          </View>
          <View className={`rounded-full px-3.5 py-1 items-center justify-center ${scoreBadgeBg}`}>
            <Text className="text-white text-md font-bold">{result.totalScore}</Text>
          </View>
        </View>
      </CardHeader>

      <CardContent className="gap-3">
        {result.hasRedScore && (
          <View className="rounded-xl bg-white/80 px-3 py-2">
            <Text className="text-xs font-bold text-clinical-critical">
              RED SCORE ALERT: Individual parameter score ≥ 3 detected.
            </Text>
          </View>
        )}

        {/* Clinical Action Guideline */}
        <View className="rounded-xl bg-white p-3">
          <Text className="text-xs font-semibold text-muted-foreground mb-1">
            RCP CLINICAL PROTOCOL
          </Text>
          <Text className="text-xs font-medium text-foreground leading-4">
            {result.clinicalAction}
          </Text>
        </View>

        {/* Vitals Breakdown Grid */}
        <View className="flex-row flex-wrap gap-1.5 pt-1">
          <BreakdownChip label="Resp" score={result.breakdown.respirationScore} />
          <BreakdownChip label="SpO2" score={result.breakdown.spo2Score} />
          <BreakdownChip label="Air/O2" score={result.breakdown.airOrOxygenScore} />
          <BreakdownChip label="BP" score={result.breakdown.systolicBpScore} />
          <BreakdownChip label="Pulse" score={result.breakdown.pulseScore} />
          <BreakdownChip label="ACVPU" score={result.breakdown.consciousnessScore} />
          <BreakdownChip label="Temp" score={result.breakdown.temperatureScore} />
        </View>
      </CardContent>
    </Card>
  );
}

function BreakdownChip({ label, score }: { label: string; score: number }) {
  const chipBg = score === 3 ? 'bg-clinical-critical text-white' : score >= 1 ? 'bg-clinical-warning text-white' : 'bg-surface text-foreground';
  return (
    <View className="flex-row items-center rounded-full bg-white px-2.5 py-1">
      <Text className="text-xs font-medium text-muted-foreground mr-1">{label}:</Text>
      <Text className={`text-xs font-bold px-1.5 rounded-full ${chipBg}`}>{score}</Text>
    </View>
  );
}

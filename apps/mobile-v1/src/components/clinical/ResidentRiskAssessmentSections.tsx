import React, { useState, useMemo } from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, AlertTriangle, CheckCircle2, Clock, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react-native';
import { GET_RISK_ASSESSMENTS } from '@repo/endpoints';
import { makeMobileApiCall } from '../../data/api/client';
import { Text, Card, Badge } from '../../presentation/components/common';
import { formatUkDate } from '../../lib/date';

export interface RiskControlItem {
  id: string;
  controlMeasure: string;
  responsibleRole?: string | null;
  status?: string;
}

export interface RiskAssessmentItem {
  id: string;
  title: string;
  category: string;
  level: 'Low' | 'Medium' | 'High' | 'Extreme';
  status: 'Draft' | 'PendingReview' | 'Active' | 'Archived';
  score?: number;
  likelihood?: number;
  impact?: number;
  hazard?: string | null;
  peopleAtRisk?: string | null;
  nextReviewDate?: string | null;
  updatedAt?: string | null;
  controls?: RiskControlItem[];
}

interface Props {
  residentId: string;
}

export function ResidentRiskAssessmentSections({ residentId }: Props) {
  const [activeFilter, setActiveFilter] = useState<'All' | 'High' | 'Active'>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: rawData = [], isLoading, error, refetch } = useQuery<RiskAssessmentItem[]>({
    queryKey: ['resident-risk-assessments', residentId],
    queryFn: async (): Promise<RiskAssessmentItem[]> => {
      const res = await makeMobileApiCall<
        { data?: RiskAssessmentItem[] } | RiskAssessmentItem[]
      >(GET_RISK_ASSESSMENTS, undefined, { residentId });
      const list = Array.isArray(res) ? res : res?.data || [];
      return list as RiskAssessmentItem[];
    },
    enabled: Boolean(residentId),
    staleTime: 1000 * 60 * 3,
  });

  const assessments = useMemo(() => {
    return rawData.filter((item) => {
      if (activeFilter === 'High') {
        return item.level === 'High' || item.level === 'Extreme';
      }
      if (activeFilter === 'Active') {
        return item.status === 'Active';
      }
      return true;
    });
  }, [rawData, activeFilter]);

  const highRiskCount = rawData.filter(
    (a) => a.level === 'High' || a.level === 'Extreme'
  ).length;
  const activeCount = rawData.filter((a) => a.status === 'Active').length;

  const getLevelBadge = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'extreme':
        return { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Extreme Risk' };
      case 'high':
        return { bg: 'bg-clinical-criticalBg', text: 'text-clinical-critical', label: 'High Risk' };
      case 'medium':
        return { bg: 'bg-clinical-warningBg', text: 'text-clinical-warning', label: 'Medium Risk' };
      case 'low':
      default:
        return { bg: 'bg-clinical-safeBg', text: 'text-clinical-safe', label: 'Low Risk' };
    }
  };

  if (isLoading) {
    return (
      <View className="items-center justify-center py-16">
        <ActivityIndicator size="large" color="#4A706A" />
        <Text className="text-xs text-text-secondary mt-3 font-medium">Loading risk assessments...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <Card className="p-6 items-center justify-center my-4">
        <AlertTriangle size={32} color="#FF3B2F" />
        <Text className="text-sm font-bold text-text-primary mt-2">Failed to load risk assessments</Text>
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
      {/* 1. Metric Overview Cards */}
      <View className="flex-row gap-2.5 mb-4">
        <Card className="flex-1 p-3.5">
          <Text className="text-xs font-semibold text-text-muted">Total Assessed</Text>
          <Text className="text-xl font-bold text-text-primary mt-1">{rawData.length}</Text>
        </Card>

        <Card className="flex-1 p-3.5">
          <Text className="text-xs font-semibold text-clinical-safe">Active</Text>
          <Text className="text-xl font-bold text-clinical-safe mt-1">{activeCount}</Text>
        </Card>

        <Card className="flex-1 p-3.5">
          <Text className="text-xs font-semibold text-clinical-critical">High / Extreme</Text>
          <Text className="text-xl font-bold text-clinical-critical mt-1">{highRiskCount}</Text>
        </Card>
      </View>

      {/* 2. Filter Pills */}
      <View className="flex-row gap-2 mb-4">
        {([
          { key: 'All', label: `All (${rawData.length})` },
          { key: 'Active', label: `Active (${activeCount})` },
          { key: 'High', label: `High Risk (${highRiskCount})` },
        ] as const).map((pill) => {
          const isActive = activeFilter === pill.key;
          return (
            <TouchableOpacity
              key={pill.key}
              onPress={() => setActiveFilter(pill.key)}
              className={`px-3.5 py-1.5 rounded-full ${isActive ? 'bg-primary' : 'bg-surface'}`}
            >
              <Text className={`text-xs font-bold ${isActive ? 'text-white' : 'text-text-secondary'}`}>
                {pill.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 3. Assessment List */}
      {assessments.length === 0 ? (
        <Card className="p-8 items-center justify-center">
          <ShieldCheck size={36} color="#64748B" />
          <Text className="text-base font-bold text-text-primary mt-2">No Risk Assessments Found</Text>
          <Text className="text-xs text-text-secondary mt-1 text-center max-w-[260px]">
            No clinical risk assessments match the selected filter.
          </Text>
        </Card>
      ) : (
        assessments.map((item) => {
          const levelBadge = getLevelBadge(item.level);
          const isExpanded = expandedId === item.id;
          const controls = item.controls || [];

          return (
            <Card key={item.id} className="mb-3 p-4">
              {/* Header: Title & Badges */}
              <TouchableOpacity
                onPress={() => setExpandedId(isExpanded ? null : item.id)}
                activeOpacity={0.7}
              >
                <View className="flex-row items-start justify-between gap-2">
                  <View className="flex-1">
                    <Text className="text-base font-bold text-text-primary leading-snug">
                      {item.title}
                    </Text>
                    <Text className="text-xs text-text-secondary mt-0.5">
                      Category: {item.category || 'General Clinical'}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1.5">
                    <View className={`px-2.5 py-1 rounded-full ${levelBadge.bg}`}>
                      <Text className={`text-xs font-bold ${levelBadge.text}`}>
                        {levelBadge.label}
                      </Text>
                    </View>
                    {isExpanded ? (
                      <ChevronUp size={16} color="#64748B" />
                    ) : (
                      <ChevronDown size={16} color="#64748B" />
                    )}
                  </View>
                </View>

                {/* Score & Next Review */}
                <View className="flex-row items-center justify-between mt-3 pt-2.5 border-t border-slate-200/70">
                  <View className="flex-row items-center gap-1.5">
                    <Clock size={13} color="#64748B" />
                    <Text className="text-xs text-text-secondary">
                      Next Review: {formatUkDate(item.nextReviewDate) || 'Not scheduled'}
                    </Text>
                  </View>
                  {typeof item.score === 'number' ? (
                    <Text className="text-xs font-bold text-text-primary">
                      Score: {item.score}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>

              {/* Expanded Details: Hazard & Controls */}
              {isExpanded && (
                <View className="mt-3 pt-3 border-t border-slate-200/70 space-y-2.5">
                  {item.hazard ? (
                    <View className="mb-2">
                      <Text className="text-xs font-bold text-text-primary">Identified Hazard</Text>
                      <Text className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                        {item.hazard}
                      </Text>
                    </View>
                  ) : null}

                  {item.peopleAtRisk ? (
                    <View className="mb-2">
                      <Text className="text-xs font-bold text-text-primary">People At Risk</Text>
                      <Text className="text-xs text-text-secondary mt-0.5">
                        {item.peopleAtRisk}
                      </Text>
                    </View>
                  ) : null}

                  {controls.length > 0 ? (
                    <View>
                      <Text className="text-xs font-bold text-text-primary mb-1.5">
                        Control Measures & Mitigations ({controls.length})
                      </Text>
                      {controls.map((c, idx) => (
                        <View
                          key={c.id || idx}
                          className="flex-row items-start gap-2 bg-white p-3 rounded-xl mb-1.5"
                        >
                          <CheckCircle2 size={14} color="#4A706A" className="mt-0.5 shrink-0" />
                          <View className="flex-1">
                            <Text className="text-xs text-text-primary font-medium">
                              {c.controlMeasure}
                            </Text>
                            {c.responsibleRole ? (
                              <Text className="text-xs text-text-muted mt-0.5">
                                Assigned: {c.responsibleRole}
                              </Text>
                            ) : null}
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text className="text-xs text-text-muted italic">
                      No specific controls documented.
                    </Text>
                  )}
                </View>
              )}
            </Card>
          );
        })
      )}
    </View>
  );
}

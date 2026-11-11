import React from 'react';
import { View, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { TriangleAlert, ChevronRight, ArrowRight } from 'lucide-react-native';
import { Text } from '../ui/text';
import { Button } from '../ui/button';
import { theme } from '../../theme';

export interface AlertItem {
  id: string;
  title: string;
  description: string;
  priority?: 'High' | 'Medium' | 'Low';
  priorityLabel?: string;
  timestamp?: string;
  isDismissed?: boolean;
}

export interface AlertCardProps {
  alerts: AlertItem[];
  onDismissAlert?: (id: string) => void;
  onSeeAllAlerts?: () => void;
  onPressAlert?: (alert: AlertItem) => void;
  style?: StyleProp<ViewStyle>;
}

export function AlertCard({
  alerts,
  onSeeAllAlerts,
  onPressAlert,
  style,
}: AlertCardProps) {
  const visibleAlerts = alerts.filter((a) => !a.isDismissed);

  if (visibleAlerts.length === 0) return null;

  // Primary alert to highlight on the home screen
  const primaryAlert = visibleAlerts[0];
  const priorityLabel = primaryAlert.priorityLabel || (primaryAlert.priority ? `${primaryAlert.priority} Priority` : 'High Priority');
  const alertTitle = primaryAlert.title || 'Overdue Care Tasks';
  const alertDescription =
    primaryAlert.description ||
    'Please complete them to stay on track and ensure support safety';

  return (
    <View style={[styles.wrapper, style]}>
      {/* Section Header */}
      <View style={styles.header}>
        <View style={styles.headerTextGroup}>
          <Text className="text-lg font-bold text-foreground">
            Critical Alerts
          </Text>
          <Text className="text-xs text-muted-foreground mt-0.5">
            Alerts that require immediate clinical action.
          </Text>
        </View>

        {onSeeAllAlerts && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2.5"
            rightIcon={<ArrowRight size={13} color={theme.colors.primary.DEFAULT} strokeWidth={2.4} />}
            onPress={onSeeAllAlerts}
          >
            See All Alerts
          </Button>
        )}
      </View>

      {/* Main Alert Card */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => (onPressAlert ? onPressAlert(primaryAlert) : onSeeAllAlerts?.())}
        style={styles.alertCard}
      >
        {/* Left Alert Icon Badge */}
        <View style={styles.iconBadge}>
          <TriangleAlert size={20} color="#FF3B2F" strokeWidth={2.2} />
        </View>

        {/* Center Alert Details */}
        <View style={styles.contentColumn}>
          {/* Priority Pill */}
          <View style={styles.priorityPill}>
            <Text className="text-xs font-bold text-clinical-critical">
              {priorityLabel}
            </Text>
          </View>

          {/* Title */}
          <Text className="text-md font-bold text-foreground" numberOfLines={1}>
            {alertTitle}
          </Text>

          {/* Description */}
          <Text className="text-xs text-muted-foreground" numberOfLines={2}>
            {alertDescription}
          </Text>
        </View>

        {/* Right Chevron */}
        <View style={styles.chevronWrapper}>
          <ChevronRight size={20} color={theme.colors.primary.DEFAULT} strokeWidth={2.5} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 4,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  headerTextGroup: {
    flex: 1,
    paddingRight: 8,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFACA6',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF2F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentColumn: {
    flex: 1,
    gap: 2,
  },
  priorityPill: {
    backgroundColor: '#FFF2F1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  chevronWrapper: {
    paddingLeft: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

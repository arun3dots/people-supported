import React from 'react';
import { View, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { AlertTriangle, Activity, ClipboardCheck, Pill } from 'lucide-react-native';
import { Text } from '../ui/text';
import { theme } from '../../theme';

export type QuickAccessAction = 'incident' | 'observation' | 'handover' | 'mar';

export interface QuickAccessCardProps {
  onPressItem?: (action: QuickAccessAction) => void;
  style?: StyleProp<ViewStyle>;
  isShiftActive?: boolean;
}

interface ActionItemConfig {
  id: QuickAccessAction;
  titleTop: string;
  titleBottom?: string;
  renderIcon: (color: string) => React.ReactNode;
}

const ACTION_ITEMS: ActionItemConfig[] = [
  {
    id: 'incident',
    titleTop: 'Report',
    titleBottom: 'Incident',
    // BUG-024: Matches web carer sidebar AlertTriangle icon
    renderIcon: (color) => <AlertTriangle size={24} color={color} strokeWidth={2.2} />,
  },
  {
    id: 'observation',
    titleTop: 'Record',
    titleBottom: 'Observation',
    renderIcon: (color) => <Activity size={24} color={color} strokeWidth={2.2} />,
  },
  {
    id: 'handover',
    // BUG-026: Matches web carer sidebar label "Handover"
    titleTop: 'Handover',
    // BUG-025: Matches web carer sidebar ClipboardCheck icon
    renderIcon: (color) => <ClipboardCheck size={24} color={color} strokeWidth={2.2} />,
  },
  {
    id: 'mar',
    titleTop: 'Log',
    titleBottom: 'MAR',
    renderIcon: (color) => <Pill size={24} color={color} strokeWidth={2.2} />,
  },
];

export function QuickAccessCard({ onPressItem, style, isShiftActive }: QuickAccessCardProps) {
  const iconColor = theme.colors.primary.DEFAULT;

  return (
    <View style={[styles.container, style]}>
      {/* Header Info */}
      <View style={styles.headerSection}>
        <Text className="text-lg font-bold text-white">
          Quick Access
        </Text>
        <Text className="text-xs text-white/70 mt-0.5">
          Everything you need for your shift, within reach.
        </Text>
      </View>

      {/* 4 Action Buttons in a Row */}
      <View style={styles.actionsRow}>
        {ACTION_ITEMS.map((item) => {
          const isItemInactive = item.id !== 'incident' && isShiftActive === false;
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              onPress={() => {
                onPressItem?.(item.id);
              }}
              style={[styles.actionTile, isItemInactive && { opacity: 0.65 }]}
              accessibilityRole="button"
              accessibilityLabel={item.titleBottom ? `${item.titleTop} ${item.titleBottom}` : item.titleTop}
            >
              <View pointerEvents="none" style={styles.tileInner}>
                <View style={styles.iconContainer}>{item.renderIcon(iconColor)}</View>
                <Text className="text-xs font-semibold text-foreground text-center leading-4">
                  {item.titleTop}
                  {item.titleBottom ? `\n${item.titleBottom}` : ''}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tileInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  container: {
    backgroundColor: theme.colors.primary.DEFAULT,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginVertical: 4,
    width: '100%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  headerSection: {
    marginBottom: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: 6,
  },
  actionTile: {
    flex: 1,
    height: 86,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
});

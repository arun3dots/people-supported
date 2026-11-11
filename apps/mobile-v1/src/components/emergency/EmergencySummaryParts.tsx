import React from 'react';
import { View, TouchableOpacity, Linking } from 'react-native';
import { Phone } from 'lucide-react-native';
import { Card, Text } from '../../presentation/components/common';

export function SummarySection({
  title,
  tone = 'default',
  children,
}: {
  title: string;
  tone?: 'default' | 'danger';
  children: React.ReactNode;
}) {
  const danger = tone === 'danger';
  return (
    <Card className={`mb-3 ${danger ? 'bg-clinical-criticalBg' : ''}`}>
      <Text
        className={`text-xs font-bold uppercase tracking-wide mb-2 ${
          danger ? 'text-clinical-critical' : 'text-text-secondary'
        }`}
      >
        {title}
      </Text>
      {children}
    </Card>
  );
}

export function SummaryField({ label, value }: { label: string; value?: string | null }) {
  return (
    <View className="mb-2">
      <Text className="text-xs font-semibold text-text-muted">{label}</Text>
      <Text className="text-base font-medium text-text-primary mt-0.5">{value || 'Not recorded'}</Text>
    </View>
  );
}

export function TagList({
  items,
  emptyText,
  tone = 'default',
}: {
  items: string[];
  emptyText: string;
  tone?: 'default' | 'danger';
}) {
  if (items.length === 0) {
    return <Text className="text-sm text-text-secondary">{emptyText}</Text>;
  }
  const danger = tone === 'danger';
  return (
    <View className="flex-row flex-wrap gap-1.5">
      {items.map((item) => (
        <View
          key={item}
          className={`rounded-full px-3 py-1 ${
            danger ? 'bg-white' : 'bg-white'
          }`}
        >
          <Text
            className={`text-xs font-semibold ${danger ? 'text-clinical-critical' : 'text-text-primary'}`}
          >
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

// Dialling is the only action on this screen; no clinical data can be changed.
export function CallRow({
  name,
  detail,
  phone,
}: {
  name: string;
  detail?: string | null;
  phone: string | null;
}) {
  return (
    <View className="flex-row items-center justify-between py-2.5 px-3 mb-2 bg-white rounded-xl">
      <View className="flex-1 mr-3">
        <Text className="text-base font-semibold text-text-primary">{name}</Text>
        {detail ? <Text className="text-xs text-text-secondary">{detail}</Text> : null}
        {phone ? <Text className="text-sm font-medium text-primary mt-0.5">{phone}</Text> : null}
      </View>
      {phone ? (
        <TouchableOpacity
          onPress={() => void Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`)}
          accessibilityRole="button"
          accessibilityLabel={`Call ${name}`}
          className="h-10 w-10 rounded-full bg-primary items-center justify-center"
        >
          <Phone size={18} color="#FFFFFF" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

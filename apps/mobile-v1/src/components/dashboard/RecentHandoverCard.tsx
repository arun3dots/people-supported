import React from 'react';
import { View, TouchableOpacity, type StyleProp, type ViewStyle } from 'react-native';
import { FileText, ChevronRight, LockKeyhole } from 'lucide-react-native';
import { Avatar, Card, Text } from '../../presentation/components/common';
import { theme } from '../../theme';

export interface HandoverNoteData {
  id?: string;
  authorName: string;
  authorRole?: string;
  authorShift?: string;
  authorAvatarUrl?: string | null;
  content: string;
}

export interface RecentHandoverCardProps {
  note?: HandoverNoteData | null;
  residents?: Array<{ id: string; fullName: string }>;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function resolveHandoverResidentNames(
  content: string,
  residents?: Array<{ id: string; fullName: string }>,
): string {
  let resolved = content;
  for (const resident of residents ?? []) {
    if (resident.id && resident.fullName) {
      resolved = resolved.split(resident.id).join(resident.fullName);
    }
  }
  return resolved.split('[Resident: ').join('[Person Supported: ');
}

export function RecentHandoverCard({ note, residents, onPress, style }: RecentHandoverCardProps) {
  return (
    <View className="my-1 w-full" style={style}>
      <Text className="text-lg font-bold text-foreground">Recent Handover Notes</Text>
      <Text className="text-md text-muted-foreground mt-1 mb-3">
        Updates from the previous care team
      </Text>
      <TouchableOpacity
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="View handover notes from previous carers"
      >
        <Card className="bg-card-subtle border-0 rounded-2xl p-4">
          {note ? (
            <>
              <View className="flex-row items-center gap-3">
                <Avatar
                  name={note.authorName}
                  imageUrl={note.authorAvatarUrl ?? undefined}
                  size="lg"
                />
                <View className="flex-1">
                  <Text className="text-base font-bold text-foreground">
                    Handover by {note.authorName}
                  </Text>
                  <Text className="text-md text-muted-foreground mt-1">{note.authorRole}</Text>
                  <Text className="text-md text-muted-foreground">{note.authorShift}</Text>
                </View>
              </View>
              <Text className="text-base leading-6 text-foreground mt-4" numberOfLines={3}>
                {resolveHandoverResidentNames(note.content, residents)}
              </Text>
            </>
          ) : (
            <View className="items-center py-3 gap-2">
              <FileText size={24} color={theme.colors.primary.DEFAULT} />
              <Text className="text-base font-bold text-foreground">
                No Previous Handover Notes
              </Text>
              <Text className="text-md text-muted-foreground text-center">
                Notes from completed shifts will appear here when the previous team signs off.
              </Text>
            </View>
          )}
          <View className="flex-row items-center gap-2 mt-4 pt-3 border-t border-border-light">
            <LockKeyhole size={16} color={theme.colors.primary.DEFAULT} />
            <Text className="text-md font-semibold text-primary flex-1">
              View previous handovers
            </Text>
            <ChevronRight size={18} color={theme.colors.primary.DEFAULT} />
          </View>
        </Card>
      </TouchableOpacity>
    </View>
  );
}

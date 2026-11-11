import React from 'react';
import { View, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { FileText, ChevronRight } from 'lucide-react-native';
import { Avatar } from '../common/Avatar';
import { Text } from '../ui/text';
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

/**
 * Replaces any resident UUID occurrences in handover note text with the resident's actual full name (BUG-029).
 */
export function resolveHandoverResidentNames(
  content: string,
  residents?: Array<{ id: string; fullName: string }>
): string {
  if (!content) return '';
  if (!residents || residents.length === 0) return content;

  let resolved = content;
  for (const r of residents) {
    if (r.id && r.fullName) {
      resolved = resolved.split(`[Resident: ${r.id}]`).join(`[Person Supported: ${r.fullName}]`);
      resolved = resolved.split(`[Person Supported: ${r.id}]`).join(`[Person Supported: ${r.fullName}]`);
      resolved = resolved.split(r.id).join(r.fullName);
    }
  }
  return resolved.split('[Resident: ').join('[Person Supported: ');
}

export function RecentHandoverCard({
  note,
  residents,
  onPress,
  style,
}: RecentHandoverCardProps) {
  const CardWrapper = onPress ? TouchableOpacity : View;
  const displayContent = note ? resolveHandoverResidentNames(note.content, residents) : '';

  return (
    <View style={[styles.sectionWrapper, style]}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text className="text-lg font-bold text-[#141F1E]">Recent Handover Notes</Text>
        <Text className="text-xs text-[#5D5D5D] mt-0.5">
          Stay informed with the latest shift updates
        </Text>
      </View>

      {/* Main Card */}
      <CardWrapper
        style={styles.cardContainer}
        activeOpacity={onPress ? 0.85 : 1}
        onPress={onPress}
      >
        {note ? (
          <>
            {/* Top Header: Avatar + Staff Details */}
            <View style={styles.authorRow}>
              <Avatar
                name={note.authorName}
                imageUrl={note.authorAvatarUrl || undefined}
                size="lg"
                style={styles.avatar}
              />
              <View style={styles.authorTextCol}>
                <Text className="text-md font-bold text-foreground">
                  Handover by {note.authorName}
                </Text>
                {note.authorRole && (
                  <Text className="text-xs text-muted-foreground mt-0.5">
                    {note.authorRole}
                  </Text>
                )}
                {note.authorShift && (
                  <Text className="text-xs text-muted-foreground">
                    {note.authorShift}
                  </Text>
                )}
              </View>
            </View>

            {/* Note Content Paragraph */}
            <Text className="text-sm leading-5 text-foreground mt-3.5">
              {displayContent}
            </Text>
          </>
        ) : (
          <View className="py-2 items-center text-center">
            <View className="h-10 w-10 rounded-full bg-primary/10 items-center justify-center mb-2">
              <FileText size={20} color={theme.colors.primary.DEFAULT} />
            </View>
            <Text className="text-sm font-bold text-foreground mb-1">
              No Handover Notes Yet
            </Text>
            <Text className="text-xs text-muted-foreground text-center mb-2">
              No handover notes recorded from the previous shift. Tap to record handover notes for your team.
            </Text>
            <View className="flex-row items-center gap-1 mt-1">
              <Text className="text-xs font-bold text-primary">Record Handover</Text>
              <ChevronRight size={14} color={theme.colors.primary.DEFAULT} />
            </View>
          </View>
        )}
      </CardWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionWrapper: {
    marginVertical: 4,
    width: '100%',
  },
  sectionHeader: {
    marginBottom: 6,
  },
  cardContainer: {
    backgroundColor: '#FAF7EC',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    width: '100%',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  authorTextCol: {
    flex: 1,
  },
});

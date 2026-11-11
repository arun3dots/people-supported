import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { History, Shield, Smartphone, Globe } from 'lucide-react-native';
import { makeMobileApiCall } from '../../data/api/client';
import { useAuth } from '../../presentation/context/AuthContext';
import { Text } from '../ui/text';
import { ProfileAuditItem, formatAuditActionTitle } from './profile.types';
import { formatUkTime } from '../../lib/date';
import { theme } from '../../theme';

interface ProfileActivitySectionProps {
  userId: string | undefined;
}

interface AuditApiResponse {
  data?: ProfileAuditItem[];
  logs?: ProfileAuditItem[];
}

export function ProfileActivitySection({ userId }: ProfileActivitySectionProps) {
  const { user } = useAuth();
  const canReadAuditLogs = ['admin', 'manager', 'superadmin'].includes(
    (user?.roleName || '').toLowerCase()
  );
  const [activities, setActivities] = useState<ProfileAuditItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchActivities() {
      if (!userId || !canReadAuditLogs) {
        if (isMounted) {
          setActivities([]);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        // Call getAuditLogs for this user
        const res = await makeMobileApiCall<AuditApiResponse | ProfileAuditItem[]>(
          'getAuditLogs',
          {},
          { userId, limit: 5 }
        );

        if (!isMounted) return;

        let items: ProfileAuditItem[] = [];
        if (Array.isArray(res)) {
          items = res;
        } else if (res?.data && Array.isArray(res.data)) {
          items = res.data;
        } else if (res?.logs && Array.isArray(res.logs)) {
          items = res.logs;
        }

        setActivities(items.slice(0, 5));
      } catch {
        // Backend restricts /audit-logs to Admin/Manager roles (returns 403 for Carer)
        // Gracefully handle without crashing, leaving activities as empty list
        if (isMounted) {
          setActivities([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchActivities();

    return () => {
      isMounted = false;
    };
  }, [userId, canReadAuditLogs]);

  const formatActivityTime = (isoString: string): string => {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-GB', { month: 'short' });
    const time24 = formatUkTime(d);
    return `${day} ${month}, ${time24}`;
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerTitleRow}>
          <History size={16} color={theme.colors.primary.DEFAULT} />
          <Text className="text-base font-bold text-text-primary ml-1.5">
            Recent Account Activity
          </Text>
        </View>
        <Text className="text-xs text-text-muted">Security log</Text>
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary.DEFAULT} />
          </View>
        ) : activities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Shield size={24} color="#94A3B8" />
            <Text className="text-xs font-semibold text-text-primary mt-2">
              No recent security events
            </Text>
            <Text className="text-xs text-text-muted text-center mt-0.5">
              Account logins, password changes, and security updates will appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.activityList}>
            {activities.map((item, index) => {
              const timeDisplay = formatActivityTime(item.timestamp);
              const title = formatAuditActionTitle(item.actionType);
              const deviceText = [item.device || 'Mobile', item.os, item.ipAddress]
                .filter(Boolean)
                .join(' • ');

              return (
                <View
                  key={item.id || index}
                  style={[
                    styles.activityItem,
                    index !== activities.length - 1 && styles.activityItemBorder,
                  ]}
                >
                  <View style={styles.activityIcon}>
                    {item.device === 'Mobile' ? (
                      <Smartphone size={14} color="#059669" />
                    ) : (
                      <Globe size={14} color="#059669" />
                    )}
                  </View>
                  <View style={styles.activityDetails}>
                    <View style={styles.activityTopRow}>
                      <Text className="text-xs font-semibold text-text-primary">
                        {title}
                      </Text>
                      <Text className="text-xs text-text-muted">
                        {timeDisplay}
                      </Text>
                    </View>
                    {deviceText ? (
                      <Text className="text-xs text-text-muted mt-0.5" numberOfLines={1}>
                        {deviceText}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F7F7F7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    paddingTop: 10,
  },
  centerContainer: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityList: {
    gap: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  activityIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  activityDetails: {
    flex: 1,
  },
  activityTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});


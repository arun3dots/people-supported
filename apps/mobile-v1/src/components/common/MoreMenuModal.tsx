import React from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  X,
  History,
  TriangleAlert,
  ClipboardCheck,
  Pill,
  HeartPulse,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react-native';
import { Text } from '../ui/text';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Avatar } from './Avatar';
import { useAuth } from '../../presentation/context/AuthContext';
import { theme } from '../../theme';
import { useSheetBottomPadding } from '../../presentation/hooks/useSheetBottomPadding';

export interface MoreMenuModalProps {
  visible: boolean;
  onClose: () => void;
}

interface MenuItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  badge?: string;
  onPress: () => void;
}

export function MoreMenuModal({ visible, onClose }: MoreMenuModalProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const sheetBottomPadding = useSheetBottomPadding(12);

  const userAvatarUrl =
    user?.avatarUrl ||
    user?.profilePhotoUrl ||
    user?.profilePicture ||
    user?.photoUrl ||
    null;

  const navigateTo = (route: string) => {
    onClose();
    setTimeout(() => {
      router.navigate(route as unknown as Parameters<typeof router.navigate>[0]);
    }, 120);
  };

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  const menuItems: MenuItem[] = [
    {
      id: 'shift',
      title: 'My Shift',
      subtitle: 'Weekly rota & shift progress',
      icon: History,
      iconBg: '#F5F8F7',
      iconColor: theme.colors.primary.DEFAULT,
      onPress: () => {
        onClose();
        setTimeout(() => {
          router.navigate({
            pathname: '/',
            params: { openShiftDetails: 'true', tab: 'weekly' },
          } as unknown as Parameters<typeof router.navigate>[0]);
        }, 120);
      },
    },
    // {
    //   id: 'news2',
    //   title: 'NEWS2 Vitals',
    //   subtitle: 'Vital signs & escalation',
    //   icon: HeartPulse,
    //   iconBg: '#FEE4E2',
    //   iconColor: '#D92D20',
    //   badge: 'URGENT',
    //   onPress: () => navigateTo('/news2'),
    // },
    {
      id: 'mar',
      title: 'eMAR Medication',
      subtitle: 'Medication administration',
      icon: Pill,
      iconBg: '#EFF8FF',
      iconColor: '#175CD3',
      onPress: () => navigateTo('/mar'),
    },
    {
      id: 'handover',
      title: 'Handover',
      subtitle: 'Previous carers’ handover notes',
      icon: ClipboardCheck,
      iconBg: '#FAF8EE',
      iconColor: '#8A6E24',
      onPress: () => navigateTo('/previous-handover'),
    },
    {
      id: 'alerts',
      title: 'Clinical Alerts',
      subtitle: 'High risks & notifications',
      icon: TriangleAlert,
      iconBg: '#FEF3F2',
      iconColor: '#B42318',
      onPress: () => navigateTo('/alerts'),
    },
    {
      id: 'incidents',
      title: 'Report Incident',
      subtitle: 'Near-miss & fall reporting',
      icon: TriangleAlert,
      iconBg: '#FFF4ED',
      iconColor: '#B54708',
      onPress: () => navigateTo('/report-incident'),
    },
    {
      id: 'settings',
      title: 'App Settings',
      subtitle: 'Security & offline preferences',
      icon: Settings,
      iconBg: '#F8F9FA',
      iconColor: '#475467',
      onPress: () => navigateTo('/settings'),
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/60" onPress={onClose} />

        <View className="bg-white rounded-t-3xl max-h-[85%]" style={{ paddingBottom: sheetBottomPadding }}>
          {/* Drag Handle */}
          <View className="w-10 h-1 bg-[#D1DDD9] rounded-full self-center mt-2.5 mb-1.5" />

          {/* User Profile Header */}
          <View className="flex-row justify-between items-center px-4 py-3">
            <View className="flex-row items-center gap-3 flex-1">
              <Avatar
                name={user?.fullName || 'Care Staff'}
                imageUrl={userAvatarUrl}
                size="md"
              />
              <View className="flex-1">
                <Text className="text-base font-bold text-text-primary" numberOfLines={1}>
                  {user?.fullName || 'Care Staff'}
                </Text>
                <Text className="text-xs text-text-secondary" numberOfLines={1}>
                  {user?.email || 'carer@carehome.com'}
                </Text>
                {user?.organizationName && (
                  <Text className="text-xs font-medium text-text-primary mt-0.5" numberOfLines={1}>
                    {user.organizationName}
                  </Text>
                )}
                {user?.organizationContactName && (
                  <Text className="text-xs text-text-secondary mt-0.5" numberOfLines={1}>
                    Contact: {user.organizationContactName}
                  </Text>
                )}
                <View className="mt-1 self-start">
                  <Badge variant="clinicalSafe" size="sm">
                    {user?.roleName || 'Carer'}
                  </Badge>
                </View>
              </View>
            </View>

            <TouchableOpacity
              className="w-8 h-8 rounded-full bg-surface items-center justify-center ml-2"
              onPress={onClose}
              activeOpacity={0.7}
              accessibilityLabel="Close menu"
            >
              <X size={18} color="#5D5D5D" />
            </TouchableOpacity>
          </View>

          <View className="h-[1px] bg-slate-100 mx-4 mb-2.5" />

          {/* Quick Menu Items Grid */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          >
            <Text className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2.5">
              More Options & Quick Actions
            </Text>

            <View className="flex-row flex-wrap justify-between gap-y-2.5 mb-3">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <TouchableOpacity
                    key={item.id}
                    className="w-[48%] bg-surface rounded-2xl p-3.5 justify-between min-h-[96px]"
                    activeOpacity={0.8}
                    onPress={item.onPress}
                  >
                    <View className="flex-row justify-between items-center mb-2">
                      <View
                        className="w-9 h-9 rounded-xl items-center justify-center"
                        style={{ backgroundColor: item.iconBg }}
                      >
                        <Icon size={19} color={item.iconColor} strokeWidth={2.2} />
                      </View>
                      {item.badge && (
                        <View className="bg-clinical-criticalBg px-2 py-0.5 rounded-full">
                          <Text className="text-xs font-bold text-clinical-critical">
                            {item.badge}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View className="mt-1">
                      <Text className="text-sm font-bold text-text-primary" numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text className="text-xs text-text-secondary" numberOfLines={1}>
                        {item.subtitle}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Logout Button */}
            <Button
              variant="destructive"
              size="lg"
              className="w-full mt-2"
              leftIcon={<LogOut size={16} color="#FFFFFF" />}
              rightIcon={<ChevronRight size={16} color="#FFFFFF" />}
              onPress={handleLogout}
            >
              Log Out
            </Button>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

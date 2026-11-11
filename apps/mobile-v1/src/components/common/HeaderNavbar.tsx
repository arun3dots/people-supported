import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { User as UserIcon, LogOut, Search, Bell } from 'lucide-react-native';
import { Text } from '../ui/text';
import { Badge } from '../ui/badge';
import { Avatar } from './Avatar';
import { UserProfileModal } from './UserProfileModal';
import { useAuth } from '../../presentation/context/AuthContext';
import { useShiftDashboard } from '../../presentation/hooks/useShiftDashboard';
import { useNotifications } from '../../presentation/hooks/useNotifications';
import { formatUkHeaderDate, formatUkTime } from '../../lib/date';
import { theme } from '../../theme';

export interface HeaderNavbarProps {
  title?: string;
  subtitle?: string;
  onSearchPress?: () => void;
  onAlertsPress?: () => void;
}

export function HeaderNavbar({
  title,
  subtitle,
  onSearchPress,
  onAlertsPress,
}: HeaderNavbarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { urgentAlerts } = useShiftDashboard();
  const { unreadCount } = useNotifications();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [currentUkTime, setCurrentUkTime] = useState(() => formatUkTime(new Date()));

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentUkTime(formatUkTime(new Date()));
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const userAvatarUrl =
    user?.avatarUrl ||
    user?.profilePhotoUrl ||
    user?.profilePicture ||
    user?.photoUrl ||
    null;

  // Dynamic formatted date locked to UK care home timezone
  const getFormattedDate = (): string => formatUkHeaderDate();

  const handleProfileClick = () => {
    setDropdownOpen(false);
    setProfileModalOpen(true);
  };

  const handleLogoutClick = async () => {
    setDropdownOpen(false);
    await logout();
  };

  const handleAlertsClick = () => {
    if (onAlertsPress) {
      onAlertsPress();
    } else {
      router.navigate('/alerts' as unknown as Parameters<typeof router.navigate>[0]);
    }
  };

  const handleSearchClick = () => {
    if (onSearchPress) {
      onSearchPress();
    } else {
      router.push({
        pathname: '/residents',
        params: { focusSearch: 'true' },
      } as unknown as Parameters<typeof router.push>[0]);
    }
  };

  return (
    <>
      {/* Top Navbar Header */}
      <View style={styles.navbar}>
        {title ? (
          <View style={styles.titleNavLeft}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setDropdownOpen(true)}
              style={styles.avatarTouch}
              accessibilityLabel="Open user menu"
            >
              <Avatar
                name={user?.fullName || 'Care Staff'}
                imageUrl={userAvatarUrl}
                size="xs"
              />
            </TouchableOpacity>
            <View style={{ marginLeft: 8, flex: 1 }}>
              <Text className="text-base font-bold text-foreground" numberOfLines={1}>{title}</Text>
              {subtitle && (
                <Text className="text-xs text-muted-foreground" numberOfLines={1}>{subtitle}</Text>
              )}
            </View>
          </View>
        ) : (
          <>
            {/* Left: Clickable User Profile Avatar */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setDropdownOpen(true)}
              style={styles.avatarTouch}
              accessibilityLabel="Open user menu"
            >
              <Avatar
                name={user?.fullName || 'Care Staff'}
                imageUrl={userAvatarUrl}
                size="sm"
              />
            </TouchableOpacity>

            {/* Center: Formatted Date & Live UK Time */}
            <View className="flex-row items-center justify-center">
              <Text className="text-sm font-medium text-foreground">
                {getFormattedDate()}
              </Text>
              <Text className="text-sm font-bold text-primary ml-1.5">
                • {currentUkTime}
              </Text>
            </View>
          </>
        )}

        {/* Right: Search & Bell Notification */}
        <View style={styles.rightNav}>
          <TouchableOpacity
            style={styles.navButton}
            activeOpacity={0.7}
            onPress={handleSearchClick}
            accessibilityLabel="Search residents"
          >
            <Search size={21} color="#141F1E" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            activeOpacity={0.7}
            onPress={handleAlertsClick}
            accessibilityLabel="View notifications"
          >
            <View style={styles.bellWrapper}>
              <Bell size={21} color="#141F1E" />
              {(unreadCount > 0 || urgentAlerts.length > 0) && <View style={styles.badgeDot} />}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Dropdown Menu Modal */}
      <Modal
        visible={dropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownOpen(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setDropdownOpen(false)}
        >
          <View style={styles.dropdownMenu}>
            {/* User Header */}
            <View style={styles.menuUserHeader}>
              <Avatar
                name={user?.fullName || 'Care Staff'}
                imageUrl={userAvatarUrl}
                size="md"
              />
              <View style={styles.menuUserInfo}>
                <Text className="text-sm font-bold text-foreground" numberOfLines={1}>
                  {user?.fullName || 'Care Staff'}
                </Text>
                <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                  {user?.email || 'carer@carehome.com'}
                </Text>
                <View className="mt-1 self-start">
                  <Badge variant="clinicalSafe" size="sm">
                    <Text className="text-xs font-semibold text-clinical-safe">
                      {user?.roleName || 'Carer'}
                    </Text>
                  </Badge>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Option 1: Profile */}
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={handleProfileClick}
            >
              <View style={styles.menuItemIconBg}>
                <UserIcon size={18} color={theme.colors.primary.DEFAULT} />
              </View>
              <Text className="text-sm font-semibold text-foreground ml-2.5">
                Profile
              </Text>
            </TouchableOpacity>

            {/* Option 2: Logout */}
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={handleLogoutClick}
            >
              <View style={[styles.menuItemIconBg, styles.logoutIconBg]}>
                <LogOut size={18} color="#FF3B2F" />
              </View>
              <Text className="text-sm font-semibold text-[#FF3B2F] ml-2.5">
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* User Profile Full Dialog Modal */}
      <UserProfileModal
        visible={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  titleNavLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  avatarTouch: {
    padding: 2,
  },
  rightNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navButton: {
    padding: 6,
  },
  bellWrapper: {
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#FF3B2F',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 60,
    left: 16,
    width: 250,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  menuUserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 8,
  },
  menuUserInfo: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  menuItemIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F5F8F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIconBg: {
    backgroundColor: '#FFF2F1',
  },
});

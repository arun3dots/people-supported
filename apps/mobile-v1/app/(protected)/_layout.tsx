import React, { useState, useEffect } from 'react';
import { Platform, View, StatusBar as RNStatusBar } from 'react-native';
import { Tabs, useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, ClipboardCheck, Contact, MoreHorizontal } from 'lucide-react-native';
import { HeaderNavbar } from '../../src/components/common/HeaderNavbar';
import { MoreMenuModal } from '../../src/components/common/MoreMenuModal';
import { theme } from '../../src/theme';
import { useDeviceTokenRegistration } from '../../src/presentation/hooks/useDeviceTokenRegistration';

export default function ProtectedLayout() {
  useDeviceTokenRegistration();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'android') {
      RNStatusBar.setBarStyle('dark-content', true);
    }
  }, [isMoreMenuOpen]);

  // Dynamic bottom padding to ensure zero overlap with iOS home indicator or Android navigation bar
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 12);
  const tabHeight = 80 + bottomInset;

  return (
    <View className="flex-1 bg-background">
      {/* Top Status Bar Safe Area & Global HeaderNavbar (z-index 100 to ensure modals overlay tab bar cleanly) */}
      <View style={{ paddingTop: insets.top, backgroundColor: '#FFFFFF', zIndex: 100, elevation: 100 }}>
        <HeaderNavbar
          onSearchPress={() =>
            router.push({
              pathname: '/residents',
              params: { focusSearch: 'true' },
            } as unknown as Href)
          }
          onAlertsPress={() => router.navigate('/alerts' as Href)}
        />
      </View>

      <Tabs
        backBehavior="history"
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          tabBarActiveTintColor: theme.colors.primary.DEFAULT,
          tabBarInactiveTintColor: '#A0ABA7',
          tabBarStyle: {
            backgroundColor: theme.colors.background,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border.subtle,
            height: tabHeight,
            paddingTop: 8,
            paddingBottom: bottomInset + (Platform.OS === 'android' ? 6 : 2),
            elevation: 12,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
          },
          tabBarLabelStyle: {
            fontFamily: theme.fonts.semibold,
            fontSize: 12,
            lineHeight: 18,
            flexShrink: 0,
            marginTop: 2,
            marginBottom: Platform.OS === 'android' ? 6 : 2,
          },
          tabBarItemStyle: {
            paddingTop: 0,
            paddingBottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
          },
        }}
      >
        {/* =======================================================
            ONLY 4 VISIBLE MENUS IN THE FOOTER MENU BAR
            ======================================================= */}

        {/* 1. Dashboard Tab */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => (
              <Home size={size || 24} color={color} strokeWidth={2.2} />
            ),
          }}
        />

        {/* 2. Tasks Tab */}
        <Tabs.Screen
          name="tasks"
          options={{
            title: 'Tasks',
            tabBarIcon: ({ color, size }) => (
              <ClipboardCheck size={size || 24} color={color} strokeWidth={2.2} />
            ),
          }}
        />

        {/* 3. People Supported Tab */}
        <Tabs.Screen
          name="residents"
          options={{
            title: 'People Supported',
            tabBarIcon: ({ color, size }) => (
              <Contact size={size || 24} color={color} strokeWidth={2.2} />
            ),
          }}
        />

        {/* 4. More Menu Tab */}
        <Tabs.Screen
          name="more"
          options={{
            title: 'More',
            tabBarIcon: ({ color, size }) => (
              <MoreHorizontal size={size || 24} color={color} strokeWidth={2.4} />
            ),
          }}
        />

        {/* =======================================================
            ALL OTHER SCREENS HIDDEN FROM THE TAB BAR
            In Expo SDK 58 (Expo Router v4), href: null causes
            hidden: true, which triggers an immediate redirect back to
            the default tab. Using tabBarButton: () => null keeps them
            navigable while hiding them from the tab bar, and the bottom
            tab bar remains visible for easy navigation.
            ======================================================= */}
        <Tabs.Screen
          name="alerts"
          options={{
            tabBarItemStyle: { display: 'none' },
            tabBarButton: () => null,
          }}
        />
        <Tabs.Screen
          name="previous-handover"
          options={{
            tabBarItemStyle: { display: 'none' },
            tabBarButton: () => null,
          }}
        />
        <Tabs.Screen
          name="handover"
          options={{
            tabBarItemStyle: { display: 'none' },
            tabBarButton: () => null,
          }}
        />
        <Tabs.Screen
          name="mar"
          options={{
            tabBarItemStyle: { display: 'none' },
            tabBarButton: () => null,
          }}
        />
        <Tabs.Screen
          name="news2"
          options={{
            tabBarItemStyle: { display: 'none' },
            tabBarButton: () => null,
          }}
        />
        <Tabs.Screen
          name="resident-details"
          options={{
            tabBarItemStyle: { display: 'none' },
            tabBarButton: () => null,
          }}
        />
        <Tabs.Screen
          name="care-plan"
          options={{
            tabBarItemStyle: { display: 'none' },
            tabBarButton: () => null,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            tabBarItemStyle: { display: 'none' },
            tabBarButton: () => null,
          }}
        />
        <Tabs.Screen
          name="report-incident"
          options={{
            tabBarItemStyle: { display: 'none' },
            tabBarButton: () => null,
          }}
        />
        <Tabs.Screen
          name="task-history"
          options={{
            tabBarItemStyle: { display: 'none' },
            tabBarButton: () => null,
          }}
        />
        <Tabs.Screen
          name="documents"
          options={{
            tabBarItemStyle: { display: 'none' },
            tabBarButton: () => null,
          }}
        />
        <Tabs.Screen
          name="risk-assessment"
          options={{
            title: 'Risk Assessment',
            tabBarItemStyle: { display: 'none' },
            tabBarButton: () => null,
          }}
        />
        <Tabs.Screen
          name="care-notes"
          options={{
            title: 'Care Notes',
            tabBarItemStyle: { display: 'none' },
            tabBarButton: () => null,
          }}
        />
        <Tabs.Screen
          name="emergency-directory"
          options={{
            title: 'Emergency Directory',
            tabBarItemStyle: { display: 'none' },
            tabBarButton: () => null,
          }}
        />
        <Tabs.Screen
          name="emergency-resident"
          options={{
            title: 'Emergency Summary',
            tabBarItemStyle: { display: 'none' },
            tabBarButton: () => null,
          }}
        />
        <Tabs.Screen
          name="body-map"
          options={{
            title: 'Body Map',
            tabBarItemStyle: { display: 'none' },
            tabBarButton: () => null,
          }}
        />
      </Tabs>

      {/* More Options Bottom Sheet Drawer */}
      <MoreMenuModal
        visible={isMoreMenuOpen}
        onClose={() => setIsMoreMenuOpen(false)}
      />
    </View>
  );
}

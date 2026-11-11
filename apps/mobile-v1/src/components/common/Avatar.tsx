import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Text } from '../ui/text';
import { getAccessToken, getAccessTokenSync } from '../../data/security/secureStorage';
import { theme } from '../../theme';
import { AuthenticatedImage } from './AuthenticatedImage';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: AvatarSize;
  style?: StyleProp<ViewStyle>;
}

export function Avatar({
  name,
  imageUrl,
  size = 'md',
  style,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(getAccessTokenSync());

  // Retrieve auth token for authenticated backend photo endpoints if not cached in memory
  useEffect(() => {
    let isMounted = true;
    getAccessToken()
      .then((token) => {
        if (isMounted && token) {
          setAuthToken(token);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Reset error status if imageUrl or authToken changes
  useEffect(() => {
    setImageError(false);
  }, [imageUrl, authToken]);

  const getInitials = (fullName: string): string => {
    if (!fullName || typeof fullName !== 'string') return '?';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return (parts[0]?.[0] || '?').toUpperCase();
  };

  const getDimensions = (): number => {
    switch (size) {
      case 'xs':
        return 28;
      case 'sm':
        return 36;
      case 'lg':
        return 56;
      case 'xl':
        return 72;
      case 'md':
      default:
        return 44;
    }
  };

  const getTextSize = (): string => {
    switch (size) {
      case 'xs':
        return 'text-xs';
      case 'sm':
        return 'text-xs';
      case 'lg':
        return 'text-lg';
      case 'xl':
        return 'text-2xl';
      case 'md':
      default:
        return 'text-sm';
    }
  };

  /**
   * Normalizes image URL:
   * 1. Replaces localhost/127.0.0.1 with mobile device's EXPO_PUBLIC_API_URL host.
   * 2. Prepends backend host if relative URL.
   * 3. For protected backend endpoints, verifies token exists before requesting to avoid 401s.
   * (Auth token is passed strictly via HTTP Authorization headers to prevent URL query leak).
   */
  const resolveUri = (url?: string | null, token?: string | null): string | null => {
    if (!url || typeof url !== 'string' || url.trim() === '') return null;
    let trimmed = url.trim();

    const envApiUrl = process.env.EXPO_PUBLIC_API_URL || '';
    let apiHost = '';

    if (envApiUrl) {
      try {
        const parsed = new URL(envApiUrl);
        apiHost = `${parsed.protocol}//${parsed.host}`;
        trimmed = trimmed.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, apiHost);
      } catch {
        // ignore malformed URL parse
      }
    }

    // Prepend host if relative path
    if (
      !trimmed.startsWith('http://') &&
      !trimmed.startsWith('https://') &&
      !trimmed.startsWith('file://') &&
      !trimmed.startsWith('data:')
    ) {
      const base = envApiUrl ? envApiUrl.replace(/\/api\/?$/, '') : 'https://devapi.cantracare.com';
      trimmed = `${base}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
    }

    // Check if URL points to backend API
    const isBackendApi =
      (apiHost && trimmed.startsWith(apiHost)) ||
      trimmed.includes('/api/staff/') ||
      trimmed.includes('/api/profile/') ||
      trimmed.includes('/api/documents/') ||
      trimmed.includes('/api/body-map-photos/') ||
      trimmed.includes('/api/residents/');

    // For backend streaming routes, token is required
    if (isBackendApi) {
      if (!token) {
        // Do not request protected endpoint without a token (avoids 401s on initial render)
        return null;
      }
    }

    return trimmed;
  };

  const dim = getDimensions();
  const validUri = resolveUri(imageUrl, authToken);

  // If a valid profile pic exists and hasn't failed to load, show the photo
  if (validUri && !imageError) {
    return (
      <View
        style={[
          styles.base,
          { width: dim, height: dim, borderRadius: dim / 2 },
          style,
        ]}
      >
        <AuthenticatedImage
          uri={validUri}
          style={{ width: dim, height: dim, borderRadius: dim / 2 }}
          resizeMode="cover"
          onLoadFailed={() => setImageError(true)}
        />
      </View>
    );
  }

  // Fallback: Show the initial only if there is no profile pic from the API or if loading failed
  return (
    <View
      style={[
        styles.base,
        styles.fallbackBg,
        { width: dim, height: dim, borderRadius: dim / 2 },
        style,
      ]}
    >
      <Text className={`${getTextSize()} font-bold text-primary`}>
        {getInitials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  fallbackBg: {
    backgroundColor: theme.colors.primary.light,
    borderWidth: 1,
    borderColor: theme.colors.border.DEFAULT,
  },
});

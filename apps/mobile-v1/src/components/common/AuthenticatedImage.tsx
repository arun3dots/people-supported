import React, { useEffect, useState } from 'react';
import { Image, ImageProps, Platform } from 'react-native';
import { getAccessToken, getAccessTokenSync } from '../../data/security/secureStorage';
import { normalizeBackendMediaUrl } from '../../lib/fileUpload';

export function useAuthenticatedImageSource(rawUrl?: string | null): {
  uri: string | null;
  headers?: Record<string, string>;
  loading: boolean;
} {
  const [authToken, setAuthToken] = useState<string | null>(getAccessTokenSync());
  const [webBlobUrl, setWebBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    getAccessToken()
      .then((t) => {
        if (mounted && t) setAuthToken(t);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const normalized = normalizeBackendMediaUrl(rawUrl);

  const isLocalOrInline =
    Boolean(normalized) &&
    (normalized!.startsWith('blob:') ||
      normalized!.startsWith('data:') ||
      normalized!.startsWith('file://'));

  useEffect(() => {
    if (Platform.OS !== 'web' || !normalized || isLocalOrInline) {
      setWebBlobUrl(null);
      return;
    }

    let cancelled = false;
    let createdObjectUrl: string | null = null;
    setLoading(true);

    fetch(normalized, {
      method: 'GET',
      credentials: 'include',
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        if (!cancelled) {
          createdObjectUrl = URL.createObjectURL(blob);
          setWebBlobUrl(createdObjectUrl);
        }
      })
      .catch(() => {
        if (!cancelled) setWebBlobUrl(normalized);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (createdObjectUrl) {
        URL.revokeObjectURL(createdObjectUrl);
      }
    };
  }, [normalized, authToken, isLocalOrInline]);

  if (!normalized) {
    return { uri: null, loading: false };
  }

  if (Platform.OS === 'web') {
    return {
      uri: isLocalOrInline ? normalized : webBlobUrl,
      loading,
    };
  }

  if (isLocalOrInline) {
    return { uri: normalized, loading: false };
  }

  return {
    uri: normalized,
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
    loading: false,
  };
}

interface AuthenticatedImageProps extends Omit<ImageProps, 'source'> {
  uri?: string | null;
  onLoadFailed?: () => void;
}

export function AuthenticatedImage({
  uri,
  onLoadFailed,
  ...rest
}: AuthenticatedImageProps) {
  const { uri: resolvedUri, headers } = useAuthenticatedImageSource(uri);

  if (!resolvedUri) return null;

  return (
    <Image
      {...rest}
      source={headers ? { uri: resolvedUri, headers } : { uri: resolvedUri }}
      onError={() => onLoadFailed?.()}
    />
  );
}


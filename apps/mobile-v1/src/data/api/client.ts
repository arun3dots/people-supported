import { Platform } from 'react-native';
import {
  endpointInfo,
  ApiName,
  LOGIN,
  MFA_VERIFY,
  FORGOT_PASSWORD,
  VERIFY_OTP,
  RESET_PASSWORD_OTP,
} from '@repo/endpoints';
import {
  getAccessToken,
  getRefreshToken,
  saveTokens,
  clearTokens,
} from '../security/secureStorage';
import { safeLogger } from '../security/safeLogger';

export function getApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.trim().length > 0) {
    const trimmed = envUrl.trim().replace(/\/+$/, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
  }
  return 'https://api-demo.cantracare.com/api';
}

type RefreshResult = 'refreshed' | 'unauthorized' | 'network_error';
let refreshPromise: Promise<RefreshResult> | null = null;
let lastRefreshSuccessAt = 0;
type SessionExpiredHandler = () => void;
let sessionExpiredHandler: SessionExpiredHandler | null = null;

export function setSessionExpiredHandler(handler: SessionExpiredHandler): void {
  sessionExpiredHandler = handler;
}

async function refreshAccessToken(): Promise<RefreshResult> {
  // If another request just refreshed the token within the last 5 seconds,
  // reuse that fresh token instead of rotating the refresh token twice.
  if (Date.now() - lastRefreshSuccessAt < 5000) {
    return 'refreshed';
  }

  if (!refreshPromise) {
    refreshPromise = (async (): Promise<RefreshResult> => {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) return 'unauthorized';
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        const res = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
          method: 'POST',
          credentials: Platform.OS === 'web' ? 'include' : 'omit',
          headers,
          body: JSON.stringify({ refreshToken }),
        });

        if (res.status === 401 || res.status === 403) {
          return 'unauthorized';
        }
        if (!res.ok) {
          return 'network_error';
        }

        let newAccessToken: string | null = null;
        let newRefreshToken: string | null = null;

        try {
          const data = await res.json();
          if (data && typeof data === 'object') {
            newAccessToken = data.accessToken || data.access_token || null;
            newRefreshToken = data.refreshToken || data.refresh_token || null;
          }
        } catch {
          // Non-JSON response
        }

        // If not in JSON body, parse from Set-Cookie header set by backend
        if (!newAccessToken) {
          const rawCookies = res.headers.get('set-cookie') || '';
          const matchAccess = rawCookies.match(/access_token=([^;]+)/i);
          if (matchAccess) {
            newAccessToken = decodeURIComponent(matchAccess[1]);
          }
          const matchRefresh = rawCookies.match(/refresh_token=([^;]+)/i);
          if (matchRefresh) {
            newRefreshToken = decodeURIComponent(matchRefresh[1]);
          }
        }

        if (newAccessToken) {
          await saveTokens(newAccessToken, newRefreshToken || refreshToken);
          lastRefreshSuccessAt = Date.now();
          return 'refreshed';
        }

        // On web where cookies are managed automatically by the browser
        if (Platform.OS === 'web' && res.ok) {
          lastRefreshSuccessAt = Date.now();
          return 'refreshed';
        }

        return 'network_error';
      } catch (err) {
        safeLogger.error('Refresh token request failed', err);
        return 'network_error';
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

export async function ensureFreshAccessToken(): Promise<boolean> {
  const result = await refreshAccessToken();
  return result === 'refreshed';
}

export async function makeMobileApiCall<TResponse = unknown>(
  apiName: ApiName,
  payload?: unknown,
  params?: Record<string, string | number | boolean | undefined>,
  substitutions?: Record<string, string | number>
): Promise<TResponse> {
  const info = endpointInfo[apiName];
  if (!info) {
    throw new Error(`Endpoint not defined: ${apiName}`);
  }

  let urlPath = info.endpoint.startsWith('/api') ? info.endpoint.substring(4) : info.endpoint;
  if (substitutions) {
    for (const [key, val] of Object.entries(substitutions)) {
      urlPath = urlPath.replace(`[${key}]`, String(val)).replace(`:${key}`, String(val));
    }
  }

  const queryParams = new URLSearchParams();
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) {
        queryParams.append(k, String(v));
      }
    }
  }

  const qs = queryParams.toString();
  const fullUrl = `${getApiBaseUrl()}${urlPath}${qs ? `?${qs}` : ''}`;

  const execute = async (token: string | null): Promise<Response> => {
    const isGet = info.requestType === 'GET';
    const isFormData =
      (typeof FormData !== 'undefined' && payload instanceof FormData) ||
      (typeof payload === 'object' &&
        payload !== null &&
        '_parts' in payload &&
        Array.isArray((payload as { _parts: unknown })._parts));

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const body = !isGet && payload !== undefined
      ? (isFormData ? (payload as BodyInit) : JSON.stringify(payload))
      : undefined;

    return fetch(fullUrl, {
      method: info.requestType,
      credentials: Platform.OS === 'web' ? 'include' : 'omit',
      headers,
      body,
    });
  };

  let token = await getAccessToken();
  let response = await execute(token);

  const isPublicAuthEndpoint =
    apiName === LOGIN ||
    apiName === MFA_VERIFY ||
    apiName === FORGOT_PASSWORD ||
    apiName === VERIFY_OTP ||
    apiName === RESET_PASSWORD_OTP;

  if (response.status === 401 && !isPublicAuthEndpoint) {
    // Check if another concurrent request already refreshed the access token while we were waiting
    const latestToken = await getAccessToken();
    if (latestToken && latestToken !== token) {
      token = latestToken;
      response = await execute(token);
    }

    if (response.status === 401) {
      const refreshResult = await refreshAccessToken();
      if (refreshResult === 'refreshed') {
        token = await getAccessToken();
        response = await execute(token);
      } else if (refreshResult === 'unauthorized') {
        await clearTokens();
        sessionExpiredHandler?.();
        throw new Error('Your clinical session has expired. Please sign in again.');
      }
    }
  }

  if (!response.ok) {
    let errorMessage = `API Error ${response.status}: ${response.statusText}`;
    try {
      const errBody = await response.json();
      if (Array.isArray(errBody?.errors) && errBody.errors.length > 0) {
        const details = errBody.errors
          .map((e: { message?: string }) => e?.message)
          .filter(Boolean)
          .join('\n• ');
        errorMessage = details ? `Validation error:\n• ${details}` : (errBody.message || errorMessage);
      } else if (errBody?.message) {
        errorMessage = Array.isArray(errBody.message)
          ? errBody.message.join(', ')
          : errBody.message;
      }
    } catch {
      // Non-JSON error body
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return {} as TResponse;
  }

  return (await response.json()) as TResponse;
}

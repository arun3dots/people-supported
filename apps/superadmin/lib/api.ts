import endpointInfo from "./endpoints";
import { recoverSession, refreshSession } from "./auth/sessionManager";

function getApiBaseUrl(): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4400/api";
  return baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
}

export async function makeAPICall<T>(
  apiName: string,
  payload: Record<string, unknown> | FormData = {},
  params: Record<string, string | number | boolean> = {},
  substitutions: Record<string, string> = {},
): Promise<T> {
  const endpointDetail = endpointInfo[apiName];
  if (!endpointDetail) {
    throw new Error(`Endpoint detail not found for API: ${apiName}`);
  }

  let { endpoint, requestType } = endpointDetail;

  // Handle path parameter substitutions like [id]
  Object.entries(substitutions).forEach(([key, value]) => {
    endpoint = endpoint.replace(`[${key}]`, value);
  });

  const finalBaseUrl = getApiBaseUrl();

  // Ensure we don't double the /api prefix if it's already in the baseUrl
  const cleanEndpoint = endpoint.startsWith("/api")
    ? endpoint.substring(4)
    : endpoint;

  const url = new URL(`${finalBaseUrl}${cleanEndpoint}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value.toString());
    }
  });

  const isFormData = payload instanceof FormData;

  // Built fresh for the retry so the request body (FormData/JSON) is reusable.
  const buildOptions = (): RequestInit => {
    const fetchOptions: RequestInit = {
      method: requestType,
      headers: isFormData
        ? {}
        : {
            "Content-Type": "application/json",
          },
      // Include credentials so the HttpOnly auth cookies are sent
      credentials: "include",
    };

    if (requestType.toUpperCase() !== "GET") {
      if (isFormData) {
        fetchOptions.body = payload;
      } else if (Object.keys(payload).length > 0) {
        fetchOptions.body = JSON.stringify(payload);
      }
    }

    return fetchOptions;
  };

  let response = await fetch(url.toString(), buildOptions());

  // Access token most likely expired (15-minute TTL). Never attempt to refresh
  // the refresh call itself, to avoid an infinite loop.
  if (response.status === 401 && !endpoint.includes("/auth/refresh")) {
    // 1) Try a silent single-flight refresh — the common, invisible case.
    let recovered = await refreshSession();
    // 2) If that failed, escalate to the visible recovery flow: this shows the
    //    "reauthenticating" popup and retries in the background, ending in the
    //    session-timeout + redirect only if every retry fails.
    if (!recovered) {
      recovered = await recoverSession();
    }
    if (recovered) {
      response = await fetch(url.toString(), buildOptions());
    }
  }

  if (!response.ok) {
    // Try to parse error message from response
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }
    return Promise.reject(errorData);
  }

  return response.json() as Promise<T>;
}

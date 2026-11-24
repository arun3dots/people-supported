import endpointInfo from "./endpoints";
import { resolveApiUrl } from "./auth/apiBase";
import {
  expireSession,
  recoverSession,
  refreshSession,
} from "./auth/sessionManager";

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

  const url = resolveApiUrl(endpoint);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value.toString());
    }
  });

  const isFormData = payload instanceof FormData;

  const buildOptions = (): RequestInit => {
    const fetchOptions: RequestInit = {
      method: requestType,
      headers: isFormData
        ? {}
        : {
            "Content-Type": "application/json",
          },
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

  const isAuthFlowRequest = endpoint.includes("/auth/");
  if (response.status === 401 && !isAuthFlowRequest) {
    let refreshResult = await refreshSession();
    if (refreshResult === "temporary") {
      refreshResult = await recoverSession();
    }
    if (refreshResult === "refreshed") {
      response = await fetch(url.toString(), buildOptions());
    } else if (refreshResult === "invalid") {
      expireSession();
    }
  }

  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }
    return Promise.reject(errorData);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

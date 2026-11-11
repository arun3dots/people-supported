import endpointInfo, { ApiName } from "@repo/endpoints";
import {
  expireSession,
  recoverSession,
  refreshSession,
} from "./auth/sessionManager";
import { getPositionHeaders } from "./geolocation";

function getApiBaseUrl(): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4400/api";
  return baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
}

export async function makeAPICall<T>(
  apiName: ApiName | (string & {}),
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
        ? { ...getPositionHeaders() }
        : {
            "Content-Type": "application/json",
            ...getPositionHeaders(),
          },
      // Include credentials so the HttpOnly auth cookies are sent
      credentials: "include",
    };

    if (requestType.toUpperCase() !== "GET") {
      if (isFormData) {
        fetchOptions.body = payload as any;
      } else if (Object.keys(payload).length > 0) {
        fetchOptions.body = JSON.stringify(payload);
      }
    }

    return fetchOptions;
  };

  let response: Response;
  try {
    response = await fetch(url.toString(), buildOptions());
  } catch {
    return Promise.reject(
      new Error(
        "Unable to connect to the server. Please check your network connection and try again.",
      ),
    );
  }

  // Access token most likely expired (15-minute TTL). Never attempt to refresh
  // the refresh call itself, to avoid an infinite loop.
  const isAuthFlowRequest =
    endpoint.includes("/auth/") &&
    !endpoint.includes("/auth/switch-branch");
  if (
    response.status === 401 &&
    !endpoint.includes("/auth/refresh") &&
    !isAuthFlowRequest
  ) {
    let refreshResult = await refreshSession();
    if (refreshResult === "temporary") {
      refreshResult = await recoverSession();
    }
    if (refreshResult === "refreshed") {
      try {
        response = await fetch(url.toString(), buildOptions());
      } catch {
        return Promise.reject(
          new Error(
            "Unable to connect to the server. Please check your network connection and try again.",
          ),
        );
      }
    } else if (refreshResult === "invalid") {
      expireSession();
    }
  }

  if (!response.ok) {
    // Try to parse error message and validation errors from response
    let errorData: {
      message?: string | string[];
      errors?: Array<{ path?: (string | number)[]; message?: string }>;
    } | undefined;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }

    const responseMessage = Array.isArray(errorData?.message)
      ? errorData.message.join("; ")
      : errorData?.message;

    let message = responseMessage;
    if (errorData?.errors && errorData.errors.length > 0) {
      const details = Array.from(
        new Set(
          errorData.errors
            .map((e) => {
              const path = e.path || [];
              const stepMatch = typeof path[0] === "string" ? path[0].match(/step(\d+)/i) : null;
              const stepPrefix = stepMatch ? `Step ${stepMatch[1]}: ` : "";

              let msg = e.message || "Required";
              if (/^required$/i.test(msg) || /^invalid/i.test(msg)) {
                const lastKey = String(path[path.length - 1] || "");
                const friendly = lastKey
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (s) => s.toUpperCase())
                  .replace(/Id$/i, "")
                  .trim();
                msg = `${friendly || "Field"} is required`;
              }
              return `${stepPrefix}${msg}`;
            })
            .filter(Boolean),
        ),
      ).join(" • ");

      if (details) {
        message = details;
      }
    }

    const finalMessage =
      message ||
      (response.status === 409
        ? "Conflict: This record already exists."
        : response.status === 403
          ? "You do not have permission to perform this action."
          : response.status === 404
            ? "Requested resource was not found."
            : response.status >= 500
              ? "Internal server error. Please try again later."
              : "An unexpected error occurred.");

    const err = new Error(finalMessage) as Error & {
      errors?: Array<{ path?: (string | number)[]; message?: string }>;
      responseData?: unknown;
    };
    if (errorData?.errors) {
      err.errors = errorData.errors;
    }
    err.responseData = errorData;

    return Promise.reject(err);
  }

  // DELETE endpoints may intentionally return 200/204 without a response body.
  // Treat an empty successful response as a valid result instead of turning it
  // into a JSON parsing error after the server has completed the mutation.
  if (response.status === 204) {
    return undefined as T;
  }

  const responseText = await response.text();
  return responseText ? (JSON.parse(responseText) as T) : (undefined as T);
}

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "./page";

const authState = {
  user: null as null | { userId: string; mfaVerified?: boolean },
  loading: false,
};

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) =>
    React.createElement("img", {
      alt: String(props.alt ?? ""),
      src: String(props.src ?? ""),
    }),
}));

vi.mock("./components/LoginForm", () => ({
  LoginForm: () =>
    React.createElement("form", { "aria-label": "Legacy password form" }),
}));

vi.mock("../../lib/context/AuthContext", () => ({
  useAuth: () => authState,
}));

describe("/login Cognito integration", () => {
  const originalEnv = { ...process.env };
  const originalLocation = window.location;

  beforeEach(() => {
    process.env = { ...originalEnv };
    authState.user = null;
    authState.loading = false;
  });

  afterEach(() => {
    process.env = originalEnv;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
    vi.restoreAllMocks();
  });

  it("hides Cognito CTA when disabled and preserves legacy login form", async () => {
    process.env.COGNITO_AUTH_ENABLED = "false";
    render(await LoginPage({ searchParams: Promise.resolve({}) }));
    expect(
      screen.getByRole("form", { name: "Legacy password form" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Sign in with Cognito/i })).toBeNull();
  });

  it("renders same-origin Cognito CTA even when NEXT_PUBLIC_API_URL points to a separate API origin", async () => {
    process.env.COGNITO_AUTH_ENABLED = "true";
    process.env.LEGACY_AUTH_ENABLED = "false";
    process.env.NEXT_PUBLIC_API_URL = "https://api-demo.cantracare.com/api";

    render(await LoginPage({ searchParams: Promise.resolve({}) }));
    const link = screen.getByRole("link", { name: /Sign in with Cognito/i });
    expect(link).toHaveAttribute("href", "/api/auth/cognito/start");
    expect(screen.queryByRole("form", { name: "Legacy password form" })).toBeNull();
  });

  it("renders specific alerts for MFA failure, disabled accounts, and session expiry", async () => {
    process.env.COGNITO_AUTH_ENABLED = "true";

    const { unmount } = render(
      await LoginPage({
        searchParams: Promise.resolve({ cognito: "failed", reason: "mfa_failed" }),
      }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(/Multi-factor authentication/i);
    unmount();

    const r2 = render(
      await LoginPage({
        searchParams: Promise.resolve({
          cognito: "failed",
          reason: "account_disabled",
        }),
      }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(/disabled or unavailable/i);
    r2.unmount();

    render(
      await LoginPage({
        searchParams: Promise.resolve({ reason: "session_expired" }),
      }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(/session has expired/i);
  });

  it("completes navigation to next path once Cognito session user loads", async () => {
    process.env.COGNITO_AUTH_ENABLED = "true";
    authState.user = { userId: "u-1", mfaVerified: true };
    const replace = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...originalLocation, replace },
    });

    render(
      await LoginPage({
        searchParams: Promise.resolve({
          cognito: "complete",
          next: "/admin/dashboard",
        }),
      }),
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/admin/dashboard");
    });
  });
});

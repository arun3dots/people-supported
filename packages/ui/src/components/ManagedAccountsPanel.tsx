"use client";

import { useRef, useState, type FormEvent } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/Select";

type AccountAction =
  | "resend"
  | "retry"
  | "disable"
  | "enable"
  | "reset-password";
interface AccountRow {
  userId: string;
  fullName: string;
  email: string;
  active: boolean;
  phase: string;
  verificationDelivery: string;
  invitationDelivery: string;
  lastError: string | null;
}
interface AccountOption {
  id: string;
  name: string;
}

export function ManagedAccountsPanel({
  accounts,
  branches,
  roles,
  onCreate,
  onAction,
}: {
  accounts: readonly AccountRow[];
  branches: readonly AccountOption[];
  roles: readonly AccountOption[];
  onCreate: (fields: FormData, requestId: string) => Promise<unknown>;
  onAction: (userId: string, action: AccountAction) => Promise<unknown>;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [revision, setRevision] = useState(0);
  const request = useRef<{ key: string; input: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const fields = new FormData(event.currentTarget);
      const input = JSON.stringify(Array.from(fields.entries()));
      if (request.current?.input !== input)
        request.current = { key: crypto.randomUUID(), input };
      await onCreate(fields, request.current.key);
      request.current = null;
      setRevision((previous) => previous + 1);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "The account could not be created.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function act(row: AccountRow, action: AccountAction) {
    setBusy(true);
    setMessage("");
    try {
      await onAction(row.userId, action);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "The account could not be updated.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        key={revision}
        onSubmit={(event) => void submit(event)}
        className="grid gap-x-4 gap-y-1 rounded-2xl border border-slate-100 bg-white p-6 sm:grid-cols-2"
      >
        <label className="space-y-1 text-base font-medium text-slate-800">
          Full name
          <Input name="fullName" required maxLength={150} />
        </label>
        <label className="space-y-1 text-base font-medium text-slate-800">
          Email
          <Input name="email" type="email" required maxLength={254} />
        </label>
        <div className="space-y-1">
          <label
            htmlFor="managed-role"
            className="text-base font-medium text-slate-800"
          >
            Role
          </label>
          <Select name="roleId" required>
            <SelectTrigger id="managed-role">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label
            htmlFor="managed-branch"
            className="text-base font-medium text-slate-800"
          >
            Branch
          </label>
          <Select name="branchId" required>
            <SelectTrigger id="managed-branch">
              <SelectValue placeholder="Select a branch" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="mt-4 sm:col-span-2">
          <Button
            type="submit"
            size="lg"
            disabled={busy || !branches.length || !roles.length}
          >
            Invite user
          </Button>
        </div>
      </form>
      {message && (
        <p role="alert" className="text-sm text-red-700">
          {message}
        </p>
      )}
      <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
        {accounts.map((row) => (
          <li
            key={row.userId}
            className="flex flex-wrap items-center justify-between gap-3 p-4"
          >
            <div>
              <p className="font-semibold text-slate-900">{row.fullName}</p>
              <p className="text-sm text-slate-600">{row.email}</p>
              <p className="text-sm text-slate-700">
                {row.active ? "Enabled" : "Disabled"} · {phaseLabel(row.phase)}
              </p>
              <p className="text-sm text-slate-600">
                Email verification {row.verificationDelivery.toLowerCase()} ·
                Invitation {row.invitationDelivery.toLowerCase()}
              </p>
              {row.lastError && (
                <p className="text-sm text-red-700">
                  {errorLabel(row.lastError)}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {row.active &&
                ["VerifyEmail", "Invite", "Invited"].includes(row.phase) && (
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => void act(row, "resend")}
                  >
                    Resend
                  </Button>
                )}
              {row.active && row.phase === "ProvisionIdentity" && (
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => void act(row, "retry")}
                >
                  Retry provisioning
                </Button>
              )}
              {row.active && row.phase === "Activated" && (
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => void act(row, "reset-password")}
                >
                  Send password reset
                </Button>
              )}
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => void act(row, row.active ? "disable" : "enable")}
              >
                {row.active ? "Disable" : "Enable"}
              </Button>
            </div>
          </li>
        ))}
        {accounts.length === 0 && (
          <li className="p-4 text-sm text-slate-600">
            No managed accounts in this scope.
          </li>
        )}
      </ul>
    </div>
  );
}

function phaseLabel(value: string) {
  switch (value) {
    case "VerifyEmail":
      return "Awaiting email verification";
    case "ProvisionIdentity":
      return "Provisioning identity";
    case "Invite":
      return "Invitation pending";
    case "Invited":
      return "Invited";
    case "Activated":
      return "Signed in";
    default:
      return "Pending";
  }
}

function errorLabel(code: string) {
  if (code === "IDENTITY_CONFLICT")
    return "The provider identity could not be matched safely. Contact an administrator.";
  if (code === "VERIFICATION_DELIVERY_FAILED")
    return "Verification email delivery failed.";
  if (code === "INVITATION_DELIVERY_FAILED")
    return "Invitation delivery could not be confirmed.";
  return "The provider operation could not be confirmed.";
}

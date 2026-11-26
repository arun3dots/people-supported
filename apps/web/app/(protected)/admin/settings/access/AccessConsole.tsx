"use client";

import { useState, type FormEvent } from "react";
import type {
  AccessConsole as ConsoleData,
  AccessMember,
  AccessRole,
} from "@repo/schema";
import { Button, Checkbox, Input } from "@repo/ui/components/ui";
import {
  useAccessConsole,
  useAccessConsoleMutation,
} from "../../../../../lib/queries/role/accessConsole";

const labels: Record<string, string> = {
  "riskAssessments.read": "View risk assessments",
  "riskAssessments.write": "Create and edit risk assessments",
  "riskAssessments.delete": "Delete risk assessment drafts",
  "riskAssessments.approve": "Approve risk assessments",
  "riskAssessments.manageTemplates": "Manage risk assessment templates",
};

export function AccessConsole() {
  const query = useAccessConsole();
  const [roleKey, setRoleKey] = useState("");
  if (query.isPending) return <p role="status">Loading access settings…</p>;
  if (query.isError) {
    return (
      <div className="space-y-3">
        <p role="alert">{query.error.message}</p>
        <Button variant="outline" onClick={() => void query.refetch()}>
          Retry
        </Button>
      </div>
    );
  }
  const data = query.data;
  const role = data.roles.find((entry) => entry.key === roleKey);
  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-6">
      <h1 className="text-2xl font-bold text-slate-900">
        CantraCare Auth &amp; Access
      </h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-900">
            Roles and permissions
          </h2>
          <label className="block space-y-1">
            <span className="text-md font-medium text-slate-800">Role</span>
            <select
              className="w-full rounded-md border border-slate-300 bg-white p-2"
              value={roleKey}
              onChange={(event) => setRoleKey(event.target.value)}
            >
              <option value="">Create a role</option>
              {data.roles.map((entry) => (
                <option key={entry.key} value={entry.key}>
                  {entry.name}
                </option>
              ))}
            </select>
          </label>
          <RoleForm
            key={role ? `${role.key}/${role.version}` : "new"}
            role={role}
            data={data}
            onSaved={setRoleKey}
          />
        </section>
        <section className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-900">
            Application memberships
          </h2>
          {data.members.length === 0 && (
            <p className="text-sm text-slate-600">
              No linked users have access to this tenant.
            </p>
          )}
          {data.members.map((member) => (
            <MemberForm
              key={`${member.userId}/${member.version}`}
              member={member}
              data={data}
            />
          ))}
        </section>
      </div>
    </main>
  );
}

function RoleForm({
  role,
  data,
  onSaved,
}: {
  role?: AccessRole;
  data: ConsoleData;
  onSaved: (key: string) => void;
}) {
  const mutation = useAccessConsoleMutation();
  const [name, setName] = useState(role?.name ?? "");
  const [key, setKey] = useState(role?.key ?? "");
  const [permissions, setPermissions] = useState(role?.permissions ?? []);
  const editable = role?.editable ?? true;
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editable) return;
    const roleData = { name, permissions };
    mutation.mutate(
      role
        ? {
            action: "update",
            key: role.key,
            role: { ...roleData, version: role.version },
          }
        : { action: "create", role: { ...roleData, key } },
      { onSuccess: () => onSaved(key) },
    );
  }
  return (
    <form className="space-y-4" onSubmit={save}>
      <fieldset
        className="space-y-4"
        disabled={!editable || mutation.isPending}
      >
        <div className="grid gap-x-4 gap-y-1">
          <label className="space-y-1 text-md font-medium text-slate-800">
            Role name
            <Input
              required
              minLength={2}
              maxLength={80}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          {!role && (
            <label className="space-y-1 text-md font-medium text-slate-800">
              Role key
              <Input
                required
                pattern="[a-z][a-z0-9\-]{0,62}"
                title="Start with a lowercase letter and use lowercase letters, numbers, or hyphens."
                value={key}
                onChange={(event) => setKey(event.target.value)}
              />
            </label>
          )}
        </div>
        <fieldset className="space-y-2">
          <legend className="mb-2 text-md font-bold text-slate-800">
            Permissions
          </legend>
          {data.permissions.map((permission) => (
            <label
              key={permission}
              className="flex items-center gap-2 text-sm text-slate-800"
            >
              <Checkbox
                disabled={
                  !editable ||
                  !data.delegablePermissions.includes(permission) ||
                  mutation.isPending
                }
                checked={permissions.includes(permission)}
                onCheckedChange={(checked) =>
                  setPermissions((current) =>
                    checked === true
                      ? [...current, permission]
                      : current.filter((item) => item !== permission),
                  )
                }
              />
              {labels[permission] ?? permission}
            </label>
          ))}
        </fieldset>
        {editable && (
          <Button type="submit" size="lg">
            {mutation.isPending ? "Saving…" : "Save role"}
          </Button>
        )}
      </fieldset>
      {!editable && (
        <p className="text-sm text-slate-600">
          You have read-only access to this role.
        </p>
      )}
      {mutation.error && (
        <p role="alert" className="text-sm text-red-700">
          {mutation.error.message}
        </p>
      )}
    </form>
  );
}

function MemberForm({
  member,
  data,
}: {
  member: AccessMember;
  data: ConsoleData;
}) {
  const mutation = useAccessConsoleMutation();
  const [roleKey, setRoleKey] = useState(member.roleKey);
  const [enabled, setEnabled] = useState(member.enabled);
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!member.editable) return;
    mutation.mutate({
      action: "membership",
      id: member.userId,
      membership: { roleKey, enabled, version: member.version },
    });
  }
  return (
    <form className="space-y-2 border-t border-slate-100 pt-3" onSubmit={save}>
      <p className="break-all text-sm font-bold text-slate-800">
        {member.name ?? member.userId}
      </p>
      <fieldset
        className="space-y-2"
        disabled={!member.editable || mutation.isPending}
      >
        <label className="flex items-center gap-2 text-sm text-slate-800">
          Role
          <select
            className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white p-2"
            value={roleKey}
            onChange={(event) => setRoleKey(event.target.value)}
          >
            {data.roles
              .filter(
                (role) =>
                  role.key === member.roleKey ||
                  role.permissions.every((permission) =>
                    data.delegablePermissions.includes(permission),
                  ),
              )
              .map((role) => (
                <option key={role.key} value={role.key}>
                  {role.name}
                </option>
              ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-800">
          <Checkbox
            disabled={!member.editable || mutation.isPending}
            checked={enabled}
            onCheckedChange={(value) => setEnabled(value === true)}
          />
          Access enabled
        </label>
        {member.editable && (
          <Button
            type="submit"
            size="lg"
            variant="outline"
            disabled={roleKey === member.roleKey && enabled === member.enabled}
          >
            Save membership
          </Button>
        )}
      </fieldset>
      {mutation.error && (
        <p role="alert" className="text-sm text-red-700">
          {mutation.error.message}
        </p>
      )}
    </form>
  );
}

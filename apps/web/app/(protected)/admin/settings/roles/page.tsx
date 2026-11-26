import { UsersRolesPermissionsClient } from "./components/UsersRolesPermissionsClient";
import Link from "next/link";

export default function RolesPage() {
  return (
    <>
      {process.env.NEXT_PUBLIC_AUTH_ACCESS_CONSOLE_ENABLED === "true" && (
        <Link
          className="mb-3 inline-block text-sm font-medium text-slate-800 underline"
          href="/admin/settings/access"
        >
          Open CantraCare Auth &amp; Access
        </Link>
      )}
      <UsersRolesPermissionsClient />
    </>
  );
}

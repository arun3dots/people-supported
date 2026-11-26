import { Suspense } from "react";
import Link from "next/link";
import { StaffDirectory } from "./StaffDirectory";

export default function StaffPage() {
  return (
    <Suspense fallback={null}>
      {process.env.NEXT_PUBLIC_COGNITO_PROVISIONING_ENABLED === "true" && (
        <Link
          href="/admin/staff/managed-accounts"
          className="inline-block px-6 pt-4 font-medium text-slate-800 underline"
        >
          Invite and manage Cognito staff accounts
        </Link>
      )}
      <StaffDirectory />
    </Suspense>
  );
}

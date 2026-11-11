import { Suspense } from "react";
import { AuditLog } from "./AuditLog";

export const metadata = {
  title: "Audit Logs | Care Home",
  description: "View and manage system audit logs.",
};

export default function AuditLogPage() {
  return (
    <Suspense fallback={null}>
      <AuditLog />
    </Suspense>
  );
}

"use client";

import { useState } from "react";
import { Button, useToast, Text } from "@repo/ui/components/ui";
import { Plus } from "lucide-react";
import Link from "next/link";

import { useGetTenantsQuery } from "../../lib/queries/tenants";
import { TenantsToolbar, type TenantsView } from "./components/TenantsToolbar";
import { TenantsTable } from "./components/TenantsTable";
import { TenantCard } from "./components/TenantCard";

export default function TenantsPage() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<TenantsView>("list");

  const { toast } = useToast();
  const { data: tenants = [], isLoading } = useGetTenantsQuery();

  const copyVerificationLink = (token: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000";
    const link = `${baseUrl}/verify?token=${token}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link Copied",
      description: "Verification link has been copied to clipboard.",
    });
  };

  const query = search.toLowerCase();
  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(query) ||
      t.cqcNumber?.toLowerCase().includes(query) ||
      t.subdomain.toLowerCase().includes(query),
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <Text as="h1" size="xl" weight="bold" className="text-slate-900 tracking-tight">
            Registered Tenants
          </Text>
          <Text size="xs" weight="regular" variant="subdued" className="mt-1">
            Manage and monitor all care home environments globally.
          </Text>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/tenants/create">
            <Button variant="primary" className="flex items-center gap-2">
              <Plus className="size-4" />
              Onboard New Tenant
            </Button>
          </Link>
        </div>
      </div>

      <TenantsToolbar
        search={search}
        onSearchChange={setSearch}
        view={view}
        onViewChange={setView}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 bg-slate-100 animate-pulse rounded-3xl"
            />
          ))}
        </div>
      ) : view === "list" ? (
        <TenantsTable
          tenants={filteredTenants}
          onCopyVerificationLink={copyVerificationLink}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTenants.map((tenant) => (
            <TenantCard key={tenant.id} tenant={tenant} />
          ))}
        </div>
      )}
    </div>
  );
}

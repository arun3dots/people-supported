"use client";

import { Button, Input } from "@repo/ui/components/ui";
import { Search, Filter, LayoutGrid, List } from "lucide-react";

export type TenantsView = "list" | "grid";

interface TenantsToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  view: TenantsView;
  onViewChange: (view: TenantsView) => void;
}

export function TenantsToolbar({
  search,
  onSearchChange,
  view,
  onViewChange,
}: TenantsToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-surface-card-grey p-4 rounded-2xl">
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3.5 top-3 size-4 text-slate-400" />
        <Input
          placeholder="Search by name, CQC or domain..."
          className="pl-10"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
        <div className="flex border border-slate-200/80 rounded-xl p-0.5 bg-white">
          <Button
            variant={view === "list" ? "primary" : "ghost"}
            size="icon"
            className="size-8 rounded-lg"
            onClick={() => onViewChange("list")}
          >
            <List className="size-4" />
          </Button>
          <Button
            variant={view === "grid" ? "primary" : "ghost"}
            size="icon"
            className="size-8 rounded-lg"
            onClick={() => onViewChange("grid")}
          >
            <LayoutGrid className="size-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Filter className="size-3.5" />
          Filters
        </Button>
      </div>
    </div>
  );
}

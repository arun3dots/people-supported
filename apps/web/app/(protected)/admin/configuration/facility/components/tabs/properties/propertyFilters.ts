import type { SchemeItem } from "../../../../../../../../lib/types/facility";
import type { FilterDropdown } from "../../shared/FacilityFilterBar";

interface BuildPropertyFiltersArgs {
  schemeFilter: string;
  setSchemeFilter: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  unitTypeFilter: string;
  setUnitTypeFilter: (val: string) => void;
  safetyFilter: string;
  setSafetyFilter: (val: string) => void;
  allSchemes: SchemeItem[];
  onResetPage: () => void;
}

export function buildPropertyFilterDropdowns({
  schemeFilter,
  setSchemeFilter,
  statusFilter,
  setStatusFilter,
  unitTypeFilter,
  setUnitTypeFilter,
  safetyFilter,
  setSafetyFilter,
  allSchemes,
  onResetPage,
}: BuildPropertyFiltersArgs): FilterDropdown[] {
  return [
    {
      value: schemeFilter,
      onChange: (val) => {
        setSchemeFilter(val);
        onResetPage();
      },
      placeholder: "All Schemes",
      options: [
        { value: "All Schemes", label: "All Schemes" },
        ...allSchemes.map((s) => ({ value: s.id, label: s.name })),
      ],
    },
    {
      value: statusFilter,
      onChange: (val) => {
        setStatusFilter(val);
        onResetPage();
      },
      placeholder: "All Status",
      options: [
        { value: "All Status", label: "All Status" },
        { value: "Active", label: "Active" },
        { value: "Void", label: "Void" },
        { value: "Maintenance", label: "Under maintenance" },
      ],
    },
    {
      value: unitTypeFilter,
      onChange: (val) => {
        setUnitTypeFilter(val);
        onResetPage();
      },
      placeholder: "All Unit Types",
      options: [
        { value: "All Unit Types", label: "All Unit Types" },
        { value: "Self-contained flats", label: "Self-contained flats" },
        { value: "Cluster flats", label: "Cluster flats" },
        { value: "Shared house", label: "Shared house" },
        { value: "Bungalow", label: "Bungalow" },
      ],
    },
    {
      value: safetyFilter,
      onChange: (val) => {
        setSafetyFilter(val);
        onResetPage();
      },
      placeholder: "All Safety Evidence",
      options: [
        { value: "All Safety Evidence", label: "All Safety Evidence" },
        { value: "On track", label: "On track" },
        { value: "Due soon", label: "Due soon" },
        { value: "Overdue", label: "Overdue" },
      ],
    },
  ];
}

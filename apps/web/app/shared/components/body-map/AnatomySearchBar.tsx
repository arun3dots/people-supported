"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  X,
  User,
  Shield,
  Hand,
  Activity,
} from "lucide-react";
import {
  buildLocationLabel,
  type AnatomyNode,
} from "@repo/schema";

interface AnatomySearchBarProps {
  viewNodes: AnatomyNode[];
  onSelectNode: (node: AnatomyNode) => void;
}

const REGION_CONFIGS: Record<
  "head-neck" | "torso" | "upper-limb" | "lower-limb",
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    headerIconColor: string;
    countBadge: string;
    avatarBg: string;
    rowHighlight: string;
    matchedBadge: string;
  }
> = {
  "head-neck": {
    label: "Head & Neck",
    icon: User,
    headerIconColor: "text-emerald-600",
    countBadge: "bg-emerald-100 text-emerald-700",
    avatarBg: "bg-emerald-100 text-emerald-700 border-emerald-200",
    rowHighlight: "bg-emerald-50/80",
    matchedBadge: "text-emerald-600 bg-emerald-50 border-emerald-200/60",
  },
  torso: {
    label: "Torso",
    icon: Shield,
    headerIconColor: "text-indigo-600",
    countBadge: "bg-indigo-100 text-indigo-700",
    avatarBg: "bg-indigo-100 text-indigo-700 border-indigo-200",
    rowHighlight: "bg-indigo-50/80",
    matchedBadge: "text-indigo-600 bg-indigo-50 border-indigo-200/60",
  },
  "upper-limb": {
    label: "Upper Limbs",
    icon: Hand,
    headerIconColor: "text-sky-600",
    countBadge: "bg-sky-100 text-sky-700",
    avatarBg: "bg-sky-100 text-sky-700 border-sky-200",
    rowHighlight: "bg-sky-50/80",
    matchedBadge: "text-sky-600 bg-sky-50 border-sky-200/60",
  },
  "lower-limb": {
    label: "Lower Limbs",
    icon: Activity,
    headerIconColor: "text-purple-600",
    countBadge: "bg-purple-100 text-purple-700",
    avatarBg: "bg-purple-100 text-purple-700 border-purple-200",
    rowHighlight: "bg-purple-50/80",
    matchedBadge: "text-purple-600 bg-purple-50 border-purple-200/60",
  },
};

export function AnatomySearchBar({
  viewNodes,
  onSelectNode,
}: AnatomySearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Search filter
  const filteredNodes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return viewNodes.filter(
      (n) =>
        n.label.toLowerCase().includes(q) || n.id.toLowerCase().includes(q),
    );
  }, [searchQuery, viewNodes]);

  // Group filtered nodes by their region
  const groupedResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const order: ("head-neck" | "torso" | "upper-limb" | "lower-limb")[] = [
      "head-neck",
      "torso",
      "upper-limb",
      "lower-limb",
    ];

    const groups: {
      regionKey: "head-neck" | "torso" | "upper-limb" | "lower-limb";
      config: (typeof REGION_CONFIGS)["head-neck"];
      items: AnatomyNode[];
    }[] = [];

    for (const key of order) {
      const items = filteredNodes.filter((n) => n.region === key);
      if (items.length > 0) {
        groups.push({
          regionKey: key,
          config: REGION_CONFIGS[key],
          items,
        });
      }
    }

    return groups;
  }, [searchQuery, filteredNodes]);

  const flatResults = useMemo(() => {
    return groupedResults.flatMap((g) => g.items);
  }, [groupedResults]);

  // Click outside listener to dismiss dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || flatResults.length === 0) {
      if (e.key === "ArrowDown" && searchQuery.trim()) {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < flatResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flatResults.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < flatResults.length) {
        const target = flatResults[selectedIndex];
        if (target) {
          onSelectNode(target);
          setSearchQuery("");
          setIsOpen(false);
          setSelectedIndex(-1);
        }
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  return (
    <div ref={searchContainerRef} className="relative w-full">
      {/* Pill Search Input */}
      <div className="relative flex items-center w-full h-11 bg-white rounded-full px-4 gap-2.5 shadow-2xs border border-slate-200 hover:border-slate-300 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
        <Search className="w-4 h-4 text-slate-400 shrink-0 stroke-[2]" />
        <input
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => {
            if (searchQuery.trim()) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search anatomy (e.g. nail, knee, forehead)..."
          className="w-full h-full bg-transparent border-none text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0 p-0"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setIsOpen(false);
              setSelectedIndex(-1);
            }}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Floating Dropdown Overlay */}
      {isOpen && searchQuery.trim().length > 0 && (
        <div className="absolute top-[48px] left-0 w-full bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden z-50 animate-in fade-in-50 slide-in-from-top-2 duration-150">
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
            {flatResults.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm font-medium">
                No matching anatomical structure found for &quot;
                <span className="text-slate-800 font-semibold">{searchQuery}</span>
                &quot;
              </div>
            ) : (
              groupedResults.map((group) => {
                const { regionKey, config, items } = group;
                const Icon = config.icon;
                return (
                  <div key={regionKey}>
                    {/* Section Header */}
                    <div className="px-4 py-2 bg-slate-50/80 flex items-center justify-between border-b border-slate-100">
                      <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
                        <Icon className={`w-3.5 h-3.5 ${config.headerIconColor}`} />
                        {config.label}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${config.countBadge}`}
                      >
                        {items.length}
                      </span>
                    </div>

                    {/* Result items */}
                    {items.map((node) => {
                      const globalIdx = flatResults.findIndex((x) => x.id === node.id);
                      const isSelected = globalIdx === selectedIndex;
                      return (
                        <div
                          key={node.id}
                          onClick={() => {
                            onSelectNode(node);
                            setSearchQuery("");
                            setIsOpen(false);
                            setSelectedIndex(-1);
                          }}
                          onMouseEnter={() => setSelectedIndex(globalIdx)}
                          className={`px-4 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${isSelected ? config.rowHighlight : "hover:bg-slate-50"
                            }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border ${config.avatarBg}`}
                            >
                              {node.label.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-slate-900 truncate">
                                  {node.label}
                                </p>
                                <span className="text-[9px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded capitalize">
                                  {node.level}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                {buildLocationLabel(node.id)}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-medium border px-2 py-0.5 rounded-md shrink-0 ml-2 ${config.matchedBadge}`}
                          >
                            Matched by Name
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

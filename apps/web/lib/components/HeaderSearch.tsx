"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, X, User, UserCheck } from "lucide-react";
import { useGetResidentsQuery } from "../queries/residents/useGetResidentsQuery";
import { useGetStaffQuery } from "../queries/staff/useGetStaffQuery";
import { useAuth } from "../context/AuthContext";
import { Resident } from "../types/resident";
import { StaffMember } from "../types/staff";

interface MatchDetail {
  type: "resident" | "staff";
  id: string;
  title: string;
  subtitle: string;
  matchedBy: string;
  badge: string;
  photoUrl?: string;
  rawItem: Resident | StaffMember;
}

export function HeaderSearch() {
  const router = useRouter();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: residents = [] } = useGetResidentsQuery();
  const { data: staffList = [] } = useGetStaffQuery();

  const roleBase =
    user?.roleName?.toLowerCase() === "admin" || user?.roleName?.toLowerCase() === "manager"
      ? "admin"
      : "carer";

  // Filter residents and staff based on query
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { residents: [] as MatchDetail[], staff: [] as MatchDetail[] };

    const cleanQ = q.replace(/[\s-]/g, "");

    const matchedResidents: MatchDetail[] = [];
    residents.forEach((r) => {
      let matchedBy = "";
      const fullName = r.fullName.toLowerCase();
      const nhs = (r.nhsNumber || "").toLowerCase().replace(/[\s-]/g, "");
      const resId = r.id.toLowerCase();
      const phone = (r.careProfile?.communityNursePhone || "").toLowerCase().replace(/[\s-]/g, "");
      const firstName = (r.profile?.firstName || "").toLowerCase();
      const lastName = (r.profile?.lastName || "").toLowerCase();
      const prefName = (r.profile?.preferredName || "").toLowerCase();

      if (fullName.includes(q) || firstName.includes(q) || lastName.includes(q) || prefName.includes(q)) {
        matchedBy = "Matched by Name";
      } else if (cleanQ.length >= 3 && nhs.includes(cleanQ)) {
        matchedBy = `NHS ID: ${r.nhsNumber}`;
      } else if (cleanQ.length >= 3 && resId.includes(cleanQ)) {
        matchedBy = `Resident ID: ${r.id.slice(0, 8)}...`;
      } else if (cleanQ.length >= 3 && phone.includes(cleanQ)) {
        matchedBy = `Phone: ${r.careProfile?.communityNursePhone}`;
      }

      if (matchedBy) {
        const roomInfo = r.bed?.room?.roomNumber ? `Room ${r.bed.room.roomNumber}` : "Unassigned";
        matchedResidents.push({
          type: "resident",
          id: r.id,
          title: r.fullName,
          subtitle: `${roomInfo} • ${r.status}`,
          matchedBy,
          badge: "Resident",
          photoUrl: r.photoUrl,
          rawItem: r,
        });
      }
    });

    const matchedStaff: MatchDetail[] = [];
    staffList.forEach((s) => {
      let matchedBy = "";
      const fullName = s.fullName.toLowerCase();
      const email = s.email.toLowerCase();
      const phone = (s.phoneNumber || "").toLowerCase().replace(/[\s-]/g, "");
      const staffId = s.id.toLowerCase();
      const ni = (s.niNumber || "").toLowerCase().replace(/[\s-]/g, "");
      const dbs = (s.dbsNumber || "").toLowerCase().replace(/[\s-]/g, "");
      const roleName = (s.role?.name || "").toLowerCase();

      if (fullName.includes(q)) {
        matchedBy = "Matched by Name";
      } else if (email.includes(q)) {
        matchedBy = `Email: ${s.email}`;
      } else if (cleanQ.length >= 3 && phone.includes(cleanQ)) {
        matchedBy = `Phone: ${s.phoneNumber}`;
      } else if (cleanQ.length >= 3 && staffId.includes(cleanQ)) {
        matchedBy = `Employee ID: ${s.id.slice(0, 8)}...`;
      } else if (cleanQ.length >= 3 && ni.includes(cleanQ)) {
        matchedBy = `NI: ${s.niNumber}`;
      } else if (cleanQ.length >= 3 && dbs.includes(cleanQ)) {
        matchedBy = `DBS: ${s.dbsNumber}`;
      } else if (roleName.includes(q)) {
        matchedBy = `Role: ${s.role?.name}`;
      }

      if (matchedBy) {
        matchedStaff.push({
          type: "staff",
          id: s.id,
          title: s.fullName,
          subtitle: `${s.role?.name || "Staff"} • ${s.email}`,
          matchedBy,
          badge: s.role?.name || "Staff",
          photoUrl: s.avatarUrl,
          rawItem: s,
        });
      }
    });

    return { residents: matchedResidents, staff: matchedStaff };
  }, [query, residents, staffList]);

  const combinedResults = useMemo(() => {
    return [...results.residents, ...results.staff];
  }, [results]);

  // Click outside listener to dismiss dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item: MatchDetail) => {
    setIsOpen(false);
    setQuery("");
    setSelectedIndex(-1);

    if (item.type === "resident") {
      router.push(`/${roleBase}/residents/${item.id}`);
    } else {
      router.push(`/admin/staff/${item.id}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || combinedResults.length === 0) {
      if (e.key === "ArrowDown" && query.trim()) {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < combinedResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : combinedResults.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < combinedResults.length) {
        const targetItem = combinedResults[selectedIndex];
        if (targetItem) {
          handleSelect(targetItem);
        }
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  const totalMatches = results.residents.length + results.staff.length;

  return (
    <div ref={containerRef} className="relative w-full max-w-[621px]">
      <div className="relative flex items-center w-full h-[64px] bg-white rounded-[50px] px-[20px] gap-[10px] shadow-sm border border-transparent focus-within:border-emerald-500/40 focus-within:shadow-md transition-all">
        <Search className="w-[24px] h-[24px] text-slate-400 stroke-[2] shrink-0" />
        <input
          type="text"
          name="global_search_no_autofill"
          id="global_search_input"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          suppressHydrationWarning
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search by name, mobile, email, staff/resident ID, NHS ID..."
          className="w-full h-full bg-transparent border-none text-md leading-[16px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0 p-0"
        />
        {query && (
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => {
              setQuery("");
              setIsOpen(false);
              setSelectedIndex(-1);
            }}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors shrink-0"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute top-[72px] left-0 w-full bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden z-50 animate-in fade-in-50 slide-in-from-top-2 duration-150">
          <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100">
            {totalMatches === 0 ? (
              <div className="p-6 text-center text-slate-500 text-md font-medium">
                No matching residents or staff found for &quot;<span className="text-slate-800 font-semibold">{query}</span>&quot;
              </div>
            ) : (
              <>
                {/* Residents Section */}
                {results.residents.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-slate-50/80 flex items-center justify-between border-b border-slate-100">
                      <span className="text-md font-bold tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-emerald-600" />
                        Residents
                      </span>
                      <span className="text-md font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                        {results.residents.length}
                      </span>
                    </div>
                    {results.residents.map((item) => {
                      const globalIdx = combinedResults.findIndex((x) => x.type === item.type && x.id === item.id);
                      const isSelected = globalIdx === selectedIndex;
                      return (
                        <div
                          key={`res-${item.id}`}
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setSelectedIndex(globalIdx)}
                          className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected ? "bg-emerald-50/80" : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-md shrink-0 overflow-hidden border border-emerald-200">
                              {item.photoUrl ? (
                                <img src={item.photoUrl} alt={item.title} className="w-full h-full object-cover" />
                              ) : (
                                item.title.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-md font-semibold text-slate-900 truncate">{item.title}</p>
                                <span className="text-md font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                  {item.badge}
                                </span>
                              </div>
                              <p className="text-md text-slate-500 truncate mt-0.5">{item.subtitle}</p>
                            </div>
                          </div>
                          <span className="text-md font-medium text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md shrink-0 ml-2">
                            {item.matchedBy}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Staff Section */}
                {results.staff.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-slate-50/80 flex items-center justify-between border-b border-slate-100">
                      <span className="text-md font-bold tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                        Staff Members
                      </span>
                      <span className="text-md font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                        {results.staff.length}
                      </span>
                    </div>
                    {results.staff.map((item) => {
                      const globalIdx = combinedResults.findIndex((x) => x.type === item.type && x.id === item.id);
                      const isSelected = globalIdx === selectedIndex;
                      return (
                        <div
                          key={`staff-${item.id}`}
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setSelectedIndex(globalIdx)}
                          className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected ? "bg-indigo-50/80" : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-md shrink-0 overflow-hidden border border-indigo-200">
                              {item.photoUrl ? (
                                <img src={item.photoUrl} alt={item.title} className="w-full h-full object-cover" />
                              ) : (
                                item.title.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-md font-semibold text-slate-900 truncate">{item.title}</p>
                                <span className="text-md font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-1.5 py-0.5 rounded">
                                  {item.badge}
                                </span>
                              </div>
                              <p className="text-md text-slate-500 truncate mt-0.5">{item.subtitle}</p>
                            </div>
                          </div>
                          <span className="text-md font-medium text-indigo-600 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-md shrink-0 ml-2">
                            {item.matchedBy}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

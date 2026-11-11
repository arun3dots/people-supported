"use client";

import { useGetActiveShiftQuery } from "../queries/shifts";
import { useAuth } from "../context/AuthContext";
import { Clock, MapPin, ArrowRight } from "lucide-react";
import { Badge } from "@repo/ui/components/ui";
import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { formatUkDate, formatUkTime } from "../utils/uk-date-time";

function parseShiftDate(rawDate?: string | Date | null, timeStr?: string | Date | null): Date | null {
  if (rawDate) {
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) return d;
  }
  if (timeStr) {
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function formatShiftTime(rawDate?: string | Date | null, timeStr?: string | Date | null): string {
  const d = parseShiftDate(rawDate, timeStr);
  if (d) {
    return formatUkTime(d);
  }
  return timeStr ? String(timeStr) : "";
}

function formatShiftStart(rawDate?: string | Date | null, timeStr?: string | Date | null): string {
  const d = parseShiftDate(rawDate, timeStr);
  if (d) {
    return `${formatUkDate(d, { month: "short", day: "numeric" })}, ${formatUkTime(d)}`;
  }
  return timeStr ? String(timeStr) : "";
}

export function ActiveShiftIndicator() {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useGetActiveShiftQuery({
    enabled: !!user && ["CARER", "NURSE"].includes(user.roleName.toUpperCase()),
  });

  useGSAP(() => {
    if (data && containerRef.current) {
      gsap.fromTo(containerRef.current, 
        { height: 0, opacity: 0 },
        { height: "auto", opacity: 1, duration: 0.5, ease: "power2.out" }
      );
    }
  }, [data]);

  if (isLoading || !data) return null;

  const { active, next } = data;
  const shift = active || next;

  if (!shift) return null;

  const isActive = !!active;

  return (
    <div
      ref={containerRef}
      className="bg-primary/5 border-b border-primary/10 overflow-hidden w-full"
    >
      <div className="w-full px-4 sm:px-8 lg:px-12 py-2 flex items-center justify-between text-sm sm:text-sm">
        <div className="flex items-center gap-4 flex-1">
          <Badge variant={isActive ? "success" : "secondary"} className="shrink-0">
            {isActive ? "Ongoing Shift" : "Next Shift"}
          </Badge>
          
          <div className="flex items-center gap-4 text-muted-foreground overflow-hidden">
            <div className="flex items-center gap-1.5 shrink-0">
              <Clock className="size-3.5 text-primary" />
              <span className="font-medium text-foreground">
                {formatShiftTime(shift.rawStartTime, shift.startTime)}
                {shift.endTime ? ` - ${formatShiftTime(shift.rawEndTime, shift.endTime)}` : ""}
              </span>
            </div>

            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="size-3.5 text-primary" />
              <span className="truncate">
                {shift.unit?.name || "All Units"} {shift.wing?.name ? `• ${shift.wing.name}` : ""}
              </span>
            </div>

            {shift.type && (
              <div className="hidden md:flex items-center gap-1.5 shrink-0">
                <Badge variant="outline" className="text-[10px] py-0 border-primary/20 bg-primary/5">
                  {shift.type.name}
                </Badge>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isActive && (
            <span className="text-[10px] text-muted-foreground hidden lg:inline">
              Starts {formatShiftStart(shift.rawStartTime, shift.startTime)}
            </span>
          )}
          <Link 
            href={user?.roleName.toLowerCase() === 'carer' ? '/carer/rota' : '/nurse/rota'} 
            className="text-primary hover:text-primary/80 font-semibold flex items-center gap-1 group transition-colors ml-4"
          >
            View Rota <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

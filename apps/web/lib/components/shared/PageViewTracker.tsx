"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { makeAPICall } from "../../api";

export function PageViewTracker() {
  const pathname = usePathname();
  // Strict Mode double-invokes this effect on mount in dev; the ref is set
  // synchronously so the second invocation is a no-op (one PAGE_VIEW per pathname).
  const lastReportedPath = useRef<string | null>(null);
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        window.location.reload();
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);
  useEffect(() => {
    if (!pathname) return;
    if (lastReportedPath.current === pathname) return;
    lastReportedPath.current = pathname;

    // Fire and forget logging
    const logPageView = async () => {
      try {
        // Only log meaningful paths (exclude assets, etc.)
        if (
          pathname.startsWith("/_next") ||
          pathname.includes("favicon.ico") ||
          pathname === "/login"
        ) {
          return;
        }

        await makeAPICall("logPageView", {
          path: pathname,
          pageName: getPageName(pathname),
        });
      } catch (error) {
        // Silently fail to not interrupt user experience
        console.error("Failed to log page view:", error);
      }
    };

    logPageView();
  }, [pathname]);

  return null;
}

function getPageName(path: string): string {
  // Simple heuristic to get a readable page name
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 0) return "Home";

  return segments
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " "))
    .join(" > ");
}

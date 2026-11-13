"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import { MapPin, Plus } from "lucide-react";
import {
  type AnatomyNode,
  type BodyMapVariantType,
  type ExactPointDTO,
  ANATOMY_BY_ID,
  buildLocationLabel,
  getAnatomyAncestors,
} from "@repo/schema";
import { type FindingMarkerItem } from "./FindingMarker";
import { SEVERITY_COLORS } from "./body-map-zones";

export type BodyMapInteractionMode = "navigate" | "mark-exact";

interface BodyMapCanvasProps {
  view: "Front" | "Back";
  onViewChange?: (view: "Front" | "Back") => void;
  variant: BodyMapVariantType;
  mode: BodyMapInteractionMode;
  onModeChange: (mode: BodyMapInteractionMode) => void;
  selectedNode: AnatomyNode | null;
  onSelectNode: (node: AnatomyNode | null) => void;
  findings: FindingMarkerItem[];
  onMarkerClick: (findings: FindingMarkerItem[]) => void;
  activeExactPoint?: ExactPointDTO | null;
  onSelectExactPoint?: (node: AnatomyNode, point: ExactPointDTO | null) => void;
  onClearPin?: () => void;
  onOpenAddFinding?: (node: AnatomyNode, point?: ExactPointDTO) => void;
  canEdit?: boolean;
}

interface ParsedViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function BodyMapCanvas({
  view,
  onViewChange,
  variant,
  mode,
  onModeChange,
  selectedNode,
  onSelectNode,
  findings,
  onMarkerClick,
  activeExactPoint,
  onSelectExactPoint,
  onClearPin,
  onOpenAddFinding,
  canEdit = true,
}: BodyMapCanvasProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<AnatomyNode | null>(null);
  const [isDraggingPin, setIsDraggingPin] = useState<boolean>(false);
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const [pinPixelPos, setPinPixelPos] = useState<{ x: number; y: number } | null>(null);

  // Native SVG dimension coordinates based on variant and view
  const defaultDimensions = useMemo<ParsedViewBox>(() => {
    if (view === "Front") {
      return variant === "female"
        ? { x: 0, y: 0, w: 262, h: 533 }
        : { x: 0, y: 0, w: 294, h: 545 };
    } else {
      return variant === "female"
        ? { x: 0, y: 0, w: 302, h: 523 }
        : { x: 0, y: 0, w: 283, h: 524 };
    }
  }, [view, variant]);

  const [currentViewBox, setCurrentViewBox] = useState<ParsedViewBox>(defaultDimensions);

  // 1. Fetch SVG Asset
  useEffect(() => {
    let isMounted = true;
    const fetchSvg = async () => {
      try {
        const res = await fetch(
          `/assets/body-map/${variant}/${view.toLowerCase()}.svg`,
        );
        if (res.ok) {
          const text = await res.text();
          if (isMounted) setSvgContent(text);
        }
      } catch (err) {
        console.error("Failed to load body map SVG asset:", err);
      }
    };
    fetchSvg();
    return () => {
      isMounted = false;
    };
  }, [variant, view]);

  // 2. Mount SVG markup directly into container with strict height-based containment
  useEffect(() => {
    if (!containerRef.current || !svgContent) return;
    containerRef.current.innerHTML = svgContent;
    const svg = containerRef.current.querySelector("svg");
    if (svg) {
      svg.removeAttribute("width");
      svg.removeAttribute("height");
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      svg.setAttribute(
        "viewBox",
        `${currentViewBox.x} ${currentViewBox.y} ${currentViewBox.w} ${currentViewBox.h}`,
      );
      svg.style.height = "100%";
      svg.style.maxHeight = "460px";
      svg.style.width = "auto";
      svg.style.maxWidth = "100%";
      svg.style.display = "block";
      svg.style.margin = "0 auto";
    }
  }, [svgContent]);

  // Reset viewBox on view switch
  useEffect(() => {
    setCurrentViewBox(defaultDimensions);
  }, [view, defaultDimensions]);

  // 3. Aspect-Ratio Aware Target ViewBox Calculation (Never crops target)
  const targetViewBox = useMemo<ParsedViewBox>(() => {
    if (!selectedNode || !containerRef.current) {
      return defaultDimensions;
    }

    const svg = containerRef.current.querySelector("svg");
    if (!svg) return defaultDimensions;

    const targetEl = svg.querySelector(
      `[data-anatomy-id="${selectedNode.id}"]`,
    ) as SVGGraphicsElement | null;

    if (!targetEl || typeof targetEl.getBBox !== "function") {
      return defaultDimensions;
    }

    try {
      const bbox = targetEl.getBBox();
      if (bbox.width <= 0 || bbox.height <= 0) return defaultDimensions;

      const containerW = containerRef.current.clientWidth || 320;
      const containerH = containerRef.current.clientHeight || 460;
      const containerAspect = containerW / containerH;

      const padding = Math.max(14, Math.max(bbox.width, bbox.height) * 0.35);
      let targetW = bbox.width + padding * 2;
      let targetH = bbox.height + padding * 2;
      const targetCenterX = bbox.x + bbox.width / 2;
      const targetCenterY = bbox.y + bbox.height / 2;

      const currentTargetAspect = targetW / targetH;
      if (currentTargetAspect > containerAspect) {
        targetH = targetW / containerAspect;
      } else {
        targetW = targetH * containerAspect;
      }

      targetW = Math.min(targetW, defaultDimensions.w);
      targetH = Math.min(targetH, defaultDimensions.h);

      let x = targetCenterX - targetW / 2;
      let y = targetCenterY - targetH / 2;
      x = Math.max(0, Math.min(x, defaultDimensions.w - targetW));
      y = Math.max(0, Math.min(y, defaultDimensions.h - targetH));

      return {
        x: Math.round(x),
        y: Math.round(y),
        w: Math.round(targetW),
        h: Math.round(targetH),
      };
    } catch {
      return defaultDimensions;
    }
  }, [selectedNode, defaultDimensions]);

  // 4. Smooth Animated ViewBox Transition
  useEffect(() => {
    if (!containerRef.current) return;
    const svg = containerRef.current.querySelector("svg");
    if (!svg) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setCurrentViewBox(targetViewBox);
      svg.setAttribute(
        "viewBox",
        `${targetViewBox.x} ${targetViewBox.y} ${targetViewBox.w} ${targetViewBox.h}`,
      );
      return;
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    const startX = currentViewBox.x;
    const startY = currentViewBox.y;
    const startW = currentViewBox.w;
    const startH = currentViewBox.h;

    const diffX = targetViewBox.x - startX;
    const diffY = targetViewBox.y - startY;
    const diffW = targetViewBox.w - startW;
    const diffH = targetViewBox.h - startH;

    const duration = 280;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);

      const nextBox: ParsedViewBox = {
        x: Math.round(startX + diffX * ease),
        y: Math.round(startY + diffY * ease),
        w: Math.round(startW + diffW * ease),
        h: Math.round(startH + diffH * ease),
      };

      setCurrentViewBox(nextBox);
      svg.setAttribute(
        "viewBox",
        `${nextBox.x} ${nextBox.y} ${nextBox.w} ${nextBox.h}`,
      );

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      }
    };

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [targetViewBox]);

  const isZoomed =
    currentViewBox.w < defaultDimensions.w * 0.95 ||
    currentViewBox.h < defaultDimensions.h * 0.95;

  // 5. Delegated Event Handling & Modes
  useEffect(() => {
    if (!containerRef.current || !svgContent) return;

    const svg = containerRef.current.querySelector("svg");
    if (!svg) return;

    svg.querySelectorAll("[data-selected]").forEach((el) => {
      el.removeAttribute("data-selected");
      (el as HTMLElement).style.fill = "";
      (el as HTMLElement).style.stroke = "";
      (el as HTMLElement).style.strokeWidth = "";
    });

    if (selectedNode) {
      const targetEl = svg.querySelector(`[data-anatomy-id="${selectedNode.id}"]`);
      if (targetEl) {
        targetEl.setAttribute("data-selected", "true");
        (targetEl as HTMLElement).style.fill = "#93C5FD";
        (targetEl as HTMLElement).style.stroke = "#2563EB";
        (targetEl as HTMLElement).style.strokeWidth = "2px";
      }
    }

    const interactiveElements = svg.querySelectorAll<SVGGraphicsElement>(
      "[data-interactive='true'][data-anatomy-id]",
    );

    interactiveElements.forEach((el) => {
      const aid = el.getAttribute("data-anatomy-id");
      const node = aid ? ANATOMY_BY_ID.get(aid) : null;
      if (node) {
        el.setAttribute("tabindex", "0");
        el.setAttribute("role", "button");
        // SVG focus outlines use the element's rectangular bounding box,
        // which appears as a misleading black ring around the anatomy.
        el.style.outline = "none";
        el.style.outlineWidth = "0";
        el.setAttribute(
          "aria-label",
          selectedNode
            ? `Mark or move finding pin on ${node.label}`
            : `Focus on ${node.label}`,
        );
        el.style.cursor = selectedNode || mode === "mark-exact" ? "crosshair" : "pointer";
      }
    });

    const resolveDeepestTarget = (e: MouseEvent | PointerEvent) => {
      const elementsUnderPointer = document.elementsFromPoint(e.clientX, e.clientY);
      for (const el of elementsUnderPointer) {
        const interactive = el.closest(
          "[data-interactive='true'][data-anatomy-id]",
        ) as SVGGraphicsElement | null;
        if (interactive) {
          const aid = interactive.getAttribute("data-anatomy-id");
          if (aid && ANATOMY_BY_ID.has(aid)) {
            return { element: interactive, node: ANATOMY_BY_ID.get(aid)! };
          }
        }
      }
      return null;
    };

    // Single delegated pointerdown handler with seamless tap-to-reposition
    const handlePointerDown = (e: MouseEvent | PointerEvent) => {
      const match = resolveDeepestTarget(e);
      if (!match) return;

      e.stopPropagation();
      const { element: targetEl, node } = match;

      const isInsideAnatomy = (svgPoint: DOMPoint) => {
        const geometry = targetEl as SVGGeometryElement;
        return typeof geometry.isPointInFill === "function"
          ? geometry.isPointInFill(svgPoint)
          : true;
      };

      const placeExactPin = () => {
        if (typeof svg.createSVGPoint === "function") {
          const pt = svg.createSVGPoint();
          pt.x = e.clientX;
          pt.y = e.clientY;
          const ctm = svg.getScreenCTM();
          if (ctm) {
            const svgP = pt.matrixTransform(ctm.inverse());
            try {
              const bbox = targetEl.getBBox();
              if (bbox.width > 0 && bbox.height > 0) {
                const relX = Math.max(0, Math.min(1, (svgP.x - bbox.x) / bbox.width));
                const relY = Math.max(0, Math.min(1, (svgP.y - bbox.y) / bbox.height));
                const exactPoint: ExactPointDTO = {
                  coordinateSpace: "anatomy-bbox",
                  x: Math.round(relX * 1000) / 1000,
                  y: Math.round(relY * 1000) / 1000,
                };
                onSelectExactPoint?.(node, exactPoint);
                setLiveAnnouncement(
                  activeExactPoint
                    ? `Pin repositioned on ${node.label}.`
                    : `Exact location marked on ${node.label}.`,
                );
              }
            } catch {
              // Ignore point evaluation errors on unmounted elements
            }
          }
        }
      };

      if (!selectedNode) {
        // Step 1: Click from full body zooms in and primes pin mode
        onSelectNode(node);
        onModeChange("mark-exact");
        setLiveAnnouncement(`Focused on ${node.label}. Tap anywhere on this area or drag to position the pin.`);
      } else {
        // Step 2: Already focused on anatomy - directly place or reposition pin at clicked spot
        onSelectNode(node);
        if (mode !== "mark-exact") {
          onModeChange("mark-exact");
        }
        placeExactPin();
      }
    };

    const handlePointerOver = (e: MouseEvent | PointerEvent) => {
      const match = resolveDeepestTarget(e);
      if (match) {
        setHoveredNode(match.node);
      }
    };

    const handlePointerOut = (e: MouseEvent | PointerEvent) => {
      const target = (e.target as Element).closest(
        "[data-interactive='true'][data-anatomy-id]",
      );
      if (target) {
        setHoveredNode(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        const target = (e.target as Element).closest(
          "[data-interactive='true'][data-anatomy-id]",
        ) as SVGGraphicsElement | null;
        if (target) {
          const aid = target.getAttribute("data-anatomy-id");
          if (aid && ANATOMY_BY_ID.has(aid)) {
            e.preventDefault();
            const node = ANATOMY_BY_ID.get(aid)!;
            if (!selectedNode) {
              onSelectNode(node);
              onModeChange("mark-exact");
              setLiveAnnouncement(`Focused on ${node.label}. Press Enter to place pin.`);
            } else {
              onSelectNode(node);
              if (mode !== "mark-exact") onModeChange("mark-exact");
              const exactPoint: ExactPointDTO = {
                coordinateSpace: "anatomy-bbox",
                x: 0.5,
                y: 0.5,
              };
              onSelectExactPoint?.(node, exactPoint);
              setLiveAnnouncement(`Pin placed at center of ${node.label}.`);
            }
          }
        }
      } else if (e.key === "Escape") {
        onSelectNode(null);
        onModeChange("navigate");
        setLiveAnnouncement("Returned to full body.");
      }
    };

    svg.addEventListener("pointerdown", handlePointerDown);
    svg.addEventListener("pointerover", handlePointerOver);
    svg.addEventListener("pointerout", handlePointerOut);
    svg.addEventListener("keydown", handleKeyDown);

    return () => {
      svg.removeEventListener("pointerdown", handlePointerDown);
      svg.removeEventListener("pointerover", handlePointerOver);
      svg.removeEventListener("pointerout", handlePointerOut);
      svg.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    svgContent,
    mode,
    selectedNode,
    activeExactPoint,
    onSelectNode,
    onSelectExactPoint,
    onModeChange,
  ]);

  // 6. Findings & Persistent Pin Layer Sync (Includes full drag-and-drop support)
  useEffect(() => {
    if (!containerRef.current || !svgContent) return;
    const svg = containerRef.current.querySelector("svg");
    if (!svg) return;

    // Always remove existing active pin from the DOM first
    const existingPins = svg.querySelectorAll("#active-body-map-pin");
    existingPins.forEach((el) => el.remove());

    let findingsLayer = svg.querySelector("#body-map-findings-layer");
    if (!findingsLayer) {
      findingsLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
      findingsLayer.setAttribute("id", "body-map-findings-layer");
      svg.appendChild(findingsLayer);
    } else {
      while (findingsLayer.firstChild) {
        findingsLayer.removeChild(findingsLayer.firstChild);
      }
    }

    // Render Saved Historical Findings with resilient anatomical fallback
    findings.forEach((f) => {
      if (f.view !== view) return;

      // 1. Direct match on anatomy ID
      let targetEl = svg.querySelector(
        `[data-anatomy-id="${f.anatomyId}"]`,
      ) as SVGGraphicsElement | null;

      // 2. Resilient Fallback: If SVG geometry changed or simplified, lookup parent/ancestor anatomy node
      if (!targetEl && f.anatomyId) {
        const ancestors = getAnatomyAncestors(f.anatomyId);
        // Traverse upwards to find the closest ancestor node present in the SVG
        for (let i = ancestors.length - 1; i >= 0; i--) {
          const ancestorId = ancestors[i]?.id;
          if (ancestorId && ancestorId !== f.anatomyId) {
            const fallbackEl = svg.querySelector(
              `[data-anatomy-id="${ancestorId}"]`,
            ) as SVGGraphicsElement | null;
            if (fallbackEl) {
              targetEl = fallbackEl;
              break;
            }
          }
        }
      }

      if (!targetEl || typeof targetEl.getBBox !== "function") return;

      try {
        const bbox = targetEl.getBBox();
        // Safe relative normalized coordinate calculation (0.0 to 1.0 clamped)
        const relX = f.exactX != null ? Math.max(0, Math.min(1, f.exactX)) : 0.5;
        const relY = f.exactY != null ? Math.max(0, Math.min(1, f.exactY)) : 0.5;

        const posX = bbox.x + relX * bbox.width;
        const posY = bbox.y + relY * bbox.height;

        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("transform", `translate(${posX}, ${posY})`);
        g.setAttribute("class", "cursor-pointer");
        g.setAttribute("role", "button");
        g.setAttribute("aria-label", `Finding: ${f.findingType} on ${f.locationLabel}`);

        const hasOpen = f.status === "Open";
        const sevColor = SEVERITY_COLORS[f.severity] || "#EF4444";

        if (hasOpen) {
          const pulse = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          pulse.setAttribute("r", "10");
          pulse.setAttribute("fill", sevColor);
          pulse.setAttribute("opacity", "0.4");
          pulse.setAttribute("class", "animate-ping");
          g.appendChild(pulse);
        }

        const pin = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        pin.setAttribute("r", "5.5");
        pin.setAttribute("fill", sevColor);
        pin.setAttribute("stroke", "#FFFFFF");
        pin.setAttribute("stroke-width", "1.5");
        g.appendChild(pin);

        g.addEventListener("pointerdown", (ev) => {
          ev.stopPropagation();
          onMarkerClick([f]);
        });

        findingsLayer.appendChild(g);
      } catch {
        // Ignore individual finding marker rendering errors
      }
    });

    // If no pin is active, stop after rendering historical findings
    if (!selectedNode || !activeExactPoint) {
      setPinPixelPos(null);
      return;
    }

    // Render Active Pending Pin with Direct Drag & Drop Handle
    const targetEl = svg.querySelector(
      `[data-anatomy-id="${selectedNode.id}"]`,
    ) as SVGGraphicsElement | null;

    if (targetEl && typeof targetEl.getBBox === "function") {
      try {
        const bbox = targetEl.getBBox();
        const renderX = bbox.x + activeExactPoint.x * bbox.width;
        const renderY = bbox.y + activeExactPoint.y * bbox.height;

        // Calculate viewport pixel position for interactive floating tooltip
        const updatePinPixelPos = () => {
          if (!viewportRef.current || typeof svg.createSVGPoint !== "function") return;
          const pt = svg.createSVGPoint();
          pt.x = renderX;
          pt.y = renderY;
          const ctm = svg.getScreenCTM();
          if (ctm) {
            const screenPt = pt.matrixTransform(ctm);
            const vRect = viewportRef.current.getBoundingClientRect();
            setPinPixelPos({
              x: Math.round(screenPt.x - vRect.left),
              y: Math.round(screenPt.y - vRect.top),
            });
          }
        };
        updatePinPixelPos();

        const pinGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        pinGroup.setAttribute("id", "active-body-map-pin");
        pinGroup.setAttribute("transform", `translate(${renderX}, ${renderY})`);
        pinGroup.setAttribute("role", "button");
        pinGroup.setAttribute("aria-label", "Finding pin. Drag or tap to reposition.");

        // Outer pulse ripple
        const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        ring.setAttribute("r", "14");
        ring.setAttribute("fill", "#2563EB");
        ring.setAttribute("opacity", "0.3");
        ring.setAttribute("class", "animate-ping pointer-events-none");
        pinGroup.appendChild(ring);

        // Center pin head
        const pinBody = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        pinBody.setAttribute("r", "7");
        pinBody.setAttribute("fill", "#2563EB");
        pinBody.setAttribute("stroke", "#FFFFFF");
        pinBody.setAttribute("stroke-width", "2");
        pinBody.setAttribute("class", "pointer-events-none");
        pinGroup.appendChild(pinBody);

        // Center target dot
        const pinCore = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        pinCore.setAttribute("r", "2.5");
        pinCore.setAttribute("fill", "#FFFFFF");
        pinCore.setAttribute("class", "pointer-events-none");
        pinGroup.appendChild(pinCore);

        // Interactive Grab / Drag Touch Handle (generous 36px touch zone)
        const hitTarget = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        hitTarget.setAttribute("r", "18");
        hitTarget.setAttribute("fill", "transparent");
        hitTarget.setAttribute("pointer-events", "all");
        hitTarget.setAttribute("cursor", "grab");
        hitTarget.setAttribute("title", "Drag to reposition pin");

        // Drag-and-Drop Handler
        hitTarget.addEventListener("pointerdown", (downEv) => {
          downEv.stopPropagation();
          hitTarget.setPointerCapture(downEv.pointerId);
          hitTarget.style.cursor = "grabbing";
          setIsDraggingPin(true);

          const onPointerMove = (moveEv: PointerEvent) => {
            if (typeof svg.createSVGPoint !== "function") return;
            const pt = svg.createSVGPoint();
            pt.x = moveEv.clientX;
            pt.y = moveEv.clientY;
            const ctm = svg.getScreenCTM();
            if (!ctm) return;
            const svgP = pt.matrixTransform(ctm.inverse());
            const relX = Math.max(0, Math.min(1, (svgP.x - bbox.x) / bbox.width));
            const relY = Math.max(0, Math.min(1, (svgP.y - bbox.y) / bbox.height));
            const curX = bbox.x + relX * bbox.width;
            const curY = bbox.y + relY * bbox.height;
            pinGroup.setAttribute("transform", `translate(${curX}, ${curY})`);
          };

          const onPointerUp = (upEv: PointerEvent) => {
            hitTarget.releasePointerCapture(upEv.pointerId);
            hitTarget.style.cursor = "grab";
            setIsDraggingPin(false);
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("pointerup", onPointerUp);

            if (typeof svg.createSVGPoint !== "function") return;
            const pt = svg.createSVGPoint();
            pt.x = upEv.clientX;
            pt.y = upEv.clientY;
            const ctm = svg.getScreenCTM();
            if (!ctm) return;
            const svgP = pt.matrixTransform(ctm.inverse());
            const relX = Math.max(0, Math.min(1, (svgP.x - bbox.x) / bbox.width));
            const relY = Math.max(0, Math.min(1, (svgP.y - bbox.y) / bbox.height));
            const newExactPoint: ExactPointDTO = {
              coordinateSpace: "anatomy-bbox",
              x: Math.round(relX * 1000) / 1000,
              y: Math.round(relY * 1000) / 1000,
            };
            onSelectExactPoint?.(selectedNode, newExactPoint);
            setLiveAnnouncement(`Pin repositioned on ${selectedNode.label}.`);
          };

          window.addEventListener("pointermove", onPointerMove);
          window.addEventListener("pointerup", onPointerUp);
        });

        pinGroup.appendChild(hitTarget);
        findingsLayer.appendChild(pinGroup);
      } catch {
        // Ignore pin drag listener attachment errors
      }
    }

    return () => {
      const pins = svg.querySelectorAll("#active-body-map-pin");
      pins.forEach((p) => p.remove());
    };
  }, [
    svgContent,
    findings,
    view,
    selectedNode,
    activeExactPoint,
    onMarkerClick,
    onSelectExactPoint,
  ]);

  return (
    <div className="relative w-full flex flex-col items-center select-none">
      {/* Live Region for Screen Readers */}
      <div className="sr-only" aria-live="polite" role="status">
        {liveAnnouncement}
      </div>

      {/* Responsive Contained SVG Viewport (Strict 480px height, centered, zero overflow) */}
      <div
        ref={viewportRef}
        className="relative w-full flex justify-center items-center rounded-xl bg-white border border-slate-200/80 p-2 shadow-inner h-[480px] max-h-[480px] overflow-hidden"
      >
        {/* Return to Full Body button inside skeleton white container top-left matching Front/Back switcher */}
        {(selectedNode || isZoomed) && (
          <div className="absolute top-3 left-3 z-20 flex items-center p-1 bg-slate-100/90 border border-slate-200/80 rounded-xl shadow-2xs">
            <button
              type="button"
              onClick={() => onSelectNode(null)}
              className="px-3 py-1 text-md font-semibold rounded-lg bg-white text-slate-900 hover:text-emerald-800 shadow-2xs transition-all cursor-pointer"
              title="Return to full body view"
            >
              <span>Full Body</span>
            </button>
          </div>
        )}
        {/* Front / Back Aspect Switcher inside skeleton white container top-right */}
        {onViewChange && (
          <div className="absolute top-3 right-3 z-20 flex items-center p-1 bg-slate-100/90 border border-slate-200/80 rounded-xl shadow-2xs">
            <button
              type="button"
              onClick={() => {
                onSelectNode(null);
                onViewChange("Front");
              }}
              className={cn(
                "px-3 py-1 text-md rounded-lg transition-all cursor-pointer",
                view === "Front"
                  ? "bg-white text-slate-900 shadow-2xs font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium",
              )}
            >
              Front
            </button>
            <button
              type="button"
              onClick={() => {
                onSelectNode(null);
                onViewChange("Back");
              }}
              className={cn(
                "px-3 py-1 text-md rounded-lg transition-all cursor-pointer",
                view === "Back"
                  ? "bg-white text-slate-900 shadow-2xs font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium",
              )}
            >
              Back
            </button>
          </div>
        )}

        {/* Floating Pin Interactive Tooltip */}
        {activeExactPoint && selectedNode && pinPixelPos && !isDraggingPin && (
          <div
            style={{
              left: `${Math.max(125, Math.min(355, pinPixelPos.x))}px`,
              top: `${pinPixelPos.y < 130 ? pinPixelPos.y + 24 : pinPixelPos.y - 18}px`,
              transform: pinPixelPos.y < 130 ? "translate(-50%, 0)" : "translate(-50%, -100%)",
            }}
            className="absolute z-30 flex flex-col gap-2 p-3 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/90 shadow-xl min-w-[210px] max-w-[270px] pointer-events-auto animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Header: Sub-part label */}
            <div className="flex items-center gap-1.5 min-w-0 pb-1.5 border-b border-slate-100">
              <MapPin className="size-3.5 text-blue-600 shrink-0" />
              <span className="text-md font-bold text-slate-900 truncate">
                {buildLocationLabel(selectedNode.id)}
              </span>
            </div>

            {/* Actions: Clear Pin & Document Finding */}
            <div className="flex items-center gap-1.5 pt-0.5">
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-md font-medium text-rose-600 border-rose-200 bg-white hover:bg-rose-50 hover:text-rose-700 flex-1 cursor-pointer"
                onClick={() => {
                  onClearPin?.();
                  onSelectExactPoint?.(selectedNode, null);
                  setPinPixelPos(null);
                  const pins = containerRef.current?.querySelectorAll("#active-body-map-pin");
                  pins?.forEach((p) => p.remove());
                }}
              >
                Clear Pin
              </Button>
              <Button
                size="sm"
                variant="default"
                className="h-7 px-2 text-md font-semibold gap-1 shadow-2xs flex-1 cursor-pointer"
                onClick={() => onOpenAddFinding?.(selectedNode, activeExactPoint)}
                disabled={!canEdit}
                title={!canEdit ? "Discharged residents cannot have new findings" : "Document finding"}
              >
                <Plus className="size-3" />
                <span>Document Finding</span>
              </Button>
            </div>
          </div>
        )}

        <div
          ref={containerRef}
          className="w-full h-full max-h-[460px] flex justify-center items-center"
        />
      </div>
    </div>
  );
}

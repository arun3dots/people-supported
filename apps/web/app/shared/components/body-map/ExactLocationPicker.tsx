"use client";

import React, { useState, useRef } from "react";
import { Button } from "@repo/ui/components/ui";
import { Check, X, Crosshair } from "lucide-react";
import { buildLocationLabel, type AnatomyNode, type ExactPointDTO } from "@repo/schema";

interface ExactLocationPickerProps {
  node: AnatomyNode;
  initialPoint?: ExactPointDTO;
  onConfirm: (point: ExactPointDTO) => void;
  onCancel: () => void;
}

export function ExactLocationPicker({
  node,
  initialPoint,
  onConfirm,
  onCancel,
}: ExactLocationPickerProps) {
  const [point, setPoint] = useState<ExactPointDTO | null>(
    initialPoint || null,
  );
  const surfaceRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!surfaceRef.current) return;
    const rect = surfaceRef.current.getBoundingClientRect();
    const rawX = (e.clientX - rect.left) / rect.width;
    const rawY = (e.clientY - rect.top) / rect.height;

    // Clamp between 0.0 and 1.0 (normalized relative coordinate space)
    const x = Math.max(0, Math.min(1, Math.round(rawX * 1000) / 1000));
    const y = Math.max(0, Math.min(1, Math.round(rawY * 1000) / 1000));

    setPoint({ coordinateSpace: "anatomy-bbox", x, y });
  };

  return (
    <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm text-blue-900">
          <Crosshair className="size-4 text-blue-600 animate-pulse" />
          <span className="font-semibold">Marking Exact Clinical Location:</span>
          <span className="font-bold">{buildLocationLabel(node.id)}</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="size-6 p-0 text-slate-400 hover:text-slate-600"
          onClick={onCancel}
        >
          <X className="size-3.5" />
        </Button>
      </div>

      <p className="text-sm text-slate-500">
        Click or tap precisely on the anatomical region below to place the pin. Coordinates are normalized and preserved across all screen sizes and zooms.
      </p>

      {/* Interactive Normalized Surface Area */}
      <div
        ref={surfaceRef}
        onClick={handleClick}
        className="relative w-full h-48 rounded-xl border-2 border-dashed border-blue-300 bg-gradient-to-br from-slate-50 to-blue-50/30 cursor-crosshair overflow-hidden shadow-inner flex items-center justify-center select-none"
      >
        <span className="text-sm text-slate-400 font-medium pointer-events-none">
          {point ? "Click again to adjust pin position" : "Click anywhere in this region to mark exact point"}
        </span>

        {/* The Exact Marker Pin */}
        {point && (
          <div
            className="absolute size-4 -ml-2 -mt-2 rounded-full bg-red-600 border-2 border-white shadow-md pointer-events-none transition-all"
            style={{
              left: `${point.x * 100}%`,
              top: `${point.y * 100}%`,
            }}
          >
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
              x: {point.x.toFixed(2)}, y: {point.y.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-1">
        <Button size="sm" variant="outline" onClick={onCancel} className="text-sm">
          Cancel
        </Button>
        <Button
          size="sm"
          disabled={!point}
          onClick={() => point && onConfirm(point)}
          className="gap-1 text-sm bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Check className="size-3.5" />
          Confirm Exact Point
        </Button>
      </div>
    </div>
  );
}

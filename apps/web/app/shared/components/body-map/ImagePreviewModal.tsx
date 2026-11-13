"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
} from "@repo/ui/components/ui";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  Camera,
  Maximize2,
  Move,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";

interface ImagePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string | null;
  title?: string;
  subtitle?: string;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  showDownload?: boolean;
  isPdf?: boolean;
}

export function ImagePreviewModal({
  open,
  onOpenChange,
  imageUrl,
  title = "Photograph Preview",
  subtitle = "Clinical photograph view",
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  showDownload = false,
  isPdf = false,
}: ImagePreviewModalProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleReset = useCallback(() => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleZoomIn = () => setZoom((prev) => Math.min(Number((prev + 0.25).toFixed(2)), 4));
  const handleZoomOut = () =>
    setZoom((prev) => {
      const next = Math.max(Number((prev - 0.25).toFixed(2)), 0.5);
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });

  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  // Wheel zoom support
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((prev) => Math.min(Number((prev + 0.15).toFixed(2)), 4));
    } else {
      setZoom((prev) => {
        const next = Math.max(Number((prev - 0.15).toFixed(2)), 0.5);
        if (next <= 1) setPan({ x: 0, y: 0 });
        return next;
      });
    }
  };

  // Mouse pan support
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch pan support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      if (!touch) return;
      setIsDragging(true);
      dragStartRef.current = { x: touch.clientX, y: touch.clientY };
      panStartRef.current = { ...pan };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    if (!touch) return;
    const dx = touch.clientX - dragStartRef.current.x;
    const dy = touch.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  if (!imageUrl) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleReset();
        onOpenChange(isOpen);
      }}
    >
      <DialogContent
        size="5xl"
        className="flex flex-col p-0 gap-0 overflow-hidden select-none max-h-[92vh] w-[95vw] sm:w-[90vw] max-w-5xl rounded-2xl"
      >
        {/* Responsive Header */}
        <DialogHeader className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 space-y-0 shrink-0 pr-12">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800 shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <DialogTitle className="text-md sm:text-base font-semibold text-slate-900 truncate">
                {title}
              </DialogTitle>
              <DialogDescription className="text-md text-slate-500 truncate">
                {subtitle}
              </DialogDescription>
            </div>
          </div>

          {/* Controls Bar - Wrap-safe & Compact */}
          <div className="flex items-center flex-wrap gap-1 bg-white border border-slate-200/90 rounded-lg p-1 shadow-2xs self-start sm:self-auto">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-slate-700 hover:bg-slate-100"
              onClick={handleZoomOut}
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <span className="text-md font-mono text-slate-700 w-11 text-center font-medium">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-slate-700 hover:bg-slate-100"
              onClick={handleZoomIn}
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
            <div className="w-px h-4 bg-slate-200 my-auto mx-0.5" />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-slate-700 hover:bg-slate-100"
              onClick={handleRotate}
              title="Rotate 90°"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-slate-700 hover:bg-slate-100"
              onClick={handleReset}
              title="Reset View"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Viewport Area with Pan, Drag, and Wheel */}
        <div
          className={`relative flex-1 min-h-[380px] sm:min-h-[460px] max-h-[68vh] w-full bg-slate-950/95 flex items-center justify-center overflow-hidden p-4 ${
            zoom > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default"
          }`}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
        >
          {hasPrevious && onPrevious && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-3 z-10 size-10 rounded-full bg-black/50 p-0 text-white hover:bg-black/70"
              onClick={onPrevious}
              title="Previous image"
            >
              <ChevronLeft className="size-6" />
            </Button>
          )}

          <div
            className="relative flex items-center justify-center transition-transform duration-75 max-w-full"
            style={{
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: "center center",
            }}
          >
            {isPdf ? (
              <iframe
                src={imageUrl}
                title={title}
                className="h-[62vh] w-[85vw] rounded-lg bg-white shadow-2xl"
              />
            ) : (
              <img
                src={imageUrl}
                alt={title}
                draggable={false}
                className="max-h-[62vh] max-w-[85vw] sm:max-w-full object-contain rounded-lg shadow-2xl pointer-events-none"
              />
            )}
          </div>

          {hasNext && onNext && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-3 z-10 size-10 rounded-full bg-black/50 p-0 text-white hover:bg-black/70"
              onClick={onNext}
              title="Next image"
            >
              <ChevronRight className="size-6" />
            </Button>
          )}

          {/* Quick pan helper hint when zoomed */}
          {zoom > 1 && (
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur text-white text-md px-2 py-1 rounded-md flex items-center gap-1 pointer-events-none shadow">
              <Move className="w-3 h-3" />
              <span>Drag to pan · Scroll to zoom</span>
            </div>
          )}
        </div>

        {/* Responsive Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-md text-slate-500 shrink-0">
          <span className="text-md truncate">
            Scroll or pinch to zoom · Click rotate to reorient
          </span>
          <div className="flex items-center gap-2 shrink-0">
            {showDownload && imageUrl && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-8 text-md"
              >
                <a href={imageUrl} download={title || "image"}>
                  <Download className="size-3.5" />
                  Download
                </a>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                handleReset();
                onOpenChange(false);
              }}
              className="h-8 text-md"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

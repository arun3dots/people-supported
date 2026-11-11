"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@repo/ui/components/ui/Dialog";
import { Button } from "@repo/ui/components/ui/Button";
import { Text } from "@repo/ui/components/ui/Text";
import {
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Lock,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { getComplianceSignedUrl } from "../../queries/staff/useComplianceQueries";

export interface DocumentViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  subtitle?: string;
  documentPath?: string | null;
  /** Optional custom signed URL resolver function */
  resolveSignedUrl?: (path: string) => Promise<string>;
  /** Optional staff ID for compliance signed URL resolution */
  staffId?: string;
}

export function DocumentViewerModal({
  open,
  onOpenChange,
  title = "Document Preview",
  subtitle = "Read-only secure document view. Copying, saving, and downloading are disabled.",
  documentPath,
  resolveSignedUrl,
  staffId,
}: DocumentViewerModalProps) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isImgType, setIsImgType] = useState<boolean>(false);

  // Transform controls for image preview
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  // Canvas ref for bulletproof non-saveable image rendering
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Global security protection: disable context menu and save hotkeys when open
  useEffect(() => {
    if (!open) return;

    const blockSecurityEvents = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    const blockKeyboardHotkeys = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        ["s", "S", "p", "P", "u", "U", "i", "I"].includes(e.key)
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    window.addEventListener("contextmenu", blockSecurityEvents, true);
    window.addEventListener("dragstart", blockSecurityEvents, true);
    window.addEventListener("keydown", blockKeyboardHotkeys, true);

    return () => {
      window.removeEventListener("contextmenu", blockSecurityEvents, true);
      window.removeEventListener("dragstart", blockSecurityEvents, true);
      window.removeEventListener("keydown", blockKeyboardHotkeys, true);
    };
  }, [open]);

  // Resolve document URL
  useEffect(() => {
    if (!open || !documentPath) {
      setResolvedUrl(null);
      setError(null);
      setZoom(1);
      setRotation(0);
      setIsImgType(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);
    setZoom(1);
    setRotation(0);

    const resolveUrl = async () => {
      try {
        if (
          documentPath.startsWith("http://") ||
          documentPath.startsWith("https://") ||
          documentPath.startsWith("data:") ||
          documentPath.startsWith("blob:")
        ) {
          if (isMounted) {
            setResolvedUrl(documentPath);
            setIsLoading(false);
          }
          return;
        }

        if (resolveSignedUrl) {
          const signedUrl = await resolveSignedUrl(documentPath);
          if (isMounted) {
            setResolvedUrl(signedUrl);
            setIsLoading(false);
          }
        } else if (staffId) {
          const signedUrl = await getComplianceSignedUrl(staffId, documentPath);
          if (isMounted) {
            setResolvedUrl(signedUrl);
            setIsLoading(false);
          }
        } else {
          if (isMounted) {
            setResolvedUrl(documentPath);
            setIsLoading(false);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load document preview.");
          setIsLoading(false);
        }
      }
    };

    resolveUrl();

    return () => {
      isMounted = false;
    };
  }, [open, documentPath, resolveSignedUrl, staffId]);

  // Dynamic Image Probing (detects images even for extension-less storage URLs!)
  useEffect(() => {
    if (!resolvedUrl) {
      setIsImgType(false);
      return;
    }

    const cleanUrl = resolvedUrl.split("?")[0]?.toLowerCase() || "";
    const pathClean = (documentPath || "").split("?")[0]?.toLowerCase() || "";
    const knownImgExt = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".bmp"];

    const isKnownExt =
      knownImgExt.some((ext) => cleanUrl.endsWith(ext) || pathClean.endsWith(ext)) ||
      cleanUrl.startsWith("data:image/");

    if (isKnownExt) {
      setIsImgType(true);
      return;
    }

    const isKnownPdf =
      cleanUrl.endsWith(".pdf") ||
      pathClean.endsWith(".pdf") ||
      cleanUrl.includes(".pdf?") ||
      pathClean.includes(".pdf?") ||
      cleanUrl.includes("application/pdf") ||
      pathClean.includes("application/pdf");

    if (isKnownPdf) {
      setIsImgType(false);
      return;
    }

    // Dynamic Probe
    let isCancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!isCancelled) setIsImgType(true);
    };
    img.onerror = () => {
      if (!isCancelled) setIsImgType(false);
    };
    img.src = resolvedUrl;

    return () => {
      isCancelled = true;
    };
  }, [resolvedUrl, documentPath]);

  // Draw image onto HTML5 Canvas (completely strips native <img> right-click options)
  useEffect(() => {
    if (!resolvedUrl || !isImgType || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = resolvedUrl;
  }, [resolvedUrl, isImgType]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="5xl"
        className="flex flex-col max-h-[90vh] p-0 gap-0 overflow-hidden select-none"
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }}
        onDragStart={(e) => e.preventDefault()}
      >
        {/* Header */}
        <DialogHeader className="p-4 sm:px-6 bg-[#F8FAF9] border-b border-[#BCD3CD] flex flex-row items-center justify-between space-y-0 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F1FCF3] border border-[#22973F]/30 flex items-center justify-center text-[#22973F] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <DialogTitle className="text-base font-semibold text-[#141F1E] flex items-center gap-2">
                {title}
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#F1FCF3] text-[#22973F] border border-[#22973F]/30 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Protected Preview
                </span>
              </DialogTitle>
              <DialogDescription className="text-sm text-[#5D5D5D]">
                {subtitle}
              </DialogDescription>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {resolvedUrl && isImgType && (
              <div className="flex items-center gap-1 bg-white border border-[#BCD3CD] rounded-lg p-1 shadow-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-[#141F1E] hover:bg-[#F5F8F7]"
                  onClick={handleZoomOut}
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </Button>
                <span className="text-[11px] font-mono text-[#141F1E] w-12 text-center font-medium">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-[#141F1E] hover:bg-[#F5F8F7]"
                  onClick={handleZoomIn}
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </Button>
                <div className="w-[1px] h-4 bg-[#BCD3CD] my-auto mx-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-[#141F1E] hover:bg-[#F5F8F7]"
                  onClick={handleRotate}
                  title="Rotate Clockwise"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        {/* Protected Canvas / Document Area */}
        <div
          className="relative flex-1 min-h-0 max-h-[calc(90vh-140px)] w-full bg-[#F5F8F7] flex items-center justify-center overflow-auto p-6 select-none"
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          onDragStart={(e) => e.preventDefault()}
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 text-[#5D5D5D]">
              <Loader2 className="w-8 h-8 animate-spin text-[#4A706A]" />
              <Text size="sm" weight="regular" className="text-[#5D5D5D]">
                Loading secure document preview...
              </Text>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 text-red-700 max-w-sm text-center p-6 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <Text size="sm" weight="medium" className="text-red-700">
                {error}
              </Text>
            </div>
          ) : resolvedUrl ? (
            isImgType ? (
              <div
                className="relative flex items-center justify-center transition-transform duration-200 select-none max-w-full"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                }}
              >
                {/* HTML5 Canvas Rendering (No browser 'Save Image As' context menu) */}
                <canvas
                  ref={canvasRef}
                  className="max-h-[calc(90vh-190px)] max-w-full object-contain rounded-lg shadow-md border border-[#BCD3CD] pointer-events-none select-none"
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }}
                  onDragStart={(e) => e.preventDefault()}
                />

                {/* Absolute Security Pointer Shield Overlay */}
                <div
                  className="absolute inset-0 bg-transparent cursor-default select-none z-[100]"
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }}
                  onDragStart={(e) => e.preventDefault()}
                />
              </div>
            ) : (
              // Protected Document Frame
              <div
                className="relative w-full h-[calc(90vh-190px)] min-h-[260px] rounded-xl overflow-hidden bg-white border border-[#BCD3CD] shadow-sm select-none"
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  return false;
                }}
              >
                <iframe
                  src={`${resolvedUrl}#toolbar=0&navpanes=0&scrollbar=1&statusbar=0&messages=0`}
                  className="w-full h-full border-0 select-none pointer-events-auto"
                  title={title}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }}
                />

                {/* Top Toolbar Pointer Shield (Covers PDF reader toolbar buttons) */}
                <div
                  className="absolute top-0 left-0 right-0 h-14 bg-transparent z-40 cursor-default select-none"
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }}
                  onDragStart={(e) => e.preventDefault()}
                  onClick={(e) => e.preventDefault()}
                />

                {/* Security Pointer Shield Badge */}
                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur border border-[#BCD3CD] text-[#141F1E] text-[10px] px-2.5 py-1 rounded-md shadow-md flex items-center gap-1.5 pointer-events-none select-none z-50">
                  <Lock className="w-3 h-3 text-[#22973F]" />
                  Protected View (Download Disabled)
                </div>
              </div>
            )
          ) : (
            <Text size="sm" weight="regular" className="text-[#5D5D5D] italic">
              No document file specified.
            </Text>
          )}
        </div>

        {/* Security Footer Notice */}
        <div className="p-4 bg-[#F8FAF9] border-t border-[#BCD3CD] flex items-center justify-between text-sm text-[#5D5D5D] shrink-0">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#22973F]" />
            <span>Document viewing is audited. Saving, printing, and downloading are disabled.</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 border-[#BCD3CD] text-[#141F1E] hover:bg-[#F5F8F7]"
          >
            Close Viewer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

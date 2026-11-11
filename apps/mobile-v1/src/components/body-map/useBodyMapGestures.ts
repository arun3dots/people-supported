import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  GestureResponderEvent,
  LayoutChangeEvent,
} from 'react-native';
import { buildLocationLabel } from '@repo/schema';
import { ANATOMY_DEFAULT_CENTERS } from './bodyMapConstants';
import {
  calculateZoomedViewBox,
  screenTouchToSvgCoords,
  resolveTappedAnatomy,
  calculateBboxRelativePoint,
} from './bodyMapZoomUtils';
import {
  getAnatomyBoundingBox,
  getPinSvgCoords,
} from './bodyMapBounds';
import { useWebWheelZoom } from './useWebWheelZoom';
import type { BodyMapViewType, BodyMapVariantType, ExactPointDTO } from '@repo/schema';
import type { BodyMapDimensions } from './svg';

interface UseBodyMapGesturesParams {
  defaultDim: BodyMapDimensions;
  selectedAnatomyId: string | null;
  exactPoint: ExactPointDTO | null;
  view: BodyMapViewType;
  variant?: BodyMapVariantType;
  onSelectAnatomyId: (id: string | null) => void;
  onSelectExactPoint: (pt: ExactPointDTO | null) => void;
  isAddMode?: boolean;
}

export function useBodyMapGestures({
  defaultDim,
  selectedAnatomyId,
  exactPoint,
  view,
  variant = 'neutral',
  onSelectAnatomyId,
  onSelectExactPoint,
  isAddMode = false,
}: UseBodyMapGesturesParams) {
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [focalCenter, setFocalCenter] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingPinState, setIsDraggingPinState] = useState<boolean>(false);

  const containerRef = useRef<React.ElementRef<typeof View>>(null);
  const initialDistance = useRef<number>(0);
  const initialZoom = useRef<number>(1.0);
  const isPinching = useRef<boolean>(false);
  const touchStartTime = useRef<number>(0);
  const touchStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDragging = useRef<boolean>(false);
  const isDraggingPin = useRef<boolean>(false);
  const isPanning = useRef<boolean>(false);
  const panStartFocal = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.5 });

  const [layout, setLayout] = useState<{ width: number; height: number }>({
    width: 360,
    height: 460,
  });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) setLayout({ width, height });
  };

  // Auto-zoom to area and place initial pin inside bbox when body part is selected
  useEffect(() => {
    if (selectedAnatomyId) {
      setZoomLevel(2.2);
      if (!exactPoint) {
        onSelectExactPoint({
          coordinateSpace: 'anatomy-bbox',
          x: 0.5,
          y: 0.5,
        });
      }
    } else {
      setZoomLevel(1.0);
      setFocalCenter(null);
    }
  }, [selectedAnatomyId]);

  // Reset zoom and focal center when switching between Front and Back views
  useEffect(() => {
    setZoomLevel(1.0);
    setFocalCenter(null);
  }, [view]);

  // Aspect-ratio-safe dynamic viewBox that spans the full width of the container
  const currentViewBox = useMemo(() => {
    return calculateZoomedViewBox(
      defaultDim,
      selectedAnatomyId,
      zoomLevel,
      focalCenter,
      layout.width,
      layout.height,
      view,
      variant,
    );
  }, [defaultDim, selectedAnatomyId, zoomLevel, focalCenter, layout.width, layout.height, view, variant]);

  const currentViewBoxRef = useRef(currentViewBox);
  currentViewBoxRef.current = currentViewBox;
  const defaultDimRef = useRef(defaultDim);
  defaultDimRef.current = defaultDim;

  // Web Ctrl + Scroll (and trackpad pinch) zoom listener
  useWebWheelZoom({
    containerRef,
    currentViewBoxRef,
    defaultDimRef,
    setZoomLevel,
    setFocalCenter,
  });

  // Handle single-finger tap: select anatomy part & place exact pinpoint matching web
  const handleCanvasTap = (touchX: number, touchY: number) => {
    if (!isAddMode || layout.width === 0 || layout.height === 0) return;
    const { relX, relY, svgX, svgY } = screenTouchToSvgCoords(
      touchX,
      touchY,
      layout.width,
      layout.height,
      currentViewBox,
      defaultDim,
    );

    const matchedId = resolveTappedAnatomy(
      svgX,
      svgY,
      relX,
      relY,
      view,
      variant,
      zoomLevel,
    );

    if (matchedId) {
      const pt = calculateBboxRelativePoint(svgX, svgY, matchedId, view, variant);
      if (!selectedAnatomyId || selectedAnatomyId !== matchedId) {
        onSelectAnatomyId(matchedId);
      }
      onSelectExactPoint({
        coordinateSpace: 'anatomy-bbox',
        x: pt.x,
        y: pt.y,
      });
    } else if (selectedAnatomyId) {
      const bbox = getAnatomyBoundingBox(selectedAnatomyId, view, variant);
      if (bbox && svgX >= bbox.x && svgX <= bbox.x + bbox.w && svgY >= bbox.y && svgY <= bbox.y + bbox.h) {
        const pt = calculateBboxRelativePoint(svgX, svgY, selectedAnatomyId, view, variant);
        onSelectExactPoint({
          coordinateSpace: 'anatomy-bbox',
          x: pt.x,
          y: pt.y,
        });
      }
    }
  };

  // Touch Responder: Supports 2-finger pinch-zoom, 1-finger pan when zoomed, and pin-drag
  const onTouchStart = (e: GestureResponderEvent) => {
    const touches = e.nativeEvent.touches;
    if (touches.length === 2) {
      isPinching.current = true;
      isDraggingPin.current = false;
      setIsDraggingPinState(false);
      isPanning.current = false;
      const t1 = touches[0];
      const t2 = touches[1];
      initialDistance.current = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
      initialZoom.current = zoomLevel;

      if (layout.width > 0 && layout.height > 0) {
        const midX = (t1.locationX + t2.locationX) / 2;
        const midY = (t1.locationY + t2.locationY) / 2;
        const coords = screenTouchToSvgCoords(
          midX,
          midY,
          layout.width,
          layout.height,
          currentViewBox,
          defaultDim,
        );
        setFocalCenter({ x: coords.relX, y: coords.relY });
      }
    } else if (touches.length === 1) {
      const touch = touches[0];
      touchStartTime.current = Date.now();
      touchStartPos.current = { x: touch.locationX, y: touch.locationY };
      isDragging.current = false;
      isPanning.current = false;

      // Check if touch is near active pinpoint (36px grab zone) to drag pin
      let isNearPin = false;
      if (isAddMode && exactPoint && layout.width > 0 && layout.height > 0) {
        const pinSvg = getPinSvgCoords(selectedAnatomyId, exactPoint, view, variant, defaultDim);
        if (pinSvg) {
          const pinScreenX = ((pinSvg.svgX - currentViewBox.x) / currentViewBox.w) * layout.width;
          const pinScreenY = ((pinSvg.svgY - currentViewBox.y) / currentViewBox.h) * layout.height;
          const dist = Math.hypot(touch.locationX - pinScreenX, touch.locationY - pinScreenY);
          if (dist < 36) isNearPin = true;
        }
      }

      if (isNearPin) {
        isDraggingPin.current = true;
        setIsDraggingPinState(true);
      } else {
        isDraggingPin.current = false;
        setIsDraggingPinState(false);
        const center = selectedAnatomyId ? ANATOMY_DEFAULT_CENTERS[selectedAnatomyId] : null;
        const curFocal = focalCenter || (center ? { x: center.x, y: center.y } : { x: 0.5, y: 0.5 });
        panStartFocal.current = { x: curFocal.x, y: curFocal.y };
      }
    }
  };

  const onTouchMove = (e: GestureResponderEvent) => {
    const touches = e.nativeEvent.touches;
    if (touches.length === 2 && initialDistance.current > 0) {
      const t1 = touches[0];
      const t2 = touches[1];
      const currentDist = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
      const scale = currentDist / initialDistance.current;
      const nextZoom = Math.max(1.0, Math.min(3.5, Number((initialZoom.current * scale).toFixed(2))));
      setZoomLevel(nextZoom);
    } else if (touches.length === 1) {
      const touch = touches[0];
      const dx = touch.locationX - touchStartPos.current.x;
      const dy = touch.locationY - touchStartPos.current.y;

      if (isDraggingPin.current) {
        isDragging.current = true;
        const coords = screenTouchToSvgCoords(
          touch.locationX,
          touch.locationY,
          layout.width,
          layout.height,
          currentViewBox,
          defaultDim,
        );
        if (selectedAnatomyId) {
          const pt = calculateBboxRelativePoint(coords.svgX, coords.svgY, selectedAnatomyId, view, variant);
          onSelectExactPoint({
            coordinateSpace: 'anatomy-bbox',
            x: pt.x,
            y: pt.y,
          });
        }
      } else if (Math.hypot(dx, dy) > 8) {
        isDragging.current = true;
        if (zoomLevel > 1.05 && layout.width > 0 && layout.height > 0) {
          isPanning.current = true;
          const normDeltaX = (-dx * (currentViewBox.w / layout.width)) / defaultDim.w;
          const normDeltaY = (-dy * (currentViewBox.h / layout.height)) / defaultDim.h;
          const nextX = Math.max(0.05, Math.min(0.95, Number((panStartFocal.current.x + normDeltaX).toFixed(3))));
          const nextY = Math.max(0.05, Math.min(0.95, Number((panStartFocal.current.y + normDeltaY).toFixed(3))));
          setFocalCenter({ x: nextX, y: nextY });
        }
      }
    }
  };

  const onTouchEnd = () => {
    if (isPinching.current) {
      isPinching.current = false;
      initialDistance.current = 0;
    } else if (isDraggingPin.current) {
      isDraggingPin.current = false;
      setIsDraggingPinState(false);
      isDragging.current = false;
    } else if (isPanning.current) {
      isPanning.current = false;
      isDragging.current = false;
    } else if (!isDragging.current && Date.now() - touchStartTime.current < 450) {
      handleCanvasTap(touchStartPos.current.x, touchStartPos.current.y);
    }
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(3.5, Number((prev + 0.4).toFixed(1))));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(1.0, Number((prev - 0.4).toFixed(1))));
  };

  const handleResetZoom = () => {
    setZoomLevel(1.0);
    setFocalCenter(null);
    onSelectAnatomyId(null);
    onSelectExactPoint(null);
  };

  const isZoomed = zoomLevel > 1.05;
  const selectedLabel = selectedAnatomyId ? buildLocationLabel(selectedAnatomyId) : '';

  // Pixel position of pinpoint for rendering floating tooltip
  const pinPixelPos = useMemo(() => {
    if (!selectedAnatomyId || !exactPoint || layout.width === 0 || layout.height === 0) return null;
    const pinSvg = getPinSvgCoords(selectedAnatomyId, exactPoint, view, variant, defaultDim);
    if (!pinSvg) return null;
    const x = Math.round(((pinSvg.svgX - currentViewBox.x) / currentViewBox.w) * layout.width);
    const y = Math.round(((pinSvg.svgY - currentViewBox.y) / currentViewBox.h) * layout.height);
    return { x, y };
  }, [selectedAnatomyId, exactPoint, layout.width, layout.height, currentViewBox, defaultDim, view, variant]);

  return {
    zoomLevel,
    setZoomLevel,
    focalCenter,
    setFocalCenter,
    layout,
    onLayout,
    containerRef,
    currentViewBox,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    isZoomed,
    selectedLabel,
    pinPixelPos,
    isDraggingPin: isDraggingPinState,
  };
}

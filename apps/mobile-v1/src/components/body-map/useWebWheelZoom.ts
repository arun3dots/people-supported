import { useEffect } from 'react';
import { Platform } from 'react-native';
import { screenTouchToSvgCoords } from './bodyMapZoomUtils';
import type { BodyMapDimensions } from './svg';

interface Props {
  containerRef: React.RefObject<unknown>;
  currentViewBoxRef: React.MutableRefObject<BodyMapDimensions>;
  defaultDimRef: React.MutableRefObject<BodyMapDimensions>;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  setFocalCenter: React.Dispatch<React.SetStateAction<{ x: number; y: number } | null>>;
}

/**
 * Handles browser Ctrl + Wheel / trackpad pinch zoom for Expo Web
 */
export function useWebWheelZoom({
  containerRef,
  currentViewBoxRef,
  defaultDimRef,
  setZoomLevel,
  setFocalCenter,
}: Props) {
  useEffect(() => {
    if (Platform.OS !== 'web' || !containerRef.current) return;
    const el = containerRef.current as unknown as {
      addEventListener?: (
        type: string,
        listener: (e: WheelEvent) => void,
        options?: { passive: boolean },
      ) => void;
      removeEventListener?: (
        type: string,
        listener: (e: WheelEvent) => void,
      ) => void;
    };

    if (!el || typeof el.addEventListener !== 'function') return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();

        const zoomDelta = -e.deltaY * 0.005;
        setZoomLevel((prev) => {
          return Math.max(1.0, Math.min(3.5, Number((prev + zoomDelta).toFixed(2))));
        });

        const targetEl = e.currentTarget as HTMLElement | null;
        if (targetEl && typeof targetEl.getBoundingClientRect === 'function') {
          const rect = targetEl.getBoundingClientRect();
          const cursorX = e.clientX - rect.left;
          const cursorY = e.clientY - rect.top;
          if (rect.width > 0 && rect.height > 0) {
            const coords = screenTouchToSvgCoords(
              cursorX,
              cursorY,
              rect.width,
              rect.height,
              currentViewBoxRef.current,
              defaultDimRef.current,
            );
            setFocalCenter({ x: coords.relX, y: coords.relY });
          }
        }
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      if (typeof el.removeEventListener === 'function') {
        el.removeEventListener('wheel', handleWheel);
      }
    };
  }, [containerRef, currentViewBoxRef, defaultDimRef, setZoomLevel, setFocalCenter]);
}

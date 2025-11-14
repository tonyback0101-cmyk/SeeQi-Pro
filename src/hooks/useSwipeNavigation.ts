"use client";

import { useEffect, useRef } from "react";

type SwipeNavigationOptions = {
  onEdgeBack?: () => void;
  onShowNavBar?: () => void;
  onTabNext?: () => void;
  onTabPrevious?: () => void;
  onLongPressMenu?: () => void;
  edgeThreshold?: number;
  bottomThreshold?: number;
  swipeThreshold?: number;
  longPressDuration?: number;
};

type TouchSnapshot = {
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  startTime: number;
  edgeGesture: boolean;
  bottomGesture: boolean;
  isHorizontalIntent: boolean | null;
  longPressTriggered: boolean;
  longPressTimer: ReturnType<typeof setTimeout> | null;
};

const DEFAULT_OPTIONS = {
  edgeThreshold: 24,
  bottomThreshold: 36,
  swipeThreshold: 72,
  longPressDuration: 550,
};

export function useSwipeNavigation(options: SwipeNavigationOptions = {}) {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const snapshotRef = useRef<TouchSnapshot | null>(null);

  useEffect(() => {
    const isTouchCapable = typeof window !== "undefined" && "ontouchstart" in window;
    if (!isTouchCapable) {
      return;
    }

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        return;
      }

      const touch = event.touches[0];
      const startX = touch.clientX;
      const startY = touch.clientY;
      const viewportHeight = window.innerHeight;

      const snapshot: TouchSnapshot = {
        startX,
        startY,
        lastX: startX,
        lastY: startY,
        startTime: Date.now(),
        edgeGesture: startX <= mergedOptions.edgeThreshold!,
        bottomGesture: startY >= viewportHeight - mergedOptions.bottomThreshold!,
        isHorizontalIntent: null,
        longPressTriggered: false,
        longPressTimer: null,
      };

      snapshot.longPressTimer = setTimeout(() => {
        snapshot.longPressTriggered = true;
        options.onLongPressMenu?.();
      }, mergedOptions.longPressDuration);

      snapshotRef.current = snapshot;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1 || !snapshotRef.current) {
        return;
      }

      const touch = event.touches[0];
      const currentX = touch.clientX;
      const currentY = touch.clientY;
      const snapshot = snapshotRef.current;

      const deltaX = currentX - snapshot.startX;
      const deltaY = currentY - snapshot.startY;

      snapshot.lastX = currentX;
      snapshot.lastY = currentY;

      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (distance > 12 && snapshot.longPressTimer) {
        clearTimeout(snapshot.longPressTimer);
        snapshot.longPressTimer = null;
      }

      if (snapshot.isHorizontalIntent === null) {
        if (Math.abs(deltaX) > 18 || Math.abs(deltaY) > 18) {
          snapshot.isHorizontalIntent = Math.abs(deltaX) > Math.abs(deltaY);
        }
      }

      // Prevent accidental scrolling when clearly navigating horizontally from edge
      if (snapshot.edgeGesture && snapshot.isHorizontalIntent === true && Math.abs(deltaX) > 10) {
        event.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      const snapshot = snapshotRef.current;
      if (!snapshot) {
        return;
      }

      if (snapshot.longPressTimer) {
        clearTimeout(snapshot.longPressTimer);
      }

      const deltaX = snapshot.lastX - snapshot.startX;
      const deltaY = snapshot.lastY - snapshot.startY;
      const duration = Date.now() - snapshot.startTime;
      const swipeThreshold = mergedOptions.swipeThreshold!;
      const quickSwipe = duration < 600;

      const absoluteX = Math.abs(deltaX);
      const absoluteY = Math.abs(deltaY);
      const horizontalDominant = absoluteX > absoluteY;

      if (!snapshot.longPressTriggered) {
        if (snapshot.edgeGesture && horizontalDominant && deltaX > swipeThreshold) {
          options.onEdgeBack?.();
        } else if (
          snapshot.bottomGesture &&
          !horizontalDominant &&
          snapshot.startY < snapshot.lastY &&
          absoluteY > swipeThreshold
        ) {
          options.onShowNavBar?.();
        } else if (horizontalDominant && absoluteX > swipeThreshold && quickSwipe) {
          if (deltaX < 0) {
            options.onTabNext?.();
          } else {
            options.onTabPrevious?.();
          }
        }
      }

      snapshotRef.current = null;
    };

    const handleTouchCancel = () => {
      if (snapshotRef.current?.longPressTimer) {
        clearTimeout(snapshotRef.current.longPressTimer);
      }
      snapshotRef.current = null;
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchCancel);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, [
    mergedOptions.bottomThreshold,
    mergedOptions.edgeThreshold,
    mergedOptions.longPressDuration,
    mergedOptions.swipeThreshold,
    options,
  ]);
}

export default useSwipeNavigation;


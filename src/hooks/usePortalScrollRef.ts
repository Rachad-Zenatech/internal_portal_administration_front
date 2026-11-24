import { useCallback, useEffect, useRef } from "react";

/**
 * Returns a callback ref that prevents native wheel/touchmove events inside a
 * portaled Popover from bubbling to `document`, where Radix Dialog's
 * `react-remove-scroll` would otherwise cancel scrolling inside the popover.
 */
export function usePortalScrollRef() {
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, []);

  return useCallback((el: HTMLDivElement | null) => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    if (!el) return;
    const stop = (e: Event) => e.stopPropagation();
    el.addEventListener("wheel", stop, { passive: true });
    el.addEventListener("touchmove", stop, { passive: true });
    cleanupRef.current = () => {
      el.removeEventListener("wheel", stop);
      el.removeEventListener("touchmove", stop);
    };
  }, []);
}

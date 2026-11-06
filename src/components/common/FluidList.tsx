import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";

export const FLUID_BATCH_SIZE = 50;

/**
 * Sizes a table's box to the space left on screen below whatever sits above it, so its footer ("Showing 23 of 23
 * requests") is visible without scrolling the page; the rows scroll inside the box instead. Re-measures when the
 * window or the content above changes size. Never shrinks below `minHeight` (on a short screen the page scrolls).
 */
export function useFitToScreen(minHeight = 320) {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [maxHeight, setMaxHeight] = useState<number>();

  useLayoutEffect(() => {
    if (!node) return;
    // The app shell's <main> is the page's scroll area
    const scroller = node.closest("main");
    const measure = () => {
      if (!scroller) return;
      const box = scroller.getBoundingClientRect();
      // Distance from the top of the page's content, so it doesn't change as the page is scrolled
      const top = node.getBoundingClientRect().top - box.top + scroller.scrollTop;
      const bottomPadding = parseFloat(getComputedStyle(scroller).paddingBottom) || 0;
      setMaxHeight(Math.max(minHeight, Math.floor(scroller.clientHeight - top - bottomPadding)));
    };
    measure();
    const resize = new ResizeObserver(measure);
    if (scroller) resize.observe(scroller);
    // The page's content: the cards and filters above the table can change height (wrapping, a banner appearing)
    if (node.parentElement) resize.observe(node.parentElement);
    return () => resize.disconnect();
  }, [node, minHeight]);

  return { ref: setNode, style: maxHeight ? { maxHeight } : undefined };
}

/**
 * Endless scroll for a list that is already loaded and filtered (as on the M&A dashboard): shows the first batch of
 * rows and adds the next batch whenever the "Loading more" row scrolls into view. Goes back to the first batch when
 * `resetKey` changes (pass the filters); a background refresh of the same list keeps what is already shown.
 */
export function useFluidRows<T>(rows: T[], resetKey: string, batchSize = FLUID_BATCH_SIZE) {
  const [count, setCount] = useState(batchSize);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    setCount(batchSize);
  }, [resetKey, batchSize]);

  const total = rows.length;
  const hasMore = count < total;

  // Attached to the "Loading more" row; called again with null when that row goes away
  const loadMoreRef = useCallback(
    (node: HTMLTableRowElement | null) => {
      observer.current?.disconnect();
      if (!node) return;
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) setCount((c) => c + batchSize);
        },
        // Start loading a little before the bottom is reached, so scrolling doesn't stall
        { rootMargin: "200px" },
      );
      observer.current.observe(node);
    },
    [batchSize],
  );

  useEffect(() => () => observer.current?.disconnect(), []);

  return {
    visibleRows: hasMore ? rows.slice(0, count) : rows,
    shown: Math.min(count, total),
    total,
    hasMore,
    loadMoreRef,
  };
}

/** The last row of the table while more rows are left; scrolling it into view loads the next batch */
export function LoadMoreRow({
  hasMore,
  shown,
  total,
  loadMoreRef,
}: {
  hasMore: boolean;
  shown: number;
  total: number;
  loadMoreRef: (node: HTMLTableRowElement | null) => void;
}) {
  if (!hasMore) return null;
  return (
    <TableRow ref={loadMoreRef} className="hover:bg-transparent">
      {/* Spans every column, whatever the table */}
      <TableCell colSpan={100} className="h-12 text-center text-muted-foreground text-xs">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          <span>
            Loading more... ({shown} of {total})
          </span>
        </div>
      </TableCell>
    </TableRow>
  );
}

/** "Showing 50 of 230 requests" under the table */
export function FluidListFooter({ shown, total, noun }: { shown: number; total: number; noun: string }) {
  return (
    <div className="bg-slate-50 dark:bg-zinc-900/90 border-t border-slate-200 dark:border-zinc-800 px-4 py-2 text-xs text-muted-foreground font-medium shrink-0">
      {total === 0 ? (
        `No ${noun}`
      ) : (
        <>
          Showing <strong className="text-slate-900 dark:text-zinc-100">{shown}</strong> of <strong>{total}</strong> {noun}
        </>
      )}
    </div>
  );
}

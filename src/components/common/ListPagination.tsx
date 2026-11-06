import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const LIST_PAGE_SIZE = 10;

/** Pages to offer: the first, the last, and one either side of the current one */
function pageNumbers(current: number, count: number): (number | "gap")[] {
  const pages = new Set([0, count - 1, current - 1, current, current + 1].filter((p) => p >= 0 && p < count));
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

/**
 * Splits a list that is already loaded and filtered into pages. The page goes back to the first one whenever
 * `resetKey` changes (pass the filters), so a new search doesn't leave you on an empty page; a background refresh of
 * the same list keeps the current page.
 */
export function usePagedRows<T>(rows: T[], resetKey: string, pageSize = LIST_PAGE_SIZE) {
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [resetKey]);

  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  // When rows disappear (deleted, or a refresh returns fewer), stay on the last page that still exists
  const current = Math.min(page, pageCount - 1);
  const pageRows = useMemo(() => rows.slice(current * pageSize, (current + 1) * pageSize), [rows, current, pageSize]);

  return {
    page: current,
    setPage,
    pageRows,
    total,
    pageCount,
    firstRow: total === 0 ? 0 : current * pageSize + 1,
    lastRow: Math.min(total, (current + 1) * pageSize),
  };
}

interface ListPaginationProps {
  page: number;
  pageCount: number;
  total: number;
  firstRow: number;
  lastRow: number;
  /** Plural name of the rows, e.g. "requests" */
  noun: string;
  onPageChange: (page: number) => void;
}

/** "Showing 11-20 of 57 requests" with numbered page buttons, as on the marketing dashboard's initiatives list */
export function ListPagination({ page, pageCount, total, firstRow, lastRow, noun, onPageChange }: ListPaginationProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 dark:border-zinc-800 px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <span>{total === 0 ? `No ${noun}` : `Showing ${firstRow}-${lastRow} of ${total} ${noun}`}</span>
      {pageCount > 1 && (
        <nav className="flex items-center gap-1" aria-label="Pages">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(page - 1)} disabled={page === 0} aria-label="Previous page">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {pageNumbers(page, pageCount).map((p, i) =>
            p === "gap" ? (
              <span key={`gap-${i}`} className="px-1">
                ...
              </span>
            ) : (
              <Button
                key={p}
                variant={p === page ? "default" : "outline"}
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(p)}
                aria-label={`Page ${p + 1}`}
                aria-current={p === page ? "page" : undefined}
              >
                {p + 1}
              </Button>
            ),
          )}
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(page + 1)} disabled={page >= pageCount - 1} aria-label="Next page">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </nav>
      )}
    </div>
  );
}

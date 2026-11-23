import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useIsMutating } from "@tanstack/react-query";
import { cancelActiveApiActions, subscribeToApiActions, type ActiveApiAction } from "@/services/apiClient";
import { Sparkles, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalLoadingScreen() {
  const [activeActions, setActiveActions] = useState<ActiveApiAction[]>([]);
  const isQueryMutating = useIsMutating();
  const [lastMeta, setLastMeta] = useState<{ title: string; subtitle: string }>({
    title: "Processing Request",
    subtitle: "Please wait while your request is being processed...",
  });

  useEffect(() => {
    return subscribeToApiActions((actions) => {
      setActiveActions(actions);
      if (actions.length > 0) {
        const latest = actions[actions.length - 1];
        setLastMeta({
          title: latest.title,
          subtitle: latest.subtitle,
        });
      }
    });
  }, []);

  const hasActiveWork = activeActions.length > 0 || isQueryMutating > 0;
  const [visible, setVisible] = useState(false);
  const [canCancel, setCanCancel] = useState(false);
  const earliestStart = activeActions.length > 0 ? Math.min(...activeActions.map((a) => a.startedAt)) : null;

  useEffect(() => {
    if (!hasActiveWork || earliestStart === null) {
      setCanCancel(false);
      return;
    }
    const elapsed = Date.now() - earliestStart;
    if (elapsed >= 30_000) {
      setCanCancel(true);
      return;
    }
    setCanCancel(false);
    const timeoutTimer = setTimeout(() => setCanCancel(true), 30_000 - elapsed);
    return () => clearTimeout(timeoutTimer);
  }, [hasActiveWork, earliestStart]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (hasActiveWork) {
      // Show immediately or after tiny 50ms delay to prevent micro-flicker on instantaneous cache reads
      timer = setTimeout(() => {
        setVisible(true);
      }, 50);
    } else {
      // Keep visible for a tiny grace period so user perceives completion smoothly
      timer = setTimeout(() => {
        setVisible(false);
      }, 150);
    }
    return () => clearTimeout(timer);
  }, [hasActiveWork]);

  if (!visible) return null;

  // Determine title and subtitle: prioritize active action, retain lastMeta during transition, then fallback
  const latestAction = activeActions[activeActions.length - 1];
  const title = latestAction?.title || lastMeta.title;
  const subtitle = latestAction?.subtitle || lastMeta.subtitle;
  const isExtraction =
    title.toLowerCase().includes("extract") ||
    title.toLowerCase().includes("ocr") ||
    title.toLowerCase().includes("quote") ||
    title.toLowerCase().includes("pdf");

  const hasCancellableAction = activeActions.some((a) => Boolean(a.cancel));
  const showCancelButton = (canCancel || isExtraction) && hasCancellableAction;

  const handleCancelClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    cancelActiveApiActions();
  };

  const overlay = (
    <div
      role="alert"
      aria-busy="true"
      aria-label={title}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      className="fixed inset-0 z-[99999] pointer-events-auto flex items-center justify-center bg-slate-950/50 dark:bg-black/75 transition-opacity duration-150 select-none"
    >
      <div className="relative pointer-events-auto bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-2xl rounded-2xl p-7 max-w-sm w-full mx-4 flex flex-col items-center text-center overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Dual-ring spinning orbital badge */}
        <div className="relative mb-3 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full border-[3px] border-indigo-100 dark:border-indigo-950/80 border-t-indigo-600 dark:border-t-indigo-400 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            {isExtraction ? (
              <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            ) : (
              <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            )}
          </div>
        </div>

        {isExtraction && (
          <div className="mb-2 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            <span>AI Document OCR</span>
          </div>
        )}

        {/* Action Title */}
        <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 mb-1 tracking-tight">
          {title}
        </h3>

        {/* Helpful Subtitle */}
        <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-[260px] leading-relaxed">
          {subtitle}
        </p>

        {/* Shimmering Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full mt-5 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-indigo-500 w-full rounded-full animate-pulse" />
        </div>

        {showCancelButton && (
          <div className="mt-4 w-full flex flex-col items-center gap-2 relative z-10">
            {canCancel && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                Taking longer than expected (30s timeout reached).
              </p>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={handleCancelClick}
              className="h-8 px-3 text-xs gap-1.5 cursor-pointer pointer-events-auto"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(overlay, document.body) : overlay;
}

import { useEffect, useState } from "react";
import { useIsMutating } from "@tanstack/react-query";
import { subscribeToApiActions, type ActiveApiAction } from "@/services/apiClient";
import { Sparkles } from "lucide-react";

export default function GlobalLoadingScreen() {
  const [activeActions, setActiveActions] = useState<ActiveApiAction[]>([]);
  const isQueryMutating = useIsMutating();

  useEffect(() => {
    return subscribeToApiActions((actions) => {
      setActiveActions(actions);
    });
  }, []);

  const hasActiveWork = activeActions.length > 0 || isQueryMutating > 0;
  const [visible, setVisible] = useState(false);

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

  // Determine title and subtitle
  const latestAction = activeActions[activeActions.length - 1];
  const title = latestAction?.title || "Saving Changes";
  const subtitle = latestAction?.subtitle || "Please wait while your changes are being saved...";

  return (
    <div
      role="alert"
      aria-busy="true"
      aria-label={title}
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/45 dark:bg-black/75 backdrop-blur-[3px] transition-all duration-200 animate-in fade-in select-none"
    >
      <div className="relative bg-white/95 dark:bg-zinc-900/95 border border-slate-200/90 dark:border-zinc-800 shadow-2xl rounded-2xl p-7 max-w-sm w-full mx-4 flex flex-col items-center text-center overflow-hidden animate-in zoom-in-95 duration-150 backdrop-blur-md">
        {/* Ambient background glow */}
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Dual-ring spinning orbital badge */}
        <div className="relative mb-4 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full border-[3px] border-indigo-100 dark:border-indigo-950/80 border-t-indigo-600 dark:border-t-indigo-400 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
          </div>
        </div>

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
      </div>
    </div>
  );
}

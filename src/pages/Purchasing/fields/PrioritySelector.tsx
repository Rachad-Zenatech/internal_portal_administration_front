import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, Check, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiClient } from "@/services/apiClient";
import type { Priority, RequestDetail, PurchaseRequest } from "@/types/purchasing";
import { PRIORITY_BADGE } from "./purchasingMeta";

interface PrioritySelectorProps {
  requestId: string | number;
  priority?: Priority | string | null;
  onPriorityChange?: (newPriority: Priority) => void;
  disabled?: boolean;
  size?: "xs" | "sm" | "default";
  className?: string;
  showIcon?: boolean;
}

const PRIORITIES: { value: Priority; label: string; dotColor: string }[] = [
  { value: "LOW", label: "Low", dotColor: "bg-slate-400" },
  { value: "MEDIUM", label: "Medium", dotColor: "bg-blue-500" },
  { value: "HIGH", label: "High", dotColor: "bg-orange-500" },
  { value: "URGENT", label: "Urgent", dotColor: "bg-red-500" },
];

export default function PrioritySelector({
  requestId,
  priority = "MEDIUM",
  onPriorityChange,
  disabled = false,
  size = "sm",
  className = "",
  showIcon = true,
}: PrioritySelectorProps) {
  const queryClient = useQueryClient();
  const currentPriority: Priority = ((priority || "MEDIUM").toUpperCase() as Priority) in PRIORITY_BADGE
    ? ((priority || "MEDIUM").toUpperCase() as Priority)
    : "MEDIUM";

  const priorityMutation = useMutation({
    mutationFn: async (newPriority: Priority) => {
      return await apiClient.patch<RequestDetail>(
        `/api/purchasing/requests/${requestId}/priority`,
        { priority: newPriority }
      );
    },
    onMutate: async (newPriority: Priority) => {
      // Optimistically update caches
      const reqIdStr = String(requestId);
      queryClient.setQueryData<RequestDetail>(["request", reqIdStr], (old) => {
        if (!old || !old.request) return old;
        return {
          ...old,
          request: {
            ...old.request,
            priority: newPriority,
          },
        };
      });

      queryClient.setQueryData<PurchaseRequest[]>(["recurring-requests"], (old = []) =>
        old.map((item) =>
          String(item.id) === reqIdStr ? { ...item, priority: newPriority } : item
        )
      );

      queryClient.setQueryData<PurchaseRequest[]>(["purchasing", "requests"], (old = []) =>
        old.map((item) =>
          String(item.id) === reqIdStr ? { ...item, priority: newPriority } : item
        )
      );

      return { previousPriority: currentPriority };
    },
    onSuccess: (_, newPriority) => {
      toast.success(`Priority updated to ${newPriority}`);
      if (onPriorityChange) {
        onPriorityChange(newPriority);
      }
      queryClient.invalidateQueries({ queryKey: ["request", String(requestId)] });
      queryClient.invalidateQueries({ queryKey: ["recurring-requests"] });
      queryClient.invalidateQueries({ queryKey: ["purchasing"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update priority");
      queryClient.invalidateQueries({ queryKey: ["request", String(requestId)] });
      queryClient.invalidateQueries({ queryKey: ["recurring-requests"] });
      queryClient.invalidateQueries({ queryKey: ["purchasing"] });
    },
  });

  const handleSelect = (e: React.MouseEvent, p: Priority) => {
    e.stopPropagation();
    if (p === currentPriority || priorityMutation.isPending || disabled) return;
    priorityMutation.mutate(p);
  };

  const badgeStyle = PRIORITY_BADGE[currentPriority] || PRIORITY_BADGE.MEDIUM;

  const sizeClasses = {
    xs: "text-[10px] px-1.5 py-0.5 gap-1",
    sm: "text-xs px-2 py-0.5 gap-1.5",
    default: "text-xs px-2.5 py-1 gap-1.5",
  }[size];

  if (disabled) {
    return (
      <Badge
        variant="outline"
        className={`font-semibold border ${sizeClasses} ${badgeStyle} ${className}`}
      >
        <span>{currentPriority}</span>
      </Badge>
    );
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center"
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          asChild
          disabled={priorityMutation.isPending}
        >
          <button
            type="button"
            className={`inline-flex items-center font-semibold rounded-md border transition-all cursor-pointer select-none hover:shadow-xs hover:ring-2 hover:ring-indigo-500/20 active:scale-95 group ${sizeClasses} ${badgeStyle} ${className}`}
            title="Click to change priority"
          >
            {priorityMutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            ) : null}
            <span>{currentPriority}</span>
            {showIcon && (
              <ChevronDown className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-36 p-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl rounded-lg text-xs"
        >
          <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Set Priority
          </div>
          {PRIORITIES.map((p) => {
            const isSelected = p.value === currentPriority;
            return (
              <DropdownMenuItem
                key={p.value}
                onClick={(e) => handleSelect(e, p.value)}
                className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-semibold"
                    : "text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/60"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${p.dotColor}`} />
                  <span>{p.label}</span>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

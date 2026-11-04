import { ArrowLeft, Clock, ExternalLink, Pencil, Trash2, Repeat, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ACTION_META } from "../../utils/purchasingMeta";
import type { RequestDetailViewState } from "../hooks/useRequestDetailTail";

export function TopNavigationRecordActions({ v }: { v: RequestDetailViewState }) {
  const { onAction, transition, available_actions, setIsEditOpen, canEditRequest, data, setActiveDetailTab, setIsConvertToRecurringOpen, request, setIsActivityLogsOpen, purchase_order, backLabel, backUrl, navigate } = v;
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap border-b border-border/40 pb-3">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-xs font-medium text-muted-foreground hover:text-foreground -ml-2 h-8 px-2"
          onClick={() => navigate(backUrl)}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to {backLabel}</span>
        </Button>

        <div className="flex items-center gap-2">
          {(request.item_url || purchase_order?.item_url) && (
            <a
              href={(request.item_url || purchase_order?.item_url || "").startsWith("http") ? (request.item_url || purchase_order?.item_url || "#") : `https://${request.item_url || purchase_order?.item_url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 transition-colors shadow-2xs shrink-0"
              title={`Open vendor product page: ${request.item_url || purchase_order?.item_url}`}
            >
              <ExternalLink className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>Open Link ↗</span>
            </a>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsActivityLogsOpen(true)}
            className="h-8 text-xs gap-1.5 shadow-xs"
          >
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Activity Logs</span>
          </Button>

          {canEditRequest && request.request_type !== "RECURRING" && request.request_type !== "SCHEDULED_PAYMENT" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConvertToRecurringOpen(true)}
              className="h-8 text-xs gap-1.5 shadow-xs text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            >
              <Repeat className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Convert to Recurring</span>
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => setActiveDetailTab("messages")}
            className="h-8 text-xs font-medium gap-1.5 border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 shadow-xs"
          >
            <MessageSquare className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
            <span>Message Thread</span>
            {data?.messages && data.messages.length > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-bold bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200">
                {data.messages.length}
              </Badge>
            )}
          </Button>

          {canEditRequest && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditOpen(true)}
              className="h-8 text-xs gap-1.5 shadow-xs"
            >
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Edit Request</span>
            </Button>
          )}

          {available_actions.includes("DELETE_REQUEST") && (
            <Button
              variant="destructive"
              size="sm"
              disabled={transition.isPending}
              onClick={() => onAction("DELETE_REQUEST")}
              className="h-8 text-xs gap-1.5 shadow-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{ACTION_META["DELETE_REQUEST"].label}</span>
            </Button>
          )}
        </div>
      </div>
  );
}

import { FileText, Package, ReceiptText, Truck, Landmark, CalendarClock, MessageSquare } from "lucide-react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PAYMENT_LABEL } from "../../utils/purchasingMeta";
import type { RequestDetailViewState } from "../hooks/useRequestDetailTail";

export function RequestOverview({ v }: { v: RequestDetailViewState }) {
  const { request, isScheduledPayment, hasRecurringTab, hasWireTab, inv, hasInvoiceTab, purchase_order, hasPoTab, hasItemsTab, data } = v;
  return (
    <div className="border-b border-slate-200 dark:border-zinc-800 pb-1">
              <TabsList className="h-auto p-1 bg-slate-100/90 dark:bg-zinc-800/90 rounded-lg flex flex-wrap items-center gap-1 w-full sm:w-auto justify-start">
                <TabsTrigger
                  value="overview"
                  className="text-xs px-3.5 h-8 gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs font-medium"
                >
                  <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Request Overview</span>
                </TabsTrigger>

                <TabsTrigger
                  value="messages"
                  className="text-xs px-3.5 h-8 gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs font-medium"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                  <span>Messages &amp; Thread</span>
                  {data?.messages && data.messages.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                      {data.messages.length}
                    </span>
                  )}
                </TabsTrigger>

                {hasItemsTab && (
                  <TabsTrigger
                    value="items"
                    className="text-xs px-3.5 h-8 gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs font-medium"
                  >
                    <Package className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Line Items &amp; Quotes</span>
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {request.items?.length || request.quote_data?.items?.length || 0}
                    </span>
                  </TabsTrigger>
                )}

                {hasPoTab && (
                  <TabsTrigger
                    value="po"
                    className="text-xs px-3.5 h-8 gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs font-medium"
                  >
                    <Truck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Purchase Order</span>
                    {purchase_order?.id && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        #{purchase_order.id}
                      </span>
                    )}
                  </TabsTrigger>
                )}

                {hasInvoiceTab && (
                  <TabsTrigger
                    value="invoice"
                    className="text-xs px-3.5 h-8 gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs font-medium"
                  >
                    <ReceiptText className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Invoice &amp; Bill</span>
                    {inv?.paid_date ? (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Paid
                      </span>
                    ) : inv?.payment_status ? (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        {PAYMENT_LABEL[inv.payment_status] || inv.payment_status}
                      </span>
                    ) : null}
                  </TabsTrigger>
                )}

                {hasWireTab && (
                  <TabsTrigger
                    value="wire"
                    className="text-xs px-3.5 h-8 gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs font-medium"
                  >
                    <Landmark className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Wire Transfer</span>
                  </TabsTrigger>
                )}

                {hasRecurringTab && (
                  <TabsTrigger
                    value="recurring"
                    className="text-xs px-3.5 h-8 gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs font-medium"
                  >
                    <CalendarClock className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                    <span>{isScheduledPayment ? "Milestones" : "Recurring Horizon"}</span>
                    {request.recurring_schedule?.completed_installments !== undefined && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300">
                        {request.recurring_schedule.completed_installments}/{request.recurring_schedule.total_installments || (request.recurring_schedule.schedule_dates?.length || 24)}
                      </span>
                    )}
                  </TabsTrigger>
                )}
              </TabsList>
            </div>
  );
}

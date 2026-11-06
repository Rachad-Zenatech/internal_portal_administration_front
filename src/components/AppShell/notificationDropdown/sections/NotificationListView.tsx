import { ChevronDown, ChevronUp, ShoppingCart, Inbox, Loader2, CheckCircle2, Clock3, RefreshCw, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Calendar, CalendarClock } from "lucide-react";
import { formatNotificationText, formatStatusLabel, formatRelativeTime, extractStatus, getStatusBadgeClass, formatMoney, isRecurringNotification } from "../utils";
import type { NotificationDropdownState } from "../hooks/useNotificationDropdown";

export function NotificationListView({ s }: { s: NotificationDropdownState }) {
  const { markAsRead, handleOpenLink, filteredNotifications, activeTab, toggleGroup, expandedGroups, requestGroups, reviewMutation, recurringItems, navigate, onClose, invoiceNotifications } = s;
  return (
    <>
      {activeTab === "invoices" ? (
            // Dedicated Accounts Receivable Invoices View
            invoiceNotifications.length === 0 ? (
              <div className="p-10 flex flex-col items-center justify-center text-center text-slate-400 dark:text-zinc-500">
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50 mb-3">
                  <Receipt className="h-6 w-6 stroke-1.5" />
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">No invoice updates</p>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-[320px]">
                  Real-time status changes, payments, generated invoices, and customer billing alerts will appear here.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onClose();
                    navigate("/account-receivable?tab=invoices");
                  }}
                  className="mt-4 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 cursor-pointer"
                >
                  <Receipt className="h-3.5 w-3.5 mr-1.5" />
                  <span>Go to Account Receivables</span>
                </Button>
              </div>
            ) : (
              invoiceNotifications.map((notif) => {
                const invNumMatch = (notif.title + " " + notif.message).match(/INV-[\w\d-]+/i);
                const invNum = invNumMatch ? invNumMatch[0].toUpperCase() : null;
                const status = extractStatus(notif.message) || extractStatus(notif.title);
                const isPaid = status === "COMPLETED" || (status && status.includes("PAID"));
                const targetUrl = notif.link_url || `/account-receivable?tab=invoices${notif.entity_id ? `&id=${notif.entity_id}` : ""}`;

                return (
                  <div
                    key={`inv-notif-${notif.id}`}
                    onClick={() => handleOpenLink(targetUrl, [notif])}
                    className={`p-3 px-4 flex items-start justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer group ${
                      !notif.is_read ? "bg-emerald-50/20 dark:bg-emerald-950/15" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* Icon */}
                      <div
                        className={`mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${
                          isPaid
                            ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
                            : status === "WAITING PAYMENT" || status === "UNDER REVIEW"
                            ? "bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                            : "bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300"
                        }`}
                      >
                        <Receipt className="h-4 w-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Line 1: Invoice Identifier + Title */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {invNum && (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-bold px-1.5 py-0 border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shrink-0 font-mono"
                            >
                              {invNum}
                            </Badge>
                          )}
                          <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate">
                            {formatNotificationText(notif.title)}
                          </span>
                        </div>

                        {/* Line 2: Status pill + Message details */}
                        <div className="flex items-center gap-2 mt-1 min-w-0 flex-wrap">
                          {status && (
                            <span
                              className={`inline-flex items-center gap-1 text-[9.5px] font-semibold px-2 py-0.5 rounded-full border shrink-0 whitespace-nowrap leading-none select-none ${
                                isPaid
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                                  : status === "WAITING PAYMENT"
                                  ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                                  : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75 shrink-0" />
                              <span>{formatStatusLabel(status)}</span>
                            </span>
                          )}
                          {notif.message && (
                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate flex-1 min-w-0">
                              {formatNotificationText(notif.message)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                        {formatRelativeTime(notif.created_at)}
                      </span>
                      {!notif.is_read ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notif.id);
                          }}
                          className="w-5 h-5 rounded-full flex items-center justify-center transition-colors hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-600 cursor-pointer"
                          title="Mark as read"
                        >
                          <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        </button>
                      ) : (
                        <span className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                );
              })
            )
          ) : activeTab === "recurring" ? (
            // Dedicated Live Recurring Payments & Incoming Due Dates View
            recurringItems.length === 0 ? (
              <div className="p-10 flex flex-col items-center justify-center text-center text-slate-400 dark:text-zinc-500">
                <div className="h-12 w-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/50 mb-3">
                  <RefreshCw className="h-6 w-6 stroke-1.5" />
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">No recurring updates</p>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-[300px]">
                  Updates, invoices recorded, and alerts for recurring payments will appear here.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onClose();
                    navigate("/purchasing/recurring");
                  }}
                  className="mt-4 text-xs font-semibold text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950 cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  <span>Go to Recurring Payments</span>
                </Button>
              </div>
            ) : (
              recurringItems.map((item) => {
                const isExpanded = !!expandedGroups[`rec-${item.id}`];
                const isReviewing = reviewMutation.isPending && (reviewMutation.variables as any)?.id === item.id;
                const isReviewed = item.reviewStatus === "REVIEWED";

                return (
                  <div
                    key={`rec-item-${item.id}`}
                    className={`transition-colors duration-150 ${
                      item.dueInfo.isOverdue
                        ? "bg-rose-50/30 dark:bg-rose-950/15"
                        : item.dueInfo.isDueToday
                        ? "bg-rose-50/40 dark:bg-rose-950/20"
                        : item.dueInfo.isDueSoon
                        ? "bg-amber-50/30 dark:bg-amber-950/15"
                        : item.hasUnread
                        ? "bg-purple-50/20 dark:bg-purple-950/15"
                        : ""
                    }`}
                  >
                    {/* Recurring Payment Card Header */}
                    <div
                      onClick={() => handleOpenLink(item.linkUrl, item.notifications)}
                      className="p-3 px-4 flex items-start gap-3 hover:bg-slate-50/80 dark:hover:bg-zinc-900/40 cursor-pointer group"
                    >
                      {/* Icon */}
                      <div
                        className={`mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${
                          item.dueInfo.isOverdue
                            ? "bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400"
                            : item.dueInfo.isDueSoon
                            ? "bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400"
                            : "bg-purple-50 dark:bg-purple-950/60 border-purple-200/80 dark:border-purple-800/60 text-purple-600 dark:text-purple-400"
                        }`}
                      >
                        {item.dueInfo.isOverdue ? (
                          <AlertTriangle className="h-4 w-4" />
                        ) : item.dueInfo.isDueSoon ? (
                          <CalendarClock className="h-4 w-4" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </div>

                      {/* Content Body */}
                      <div className="flex-1 min-w-0">
                        {/* Line 1: Identifier + Frequency + Title + Amount + Unread Dot */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <Badge
                              variant="outline"
                              className="text-[10px] font-bold px-1.5 py-0 border-purple-200 dark:border-purple-800 bg-purple-50/60 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 shrink-0 font-mono"
                            >
                              REC-#{item.id}
                            </Badge>
                            {item.frequency && (
                              <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 shrink-0">
                                {item.frequency.charAt(0).toUpperCase() + item.frequency.slice(1).toLowerCase().replace(/_/g, " ")}
                              </span>
                            )}
                            <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                              {item.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {item.amount > 0 && (
                              <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 font-mono">
                                {formatMoney(item.amount, item.currency)}
                              </span>
                            )}
                            {item.hasUnread && <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />}
                          </div>
                        </div>

                        {/* Line 2: Due Date Pill + Single Clear Status + Action Button */}
                        <div className="flex items-center justify-between mt-2 gap-2">
                          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                            {/* Due Date Alert */}
                            <span
                              className={`inline-flex items-center gap-1 text-[10.5px] px-2 py-0.5 rounded-md border shrink-0 whitespace-nowrap leading-none select-none ${item.dueInfo.badgeClass}`}
                            >
                              {item.dueInfo.isOverdue ? (
                                <AlertTriangle className="h-3 w-3 shrink-0" />
                              ) : item.dueInfo.isDueSoon ? (
                                <CalendarClock className="h-3 w-3 shrink-0" />
                              ) : (
                                <Calendar className="h-3 w-3 shrink-0" />
                              )}
                              <span>{item.dueInfo.dueLabel}</span>
                            </span>

                            {/* Interactive Review Status Toggle Pill */}
                            <button
                              type="button"
                              disabled={isReviewing}
                              onClick={(e) => {
                                e.stopPropagation();
                                reviewMutation.mutate({
                                  id: item.id,
                                  review_status: isReviewed ? "WAITING_FOR_REVIEW" : "REVIEWED",
                                });
                              }}
                              className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer select-none hover:opacity-85 active:scale-95 ${
                                isReviewed
                                  ? "bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800"
                                  : "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                              }`}
                              title={isReviewed ? "Click to reopen review" : "Click to mark as reviewed"}
                            >
                              {isReviewing ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : isReviewed ? (
                                <CheckCircle2 className="w-3 h-3 text-sky-600 dark:text-sky-400 shrink-0" />
                              ) : (
                                <Clock3 className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                              )}
                              <span>{isReviewed ? "Reviewed" : "Waiting for Review"}</span>
                              <span className="text-[9px] opacity-60 font-normal">
                                ({isReviewed ? "Reopen" : "Mark Review"})
                              </span>
                            </button>

                            {/* Workflow Status (if beyond Under Review, e.g. Waiting Payment, Approved, Completed) */}
                            {item.workflowStatus && item.workflowStatus !== "UNDER_REVIEW" && (
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${getStatusBadgeClass(
                                  item.workflowStatus
                                )}`}
                              >
                                <span>{formatStatusLabel(item.workflowStatus)}</span>
                              </span>
                            )}
                          </div>

                          {/* Updates Link Toggle (Right-aligned) */}
                          {item.notifications.length > 0 && (
                            <button
                              type="button"
                              onClick={(e) => toggleGroup(`rec-${item.id}`, e)}
                              className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-0.5 shrink-0 ml-1 cursor-pointer"
                            >
                              <span>{item.notifications.length} updates</span>
                              {isExpanded ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Activity & Stepper History */}
                    {isExpanded && item.notifications.length > 0 && (
                      <div className="pl-14 pr-4 pb-3 pt-1 space-y-2 bg-purple-50/30 dark:bg-purple-950/10 border-t border-purple-100/60 dark:border-purple-900/30">
                        <div className="relative border-l-2 border-purple-200 dark:border-purple-800 ml-2 pl-3 space-y-3 pt-1">
                          {item.notifications.map((n, i) => {
                            const stepStatus = extractStatus(n.message) || extractStatus(n.title);
                            return (
                              <div key={n.id || i} className="relative group/step">
                                <div
                                  className={`absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-zinc-950 ${
                                    !n.is_read
                                      ? "bg-purple-600 ring-2 ring-purple-100 dark:ring-purple-900"
                                      : "bg-slate-300 dark:bg-zinc-600"
                                  }`}
                                />
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                    {stepStatus && (
                                      <span
                                        className={`inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.2 rounded-full border shrink-0 whitespace-nowrap leading-none select-none ${getStatusBadgeClass(
                                          stepStatus
                                        )}`}
                                      >
                                        <span className="w-1 h-1 rounded-full bg-current opacity-75 shrink-0" />
                                        <span className="whitespace-nowrap">{formatStatusLabel(stepStatus)}</span>
                                      </span>
                                    )}
                                    <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate">
                                      {formatNotificationText(n.title)}
                                    </p>
                                  </div>
                                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 shrink-0">
                                    {formatRelativeTime(n.created_at)}
                                  </span>
                                </div>
                                {n.message && (
                                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                                    {formatNotificationText(n.message)}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )
          ) : activeTab === "grouped" ? (
            // Grouped By Request View
            requestGroups.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center text-slate-400 dark:text-zinc-500">
                <Inbox className="h-9 w-9 mb-2 stroke-1" />
                <p className="text-sm font-medium">No purchase request notifications yet</p>
                <p className="text-xs mt-1">Updates on requests will appear here automatically</p>
              </div>
            ) : (
              requestGroups.map((grp) => {
                const isExpanded = !!expandedGroups[grp.key];
                return (
                  <div
                    key={grp.key}
                    className={`transition-colors duration-150 ${
                      grp.hasUnread ? "bg-blue-50/20 dark:bg-blue-950/10" : ""
                    }`}
                  >
                    {/* Group Header Card */}
                    <div
                      onClick={() => handleOpenLink(grp.linkUrl, grp.notifications)}
                      className="p-3 px-4 flex items-start gap-3 hover:bg-slate-50/80 dark:hover:bg-zinc-900/40 cursor-pointer group"
                    >
                      {/* Icon */}
                      <div className="mt-0.5 h-8 w-8 rounded-lg bg-blue-50 dark:bg-zinc-800 border border-blue-100 dark:border-zinc-700 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                        <ShoppingCart className="h-4 w-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Line 1: Request Badge + Title + Time */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {grp.requestId && (
                              <Badge variant="outline" className="text-[10px] font-bold px-1.5 py-0 border-slate-300 dark:border-zinc-700 shrink-0 font-mono">
                                REQ-{grp.requestId}
                              </Badge>
                            )}
                            <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                              {grp.requestTitle}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {grp.hasUnread && (
                              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                            )}
                            <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">
                              {formatRelativeTime(grp.latestDate)}
                            </span>
                          </div>
                        </div>

                        {/* Line 2: Status tag + Notification preview + steps toggle */}
                        <div className="flex items-center justify-between mt-1.5 gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {grp.latestStatus && (
                              <span
                                className={`inline-flex items-center gap-1 text-[9.5px] font-semibold px-2 py-0.5 rounded-full border shrink-0 whitespace-nowrap leading-none tracking-normal select-none ${getStatusBadgeClass(grp.latestStatus)}`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75 shrink-0" />
                                <span className="whitespace-nowrap">{formatStatusLabel(grp.latestStatus)}</span>
                              </span>
                            )}
                            <span className="text-xs text-slate-500 dark:text-zinc-400 truncate min-w-0 flex-1">
                              {grp.notifications[0]?.message ? formatNotificationText(grp.notifications[0].message) : "Activity on request"}
                            </span>
                          </div>

                          {grp.notifications.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => toggleGroup(grp.key, e)}
                              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 shrink-0 ml-1 cursor-pointer"
                            >
                              <span>{grp.notifications.length} steps</span>
                              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Stepper Timeline */}
                    {isExpanded && grp.notifications.length > 1 && (
                      <div className="pl-14 pr-4 pb-3 pt-1 space-y-2 bg-slate-50/50 dark:bg-zinc-900/20 border-t border-slate-100 dark:border-zinc-800/50">
                        <div className="relative border-l-2 border-slate-200 dark:border-zinc-700 ml-2 pl-3 space-y-3 pt-1">
                          {grp.notifications.map((n, i) => {
                            const stepStatus = extractStatus(n.message) || extractStatus(n.title);
                            return (
                              <div key={n.id || i} className="relative group/step">
                                <div className={`absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-zinc-950 ${
                                  !n.is_read ? "bg-blue-600 ring-2 ring-blue-100 dark:ring-blue-900" : "bg-slate-300 dark:bg-zinc-600"
                                }`} />
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                    {stepStatus && (
                                      <span
                                        className={`inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.2 rounded-full border shrink-0 whitespace-nowrap leading-none select-none ${getStatusBadgeClass(stepStatus)}`}
                                      >
                                        <span className="w-1 h-1 rounded-full bg-current opacity-75 shrink-0" />
                                        <span className="whitespace-nowrap">{formatStatusLabel(stepStatus)}</span>
                                      </span>
                                    )}
                                    <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate">
                                      {formatNotificationText(n.title)}
                                    </p>
                                  </div>
                                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 shrink-0">
                                    {formatRelativeTime(n.created_at)}
                                  </span>
                                </div>
                                {n.message && (
                                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                                    {formatNotificationText(n.message)}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )
          ) : (
            // Timeline & Unread View (Refined clean 2-row layout with recurring indicator)
            filteredNotifications.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center text-slate-400 dark:text-zinc-500">
                <Inbox className="h-9 w-9 mb-2 stroke-1" />
                <p className="text-sm font-medium">
                  {activeTab === "unread" ? "No unread notifications" : "No notifications"}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isRecurring = isRecurringNotification(notif);
                const status = extractStatus(notif.message) || extractStatus(notif.title);
                let reqId = notif.entity_id;
                if (!reqId && notif.link_url) {
                  const m = notif.link_url.match(/\/(?:requests|recurring)\/(\d+)/);
                  if (m) reqId = m[1];
                }

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleOpenLink(notif.link_url, [notif])}
                    className={`p-3 px-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-zinc-900/50 cursor-pointer group ${
                      !notif.is_read
                        ? isRecurring
                          ? "bg-purple-50/20 dark:bg-purple-950/15"
                          : "bg-blue-50/20 dark:bg-blue-950/10"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`h-7 w-7 rounded-lg border flex items-center justify-center shrink-0 ${
                          isRecurring
                            ? "bg-purple-50 dark:bg-purple-950/60 border-purple-200/80 dark:border-purple-800/60 text-purple-600 dark:text-purple-400"
                            : "bg-blue-50 dark:bg-zinc-800 border-blue-100 dark:border-zinc-700 text-blue-600 dark:text-blue-400"
                        }`}
                      >
                        {isRecurring ? <RefreshCw className="h-3.5 w-3.5" /> : <ShoppingCart className="h-3.5 w-3.5" />}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        {/* Line 1: Badge + Title */}
                        <div className="flex items-center gap-1.5 min-w-0">
                          {reqId ? (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded border shrink-0 font-mono ${
                                isRecurring
                                  ? "border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300"
                                  : "border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                              }`}
                            >
                              {isRecurring ? `REC-${reqId}` : `REQ-${reqId}`}
                            </span>
                          ) : isRecurring ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 shrink-0 font-mono">
                              REC
                            </span>
                          ) : null}
                          <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate flex-1">
                            {formatNotificationText(notif.title)}
                          </span>
                        </div>

                        {/* Line 2: Status tag + Message excerpt */}
                        <div className="flex items-center gap-2 min-w-0">
                          {status && (
                            <span
                              className={`inline-flex items-center gap-1 text-[9.5px] font-semibold px-2 py-0.5 rounded-full border shrink-0 whitespace-nowrap leading-none tracking-normal select-none ${getStatusBadgeClass(
                                status
                              )}`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75 shrink-0" />
                              <span className="whitespace-nowrap">{formatStatusLabel(status)}</span>
                            </span>
                          )}
                          {notif.message && (
                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate flex-1 min-w-0">
                              {formatNotificationText(notif.message)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                        {formatRelativeTime(notif.created_at)}
                      </span>
                      {!notif.is_read ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notif.id);
                          }}
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                            isRecurring
                              ? "hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-600"
                              : "hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600"
                          }`}
                          title="Mark as read"
                        >
                          <span className={`w-2 h-2 rounded-full ${isRecurring ? "bg-purple-600" : "bg-blue-600"}`} />
                        </button>
                      ) : (
                        <span className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                );
              })
            )
          )}
    </>
  );
}

import { Link } from "react-router-dom";
import { FileSpreadsheet, Paperclip, Loader2, CheckCircle2, FolderArchive, FileText, Zap, AlertTriangle, Building2, CreditCard, Tag, ChevronDown, ExternalLink, Database, Trash2, Eye, MapPin, Sparkles, Banknote, Landmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { exportSingleRequestQuickBooksXlsx, exportSingleRequestQuickBooksCsv, exportSingleRequestQuickBooksBundle } from "@/services/purchasingService";
import { isMaItem } from "../utils";
import type { QuickBooksState } from "../hooks/useQuickBooks";

/** The staging rows; `rows` is the part of `s.filteredItems` scrolled into view so far */
export function RequestIdTags({ s, rows }: { s: QuickBooksState; rows: QuickBooksState["filteredItems"] }) {
  const { deletingId, setDeleteConfirmItem, isConnected, handleSingleSync, setIsInspectorOpen, setInspectorItem, stagingTab, handleToggleSelect, syncingSingleId, currentTabSelectedIds } = s;
  return (
    <>
      {rows.map((item, idx) => {
                      const isSelected = currentTabSelectedIds.includes(item.request_id);
                      const isReady = item.readiness === "READY" || item.readiness === "READY_WITH_NOTES";
                      const isSynced = item.readiness === "ALREADY_SYNCED" || item.is_already_synced;
                      const isCurrentlySyncing = syncingSingleId === item.request_id;
                      const isAr = Boolean(item.is_ar || item.type === "ar_invoice" || stagingTab === "ar_invoices");
                      const isMa = !isAr && isMaItem(item);
                      const isBillRow = !isAr && !isMa && (item.transaction_category === "BILL" || (Boolean(item.is_recurring) && item.transaction_category !== "EXPENSE"));
                      const rowKey = `row-${stagingTab}-${item.request_id}-${item.inv_id ?? ""}-${item.doc_number ?? ""}-${item.workflow_id ?? item.id ?? ""}-${idx}`;

                      return (
                        <TableRow
                          key={rowKey}
                          onClick={() => {
                            setInspectorItem(item);
                            setIsInspectorOpen(true);
                          }}
                          className={`transition-colors border-b border-border/50 cursor-pointer ${isSelected
                              ? stagingTab === "expenses"
                                ? "bg-emerald-50/40 dark:bg-emerald-950/15"
                                : stagingTab === "ma_payments"
                                ? "bg-purple-50/40 dark:bg-purple-950/15"
                                : stagingTab === "bills"
                                ? "bg-blue-50/40 dark:bg-blue-950/15"
                                : "bg-teal-50/40 dark:bg-teal-950/15"
                              : "hover:bg-muted/60"
                            }`}
                        >
                          <TableCell
                            className="w-10 px-3 cursor-pointer select-none"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSelect(item.request_id);
                            }}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleToggleSelect(item.request_id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </TableCell>

                          {/* Request ID + Tags */}
                          <TableCell className="w-28 font-semibold" onClick={(e) => e.stopPropagation()}>
                            <div className="space-y-1">
                              {isAr ? (
                                <Link
                                   to={`/account-receivable`}
                                  className="inline-flex items-center gap-1 font-mono text-xs text-teal-600 dark:text-teal-400 hover:underline"
                                >
                                  <span>{item.ref_no ? `AR-#${item.ref_no}` : `AR-#${String(item.workflow_id || item.id || item.request_id).slice(0, 8)}`}</span>
                                  <ExternalLink className="h-3 w-3 opacity-60" />
                                </Link>
                              ) : (
                                <Link
                                  to={`/purchasing/requests/${item.request_id}`}
                                  className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
                                >
                                  <span>{isBillRow ? `REC-#${item.request_id}` : `REQ-#${item.request_id}`}</span>
                                  <ExternalLink className="h-3 w-3 opacity-60" />
                                </Link>
                              )}

                              {/* Type Badges */}
                              {isAr ? (
                                <Badge className="text-[10px] px-1.5 py-0 h-4 bg-teal-100 text-teal-800 dark:bg-teal-950/90 dark:text-teal-300 border border-teal-300 dark:border-teal-700 flex items-center gap-1 font-bold">
                                  <Banknote className="h-2.5 w-2.5 text-teal-600 dark:text-teal-400" />
                                  <span>Reconciled</span>
                                </Badge>
                              ) : isMa ? (
                                <Badge className="text-[10px] px-1.5 py-0 h-4 bg-purple-100 text-purple-800 dark:bg-purple-950/90 dark:text-purple-300 border border-purple-300 dark:border-purple-700 flex items-center gap-1 font-bold">
                                  <Sparkles className="h-2.5 w-2.5 text-purple-600 dark:text-purple-400" />
                                  <span>M&amp;A</span>
                                </Badge>
                              ) : isBillRow ? (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300">
                                  <span>Recurring</span>
                                </Badge>
                              ) : null}
                            </div>
                          </TableCell>

                          {/* Txn / Bill / Deposit Date */}
                          <TableCell className="w-24 text-muted-foreground whitespace-nowrap">
                            {item.payment_date || item.doc_number}
                          </TableCell>

                          {/* Due Date (for Bills) */}
                          {stagingTab === "bills" && (
                            <TableCell className="w-24 text-muted-foreground whitespace-nowrap font-medium">
                              {item.due_date || item.payment_date}
                            </TableCell>
                          )}

                          {/* Vendor or Customer */}
                          <TableCell className="w-48">
                            <div className="space-y-1">
                              <div className="font-semibold text-foreground flex items-center gap-1.5 truncate max-w-[180px]">
                                <Building2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                <span className="truncate">{item.vendor_resolution?.name || item.raw_payee}</span>
                              </div>
                              {item.vendor_resolution?.status === "EXISTS" ? (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 font-medium">
                                  Mapped in QBO
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800 font-medium">
                                  Auto-Create in QBO
                                </Badge>
                              )}
                            </div>
                          </TableCell>

                          {/* Expense / A/R GL Account */}
                          <TableCell className="w-52">
                            <div className="space-y-1">
                              <div className="font-medium text-foreground truncate max-w-[200px] flex items-center gap-1.5">
                                <Tag className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                <span className="truncate">
                                  {isAr
                                    ? (item.expense_account_resolution?.name || item.account_number || "1100 - Accounts Receivable")
                                    : (item.expense_account_resolution?.name || item.category || "Expense")}
                                </span>
                              </div>
                              {isAr ? (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                                  GL: {item.expense_account_resolution?.acct_num || (item.account_number ? item.account_number.split(" - ")[0] : "1100")}
                                </Badge>
                              ) : item.expense_account_resolution?.acct_num ? (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                                  GL: {item.expense_account_resolution.acct_num}
                                </Badge>
                              ) : (
                                <span className="text-[10px] text-muted-foreground font-mono truncate block">
                                  {item.category?.split(":")[0] || ""}
                                </span>
                              )}
                            </div>
                          </TableCell>

                          {/* Payment Account (Expenses & M&A) or Location (Bills) or Bank Account (A/R) */}
                          {stagingTab === "expenses" || stagingTab === "ma_payments" ? (
                            <TableCell className="w-44">
                              <div className="space-y-1">
                                <div className="text-muted-foreground truncate max-w-[160px] flex items-center gap-1.5">
                                  {stagingTab === "ma_payments" ? (
                                    <Landmark className="h-3.5 w-3.5 flex-shrink-0 text-purple-600 dark:text-purple-400" />
                                  ) : (
                                    <CreditCard className="h-3.5 w-3.5 flex-shrink-0" />
                                  )}
                                  <span className="truncate">{item.payment_account_resolution?.name || (stagingTab === "ma_payments" ? "Operating Wire Account" : "Business Credit Card")}</span>
                                </div>
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-mono ${
                                  stagingTab === "ma_payments"
                                    ? "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200"
                                    : ""
                                }`}>
                                  {item.payment_method || (stagingTab === "ma_payments" ? "Wire Transfer" : "Credit Card")}
                                </Badge>
                              </div>
                            </TableCell>
                          ) : stagingTab === "bills" ? (
                            <TableCell className="w-44">
                              <div className="space-y-1">
                                <div className="text-foreground truncate max-w-[160px] flex items-center gap-1.5 font-medium">
                                  <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                  <span className="truncate">{item.location || item.from_location || "HQ"}</span>
                                </div>
                                <span className="text-[10px] text-muted-foreground font-mono truncate block">
                                  Dept: {item.department || "General"}
                                </span>
                              </div>
                            </TableCell>
                          ) : (
                            <TableCell className="w-44">
                              <div className="space-y-1">
                                <div className="text-foreground truncate max-w-[160px] flex items-center gap-1.5 font-medium">
                                  <Banknote className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                  <span className="truncate">{item.payment_account_resolution?.name || item.bank_name || "Operating Checking"}</span>
                                </div>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                                  {item.payment_method || "ACH / Wire"}
                                </Badge>
                              </div>
                            </TableCell>
                          )}

                          {/* Product / Invoices Description */}
                          <TableCell className="min-w-[200px]">
                            <div className="max-w-[260px] space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-foreground line-clamp-1">{item.product_name || "Transaction Item"}</span>
                                {isAr ? (
                                  <Badge className="text-[9.5px] px-1.5 py-0 h-4 bg-teal-100 text-teal-800 dark:bg-teal-950/90 dark:text-teal-300 border border-teal-300 dark:border-teal-700 flex items-center gap-1 font-bold shrink-0 shadow-2xs">
                                    <Banknote className="h-2.5 w-2.5 text-teal-600 dark:text-teal-400" />
                                    <span>Cash App</span>
                                  </Badge>
                                ) : isMa ? (
                                  <Badge className="text-[9.5px] px-1.5 py-0 h-4 bg-purple-100 text-purple-800 dark:bg-purple-950/90 dark:text-purple-300 border border-purple-300 dark:border-purple-700 flex items-center gap-1 font-bold shrink-0 shadow-2xs">
                                    <Sparkles className="h-2.5 w-2.5 text-purple-600 dark:text-purple-400" />
                                    <span>M&amp;A</span>
                                  </Badge>
                                ) : isBillRow ? (
                                  <Badge variant="outline" className="text-[9.5px] px-1.5 py-0 h-4 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300 shrink-0 font-medium">
                                    <span>Recurring</span>
                                  </Badge>
                                ) : null}
                                {item.attachments_count && item.attachments_count > 0 ? (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-mono gap-0.5 shrink-0 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800" title={`${item.attachments_count} attachment(s) will sync to QuickBooks`}>
                                    <Paperclip className="h-2.5 w-2.5" />
                                    <span>{item.attachments_count}</span>
                                  </Badge>
                                ) : null}
                              </div>
                              <div className="flex flex-wrap gap-x-2 text-[10px] text-muted-foreground">
                                {item.class && (
                                  <span>Class: <strong className="font-medium text-slate-700 dark:text-zinc-300">{item.class}</strong></span>
                                )}
                                {(item.location || item.from_location) && (
                                  <span>From: <strong className="font-medium text-slate-700 dark:text-zinc-300">{item.location || item.from_location}</strong></span>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          {/* Amount */}
                          <TableCell className="w-28 text-right font-mono font-bold text-foreground">
                            {item.formatted_amount || `$${item.amount?.toFixed(2)}`}
                          </TableCell>

                          {/* Pre-Flight Status */}
                          <TableCell className="w-36">
                            {isReady ? (
                              <Badge className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 gap-1">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                <span>Ready to Sync</span>
                              </Badge>
                            ) : isSynced ? (
                              <Badge variant="secondary" className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 gap-1">
                                <Database className="h-3 w-3" />
                                <span>In QuickBooks</span>
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="text-[11px] font-semibold gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                <span>Review Required</span>
                              </Badge>
                            )}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="w-32 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setInspectorItem(item);
                                  setIsInspectorOpen(true);
                                }}
                                title="View all additional info and QuickBooks mappings"
                                className="h-7 px-2 text-xs text-primary hover:text-primary/80 font-medium gap-1 hover:bg-primary/10"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>Details</span>
                              </Button>

                              <Button
                                size="sm"
                                variant={isSynced ? "outline" : "default"}
                                disabled={isCurrentlySyncing || !isConnected}
                                onClick={() => handleSingleSync(item)}
                                className={`h-7 px-2.5 text-xs font-semibold gap-1 ${
                                  !isSynced
                                    ? isAr
                                      ? "bg-teal-600 hover:bg-teal-500 text-white shadow-2xs"
                                      : isBillRow
                                      ? "bg-blue-600 hover:bg-blue-500 text-white shadow-2xs"
                                      : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs"
                                    : ""
                                }`}
                              >
                                {isCurrentlySyncing ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Zap className="h-3 w-3" />
                                )}
                                <span>{isSynced ? "Re-Sync" : "Sync"}</span>
                              </Button>

                              {isSynced && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={deletingId === item.request_id || !isConnected}
                                  onClick={() => setDeleteConfirmItem(item)}
                                  title="Remove transaction from QuickBooks Online"
                                  className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1"
                                >
                                  {deletingId === item.request_id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3.5 w-3.5" />
                                  )}
                                  <span className="hidden sm:inline">Remove</span>
                                </Button>
                              )}

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground">
                                    <ChevronDown className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44 text-xs">
                                  <DropdownMenuLabel>Export Row</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => exportSingleRequestQuickBooksXlsx(String(item.request_id))}>
                                    <FileSpreadsheet className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                                    <span>Download Excel (.xlsx)</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => exportSingleRequestQuickBooksCsv(String(item.request_id))}>
                                    <FileText className="h-3.5 w-3.5 mr-2 text-blue-600" />
                                    <span>Download CSV (.csv)</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => exportSingleRequestQuickBooksBundle(String(item.request_id))}>
                                    <FolderArchive className="h-3.5 w-3.5 mr-2 text-purple-600" />
                                    <span>Download Bundle (.zip)</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
    </>
  );
}

import { Calendar, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { QuickBooksState } from "../hooks/useQuickBooks";

export function SaasantFilterControlBar({ s }: { s: QuickBooksState }) {
  const { stagingTab, filteredItems, clearDateFilter, endDate, startDate, setDatePreset, setEndDate, setStartDate, applyDatePreset, datePreset, statusFilter, setStatusFilter, requestTypeFilter, setRequestTypeFilter, requestTypeOptions, setSearchQuery, searchQuery } = s;
  return (
    <Card className="border-border/70 shadow-2xs bg-card">
            <CardContent className="p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                {/* Search Bar */}
                <div className="relative min-w-[200px] max-w-xs flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder={`Search ${stagingTab === "expenses" ? "expenses" : stagingTab === "ma_payments" ? "M&A scheduled payments" : stagingTab === "bills" ? "recurring bills" : "A/R cash apps"}, customer, vendor, account...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8.5 text-xs pl-8 bg-background/80"
                  />
                </div>

                {/* Request Type Scope Filter (Dynamically based on active main tab) */}
                <div className="flex items-center rounded-lg border border-border/80 bg-muted/40 p-0.5">
                  {requestTypeOptions.map((rt) => (
                    <button
                      key={rt.id}
                      type="button"
                      onClick={() => setRequestTypeFilter(rt.id)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                        requestTypeFilter === rt.id
                          ? "bg-background text-foreground font-semibold shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {rt.label}
                    </button>
                  ))}
                </div>

                {/* Status Filter */}
                <div className="flex items-center rounded-lg border border-border/80 bg-muted/40 p-0.5">
                  {[
                    { id: "ALL", label: "All Status" },
                    { id: "READY", label: "Ready to Sync" },
                    { id: "SYNCED", label: "In QuickBooks" },
                    { id: "ERROR", label: "Issues" },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setStatusFilter(st.id)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                        statusFilter === st.id
                          ? "bg-background text-foreground font-semibold shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                {/* Date Range Filter Group */}
                <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg border border-border/80 bg-muted/20">
                  <div className="flex items-center gap-1 px-1.5 text-xs font-semibold text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="hidden sm:inline">Date:</span>
                  </div>

                  {/* Quick Presets */}
                  <Select value={datePreset} onValueChange={(val) => applyDatePreset(val)}>
                    <SelectTrigger className="h-7.5 text-xs w-28 bg-background border-border/60">
                      <SelectValue placeholder="Preset" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL" className="text-xs">All Time</SelectItem>
                      <SelectItem value="TODAY" className="text-xs">Today</SelectItem>
                      <SelectItem value="YESTERDAY" className="text-xs">Yesterday</SelectItem>
                      <SelectItem value="LAST_7_DAYS" className="text-xs">Last 7 Days</SelectItem>
                      <SelectItem value="THIS_MONTH" className="text-xs">This Month</SelectItem>
                      <SelectItem value="CUSTOM" className="text-xs">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* From Date */}
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-muted-foreground">From</span>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setDatePreset("CUSTOM");
                      }}
                      className="h-7.5 text-xs w-32 px-2 bg-background border-border/60 font-mono"
                      title="Start Date (e.g. 2026-09-16)"
                    />
                  </div>

                  {/* To Date */}
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-muted-foreground">To</span>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setDatePreset("CUSTOM");
                      }}
                      placeholder="Optional"
                      className="h-7.5 text-xs w-32 px-2 bg-background border-border/60 font-mono"
                      title="End Date (leave empty to filter only the From date)"
                    />
                  </div>

                  {/* Clear Date Button */}
                  {(startDate || endDate) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearDateFilter}
                      className="h-7.5 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                      title="Clear date filter"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span className="hidden md:inline">Clear</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Staging Summary */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>
                  Showing <strong className="text-foreground">{filteredItems.length}</strong>{" "}
                  {stagingTab === "expenses" ? "expenses" : stagingTab === "bills" ? "bills" : "A/R invoices"}
                </span>
              </div>
            </CardContent>
          </Card>
  );
}

import { Download, Loader2, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MONTHS } from "../constants";
import type { QuickBooksState } from "../hooks/useQuickBooks";

export function ExportTimeframeCard({ s }: { s: QuickBooksState }) {
  const { isExporting, handleExport, setSelectedMonth, selectedMonth, years, setSelectedYear, selectedYear, filterType, setEndDateTime, endDateTime, setStartDateTime, startDateTime, selectedRequestIds, setFilterType } = s;
  return (
    <div className="space-y-4">
              <Card className="border-border/70 shadow-2xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-blue-600" />
                    <span>Export Time Horizon</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Filter transactions by completion timestamp.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Filter Mode</Label>
                    <div className="grid grid-cols-4 gap-1.5 p-1 bg-muted/60 rounded-lg border border-border/70">
                      {[
                        { id: "SELECTED", label: `Selected (${selectedRequestIds.length})` },
                        { id: "TODAY", label: "Today" },
                        { id: "DATETIME_RANGE", label: "Range" },
                        { id: "MONTH_YEAR", label: "Month" },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setFilterType(f.id as any)}
                          className={`py-1 text-xs font-semibold rounded-md transition-all ${filterType === f.id
                              ? "bg-background text-foreground shadow-2xs"
                              : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filterType === "SELECTED" && (
                    <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-emerald-900 dark:text-emerald-200 block">
                          Selected Transactions ({selectedRequestIds.length})
                        </span>
                        {selectedRequestIds.length > 0 && (
                          <Badge variant="outline" className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border-emerald-300">
                            {selectedRequestIds.length} Requests
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-[11px]">
                        {selectedRequestIds.length > 0
                          ? `Exports only the ${selectedRequestIds.length} purchase/bill transaction(s) you checked in the staging table.`
                          : "No transactions currently selected. Check items in the Staging table or select a time horizon above."}
                      </p>
                    </div>
                  )}

                  {filterType === "TODAY" && (
                    <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10 text-xs space-y-1.5">
                      <span className="font-semibold text-emerald-900 dark:text-emerald-200 block">Today's Batch</span>
                      <p className="text-muted-foreground text-[11px]">
                        Exports all purchase items completed today between 00:00:00 and 23:59:59.
                      </p>
                    </div>
                  )}

                  {filterType === "DATETIME_RANGE" && (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Start Datetime</Label>
                        <Input
                          type="datetime-local"
                          value={startDateTime}
                          onChange={(e) => setStartDateTime(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">End Datetime</Label>
                        <Input
                          type="datetime-local"
                          value={endDateTime}
                          onChange={(e) => setEndDateTime(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {filterType === "MONTH_YEAR" && (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Year</Label>
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Year" />
                          </SelectTrigger>
                          <SelectContent>
                            {years.map((y) => (
                              <SelectItem key={y.value} value={y.value} className="text-xs">
                                {y.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Month</Label>
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Month" />
                          </SelectTrigger>
                          <SelectContent className="max-h-52">
                            {MONTHS.map((m) => (
                              <SelectItem key={m.value} value={m.value} className="text-xs">
                                {m.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={() => handleExport()}
                    disabled={isExporting}
                    className="w-full text-xs font-semibold gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs mt-2"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Compiling Package...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-3.5 w-3.5" />
                        <span>Download Export Package</span>
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
  );
}

import { FileSpreadsheet, Download, FolderArchive, FileText, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { QuickBooksState } from "../hooks/useQuickBooks";

export function ExportArchiveCard({ s }: { s: QuickBooksState }) {
  const { setExportMode, exportMode } = s;
  return (
    <div className="md:col-span-2 space-y-4">
              <Card className="border-border/70 shadow-2xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <FolderArchive className="h-4 w-4 text-emerald-600" />
                    <span>Select Transaction Export Package</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Download QuickBooks Online ready workbooks, documentation archives, and reconciliation reports.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    {
                      id: "BUNDLE",
                      label: "Full Package Bundle (.zip)",
                      badge: "Recommended",
                      desc: "Master .xlsx workbook, complete PDF invoices/receipts, and audit manifest for accounting archive.",
                      icon: FolderArchive,
                      color: "text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800",
                    },
                    {
                      id: "XLSX",
                      label: "QuickBooks Online Excel Import (.xlsx)",
                      badge: "Spreadsheet",
                      desc: "Formatted with standard QBO columns: Payee, Date, Account, Method, Ref, Location, GL Code, Description, Amount.",
                      icon: FileSpreadsheet,
                      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
                    },
                    {
                      id: "CSV",
                      label: "QuickBooks Online Standard CSV (.csv)",
                      badge: "Flat File",
                      desc: "Comma-separated UTF-8 file formatted for QuickBooks Desktop / Online manual import.",
                      icon: FileText,
                      color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
                    },
                    {
                      id: "DOCUMENTS",
                      label: "Invoice & Attachment Documents Only (.zip)",
                      badge: "PDFs & Receipts",
                      desc: "All vendor invoice files, delivery slips, and quote PDFs organized into clean subdirectories.",
                      icon: Download,
                      color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
                    },
                    {
                      id: "RECONCILIATION",
                      label: "Audit & Monthly Reconciliation Ledger (.csv)",
                      badge: "Audit Trail",
                      desc: "Extended internal financial reconciliation dataset with PO numbers, approver notes, and line items.",
                      icon: ShieldCheck,
                      color: "text-slate-600 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800",
                    },
                  ].map((pkg) => {
                    const isSelected = exportMode === pkg.id;
                    const IconComp = pkg.icon;
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setExportMode(pkg.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${isSelected
                            ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/15 ring-1 ring-emerald-500 shadow-xs"
                            : "border-border/70 hover:border-border hover:bg-muted/30"
                          }`}
                      >
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 border ${pkg.color}`}>
                          <IconComp className="h-5 w-5" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-foreground">{pkg.label}</span>
                            <Badge variant="outline" className="text-[10px] font-semibold">
                              {pkg.badge}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{pkg.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
  );
}

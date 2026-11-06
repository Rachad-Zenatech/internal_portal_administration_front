import { CreditCard, Receipt, Banknote, Landmark } from "lucide-react";
import type { QuickBooksState } from "../hooks/useQuickBooks";

export function SubTabNavigationFor({ s }: { s: QuickBooksState }) {
  const { stagingTab, arCount, setStagingTab, billsCount, maCount, expensesCount } = s;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/40 p-1.5 rounded-xl border border-border/70">
            <div className="flex items-center gap-1.5 bg-background/90 p-1 rounded-lg border border-border/60 shadow-2xs flex-wrap">
              <button
                type="button"
                onClick={() => setStagingTab("expenses")}
                className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
                  stagingTab === "expenses"
                    ? "bg-[#2ca01c] text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <CreditCard className="h-3.5 w-3.5" />
                <span>Purchasing Expenses</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  stagingTab === "expenses" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                }`}>
                  {expensesCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStagingTab("ma_payments")}
                className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
                  stagingTab === "ma_payments"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Landmark className="h-3.5 w-3.5" />
                <span>M&amp;A Scheduled Payments</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  stagingTab === "ma_payments" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                }`}>
                  {maCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStagingTab("bills")}
                className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
                  stagingTab === "bills"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Receipt className="h-3.5 w-3.5" />
                <span>Bills (Recurring Vendor Payments)</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  stagingTab === "bills" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                }`}>
                  {billsCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStagingTab("ar_invoices")}
                className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
                  stagingTab === "ar_invoices"
                    ? "bg-teal-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Banknote className="h-3.5 w-3.5" />
                <span>A/R Invoices (Reconciled Cash Apps)</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  stagingTab === "ar_invoices" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                }`}>
                  {arCount}
                </span>
              </button>
            </div>

            <div className="text-xs text-muted-foreground px-2">
              Sync Target: <strong className="text-foreground">
                {stagingTab === "expenses"
                  ? "QuickBooks Online > Expenses (Purchase)"
                  : stagingTab === "ma_payments"
                  ? "QuickBooks Online > M&A Scheduled Payments (Purchase)"
                  : stagingTab === "bills"
                  ? "QuickBooks Online > Bills (Bill)"
                  : "QuickBooks Online > Invoices & Payments (Cash Application)"}
              </strong>
            </div>
          </div>
  );
}

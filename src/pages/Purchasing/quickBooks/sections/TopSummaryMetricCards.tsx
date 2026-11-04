import { CreditCard, Layers, CheckCheck, Receipt, Banknote, Landmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { QuickBooksState } from "../hooks/useQuickBooks";

export function TopSummaryMetricCards({ s }: { s: QuickBooksState }) {
  const { stagingTab, currentTabSelectedIds, currentTabSelectedTotalAmount, totalStaged, readyCount, arCount, formattedARAmount, setStagingTab, billsCount, formattedBillsAmount, maCount, formattedMaAmount, expensesCount, formattedExpensesAmount } = s;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Expenses Card */}
        <Card
          onClick={() => setStagingTab("expenses")}
          className={`border-border/70 shadow-2xs bg-card/60 backdrop-blur-xs relative overflow-hidden group hover:border-emerald-500/50 transition-all cursor-pointer ${
            stagingTab === "expenses" ? "ring-2 ring-emerald-500/40 border-emerald-500/60 bg-emerald-50/10" : ""
          }`}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">QBO Expenses</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{formattedExpensesAmount}</h3>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <span className="font-semibold text-foreground">{expensesCount}</span> purchasing requests
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-2xs">
              <CreditCard className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* M&A Scheduled Payments Card */}
        <Card
          onClick={() => setStagingTab("ma_payments")}
          className={`border-border/70 shadow-2xs bg-card/60 backdrop-blur-xs relative overflow-hidden group hover:border-purple-500/50 transition-all cursor-pointer ${
            stagingTab === "ma_payments" ? "ring-2 ring-purple-500/40 border-purple-500/60 bg-purple-50/10" : ""
          }`}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">M&amp;A Scheduled</p>
              <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{formattedMaAmount}</h3>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <span className="font-semibold text-foreground">{maCount}</span> scheduled deals &amp; wires
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20 shadow-2xs">
              <Landmark className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Bills Card */}
        <Card
          onClick={() => setStagingTab("bills")}
          className={`border-border/70 shadow-2xs bg-card/60 backdrop-blur-xs relative overflow-hidden group hover:border-blue-500/50 transition-all cursor-pointer ${
            stagingTab === "bills" ? "ring-2 ring-blue-500/40 border-blue-500/60 bg-blue-50/10" : ""
          }`}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">QBO Bills</p>
              <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{formattedBillsAmount}</h3>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <span className="font-semibold text-foreground">{billsCount}</span> recurring vendor bills
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-2xs">
              <Receipt className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* A/R Invoices Card */}
        <Card
          onClick={() => setStagingTab("ar_invoices")}
          className={`border-border/70 shadow-2xs bg-card/60 backdrop-blur-xs relative overflow-hidden group hover:border-teal-500/50 transition-all cursor-pointer ${
            stagingTab === "ar_invoices" ? "ring-2 ring-teal-500/40 border-teal-500/60 bg-teal-50/10" : ""
          }`}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">A/R Invoices</p>
              <h3 className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1">{formattedARAmount}</h3>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <span className="font-semibold text-foreground">{arCount}</span> reconciled cash apps
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20 shadow-2xs">
              <Banknote className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Pre-Flight Validated */}
        <Card className="border-border/70 shadow-2xs bg-card/60 backdrop-blur-xs relative overflow-hidden group hover:border-indigo-500/50 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pre-Flight Clean</p>
              <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                {readyCount} / {totalStaged}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {totalStaged > 0 ? `${Math.round((readyCount / totalStaged) * 100)}% Auto-matched` : "No items"}
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-2xs">
              <CheckCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Selected Batch */}
        <Card className="border-border/70 shadow-2xs bg-card/60 backdrop-blur-xs relative overflow-hidden group hover:border-amber-500/50 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Selected for Batch</p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {currentTabSelectedTotalAmount}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {currentTabSelectedIds.length} item(s) in {stagingTab === "expenses" ? "Expenses" : stagingTab === "ma_payments" ? "M&A Payments" : stagingTab === "bills" ? "Bills" : "A/R Invoices"}
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-2xs">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>
  );
}

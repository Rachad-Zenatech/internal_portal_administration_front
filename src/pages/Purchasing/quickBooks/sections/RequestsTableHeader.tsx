import { Checkbox } from "@/components/ui/checkbox";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { QuickBooksState } from "../hooks/useQuickBooks";

export function RequestsTableHeader({ s }: { s: QuickBooksState }) {
  const { stagingTab, handleSelectAll, isSomeSelected, isAllSelected } = s;
  return (
    <TableHeader className="bg-muted/50 border-b border-border/80">
                    <TableRow className="hover:bg-transparent">
                      <TableHead
                        className="w-10 px-3 cursor-pointer select-none"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAll();
                        }}
                      >
                        <Checkbox
                          checked={isAllSelected ? true : isSomeSelected ? "indeterminate" : false}
                          onCheckedChange={handleSelectAll}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableHead>
                      <TableHead className="w-28 font-bold text-foreground">
                        {stagingTab === "expenses"
                          ? "Request #"
                          : stagingTab === "ma_payments"
                          ? "M&A Deal #"
                          : stagingTab === "bills"
                          ? "Bill / Rec #"
                          : "AR Ref #"}
                      </TableHead>
                      <TableHead className="w-24 font-bold text-foreground">
                        {stagingTab === "expenses" || stagingTab === "ma_payments"
                          ? "Date"
                          : stagingTab === "bills"
                          ? "Bill Date"
                          : "Deposit Date"}
                      </TableHead>
                      {stagingTab === "bills" && (
                        <TableHead className="w-24 font-bold text-foreground">Due Date</TableHead>
                      )}
                      <TableHead className="w-48 font-bold text-foreground">
                        {stagingTab === "ar_invoices" ? "QuickBooks Customer" : "QuickBooks Vendor"}
                      </TableHead>
                      <TableHead className="w-52 font-bold text-foreground">
                        {stagingTab === "ar_invoices" ? "A/R GL Account" : "Expense Account (GL)"}
                      </TableHead>
                      {stagingTab === "expenses" || stagingTab === "ma_payments" ? (
                        <TableHead className="w-44 font-bold text-foreground">Payment Account</TableHead>
                      ) : stagingTab === "bills" ? (
                        <TableHead className="w-44 font-bold text-foreground">Location</TableHead>
                      ) : (
                        <TableHead className="w-44 font-bold text-foreground">Bank Account / Method</TableHead>
                      )}
                      <TableHead className="min-w-[200px] font-bold text-foreground">
                        {stagingTab === "expenses"
                          ? "Line Item / Product"
                          : stagingTab === "ma_payments"
                          ? "M&A Deal / Payment Schedule"
                          : stagingTab === "bills"
                          ? "Line Item / Description"
                          : "Matched Invoices & Bank Ref"}
                      </TableHead>
                      <TableHead className="w-28 text-right font-bold text-foreground">Amount (USD)</TableHead>
                      <TableHead className="w-40 font-bold text-foreground">Pre-Flight Status</TableHead>
                      <TableHead className="w-44 text-right font-bold text-foreground pr-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
  );
}

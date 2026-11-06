import { toast } from "sonner";
import type { QuickBooksPreviewPart } from "@/services/purchasingService";
import type { QuickBooksItemDetailsDialogGuardedState } from "./useQuickBooksItemDetailsDialog";

export function useQuickBooksItemDetailsDialogActions(ctx: QuickBooksItemDetailsDialogGuardedState) {
  const { setCopied, item } = ctx;
  const isAr = Boolean(item.is_ar || item.type === "ar_invoice");
  const isMa = !isAr && Boolean(item.is_ma || item.type === "m&a" || item.source_portal === "m7a" || item.source_portal === "m&a");
  const isBill = !isAr && (item.transaction_category === "BILL" || (!isMa && Boolean(item.is_recurring)));
  const isReady = item.readiness === "READY" || item.readiness === "READY_WITH_NOTES";
  const isSynced = item.readiness === "ALREADY_SYNCED" || item.is_already_synced;
  const isError = item.readiness === "ERROR" || (item.validation_errors && item.validation_errors.length > 0);
  const formattedAmountNumber = item.amount?.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) || "0.00";
  // Active JSON payload (bill or expense or ar invoice)
  const activePayload = isAr
    ? (item.projected_invoice_payload || item.projected_payload)
    : isBill
    ? (item.projected_bill_payload || item.projected_payload)
    : (item.projected_expense_payload || item.projected_payload);
  // Derive split lines / parts
  const displayLines: QuickBooksPreviewPart[] = (item.parts && item.parts.length > 0)
    ? item.parts
    : (activePayload?.Line && Array.isArray(activePayload.Line) && activePayload.Line.length > 0)
      ? activePayload.Line.map((l: any, idx: number) => ({
          line_num: idx + 1,
          description: l.Description || item.product_name,
          amount: Number(l.Amount) || (item.amount / activePayload.Line.length),
          formatted_amount: `$${(Number(l.Amount) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          category: l.AccountBasedExpenseLineDetail?.AccountRef?.name || item.expense_account_resolution?.name || item.category || (isAr ? "Accounts Receivable" : "Expense"),
          account_name: l.AccountBasedExpenseLineDetail?.AccountRef?.name || item.expense_account_resolution?.name,
          account_id: l.AccountBasedExpenseLineDetail?.AccountRef?.value,
          acct_num: item.expense_account_resolution?.acct_num,
          class: l.AccountBasedExpenseLineDetail?.ClassRef?.name || item.class || "",
          customer: item.department || (isAr ? item.raw_payee : "Internal"),
        }))
      : [{
          line_num: 1,
          description: item.product_name || item.raw_payee,
          amount: item.amount,
          formatted_amount: formattedAmountNumber,
          category: item.expense_account_resolution?.name || item.category || (isAr ? "Accounts Receivable" : "Expense"),
          account_name: item.expense_account_resolution?.name,
          acct_num: item.expense_account_resolution?.acct_num,
          class: item.class || "",
          customer: item.department || (isAr ? item.raw_payee : "Internal"),
        }];
  const isMultiPart = displayLines.length > 1;
  const handleCopyJson = () => {
    if (!activePayload) return;
    navigator.clipboard.writeText(JSON.stringify(activePayload, null, 2));
    setCopied(true);
    toast.success("QuickBooks JSON payload copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };
  return { isAr, isMa, isBill, isReady, isSynced, isError, formattedAmountNumber, activePayload, displayLines, isMultiPart, handleCopyJson };
}

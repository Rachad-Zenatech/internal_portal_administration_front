import { useMemo } from "react";
import { toast } from "sonner";
import { exportQuickBooksCsv, exportQuickBooksXlsx, exportQuickBooksBundle, exportQuickBooksDocuments, exportQuickBooksReconciliation, syncQuickBooksBatch, syncQuickBooksBillsBatch, syncQuickBooksBill, deleteQuickBooksBill, syncQuickBooksARBatch, syncQuickBooksARInvoice, deleteQuickBooksARInvoice, type QuickBooksPreviewItem } from "@/services/purchasingService";
import { apiClient } from "@/services/apiClient";
import { QB_LAST_EXPORTED_KEY } from "../constants";
import { isMaItem } from "../utils";
import type { useQuickBooksActions } from "./useQuickBooksActions";

export function useQuickBooksActions2(ctx: ReturnType<typeof useQuickBooksActions>) {
  const { filteredItems, selectedRequestIds, setSelectedRequestIds, setIsSyncing, fetchPreview, stagingTab, setSyncingSingleId, setDeletingId, setIsInspectorOpen, inspectorItem, setDeleteConfirmItem, setIsDisconnecting, setIsDisconnectOpen, setIsQuerying, setQueryResult, queryInput, setIsExporting, setLastExportedAt, selectedMonth, selectedYear, filterType, endDateTime, startDateTime, exportMode, previewData, arPreviewData, allExpenses, allMaPayments, allBills, allARInvoices } = ctx;
  // Distinct valid IDs in current filtered items
  const currentTabItemIds = useMemo(() => {
    return Array.from(new Set(filteredItems.map((i) => i.request_id)));
  }, [filteredItems]);
  // Selected distinct IDs in current tab
  const currentTabSelectedIds = useMemo(() => {
    const validIdsSet = new Set(currentTabItemIds);
    return selectedRequestIds.filter((id) => validIdsSet.has(id));
  }, [selectedRequestIds, currentTabItemIds]);
  const isAllSelected = currentTabItemIds.length > 0 && currentTabSelectedIds.length === currentTabItemIds.length;
  const isSomeSelected = currentTabSelectedIds.length > 0 && !isAllSelected;
  // Handle Multi-Selection
  const handleSelectAll = () => {
    if (isAllSelected) {
      const currentIdsSet = new Set(currentTabItemIds);
      setSelectedRequestIds((prev) => prev.filter((id) => !currentIdsSet.has(id)));
    } else {
      setSelectedRequestIds((prev) => Array.from(new Set([...prev, ...currentTabItemIds])));
    }
  };
  const handleClearSelection = () => {
    const currentIdsSet = new Set(currentTabItemIds);
    setSelectedRequestIds((prev) => prev.filter((id) => !currentIdsSet.has(id)));
  };
  const handleToggleSelect = (id: number) => {
    setSelectedRequestIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
  // Batch Sync (Routes dynamically for Expenses vs Bills vs A/R Invoices)
  const handleBatchSync = async () => {
    if (currentTabSelectedIds.length === 0) {
      const tabName = stagingTab === "expenses" ? "expense" : stagingTab === "ma_payments" ? "M&A scheduled payment" : stagingTab === "bills" ? "bill" : "A/R invoice";
      toast.error(`Please select at least one ${tabName} to sync`);
      return;
    }

    setIsSyncing(true);
    try {
      if (stagingTab === "expenses" || stagingTab === "ma_payments") {
        const res = await syncQuickBooksBatch(currentTabSelectedIds);
        const label = stagingTab === "ma_payments" ? "M&A scheduled payment(s)" : "expense(s)";
        if (res.synced > 0) {
          toast.success(`Successfully synchronized ${res.synced} ${label} to QuickBooks Online!`);
        }
        if (res.failed > 0) {
          toast.error(`${res.failed} ${label} failed to sync. Inspect payloads for details.`);
        }
      } else if (stagingTab === "bills") {
        const res = await syncQuickBooksBillsBatch(currentTabSelectedIds);
        if (res.synced > 0) {
          toast.success(`Successfully synchronized ${res.synced} bill(s) to QuickBooks Online!`);
        }
        if (res.failed > 0) {
          toast.error(`${res.failed} bill(s) failed to sync. Inspect payloads for details.`);
        }
      } else {
        const selectedWfIds = filteredItems
          .filter((i) => currentTabSelectedIds.includes(i.request_id))
          .map((i) => i.workflow_id || i.id)
          .filter(Boolean) as string[];
        const res = await syncQuickBooksARBatch(selectedWfIds);
        if (res.synced > 0) {
          toast.success(`Successfully synchronized ${res.synced} A/R cash application(s) to QuickBooks Online!`);
        }
        if (res.failed > 0) {
          toast.error(`${res.failed} A/R record(s) failed to sync. Inspect payloads for details.`);
        }
      }
      await fetchPreview();
    } catch (err: any) {
      toast.error(err.message || "Failed to complete QuickBooks batch sync");
    } finally {
      setIsSyncing(false);
    }
  };
  // Handle Single Sync (Routes dynamically for Expenses vs Bills vs A/R Invoices)
  const handleSingleSync = async (item: QuickBooksPreviewItem) => {
    setSyncingSingleId(item.request_id);
    const isAr = Boolean(item.is_ar || item.type === "ar_invoice" || stagingTab === "ar_invoices");
    const isMa = !isAr && isMaItem(item);
    const isBill = !isAr && !isMa && (item.transaction_category === "BILL" || (Boolean(item.is_recurring) && item.transaction_category !== "EXPENSE"));

    try {
      if (isAr) {
        const wfId = String(item.workflow_id || item.id || item.request_id);
        const res = await syncQuickBooksARInvoice(wfId);
        toast.success(`Synced A/R Cash Application #${item.ref_no || wfId.slice(0, 8)} to QuickBooks as Payment #${res.quickbooks_payment_id || "Created"}`);
      } else if (isBill) {
        const res = await syncQuickBooksBill(item.request_id);
        toast.success(`Synced recurring payment #${item.request_id} to QuickBooks as Bill #${res.quickbooks_bill_id || "Created"}`);
      } else {
        const res = await apiClient.post<any>(`/api/quickbooks/expenses/${item.request_id}`, {});
        toast.success(`Synced REQ-#${item.request_id} to QuickBooks as Purchase #${res.quickbooks_purchase_id || "Created"}`);
      }
      await fetchPreview();
    } catch (err: any) {
      toast.error(err.message || `Failed to sync transaction #${item.request_id}`);
    } finally {
      setSyncingSingleId(null);
    }
  };
  // Handle Remove from QuickBooks
  const handleDeleteFromQuickBooks = async (item: QuickBooksPreviewItem) => {
    setDeletingId(item.request_id);
    const isAr = Boolean(item.is_ar || item.type === "ar_invoice" || stagingTab === "ar_invoices");
    const isMa = !isAr && isMaItem(item);
    const isBill = !isAr && (item.transaction_category === "BILL" || (!isMa && Boolean(item.is_recurring) && item.transaction_category !== "EXPENSE"));

    try {
      if (isAr) {
        const wfId = String(item.workflow_id || item.id || item.request_id);
        await deleteQuickBooksARInvoice(wfId);
        toast.success(`Cleared QuickBooks sync for A/R cash application #${item.ref_no || wfId.slice(0, 8)}!`);
      } else if (isBill) {
        await deleteQuickBooksBill(item.request_id, item.existing_bill_id || undefined);
        toast.success(`Removed Bill for REC-#${item.request_id} from QuickBooks Online!`);
      } else {
        const pId = item.existing_purchase_id || item.projected_payload?.Id;
        const url = pId
          ? `/api/quickbooks/expenses/${item.request_id}?purchase_id=${encodeURIComponent(pId)}`
          : `/api/quickbooks/expenses/${item.request_id}`;
        await apiClient.delete(url);
        toast.success(`Removed REQ-#${item.request_id} from QuickBooks Online!`);
      }
      setDeleteConfirmItem(null);
      if (inspectorItem?.request_id === item.request_id) {
        setIsInspectorOpen(false);
      }
      await fetchPreview();
    } catch (err: any) {
      toast.error(err.message || `Failed to remove transaction #${item.request_id} from QuickBooks`);
    } finally {
      setDeletingId(null);
    }
  };
  // Disconnect QuickBooks
  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await apiClient.post("/api/quickbooks/disconnect", {});
      toast.success("Disconnected QuickBooks Online integration");
      setIsDisconnectOpen(false);
      await fetchPreview();
    } catch (err: any) {
      toast.error(err.message || "Failed to disconnect QuickBooks");
    } finally {
      setIsDisconnecting(false);
    }
  };
  // Run direct query
  const handleExecuteQuery = async (queryText?: string) => {
    const q = queryText || queryInput;
    setIsQuerying(true);
    try {
      const res = await apiClient.get<any>(`/api/quickbooks/query?q=${encodeURIComponent(q)}`);
      setQueryResult(res);
      toast.success("Query executed successfully");
    } catch (err: any) {
      toast.error(err.message || "QuickBooks query failed");
      setQueryResult({ error: err.message });
    } finally {
      setIsQuerying(false);
    }
  };
  // Export File Package
  const handleExport = async (explicitIds?: number[], customMode?: string) => {
    setIsExporting(true);
    const nowIso = new Date().toISOString();
    const mode = customMode || exportMode;
    try {
      let idsParam: string[] | undefined;
      let statusParam: string | undefined = "ORDERED / PURCHASED";
      let yearParam: number | null = null;
      let monthParam: number | null = null;
      let startDt: string | null = null;
      let endDt: string | null = null;

      const targetIds = explicitIds || (filterType === "SELECTED" && selectedRequestIds.length > 0 ? selectedRequestIds : undefined);

      if (targetIds && targetIds.length > 0) {
        idsParam = targetIds.map(String);
        statusParam = undefined;
      } else if (filterType === "TODAY") {
        const todayStr = new Date().toISOString().split("T")[0];
        startDt = `${todayStr} 00:00:00`;
        endDt = `${todayStr} 23:59:59`;
      } else if (filterType === "DATETIME_RANGE") {
        startDt = startDateTime ? startDateTime.replace("T", " ") : null;
        endDt = endDateTime ? endDateTime.replace("T", " ") : null;
      } else if (filterType === "MONTH_YEAR") {
        yearParam = selectedYear !== "ALL" ? parseInt(selectedYear, 10) : null;
        monthParam = selectedMonth !== "ALL" ? parseInt(selectedMonth, 10) : null;
      }

      const txnType = stagingTab === "bills" ? "BILL" : stagingTab === "expenses" ? "EXPENSE" : undefined;

      if (mode === "BUNDLE") {
        await exportQuickBooksBundle(idsParam, statusParam, yearParam, monthParam, startDt, endDt);
      } else if (mode === "XLSX") {
        await exportQuickBooksXlsx(idsParam, statusParam, yearParam, monthParam, startDt, endDt, txnType);
      } else if (mode === "CSV") {
        await exportQuickBooksCsv(idsParam, statusParam, yearParam, monthParam, startDt, endDt, txnType);
      } else if (mode === "DOCUMENTS") {
        await exportQuickBooksDocuments(idsParam, statusParam, yearParam, monthParam, startDt, endDt);
      } else if (mode === "RECONCILIATION") {
        await exportQuickBooksReconciliation(idsParam, statusParam, yearParam, monthParam, startDt, endDt);
      }

      localStorage.setItem(QB_LAST_EXPORTED_KEY, nowIso);
      setLastExportedAt(nowIso);
      toast.success("Export package downloaded successfully!");
    } catch (err: any) {
      toast.error(err.message || "Export failed");
    } finally {
      setIsExporting(false);
    }
  };
  const isConnected = previewData?.connection?.is_connected ?? false;
  const companyName = previewData?.connection?.company_name || "QuickBooks Online Company";
  const realmId = previewData?.connection?.realm_id || "Not Connected";
  const totalStaged = (previewData?.items?.length || 0) + (arPreviewData?.items?.length || 0);
  const readyCount = (previewData?.summary?.ready_count || 0) + (arPreviewData?.summary?.ready_count || 0);
  // Tab calculations
  const expensesCount = allExpenses.length;
  const expensesAmount = allExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);
  const formattedExpensesAmount = `$${expensesAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const maCount = allMaPayments.length;
  const maAmount = allMaPayments.reduce((sum, item) => sum + (item.amount || 0), 0);
  const formattedMaAmount = `$${maAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const billsCount = allBills.length;
  const billsAmount = allBills.reduce((sum, item) => sum + (item.amount || 0), 0);
  const formattedBillsAmount = `$${billsAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const arCount = allARInvoices.length;
  const arAmount = allARInvoices.reduce((sum, item) => sum + (item.amount || 0), 0);
  const formattedARAmount = `$${arAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const currentTabSelectedTotalAmount = useMemo(() => {
    const sum = filteredItems
      .filter((i) => currentTabSelectedIds.includes(i.request_id))
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);
    return `$${sum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [filteredItems, currentTabSelectedIds]);
  return { currentTabSelectedIds, isAllSelected, isSomeSelected, handleSelectAll, handleClearSelection, handleToggleSelect, handleBatchSync, handleSingleSync, handleDeleteFromQuickBooks, handleDisconnect, handleExecuteQuery, handleExport, isConnected, companyName, realmId, totalStaged, readyCount, expensesCount, formattedExpensesAmount, maCount, formattedMaAmount, billsCount, formattedBillsAmount, arCount, formattedARAmount, currentTabSelectedTotalAmount };
}

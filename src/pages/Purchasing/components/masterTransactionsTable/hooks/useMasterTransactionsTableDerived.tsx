import { useState, useMemo } from "react";
import { generatePaymentSchedule } from "../../../utils/recurringScheduleUtils";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { MasterTransactionItem } from "../types";

export function useMasterTransactionsTableDerived(props) {
  const { requests } = props;
  const navigate = useNavigate();
  // Local state for Master View filters and sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("ALL");
  const [installmentStatusFilter, setInstallmentStatusFilter] = useState<string>("ALL");
  const [reviewFilter, setReviewFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<"dueDate" | "amount" | "installmentNumber" | "requestTitle" | "requester">("dueDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  // 1. Flatten all requests into discrete transactions / installments
  const allTransactions: MasterTransactionItem[] = useMemo(() => {
    const list: MasterTransactionItem[] = [];

    requests.forEach((req) => {
      const schedule = req.recurring_schedule;
      const installments = generatePaymentSchedule(
        schedule,
        req.amount || 0,
        req.currency || "USD",
        req.status,
        req.due_date || req.request_date
      );

      const customDates = schedule?.schedule_dates || [];
      const totalCount =
        schedule?.total_installments ||
        (customDates.length > 0 ? customDates.length : (schedule?.end_date ? installments.length : null));
      const isCustom = schedule?.frequency === "CUSTOM" || customDates.length > 0;

      installments.forEach((inst, idx) => {
        let label: string | undefined | null;
        if (isCustom && customDates[idx]) {
          const cDate = customDates[idx];
          label = typeof cDate === "object" ? cDate.note : undefined;
        }

        list.push({
          id: `${req.id}-inst-${inst.installmentNumber}-${inst.dueDate || idx}`,
          requestId: req.id,
          requestTitle: req.title,
          requestDescription: req.description,
          requester: req.requester,
          department: req.department,
          vendor: (req as any).vendor || (req as any).company_name || "",
          category: (req as any).category || "",
          priority: req.priority || "MEDIUM",
          project: (req as any).project || (req as any).project_name || "",
          dueDate: inst.dueDate,
          amount: inst.amount,
          currency: inst.currency || req.currency || "USD",
          cumulativeAmount: inst.cumulativeAmount,
          installmentNumber: inst.installmentNumber,
          totalInstallments: totalCount,
          installmentStatus: inst.status,
          workflowStatus: req.status,
          reviewStatus: req.review_status || "WAITING_FOR_REVIEW",
          isCustom,
          frequency: schedule?.frequency || "MONTHLY",
          customLabel: label,
          rawRequest: req,
          rawInstallment: inst,
        });
      });
    });

    return list;
  }, [requests]);
  // 2. Master View KPIs Calculation
  const stats = useMemo(() => {
    let totalValue = 0;
    let paidCount = 0;
    let paidValue = 0;
    let currentCount = 0;
    let currentValue = 0;
    let projectedCount = 0;
    let projectedValue = 0;
    let reviewedCount = 0;

    allTransactions.forEach((t) => {
      totalValue += t.amount;
      if (t.installmentStatus === "PAID") {
        paidCount++;
        paidValue += t.amount;
      } else if (t.installmentStatus === "CURRENT") {
        currentCount++;
        currentValue += t.amount;
      } else {
        projectedCount++;
        projectedValue += t.amount;
      }

      if (t.reviewStatus === "REVIEWED") {
        reviewedCount++;
      }
    });

    return {
      totalTransactions: allTransactions.length,
      totalValue,
      paidCount,
      paidValue,
      currentCount,
      currentValue,
      projectedCount,
      projectedValue,
      reviewedCount,
    };
  }, [allTransactions]);
  // 3. Filter and Sort Transactions
  const filteredTransactions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return allTransactions
      .filter((t) => {
        // Search term
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchTitle = t.requestTitle?.toLowerCase().includes(q);
          const matchReqId = t.requestId?.toLowerCase().includes(q);
          const matchRequester = t.requester?.toLowerCase().includes(q);
          const matchDept = t.department?.toLowerCase().includes(q);
          const matchVendor = t.vendor?.toLowerCase().includes(q);
          const matchDesc = t.requestDescription?.toLowerCase().includes(q);
          const matchLabel = t.customLabel?.toLowerCase().includes(q);
          const matchDueDate = t.dueDate?.includes(q);
          if (!matchTitle && !matchReqId && !matchRequester && !matchDept && !matchVendor && !matchDesc && !matchLabel && !matchDueDate) {
            return false;
          }
        }

        // Installment status filter
        if (installmentStatusFilter !== "ALL" && t.installmentStatus !== installmentStatusFilter) {
          return false;
        }

        // Review status filter
        if (reviewFilter !== "ALL") {
          if (reviewFilter === "REVIEWED" && t.reviewStatus !== "REVIEWED") return false;
          if (reviewFilter === "WAITING_FOR_REVIEW" && t.reviewStatus === "REVIEWED") return false;
        }

        // Date range filter
        if (dateRangeFilter !== "ALL") {
          if (!t.dueDate) return false;
          const tDate = new Date(t.dueDate.includes("T") ? t.dueDate : t.dueDate + "T00:00:00");
          tDate.setHours(0, 0, 0, 0);

          if (dateRangeFilter === "PAID") {
            if (t.installmentStatus !== "PAID") return false;
          } else if (dateRangeFilter === "THIS_MONTH") {
            const startMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const endMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            if (tDate < startMonth || tDate > endMonth) return false;
          } else if (dateRangeFilter === "NEXT_30") {
            const maxDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
            if (tDate < today || tDate > maxDate) return false;
          } else if (dateRangeFilter === "NEXT_90") {
            const maxDate = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
            if (tDate < today || tDate > maxDate) return false;
          } else if (dateRangeFilter === "THIS_YEAR") {
            const startYear = new Date(today.getFullYear(), 0, 1);
            const endYear = new Date(today.getFullYear(), 11, 31);
            if (tDate < startYear || tDate > endYear) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === "dueDate") {
          const dateA = a.dueDate ? new Date(a.dueDate.includes("T") ? a.dueDate : a.dueDate + "T00:00:00").getTime() : 0;
          const dateB = b.dueDate ? new Date(b.dueDate.includes("T") ? b.dueDate : b.dueDate + "T00:00:00").getTime() : 0;
          cmp = dateA - dateB;
        } else if (sortField === "amount") {
          cmp = a.amount - b.amount;
        } else if (sortField === "installmentNumber") {
          cmp = a.installmentNumber - b.installmentNumber;
        } else if (sortField === "requestTitle") {
          cmp = (a.requestTitle || "").localeCompare(b.requestTitle || "");
        } else if (sortField === "requester") {
          cmp = (a.requester || "").localeCompare(b.requester || "");
        }
        return sortOrder === "asc" ? cmp : -cmp;
      });
  }, [allTransactions, searchTerm, installmentStatusFilter, reviewFilter, dateRangeFilter, sortField, sortOrder]);
  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      toast.error("No transactions to export");
      return;
    }

    const headers = [
      "Date of Payment",
      "Entity / Note Title",
      "Payment",
      "Interest",
      "Principal Paid",
      "Balance",
      "Currency",
      "Status",
    ];

    let totPayment = 0;
    let totInterest = 0;
    let totPrincipal = 0;

    const rows = filteredTransactions.map((t) => {
      const p = t.rawInstallment?.payment != null ? Number(t.rawInstallment.payment) : t.amount;
      const i = t.rawInstallment?.interest != null ? Number(t.rawInstallment.interest) : null;
      const pr = t.rawInstallment?.principal_paid != null ? Number(t.rawInstallment.principal_paid) : null;
      const b = t.rawInstallment?.balance != null ? Number(t.rawInstallment.balance) : t.cumulativeAmount;

      if (typeof p === "number" && !isNaN(p)) totPayment += p;
      if (typeof i === "number" && !isNaN(i)) totInterest += i;
      if (typeof pr === "number" && !isNaN(pr)) totPrincipal += pr;

      const statusLabel =
        t.installmentStatus === "PAID"
          ? "Paid"
          : t.installmentStatus === "CURRENT"
          ? "Due Now"
          : "Upcoming";

      const title = t.requestTitle || t.vendor || "Scheduled Note";

      return [
        t.dueDate || "",
        `"${title.replace(/"/g, '""')}"`,
        typeof p === "number" && !isNaN(p) ? p.toFixed(2) : "",
        typeof i === "number" && !isNaN(i) ? i.toFixed(2) : "",
        typeof pr === "number" && !isNaN(pr) ? pr.toFixed(2) : "",
        typeof b === "number" && !isNaN(b) ? b.toFixed(2) : "",
        t.currency || "USD",
        statusLabel,
      ];
    });

    const totalRow = [
      "Total",
      `"${filteredTransactions.length} Payments"`,
      totPayment.toFixed(2),
      totInterest > 0 ? totInterest.toFixed(2) : "",
      totPrincipal > 0 ? totPrincipal.toFixed(2) : "",
      "",
      "",
      "",
    ];

    const allRows = [...rows, totalRow];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...allRows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Master_List_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filteredTransactions.length} transactions to CSV`);
  };
  const filteredTotalValue = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => acc + t.amount, 0);
  }, [filteredTransactions]);
  const getUrgencyBadge = (dueDateStr: string, status: "PAID" | "CURRENT" | "PROJECTED") => {
    if (status === "PAID") {
      return (
        <Badge
          variant="outline"
          className="text-[10px] py-0 px-1.5 bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
        >
          <CheckCircle className="h-2.5 w-2.5 mr-1" />
          Paid
        </Badge>
      );
    }
    if (!dueDateStr) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(dueDateStr.includes("T") ? dueDateStr : dueDateStr + "T00:00:00");
    target.setHours(0, 0, 0, 0);
    const diffDays = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <Badge variant="destructive" className="text-[10px] py-0 px-1.5 font-bold shadow-xs">
          Overdue ({Math.abs(diffDays)}d)
        </Badge>
      );
    }
    if (diffDays === 0) {
      return (
        <Badge className="text-[10px] py-0 px-1.5 bg-amber-600 text-white font-bold animate-pulse">
          Due Today
        </Badge>
      );
    }
    if (diffDays <= 7) {
      return (
        <Badge
          variant="outline"
          className="text-[10px] py-0 px-1.5 bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 font-semibold"
        >
          Due in {diffDays}d
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="text-[10px] py-0 px-1.5 bg-slate-50 text-slate-600 border-slate-200 dark:bg-zinc-800/60 dark:text-zinc-400"
      >
        In {diffDays}d
      </Badge>
    );
  };
  return { navigate, searchTerm, setSearchTerm, dateRangeFilter, setDateRangeFilter, installmentStatusFilter, setInstallmentStatusFilter, reviewFilter, setReviewFilter, sortField, sortOrder, allTransactions, stats, filteredTransactions, toggleSort, handleExportCSV, filteredTotalValue, getUrgencyBadge };
}

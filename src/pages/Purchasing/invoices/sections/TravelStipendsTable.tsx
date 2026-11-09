import { useState, useEffect, useMemo } from "react";
import { 
  Plane, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Send, 
  CreditCard, 
  ArrowUpRight,
  BadgeDollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiClient as api } from "@/services/apiClient";
import { toast } from "sonner";
import { formatMoney } from "../../utils/purchasingMeta";

export interface TravelStipend {
  id: string;
  event_id?: string;
  user_id?: string;
  recipient_name: string;
  recipient_email?: string;
  daily_rate: number;
  total_days: number;
  total_amount: number;
  currency: string;
  destination_tier?: string;
  payment_method: string;
  status: "pending_approval" | "approved" | "disbursed" | "rejected" | string;
  disbursed_at?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  event_title?: string;
  event_destination?: string;
  event_start_date?: string;
  event_end_date?: string;
}

interface TravelStipendsTableProps {
  onCreatePayableForStipend?: (stipend: TravelStipend) => void;
}

export function TravelStipendsTable({ onCreatePayableForStipend }: TravelStipendsTableProps) {
  const [stipends, setStipends] = useState<TravelStipend[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchStipends = async () => {
    setIsLoading(true);
    try {
      const [listRes, summaryRes] = await Promise.all([
        api.get<TravelStipend[]>("/api/purchasing/travel-stipends"),
        api.get<any>("/api/purchasing/travel-stipends/summary"),
      ]);
      setStipends(Array.isArray(listRes) ? listRes : (listRes as any)?.data || []);
      setSummary(Array.isArray(summaryRes) ? summaryRes[0] : (summaryRes as any)?.data || summaryRes || null);
    } catch (err: any) {
      console.error("Failed to load travel stipends:", err);
      toast.error("Failed to load travel stipends from Travel Management.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStipends();
  }, []);

  const handleUpdateStatus = async (stipendId: string, newStatus: string) => {
    setActionLoadingId(stipendId);
    try {
      await api.put(`/api/purchasing/travel-stipends/${stipendId}/status`, {
        status: newStatus,
        actor_name: "Accounts Payable",
      });
      toast.success(
        newStatus === "disbursed"
          ? "Stipend disbursed and settlement broadcast via event bus."
          : `Stipend marked as ${newStatus}.`
      );
      await fetchStipends();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to update stipend status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredStipends = useMemo(() => {
    return stipends.filter((s) => {
      if (statusFilter !== "ALL" && s.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.recipient_name?.toLowerCase().includes(q) ||
        s.recipient_email?.toLowerCase().includes(q) ||
        s.event_title?.toLowerCase().includes(q) ||
        s.destination_tier?.toLowerCase().includes(q) ||
        s.notes?.toLowerCase().includes(q)
      );
    });
  }, [stipends, statusFilter, searchQuery]);

  const renderStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approved for AP
          </Badge>
        );
      case "disbursed":
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800">
            <Send className="h-3 w-3 mr-1" />
            Disbursed
          </Badge>
        );
      case "pending_approval":
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending Approval
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ── Metric Highlights ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 font-medium">
            <span>Total Travel Stipends</span>
            <Plane className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-zinc-100">
              {summary ? formatMoney(summary.total_amount) : "$0.00"}
            </span>
            <span className="text-xs text-slate-500">{summary?.total_stipends ?? stipends.length} travelers</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 font-medium">
            <span>Approved (Awaiting AP)</span>
            <BadgeDollarSign className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {summary ? formatMoney(summary.approved_payable_amount) : "$0.00"}
            </span>
            <span className="text-xs text-emerald-600/80 font-medium">
              {summary?.approved_count ?? 0} ready
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 font-medium">
            <span>Disbursed & Settled</span>
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-zinc-100">
              {summary ? formatMoney(summary.disbursed_amount) : "$0.00"}
            </span>
            <span className="text-xs text-slate-500">{summary?.disbursed_count ?? 0} settled</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 font-medium">
            <span>Pending Review</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-zinc-100">
              {summary ? formatMoney(summary.pending_amount) : "$0.00"}
            </span>
            <span className="text-xs text-amber-600 font-medium">{summary?.pending_count ?? 0} pending</span>
          </div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search traveler, email, event title, or destination..."
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status filters */}
          <div className="flex items-center border border-slate-200 dark:border-zinc-800 rounded-lg p-0.5 bg-slate-50 dark:bg-zinc-800/60 text-xs">
            {["ALL", "APPROVED", "DISBURSED", "PENDING_APPROVAL"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  statusFilter === st
                    ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-zinc-200"
                }`}
              >
                {st === "ALL"
                  ? "All"
                  : st === "PENDING_APPROVAL"
                  ? "Pending"
                  : st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchStipends}
            disabled={isLoading}
            className="h-9 gap-1 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </Button>
        </div>
      </div>

      {/* ── Main Stipends Table ── */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80 dark:bg-zinc-800/40">
              <TableRow className="border-slate-200 dark:border-zinc-800 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                <TableHead className="py-3 px-4">Traveler / Payee</TableHead>
                <TableHead className="py-3 px-4">Event &amp; Mission</TableHead>
                <TableHead className="py-3 px-4">Rate &amp; Duration</TableHead>
                <TableHead className="py-3 px-4 text-right">Payable Amount</TableHead>
                <TableHead className="py-3 px-4">Method &amp; Tier</TableHead>
                <TableHead className="py-3 px-4">Status</TableHead>
                <TableHead className="py-3 px-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs divide-y divide-slate-100 dark:divide-zinc-800">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-5 w-5 animate-spin text-indigo-500" />
                      <span>Syncing travel stipends from Travel Management...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredStipends.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Plane className="h-8 w-8 text-slate-300 dark:text-zinc-600" />
                      <p className="font-medium text-slate-700 dark:text-zinc-300">No travel stipends found</p>
                      <p className="text-xs text-slate-400">
                        {searchQuery ? "Try refining your search filter." : "Travel stipends assigned to attendees will appear here for AP disbursement."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredStipends.map((stipend) => {
                  const isActionLoading = actionLoadingId === stipend.id;
                  return (
                    <TableRow key={stipend.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/50 transition-colors">
                      {/* Recipient */}
                      <TableCell className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {stipend.recipient_name?.slice(0, 2) || "TR"}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-zinc-100">
                              {stipend.recipient_name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                              {stipend.recipient_email || "No email on record"}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Event Title */}
                      <TableCell className="py-3.5 px-4">
                        <div>
                          <div className="font-medium text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                            <Plane className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{stipend.event_title || "General Operations"}</span>
                          </div>
                          {stipend.event_destination && (
                            <div className="text-[11px] text-slate-500 dark:text-zinc-400 pl-5">
                              {stipend.event_destination}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Rate and days */}
                      <TableCell className="py-3.5 px-4">
                        <div className="text-slate-800 dark:text-zinc-200 font-medium">
                          {formatMoney(stipend.daily_rate)} / day
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                          {stipend.total_days} {stipend.total_days === 1 ? "day" : "days"} duration
                        </div>
                      </TableCell>

                      {/* Payable Amount */}
                      <TableCell className="py-3.5 px-4 text-right">
                        <div className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                          {formatMoney(stipend.total_amount)}
                        </div>
                        <div className="text-[10px] uppercase font-mono text-slate-400">
                          {stipend.currency || "USD"}
                        </div>
                      </TableCell>

                      {/* Payment Method & Tier */}
                      <TableCell className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300 capitalize font-medium">
                          <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                          <span>{stipend.payment_method?.replace(/_/g, " ") || "Direct Deposit"}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate max-w-[140px]" title={stipend.destination_tier}>
                          {stipend.destination_tier || "Standard Tier"}
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-3.5 px-4">
                        {renderStatusBadge(stipend.status)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {stipend.status === "approved" && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(stipend.id, "disbursed")}
                              disabled={isActionLoading}
                              className="h-8 gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs cursor-pointer"
                            >
                              <Send className="h-3 w-3" />
                              <span>Disburse</span>
                            </Button>
                          )}

                          {stipend.status === "pending_approval" && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(stipend.id, "approved")}
                              disabled={isActionLoading}
                              className="h-8 gap-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs cursor-pointer"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Approve</span>
                            </Button>
                          )}

                          {onCreatePayableForStipend && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onCreatePayableForStipend(stipend)}
                              className="h-8 gap-1 text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                              title="Create AP Payable Wire for this stipend"
                            >
                              <ArrowUpRight className="h-3 w-3" />
                              <span>Create Payable</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

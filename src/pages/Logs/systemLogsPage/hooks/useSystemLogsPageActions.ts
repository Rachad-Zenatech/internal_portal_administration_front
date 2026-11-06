import { useState, useEffect, useMemo } from "react";
import { apiClient as api } from "@/services/apiClient";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { AuditLogItem } from "../types";

export function useSystemLogsPageActions() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  // Filters state
  const [search, setSearch] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [timeFilter, setTimeFilter] = useState("ALL");
  // Pagination
  const [limit, setLimit] = useState(50);
  const [page, setPage] = useState(1);
  // Inspector Drawer state
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [entityHistory, setEntityHistory] = useState<AuditLogItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  // Fetch logs
  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("limit", String(limit));
      params.append("offset", String((page - 1) * limit));

      if (entityTypeFilter && entityTypeFilter !== "ALL") {
        params.append("entity_type", entityTypeFilter);
      }
      if (actionFilter && actionFilter !== "ALL") {
        params.append("action", actionFilter);
      }
      if (search.trim()) {
        params.append("search", search.trim());
      }

      // Date calculations for timeFilter
      if (timeFilter === "TODAY") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        params.append("date_from", today.toISOString());
      } else if (timeFilter === "WEEK") {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        params.append("date_from", weekAgo.toISOString());
      } else if (timeFilter === "MONTH") {
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        params.append("date_from", monthAgo.toISOString());
      }

      const res = await api.get<{ items: AuditLogItem[]; total: number }>(`/logs?${params.toString()}`);
      setLogs(res.items || []);
      setTotal(res.total || 0);
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchLogs();
  }, [page, limit, entityTypeFilter, actionFilter, timeFilter]);
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchLogs();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  // Handle opening inspector drawer
  const handleOpenInspector = async (log: AuditLogItem) => {
    setSelectedLog(log);
    setLoadingHistory(true);
    try {
      const res = await api.get<{ items: AuditLogItem[] }>(
        `/logs?limit=50&entity_type=${log.entity_type}&entity_id=${log.entity_id}`
      );
      setEntityHistory(res.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };
  const handleCopyJson = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    toast.success("JSON copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };
  // KPI Calculations
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const todayCount = logs.filter((l) => l.created_at && l.created_at.startsWith(todayStr)).length;
    const uniqueUsers = new Set(logs.map((l) => l.actor_name || l.user_id).filter(Boolean)).size;
    const uniqueEntities = new Set(logs.map((l) => `${l.entity_type}:${l.entity_id}`)).size;

    return {
      totalCount: total,
      todayCount,
      uniqueUsers,
      uniqueEntities,
    };
  }, [logs, total]);
  return { navigate, logs, total, loading, search, setSearch, entityTypeFilter, setEntityTypeFilter, actionFilter, setActionFilter, timeFilter, setTimeFilter, limit, setLimit, page, setPage, selectedLog, setSelectedLog, entityHistory, loadingHistory, copied, fetchLogs, handleOpenInspector, handleCopyJson, stats };
}

import { useEffect, useState } from "react";
import { Building2, ChevronLeft, ChevronRight, RefreshCw, Search, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useHubSpotCompanies, useSyncHubSpotCompanies } from "@/hooks/useHubSpotCompanies";
import { format } from "date-fns";

const PAGE_SIZE = 50;

export default function Companies() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const { data, isLoading, isRefetching, refetch } = useHubSpotCompanies(
    debouncedSearch || undefined,
    page,
    PAGE_SIZE,
  );
  const syncMutation = useSyncHubSpotCompanies();

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const rangeEnd = Math.min(total, page * PAGE_SIZE + items.length);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-orange-500/10 text-orange-600 rounded-lg">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Companies</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              All companies synced from HubSpot CRM. Used as customers in Quotes & Invoices and to group Products & Services.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-9 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="h-9 gap-1.5 bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Sparkles className={`w-3.5 h-3.5 ${syncMutation.isPending ? "animate-pulse" : ""}`} />
            {syncMutation.isPending ? "Syncing..." : "Sync from HubSpot"}
          </Button>
        </div>
      </div>

      <Card className="border shadow-xs max-w-xs">
        <CardContent className="p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {debouncedSearch ? "Matching Companies" : "Total Companies"}
          </p>
          <h3 className="text-2xl font-bold mt-1 text-foreground">{total}</h3>
        </CardContent>
      </Card>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, domain, industry, city, state..."
          className="pl-9 h-9"
        />
      </div>

      <Card className="border shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/70 dark:bg-slate-900/50">
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Products</TableHead>
              <TableHead>Last Synced</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-10">
                  No companies found. Use "Sync from HubSpot" to import them.
                </TableCell>
              </TableRow>
            ) : (
              items.map((c) => (
                <TableRow key={c.hubspot_id}>
                  <TableCell>
                    <div className="font-semibold text-foreground">{c.name}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">CUST-{c.hubspot_id}</div>
                  </TableCell>
                  <TableCell className="text-sm">{c.domain || "—"}</TableCell>
                  <TableCell className="text-sm">{c.industry || "—"}</TableCell>
                  <TableCell className="text-sm">
                    {[c.city, c.state, c.country].filter(Boolean).join(", ") || "—"}
                  </TableCell>
                  <TableCell className="text-sm">{c.phone || "—"}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={c.products_count > 0 ? "default" : "secondary"}>{c.products_count}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {c.updated_at ? format(new Date(c.updated_at), "MMM d, yyyy HH:mm") : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between gap-3 border-t px-4 py-3 text-xs text-muted-foreground">
          <span>
            Showing {rangeStart}–{rangeEnd} of {total}
          </span>
          <div className="flex items-center gap-2">
            <span>
              Page {page + 1} of {pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1"
              disabled={page === 0 || isRefetching}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1"
              disabled={page >= pageCount - 1 || isRefetching}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

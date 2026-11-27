import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Building2, ChevronLeft, ChevronRight, Loader2, RefreshCw, Search } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Badge } from "../../../../components/ui/badge";
import { brandColorClass } from "../../components/BrandBadges";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { oauthService, type HubSpotCompanyItem } from "../../../../services/oauthService";
import type { AccountReceivableState } from "../hooks/useAccountReceivable";
import { ARCompanyCard } from "./ARCompanyCard";
import { ARCompanyEditDialog } from "./ARCompanyEditDialog";

export function TabARCompanies({ s }: { s: AccountReceivableState }) {
  const { setHubspotPage, isHubspotCompaniesFetching, hubspotPageCount, hubspotPage, hubspotTotal, hubspotRangeEnd, hubspotRangeStart, navigate, hubspotCompanies, syncHubspotCompaniesMutation, debouncedHubspotSearch, isHubspotCompaniesLoading, hubspotBrands, setHubspotBrand, hubspotBrand, setHubspotSearchTerm, hubspotSearchTerm, activeTab } = s;
  const queryClient = useQueryClient();
  const [editingCompany, setEditingCompany] = useState<HubSpotCompanyItem | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (activeTab !== "hubspot_companies") return null;

  const invalidateCompanies = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["hubspot-companies"] }),
      queryClient.invalidateQueries({ queryKey: ["hubspot-company-brands"] }),
      queryClient.invalidateQueries({ queryKey: ["ar-customers"] }),
    ]);
  };

  const handleSaveEdit = async (hubspotId: string, payload: Parameters<typeof oauthService.updateARCompany>[1]) => {
    setIsSavingEdit(true);
    try {
      await oauthService.updateARCompany(hubspotId, payload);
      await invalidateCompanies();
      toast.success(`Updated ${payload.name}`);
      setEditingCompany(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || "Failed to update A/R company");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async (comp: HubSpotCompanyItem) => {
    if (!window.confirm(`Delete A/R company "${comp.name}" (${comp.hubspot_id})?`)) return;
    setDeletingId(comp.hubspot_id);
    try {
      await oauthService.deleteARCompany(comp.hubspot_id);
      await invalidateCompanies();
      toast.success(`Deleted ${comp.name}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || "Failed to delete A/R company");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
              <Building2 className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>A/R Companies &amp; Profiles</span>
              <Badge className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 text-[10px] font-semibold">
                Live HubSpot Sync
              </Badge>
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Synchronized companies and client accounts from HubSpot CRM. Click Generate to auto-fill all company billing information and company-specific products into quotes or invoices.
          </p>
        </div>

        <Button
          onClick={() => syncHubspotCompaniesMutation.mutate()}
          disabled={syncHubspotCompaniesMutation.isPending}
          className="gap-1.5 text-xs bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-xs cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncHubspotCompaniesMutation.isPending ? "animate-spin" : ""}`} />
          <span>{syncHubspotCompaniesMutation.isPending ? "Syncing..." : "Sync from HubSpot"}</span>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={hubspotSearchTerm} onChange={(e) => setHubspotSearchTerm(e.target.value)} placeholder="Search company, domain, industry, city..." className="pl-8 h-9 text-xs bg-white dark:bg-slate-900" />
        </div>

        <Select value={hubspotBrand} onValueChange={(v) => { setHubspotBrand(v); setHubspotPage(0); }}>
          <SelectTrigger className="h-9 w-full sm:w-[210px] text-xs bg-white dark:bg-slate-900" aria-label="Filter by brand">
            <SelectValue placeholder="All brands" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All brands</SelectItem>
            {hubspotBrands.map((b) => (
              <SelectItem key={b.brand} value={b.brand}>
                <span className="flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full border px-2 h-[18px] text-[10px] font-semibold leading-none ${brandColorClass(b.brand)}`}>{b.brand}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{b.count.toLocaleString()}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isHubspotCompaniesLoading ? (
        <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-500 mb-2" />
          <span className="text-xs">Loading A/R companies...</span>
        </div>
      ) : hubspotCompanies.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
          <Building2 className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
          <p className="text-xs">{debouncedHubspotSearch ? "No A/R companies found matching your search." : "No A/R companies synced yet."}</p>
          <Button size="sm" onClick={() => syncHubspotCompaniesMutation.mutate()} disabled={syncHubspotCompaniesMutation.isPending} className="h-8 text-xs bg-orange-600 hover:bg-orange-700 text-white rounded-xl cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /><span>Sync from HubSpot CRM</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hubspotCompanies.map((comp) => (
            <ARCompanyCard
              key={comp.hubspot_id}
              comp={comp}
              isDeleting={deletingId === comp.hubspot_id}
              onEdit={setEditingCompany}
              onDelete={handleDelete}
              onGenerateQuote={(c) => navigate(`/account-receivable/generate-quote?hubspotCompanyId=${encodeURIComponent(c.hubspot_id)}&customerName=${encodeURIComponent(c.name)}`)}
              onGenerateInvoice={(c) => navigate(`/account-receivable/generate?hubspotCompanyId=${encodeURIComponent(c.hubspot_id)}&customerName=${encodeURIComponent(c.name)}`)}
            />
          ))}
        </div>
      )}

      {hubspotTotal > 0 && (
        <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-500">
          <span className="flex items-center gap-2">
            Showing {hubspotRangeStart}–{hubspotRangeEnd} of {hubspotTotal}
            {isHubspotCompaniesFetching && <Loader2 className="w-3 h-3 animate-spin text-orange-500" />}
          </span>
          <div className="flex items-center gap-2">
            <span>Page {hubspotPage + 1} of {hubspotPageCount}</span>
            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs rounded-xl cursor-pointer" disabled={hubspotPage === 0 || isHubspotCompaniesFetching} onClick={() => setHubspotPage((p) => Math.max(0, p - 1))}>
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs rounded-xl cursor-pointer" disabled={hubspotPage >= hubspotPageCount - 1 || isHubspotCompaniesFetching} onClick={() => setHubspotPage((p) => p + 1)}>
              Next <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      <ARCompanyEditDialog company={editingCompany} brands={hubspotBrands} isSaving={isSavingEdit} onClose={() => setEditingCompany(null)} onSave={handleSaveEdit} />
    </div>
  );
}

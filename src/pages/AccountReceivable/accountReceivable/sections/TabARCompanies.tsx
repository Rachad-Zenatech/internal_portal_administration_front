import { Building2, ChevronLeft, ChevronRight, FileText, Loader2, Mail, MapPin, Phone, Receipt, RefreshCw, Search, Users, Globe, ExternalLink } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Badge } from "../../../../components/ui/badge";
import { BrandBadges, brandColorClass } from "../../components/BrandBadges";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import type { AccountReceivableState } from "../hooks/useAccountReceivable";

export function TabARCompanies({ s }: { s: AccountReceivableState }) {
  const { setHubspotPage, isHubspotCompaniesFetching, hubspotPageCount, hubspotPage, hubspotTotal, hubspotRangeEnd, hubspotRangeStart, navigate, hubspotCompanies, syncHubspotCompaniesMutation, debouncedHubspotSearch, isHubspotCompaniesLoading, hubspotBrands, setHubspotBrand, hubspotBrand, setHubspotSearchTerm, hubspotSearchTerm, activeTab } = s;
  return (
    <>
      {activeTab === "hubspot_companies" && (
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
                <Input
                  value={hubspotSearchTerm}
                  onChange={(e) => setHubspotSearchTerm(e.target.value)}
                  placeholder="Search company, domain, industry, city..."
                  className="pl-8 h-9 text-xs bg-white dark:bg-slate-900"
                />
              </div>

              <Select
                value={hubspotBrand}
                onValueChange={(v) => {
                  setHubspotBrand(v);
                  setHubspotPage(0);
                }}
              >
                <SelectTrigger className="h-9 w-full sm:w-[210px] text-xs bg-white dark:bg-slate-900" aria-label="Filter by brand">
                  <SelectValue placeholder="All brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All brands</SelectItem>
                  {hubspotBrands.map((b) => (
                    <SelectItem key={b.brand} value={b.brand}>
                      <span className="flex items-center gap-2">
                        <span className={`inline-flex items-center rounded-full border px-2 h-[18px] text-[10px] font-semibold leading-none ${brandColorClass(b.brand)}`}>
                          {b.brand}
                        </span>
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
                <p className="text-xs">
                  {debouncedHubspotSearch
                    ? "No A/R companies found matching your search."
                    : "No A/R companies synced yet."}
                </p>
                <Button
                  size="sm"
                  onClick={() => syncHubspotCompaniesMutation.mutate()}
                  disabled={syncHubspotCompaniesMutation.isPending}
                  className="h-8 text-xs bg-orange-600 hover:bg-orange-700 text-white rounded-xl cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  <span>Sync from HubSpot CRM</span>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hubspotCompanies.map((comp) => (
                  <div
                    key={comp.hubspot_id}
                    className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-orange-400 dark:hover:border-orange-500 transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <Badge variant="outline" className="text-[10px] font-mono text-slate-500 border-slate-200 dark:border-slate-700">
                              {comp.hubspot_id}
                            </Badge>
                            {comp.industry && (
                              <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-none text-[9px] px-1.5 py-0">
                                {comp.industry}
                              </Badge>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-orange-600 transition-colors truncate">
                            {comp.name}
                          </h4>
                          <BrandBadges brand={comp.brand} className="mt-1" />
                          {comp.domain && (
                            <a
                              href={comp.website || `https://${comp.domain}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-0.5"
                            >
                              <Globe className="w-3 h-3 text-slate-400" />
                              <span className="truncate">{comp.domain}</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                            </a>
                          )}
                        </div>

                      </div>

                      <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                        {comp.contact_name && (
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{comp.contact_name}</span>
                          </div>
                        )}
                        {(comp.billing_email || comp.contact_email) && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate font-mono text-[11px]">{comp.billing_email || comp.contact_email}</span>
                          </div>
                        )}
                        {comp.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate font-mono text-[11px]">{comp.phone}</span>
                          </div>
                        )}
                        {comp.address && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{comp.address}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          navigate(
                            `/account-receivable/generate-quote?hubspotCompanyId=${encodeURIComponent(
                              comp.hubspot_id
                            )}&customerName=${encodeURIComponent(comp.name)}`
                          )
                        }
                        className="h-8 flex-1 text-xs gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 cursor-pointer font-semibold rounded-xl"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-600" />
                        <span>Generate Quote</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          navigate(
                            `/account-receivable/generate?hubspotCompanyId=${encodeURIComponent(
                              comp.hubspot_id
                            )}&customerName=${encodeURIComponent(comp.name)}`
                          )
                        }
                        className="h-8 flex-1 text-xs gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 cursor-pointer font-semibold rounded-xl"
                      >
                        <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Generate Invoice</span>
                      </Button>
                    </div>
                  </div>
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
                  <span>
                    Page {hubspotPage + 1} of {hubspotPageCount}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1 text-xs rounded-xl cursor-pointer"
                    disabled={hubspotPage === 0 || isHubspotCompaniesFetching}
                    onClick={() => setHubspotPage((p) => Math.max(0, p - 1))}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1 text-xs rounded-xl cursor-pointer"
                    disabled={hubspotPage >= hubspotPageCount - 1 || isHubspotCompaniesFetching}
                    onClick={() => setHubspotPage((p) => p + 1)}
                  >
                    Next
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
    </>
  );
}

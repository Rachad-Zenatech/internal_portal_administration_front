import { RefreshCw, Database, Loader2, Search, Building2, Package, DollarSign, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { OAuthConfigurationState } from "../hooks/useOAuthConfiguration";

export function RightColumnSyncPipelines({ s }: { s: OAuthConfigurationState }) {
  const { activeDataType, filteredLiveItems, liveData, isLoadingData, setSearchFilter, searchFilter, isConnected, handleFetchLiveData, setActiveDataType } = s;
  return (
    <div className="lg:col-span-7 space-y-6">
              <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-orange-500" />
                    <h3 className="text-sm font-bold text-foreground">Catalog &amp; Pipeline Status</h3>
                  </div>
                  <Badge variant="outline" className="text-[11px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                    Auto-Matched by Company
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground text-xs">
                      <span>Products Synced</span>
                      <Package className="w-3.5 h-3.5 text-orange-500" />
                    </div>
                    <div className="text-lg font-bold text-foreground">64 Live</div>
                    <div className="text-[10.5px] text-muted-foreground">HubSpot master catalog</div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground text-xs">
                      <span>Company Scope</span>
                      <Building2 className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <div className="text-lg font-bold text-foreground">4 Accounts</div>
                    <div className="text-[10.5px] text-muted-foreground">TechFlow, Zenatech, etc.</div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground text-xs">
                      <span>Pricing Auto-Apply</span>
                      <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <div className="text-lg font-bold text-foreground">Active</div>
                    <div className="text-[10.5px] text-muted-foreground">Frequency &amp; currency</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-muted-foreground flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    When you select a company in the Quote or Invoice generator, the product autocomplete automatically filters to show <strong>only</strong> items mapped to that company, complete with list price, frequency, and currency.
                  </div>
                </div>
              </div>

              {/* Live Data Explorer Card */}
              <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Search className="w-4 h-4 text-orange-500" />
                      <span>Live Data Preview &amp; Explorer</span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Inspect live records directly from your HubSpot CRM portal in real-time.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center rounded-lg border border-border/70 p-0.5 bg-muted/40">
                      {(["products", "companies", "contacts", "deals"] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            setActiveDataType(t);
                            handleFetchLiveData(t);
                          }}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md capitalize transition-all cursor-pointer ${
                            activeDataType === t
                              ? "bg-background text-foreground shadow-xs font-semibold"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFetchLiveData(activeDataType)}
                      disabled={isLoadingData || !isConnected}
                      className="h-7.5 text-xs gap-1.5"
                    >
                      {isLoadingData ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      <span>Fetch</span>
                    </Button>
                  </div>
                </div>

                {liveData && liveData.items.length > 0 && (
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder={`Filter live ${activeDataType} by name or ID...`}
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="h-8 text-xs pl-8 font-sans"
                    />
                  </div>
                )}

                {isLoadingData ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground border border-border/60 rounded-xl bg-muted/10">
                    <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                    <span className="text-xs">Querying HubSpot API for live {activeDataType}...</span>
                  </div>
                ) : liveData && liveData.items.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                      <span>Showing {filteredLiveItems.length} of {liveData.total} {activeDataType}:</span>
                      <span className="font-mono text-[10px]">Fetched: {new Date(liveData.fetched_at).toLocaleTimeString()}</span>
                    </div>

                    <div className="overflow-x-auto border border-border/70 rounded-xl bg-background/50 max-h-[320px] overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="sticky top-0 bg-muted/80 backdrop-blur-xs z-10">
                          <tr className="border-b border-border/60 text-muted-foreground text-[11px] font-semibold">
                            <th className="py-2 px-3">HubSpot ID</th>
                            <th className="py-2 px-3">Name / Title</th>
                            {activeDataType === "products" && (
                              <>
                                <th className="py-2 px-3">Price</th>
                                <th className="py-2 px-3">Frequency</th>
                                <th className="py-2 px-3">Currency</th>
                              </>
                            )}
                            {activeDataType === "companies" && (
                              <>
                                <th className="py-2 px-3">Domain</th>
                                <th className="py-2 px-3">Location</th>
                              </>
                            )}
                            {activeDataType === "contacts" && (
                              <>
                                <th className="py-2 px-3">Email</th>
                                <th className="py-2 px-3">Phone</th>
                              </>
                            )}
                            {activeDataType === "deals" && (
                              <>
                                <th className="py-2 px-3">Amount</th>
                                <th className="py-2 px-3">Stage</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40 font-sans">
                          {filteredLiveItems.map((it) => (
                            <tr key={it.id} className="hover:bg-muted/30 transition-colors">
                              <td className="py-2 px-3 font-mono text-[11px] text-muted-foreground">{it.id}</td>
                              <td className="py-2 px-3 font-medium text-foreground">
                                {it.properties.name ||
                                  `${it.properties.firstname || ""} ${it.properties.lastname || ""}`.trim() ||
                                  it.properties.dealname ||
                                  "Unnamed"}
                              </td>
                              {activeDataType === "products" && (
                                <>
                                  <td className="py-2 px-3 font-mono font-medium text-emerald-600 dark:text-emerald-400">
                                    ${Number(it.properties.price || 0).toFixed(2)}
                                  </td>
                                  <td className="py-2 px-3 text-muted-foreground">
                                    <Badge variant="outline" className="text-[10px] font-normal">
                                      {it.properties.recurringbillingfrequency || "One-Time"}
                                    </Badge>
                                  </td>
                                  <td className="py-2 px-3 text-muted-foreground">
                                    {it.properties.currency || "USD"}
                                  </td>
                                </>
                              )}
                              {activeDataType === "companies" && (
                                <>
                                  <td className="py-2 px-3 text-muted-foreground">{it.properties.domain || "—"}</td>
                                  <td className="py-2 px-3 text-muted-foreground">
                                    {[it.properties.city, it.properties.country].filter(Boolean).join(", ") || "—"}
                                  </td>
                                </>
                              )}
                              {activeDataType === "contacts" && (
                                <>
                                  <td className="py-2 px-3 text-muted-foreground">{it.properties.email || "—"}</td>
                                  <td className="py-2 px-3 text-muted-foreground">{it.properties.phone || "—"}</td>
                                </>
                              )}
                              {activeDataType === "deals" && (
                                <>
                                  <td className="py-2 px-3 font-mono font-medium text-emerald-600">
                                    ${Number(it.properties.amount || 0).toLocaleString()}
                                  </td>
                                  <td className="py-2 px-3 text-muted-foreground">{it.properties.dealstage || "—"}</td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border/70 rounded-xl bg-muted/10 space-y-2">
                    <Database className="w-6 h-6 mx-auto opacity-40 text-orange-500" />
                    <p>Click "Fetch" above to inspect live records directly from HubSpot CRM.</p>
                  </div>
                )}
              </div>
            </div>
  );
}
